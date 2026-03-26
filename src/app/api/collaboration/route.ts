/**
 * Collaboration API
 *
 * GET  /api/collaboration — Get active users and activity feed
 * POST /api/collaboration — Update presence or add annotation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getCollaborationHub } from "@/lib/collaboration/realtime-presence";

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
    const { action } = body;

    const hub = getCollaborationHub();

    if (action === "presence") {
      const { page } = body;
      if (!page) return apiError("page is required");
      const presence = hub.trackPresence(user.userId, page, {
        name: user.email.split("@")[0],
        email: user.email,
        tenantId: user.tenantId,
      });
      return apiResponse({ presence });
    }

    if (action === "annotate") {
      const { executionId, stepIndex, comment } = body;
      if (!executionId || stepIndex === undefined || !comment) {
        return apiError("executionId, stepIndex, and comment required");
      }
      const annotation = hub.addAnnotation({
        userId: user.userId, userName: user.email.split("@")[0],
        executionId, stepIndex, comment, tenantId: user.tenantId,
      });
      return apiResponse({ annotation }, 201);
    }

    return apiError("Invalid action. Supported: presence, annotate");
  } catch {
    return apiError("Invalid request body");
  }
});
