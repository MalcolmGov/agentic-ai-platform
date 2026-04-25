import { describe, it, expect, beforeEach } from "vitest";
import { OnboardingEngine } from "@/lib/onboarding/onboarding-engine";

describe("OnboardingEngine", () => {
  let engine: OnboardingEngine;

  beforeEach(() => {
    engine = new OnboardingEngine();
  });

  describe("signup", () => {
    it("creates a tenant with API key", () => {
      const { tenant, apiKey } = engine.signup({ companyName: "Acme Corp", ownerEmail: "admin@acme.com", plan: "professional", password: "secure123" });
      expect(tenant.id).toMatch(/^tenant_/);
      expect(tenant.name).toBe("Acme Corp");
      expect(tenant.slug).toBe("acme-corp");
      expect(tenant.plan).toBe("professional");
      expect(tenant.status).toBe("trial");
      expect(tenant.apiKeys.length).toBe(1);
      expect(apiKey).toMatch(/^ak_/);
    });

    it("starter plan is active immediately", () => {
      const { tenant } = engine.signup({ companyName: "Small Co", ownerEmail: "a@b.com", plan: "starter", password: "pass1234" });
      expect(tenant.status).toBe("active");
      expect(tenant.trialEndsAt).toBeNull();
    });

    it("rejects duplicate emails", () => {
      engine.signup({ companyName: "A", ownerEmail: "dup@test.com", plan: "starter", password: "pass1234" });
      expect(() => engine.signup({ companyName: "B", ownerEmail: "dup@test.com", plan: "starter", password: "pass1234" })).toThrow("already registered");
    });

    it("sets plan limits correctly", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "starter", password: "pass1234" });
      expect(tenant.limits.maxAgents).toBe(3);
      expect(tenant.limits.maxExecutionsPerMonth).toBe(1000);
    });
  });

  describe("generateApiKey", () => {
    it("generates additional API keys", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "starter", password: "pass1234" });
      const result = engine.generateApiKey(tenant.id, "CI Key", ["agent:read"]);
      expect(result).not.toBeNull();
      expect(result!.rawKey).toMatch(/^ak_/);
      expect(engine.getTenant(tenant.id)!.apiKeys.length).toBe(2);
    });
  });

  describe("revokeApiKey", () => {
    it("revokes an API key", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "starter", password: "pass1234" });
      const keyId = tenant.apiKeys[0].id;
      expect(engine.revokeApiKey(tenant.id, keyId)).toBe(true);
      expect(engine.getTenant(tenant.id)!.apiKeys[0].revoked).toBe(true);
    });
  });

  describe("onboarding progress", () => {
    it("advances through steps", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "starter", password: "pass1234" });
      const progress = engine.completeOnboardingStep(tenant.id, "first_agent_created");
      expect(progress!.completedSteps).toContain("first_agent_created");
      expect(progress!.percentComplete).toBeGreaterThan(14);
    });
  });

  describe("changePlan", () => {
    it("upgrades plan and limits", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "starter", password: "pass1234" });
      const updated = engine.changePlan(tenant.id, "enterprise");
      expect(updated!.plan).toBe("enterprise");
      expect(updated!.limits.maxAgents).toBe(-1); // unlimited
    });
  });

  describe("checkLimits", () => {
    it("enforces plan limits", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "starter", password: "pass1234" });
      const check = engine.checkLimits(tenant.id, "maxAgents", 2);
      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(1);
      const over = engine.checkLimits(tenant.id, "maxAgents", 3);
      expect(over.allowed).toBe(false);
    });
  });

  describe("quickstart", () => {
    it("returns quickstart guide", () => {
      const { tenant } = engine.signup({ companyName: "A", ownerEmail: "a@a.com", plan: "professional", password: "pass1234" });
      const guide = engine.getQuickstart(tenant.id);
      expect(guide!.steps.length).toBeGreaterThan(3);
      expect(guide!.planTier).toBe("professional");
    });
  });
});
