"use client";

import { useState } from "react";

// ═══ Demo Data ═══

const agents = [
  { id: "agent_fraud_001", name: "Fraud Monitoring Agent", currentVersion: 3, model: "gpt-4o" },
  { id: "agent_compliance_001", name: "Compliance Agent", currentVersion: 3, model: "gpt-4o" },
  { id: "agent_support_001", name: "Customer Support Agent", currentVersion: 3, model: "gpt-4o-mini" },
  { id: "agent_reporting_001", name: "Reporting Agent", currentVersion: 3, model: "gpt-4o" },
];

const versions = [
  { version: 3, changelog: "Reduced verbosity and temperature for more consistent output", createdBy: "admin@acme.com", createdAt: "2 days ago", isCurrent: true },
  { version: 2, changelog: "Added concise output instructions", createdBy: "admin@acme.com", createdAt: "1 week ago", isCurrent: false },
  { version: 1, changelog: "Initial version", createdBy: "system", createdAt: "3 weeks ago", isCurrent: false },
];

const modelRoutes = [
  { taskType: "analysis", model: "gpt-4o", provider: "openai", cost: "$2.50/1M", quality: 95, latency: "3.0s" },
  { taskType: "writing", model: "claude-sonnet-4-6", provider: "anthropic", cost: "$3.00/1M", quality: 97, latency: "2.5s" },
  { taskType: "code", model: "claude-sonnet-4-6", provider: "anthropic", cost: "$3.00/1M", quality: 96, latency: "2.8s" },
  { taskType: "classification", model: "gpt-4o-mini", provider: "openai", cost: "$0.15/1M", quality: 88, latency: "0.8s" },
  { taskType: "extraction", model: "gpt-4o-mini", provider: "openai", cost: "$0.15/1M", quality: 90, latency: "0.9s" },
  { taskType: "summarization", model: "gpt-4o-mini", provider: "openai", cost: "$0.15/1M", quality: 87, latency: "1.0s" },
  { taskType: "reasoning", model: "claude-opus-4-6", provider: "anthropic", cost: "$15.00/1M", quality: 99, latency: "8.0s" },
  { taskType: "conversation", model: "gpt-4o", provider: "openai", cost: "$2.50/1M", quality: 93, latency: "1.5s" },
];

// ═══ Page ═══

export default function AgentVersionsPage() {
  const [selectedAgent, setSelectedAgent] = useState(0);
  const [activeTab, setActiveTab] = useState<"versions" | "routing">("versions");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Agent Versions & Model Routing</h1>
        <p className="text-text-secondary mt-1">Version control, cloning, and intelligent model routing</p>
      </div>

      <div className="flex gap-1 mb-4">
        {(["versions", "routing"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${tab === activeTab ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
            {tab === "versions" ? "Versions & Cloning" : "Model Routing"}
          </button>
        ))}
      </div>

      {activeTab === "versions" && (
        <>
          {/* Agent Selector */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {agents.map((a, i) => (
              <button key={a.id} onClick={() => setSelectedAgent(i)}
                className={`glass-card p-4 text-left transition-all ${i === selectedAgent ? "border-electric-500/30 bg-electric-500/5" : ""}`}>
                <div className="text-xs font-semibold text-text-primary">{a.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-text-muted">v{a.currentVersion}</span>
                  <span className="text-[10px] text-electric-400">{a.model}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 transition-colors">Clone Agent</button>
            <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">Fork with Changes</button>
          </div>

          {/* Version Timeline */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Version History — {agents[selectedAgent].name}</h2>
            <div className="space-y-4">
              {versions.map((v) => (
                <div key={v.version} className={`flex gap-4 p-4 rounded-xl ${v.isCurrent ? "bg-electric-500/5 border border-electric-500/20" : "bg-navy-800/30 border border-transparent"}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${v.isCurrent ? "bg-electric-500/20 text-electric-400" : "bg-navy-800 text-text-muted"}`}>v{v.version}</div>
                    {v.version > 1 && <div className="w-px h-4 bg-border mt-1" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">{v.changelog}</span>
                      {v.isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">current</span>}
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">by {v.createdBy} · {v.createdAt}</div>
                  </div>
                  {!v.isCurrent && (
                    <button className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-colors self-center">Rollback</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "routing" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Multi-Model Routing Rules</h2>
              <p className="text-xs text-text-muted">Each task type is routed to the optimal model for cost and quality</p>
            </div>
            <button className="text-[10px] font-medium text-electric-400 bg-electric-500/10 px-3 py-1.5 rounded-lg hover:bg-electric-500/20 transition-colors">+ Add Route</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2 px-3">Task Type</th>
                  <th className="text-left py-2 px-3">Model</th>
                  <th className="text-left py-2 px-3">Provider</th>
                  <th className="text-right py-2 px-3">Cost</th>
                  <th className="text-right py-2 px-3">Quality</th>
                  <th className="text-right py-2 px-3">Latency</th>
                </tr>
              </thead>
              <tbody>
                {modelRoutes.map((route) => (
                  <tr key={route.taskType} className="border-b border-border/50 hover:bg-navy-800/30 transition-colors">
                    <td className="py-3 px-3 text-xs font-medium text-text-primary capitalize">{route.taskType}</td>
                    <td className="py-3 px-3 text-xs text-electric-400 font-mono">{route.model}</td>
                    <td className="py-3 px-3 text-xs text-text-secondary capitalize">{route.provider}</td>
                    <td className="py-3 px-3 text-xs text-text-muted text-right">{route.cost}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-12 h-1 rounded-full bg-navy-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${route.quality}%` }} /></div>
                        <span className="text-xs text-text-primary">{route.quality}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-text-muted text-right">{route.latency}</td>
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
