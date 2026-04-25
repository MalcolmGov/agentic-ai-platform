"use client";

import { useState } from "react";
import { KeyIcon, PlusIcon } from "@/components/icons";

const plans = [
  { name: "Starter", price: "$499", period: "/month", agents: 3, executions: "10K", integrations: 5, support: "Email", current: false },
  { name: "Professional", price: "$1,499", period: "/month", agents: 10, executions: "100K", integrations: 15, support: "Priority", current: false },
  { name: "Enterprise", price: "$4,999", period: "/month", agents: "Unlimited", executions: "Unlimited", integrations: "Unlimited", support: "Dedicated", current: true },
];

const apiKeys = [
  { name: "Production API Key", key: "ak_live_••••••••••••3k7f", created: "2026-01-15", lastUsed: "2 min ago", status: "active" },
  { name: "Staging API Key", key: "ak_test_••••••••••••9m2p", created: "2026-02-08", lastUsed: "1 hour ago", status: "active" },
  { name: "Webhook Signing Key", key: "whk_••••••••••••5n4j", created: "2026-02-20", lastUsed: "5 min ago", status: "active" },
  { name: "Legacy Key (deprecated)", key: "ak_old_••••••••••••1a8b", created: "2025-11-01", lastUsed: "30 days ago", status: "inactive" },
];

const usageMetrics = [
  { label: "Agent Executions", used: 67423, limit: 100000, unit: "" },
  { label: "API Requests", used: 234891, limit: 500000, unit: "" },
  { label: "Storage Used", used: 12.4, limit: 50, unit: "GB" },
  { label: "LLM Tokens", used: 8.2, limit: 20, unit: "M" },
];

const teamMembers = [
  { name: "John Anderson", email: "john@acme.com", role: "Owner", avatar: "JA", lastActive: "Just now" },
  { name: "Sarah Chen", email: "sarah@acme.com", role: "Admin", avatar: "SC", lastActive: "5 min ago" },
  { name: "Michael Obi", email: "michael@acme.com", role: "Developer", avatar: "MO", lastActive: "1 hour ago" },
  { name: "Lisa Park", email: "lisa@acme.com", role: "Analyst", avatar: "LP", lastActive: "3 hours ago" },
  { name: "David Müller", email: "david@acme.com", role: "Developer", avatar: "DM", lastActive: "Yesterday" },
];

const roleColors: Record<string, string> = {
  Owner: "badge-error",
  Admin: "badge-warning",
  Developer: "badge-info",
  Analyst: "badge-active",
  Viewer: "badge-neutral",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "billing" | "api" | "team" | "ai">("general");

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your organization, billing, API keys, and team</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {(["general", "billing", "api", "team", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === "ai") {
                window.location.href = "/dashboard/settings/ai";
                return;
              }
              setActiveTab(tab);
            }}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-electric-500 text-electric-400"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab === "api" ? "API Keys" : tab === "ai" ? "🔒 AI & Data" : tab}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Organization Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary block mb-2">Organization Name</label>
                <input className="input-field" defaultValue="Acme Corporation" />
              </div>
              <div>
                <label className="text-sm text-text-secondary block mb-2">Industry</label>
                <select className="input-field">
                  <option>Financial Services</option>
                  <option>Fintech</option>
                  <option>Retail</option>
                  <option>Telecommunications</option>
                  <option>Logistics</option>
                  <option>Healthcare</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-text-secondary block mb-2">Tenant ID</label>
                <input className="input-field font-mono text-sm" defaultValue="tenant_acme_prod_01" readOnly />
              </div>
              <div>
                <label className="text-sm text-text-secondary block mb-2">Default LLM Provider</label>
                <select className="input-field">
                  <option>OpenAI GPT-4o</option>
                  <option>Anthropic Claude 3.5 Sonnet</option>
                  <option>Google Gemini 2.0 Pro</option>
                </select>
              </div>
              <button className="btn-primary mt-2">Save Changes</button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/50">
                <div>
                  <div className="text-sm font-medium text-text-primary">Two-Factor Authentication</div>
                  <div className="text-xs text-text-muted">Require 2FA for all team members</div>
                </div>
                <div className="w-12 h-6 rounded-full bg-emerald-500 relative cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5 shadow" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/50">
                <div>
                  <div className="text-sm font-medium text-text-primary">IP Whitelisting</div>
                  <div className="text-xs text-text-muted">Restrict API access to specific IPs</div>
                </div>
                <div className="w-12 h-6 rounded-full bg-emerald-500 relative cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5 shadow" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/50">
                <div>
                  <div className="text-sm font-medium text-text-primary">Audit Log Retention</div>
                  <div className="text-xs text-text-muted">How long to keep audit logs</div>
                </div>
                <select className="input-field w-32 text-sm py-1.5">
                  <option>90 days</option>
                  <option>180 days</option>
                  <option>1 year</option>
                  <option>Forever</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/50">
                <div>
                  <div className="text-sm font-medium text-text-primary">Data Encryption</div>
                  <div className="text-xs text-text-muted">AES-256 encryption at rest</div>
                </div>
                <span className="badge badge-active text-[10px]">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {usageMetrics.map((metric) => {
              const pct = typeof metric.used === "number" && typeof metric.limit === "number"
                ? (metric.used / metric.limit) * 100
                : 0;
              return (
                <div key={metric.label} className="glass-card p-5">
                  <div className="text-sm text-text-muted mb-2">{metric.label}</div>
                  <div className="text-xl font-bold text-text-primary">
                    {typeof metric.used === "number" ? metric.used.toLocaleString() : metric.used}{metric.unit}
                    <span className="text-sm font-normal text-text-muted"> / {typeof metric.limit === "number" ? metric.limit.toLocaleString() : metric.limit}{metric.unit}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-navy-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-500" : "bg-electric-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-text-muted mt-1">{pct.toFixed(1)}% used</div>
                </div>
              );
            })}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-6 ${plan.current ? "border-electric-500/40 glow-blue" : ""}`}
              >
                {plan.current && (
                  <span className="badge badge-info text-[10px] mb-3">Current Plan</span>
                )}
                <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Agents</span>
                    <span className="font-medium text-text-primary">{plan.agents}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Executions/mo</span>
                    <span className="font-medium text-text-primary">{plan.executions}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Integrations</span>
                    <span className="font-medium text-text-primary">{plan.integrations}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Support</span>
                    <span className="font-medium text-text-primary">{plan.support}</span>
                  </div>
                </div>
                <button className={`w-full mt-6 ${plan.current ? "btn-secondary" : "btn-primary"}`}>
                  {plan.current ? "Manage Plan" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Generate New Key
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-navy-900/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Last Used</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((ak) => (
                  <tr key={ak.name} className="table-row">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary flex items-center gap-2">
                      <KeyIcon className="w-4 h-4 text-text-muted" />
                      {ak.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-text-secondary">{ak.key}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{ak.created}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{ak.lastUsed}</td>
                    <td className="px-6 py-4">
                      <span className={`badge text-[10px] ${ak.status === "active" ? "badge-active" : "badge-neutral"}`}>
                        {ak.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-rose-400 hover:text-rose-300 font-medium">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Invite Member
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-navy-900/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.email} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{member.name}</div>
                          <div className="text-xs text-text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge text-[10px] ${roleColors[member.role]}`}>{member.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">{member.lastActive}</td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-electric-400 hover:text-electric-300 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
