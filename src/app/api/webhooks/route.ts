/**
 * Webhooks API — Subscribe, dispatch, delivery logs
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getWebhookEngine, WebhookEvent } from "@/lib/webhooks/webhook-engine";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}
function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

const webhookEvents = ["agent.created", "agent.updated", "agent.deleted", "execution.started", "execution.completed", "execution.failed", "drift.detected", "drift.critical", "workflow.started", "workflow.completed", "workflow.failed", "billing.invoice", "billing.payment_failed", "compliance.report_generated", "compliance.violation"] as const;

const PostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    url: z.string().url(),
    events: z.array(z.enum(webhookEvents)),
    description: z.string().default(""),
    headers: z.record(z.string()).default({}),
  }),
  z.object({
    action: z.literal("unsubscribe"),
    subscriptionId: z.string(),
  }),
  z.object({
    action: z.literal("test"),
    subscriptionId: z.string(),
  }),
  z.object({
    action: z.literal("replay"),
    deliveryId: z.string(),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "subscriptions";
    const engine = getWebhookEngine();

    if (view === "subscriptions") {
      return apiResponse({ subscriptions: engine.getSubscriptions(tenantId) });
    }
    if (view === "deliveries") {
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      return apiResponse({ deliveries: engine.getDeliveryLogs(tenantId, limit) });
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
    const engine = getWebhookEngine();

    if (body.action === "subscribe") {
      const sub = engine.subscribe({ tenantId, url: body.url, events: body.events as WebhookEvent[], description: body.description, headers: body.headers });
      return apiResponse({ subscription: sub }, 201);
    }
    if (body.action === "unsubscribe") {
      return engine.unsubscribe(body.subscriptionId) ? apiResponse({ unsubscribed: true }) : apiError("Not found", 404);
    }
    if (body.action === "test") {
      const sub = engine.getSubscription(body.subscriptionId);
      if (!sub) return apiError("Subscription not found", 404);
      const deliveries = engine.dispatch(tenantId, "agent.created", { test: true, message: "Webhook test event" });
      return apiResponse({ deliveries });
    }
    if (body.action === "replay") {
      const delivery = engine.replay(body.deliveryId);
      return delivery ? apiResponse({ delivery }) : apiError("Delivery not found", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
