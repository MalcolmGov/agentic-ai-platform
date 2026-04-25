/**
 * Drift Detection API — Behavioral fingerprinting, drift monitoring, baseline management
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getDriftDetector } from "@/lib/drift/drift-detector";
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
    action: z.literal("record_sample"),
    agentId: z.string(),
    latencyMs: z.number(),
    tokenUsage: z.number(),
    confidence: z.number(),
    costUsd: z.number(),
    toolsUsed: z.array(z.string()).default([]),
    outcome: z.string().default("success"),
    reasoningSteps: z.number().default(1),
    success: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("acknowledge_drift"),
    driftId: z.string(),
  }),
  z.object({
    action: z.literal("reset_baseline"),
    agentId: z.string(),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "report";
    const agentId = url.searchParams.get("agentId");
    const detector = getDriftDetector();

    if (view === "report" && agentId) {
      return apiResponse({ report: detector.getDriftReport(agentId, tenantId) });
    }
    if (view === "fingerprint" && agentId) {
      return apiResponse({ fingerprint: detector.getFingerprint(agentId) });
    }
    if (view === "events") {
      return apiResponse({ events: detector.getDriftEvents(tenantId) });
    }
    return apiError("agentId required for report/fingerprint views", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const detector = getDriftDetector();

    if (body.action === "record_sample") {
      const { action: _, ...sampleData } = body;
      const events = detector.recordSample({ ...sampleData, tenantId, timestamp: Date.now() });
      return apiResponse({ driftEvents: events }, 201);
    }
    if (body.action === "acknowledge_drift") {
      const ok = detector.acknowledgeDrift(body.driftId);
      return ok ? apiResponse({ acknowledged: true }) : apiError("Drift event not found", 404);
    }
    if (body.action === "reset_baseline") {
      const ok = detector.resetBaseline(body.agentId);
      return ok ? apiResponse({ reset: true }) : apiError("Agent not found", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
