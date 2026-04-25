/**
 * Billing API — Subscription info, usage, and Stripe session creation
 *
 * GET  /api/billing — Current plan, limits, and live usage counters
 * POST /api/billing — Create Stripe Checkout or Billing Portal session
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import {
  PLAN_LIMITS,
  getSubscription,
  createCheckoutSession,
  createBillingPortalSession,
} from "@/lib/billing/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// ─── GET /api/billing ──────────────────────

export const GET = withAuth("billing:read", async (_req: NextRequest, { user }) => {
  const sub = await getSubscription(user.tenantId);
  const limits = PLAN_LIMITS[sub.plan] ?? PLAN_LIMITS.trial;

  // Attempt to read live usage from DB; fall back to zeros if DB unavailable
  let usage = { agents: 0, markets: 0, interactions: 0 };
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [agents, markets, interactions] = await Promise.all([
      prisma.agentDeployment.count({ where: { tenantId: user.tenantId, status: "active" } }),
      prisma.market.count({ where: { tenantId: user.tenantId, isActive: true } }),
      prisma.agentExecution.count({
        where: { agent: { tenantId: user.tenantId }, startedAt: { gte: startOfMonth } },
      }),
    ]);
    usage = { agents, markets, interactions };
  } catch {
    // DB unavailable — return zeros so the UI still renders
  }

  return apiResponse({
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd ?? null,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    limits: {
      maxAgents: limits.maxAgents,
      maxMarkets: limits.maxMarkets,
      maxInteractionsPerMonth: limits.maxInteractionsPerMonth,
    },
    usage,
  });
});

// ─── POST /api/billing ─────────────────────

export const POST = withAuth("billing:update", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json() as { action?: string; plan?: string };
    const { action, plan } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return apiResponse({
        checkoutUrl: null,
        portalUrl: null,
        message: "Configure STRIPE_SECRET_KEY to enable billing",
      });
    }

    if (action === "checkout") {
      const result = await createCheckoutSession(
        user.tenantId,
        plan ?? "business",
        `${APP_URL}/dashboard/settings/billing?success=true`,
        `${APP_URL}/dashboard/settings/billing?cancelled=true`
      );
      return apiResponse({ checkoutUrl: result.url, error: result.error ?? null });
    }

    if (action === "portal") {
      // Look up Stripe customer ID from the tenant's integration record if present
      let customerId = "";
      try {
        const { prisma } = await import("@/lib/db/prisma");
        const integration = await prisma.integration.findFirst({
          where: { tenantId: user.tenantId, provider: "stripe" },
        });
        if (integration?.config && typeof integration.config === "object") {
          customerId = (integration.config as Record<string, string>).customerId ?? "";
        }
      } catch {
        // DB unavailable
      }

      if (!customerId) {
        return apiResponse({
          portalUrl: null,
          message: "No Stripe billing account linked. Please subscribe first.",
        });
      }

      const result = await createBillingPortalSession(
        customerId,
        `${APP_URL}/dashboard/settings/billing`
      );
      return apiResponse({ portalUrl: result.url, error: result.error ?? null });
    }

    return apiError("Invalid action. Expected 'checkout' or 'portal'.");
  } catch (err) {
    return apiError((err as Error).message);
  }
});
