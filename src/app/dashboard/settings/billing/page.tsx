"use client";

import { useEffect, useState, useCallback } from "react";

// ═══════════════════════════════════════════════
// Billing & Usage Dashboard
// ═══════════════════════════════════════════════

interface BillingData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeConfigured: boolean;
  limits: {
    maxAgents: number;
    maxMarkets: number;
    maxInteractionsPerMonth: number;
  };
  usage: {
    agents: number;
    markets: number;
    interactions: number;
  };
}

const PLAN_DETAILS: Record<
  string,
  { label: string; price: string; color: string; badge: string }
> = {
  trial: { label: "Trial", price: "Free", color: "text-amber-400", badge: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  starter: { label: "Starter", price: "$49", color: "text-sky-400", badge: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  business: { label: "Business", price: "$199", color: "text-electric-400", badge: "bg-electric-500/15 text-electric-400 border-electric-500/20" },
  enterprise: { label: "Enterprise", price: "Custom", color: "text-violet-400", badge: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
};

const PLAN_COMPARISON = [
  {
    key: "starter",
    label: "Starter",
    price: "$49",
    period: "/mo",
    features: {
      agents: "5 agents",
      markets: "1 market",
      interactions: "10K / month",
      channels: "WhatsApp + Web",
      support: "Email support",
      analytics: false,
      customBranding: false,
    },
  },
  {
    key: "business",
    label: "Business",
    price: "$199",
    period: "/mo",
    popular: true,
    features: {
      agents: "25 agents",
      markets: "5 markets",
      interactions: "100K / month",
      channels: "All channels",
      support: "Priority support",
      analytics: true,
      customBranding: false,
    },
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: "Custom",
    period: "",
    features: {
      agents: "Unlimited",
      markets: "13 markets",
      interactions: "Unlimited",
      channels: "All channels",
      support: "Dedicated SLA",
      analytics: true,
      customBranding: true,
    },
  },
];

function fmt(n: number): string {
  if (n === Infinity) return "∞";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function UsageMeter({
  label,
  icon,
  current,
  max,
}: {
  label: string;
  icon: string;
  current: number;
  max: number;
}) {
  const pct = max === Infinity ? 0 : Math.min(100, Math.round((current / max) * 100));
  const barColor =
    pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-electric-500";

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-xs text-text-secondary font-mono">
          {fmt(current)} / {fmt(max)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {max !== Infinity && (
        <div className="text-[10px] text-text-muted mt-1">{pct}% used</div>
      )}
      {max === Infinity && (
        <div className="text-[10px] text-emerald-400 mt-1">Unlimited</div>
      )}
    </div>
  );
}

function CheckIcon({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-xs text-text-secondary">{value}</span>;
  }
  if (value) {
    return <span className="text-emerald-400 text-sm">✓</span>;
  }
  return <span className="text-text-muted text-sm">—</span>;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing");
      if (res.ok) {
        const json = await res.json();
        setData(json.data as BillingData);
      }
    } catch {
      // API unavailable — leave null so UI shows mock state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleAction = async (action: "checkout" | "portal", plan?: string) => {
    setActionLoading(action);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, plan }),
      });
      const json = await res.json();
      const { checkoutUrl, portalUrl, message } = json.data ?? {};

      if (message) {
        showToast(message);
        return;
      }

      const url = checkoutUrl || portalUrl;
      if (url) {
        window.location.href = url;
      }
    } catch {
      showToast("Request failed — please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const planInfo = data ? (PLAN_DETAILS[data.plan] ?? PLAN_DETAILS.trial) : PLAN_DETAILS.trial;
  const stripeConfigured = data?.stripeConfigured ?? false;
  const limits = data?.limits ?? { maxAgents: 3, maxMarkets: 1, maxInteractionsPerMonth: 500 };
  const usage = data?.usage ?? { agents: 0, markets: 0, interactions: 0 };

  const renewalDate = data?.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-navy-700 border border-border text-text-primary text-sm px-4 py-3 rounded-lg shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">💳</span>
            <h1 className="text-2xl font-bold text-text-primary">Billing & Usage</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Manage your subscription, monitor usage, and upgrade your plan.
          </p>
        </div>
        {!loading && (
          <button
            onClick={() => handleAction("portal")}
            disabled={actionLoading === "portal"}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {actionLoading === "portal" ? "Opening…" : "Manage Billing →"}
          </button>
        )}
      </div>

      {/* Stripe not configured banner */}
      {!loading && !stripeConfigured && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          <span className="text-lg">⚠️</span>
          <span>
            Billing not configured — contact your administrator to set up Stripe.
          </span>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="glass-card p-5 mb-6 !border-electric-500/20">
        {loading ? (
          <div className="h-16 animate-pulse rounded bg-navy-700/50" />
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-text-secondary">Current Plan</span>
                  <span className={`text-xl font-bold ${planInfo.color}`}>{planInfo.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${planInfo.badge}`}>
                    {data?.status?.toUpperCase() ?? "TRIAL"}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted space-x-3">
                  <span>{planInfo.price}{data?.plan !== "enterprise" ? "/month" : ""}</span>
                  {renewalDate && <span>· Renews {renewalDate}</span>}
                  {!renewalDate && <span>· No renewal date set</span>}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${planInfo.color}`}>{planInfo.price}</div>
                {data?.plan !== "enterprise" && (
                  <div className="text-[10px] text-text-muted">per month</div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex gap-2 flex-wrap">
              <button
                onClick={() => setShowPlans((v) => !v)}
                className="btn-secondary text-[11px] !py-1.5"
              >
                {showPlans ? "Hide Plans" : "Compare Plans"}
              </button>
              <button
                onClick={() => handleAction("checkout", "business")}
                disabled={actionLoading === "checkout"}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-electric-500/10 text-electric-400 border border-electric-500/20 hover:bg-electric-500/20 transition-colors disabled:opacity-50"
              >
                {actionLoading === "checkout" ? "Redirecting…" : "Upgrade Plan →"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Plan Comparison */}
      {showPlans && (
        <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
          {PLAN_COMPARISON.map((plan) => {
            const isCurrent = data?.plan === plan.key;
            return (
              <div
                key={plan.key}
                className={`glass-card p-5 relative ${isCurrent ? "!border-electric-500/40" : ""}`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 bg-electric-500 text-white rounded-full font-bold uppercase tracking-wider">
                    Popular
                  </div>
                )}
                <div className="text-base font-bold text-text-primary mb-0.5">{plan.label}</div>
                <div className="text-2xl font-bold text-electric-400 mb-4">
                  {plan.price}
                  <span className="text-xs text-text-muted font-normal">{plan.period}</span>
                </div>
                <div className="space-y-2 text-xs mb-4">
                  {(
                    [
                      ["Agents", plan.features.agents],
                      ["Markets", plan.features.markets],
                      ["Interactions", plan.features.interactions],
                      ["Channels", plan.features.channels],
                      ["Support", plan.features.support],
                      ["Advanced analytics", plan.features.analytics],
                      ["Custom branding", plan.features.customBranding],
                    ] as [string, string | boolean][]
                  ).map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-text-muted">{label}</span>
                      <CheckIcon value={val} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => !isCurrent && handleAction("checkout", plan.key)}
                  disabled={isCurrent || actionLoading === "checkout"}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "bg-electric-500/15 text-electric-400 border border-electric-500/20 cursor-default"
                      : "bg-navy-700 text-text-muted border border-border hover:text-text-primary hover:border-electric-500/30"
                  }`}
                >
                  {isCurrent ? "✓ Current Plan" : "Upgrade →"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage Meters */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
        Current Usage
      </h3>
      {loading ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <UsageMeter
            label="Agents Deployed"
            icon="🤖"
            current={usage.agents}
            max={limits.maxAgents}
          />
          <UsageMeter
            label="Markets Active"
            icon="🌍"
            current={usage.markets}
            max={limits.maxMarkets}
          />
          <UsageMeter
            label="Monthly Interactions"
            icon="⚡"
            current={usage.interactions}
            max={limits.maxInteractionsPerMonth}
          />
        </div>
      )}

      {/* CTA bar */}
      {!loading && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-primary mb-0.5">
              Need more capacity?
            </div>
            <div className="text-xs text-text-muted">
              Upgrade your plan to unlock more agents, markets, and interactions.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("checkout", "business")}
              disabled={actionLoading === "checkout"}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {actionLoading === "checkout" ? "Redirecting…" : "Upgrade Plan"}
            </button>
            <button
              onClick={() => handleAction("portal")}
              disabled={actionLoading === "portal"}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {actionLoading === "portal" ? "Opening…" : "Manage Billing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
