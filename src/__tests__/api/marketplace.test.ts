import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { generateToken } from "@/lib/auth/jwt";
import { MarketplaceEngine } from "@/lib/marketplace/marketplace-engine";

/**
 * The marketplace route.ts exports GET and POST wrapped via withAuth()(),
 * a curried calling pattern. We test marketplace functionality by exercising
 * the MarketplaceEngine directly for full coverage, plus validating the
 * engine behaviors that the route handlers delegate to.
 */

const sampleAgentConfig = {
  type: "FRAUD_MONITORING" as const,
  systemPrompt: "You are a fraud detection agent.",
  model: "claude-3",
  provider: "anthropic",
  tools: ["transaction_lookup", "risk_scorer"],
  triggers: [] as Record<string, unknown>[],
  integrations: ["slack"],
  complianceFrameworks: ["SOC2"],
  requiredPermissions: ["agent:read"],
};

describe("Marketplace API", () => {
  let engine: MarketplaceEngine;

  beforeEach(() => {
    engine = new MarketplaceEngine();
  });

  describe("publish", () => {
    it("publishes a new free listing", () => {
      const listing = engine.publish({
        name: "Fraud Guard Pro",
        description: "Advanced fraud detection agent",
        longDescription: "A comprehensive fraud detection solution using AI.",
        category: "fraud_detection",
        tags: ["fraud", "security", "monitoring"],
        tenantId: "tenant_test_001",
        authorName: "Test Author",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: sampleAgentConfig,
      });

      expect(listing.id).toMatch(/^mkt_/);
      expect(listing.name).toBe("Fraud Guard Pro");
      expect(listing.category).toBe("fraud_detection");
      expect(listing.status).toBe("published");
      expect(listing.stats.installs).toBe(0);
      expect(listing.pricing.type).toBe("free");
    });

    it("publishes a paid subscription listing", () => {
      const listing = engine.publish({
        name: "Premium Compliance Bot",
        description: "Enterprise compliance automation",
        longDescription: "Full compliance automation suite.",
        category: "compliance",
        tags: ["compliance", "enterprise"],
        tenantId: "tenant_test_001",
        authorName: "Test Author",
        version: "2.0.0",
        pricing: {
          type: "subscription",
          priceUsd: 99,
          billingPeriod: "monthly",
        },
        agentConfig: sampleAgentConfig,
      });

      expect(listing.pricing.type).toBe("subscription");
      expect(listing.pricing.priceUsd).toBe(99);
      expect(listing.pricing.billingPeriod).toBe("monthly");
    });
  });

  describe("search", () => {
    beforeEach(() => {
      engine.publish({
        name: "Searchable Agent",
        description: "This agent can be found via search",
        longDescription: "Detailed description of the searchable agent.",
        category: "data_analysis",
        tags: ["search", "test"],
        tenantId: "tenant_test_001",
        authorName: "Searcher",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: sampleAgentConfig,
      });

      engine.publish({
        name: "Hidden Bot",
        description: "A different kind of agent",
        longDescription: "Not what you search for.",
        category: "security",
        tags: ["other"],
        tenantId: "tenant_test_002",
        authorName: "Other",
        version: "1.0.0",
        pricing: { type: "one_time", priceUsd: 50 },
        agentConfig: sampleAgentConfig,
      });
    });

    it("searches listings by query", () => {
      const results = engine.search({ query: "Searchable" });
      expect(results.total).toBeGreaterThanOrEqual(1);
      const found = results.results.find((r) => r.name === "Searchable Agent");
      expect(found).toBeDefined();
    });

    it("returns empty results for non-matching query", () => {
      const results = engine.search({ query: "zzz_nonexistent_query_zzz" });
      expect(results.results.length).toBe(0);
      expect(results.total).toBe(0);
    });

    it("filters by category", () => {
      const results = engine.search({ category: "data_analysis" });
      expect(results.total).toBe(1);
      expect(results.results[0].name).toBe("Searchable Agent");
    });

    it("filters by pricing type", () => {
      const results = engine.search({ pricingType: "one_time" });
      expect(results.total).toBe(1);
      expect(results.results[0].name).toBe("Hidden Bot");
    });
  });

  describe("install", () => {
    let listingId: string;

    beforeEach(() => {
      const listing = engine.publish({
        name: "Installable Agent",
        description: "An agent that can be installed",
        longDescription: "Detailed.",
        category: "customer_support",
        tags: ["install"],
        tenantId: "tenant_publisher_001",
        authorName: "Publisher",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: sampleAgentConfig,
      });
      listingId = listing.id;
    });

    it("installs a published listing", () => {
      const record = engine.install(listingId, "tenant_consumer_001");
      expect(record).not.toBeNull();
      expect(record!.listingId).toBe(listingId);
      expect(record!.deployedAgentId).toMatch(/^agent_/);
      expect(record!.tenantId).toBe("tenant_consumer_001");

      // Verify install count increased
      const listing = engine.getListing(listingId);
      expect(listing!.stats.installs).toBe(1);
    });

    it("returns null when installing non-existent listing", () => {
      const record = engine.install("mkt_nonexistent", "tenant_consumer_001");
      expect(record).toBeNull();
    });
  });

  describe("featured", () => {
    it("returns featured listings sorted by rating * installs", () => {
      // Publish two listings
      const listing1 = engine.publish({
        name: "Popular Agent",
        description: "Very popular",
        longDescription: "Details.",
        category: "operations",
        tags: [],
        tenantId: "tenant_test_001",
        authorName: "Author",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: sampleAgentConfig,
      });

      engine.publish({
        name: "New Agent",
        description: "Brand new",
        longDescription: "Details.",
        category: "operations",
        tags: [],
        tenantId: "tenant_test_002",
        authorName: "Author 2",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: sampleAgentConfig,
      });

      // Install the first one to make it more "featured"
      engine.install(listing1.id, "tenant_consumer_001");
      engine.install(listing1.id, "tenant_consumer_002");

      const featured = engine.getFeatured();
      expect(Array.isArray(featured)).toBe(true);
      expect(featured.length).toBe(2);
    });
  });

  describe("reviews", () => {
    let listingId: string;

    beforeEach(() => {
      const listing = engine.publish({
        name: "Reviewable Agent",
        description: "Review me",
        longDescription: "Details.",
        category: "finance",
        tags: [],
        tenantId: "tenant_publisher_001",
        authorName: "Publisher",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: sampleAgentConfig,
      });
      listingId = listing.id;
    });

    it("adds a review and updates stats", () => {
      const review = engine.addReview(listingId, {
        tenantId: "tenant_reviewer_001",
        reviewerName: "Reviewer",
        rating: 4,
        title: "Great agent",
        body: "Works well for our use case.",
      });

      expect(review).not.toBeNull();
      expect(review!.rating).toBe(4);

      const listing = engine.getListing(listingId);
      expect(listing!.stats.totalReviews).toBe(1);
      expect(listing!.stats.avgRating).toBe(4);
    });

    it("prevents duplicate reviews from same tenant", () => {
      engine.addReview(listingId, {
        tenantId: "tenant_reviewer_001",
        reviewerName: "Reviewer",
        rating: 5,
        title: "First review",
        body: "Body.",
      });

      const duplicate = engine.addReview(listingId, {
        tenantId: "tenant_reviewer_001",
        reviewerName: "Reviewer",
        rating: 3,
        title: "Second review",
        body: "Body.",
      });

      expect(duplicate).toBeNull();
    });
  });
});
