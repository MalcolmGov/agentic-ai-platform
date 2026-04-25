/**
 * Agent Checkpoint/Resume — Long-running agent state management
 *
 * Supports checkpointing agent state mid-execution, resuming from
 * any checkpoint, progress tracking, cost limits, and dead letter queue.
 */

// ─── Types ─────────────────────────────────

export interface AgentCheckpoint {
  id: string;
  executionId: string;
  agentId: string;
  tenantId: string;
  stepIndex: number;
  totalSteps: number;
  state: Record<string, unknown>;
  intermediateResults: unknown[];
  tokensUsed: number;
  costUsd: number;
  costLimitUsd: number | null;
  status: "running" | "paused" | "completed" | "failed" | "cost_exceeded";
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionProgress {
  executionId: string;
  agentId: string;
  percentComplete: number;
  currentStep: string;
  stepsCompleted: number;
  totalSteps: number;
  estimatedTimeRemainingMs: number | null;
  tokensUsed: number;
  costUsd: number;
}

export interface DeadLetterEntry {
  id: string;
  executionId: string;
  agentId: string;
  tenantId: string;
  error: string;
  lastCheckpointId: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
}

// ─── Checkpoint Manager ────────────────────

export class CheckpointManager {
  private checkpoints = new Map<string, AgentCheckpoint>();
  private executionCheckpoints = new Map<string, string[]>(); // executionId → checkpoint IDs
  private deadLetterQueue: DeadLetterEntry[] = [];

  /**
   * Create a new checkpoint for an execution
   */
  createCheckpoint(params: {
    executionId: string;
    agentId: string;
    tenantId: string;
    stepIndex: number;
    totalSteps: number;
    state: Record<string, unknown>;
    intermediateResults?: unknown[];
    tokensUsed?: number;
    costUsd?: number;
    costLimitUsd?: number | null;
  }): AgentCheckpoint {
    const now = Date.now();

    // Check cost limit
    const costExceeded = params.costLimitUsd != null && (params.costUsd || 0) > params.costLimitUsd;

    const checkpoint: AgentCheckpoint = {
      id: `ckpt_${now}_${Math.random().toString(36).slice(2, 8)}`,
      executionId: params.executionId,
      agentId: params.agentId,
      tenantId: params.tenantId,
      stepIndex: params.stepIndex,
      totalSteps: params.totalSteps,
      state: params.state,
      intermediateResults: params.intermediateResults || [],
      tokensUsed: params.tokensUsed || 0,
      costUsd: params.costUsd || 0,
      costLimitUsd: params.costLimitUsd ?? null,
      status: costExceeded ? "cost_exceeded" : "running",
      errorMessage: costExceeded ? `Cost limit exceeded: $${params.costUsd?.toFixed(4)} > $${params.costLimitUsd?.toFixed(4)}` : null,
      createdAt: now,
      updatedAt: now,
    };

    this.checkpoints.set(checkpoint.id, checkpoint);

    // Index by execution
    const existing = this.executionCheckpoints.get(params.executionId) || [];
    existing.push(checkpoint.id);
    this.executionCheckpoints.set(params.executionId, existing);

    return checkpoint;
  }

  /**
   * Pause an execution at its latest checkpoint
   */
  pauseExecution(executionId: string): AgentCheckpoint | null {
    const latest = this.getLatestCheckpoint(executionId);
    if (!latest) return null;

    latest.status = "paused";
    latest.updatedAt = Date.now();
    return latest;
  }

  /**
   * Resume from a specific checkpoint
   */
  resumeFromCheckpoint(checkpointId: string): AgentCheckpoint | null {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;
    if (checkpoint.status !== "paused" && checkpoint.status !== "failed") return null;

    checkpoint.status = "running";
    checkpoint.updatedAt = Date.now();
    return checkpoint;
  }

  /**
   * Mark execution as completed
   */
  completeExecution(executionId: string, finalResult?: unknown): AgentCheckpoint | null {
    const latest = this.getLatestCheckpoint(executionId);
    if (!latest) return null;

    latest.status = "completed";
    latest.stepIndex = latest.totalSteps;
    if (finalResult !== undefined) {
      latest.intermediateResults.push(finalResult);
    }
    latest.updatedAt = Date.now();
    return latest;
  }

