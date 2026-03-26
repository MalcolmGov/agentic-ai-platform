/**
 * Workflow Replay & Time Travel Debugging
 *
 * Capture execution snapshots, replay from any point,
 * modify inputs, and compare outcomes.
 */

// ═══ Types ═══

export interface WorkflowSnapshot {
  id: string;
  workflowId: string;
  executionId: string;
  stepIndex: number;
  stepName: string;
  state: Record<string, unknown>;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  agentId?: string;
  durationMs: number;
  timestamp: number;
}

export interface ExecutionTimeline {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: "completed" | "failed" | "replayed";
  snapshots: WorkflowSnapshot[];
  totalDurationMs: number;
  startedAt: number;
  completedAt: number;
}

export interface ReplayRequest {
  executionId: string;
  fromStepIndex: number;
  modifiedInput: Record<string, unknown>;
}

export interface ReplayResult {
  originalExecutionId: string;
  replayExecutionId: string;
  fromStepIndex: number;
  modifiedInput: Record<string, unknown>;
  originalSnapshots: WorkflowSnapshot[];
  replayedSnapshots: WorkflowSnapshot[];
  differences: SnapshotDiff[];
  startedAt: number;
  completedAt: number;
}

export interface SnapshotDiff {
  stepIndex: number;
  stepName: string;
  field: string;
  originalValue: unknown;
  replayedValue: unknown;
  impactLevel: "none" | "minor" | "major" | "critical";
}

// ═══ Replay Engine ═══

export class ReplayEngine {
  private snapshots: Map<string, WorkflowSnapshot[]> = new Map();
  private timelines: Map<string, ExecutionTimeline> = new Map();
  private replays: Map<string, ReplayResult> = new Map();

  /**
   * Capture a snapshot at a workflow step
   */
  captureSnapshot(snapshot: WorkflowSnapshot): void {
    const key = snapshot.executionId;
    const existing = this.snapshots.get(key) || [];
    existing.push(snapshot);
    this.snapshots.set(key, existing);
  }

  /**
   * Get all snapshots for an execution
   */
  getSnapshots(executionId: string): WorkflowSnapshot[] {
    return (this.snapshots.get(executionId) || []).sort((a, b) => a.stepIndex - b.stepIndex);
  }

  /**
   * Get full execution timeline
   */
  getTimeline(executionId: string): ExecutionTimeline | undefined {
    return this.timelines.get(executionId);
  }

