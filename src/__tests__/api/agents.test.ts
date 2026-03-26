import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth to bypass JWT verification
vi.mock("@/lib/auth/jwt", () => ({
  authenticateRequest: vi.fn().mockReturnValue({
    userId: "user_test_001",
    tenantId: "tenant_test_001",
    email: "test@acme.com",
    role: "OWNER",
  }),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/audit/logger", () => ({
  auditFromRequest: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/agents/route";

function makeRequest(method: string, body?: unknown): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest("http://localhost:3000/api/agents", init);
}

describe("GET /api/agents", () => {
  it("returns list of agent types", async () => {
    const req = makeRequest("GET");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.agentTypes).toHaveLength(10);
    expect(body.data.total).toBe(10);
    expect(body.data.tenantId).toBe("tenant_test_001");
  });

  it("includes expected agent type IDs", async () => {
    const req = makeRequest("GET");
    const response = await GET(req);
    const body = await response.json();
    const ids = body.data.agentTypes.map((a: { id: string }) => a.id);
    expect(ids).toContain("FRAUD_MONITORING");
    expect(ids).toContain("COMPLIANCE");
    expect(ids).toContain("CUSTOMER_SUPPORT");
  });
});

describe("POST /api/agents", () => {
  it("creates an agent with valid data", async () => {
    const req = makeRequest("POST", {
      name: "Test Agent",
      type: "FRAUD_MONITORING",
      llmProvider: "openai",
      llmModel: "gpt-4o",
    });
    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Test Agent");
    expect(body.data.type).toBe("FRAUD_MONITORING");
    expect(body.data.status).toBe("ACTIVE");
    expect(body.data.id).toMatch(/^agent_/);
  });

  it("returns 400 for invalid agent type", async () => {
    const req = makeRequest("POST", {
      name: "Bad Agent",
      type: "NONEXISTENT_TYPE",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for missing name", async () => {
    const req = makeRequest("POST", {
      type: "FRAUD_MONITORING",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
