import { describe, it, expect, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/onboarding/route";
import { NextRequest } from "next/server";
import { generateToken } from "@/lib/auth/jwt";

function makeAuthToken() {
  return generateToken({
    userId: "user_test_001",
    tenantId: "tenant_test_001",
    email: "testuser@acme.com",
    role: "OWNER",
  });
}

function makePostRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/onboarding", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function makeGetRequest(params: Record<string, string>, token?: string) {
  const url = new URL("http://localhost:3000/api/onboarding");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new NextRequest(url.toString(), { method: "GET", headers });
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
      // Signup first to get a tenant
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

  describe("GET /api/onboarding - limits", () => {
    let tenantId: string;
    let token: string;

    beforeEach(async () => {
      // Create a tenant first
      const signupRes = await POST(
        makePostRequest({
          action: "signup",
          companyName: "Limits Corp",
          ownerEmail: `limits_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`,
          plan: "starter",
          password: "securepass123",
        })
      );
      const signupBody = await signupRes.json();
      tenantId = signupBody.data.tenant.id;

      // Generate a token for the GET endpoint (which requires auth)
      token = generateToken({
        userId: "user_test_001",
        tenantId,
        email: "test@limits.com",
        role: "OWNER",
      });
    });

    it("returns limit information for a resource", async () => {
      const response = await GET(
        makeGetRequest(
          { view: "limits", resource: "maxAgents", usage: "1" },
          token
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.limits).toBeDefined();
      expect(body.data.limits.allowed).toBe(true);
      expect(body.data.limits.limit).toBe(3); // starter plan limit
      expect(body.data.limits.usage).toBe(1);
      expect(body.data.limits.remaining).toBe(2);
    });

    it("returns not allowed when usage exceeds limit", async () => {
      const response = await GET(
        makeGetRequest(
          { view: "limits", resource: "maxAgents", usage: "5" },
          token
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.limits.allowed).toBe(false);
      expect(body.data.limits.remaining).toBe(0);
    });
  });
});
