import { describe, it, expect, beforeEach } from "vitest";
import { PromptVersioningEngine } from "@/lib/prompt-versioning/prompt-versioning-engine";

describe("PromptVersioningEngine", () => {
  let engine: PromptVersioningEngine;

  beforeEach(() => {
    engine = new PromptVersioningEngine();
  });

  describe("commit", () => {
    it("creates a version with diff", () => {
      const v = engine.commit({ agentId: "a1", tenantId: "t1", content: "You are a fraud detector.", message: "Initial prompt", author: "admin" });
      expect(v.id).toMatch(/^pv_/);
      expect(v.version).toBe(1);
      expect(v.status).toBe("active");
      expect(v.diff.length).toBeGreaterThan(0);
    });

    it("increments version numbers", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      const v2 = engine.commit({ agentId: "a1", tenantId: "t1", content: "v2", message: "Second", author: "admin" });
      expect(v2.version).toBe(2);
    });

    it("marks previous version as superseded", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v2", message: "Second", author: "admin" });
      const v1 = engine.getVersion("a1", 1);
      expect(v1!.status).toBe("superseded");
    });
  });

  describe("rollback", () => {
    it("restores a previous version", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "original prompt", message: "v1", author: "admin" });
      engine.commit({ agentId: "a1", tenantId: "t1", content: "broken prompt", message: "v2", author: "admin" });
      const result = engine.rollback("a1", 1, "admin");
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.restoredVersion).toBe(1);
      const current = engine.getCurrentPrompt("a1");
      expect(current!.content).toBe("original prompt");
      expect(current!.version).toBe(3); // new version number
    });

    it("returns null for invalid version", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      expect(engine.rollback("a1", 99, "admin")).toBeNull();
    });
  });

  describe("getCurrentPrompt", () => {
    it("returns the latest version", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v2", message: "Second", author: "admin" });
      expect(engine.getCurrentPrompt("a1")!.content).toBe("v2");
    });

    it("returns null for unknown agent", () => {
      expect(engine.getCurrentPrompt("unknown")).toBeNull();
    });
  });

  describe("tag", () => {
    it("tags a version", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      expect(engine.tag("a1", 1, "production")).toBe(true);
      const v = engine.getVersion("a1", 1);
      expect(v!.tags).toContain("production");
    });

    it("moves tag to new version", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v2", message: "Second", author: "admin" });
      engine.tag("a1", 1, "production");
      engine.tag("a1", 2, "production");
      expect(engine.getVersion("a1", 1)!.tags).not.toContain("production");
      expect(engine.getVersion("a1", 2)!.tags).toContain("production");
    });
  });

  describe("branches", () => {
    it("creates a branch", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      const branch = engine.createBranch("a1", "experiment");
      expect(branch).not.toBeNull();
      expect(branch!.name).toBe("experiment");
    });

    it("prevents duplicate branch names", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.createBranch("a1", "experiment");
      expect(engine.createBranch("a1", "experiment")).toBeNull();
    });

    it("switches branches", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.createBranch("a1", "experiment");
      expect(engine.switchBranch("a1", "experiment")).toBe(true);
      expect(engine.switchBranch("a1", "nonexistent")).toBe(false);
    });
  });

  describe("compare", () => {
    it("computes diff between versions", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "line 1\nline 2", message: "v1", author: "admin" });
      engine.commit({ agentId: "a1", tenantId: "t1", content: "line 1\nline 2 modified\nline 3", message: "v2", author: "admin" });
      const result = engine.compare("a1", 1, 2);
      expect(result).not.toBeNull();
      expect(result!.diff.some((d) => d.type === "added")).toBe(true);
      expect(result!.summary).toContain("added");
    });
  });

  describe("getHistory", () => {
    it("returns full history for an agent", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v2", message: "Second", author: "admin" });
      engine.tag("a1", 1, "stable");
      const history = engine.getHistory("a1");
      expect(history!.totalVersions).toBe(2);
      expect(history!.currentVersion).toBe(2);
      expect(history!.tags["stable"]).toBe(1);
      expect(history!.branches).toContain("main");
    });
  });

  describe("listAgents", () => {
    it("lists agents with version info", () => {
      engine.commit({ agentId: "a1", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.commit({ agentId: "a2", tenantId: "t1", content: "v1", message: "First", author: "admin" });
      engine.commit({ agentId: "a3", tenantId: "t2", content: "v1", message: "First", author: "admin" });
      const agents = engine.listAgents("t1");
      expect(agents.length).toBe(2);
    });
  });
});
