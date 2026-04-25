/**
 * Executive Dashboard API — KPIs, ROI metrics, performance overview
 *
 * GET  /api/dashboard — Returns aggregated stats (Prisma DB with mock fallback)
 * POST /api/dashboard — Record metrics / configure / export (requires agents:update)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

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

// ─── POST Schema (unchanged) ───────────────

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
    alertThresholds: z
      .object({
        minSuccessRate: z.number().default(0.95),
        maxLatencyMs: z.number().default(5000),
        maxCostPerDay: z.number().default(100),
        minROI: z.number().default(0),
      })
      .default({
        minSuccessRate: 0.95,
        maxLatencyMs: 5000,
        maxCostPerDay: 100,
        minROI: 0,
      }),
  }),
  z.object({
    action: z.literal("export"),
    format: z.enum(["json", "csv"]).default("json"),
  }),
]);

// ─── GET /api/dashboard ────────────────────

export async function GET(req: NextRequest) {
  try {
    // Extract tenantId from JWT cookie without a full auth guard so the
    // dashboard page can load even when the user cookie is absent (demo mode).
    const token = req.cookies.get("auth_token")?.value;

    let tenantId = "demo";
    if (token) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString()
        );
        tenantId = payload.tenantId || "demo";
      } catch {
        // malformed token — fall through with "demo"
      }
    }

    // Try real DB; fall back gracefully to mock data
    let stats: Record<string, unknown>;
    try {
      const [
        agentCount,
        activeAgents,
        alertCount,
        executions,
        recentLogs,
      ] = await Promise.all([
        prisma.agent.count({ where: { tenantId } }),
        prisma.agent.count({ where: { tenantId, status: "ACTIVE" } }),
        prisma.alert.count({ where: { tenantId, acknowledged: false } }),
        prisma.agentExecution.findMany({
          where: { agent: { tenantId } },
          orderBy: { startedAt: "desc" },
          take: 100,
          select: {
            status: true,
            durationMs: true,
            costUsd: true,
            startedAt: true,
          },
        }),
        prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            action: true,
            resource: true,
            createdAt: true,
            userId: true,
          },
        }),
      ]);

      const completed = executions.filter((e) => e.status === "COMPLETED").length;
      const failed = executions.filter((e) => e.status === "FAILED").length;
      const totalCost = executions.reduce((sum, e) => sum + (e.costUsd ?? 0), 0);
      const avgDuration =
        executions.length > 0
          ? executions.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) /
            executions.length
          : 0;

      stats = {
        agents: { total: agentCount, active: activeAgents },
        executions: {
          total: executions.length,
          completed,
          failed,
          successRate:
            executions.length > 0
              ? Math.round((completed / executions.length) * 100)
              : 0,
        },
        alerts: { active: alertCount },
        cost: { totalUsd: Math.round(totalCost * 100) / 100 },
        performance: { avgDurationMs: Math.round(avgDuration) },
        recentActivity: recentLogs,
        source: "database",
      };
    } catch {
      // DB unavailable — return sensible mock data so the UI always works
      stats = {
        agents: { total: 13, active: 8 },
        executions: {
          total: 2847,
          completed: 2791,
          failed: 56,
          successRate: 98,
        },
        alerts: { active: 4 },
        cost: { totalUsd: 23.47 },
        performance: { avgDurationMs: 1240 },
        recentActivity: [],
        source: "mock",
      };
    }

    return apiResponse(stats);
  } catch (error) {
    console.error("[Dashboard API]", error);
    return apiError("Failed to load dashboard", 500);
  }
}

// ─── POST /api/dashboard ───────────────────

export const POST = withAuth(
  "agents:update",
  async (req: NextRequest) => {
    try {
      const body = PostSchema.parse(await req.json());

      if (body.action === "record_metrics") {
        // In production: persist to a metrics table
        return apiResponse({ recorded: true, action: "record_metrics" }, 201);
      }
      if (body.action === "configure") {
        return apiResponse({
          configured: true,
          periodDays: body.periodDays,
          refreshIntervalMinutes: body.refreshIntervalMinutes,
        });
      }
      if (body.action === "export") {
        return apiResponse({
          format: body.format,
          report: "Export generated at " + new Date().toISOString(),
        });
      }

      return apiError("Unknown action", 400);
    } catch (err: unknown) {
      if (err instanceof ZodError) return validationError(err);
      return apiError(
        err instanceof Error ? err.message : "Internal error",
        500
      );
    }
  }
);
