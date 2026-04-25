import { describe, it, expect, beforeAll } from "vitest";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { NextRequest } from "next/server";

function makeRegisterRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeLoginRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeMeRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers,
  });
}

describe("Auth API", () => {
  let registeredToken: string;

  describe("POST /api/auth/register", () => {
    it("registers a new user successfully", async () => {
      const response = await registerPOST(
        makeRegisterRequest({
          email: "newuser@testcorp.com",
          password: "securePassword123",
          name: "Test User",
          organizationName: "Test Corp",
          industry: "technology",
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeTruthy();
      expect(body.data.user.email).toBe("newuser@testcorp.com");
      expect(body.data.user.name).toBe("Test User");
      expect(body.data.user.role).toBe("OWNER");
      expect(body.data.tenant.name).toBe("Test Corp");
      expect(body.data.tenant.slug).toBe("test-corp");
      expect(body.data.tenant.industry).toBe("technology");
      expect(body.data.tenant.plan).toBe("STARTER");

      registeredToken = body.data.token;
    });

    it("registers without optional industry field", async () => {
      const response = await registerPOST(
        makeRegisterRequest({
          email: "another@testcorp.com",
          password: "securePassword123",
          name: "Another User",
          organizationName: "Another Corp",
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.tenant.industry).toBeNull();
    });

    it("rejects registration with missing required fields", async () => {
      const response = await registerPOST(
        makeRegisterRequest({
          email: "incomplete@test.com",
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Validation failed");
      expect(body.details).toBeDefined();
      expect(body.details.length).toBeGreaterThan(0);
    });

    it("rejects registration with invalid email format", async () => {
      const response = await registerPOST(
        makeRegisterRequest({
          email: "not-an-email",
          password: "securePassword123",
          name: "Bad Email",
          organizationName: "Corp",
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("rejects registration with short password", async () => {
      const response = await registerPOST(
        makeRegisterRequest({
          email: "short@test.com",
          password: "abc",
          name: "Short Pass",
          organizationName: "Corp",
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid demo credentials", async () => {
      const response = await loginPOST(
        makeLoginRequest({
          email: "admin@acme.com",
          password: "admin123456",
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeTruthy();
      expect(body.data.user.email).toBe("admin@acme.com");
      expect(body.data.user.role).toBe("OWNER");
      expect(body.data.tenant.id).toBe("tenant_acme_001");
    });

    it("rejects login with wrong password", async () => {
      const response = await loginPOST(
        makeLoginRequest({
          email: "admin@acme.com",
          password: "wrongpassword",
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Invalid email or password");
    });

    it("rejects login with non-existent email", async () => {
      const response = await loginPOST(
        makeLoginRequest({
          email: "nobody@nowhere.com",
          password: "somepassword",
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Invalid email or password");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns user profile with valid token", async () => {
      // First login to get a valid token
      const loginRes = await loginPOST(
        makeLoginRequest({
          email: "admin@acme.com",
          password: "admin123456",
        })
      );
      const loginBody = await loginRes.json();
      const token = loginBody.data.token;

      const response = await meGET(makeMeRequest(token));
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe("admin@acme.com");
      expect(body.data.user.role).toBe("OWNER");
      expect(body.data.tenant.id).toBe("tenant_acme_001");
    });

    it("returns 401 without token", async () => {
      const response = await meGET(makeMeRequest());
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });
});
