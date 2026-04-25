import { describe, it, expect, beforeEach } from "vitest";
import { LlmCache, ConcurrencyLimiter } from "@/lib/cache/llm-cache";

describe("LlmCache", () => {
  let cache: LlmCache;

  beforeEach(() => {
    cache = new LlmCache({ maxEntries: 100, defaultTtlMs: 60_000 });
  });

  describe("get/set", () => {
    it("caches and retrieves a response", () => {
      cache.set("Hello world", "gpt-4o", "Response text", { tokenUsage: 50, costUsd: 0.01 });
      const entry = cache.get("Hello world", "gpt-4o");
      expect(entry).not.toBeNull();
      expect(entry!.response).toBe("Response text");
      expect(entry!.tokenUsage).toBe(50);
    });

    it("returns null for cache miss", () => {
      expect(cache.get("unknown", "gpt-4o")).toBeNull();
    });

    it("differentiates by model", () => {
      cache.set("Hello", "gpt-4o", "A", {});
      cache.set("Hello", "claude-3", "B", {});
      expect(cache.get("Hello", "gpt-4o")!.response).toBe("A");
      expect(cache.get("Hello", "claude-3")!.response).toBe("B");
    });

    it("differentiates by system prompt", () => {
      cache.set("Hello", "gpt-4o", "A", { systemPrompt: "sys1" });
      cache.set("Hello", "gpt-4o", "B", { systemPrompt: "sys2" });
      expect(cache.get("Hello", "gpt-4o", "sys1")!.response).toBe("A");
      expect(cache.get("Hello", "gpt-4o", "sys2")!.response).toBe("B");
    });

    it("expires entries after TTL", () => {
      cache.set("Hello", "gpt-4o", "Response", { ttlMs: 1 }); // 1ms TTL
      // Wait for expiry
      const start = Date.now();
      while (Date.now() - start < 5) { /* spin */ }
      expect(cache.get("Hello", "gpt-4o")).toBeNull();
    });
  });

  describe("eviction", () => {
    it("evicts oldest entry when at capacity", () => {
      const small = new LlmCache({ maxEntries: 2 });
      small.set("first", "m", "r1", {});
      small.set("second", "m", "r2", {});
      small.set("third", "m", "r3", {}); // should evict "first"
      expect(small.get("first", "m")).toBeNull();
      expect(small.get("third", "m")).not.toBeNull();
    });
  });

  describe("invalidate", () => {
    it("removes specific entry", () => {
      cache.set("Hello", "gpt-4o", "Response", {});
      expect(cache.invalidate("Hello", "gpt-4o")).toBe(true);
      expect(cache.get("Hello", "gpt-4o")).toBeNull();
    });
  });

  describe("prune", () => {
    it("removes expired entries", () => {
      cache.set("old", "m", "r", { ttlMs: 1 });
      cache.set("new", "m", "r", { ttlMs: 60_000 });
      const start = Date.now();
      while (Date.now() - start < 5) { /* spin */ }
      const pruned = cache.prune();
      expect(pruned).toBe(1);
    });
  });

  describe("stats", () => {
    it("tracks hits and misses", () => {
      cache.set("Hello", "gpt-4o", "Response", { costUsd: 0.01, tokenUsage: 100 });
      cache.get("Hello", "gpt-4o"); // hit
      cache.get("Hello", "gpt-4o"); // hit
      cache.get("missing", "gpt-4o"); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3, 1);
      expect(stats.totalCostSaved).toBe(0.02);
      expect(stats.totalTokensSaved).toBe(200);
    });
  });

  describe("config", () => {
    it("can disable cache", () => {
      cache.set("Hello", "gpt-4o", "Response", {});
      cache.setConfig({ enabled: false });
      expect(cache.get("Hello", "gpt-4o")).toBeNull();
    });
  });
});

describe("ConcurrencyLimiter", () => {
  let limiter: ConcurrencyLimiter;

  beforeEach(() => {
    limiter = new ConcurrencyLimiter({ maxConcurrentPerTenant: 3, maxConcurrentGlobal: 5 });
  });

  describe("acquire/release", () => {
    it("acquires and releases slots", () => {
      expect(limiter.acquire("t1")).toBe(true);
      expect(limiter.getActive("t1")).toBe(1);
      limiter.release("t1");
      expect(limiter.getActive("t1")).toBe(0);
    });

    it("blocks when tenant limit reached", () => {
      expect(limiter.acquire("t1")).toBe(true);
      expect(limiter.acquire("t1")).toBe(true);
      expect(limiter.acquire("t1")).toBe(true);
      expect(limiter.acquire("t1")).toBe(false); // 4th request blocked
    });

    it("blocks when global limit reached", () => {
      for (let i = 0; i < 5; i++) {
        expect(limiter.acquire(`t${i}`)).toBe(true);
      }
      expect(limiter.acquire("t5")).toBe(false); // global limit
      expect(limiter.getGlobalActive()).toBe(5);
    });

    it("releases allow new acquisitions", () => {
      limiter.acquire("t1");
      limiter.acquire("t1");
      limiter.acquire("t1");
      expect(limiter.acquire("t1")).toBe(false);
      limiter.release("t1");
      expect(limiter.acquire("t1")).toBe(true);
    });
  });
});
