"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// Integrations Hub — Connect Third-Party Services
// ═══════════════════════════════════════════════

interface Integration {
  id: string;
  name: string;
  icon: string;
  category: "messaging" | "crm" | "monitoring" | "storage" | "dev";
  description: string;
  status: "connected" | "available" | "coming_soon";
  features: string[];
  config?: Record<string, string>;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "slack", name: "Slack", icon: "💬", category: "messaging",
    description: "Send agent alerts, get status updates, and execute commands from Slack channels.",
    status: "connected", features: ["Alert notifications", "Agent commands", "Approval workflows", "Daily reports"],
    config: { workspace: "acme-corp.slack.com", channel: "#agent-ops", botName: "AgenticBot" },
  },
  {
    id: "teams", name: "Microsoft Teams", icon: "🟦", category: "messaging",
    description: "Integrate with Teams for notifications, approval flows, and agent management.",
    status: "available", features: ["Adaptive cards", "Channel notifications", "Approval actions", "Meeting summaries"],
  },
  {
    id: "salesforce", name: "Salesforce", icon: "☁️", category: "crm",
    description: "Sync CRM data, trigger agents on lead events, and auto-update opportunities.",
    status: "available", features: ["Lead scoring agents", "Opportunity updates", "Contact enrichment", "Custom objects"],
  },
  {
    id: "hubspot", name: "HubSpot", icon: "🟠", category: "crm",
    description: "Connect HubSpot for automated lead nurturing, deal tracking, and contact management.",
    status: "available", features: ["Deal automation", "Contact sync", "Email triggers", "Pipeline updates"],
  },
  {
    id: "datadog", name: "Datadog", icon: "🐕", category: "monitoring",
    description: "Forward agent metrics, traces, and logs to Datadog for unified observability.",
    status: "connected", features: ["APM integration", "Custom metrics", "Log forwarding", "Alert sync"],
    config: { apiKey: "dd-****-****-4f2a", region: "US1", environment: "production" },
  },
  {
    id: "pagerduty", name: "PagerDuty", icon: "🚨", category: "monitoring",
    description: "Trigger PagerDuty incidents on critical agent failures or anomaly detections.",
    status: "available", features: ["Incident creation", "Escalation policies", "On-call routing", "Acknowledgments"],
  },
  {
    id: "s3", name: "AWS S3", icon: "📦", category: "storage",
    description: "Store agent outputs, compliance reports, and execution logs in S3 buckets.",
    status: "connected", features: ["Report storage", "Log archival", "Data export", "Presigned URLs"],
    config: { bucket: "acme-agentic-prod", region: "us-east-1", prefix: "agent-outputs/" },
  },
  {
    id: "github", name: "GitHub", icon: "🐙", category: "dev",
    description: "Trigger agents on PRs, issues, and deployments. Auto-review code and generate docs.",
    status: "available", features: ["PR review agents", "Issue triage", "Deploy triggers", "Doc generation"],
  },
  {
    id: "jira", name: "Jira", icon: "🔷", category: "dev",
    description: "Create tickets from agent insights, sync sprint data, and automate project tracking.",
    status: "coming_soon", features: ["Ticket creation", "Sprint sync", "Status updates", "Backlog analysis"],
  },
  {
    id: "twilio", name: "Twilio", icon: "📱", category: "messaging",
    description: "Send SMS/WhatsApp notifications for critical agent alerts and customer outreach.",
    status: "coming_soon", features: ["SMS alerts", "WhatsApp messages", "Voice calls", "Two-way chat"],
  },
];

const CATEGORY_LABELS: Record<string, string> = { messaging: "Messaging", crm: "CRM", monitoring: "Monitoring", storage: "Storage", dev: "Developer Tools" };

export default function IntegrationsHubPage() {
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>("slack");

  const filtered = filter === "all" ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === filter);
  const connected = INTEGRATIONS.filter(i => i.status === "connected").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔌</span>
            <h1 className="text-2xl font-bold text-text-primary">Integrations</h1>
            <span className="badge badge-active text-[10px]">{connected} connected</span>
          </div>
          <p className="text-sm text-text-secondary">Connect your stack — Slack, Teams, Salesforce, and more.</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === "all" ? "bg-electric-500/20 text-electric-400 border border-electric-500/30" : "border border-border text-text-muted hover:text-text-primary"}`}>All ({INTEGRATIONS.length})</button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === key ? "bg-electric-500/20 text-electric-400 border border-electric-500/30" : "border border-border text-text-muted hover:text-text-primary"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="space-y-3">
        {filtered.map(integration => {
          const isExpanded = expandedId === integration.id;
          return (
            <div key={integration.id} className={`glass-card p-4 transition-all ${integration.status === "connected" ? "!border-emerald-500/20" : integration.status === "coming_soon" ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">{integration.name}</span>
                      {integration.status === "coming_soon" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">Coming Soon</span>}
                    </div>
                    <p className="text-[11px] text-text-secondary">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedId(isExpanded ? null : integration.id)} className="btn-secondary text-[11px] !py-1">
                    {isExpanded ? "▲" : "▼"} Details
                  </button>
                  <button className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    integration.status === "connected" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : integration.status === "coming_soon" ? "bg-navy-700 text-text-muted border border-border cursor-not-allowed"
                    : "bg-electric-500/15 text-electric-400 border border-electric-500/20 hover:bg-electric-500/25"
                  }`} disabled={integration.status === "coming_soon"}>
                    {integration.status === "connected" ? "✓ Connected" : integration.status === "coming_soon" ? "Notify Me" : "Connect →"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Features</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {integration.features.map(f => (
                          <div key={f} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                            <span className="text-emerald-400">✓</span> {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    {integration.config && (
                      <div className="w-64">
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Configuration</div>
                        <div className="space-y-1.5">
                          {Object.entries(integration.config).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-[11px]">
                              <span className="text-text-muted">{key}:</span>
                              <span className="text-text-primary font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
