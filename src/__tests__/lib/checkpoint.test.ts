import { describe, it, expect, beforeEach } from "vitest";
import { CheckpointManager } from "@/lib/agents/checkpoint";

describe("CheckpointManager", () => {
  let mgr: CheckpointManager;

  beforeEach(() => {
    mgr = new CheckpointManager();
  });

  describe("createCheckpoint", () => {
    it("creates a checkpoint with running status", () => {
      const cp = mgr.createCheckpoint({
        executionId: "exec_1",
        agentId: "agent_1",
        tenantId: "t1",
        stepIndex: 0,
        totalSteps: 5,
        state: { input: "test" },
      });

      expect(cp.id).toMatch(/^ckpt_/);
      expect(cp.status).toBe("running");
      expect(cp.stepIndex).toBe(0);
      expect(cp.totalSteps).toBe(5);
    });

    it("detects cost limit exceeded", () => {
      const cp = mgr.createCheckpoint({
        executionId: "exec_1",
        agentId: "agent_1",
        tenantId: "t1",
        stepIndex: 3,
        totalSteps: 5,
        state: {},
        costUsd: 1.5,
        costLimitUsd: 1.0,
      });

      expect(cp.status).toBe("cost_exceeded");
      expect(cp.errorMessage).toContain("Cost limit exceeded");
    });
  });

  describe("pauseExecution", () => {
    it("pauses a running execution", () => {
      mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 2, totalSteps: 5, state: {},
      });

      const cp = mgr.pauseExecution("exec_1");
      expect(cp).not.toBeNull();
      expect(cp!.status).toBe("paused");
    });

    it("returns null for unknown execution", () => {
      expect(mgr.pauseExecution("unknown")).toBeNull();
    });
  });

  describe("resumeFromCheckpoint", () => {
    it("resumes a paused execution", () => {
      const cp = mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 2, totalSteps: 5, state: {},
      });
      mgr.pauseExecution("exec_1");

      const resumed = mgr.resumeFromCheckpoint(cp.id);
      expect(resumed).not.toBeNull();
      expect(resumed!.status).toBe("running");
    });

    it("returns null for running checkpoint (not paused)", () => {
      const cp = mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 0, totalSteps: 5, state: {},
      });
      expect(mgr.resumeFromCheckpoint(cp.id)).toBeNull();
    });
  });

  describe("completeExecution", () => {
    it("marks execution as completed", () => {
      mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 4, totalSteps: 5, state: {},
      });

      const cp = mgr.completeExecution("exec_1", { result: "done" });
      expect(cp!.status).toBe("completed");
      expect(cp!.stepIndex).toBe(5);
      expect(cp!.intermediateResults).toContainEqual({ result: "done" });
    });
  });

  describe("failExecution", () => {
    it("marks execution as failed and adds to DLQ", () => {
      mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 2, totalSteps: 5, state: {},
      });

      const cp = mgr.failExecution("exec_1", "Connection timeout");
      expect(cp!.status).toBe("failed");
      expect(cp!.errorMessage).toBe("Connection timeout");

      const dlq = mgr.getDeadLetterQueue("t1");
      expect(dlq).toHaveLength(1);
      expect(dlq[0].error).toBe("Connection timeout");
    });

    it("increments retry count on repeated failures", () => {
      mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 0, totalSteps: 5, state: {},
      });

      mgr.failExecution("exec_1", "Error 1");
      mgr.failExecution("exec_1", "Error 2");

      const dlq = mgr.getDeadLetterQueue("t1");
      expect(dlq[0].retryCount).toBe(2);
    });
  });

  describe("getProgress", () => {
    it("returns progress for an execution", () => {
      mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 2, totalSteps: 10, state: {},
        tokensUsed: 500, costUsd: 0.05,
      });

      const progress = mgr.getProgress("exec_1");
      expect(progress).not.toBeNull();
      expect(progress!.percentComplete).toBe(20);
      expect(progress!.stepsCompleted).toBe(2);
      expect(progress!.totalSteps).toBe(10);
      expect(progress!.tokensUsed).toBe(500);
    });

    it("returns null for unknown execution", () => {
      expect(mgr.getProgress("unknown")).toBeNull();
    });
  });

  describe("listActiveExecutions", () => {
    it("lists running and paused executions for a tenant", () => {
      mgr.createCheckpoint({ executionId: "e1", agentId: "a1", tenantId: "t1", stepIndex: 0, totalSteps: 5, state: {} });
      mgr.createCheckpoint({ executionId: "e2", agentId: "a2", tenantId: "t1", stepIndex: 0, totalSteps: 5, state: {} });
      mgr.createCheckpoint({ executionId: "e3", agentId: "a3", tenantId: "t2", stepIndex: 0, totalSteps: 5, state: {} });

      mgr.completeExecution("e2");

      const active = mgr.listActiveExecutions("t1");
      expect(active).toHaveLength(1); // e1 is running, e2 completed
    });
  });

  describe("retryDeadLetter", () => {
    it("retries a dead letter entry", () => {
      const cp = mgr.createCheckpoint({
        executionId: "exec_1", agentId: "a1", tenantId: "t1",
        stepIndex: 2, totalSteps: 5, state: {},
      });
      mgr.failExecution("exec_1", "Error");

      // Need to pause first to make it resumable
      mgr.pauseExecution("exec_1");

      const dlq = mgr.getDeadLetterQueue("t1");
      const result = mgr.retryDeadLetter(dlq[0].id);
      expect(result.checkpoint).not.toBeNull();
      expect(result.removed).toBe(true);
    });
  });
});
