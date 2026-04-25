/**
 * Governance API — AI compliance, model cards, risk assessment, decision lineage
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getGovernanceEngine, ComplianceFramework } from "@/lib/governance/compliance-engine";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}
function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

const PostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate_model_card"),
    agentId: z.string(),
    agentName: z.string(),
    modelProvider: z.string(),
    modelName: z.string(),
    taskType: z.string(),
    agentType: z.string(),
    intendedUse: z.string(),
    performanceMetrics: z.record(z.number()).default({}),
  }),
  z.object({
    action: z.literal("record_decision"),
    executionId: z.string(),
    agentId: z.string(),
    input: z.string(),
    output: z.string(),
    reasoningChain: z.array(z.object({ step: z.number(), action: z.string(), rationale: z.string() })),
    modelUsed: z.string(),
    tokensConsumed: z.number(),
    confidenceScore: z.number(),
    humanReviewRequired: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("compliance_report"),
    framework: z.enum(["EU_AI_ACT", "SOC2", "GDPR", "PCI_DSS", "HIPAA", "SOX", "CCPA"]),
    periodDays: z.number().default(30),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "model_cards";
    const engine = getGovernanceEngine();

    if (view === "model_cards") {
      return apiResponse({ cards: engine.getModelCards(tenantId) });
    }
    if (view === "decisions") {
      const agentId = url.searchParams.get("agentId");
      return apiResponse({ decisions: engine.getDecisionLineage(tenantId, agentId || undefined) });
    }
    if (view === "reports") {
      return apiResponse({ reports: engine.getReports(tenantId) });
    }
    return apiError("Invalid view parameter", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getGovernanceEngine();

    if (body.action === "generate_model_card") {
      const card = engine.generateModelCard({ ...body, tenantId });
      return apiResponse({ card }, 201);
    }
    if (body.action === "record_decision") {
      const { action: _, ...params } = body;
      const lineage = engine.recordDecision({ ...params, tenantId });
      return apiResponse({ lineage }, 201);
    }
    if (body.action === "compliance_report") {
      const report = engine.generateComplianceReport(tenantId, body.framework as ComplianceFramework, body.periodDays);
      return apiResponse({ report });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
