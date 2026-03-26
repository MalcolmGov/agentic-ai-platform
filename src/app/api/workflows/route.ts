/**
 * Secured Workflows API — Protected with RBAC
 * 
 * GET  /api/workflows — List workflows (requires workflows:read)
 * POST /api/workflows — Create workflow (requires workflows:create)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { auditFromRequest } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

const workflows = [
  { id: "wf-001", name: "Fraud Alert Pipeline", triggerType: "REALTIME", status: "ACTIVE", stepsCount: 6, executions: 12847, createdAt: "2026-01-15T08:00:00Z" },
  { id: "wf-002", name: "KYC Onboarding Flow", triggerType: "EVENT", status: "ACTIVE", stepsCount: 5, executions: 3421, createdAt: "2026-02-01T10:00:00Z" },
  { id: "wf-003", name: "Daily Financial Reconciliation", triggerType: "SCHEDULED", status: "ACTIVE", stepsCount: 4, executions: 892, createdAt: "2026-02-10T06:00:00Z" },
];

export const GET = withAuth("workflows:read", async (_req, { user }) => {
  return apiResponse({
    workflows,
    total: workflows.length,
    tenantId: user.tenantId,
  });
});

export const POST = withAuth("workflows:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { name, description, triggerType, steps } = body;

    if (!name) {
      return apiError("name is required", 400);
    }

    const workflow = {
      id: `wf-${Date.now().toString(36)}`,
      name,
      description: description || "",
      triggerType: triggerType || "MANUAL",
      status: "DRAFT",
      tenantId: user.tenantId,
      stepsCount: steps?.length || 0,
      executions: 0,
      createdAt: new Date().toISOString(),
    };

    await auditFromRequest(req, user, "workflow.create", `workflow:${workflow.id}`, { name, triggerType: workflow.triggerType });

    return apiResponse(workflow, 201);
  } catch {
    return apiError("Invalid request body", 400);
  }
});
