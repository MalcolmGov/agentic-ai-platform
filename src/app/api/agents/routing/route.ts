/**
 * Multi-Model Routing API
 *
 * GET  /api/agents/routing — Get routing configuration
 * POST /api/agents/routing — Update routing rules
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getModelRouter } from "@/lib/llm/multi-model-router";
import type { TaskType } from "@/lib/llm/multi-model-router";
import { AgentRoutingSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async (req: NextRequest) => {
  const router = getModelRouter();
  const taskType = req.nextUrl.searchParams.get("taskType") as TaskType | null;

  if (taskType) {
    const decision = router.routeTask(taskType);
    const comparison = router.compareCosts(taskType);
    return apiResponse({ decision, comparison });
  }

  const routes = router.getRoutes();
  const optimization = router.optimizeRoutes();

  return apiResponse({ routes, optimization });
});

export const POST = withAuth("settings:update", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = AgentRoutingSchema.parse(body);

    const router = getModelRouter();
    const route = {
      taskType: parsed.route.taskType as TaskType,
      model: parsed.route.model,
      provider: parsed.route.provider,
      costPer1kTokens: parsed.route.costPer1kTokens ?? 0,
      qualityScore: 0.8,
      avgLatencyMs: 0,
      maxTokens: parsed.route.maxTokens ?? 4096,
    };
    router.addRoute(route);

    return apiResponse({ updated: route }, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