  /**
   * Mark execution as failed
   */
  failExecution(executionId: string, error: string, maxRetries = 3): AgentCheckpoint | null {
    const latest = this.getLatestCheckpoint(executionId);
    if (!latest) return null;

    latest.status = "failed";
    latest.errorMessage = error;
    latest.updatedAt = Date.now();

    // Add to dead letter queue if max retries exceeded
    const existingDLQ = this.deadLetterQueue.find((d) => d.executionId === executionId);
    if (existingDLQ) {
      existingDLQ.retryCount++;
      if (existingDLQ.retryCount >= maxRetries) {
        existingDLQ.error = `Max retries (${maxRetries}) exceeded: ${error}`;
      }
    } else {
      this.deadLetterQueue.push({
        id: `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        executionId,
        agentId: latest.agentId,
        tenantId: latest.tenantId,
        error,
        lastCheckpointId: latest.id,
        retryCount: 1,
        maxRetries,
        createdAt: Date.now(),
      });
    }

    return latest;
  }

  /**
   * Get the latest checkpoint for an execution
   */
  getLatestCheckpoint(executionId: string): AgentCheckpoint | null {
    const ids = this.executionCheckpoints.get(executionId);
    if (!ids || ids.length === 0) return null;

    const lastId = ids[ids.length - 1];
    return this.checkpoints.get(lastId) || null;
  }

  /**
   * Get all checkpoints for an execution
   */
  getCheckpoints(executionId: string): AgentCheckpoint[] {
    const ids = this.executionCheckpoints.get(executionId) || [];
    return ids.map((id) => this.checkpoints.get(id)!).filter(Boolean);
  }

  /**
   * Get execution progress
   */
  getProgress(executionId: string): ExecutionProgress | null {
    const latest = this.getLatestCheckpoint(executionId);
    if (!latest) return null;

    const percentComplete = latest.totalSteps > 0
      ? Math.round((latest.stepIndex / latest.totalSteps) * 100)
      : 0;

    // Estimate remaining time based on average step duration
    const checkpoints = this.getCheckpoints(executionId);
    let estimatedTimeRemainingMs: number | null = null;

    if (checkpoints.length >= 2) {
      const totalElapsed = latest.updatedAt - checkpoints[0].createdAt;
      const avgStepTime = totalElapsed / latest.stepIndex;
      const remainingSteps = latest.totalSteps - latest.stepIndex;
      estimatedTimeRemainingMs = Math.round(avgStepTime * remainingSteps);
    }

    return {
      executionId,
      agentId: latest.agentId,
      percentComplete,
      currentStep: `Step ${latest.stepIndex + 1} of ${latest.totalSteps}`,
      stepsCompleted: latest.stepIndex,
      totalSteps: latest.totalSteps,
      estimatedTimeRemainingMs,
      tokensUsed: latest.tokensUsed,
      costUsd: latest.costUsd,
    };
  }

  /**
   * List active executions for a tenant
   */
  listActiveExecutions(tenantId: string): AgentCheckpoint[] {
    const active: AgentCheckpoint[] = [];

    for (const [executionId] of this.executionCheckpoints) {
      const latest = this.getLatestCheckpoint(executionId);
      if (latest && latest.tenantId === tenantId && (latest.status === "running" || latest.status === "paused")) {
        active.push(latest);
      }
    }

    return active;
  }

  /**
   * Get dead letter queue entries for a tenant
   */
  getDeadLetterQueue(tenantId: string): DeadLetterEntry[] {
    return this.deadLetterQueue.filter((d) => d.tenantId === tenantId);
  }

  /**
   * Retry a dead letter entry
   */
  retryDeadLetter(dlqId: string): { checkpoint: AgentCheckpoint | null; removed: boolean } {
    const idx = this.deadLetterQueue.findIndex((d) => d.id === dlqId);
    if (idx === -1) return { checkpoint: null, removed: false };

    const entry = this.deadLetterQueue[idx];
    if (entry.retryCount >= entry.maxRetries) {
      return { checkpoint: null, removed: false };
    }

    // Resume from last checkpoint
    const checkpoint = entry.lastCheckpointId
      ? this.resumeFromCheckpoint(entry.lastCheckpointId)
      : null;

    if (checkpoint) {
      this.deadLetterQueue.splice(idx, 1);
    }

    return { checkpoint, removed: !!checkpoint };
  }
}

// ─── Singleton ──────────────────────────────

let checkpointManager: CheckpointManager | null = null;

export function getCheckpointManager(): CheckpointManager {
  if (!checkpointManager) {
    checkpointManager = new CheckpointManager();
  }
  return checkpointManager;
}
