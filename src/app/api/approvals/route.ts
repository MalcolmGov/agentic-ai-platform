/**
 * Approval Gates API
 *
 * GET   /api/approvals — List pending approvals
 * POST  /api/approvals — Respond to an approval gate
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getApprovalManager } from "@/lib/agents/approval-gates";
import { ApprovalResponseSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async (req: NextRequest, { user }) => {
  const status = req.nextUrl.searchParams.get("status") as "pending" | "approved" | "rejected" | undefined;
  const manager = getApprovalManager();

  const gates = manager.getGatesByStatus(user.tenantId, status || undefined);
  const stats = manager.getStats(user.tenantId);
  const policies = manager.getPolicies(user.tenantId);

  return apiResponse({ gates, stats, policies });
});

export const POST = withAuth("agents:execute", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = ApprovalResponseSchema.parse(body);

    const manager = getApprovalManager();
    const gate = manager.respondToGate(parsed.gateId, parsed.decision, user.userId, parsed.comment);

    if (!gate) return apiError("Gate not found or already resolved", 404);

    return apiResponse({ gate });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
