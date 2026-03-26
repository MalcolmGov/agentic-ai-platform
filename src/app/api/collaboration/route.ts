/**
 * Collaboration API
 *
 * GET  /api/collaboration — Get active users and activity feed
 * POST /api/collaboration — Update presence or add annotation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getCollaborationHub } from "@/lib/collaboration/realtime-presence";
import { CollaborationSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async (_req, { user }) => {
  const hub = getCollaborationHub();
  const activeUsers = hub.getActiveUsers(user.tenantId);
  const activityFeed = hub.getActivityFeed(user.tenantId, 30);
  const stats = hub.getTeamStats(user.tenantId);

  return apiResponse({ activeUsers, activityFeed, stats });
});

export const POST = withAuth("agents:read", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = CollaborationSchema.parse(body);

    const hub = getCollaborationHub();

    if (parsed.action === "presence") {
      const presence = hub.trackPresence(user.userId, parsed.page, {
        name: user.email.split("@")[0],
        email: user.email,
        tenantId: user.tenantId,
      });
      return apiResponse({ presence });
    }

    if (parsed.action === "annotate") {
      const annotation = hub.addAnnotation({
        userId: user.userId, userName: user.email.split("@")[0],
        executionId: parsed.executionId, stepIndex: parsed.stepIndex,
        comment: parsed.comment, tenantId: user.tenantId,
      });
      return apiResponse({ annotation }, 201);
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