  /**
   * List all timelines for a workflow
   */
  listTimelines(workflowId?: string): ExecutionTimeline[] {
    const all = Array.from(this.timelines.values());
    if (workflowId) return all.filter((t) => t.workflowId === workflowId);
    return all.sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Register a complete execution timeline
   */
  registerTimeline(timeline: ExecutionTimeline): void {
    this.timelines.set(timeline.executionId, timeline);
    timeline.snapshots.forEach((s) => this.captureSnapshot(s));
  }

  /**
   * Replay from a specific step with modified input
   */
  replayFrom(request: ReplayRequest): ReplayResult {
    const originalSnapshots = this.getSnapshots(request.executionId);
    if (originalSnapshots.length === 0) {
      throw new Error(`No snapshots found for execution ${request.executionId}`);
    }

    const replayExecutionId = `replay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    // Simulate replayed execution (in production, this re-runs the actual workflow)
    const replayedSnapshots: WorkflowSnapshot[] = [];

    // Copy snapshots before the replay point unchanged
    originalSnapshots.forEach((snap, i) => {
      if (i < request.fromStepIndex) {
        replayedSnapshots.push({ ...snap, executionId: replayExecutionId });
      } else {
        // Simulate modified execution from the replay point
        const modified = { ...snap, executionId: replayExecutionId };
        if (i === request.fromStepIndex) {
          modified.input = { ...snap.input, ...request.modifiedInput };
        }
        // Simulate potentially different output based on modified input
        modified.output = this.simulateModifiedOutput(snap.output, request.modifiedInput, i - request.fromStepIndex);
        replayedSnapshots.push(modified);
      }
    });

    // Calculate differences
    const differences = this.calculateDiffs(originalSnapshots, replayedSnapshots, request.fromStepIndex);

    const result: ReplayResult = {
      originalExecutionId: request.executionId,
      replayExecutionId,
      fromStepIndex: request.fromStepIndex,
      modifiedInput: request.modifiedInput,
      originalSnapshots,
      replayedSnapshots,
      differences,
      startedAt: now,
      completedAt: Date.now(),
    };

    this.replays.set(replayExecutionId, result);
    return result;
  }

  /**
   * Compare two replay results
   */
  compareReplays(replayIdA: string, replayIdB: string): SnapshotDiff[] {
    const replayA = this.replays.get(replayIdA);
    const replayB = this.replays.get(replayIdB);
    if (!replayA || !replayB) return [];

    return this.calculateDiffs(replayA.replayedSnapshots, replayB.replayedSnapshots, 0);
  }

  /**
   * Get all replays for an execution
   */
  getReplays(executionId: string): ReplayResult[] {
    return Array.from(this.replays.values()).filter((r) => r.originalExecutionId === executionId);
  }

  private simulateModifiedOutput(
    originalOutput: Record<string, unknown>,
    modifications: Record<string, unknown>,
    stepsFromReplayPoint: number
  ): Record<string, unknown> {
    const modified = { ...originalOutput };

    // Simulate cascading effect of input changes
    for (const [key, value] of Object.entries(modifications)) {
      if (typeof value === "number" && typeof modified[key] === "number") {
        const ratio = value / ((originalOutput[key] as number) || 1);
        modified[key] = value;
        // Propagate effect: further steps have more divergence
        const propagation = 1 + stepsFromReplayPoint * 0.1;
        Object.keys(modified).forEach((k) => {
          if (k !== key && typeof modified[k] === "number") {
            modified[k] = Math.round(((modified[k] as number) * ratio * propagation) * 100) / 100;
          }
        });
      }
    }

    return modified;
  }

  private calculateDiffs(
    snapshotsA: WorkflowSnapshot[],
    snapshotsB: WorkflowSnapshot[],
    fromStep: number
  ): SnapshotDiff[] {
    const diffs: SnapshotDiff[] = [];
    const maxLen = Math.max(snapshotsA.length, snapshotsB.length);

    for (let i = fromStep; i < maxLen; i++) {
      const a = snapshotsA[i];
      const b = snapshotsB[i];
      if (!a || !b) continue;

      const outputA = a.output || {};
      const outputB = b.output || {};
      const allKeys = new Set([...Object.keys(outputA), ...Object.keys(outputB)]);

      allKeys.forEach((field) => {
        const valA = (outputA as Record<string, unknown>)[field];
        const valB = (outputB as Record<string, unknown>)[field];
        if (JSON.stringify(valA) !== JSON.stringify(valB)) {
          const changeMagnitude = typeof valA === "number" && typeof valB === "number"
            ? Math.abs((valB - valA) / (valA || 1))
            : 1;

          diffs.push({
            stepIndex: i,
            stepName: a.stepName,
            field,
            originalValue: valA,
            replayedValue: valB,
            impactLevel: changeMagnitude > 0.5 ? "critical" : changeMagnitude > 0.2 ? "major" : changeMagnitude > 0.05 ? "minor" : "none",
          });
        }
      });
    }

    return diffs;
  }
}

// ═══ Singleton ═══

let _engine: ReplayEngine | null = null;

export function getReplayEngine(): ReplayEngine {
  if (!_engine) {
    _engine = new ReplayEngine();
    seedDemoTimelines(_engine);
  }
  return _engine;
}

function seedDemoTimelines(engine: ReplayEngine): void {
  const now = Date.now();

  const timeline: ExecutionTimeline = {
    executionId: "exec_wf_001",
    workflowId: "wf_fraud_pipeline",
    workflowName: "Fraud Detection Pipeline",
    status: "completed",
    totalDurationMs: 12400,
    startedAt: now - 3600000,
    completedAt: now - 3600000 + 12400,
    snapshots: [
      { id: "snap_1", workflowId: "wf_fraud_pipeline", executionId: "exec_wf_001", stepIndex: 0, stepName: "Ingest Transaction", state: { phase: "ingestion" }, input: { transactionId: "txn_001", amount: 25000, currency: "USD", country: "CY" }, output: { validated: true, enriched: true, riskFlags: 2 }, durationMs: 340, timestamp: now - 3600000 },
      { id: "snap_2", workflowId: "wf_fraud_pipeline", executionId: "exec_wf_001", stepIndex: 1, stepName: "Risk Scoring", state: { phase: "analysis" }, input: { riskFlags: 2, amount: 25000 }, output: { riskScore: 0.72, riskLevel: "high", factors: ["high_value", "high_risk_country"] }, agentId: "agent_fraud_001", durationMs: 4200, timestamp: now - 3600000 + 340 },
      { id: "snap_3", workflowId: "wf_fraud_pipeline", executionId: "exec_wf_001", stepIndex: 2, stepName: "Compliance Check", state: { phase: "compliance" }, input: { riskScore: 0.72, country: "CY" }, output: { sanctionsMatch: false, pepMatch: false, kycValid: true, complianceStatus: "clear" }, agentId: "agent_compliance_001", durationMs: 5800, timestamp: now - 3600000 + 4540 },
      { id: "snap_4", workflowId: "wf_fraud_pipeline", executionId: "exec_wf_001", stepIndex: 3, stepName: "Decision & Alert", state: { phase: "decision" }, input: { riskScore: 0.72, complianceStatus: "clear" }, output: { decision: "flag_for_review", alertSent: true, assignedTo: "analyst_team" }, durationMs: 2060, timestamp: now - 3600000 + 10340 },
    ],
  };

  engine.registerTimeline(timeline);

  const timeline2: ExecutionTimeline = {
    executionId: "exec_wf_002",
    workflowId: "wf_support_routing",
    workflowName: "Support Ticket Router",
    status: "completed",
    totalDurationMs: 4800,
    startedAt: now - 7200000,
    completedAt: now - 7200000 + 4800,
    snapshots: [
      { id: "snap_5", workflowId: "wf_support_routing", executionId: "exec_wf_002", stepIndex: 0, stepName: "Classify Ticket", state: { phase: "classification" }, input: { subject: "Cannot login to account", body: "Getting error 403 when trying to access dashboard" }, output: { category: "authentication", priority: "high", sentiment: "negative" }, durationMs: 1200, timestamp: now - 7200000 },
      { id: "snap_6", workflowId: "wf_support_routing", executionId: "exec_wf_002", stepIndex: 1, stepName: "Route to Agent", state: { phase: "routing" }, input: { category: "authentication", priority: "high" }, output: { assignedAgent: "agent_support_001", queuePosition: 0, estimatedWait: "0 min" }, durationMs: 800, timestamp: now - 7200000 + 1200 },
      { id: "snap_7", workflowId: "wf_support_routing", executionId: "exec_wf_002", stepIndex: 2, stepName: "Generate Response", state: { phase: "response" }, input: { category: "authentication", context: "error 403" }, output: { response: "Please try clearing your browser cache and cookies, then log in again.", confidence: 0.87, autoResolved: true }, agentId: "agent_support_001", durationMs: 2800, timestamp: now - 7200000 + 2000 },
    ],
  };

  engine.registerTimeline(timeline2);
}
