import { describe, it, expect, beforeEach } from "vitest";
import { AgentCloneManager, AgentSnapshot } from "@/lib/agents/agent-cloning";

describe("AgentCloneManager", () => {
  let manager: AgentCloneManager;
  const baseConfig: AgentSnapshot = {
    name: "Test Agent",
    type: "FRAUD_MONITORING",
    llmProvider: "openai",
    llmModel: "gpt-4o",
    systemPrompt: "You are a test agent.",
    tools: ["query_database"],
    parameters: { temperature: 0.3 },
  };

  beforeEach(() => {
    manager = new AgentCloneManager();
    manager.registerAgent("agent_1", baseConfig);
  });

  describe("registerAgent", () => {
    it("stores config and creates initial version", () => {
      expect(manager.getConfig("agent_1")).toMatchObject({ name: "Test Agent" });
      expect(manager.listVersions("agent_1")).toHaveLength(1);
    });
  });

  describe("cloneAgent", () => {
    it("creates a new agent with a new name and ID", () => {
      const result = manager.cloneAgent("agent_1", "Cloned Agent", "tenant_1");
      expect(result.newName).toBe("Cloned Agent");
      expect(result.originalAgentId).toBe("agent_1");
      expect(result.newAgentId).not.toBe("agent_1");

      const clonedConfig = manager.getConfig(result.newAgentId);
      expect(clonedConfig?.name).toBe("Cloned Agent");
      expect(clonedConfig?.type).toBe("FRAUD_MONITORING");
    });

    it("throws for nonexistent agent", () => {
      expect(() => manager.cloneAgent("missing", "name", "t")).toThrow("Agent missing not found");
    });
  });

  describe("forkAgent", () => {
    it("creates a new agent with modifications", () => {
      const result = manager.forkAgent("agent_1", { llmModel: "gpt-4o-mini" }, "tenant_1");
      const forkedConfig = manager.getConfig(result.newAgentId);
      expect(forkedConfig?.llmModel).toBe("gpt-4o-mini");
      expect(forkedConfig?.name).toBe("Test Agent");
    });
  });

  describe("createVersion", () => {
    it("increments version number", () => {
      manager.createVersion("agent_1", { ...baseConfig, systemPrompt: "Updated" }, "update prompt", "user1");
      const versions = manager.listVersions("agent_1");
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(2);
    });
  });

  describe("rollback", () => {
    it("reverts to a previous version", () => {
      const v1 = manager.listVersions("agent_1")[0];
      manager.createVersion("agent_1", { ...baseConfig, systemPrompt: "v2" }, "changed", "user1");
      const rollback = manager.rollback("agent_1", v1.id);
      expect(rollback).not.toBeNull();
      expect(rollback!.changelog).toContain("Rolled back");
      expect(manager.getConfig("agent_1")?.systemPrompt).toBe("You are a test agent.");
    });

    it("returns null for unknown version", () => {
      expect(manager.rollback("agent_1", "nonexistent")).toBeNull();
    });
  });

  describe("diffVersions", () => {
    it("detects changed fields between versions", () => {
      manager.createVersion("agent_1", { ...baseConfig, llmModel: "gpt-4o-mini" }, "model change", "user1");
      const versions = manager.listVersions("agent_1");
      const diffs = manager.diffVersions(versions[1].id, versions[0].id);
      const modelDiff = diffs.find((d) => d.field === "llmModel");
      expect(modelDiff).toBeDefined();
      expect(modelDiff!.type).toBe("changed");
      expect(modelDiff!.oldValue).toBe("gpt-4o");
      expect(modelDiff!.newValue).toBe("gpt-4o-mini");
    });

    it("returns empty for unknown version IDs", () => {
      expect(manager.diffVersions("a", "b")).toEqual([]);
    });
  });

  describe("getAgentIds", () => {
    it("lists all registered agent IDs", () => {
      manager.registerAgent("agent_2", { ...baseConfig, name: "Agent 2" });
      expect(manager.getAgentIds()).toContain("agent_1");
      expect(manager.getAgentIds()).toContain("agent_2");
    });
  });
});
