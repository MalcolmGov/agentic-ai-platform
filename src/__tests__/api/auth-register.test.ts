import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/audit/logger", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/auth/register/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  it("creates a new user and tenant", async () => {
    const req = makeRequest({
      email: "new@example.com",
      password: "securepass123",
      name: "New User",
      organizationName: "New Org",
      industry: "fintech",
    });
    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.email).toBe("new@example.com");
    expect(body.data.user.role).toBe("OWNER");
    expect(body.data.tenant.name).toBe("New Org");
    expect(body.data.tenant.slug).toBe("new-org");
    expect(body.data.tenant.plan).toBe("STARTER");
  });

  it("sets auth_token cookie", async () => {
    const req = makeRequest({
      email: "cookie@example.com",
      password: "securepass123",
      name: "Cookie User",
      organizationName: "Cookie Org",
    });
    const response = await POST(req);
    const cookie = response.cookies.get("auth_token");
    expect(cookie).toBeDefined();
    expect(cookie!.value).toBeTruthy();
  });

  it("returns 400 for missing required fields", async () => {
    const req = makeRequest({ email: "test@example.com" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "short",
      name: "Test",
      organizationName: "Org",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const req = makeRequest({
      email: "not-email",
      password: "securepass123",
      name: "Test",
      organizationName: "Org",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
