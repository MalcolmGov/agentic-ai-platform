import { describe, it, expect, beforeEach } from "vitest";
import { RateLimitEngine } from "@/lib/rate-limit/rate-limit-engine";

describe("RateLimitEngine", () => {
  let engine: RateLimitEngine;

  beforeEach(() => {
    engine = new RateLimitEngine();
  });

  describe("checkLimit", () => {
    it("allows requests within limit", () => {
      const result = engine.checkLimit("t1", "/api/agents", "professional");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.headers["X-RateLimit-Limit"]).toBeDefined();
    });

    it("uses plan-based defaults", () => {
      const starter = engine.checkLimit("t1", "/api/agents", "starter");
      expect(parseInt(starter.headers["X-RateLimit-Limit"])).toBe(30);

      const enterprise = engine.checkLimit("t2", "/api/agents", "enterprise");
      expect(parseInt(enterprise.headers["X-RateLimit-Limit"])).toBe(600);
    });

    it("throttles after exceeding limit", () => {
      // Set a very low limit for testing
      engine.setLimit({ tenantId: "t1", endpoint: "/api/test", maxRequests: 3, windowSeconds: 60, burstAllowance: 0, enabled: true });
      engine.checkLimit("t1", "/api/test");
      engine.checkLimit("t1", "/api/test");
      engine.checkLimit("t1", "/api/test");
      const fourth = engine.checkLimit("t1", "/api/test");
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
      expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("includes burst allowance", () => {
      engine.setLimit({ tenantId: "t1", endpoint: "/api/test", maxRequests: 2, windowSeconds: 60, burstAllowance: 2, enabled: true });
      for (let i = 0; i < 4; i++) engine.checkLimit("t1", "/api/test");
      const fifth = engine.checkLimit("t1", "/api/test");
      expect(fifth.allowed).toBe(false);
    });
  });

  describe("setLimit", () => {
    it("creates custom rate limit config", () => {
      const config = engine.setLimit({ tenantId: "t1", endpoint: "/api/agents", maxRequests: 100, windowSeconds: 60, burstAllowance: 20, enabled: true });
      expect(config.id).toMatch(/^rl_/);
      expect(config.maxRequests).toBe(100);
    });
  });

  describe("getUsageStats", () => {
    it("tracks request counts", () => {
      engine.checkLimit("t1", "/api/agents");
      engine.checkLimit("t1", "/api/agents");
      engine.checkLimit("t1", "/api/billing");
      const stats = engine.getUsageStats("t1");
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.lastRequestAt).not.toBeNull();
    });
  });

  describe("resetCounters", () => {
    it("clears rate limit counters", () => {
      engine.checkLimit("t1", "/api/agents");
      expect(engine.resetCounters("t1")).toBe(true);
      expect(engine.getUsageStats("t1").totalRequests).toBe(0);
    });
  });
});
