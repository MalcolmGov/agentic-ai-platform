/**
 * Executive Dashboard API — KPIs, ROI metrics, performance overview
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getDashboardEngine } from "@/lib/dashboard/dashboard-engine";
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
    action: z.literal("record_metrics"),
    agentId: z.string(),
    agentName: z.string(),
    agentType: z.string(),
    executions: z.number(),
    successRate: z.number(),
    avgLatencyMs: z.number(),
    costUsd: z.number(),
    savingsUsd: z.number(),
    roi: z.number(),
    trend: z.enum(["improving", "stable", "declining"]).default("stable"),
    healthStatus: z.enum(["healthy", "warning", "critical"]).default("healthy"),
  }),
  z.object({
    action: z.literal("configure"),
    periodDays: z.number().default(30),
    refreshIntervalMinutes: z.number().default(15),
    alertThresholds: z.object({
      minSuccessRate: z.number().default(0.95),
      maxLatencyMs: z.number().default(5000),
      maxCostPerDay: z.number().default(100),
      minROI: z.number().default(0),
    }).default({ minSuccessRate: 0.95, maxLatencyMs: 5000, maxCostPerDay: 100, minROI: 0 }),
  }),
  z.object({
    action: z.literal("export"),
    format: z.enum(["json", "csv"]).default("json"),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "overview";
    const periodDays = parseInt(url.searchParams.get("period") || "30", 10);
    const engine = getDashboardEngine();

    if (view === "overview") {
      return apiResponse({ dashboard: engine.getOverview(tenantId, periodDays) });
    }
    if (view === "kpis") {
      return apiResponse({ kpis: engine.getKPIs(tenantId) });
    }
    if (view === "costs") {
      return apiResponse({ costs: engine.getCostBreakdown(tenantId) });
    }
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getDashboardEngine();

    if (body.action === "record_metrics") {
      const { action: _, ...metrics } = body;
      engine.recordAgentMetrics(tenantId, metrics);
      return apiResponse({ recorded: true }, 201);
    }
    if (body.action === "configure") {
      const config = engine.configure({ tenantId, ...body });
      return apiResponse({ config });
    }
    if (body.action === "export") {
      const report = engine.exportReport(tenantId, body.format);
      return apiResponse({ report });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
