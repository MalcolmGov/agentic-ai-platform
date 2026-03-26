import { describe, it, expect, beforeEach } from "vitest";
import { ApprovalGateManager } from "@/lib/agents/approval-gates";

describe("ApprovalGateManager", () => {
  let manager: ApprovalGateManager;

  beforeEach(() => {
    manager = new ApprovalGateManager();
  });

  describe("createGate", () => {
    it("creates a pending approval gate", () => {
      const gate = manager.createGate({
        agentId: "agent_1",
        agentName: "Fraud Agent",
        executionId: "exec_1",
        stepIndex: 2,
        action: "block_transaction",
        context: { amount: 50000 },
        tenantId: "tenant_1",
      });

      expect(gate.status).toBe("pending");
      expect(gate.agentId).toBe("agent_1");
      expect(gate.priority).toBe("medium");
      expect(gate.respondedAt).toBeNull();
    });

    it("respects custom priority", () => {
      const gate = manager.createGate({
        agentId: "a1", agentName: "A", executionId: "e1", stepIndex: 0,
        action: "act", context: {}, tenantId: "t1", priority: "critical",
      });
      expect(gate.priority).toBe("critical");
    });
  });

  describe("respondToGate", () => {
    it("approves a pending gate", () => {
      const gate = manager.createGate({
        agentId: "a1", agentName: "A", executionId: "e1", stepIndex: 0,
        action: "act", context: {}, tenantId: "t1",
      });

      const result = manager.respondToGate(gate.id, "approved", "user_1", "Looks good");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("approved");
      expect(result!.respondedBy).toBe("user_1");
      expect(result!.respondedAt).toBeGreaterThan(0);
    });

    it("rejects a pending gate", () => {
      const gate = manager.createGate({
        agentId: "a1", agentName: "A", executionId: "e1", stepIndex: 0,
        action: "act", context: {}, tenantId: "t1",
      });

      const result = manager.respondToGate(gate.id, "rejected", "user_1");
      expect(result!.status).toBe("rejected");
    });

    it("returns null for already-resolved gate", () => {
      const gate = manager.createGate({
        agentId: "a1", agentName: "A", executionId: "e1", stepIndex: 0,
        action: "act", context: {}, tenantId: "t1",
      });
      manager.respondToGate(gate.id, "approved", "user_1");
      expect(manager.respondToGate(gate.id, "rejected", "user_2")).toBeNull();
    });

    it("returns null for unknown gate", () => {
      expect(manager.respondToGate("nonexistent", "approved", "u1")).toBeNull();
    });
  });

  describe("evaluatePolicy", () => {
    it("triggers on gt rule match", () => {
      manager.setPolicy({
        id: "pol_1", agentId: "a1", tenantId: "t1",
        rules: [{ field: "amount", operator: "gt", value: 10000, description: "High value" }],
        escalationChain: [], timeoutMs: 3600000, defaultAction: "reject", enabled: true,
      });

      expect(manager.evaluatePolicy("a1", "transfer", { amount: 50000 })).toBe(true);
      expect(manager.evaluatePolicy("a1", "transfer", { amount: 5000 })).toBe(false);
    });

    it("triggers on contains rule match", () => {
      manager.setPolicy({
        id: "pol_2", agentId: "a2", tenantId: "t1",
        rules: [{ field: "country", operator: "contains", value: "IR", description: "Sanctions" }],
        escalationChain: [], timeoutMs: 3600000, defaultAction: "reject", enabled: true,
      });

      expect(manager.evaluatePolicy("a2", "check", { country: "IRAN" })).toBe(true);
      expect(manager.evaluatePolicy("a2", "check", { country: "USA" })).toBe(false);
    });

    it("returns false when policy is disabled", () => {
      manager.setPolicy({
        id: "pol_3", agentId: "a3", tenantId: "t1",
        rules: [{ field: "amount", operator: "gt", value: 0, description: "All" }],
        escalationChain: [], timeoutMs: 3600000, defaultAction: "reject", enabled: false,
      });
      expect(manager.evaluatePolicy("a3", "act", { amount: 100 })).toBe(false);
    });

    it("returns false for agents without policies", () => {
      expect(manager.evaluatePolicy("no_policy", "act", { amount: 100 })).toBe(false);
    });
  });

  describe("getGatesByStatus", () => {
    it("filters gates by tenant and status", () => {
      manager.createGate({ agentId: "a1", agentName: "A", executionId: "e1", stepIndex: 0, action: "act", context: {}, tenantId: "t1" });
      manager.createGate({ agentId: "a1", agentName: "A", executionId: "e2", stepIndex: 0, action: "act", context: {}, tenantId: "t2" });

      expect(manager.getGatesByStatus("t1")).toHaveLength(1);
      expect(manager.getGatesByStatus("t1", "pending")).toHaveLength(1);
      expect(manager.getGatesByStatus("t1", "approved")).toHaveLength(0);
    });
  });
});
