/**
 * Stripe Billing — Subscription management, usage metering, and webhooks
 *
 * Manages tenant subscriptions, tracks usage per execution/token,
 * handles plan upgrades/downgrades, and processes Stripe webhooks.
 */

// ─── Types ─────────────────────────────────

export type PlanId = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  limits: PlanLimits;
  features: string[];
}

export interface PlanLimits {
  maxAgents: number;
  maxExecutionsPerMonth: number;
  maxTokensPerMonth: number;
  maxStorageGB: number;
  maxApiCallsPerMonth: number;
  maxTeamMembers: number;
  ssoEnabled: boolean;
  voiceEnabled: boolean;
  marketplacePublish: boolean;
}

export interface TenantSubscription {
  tenantId: string;
  planId: PlanId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "unpaid";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  billingInterval: "monthly" | "annual";
  createdAt: number;
  updatedAt: number;
}

export interface UsageRecord {
  tenantId: string;
  metric: UsageMetric;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type UsageMetric =
  | "executions"
  | "llm_tokens"
  | "api_calls"
  | "storage_bytes"
  | "active_agents"
  | "team_members";

export interface UsageSummary {
  tenantId: string;
  periodStart: number;
  periodEnd: number;
  metrics: Record<UsageMetric, { used: number; limit: number; percentage: number }>;
  overages: Array<{ metric: UsageMetric; overage: number; costPerUnit: number; totalCost: number }>;
}

export interface Invoice {
  id: string;
  tenantId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  periodStart: number;
  periodEnd: number;
  pdfUrl: string | null;
  createdAt: number;
}

// ─── Plan Definitions ──────────────────────

export const PLANS: Record<PlanId, PlanDefinition> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceMonthly: 0,
    priceAnnual: 0,
    stripePriceIdMonthly: "price_starter_monthly",
    stripePriceIdAnnual: "price_starter_annual",
    limits: {
      maxAgents: 3,
      maxExecutionsPerMonth: 1000,
      maxTokensPerMonth: 100_000,
      maxStorageGB: 1,
      maxApiCallsPerMonth: 5_000,
      maxTeamMembers: 2,
      ssoEnabled: false,
      voiceEnabled: false,
      marketplacePublish: false,
    },
    features: [
      "3 AI agents",
      "1,000 executions/month",
      "Basic analytics",
      "Community support",
      "1 GB storage",
    ],
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professional",
    priceMonthly: 99,
    priceAnnual: 79,
    stripePriceIdMonthly: "price_pro_monthly",
    stripePriceIdAnnual: "price_pro_annual",
    limits: {
      maxAgents: 25,
      maxExecutionsPerMonth: 25_000,
      maxTokensPerMonth: 5_000_000,
      maxStorageGB: 50,
      maxApiCallsPerMonth: 100_000,
      maxTeamMembers: 15,
      ssoEnabled: false,
      voiceEnabled: false,
      marketplacePublish: true,
    },
    features: [
      "25 AI agents",
      "25,000 executions/month",
      "Advanced analytics & insights",
      "Priority email support",
      "Agent marketplace access",
      "A/B testing",
      "50 GB storage",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: 499,
    priceAnnual: 399,
    stripePriceIdMonthly: "price_enterprise_monthly",
    stripePriceIdAnnual: "price_enterprise_annual",
    limits: {
      maxAgents: Infinity,
      maxExecutionsPerMonth: Infinity,
      maxTokensPerMonth: Infinity,
      maxStorageGB: Infinity,
      maxApiCallsPerMonth: Infinity,
      maxTeamMembers: Infinity,
      ssoEnabled: true,
      voiceEnabled: true,
      marketplacePublish: true,
    },
    features: [
      "Unlimited agents & executions",
      "SSO / SAML",
      "Voice interface",
      "Private marketplace",
      "Dedicated support & SLA",
      "Custom data retention",
      "Audit-grade exports",
      "Unlimited storage",
    ],
  },
};

// ─── Overage Pricing ───────────────────────

const OVERAGE_RATES: Partial<Record<UsageMetric, number>> = {
  executions: 0.01,    // $0.01 per execution over limit
  llm_tokens: 0.00001, // $0.01 per 1K tokens over limit
  api_calls: 0.001,    // $0.001 per API call over limit
  storage_bytes: 0.05 / (1024 * 1024 * 1024), // $0.05 per GB over limit
};

// ─── Billing Manager ───────────────────────

export class BillingManager {
  private subscriptions = new Map<string, TenantSubscription>();
  private usageRecords: UsageRecord[] = [];
  private invoices: Invoice[] = [];

