"use client";

import { useState } from "react";

// ═══ Demo Data ═══

const stats = {
  totalNodes: 12, totalEdges: 10, avgConfidence: 0.91, organizationIQ: 142,
  nodesByType: { pattern: 3, fact: 2, decision: 2, entity: 2, rule: 1, concept: 2 },
  topContributors: [
    { agentName: "Fraud Monitoring Agent", contributions: 5, color: "#f43f5e" },
    { agentName: "Compliance Agent", contributions: 3, color: "#8b5cf6" },
    { agentName: "Customer Support Agent", contributions: 3, color: "#06b6d4" },
    { agentName: "Reporting Agent", contributions: 1, color: "#22c55e" },
  ],
};

const knowledgeNodes = [
  { id: "kn_1", type: "pattern", label: "High-risk transaction pattern: Cyprus + Round amounts + New account", agent: "Fraud Monitoring Agent", confidence: 0.94, connections: 3, updated: "2 hours ago" },
  { id: "kn_2", type: "fact", label: "OFAC SDN list updated quarterly — last update March 2026", agent: "Compliance Agent", confidence: 0.99, connections: 2, updated: "1 day ago" },
  { id: "kn_3", type: "decision", label: "Blocked vendor Apex Holdings after 3 flagged transactions", agent: "Fraud Monitoring Agent", confidence: 0.91, connections: 2, updated: "3 hours ago" },
  { id: "kn_5", type: "rule", label: "PEP screening required for transactions > $25K to FATF grey-listed countries", agent: "Compliance Agent", confidence: 0.97, connections: 2, updated: "5 hours ago" },
  { id: "kn_6", type: "concept", label: "Velocity anomaly detection: >5x normal transaction rate triggers review", agent: "Fraud Monitoring Agent", confidence: 0.89, connections: 2, updated: "6 hours ago" },
  { id: "kn_7", type: "pattern", label: "Support tickets spike 40% on Mondays — pre-schedule extra capacity", agent: "Customer Support Agent", confidence: 0.86, connections: 2, updated: "12 hours ago" },
  { id: "kn_8", type: "fact", label: "Invoice processing accuracy improved from 91% to 98.3% after template normalization", agent: "Reporting Agent", confidence: 0.95, connections: 1, updated: "1 day ago" },
  { id: "kn_11", type: "pattern", label: "Refund fraud pattern: multiple returns from same IP within 48h", agent: "Fraud Monitoring Agent", confidence: 0.87, connections: 1, updated: "2 days ago" },
  { id: "kn_12", type: "concept", label: "Customer churn predictor: 3+ negative interactions in 7 days = 72% churn probability", agent: "Customer Support Agent", confidence: 0.79, connections: 1, updated: "3 days ago" },
];

const typeColors: Record<string, string> = {
  pattern: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  fact: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  decision: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  entity: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  rule: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  concept: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

// ═══ Page ═══

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filtered = knowledgeNodes.filter((n) => {
    const matchesSearch = !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || n.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Knowledge Graph</h1>
        <p className="text-text-secondary mt-1">Cross-agent institutional memory — gets smarter the longer you use it</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5 text-center">
          <div className="text-3xl font-bold text-electric-400">{stats.organizationIQ}</div>
          <div className="text-xs text-text-muted mt-1">Organization IQ</div>
          <div className="mt-2 h-1.5 rounded-full bg-navy-800"><div className="h-full rounded-full bg-gradient-to-r from-electric-500 to-violet-500" style={{ width: `${Math.min(100, stats.organizationIQ / 2)}%` }} /></div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-3xl font-bold text-text-primary">{stats.totalNodes}</div>
          <div className="text-xs text-text-muted mt-1">Knowledge Nodes</div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-3xl font-bold text-text-primary">{stats.totalEdges}</div>
          <div className="text-xs text-text-muted mt-1">Connections</div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-3xl font-bold text-emerald-400">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          <div className="text-xs text-text-muted mt-1">Avg Confidence</div>
        </div>
      </div>

      {/* Contributors + Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Top Contributing Agents</h2>
          <div className="space-y-3">
            {stats.topContributors.map((c) => (
              <div key={c.agentName} className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="flex-1 text-xs text-text-secondary">{c.agentName}</div>
                <div className="w-32 h-2 rounded-full bg-navy-800">
                  <div className="h-full rounded-full" style={{ width: `${(c.contributions / 5) * 100}%`, backgroundColor: c.color }} />
                </div>
                <div className="text-xs font-bold text-text-primary w-6 text-right">{c.contributions}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Knowledge Types</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(stats.nodesByType).map(([type, count]) => (
              <button key={type} onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={`p-3 rounded-xl text-center transition-all ${typeFilter === type ? "ring-1 ring-electric-500/50" : ""} ${typeColors[type]?.split(" ")[0] || "bg-navy-800/40"}`}>
                <div className="text-lg font-bold text-text-primary">{count}</div>
                <div className="text-[10px] text-text-muted capitalize">{type}s</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Knowledge List */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <input type="text" placeholder="Search knowledge base..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-navy-800/60 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric-500/50" />
          {typeFilter && (
            <button onClick={() => setTypeFilter(null)} className="text-xs text-text-muted hover:text-text-secondary px-2 py-1 rounded-lg bg-navy-800/40">
              Clear filter
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filtered.map((node) => (
            <div key={node.id} className="p-4 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors border border-transparent hover:border-border-active">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${typeColors[node.type]}`}>{node.type}</span>
                <span className="text-[10px] text-electric-400 font-medium">{node.agent}</span>
                <span className="text-[10px] text-text-muted ml-auto">{node.updated}</span>
              </div>
              <p className="text-sm text-text-primary">{node.label}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 rounded-full bg-navy-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${node.confidence * 100}%` }} /></div>
                  <span className="text-[9px] text-text-muted">{(node.confidence * 100).toFixed(0)}%</span>
                </div>
                <span className="text-[9px] text-text-muted">{node.connections} connections</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
