/**
 * Job Scheduler — Agent execution scheduling
 * 
 * Supports:
 * - Cron-based scheduling
 * - Event-driven triggers
 * - Manual execution
 * - Queue management with BullMQ
 * 
 * Development: In-memory scheduler (no Redis required)
 * Production: BullMQ + Redis
 */

// ─── Types ─────────────────────────────────

export interface ScheduledJob {
  id: string;
  agentId: string;
  tenantId: string;
  schedule: string; // cron expression or "realtime" | "manual"
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  createdAt: number;
}

export interface JobExecution {
  jobId: string;
  executionId: string;
  agentId: string;
  tenantId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt?: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
}

// ─── Cron Parser (simplified) ─────────────

function parseCronToMs(cron: string): number | null {
  const presets: Record<string, number> = {
    "every_minute":     60_000,
    "every_5_minutes":  300_000,
    "every_15_minutes": 900_000,
    "every_30_minutes": 1_800_000,
    "every_hour":       3_600_000,
    "every_6_hours":    21_600_000,
    "every_12_hours":   43_200_000,
    "daily":            86_400_000,
    "weekly":           604_800_000,
    // Standard cron shorthand
    "*/1 * * * *":      60_000,
    "*/5 * * * *":      300_000,
    "*/15 * * * *":     900_000,
    "*/30 * * * *":     1_800_000,
    "0 * * * *":        3_600_000,
    "0 */6 * * *":      21_600_000,
    "0 0 * * *":        86_400_000,
    "0 0 * * 1":        604_800_000,
  };
  return presets[cron] || null;
}

// ─── In-Memory Scheduler ──────────────────

class AgentScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private executions: Map<string, JobExecution[]> = new Map();
  private handlers: Map<string, (job: ScheduledJob) => Promise<void>> = new Map();

  /**
   * Register a handler for agent execution
   */
  onExecute(handler: (job: ScheduledJob) => Promise<void>): void {
    this.handlers.set("default", handler);
  }

  /**
   * Schedule an agent for recurring execution
   */
  schedule(
    agentId: string,
    tenantId: string,
    schedule: string,
    enabled = true
  ): ScheduledJob {
    const jobId = `job_${agentId}_${tenantId}`;

    // Cancel existing timer if any
    this.cancel(jobId);

    const job: ScheduledJob = {
      id: jobId,
      agentId,
      tenantId,
      schedule,
      enabled,
      runCount: 0,
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    if (enabled && schedule !== "manual" && schedule !== "realtime") {
      const intervalMs = parseCronToMs(schedule);
      if (intervalMs) {
        job.nextRun = Date.now() + intervalMs;
        const timer = setInterval(() => this.executeJob(jobId), intervalMs);
        this.timers.set(jobId, timer);
        console.log(`📅 Scheduled agent ${agentId} every ${intervalMs / 1000}s`);
      }
    }

    return job;
  }

  /**
   * Cancel a scheduled job
   */
  cancel(jobId: string): boolean {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(jobId);
    }
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Manually trigger a job
   */
  async trigger(agentId: string, tenantId: string): Promise<JobExecution> {
    const jobId = `job_${agentId}_${tenantId}`;
    let job = this.jobs.get(jobId);

    if (!job) {
      job = this.schedule(agentId, tenantId, "manual", true);
    }

    return this.executeJob(jobId);
  }

  /**
   * Execute a job
   */
  private async executeJob(jobId: string): Promise<JobExecution> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const execution: JobExecution = {
      jobId,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId: job.agentId,
      tenantId: job.tenantId,
      status: "running",
      startedAt: Date.now(),
    };

    // Store execution
    const execList = this.executions.get(jobId) || [];
    execList.push(execution);
    this.executions.set(jobId, execList);

    try {
      const handler = this.handlers.get("default");
      if (handler) {
        await handler(job);
      }

      execution.status = "completed";
      execution.completedAt = Date.now();
      job.lastRun = Date.now();
      job.runCount++;
      
      console.log(`✅ Job ${jobId} completed (run #${job.runCount})`);
    } catch (error) {
      execution.status = "failed";
      execution.error = (error as Error).message;
      execution.completedAt = Date.now();
      
      console.error(`❌ Job ${jobId} failed:`, (error as Error).message);
    }

    return execution;
  }

  /**
   * List all scheduled jobs
   */
  listJobs(tenantId?: string): ScheduledJob[] {
    const all = Array.from(this.jobs.values());
    return tenantId ? all.filter((j) => j.tenantId === tenantId) : all;
  }

  /**
   * Get execution history for a job
   */
  getExecutions(jobId: string, limit = 10): JobExecution[] {
    return (this.executions.get(jobId) || []).slice(-limit).reverse();
  }

  /**
   * Stop all jobs
   */
  shutdown(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    console.log("⏹️ Scheduler shutdown — all jobs stopped");
  }
}

// ─── Singleton ────────────────────────────

export const scheduler = new AgentScheduler();
