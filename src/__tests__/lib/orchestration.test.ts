import { describe, it, expect, beforeEach } from "vitest";
import { OrchestrationEngine } from "@/lib/orchestration/orchestration-engine";

function makeNodes() {
  return [
    { id: "a", agentId: "agent_1", name: "Step A", dependsOn: [] as string[], timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
    { id: "b", agentId: "agent_2", name: "Step B", dependsOn: ["a"], timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
    { id: "c", agentId: "agent_3", name: "Step C", dependsOn: ["b"], timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
  ];
}

describe("OrchestrationEngine", () => {
  let engine: OrchestrationEngine;

  beforeEach(() => {
    engine = new OrchestrationEngine();
  });

  describe("createWorkflow", () => {
    it("creates a workflow from nodes", () => {
      const wf = engine.createWorkflow({ name: "Test Flow", description: "A→B→C", tenantId: "t1", nodes: makeNodes() });
      expect(wf.id).toMatch(/^wf_/);
      expect(wf.nodes.length).toBe(3);
      expect(wf.status).toBe("draft");
    });

    it("rejects circular dependencies", () => {
      const nodes = [
        { id: "a", agentId: "1", name: "A", dependsOn: ["b"], timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
        { id: "b", agentId: "2", name: "B", dependsOn: ["a"], timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
      ];
      expect(() => engine.createWorkflow({ name: "Bad", description: "Cycle", tenantId: "t1", nodes })).toThrow("circular");
    });
  });

  describe("startWorkflow", () => {
    it("starts root nodes", () => {
      const wf = engine.createWorkflow({ name: "Test", description: "Test", tenantId: "t1", nodes: makeNodes() });
      const started = engine.startWorkflow(wf.id);
      expect(started!.status).toBe("running");
      expect(started!.nodes[0].status).toBe("running");
      expect(started!.nodes[1].status).toBe("pending");
    });
  });

  describe("completeNode", () => {
    it("advances to downstream nodes", () => {
      const wf = engine.createWorkflow({ name: "Test", description: "Test", tenantId: "t1", nodes: makeNodes() });
      engine.startWorkflow(wf.id);
      const after = engine.completeNode(wf.id, "a", { output: { data: "ok" }, tokensUsed: 100, latencyMs: 200, costUsd: 0.01 });
      expect(after!.nodes[0].status).toBe("completed");
      expect(after!.nodes[1].status).toBe("running");
    });

    it("completes workflow when all nodes done", () => {
      const wf = engine.createWorkflow({ name: "Test", description: "Test", tenantId: "t1", nodes: makeNodes() });
      engine.startWorkflow(wf.id);
      engine.completeNode(wf.id, "a", { output: {}, tokensUsed: 50, latencyMs: 100, costUsd: 0.01 });
      engine.completeNode(wf.id, "b", { output: {}, tokensUsed: 50, latencyMs: 100, costUsd: 0.01 });
      const final = engine.completeNode(wf.id, "c", { output: {}, tokensUsed: 50, latencyMs: 100, costUsd: 0.01 });
      expect(final!.status).toBe("completed");
      expect(final!.totalTokensUsed).toBe(150);
    });

    it("fails workflow on node failure", () => {
      const wf = engine.createWorkflow({ name: "Test", description: "Test", tenantId: "t1", nodes: makeNodes() });
      engine.startWorkflow(wf.id);
      const after = engine.completeNode(wf.id, "a", { output: {}, tokensUsed: 0, latencyMs: 0, costUsd: 0, error: "API timeout" });
      expect(after!.status).toBe("failed");
    });
  });

  describe("conditional execution", () => {
    it("skips nodes when condition is not met", () => {
      const nodes = [
        { id: "a", agentId: "1", name: "Scorer", dependsOn: [] as string[], timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
        { id: "b", agentId: "2", name: "High Risk", dependsOn: ["a"],
          condition: { sourceNodeId: "a", field: "score", operator: "gte" as const, value: 80 },
          timeoutMs: 10000, retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 } },
      ];
      const wf = engine.createWorkflow({ name: "Cond", description: "Test", tenantId: "t1", nodes });
      engine.startWorkflow(wf.id);
      engine.completeNode(wf.id, "a", { output: { score: 30 }, tokensUsed: 50, latencyMs: 100, costUsd: 0.01 });
      const result = engine.getWorkflow(wf.id);
      expect(result!.nodes[1].status).toBe("skipped");
    });
  });

  describe("templates", () => {
    it("lists built-in templates", () => {
      const templates = engine.getTemplates();
      expect(templates.length).toBe(3);
    });

    it("creates workflow from template", () => {
      const wf = engine.createFromTemplate("tpl_fraud_pipeline", "t1", { screen: "a1", risk_score: "a2", compliance: "a3", alert: "a4" });
      expect(wf).not.toBeNull();
      expect(wf!.nodes.length).toBe(4);
      expect(wf!.nodes[0].agentId).toBe("a1");
    });
  });

  describe("workflow controls", () => {
    it("pauses and cancels workflows", () => {
      const wf = engine.createWorkflow({ name: "Test", description: "Test", tenantId: "t1", nodes: makeNodes() });
      engine.startWorkflow(wf.id);
      expect(engine.pauseWorkflow(wf.id)).toBe(true);
      expect(engine.getWorkflow(wf.id)!.status).toBe("paused");
      expect(engine.cancelWorkflow(wf.id)).toBe(true);
      expect(engine.getWorkflow(wf.id)!.status).toBe("cancelled");
    });
  });

  describe("getTopology", () => {
    it("returns DAG visualization data", () => {
      const wf = engine.createWorkflow({ name: "Test", description: "Test", tenantId: "t1", nodes: makeNodes() });
      const topo = engine.getTopology(wf.id);
      expect(topo!.nodes.length).toBe(3);
      expect(topo!.edges.length).toBe(2);
      expect(topo!.edges[0]).toEqual({ from: "a", to: "b", conditional: false });
    });
  });
});
