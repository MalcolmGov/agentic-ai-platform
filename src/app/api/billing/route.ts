/**
 * Billing API — Subscription management, usage tracking, invoices
 *
 * GET  /api/billing — Get subscription, usage, invoices, plans
 * POST /api/billing — Create/change subscription, process webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getBillingManager, PlanId } from "@/lib/billing/stripe";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

// GET — subscription info, usage summary, invoices, plans
export const GET = withAuth("billing:read", async (req: NextRequest, { user }) => {
  const billing = getBillingManager();
  const view = req.nextUrl.searchParams.get("view");

  if (view === "plans") {
    return apiResponse({ plans: billing.getPlans() });
  }

  const subscription = billing.getSubscription(user.tenantId);
  const usage = billing.getUsageSummary(user.tenantId);
  const invoices = billing.getInvoices(user.tenantId);

  return apiResponse({ subscription, usage, invoices });
});

// Schemas
const SubscribeSchema = z.object({
  action: z.literal("subscribe"),
  planId: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  billingInterval: z.enum(["monthly", "annual"]).optional(),
});

const ChangePlanSchema = z.object({
  action: z.literal("change_plan"),
  planId: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
});

const CancelSchema = z.object({
  action: z.literal("cancel"),
});

const TrackUsageSchema = z.object({
  action: z.literal("track_usage"),
  metric: z.enum(["executions", "llm_tokens", "api_calls", "storage_bytes", "active_agents", "team_members"]),
  value: z.number().positive(),
});

const WebhookSchema = z.object({
  action: z.literal("webhook"),
  event: z.object({
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
  }),
});

const BillingActionSchema = z.discriminatedUnion("action", [
  SubscribeSchema,
  ChangePlanSchema,
  CancelSchema,
  TrackUsageSchema,
  WebhookSchema,
]);

// POST — manage subscriptions, track usage, process webhooks
export const POST = withAuth("billing:update", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = BillingActionSchema.parse(body);
    const billing = getBillingManager();

    switch (parsed.action) {
      case "subscribe": {
        const sub = billing.createSubscription(
          user.tenantId,
          parsed.planId as PlanId,
          parsed.billingInterval || "monthly"
        );
        return apiResponse({ subscription: sub }, 201);
      }

      case "change_plan": {
        const sub = billing.changePlan(user.tenantId, parsed.planId as PlanId);
        if (!sub) return apiError("No active subscription found", 404);
        return apiResponse({ subscription: sub });
      }

      case "cancel": {
        const sub = billing.cancelSubscription(user.tenantId);
        if (!sub) return apiError("No active subscription found", 404);
        return apiResponse({ subscription: sub });
      }

      case "track_usage": {
        billing.trackUsage(user.tenantId, parsed.metric, parsed.value);
        const quota = billing.checkQuota(user.tenantId, parsed.metric);
        return apiResponse({ tracked: true, metric: parsed.metric, value: parsed.value, quota });
      }

      case "webhook": {
        const result = billing.processWebhookEvent(parsed.event);
        return apiResponse({ webhook: result });
      }

      default:
        return apiError("Invalid action");
    }
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError((error as Error).message);
  }
});
