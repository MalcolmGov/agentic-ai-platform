import { describe, it, expect, beforeEach } from "vitest";
import { MarketplaceEngine, AgentTemplate, PricingModel } from "@/lib/marketplace/marketplace-engine";

const baseConfig: AgentTemplate = {
  type: "FRAUD_MONITORING", systemPrompt: "You monitor fraud.", model: "gpt-4o",
  provider: "openai", tools: ["query_database"], triggers: [], integrations: [],
  complianceFrameworks: ["SOC2"], requiredPermissions: ["agent:read"],
};

const basePricing: PricingModel = { type: "free", priceUsd: 0 };

function publishHelper(engine: MarketplaceEngine, overrides: Record<string, unknown> = {}) {
  return engine.publish({
    name: "Fraud Detector", description: "Detects fraud", longDescription: "Full fraud detection agent",
    category: "fraud_detection", tags: ["fraud", "finance"], tenantId: "t1",
    authorName: "Test Author", version: "1.0.0", pricing: basePricing, agentConfig: baseConfig,
    ...overrides,
  });
}

describe("MarketplaceEngine", () => {
  let engine: MarketplaceEngine;

  beforeEach(() => {
    engine = new MarketplaceEngine();
  });

  describe("publish", () => {
    it("creates a marketplace listing", () => {
      const listing = publishHelper(engine);
      expect(listing.id).toMatch(/^mkt_/);
      expect(listing.status).toBe("published");
      expect(listing.author.name).toBe("Test Author");
    });
  });

  describe("search", () => {
    it("searches by query", () => {
      publishHelper(engine);
      publishHelper(engine, { name: "Compliance Bot", description: "Checks compliance", category: "compliance", tags: ["compliance"] });
      const { results } = engine.search({ query: "fraud" });
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Fraud Detector");
    });

    it("filters by category", () => {
      publishHelper(engine);
      publishHelper(engine, { name: "Support Bot", category: "customer_support", tags: [] });
      const { results } = engine.search({ category: "fraud_detection" });
      expect(results.length).toBe(1);
    });

    it("sorts by newest", () => {
      const old = publishHelper(engine, { name: "Old Agent" });
      const newer = publishHelper(engine, { name: "New Agent" });
      // Ensure different timestamps
      (newer as unknown as Record<string, number>).createdAt = old.createdAt + 1000;
      const { results } = engine.search({ sortBy: "newest" });
      expect(results[0].name).toBe("New Agent");
    });

    it("paginates results", () => {
      for (let i = 0; i < 5; i++) publishHelper(engine, { name: `Agent ${i}` });
      const { results, total } = engine.search({ limit: 2, offset: 0 });
      expect(results.length).toBe(2);
      expect(total).toBe(5);
    });
  });

  describe("install", () => {
    it("installs a listing and increments stats", () => {
      const listing = publishHelper(engine);
      const record = engine.install(listing.id, "t2");
      expect(record).not.toBeNull();
      expect(record!.deployedAgentId).toMatch(/^agent_/);
      const updated = engine.getListing(listing.id);
      expect(updated!.stats.installs).toBe(1);
    });
  });

  describe("reviews", () => {
    it("adds a review and updates rating", () => {
      const listing = publishHelper(engine);
      const review = engine.addReview(listing.id, { tenantId: "t2", reviewerName: "Reviewer", rating: 5, title: "Great!", body: "Works well" });
      expect(review).not.toBeNull();
      const updated = engine.getListing(listing.id);
      expect(updated!.stats.avgRating).toBe(5);
      expect(updated!.stats.totalReviews).toBe(1);
    });

    it("prevents duplicate reviews from same tenant", () => {
      const listing = publishHelper(engine);
      engine.addReview(listing.id, { tenantId: "t2", reviewerName: "R", rating: 4, title: "Good", body: "OK" });
      const dup = engine.addReview(listing.id, { tenantId: "t2", reviewerName: "R", rating: 5, title: "Again", body: "Dup" });
      expect(dup).toBeNull();
    });

    it("computes average rating correctly", () => {
      const listing = publishHelper(engine);
      engine.addReview(listing.id, { tenantId: "t2", reviewerName: "A", rating: 5, title: "a", body: "a" });
      engine.addReview(listing.id, { tenantId: "t3", reviewerName: "B", rating: 3, title: "b", body: "b" });
      const updated = engine.getListing(listing.id);
      expect(updated!.stats.avgRating).toBe(4);
    });
  });

  describe("analytics", () => {
    it("returns marketplace analytics", () => {
      publishHelper(engine);
      publishHelper(engine, { name: "Compliance Bot", category: "compliance" });
      engine.install(engine.search({}).results[0].id, "t2");
      const analytics = engine.getAnalytics();
      expect(analytics.totalListings).toBe(2);
      expect(analytics.totalInstalls).toBe(1);
      expect(analytics.categories["fraud_detection"]).toBe(1);
    });
  });

  describe("author listings", () => {
    it("returns listings by author tenant", () => {
      publishHelper(engine, { tenantId: "t1" });
      publishHelper(engine, { tenantId: "t2", name: "Other Agent" });
      const mine = engine.getAuthorListings("t1");
      expect(mine.length).toBe(1);
    });
  });
});
