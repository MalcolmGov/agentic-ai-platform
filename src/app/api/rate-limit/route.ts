/**
 * Rate Limit API — Usage stats, limit configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getRateLimitEngine } from "@/lib/rate-limit/rate-limit-engine";
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
    action: z.literal("set_limit"),
    endpoint: z.string().default("*"),
    maxRequests: z.number(),
    windowSeconds: z.number(),
    burstAllowance: z.number().default(10),
    enabled: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("check"),
    endpoint: z.string(),
    plan: z.string().default("professional"),
  }),
  z.object({
    action: z.literal("reset"),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "usage";
    const engine = getRateLimitEngine();

    if (view === "usage") return apiResponse({ usage: engine.getUsageStats(tenantId) });
    if (view === "limits") return apiResponse({ limits: engine.getLimits(tenantId) });
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("admin")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getRateLimitEngine();

    if (body.action === "set_limit") {
      const config = engine.setLimit({ tenantId, endpoint: body.endpoint, maxRequests: body.maxRequests, windowSeconds: body.windowSeconds, burstAllowance: body.burstAllowance, enabled: body.enabled });
      return apiResponse({ config }, 201);
    }
    if (body.action === "check") {
      return apiResponse({ result: engine.checkLimit(tenantId, body.endpoint, body.plan) });
    }
    if (body.action === "reset") {
      return apiResponse({ reset: engine.resetCounters(tenantId) });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
