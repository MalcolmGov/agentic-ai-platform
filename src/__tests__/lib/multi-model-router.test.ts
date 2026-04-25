import { describe, it, expect, beforeEach } from "vitest";
import { MultiModelRouter, ModelRoute } from "@/lib/llm/multi-model-router";

describe("MultiModelRouter", () => {
  let router: MultiModelRouter;

  beforeEach(() => {
    router = new MultiModelRouter();
  });

  describe("default routes", () => {
    it("loads 8 default routes for all task types", () => {
      const routes = router.getRoutes();
      expect(routes).toHaveLength(8);
      const taskTypes = routes.map((r) => r.taskType);
      expect(taskTypes).toContain("analysis");
      expect(taskTypes).toContain("writing");
      expect(taskTypes).toContain("code");
      expect(taskTypes).toContain("classification");
      expect(taskTypes).toContain("reasoning");
    });
  });

  describe("routeTask", () => {
    it("returns correct model for analysis tasks", () => {
      const decision = router.routeTask("analysis");
      expect(decision.selectedModel).toBe("gpt-4o");
      expect(decision.selectedProvider).toBe("openai");
      expect(decision.taskType).toBe("analysis");
    });

    it("returns Claude for writing tasks", () => {
      const decision = router.routeTask("writing");
      expect(decision.selectedProvider).toBe("anthropic");
    });

    it("returns Claude Opus for reasoning tasks", () => {
      const decision = router.routeTask("reasoning");
      expect(decision.selectedModel).toContain("opus");
    });

    it("falls back to gpt-4o for unknown task type", () => {
      const decision = router.routeTask("unknown_type" as never);
      expect(decision.selectedModel).toBe("gpt-4o");
      expect(decision.reason).toContain("Default");
    });
  });

  describe("addRoute / removeRoute", () => {
    it("overwrites an existing route", () => {
      router.addRoute({
        taskType: "analysis",
        model: "custom-model",
        provider: "custom",
        costPer1kTokens: 0.001,
        qualityScore: 0.99,
        avgLatencyMs: 100,
        maxTokens: 8192,
      });
      const decision = router.routeTask("analysis");
      expect(decision.selectedModel).toBe("custom-model");
    });

    it("removes a route", () => {
      expect(router.removeRoute("analysis")).toBe(true);
      const decision = router.routeTask("analysis");
      expect(decision.reason).toContain("Default");
    });
  });

  describe("estimateCost", () => {
    it("calculates cost based on tokens", () => {
      const cost = router.estimateCost("classification", 10000);
      expect(cost.estimatedCost).toBeCloseTo(0.0015, 3);
      expect(cost.model).toBe("gpt-4o-mini");
    });
  });

  describe("compareCosts", () => {
    it("returns cost comparison with recommendation", () => {
      const comparison = router.compareCosts("analysis");
      expect(comparison.models.length).toBeGreaterThan(0);
      expect(comparison.recommendation).toBeTruthy();
      comparison.models.forEach((m) => {
        expect(m.costEfficiency).toBeGreaterThan(0);
      });
    });
  });
});
