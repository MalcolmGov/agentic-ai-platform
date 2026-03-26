"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// Stripe Billing — Usage, Plans, Invoices
// ═══════════════════════════════════════════════

interface UsageMetric {
  label: string;
  icon: string;
  current: number;
  limit: number;
  unit: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  period: string;
}

const PLANS = [
  { name: "Starter", price: 0, agents: 3, executions: 1000, storage: "1 GB", support: "Community", current: false },
  { name: "Pro", price: 99, agents: 25, executions: 25000, storage: "50 GB", support: "Priority", current: false },
  { name: "Enterprise", price: 499, agents: -1, executions: -1, storage: "Unlimited", support: "Dedicated", current: true },
];

const USAGE: UsageMetric[] = [
  { label: "Active Agents", icon: "🤖", current: 12, limit: -1, unit: "agents" },
  { label: "Executions (This Month)", icon: "⚡", current: 47832, limit: -1, unit: "runs" },
  { label: "LLM Tokens", icon: "🧠", current: 2847000, limit: -1, unit: "tokens" },
  { label: "Storage Used", icon: "💾", current: 12.4, limit: -1, unit: "GB" },
  { label: "API Calls", icon: "🔗", current: 156000, limit: -1, unit: "calls" },
  { label: "Team Members", icon: "👥", current: 24, limit: -1, unit: "users" },
];

const INVOICES: Invoice[] = [
  { id: "INV-2026-003", date: "2026-03-01", amount: 499, status: "paid", period: "Mar 2026" },
  { id: "INV-2026-002", date: "2026-02-01", amount: 499, status: "paid", period: "Feb 2026" },
  { id: "INV-2026-001", date: "2026-01-01", amount: 499, status: "paid", period: "Jan 2026" },
  { id: "INV-2025-012", date: "2025-12-01", amount: 99, status: "paid", period: "Dec 2025" },
  { id: "INV-2025-011", date: "2025-11-01", amount: 99, status: "paid", period: "Nov 2025" },
];

export default function BillingPage() {
  const [showPlans, setShowPlans] = useState(false);

  const currentPlan = PLANS.find(p => p.current)!;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">💳</span>
            <h1 className="text-2xl font-bold text-text-primary">Billing & Usage</h1>
          </div>
          <p className="text-sm text-text-secondary">Manage your subscription, usage, and invoices.</p>
        </div>
        <button className="btn-secondary text-sm">Open Stripe Portal →</button>
      </div>

      {/* Current Plan */}
      <div className="glass-card p-5 mb-6 !border-electric-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-text-primary">Current Plan:</span>
              <span className="text-lg font-bold text-electric-400">{currentPlan.name}</span>
              <span className="badge badge-active text-[10px]">Active</span>
            </div>
            <div className="text-[11px] text-text-muted">
              ${currentPlan.price}/month · Unlimited agents & executions · Dedicated support · Next billing: April 1, 2026
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-text-primary">${currentPlan.price}</div>
            <div className="text-[10px] text-text-muted">per month</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border flex gap-2">
          <button onClick={() => setShowPlans(!showPlans)} className="btn-secondary text-[11px] !py-1.5">
            {showPlans ? "Hide Plans" : "Compare Plans"}
          </button>
          <button className="text-[11px] text-text-muted hover:text-text-primary">Cancel Subscription</button>
        </div>
      </div>

      {/* Plan Comparison */}
      {showPlans && (
        <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
          {PLANS.map(plan => (
            <div key={plan.name} className={`glass-card p-5 ${plan.current ? "!border-electric-500/30 glow-blue" : ""}`}>
              <div className="text-lg font-bold text-text-primary mb-1">{plan.name}</div>
              <div className="text-2xl font-bold text-electric-400 mb-3">
                {plan.price === 0 ? "Free" : `$${plan.price}`}<span className="text-sm text-text-muted font-normal">/mo</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Agents</span><span className="text-text-primary">{plan.agents === -1 ? "Unlimited" : plan.agents}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Executions</span><span className="text-text-primary">{plan.executions === -1 ? "Unlimited" : plan.executions.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Storage</span><span className="text-text-primary">{plan.storage}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Support</span><span className="text-text-primary">{plan.support}</span></div>
              </div>
              <button className={`w-full mt-4 py-2 rounded-lg text-xs font-semibold ${plan.current ? "bg-electric-500/15 text-electric-400 border border-electric-500/20" : "bg-navy-700 text-text-muted border border-border hover:text-text-primary"}`}>
                {plan.current ? "✓ Current Plan" : "Upgrade →"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Usage Metrics */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Current Usage</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {USAGE.map(metric => (
          <div key={metric.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{metric.icon}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{metric.label}</span>
            </div>
            <div className="text-xl font-bold text-text-primary">
              {metric.current >= 1000000 ? `${(metric.current / 1000000).toFixed(1)}M` : metric.current >= 1000 ? `${(metric.current / 1000).toFixed(1)}K` : metric.current}
              <span className="text-xs text-text-muted font-normal ml-1">{metric.unit}</span>
            </div>
            {metric.limit > 0 && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
                  <div className="h-full rounded-full bg-electric-500" style={{ width: `${(metric.current / metric.limit) * 100}%` }} />
                </div>
                <div className="text-[10px] text-text-muted mt-1">{((metric.current / metric.limit) * 100).toFixed(0)}% of {metric.limit.toLocaleString()}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invoices */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Invoice History</h3>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] text-text-muted uppercase tracking-wider px-4 py-2">Invoice</th>
              <th className="text-left text-[10px] text-text-muted uppercase tracking-wider px-4 py-2">Period</th>
              <th className="text-left text-[10px] text-text-muted uppercase tracking-wider px-4 py-2">Amount</th>
              <th className="text-left text-[10px] text-text-muted uppercase tracking-wider px-4 py-2">Status</th>
              <th className="text-right text-[10px] text-text-muted uppercase tracking-wider px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-navy-800/30">
                <td className="px-4 py-2.5 text-sm text-text-primary font-mono">{inv.id}</td>
                <td className="px-4 py-2.5 text-sm text-text-secondary">{inv.period}</td>
                <td className="px-4 py-2.5 text-sm text-text-primary font-bold">${inv.amount}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${inv.status === "paid" ? "bg-emerald-500/15 text-emerald-400" : inv.status === "pending" ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400"}`}>
                    {inv.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button className="text-[11px] text-electric-400 hover:text-electric-300">Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
