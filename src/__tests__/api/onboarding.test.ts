import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/onboarding/route";
import { NextRequest } from "next/server";
import { getOnboardingEngine } from "@/lib/onboarding/onboarding-engine";
import { OnboardingEngine } from "@/lib/onboarding/onboarding-engine";

function makePostRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/onboarding", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("Onboarding API", () => {
  describe("POST /api/onboarding - signup", () => {
    it("creates a new tenant via signup", async () => {
      const response = await POST(
        makePostRequest({
          action: "signup",
          companyName: "Onboard Inc",
          ownerEmail: `onboard_${Date.now()}@test.com`,
          plan: "professional",
          password: "securepass123",
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.tenant).toBeDefined();
      expect(body.data.tenant.name).toBe("Onboard Inc");
      expect(body.data.tenant.plan).toBe("professional");
      expect(body.data.tenant.status).toBe("trial");
      expect(body.data.apiKey).toBeTruthy();
      expect(body.data.tenant.onboarding.completedSteps).toContain("account_created");
    });

    it("creates a starter tenant with active status", async () => {
      const response = await POST(
        makePostRequest({
          action: "signup",
          companyName: "Starter Corp",
          ownerEmail: `starter_${Date.now()}@test.com`,
          plan: "starter",
          password: "securepass123",
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.tenant.plan).toBe("starter");
      expect(body.data.tenant.status).toBe("active");
    });

    it("rejects signup with invalid email", async () => {
      const response = await POST(
        makePostRequest({
          action: "signup",
          companyName: "Bad Email Corp",
          ownerEmail: "not-valid",
          plan: "starter",
          password: "securepass123",
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("rejects signup with short password", async () => {
      const response = await POST(
        makePostRequest({
          action: "signup",
          companyName: "Short Pass Corp",
          ownerEmail: "short@test.com",
          plan: "starter",
          password: "abc",
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe("POST /api/onboarding - generate_api_key", () => {
    let tenantId: string;

    beforeEach(async () => {
      const signupRes = await POST(
        makePostRequest({
          action: "signup",
          companyName: "KeyGen Corp",
          ownerEmail: `keygen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`,
          plan: "starter",
          password: "securepass123",
        })
      );
      const signupBody = await signupRes.json();
      tenantId = signupBody.data.tenant.id;
    });

    it("generates a new API key for a valid tenant", async () => {
      const response = await POST(
        makePostRequest(
          {
            action: "generate_api_key",
            name: "CI/CD Key",
            permissions: ["agent:read", "agent:execute"],
          },
          { "x-tenant-id": tenantId }
        )
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.key).toBeDefined();
      expect(body.data.rawKey).toMatch(/^ak_/);
      expect(body.data.key.name).toBe("CI/CD Key");
    });

    it("returns 401 without tenant context", async () => {
      const response = await POST(
        makePostRequest({
          action: "generate_api_key",
          name: "No Auth Key",
          permissions: ["agent:read"],
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe("Onboarding Engine - limits (direct)", () => {
    let engine: OnboardingEngine;
    let tenantId: string;

    beforeEach(() => {
      engine = new OnboardingEngine();
      const result = engine.signup({
        companyName: "Limits Corp",
        ownerEmail: `limits_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`,
        plan: "starter",
        password: "securepass123",
      });
      tenantId = result.tenant.id;
    });

    it("returns limit information for a resource within bounds", () => {
      const limits = engine.checkLimits(tenantId, "maxAgents", 1);

      expect(limits.allowed).toBe(true);
      expect(limits.limit).toBe(3); // starter plan
      expect(limits.usage).toBe(1);
      expect(limits.remaining).toBe(2);
    });

    it("returns not allowed when usage exceeds limit", () => {
      const limits = engine.checkLimits(tenantId, "maxAgents", 5);

      expect(limits.allowed).toBe(false);
      expect(limits.remaining).toBe(0);
    });
  });
});