  /**
   * Create a new subscription for a tenant
   */
  createSubscription(
    tenantId: string,
    planId: PlanId,
    billingInterval: "monthly" | "annual" = "monthly"
  ): TenantSubscription {
    const now = Date.now();
    const periodEnd = now + (billingInterval === "annual" ? 365 : 30) * 86_400_000;

    const subscription: TenantSubscription = {
      tenantId,
      planId,
      stripeCustomerId: `cus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      stripeSubscriptionId: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: planId === "STARTER" ? "active" : "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      billingInterval,
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(tenantId, subscription);
    return subscription;
  }

  /**
   * Get a tenant's subscription
   */
  getSubscription(tenantId: string): TenantSubscription | null {
    return this.subscriptions.get(tenantId) || null;
  }

  /**
   * Change plan (upgrade or downgrade)
   */
  changePlan(tenantId: string, newPlanId: PlanId): TenantSubscription | null {
    const sub = this.subscriptions.get(tenantId);
    if (!sub) return null;

    sub.planId = newPlanId;
    sub.updatedAt = Date.now();

    // Upgrades take effect immediately; downgrades at period end
    const oldPlan = PLANS[sub.planId];
    const newPlan = PLANS[newPlanId];
    if (newPlan.priceMonthly < oldPlan.priceMonthly) {
      sub.cancelAtPeriodEnd = false; // downgrade processed
    }

    return sub;
  }

  /**
   * Cancel subscription (at period end)
   */
  cancelSubscription(tenantId: string): TenantSubscription | null {
    const sub = this.subscriptions.get(tenantId);
    if (!sub) return null;

    sub.cancelAtPeriodEnd = true;
    sub.updatedAt = Date.now();
    return sub;
  }

  /**
   * Record a usage event
   */
  trackUsage(tenantId: string, metric: UsageMetric, value: number = 1, metadata?: Record<string, unknown>): void {
    this.usageRecords.push({
      tenantId,
      metric,
      value,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Get usage summary for the current billing period
   */
  getUsageSummary(tenantId: string): UsageSummary {
    const sub = this.subscriptions.get(tenantId);
    const plan = PLANS[sub?.planId || "STARTER"];
    const periodStart = sub?.currentPeriodStart || Date.now() - 30 * 86_400_000;
    const periodEnd = sub?.currentPeriodEnd || Date.now();

    // Aggregate usage for this period
    const periodRecords = this.usageRecords.filter(
      (r) => r.tenantId === tenantId && r.timestamp >= periodStart && r.timestamp <= periodEnd
    );

    const metricTotals: Record<string, number> = {};
    for (const r of periodRecords) {
      metricTotals[r.metric] = (metricTotals[r.metric] || 0) + r.value;
    }

    const metricLimits: Record<UsageMetric, number> = {
      executions: plan.limits.maxExecutionsPerMonth,
      llm_tokens: plan.limits.maxTokensPerMonth,
      api_calls: plan.limits.maxApiCallsPerMonth,
      storage_bytes: plan.limits.maxStorageGB * 1024 * 1024 * 1024,
      active_agents: plan.limits.maxAgents,
      team_members: plan.limits.maxTeamMembers,
    };

    const metrics: Record<string, { used: number; limit: number; percentage: number }> = {};
    const overages: UsageSummary["overages"] = [];

    for (const metric of Object.keys(metricLimits) as UsageMetric[]) {
      const used = metricTotals[metric] || 0;
      const limit = metricLimits[metric];
      const percentage = limit === Infinity ? 0 : Math.round((used / limit) * 100);

      metrics[metric] = { used, limit, percentage };

      if (used > limit && limit !== Infinity) {
        const overage = used - limit;
        const rate = OVERAGE_RATES[metric] || 0;
        overages.push({ metric, overage, costPerUnit: rate, totalCost: overage * rate });
      }
    }

    return {
      tenantId,
      periodStart,
      periodEnd,
      metrics: metrics as UsageSummary["metrics"],
      overages,
    };
  }

  /**
   * Check if a tenant has exceeded a limit
   */
  checkQuota(tenantId: string, metric: UsageMetric): { allowed: boolean; remaining: number } {
    const summary = this.getUsageSummary(tenantId);
    const usage = summary.metrics[metric];
    if (!usage) return { allowed: true, remaining: Infinity };

    const remaining = Math.max(0, usage.limit - usage.used);
    // Allow overages for paid plans, hard block for free
    const sub = this.subscriptions.get(tenantId);
    const isFreePlan = !sub || sub.planId === "STARTER";

    return {
      allowed: isFreePlan ? remaining > 0 : true,
      remaining,
    };
  }

  /**
   * Get invoices for a tenant
   */
  getInvoices(tenantId: string): Invoice[] {
    return this.invoices.filter((i) => i.tenantId === tenantId);
  }

  /**
   * Process a Stripe webhook event
   */
  processWebhookEvent(event: { type: string; data: Record<string, unknown> }): { handled: boolean; action: string } {
    switch (event.type) {
      case "invoice.paid": {
        const tenantId = event.data.tenantId as string;
        const invoice: Invoice = {
          id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tenantId,
          stripeInvoiceId: (event.data.stripeInvoiceId as string) || "",
          amount: (event.data.amount as number) || 0,
          currency: "usd",
          status: "paid",
          periodStart: (event.data.periodStart as number) || Date.now(),
          periodEnd: (event.data.periodEnd as number) || Date.now(),
          pdfUrl: (event.data.pdfUrl as string) || null,
          createdAt: Date.now(),
        };
        this.invoices.push(invoice);

        // Renew subscription period
        const sub = this.subscriptions.get(tenantId);
        if (sub) {
          sub.status = "active";
          sub.currentPeriodStart = invoice.periodStart;
          sub.currentPeriodEnd = invoice.periodEnd;
          sub.updatedAt = Date.now();
        }
        return { handled: true, action: "invoice_paid" };
      }

      case "invoice.payment_failed": {
        const tenantId = event.data.tenantId as string;
        const sub = this.subscriptions.get(tenantId);
        if (sub) {
          sub.status = "past_due";
          sub.updatedAt = Date.now();
        }
        return { handled: true, action: "payment_failed" };
      }

      case "customer.subscription.deleted": {
        const tenantId = event.data.tenantId as string;
        const sub = this.subscriptions.get(tenantId);
        if (sub) {
          sub.status = "canceled";
          sub.planId = "STARTER";
          sub.updatedAt = Date.now();
        }
        return { handled: true, action: "subscription_canceled" };
      }

      default:
        return { handled: false, action: "unknown_event" };
    }
  }

  /**
   * Get all plan definitions
   */
  getPlans(): PlanDefinition[] {
    return Object.values(PLANS);
  }
}

// ─── Singleton ──────────────────────────────

let billingManager: BillingManager | null = null;

export function getBillingManager(): BillingManager {
  if (!billingManager) {
    billingManager = new BillingManager();
  }
  return billingManager;
}
