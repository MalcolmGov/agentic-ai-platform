/**
 * Notifications API — In-app notifications, preferences, digests
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getNotificationEngine, NotificationCategory, NotificationChannel, NotificationPriority } from "@/lib/notifications/notification-engine";
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
    action: z.literal("send"),
    recipientId: z.string(),
    category: z.enum(["agent", "drift", "billing", "team", "compliance", "system"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    title: z.string(),
    message: z.string(),
    actionUrl: z.string().optional(),
  }),
  z.object({
    action: z.literal("mark_read"),
    notificationId: z.string(),
  }),
  z.object({
    action: z.literal("mark_all_read"),
    recipientId: z.string(),
  }),
  z.object({
    action: z.literal("set_preferences"),
    memberId: z.string(),
    channels: z.record(z.array(z.enum(["in_app", "email", "slack", "webhook"]))),
    digestFrequency: z.enum(["realtime", "hourly", "daily", "weekly"]).default("daily"),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "list";
    const recipientId = url.searchParams.get("recipientId") || "default";
    const engine = getNotificationEngine();

    if (view === "list") {
      const unreadOnly = url.searchParams.get("unreadOnly") === "true";
      return apiResponse({ notifications: engine.getNotifications(tenantId, recipientId, { unreadOnly }) });
    }
    if (view === "unread_count") {
      return apiResponse({ count: engine.getUnreadCount(tenantId, recipientId) });
    }
    if (view === "digest") {
      const hours = parseInt(url.searchParams.get("hours") || "24", 10);
      return apiResponse({ digest: engine.generateDigest(tenantId, recipientId, hours) });
    }
    if (view === "preferences") {
      return apiResponse({ preferences: engine.getPreferences(tenantId, recipientId) });
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
    const engine = getNotificationEngine();

    if (body.action === "send") {
      const notification = engine.send({ tenantId, recipientId: body.recipientId, category: body.category as NotificationCategory, priority: body.priority as NotificationPriority, title: body.title, message: body.message, actionUrl: body.actionUrl });
      return apiResponse({ notification }, 201);
    }
    if (body.action === "mark_read") {
      return engine.markRead(body.notificationId) ? apiResponse({ read: true }) : apiError("Not found", 404);
    }
    if (body.action === "mark_all_read") {
      return apiResponse({ count: engine.markAllRead(tenantId, body.recipientId) });
    }
    if (body.action === "set_preferences") {
      const prefs = engine.setPreferences({ tenantId, memberId: body.memberId, channels: body.channels as Record<NotificationCategory, NotificationChannel[]>, digestFrequency: body.digestFrequency, quietHours: { enabled: false, start: "22:00", end: "08:00", timezone: "UTC" } });
      return apiResponse({ preferences: prefs });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
