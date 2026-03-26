/**
 * Workflow Replay API
 *
 * GET  /api/workflows/replay — Get timelines and snapshots
 * POST /api/workflows/replay — Start a replay
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getReplayEngine } from "@/lib/workflows/replay-engine";
import { WorkflowReplaySchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("workflows:read", async (req: NextRequest) => {
  const engine = getReplayEngine();
  const executionId = req.nextUrl.searchParams.get("executionId");
  const workflowId = req.nextUrl.searchParams.get("workflowId");

  if (executionId) {
    const timeline = engine.getTimeline(executionId);
    const snapshots = engine.getSnapshots(executionId);
    const replays = engine.getReplays(executionId);
    return apiResponse({ timeline, snapshots, replays });
  }

  const timelines = engine.listTimelines(workflowId || undefined);
  return apiResponse({ timelines });
});

export const POST = withAuth("workflows:create", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = WorkflowReplaySchema.parse(body);

    const engine = getReplayEngine();
    const result = engine.replayFrom(parsed);

    return apiResponse({ replay: result }, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError(error instanceof Error ? error.message : "Invalid request body");
  }
});
