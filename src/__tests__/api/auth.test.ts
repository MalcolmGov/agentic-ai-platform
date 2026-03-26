import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { generateToken, TokenPayload } from "@/lib/auth/jwt";

// ─── Helpers ─────────────────────────────────

function postRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function getRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: "GET",
    headers,
  });
}

function makeToken(overrides: Partial<TokenPayload> = {}): string {
  return generateToken({
    userId: "user_test_001",
    tenantId: "tenant_test_001",
    email: "test@acme.com",
    role: "OWNER",
    ...overrides,
  });
}

// ─── Tests ───────────────────────────────────

describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const response = await registerPOST(
      postRequest("/api/auth/register", {
        email: "newuser@example.com",
        password: "securePass123",
        name: "New User",
        organizationName: "New Corp",
        industry: "technology",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.email).toBe("newuser@example.com");
    expect(body.data.user.role).toBe("OWNER");
    expect(body.data.tenant.name).toBe("New Corp");
    expect(body.data.tenant.slug).toBe("new-corp");
    expect(body.data.tenant.plan).toBe("STARTER");
  });

  it("returns validation error for missing fields", async () => {
    const response = await registerPOST(
      postRequest("/api/auth/register", {
        email: "incomplete@example.com",
        // missing password, name, organizationName
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
    expect(body.details.length).toBeGreaterThan(0);
  });

  it("returns validation error for invalid email", async () => {
    const response = await registerPOST(
      postRequest("/api/auth/register", {
        email: "not-an-email",
        password: "securePass123",
        name: "Bad Email User",
        organizationName: "Bad Corp",
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation failed");
  });

  it("returns validation error for short password", async () => {
    const response = await registerPOST(
      postRequest("/api/auth/register", {
        email: "shortpw@example.com",
        password: "abc",
        name: "Short PW",
        organizationName: "Short Corp",
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.details.some((d: { message: string }) => d.message.includes("8 characters"))).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials and returns JWT", async () => {
    // The login route seeds a demo user: admin@acme.com / admin123456
    const response = await loginPOST(
      postRequest("/api/auth/login", {
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

  it("rejects invalid credentials", async () => {
    const response = await loginPOST(
      postRequest("/api/auth/login", {
        email: "admin@acme.com",
        password: "wrong_password",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Invalid email or password");
  });

  it("rejects non-existent user", async () => {
    const response = await loginPOST(
      postRequest("/api/auth/login", {
        email: "nobody@nowhere.com",
        password: "anything123",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Invalid email or password");
  });
});

describe("GET /api/auth/me", () => {
  it("returns user profile with valid Bearer token", async () => {
    const token = makeToken();
    const response = await meGET(
      getRequest("/api/auth/me", {
        Authorization: `Bearer ${token}`,
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe("user_test_001");
    expect(body.data.user.email).toBe("test@acme.com");
    expect(body.data.user.role).toBe("OWNER");
    expect(body.data.tenant.id).toBe("tenant_test_001");
  });

  it("returns 401 without token", async () => {
    const response = await meGET(getRequest("/api/auth/me"));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("No authentication token provided");
  });

  it("returns 401 with invalid token", async () => {
    const response = await meGET(
      getRequest("/api/auth/me", {
        Authorization: "Bearer invalid.jwt.token",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
