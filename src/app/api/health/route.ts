/**
 * Health Check API — Public endpoints for monitoring, k8s probes, and status pages
 *
 * GET /api/health              — Full health check
 * GET /api/health?view=liveness — k8s liveness probe
 * GET /api/health?view=readiness — k8s readiness probe
 * GET /api/health?view=status   — Status page data with incidents
 * GET /api/health?view=metrics  — System metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getHealthEngine } from "@/lib/health/health-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "health";
  const engine = getHealthEngine();

  if (view === "health") {
    const check = engine.check();
    const statusCode = check.status === "unhealthy" ? 503 : 200;
    return NextResponse.json({
      status: check.status,
      version: check.version,
      timestamp: check.timestamp,
      uptime: { seconds: check.uptime, human: formatUptime(check.uptime) },
      environment: process.env.NODE_ENV || "development",
      services: check.services,
      metrics: check.metrics,
    }, { status: statusCode });
  }

  if (view === "liveness") {
    const { alive, uptime } = engine.liveness();
    return NextResponse.json({ alive, uptime });
  }

  if (view === "readiness") {
    const ready = engine.readiness();
    return NextResponse.json(ready, { status: ready.ready ? 200 : 503 });
  }

  if (view === "status") {
    return NextResponse.json({ success: true, data: engine.getStatusPage(), timestamp: new Date().toISOString() });
  }

  if (view === "metrics") {
    return NextResponse.json({ success: true, data: engine.getCurrentMetrics(), timestamp: new Date().toISOString() });
  }

  return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
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
