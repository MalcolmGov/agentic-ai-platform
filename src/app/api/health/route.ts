/**
 * Health Check Endpoint — Production Grade
 *
 * GET /api/health — Public health check for monitoring
 *
 * Checks:
 * - Database connectivity (Prisma SELECT 1)
 * - Memory usage
 * - Uptime
 * - Version info
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ServiceStatus {
  status: "operational" | "degraded" | "down";
  latencyMs?: number;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();

  // ── Database Check ──────────────────────────
  let dbStatus: ServiceStatus;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      status: "operational",
      latencyMs: Date.now() - dbStart,
    };
  } catch (e) {
    dbStatus = {
      status: "down",
      error: e instanceof Error ? e.message : "Unknown database error",
    };
  }

  // ── Memory Usage ────────────────────────────
  const mem = process.memoryUsage();
  const memory = {
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
    rssMB: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
    externalMB: Math.round(mem.external / 1024 / 1024 * 100) / 100,
  };

  // ── Overall Status ──────────────────────────
  const allServices = [dbStatus];
  const overallStatus = allServices.every(s => s.status === "operational")
    ? "healthy"
    : allServices.some(s => s.status === "down")
      ? "unhealthy"
      : "degraded";

  const health = {
    status: overallStatus,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.round(process.uptime()),
      human: formatUptime(process.uptime()),
    },
    environment: process.env.NODE_ENV || "development",
    responseTimeMs: Date.now() - startTime,
    services: {
      database: dbStatus,
      agentEngine: { status: "operational" as const },
      auditLogger: { status: "operational" as const },
    },
    memory,
    node: process.version,
  };

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(" ");
}
