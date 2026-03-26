/**
 * Economics API — ROI calculation, cost analysis, portfolio economics
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getEconomicsEngine } from "@/lib/economics/roi-engine";
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
    action: z.literal("calculate_roi"),
    agents: z.array(z.object({
      agentId: z.string(),
      agentName: z.string(),
      agentType: z.string(),
      executions: z.number(),
      successRate: z.number(),
      avgLatencyMs: z.number(),
      totalTokens: z.number(),
      totalCostUsd: z.number(),
    })),
    periodDays: z.number().default(30),
  }),
  z.object({
    action: z.literal("benchmarks"),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const engine = getEconomicsEngine();
    const reports = engine.getReports(tenantId);
    return apiResponse({ reports });
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getEconomicsEngine();

    if (body.action === "calculate_roi") {
      const report = engine.generateROIReport(body.agents, tenantId, body.periodDays);
      return apiResponse({ report }, 201);
    }
    if (body.action === "benchmarks") {
      return apiResponse({ benchmarks: engine.getBenchmarks() });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
