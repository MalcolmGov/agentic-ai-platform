import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/audit/logger", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/auth/login/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/login", () => {
  it("returns JWT for valid credentials", async () => {
    const req = makeRequest({ email: "admin@acme.com", password: "admin123456" });
    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.email).toBe("admin@acme.com");
    expect(body.data.user.role).toBe("OWNER");
    expect(body.data.tenant.id).toBeTruthy();
  });

  it("sets auth_token cookie", async () => {
    const req = makeRequest({ email: "admin@acme.com", password: "admin123456" });
    const response = await POST(req);
    const cookie = response.cookies.get("auth_token");
    expect(cookie).toBeDefined();
    expect(cookie!.value).toBeTruthy();
  });

  it("returns 401 for wrong password", async () => {
    const req = makeRequest({ email: "admin@acme.com", password: "wrongpassword" });
    const response = await POST(req);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Invalid email or password");
  });

  it("returns 401 for unknown email", async () => {
    const req = makeRequest({ email: "unknown@example.com", password: "password123" });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("returns 400 for missing email", async () => {
    const req = makeRequest({ password: "admin123456" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const req = makeRequest({ email: "not-an-email", password: "admin123456" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
