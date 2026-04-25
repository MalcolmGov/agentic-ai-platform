import { describe, it, expect, beforeEach } from "vitest";
import { BillingManager, PLANS } from "@/lib/billing/stripe";

describe("BillingManager", () => {
  let billing: BillingManager;

  beforeEach(() => {
    billing = new BillingManager();
  });

  describe("createSubscription", () => {
    it("creates a subscription for a tenant", () => {
      const sub = billing.createSubscription("t1", "PROFESSIONAL");
      expect(sub.tenantId).toBe("t1");
      expect(sub.planId).toBe("PROFESSIONAL");
      expect(sub.status).toBe("trialing");
      expect(sub.billingInterval).toBe("monthly");
      expect(sub.stripeCustomerId).toMatch(/^cus_/);
      expect(sub.stripeSubscriptionId).toMatch(/^sub_/);
    });

    it("starter plan is active immediately (free)", () => {
      const sub = billing.createSubscription("t1", "STARTER");
      expect(sub.status).toBe("active");
    });

    it("supports annual billing", () => {
      const sub = billing.createSubscription("t1", "ENTERPRISE", "annual");
      expect(sub.billingInterval).toBe("annual");
      const periodMs = sub.currentPeriodEnd - sub.currentPeriodStart;
      expect(periodMs).toBeGreaterThan(300 * 86_400_000); // ~365 days
    });
  });

  describe("getSubscription", () => {
    it("returns null for unknown tenant", () => {
      expect(billing.getSubscription("unknown")).toBeNull();
    });

    it("returns existing subscription", () => {
      billing.createSubscription("t1", "PROFESSIONAL");
      const sub = billing.getSubscription("t1");
      expect(sub).not.toBeNull();
      expect(sub!.planId).toBe("PROFESSIONAL");
    });
  });

  describe("changePlan", () => {
    it("upgrades plan", () => {
      billing.createSubscription("t1", "STARTER");
      const sub = billing.changePlan("t1", "ENTERPRISE");
      expect(sub).not.toBeNull();
      expect(sub!.planId).toBe("ENTERPRISE");
    });

    it("returns null for unknown tenant", () => {
      expect(billing.changePlan("unknown", "ENTERPRISE")).toBeNull();
    });
  });

  describe("cancelSubscription", () => {
    it("marks subscription for cancellation at period end", () => {
      billing.createSubscription("t1", "PROFESSIONAL");
      const sub = billing.cancelSubscription("t1");
      expect(sub!.cancelAtPeriodEnd).toBe(true);
    });

    it("returns null for unknown tenant", () => {
      expect(billing.cancelSubscription("unknown")).toBeNull();
    });
  });

  describe("usage tracking", () => {
    it("tracks usage and calculates summary", () => {
      billing.createSubscription("t1", "STARTER");
      billing.trackUsage("t1", "executions", 500);
      billing.trackUsage("t1", "executions", 300);
      billing.trackUsage("t1", "llm_tokens", 50000);

      const summary = billing.getUsageSummary("t1");
      expect(summary.metrics.executions.used).toBe(800);
      expect(summary.metrics.llm_tokens.used).toBe(50000);
      expect(summary.metrics.executions.limit).toBe(1000);
    });

    it("detects overages on free plan", () => {
      billing.createSubscription("t1", "STARTER");
      billing.trackUsage("t1", "executions", 1500); // Over 1000 limit

      const summary = billing.getUsageSummary("t1");
      expect(summary.overages.length).toBeGreaterThan(0);
      expect(summary.overages[0].metric).toBe("executions");
      expect(summary.overages[0].overage).toBe(500);
    });

    it("enterprise has unlimited (no overages)", () => {
      billing.createSubscription("t1", "ENTERPRISE");
      billing.trackUsage("t1", "executions", 1_000_000);

      const summary = billing.getUsageSummary("t1");
      expect(summary.overages).toHaveLength(0);
    });
  });

  describe("checkQuota", () => {
    it("blocks free plan when limit exceeded", () => {
      billing.createSubscription("t1", "STARTER");
      billing.trackUsage("t1", "executions", 1001);
      const quota = billing.checkQuota("t1", "executions");
      expect(quota.allowed).toBe(false);
    });

    it("allows paid plan even with overages", () => {
      billing.createSubscription("t1", "PROFESSIONAL");
      billing.trackUsage("t1", "executions", 50000);
      const quota = billing.checkQuota("t1", "executions");
      expect(quota.allowed).toBe(true);
    });
  });

  describe("webhook processing", () => {
    it("handles invoice.paid", () => {
      billing.createSubscription("t1", "PROFESSIONAL");
      const result = billing.processWebhookEvent({
        type: "invoice.paid",
        data: { tenantId: "t1", amount: 9900, periodStart: Date.now(), periodEnd: Date.now() + 30 * 86_400_000 },
      });
      expect(result.handled).toBe(true);
      expect(result.action).toBe("invoice_paid");
      expect(billing.getInvoices("t1")).toHaveLength(1);
    });

    it("handles payment failure", () => {
      billing.createSubscription("t1", "PROFESSIONAL");
      billing.processWebhookEvent({ type: "invoice.payment_failed", data: { tenantId: "t1" } });
      expect(billing.getSubscription("t1")!.status).toBe("past_due");
    });

    it("handles subscription deleted", () => {
      billing.createSubscription("t1", "PROFESSIONAL");
      billing.processWebhookEvent({ type: "customer.subscription.deleted", data: { tenantId: "t1" } });
      expect(billing.getSubscription("t1")!.status).toBe("canceled");
    });

    it("ignores unknown events", () => {
      const result = billing.processWebhookEvent({ type: "unknown.event", data: {} });
      expect(result.handled).toBe(false);
    });
  });

  describe("getPlans", () => {
    it("returns all plan definitions", () => {
      const plans = billing.getPlans();
      expect(plans).toHaveLength(3);
      expect(plans.map((p) => p.id)).toEqual(["STARTER", "PROFESSIONAL", "ENTERPRISE"]);
    });
  });
});
