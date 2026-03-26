import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth
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

// Mock approval manager
const mockManager = {
  getGatesByStatus: vi.fn().mockReturnValue([]),
  getStats: vi.fn().mockReturnValue({ pending: 0, approved: 0, rejected: 0 }),
  getPolicies: vi.fn().mockReturnValue([]),
  respondToGate: vi.fn(),
};

vi.mock("@/lib/agents/approval-gates", () => ({
  getApprovalManager: () => mockManager,
}));

import { GET, POST } from "@/app/api/approvals/route";

describe("GET /api/approvals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.getGatesByStatus.mockReturnValue([]);
    mockManager.getStats.mockReturnValue({ pending: 0, approved: 0, rejected: 0 });
    mockManager.getPolicies.mockReturnValue([]);
  });

  it("returns gates, stats, and policies", async () => {
    const req = new NextRequest("http://localhost:3000/api/approvals");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("gates");
    expect(body.data).toHaveProperty("stats");
    expect(body.data).toHaveProperty("policies");
  });

  it("passes status filter from query params", async () => {
    const req = new NextRequest("http://localhost:3000/api/approvals?status=pending");
    await GET(req);
    expect(mockManager.getGatesByStatus).toHaveBeenCalledWith("tenant_test_001", "pending");
  });
});

describe("POST /api/approvals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a gate", async () => {
    mockManager.respondToGate.mockReturnValue({
      id: "gate_1",
      status: "approved",
      respondedBy: "user_test_001",
    });

    const req = new NextRequest("http://localhost:3000/api/approvals", {
      method: "POST",
      body: JSON.stringify({ gateId: "gate_1", decision: "approved", comment: "LGTM" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.gate.status).toBe("approved");
  });

  it("returns 404 for nonexistent gate", async () => {
    mockManager.respondToGate.mockReturnValue(null);

    const req = new NextRequest("http://localhost:3000/api/approvals", {
      method: "POST",
      body: JSON.stringify({ gateId: "missing", decision: "rejected" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid decision", async () => {
    const req = new NextRequest("http://localhost:3000/api/approvals", {
      method: "POST",
      body: JSON.stringify({ gateId: "gate_1", decision: "maybe" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for missing gateId", async () => {
    const req = new NextRequest("http://localhost:3000/api/approvals", {
      method: "POST",
      body: JSON.stringify({ decision: "approved" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
