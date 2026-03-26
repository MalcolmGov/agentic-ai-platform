"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// Human-in-the-Loop — Approval Gates
// ═══════════════════════════════════════════════

interface ApprovalRequest {
  id: string;
  agentName: string;
  agentIcon: string;
  action: string;
  description: string;
  risk: "low" | "medium" | "high" | "critical";
  data: Record<string, string | number>;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  gate: string;
}

const APPROVAL_QUEUE: ApprovalRequest[] = [
  {
    id: "apr_001", agentName: "FraudGuard", agentIcon: "🛡️",
    action: "Freeze 14 linked accounts", description: "Fraud ring investigation detected a mule network. FraudGuard wants to preemptively freeze 14 accounts pending manual review.",
    risk: "critical", gate: "high_impact_action",
    data: { accounts: 14, totalBalance: "$847,200", evidence: "89% mule ring match", investigationId: "CASE-1847" },
    timestamp: "2 min ago", status: "pending",
  },
  {
    id: "apr_002", agentName: "ComplianceBot", agentIcon: "📋",
    action: "Submit SAR filing", description: "Suspicious Activity Report ready for regulatory submission. Requires compliance officer sign-off before filing with FinCEN.",
    risk: "high", gate: "regulatory_filing",
    data: { filingType: "SAR", subject: "ACC-4821", amount: "$127,450", jurisdiction: "US" },
    timestamp: "15 min ago", status: "pending",
  },
  {
    id: "apr_003", agentName: "ReportGen", agentIcon: "📊",
    action: "Send executive report to board", description: "Monthly executive report with financial and operational metrics ready for distribution to board members.",
    risk: "medium", gate: "external_communication",
    data: { recipients: 8, reportPages: 24, dataPoints: 147 },
    timestamp: "1 hour ago", status: "pending",
  },
  {
    id: "apr_004", agentName: "DataMiner", agentIcon: "🔬",
    action: "Delete stale customer records", description: "Identified 2,340 customer records inactive for 3+ years. GDPR data minimization policy suggests deletion.",
    risk: "high", gate: "data_deletion",
    data: { records: 2340, inactivePeriod: "3+ years", policy: "GDPR Art. 5(1)(e)" },
    timestamp: "3 hours ago", status: "pending",
  },
  {
    id: "apr_005", agentName: "FraudGuard", agentIcon: "🛡️",
    action: "Block IP range 196.21.0.0/16", description: "Repeated fraud attempts from this IP range detected. Blocking would affect legitimate users in Nigeria.",
    risk: "high", gate: "network_block",
    data: { ipRange: "196.21.0.0/16", fraudAttempts: 47, legitimateUsers: "~12,000" },
    timestamp: "5 hours ago", status: "pending",
  },
];

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400" },
  critical: { bg: "bg-rose-500/15", text: "text-rose-400" },
};

const COMPLETED: ApprovalRequest[] = [
  { id: "apr_100", agentName: "EmailAgent", agentIcon: "✉️", action: "Send marketing blast to 5K contacts", description: "", risk: "medium", gate: "external_communication", data: {}, timestamp: "Yesterday", status: "approved" },
  { id: "apr_101", agentName: "ComplianceBot", agentIcon: "📋", action: "Auto-approve 20 low-risk KYC applications", description: "", risk: "low", gate: "batch_approval", data: {}, timestamp: "Yesterday", status: "approved" },
  { id: "apr_102", agentName: "FraudGuard", agentIcon: "🛡️", action: "Escalate to law enforcement", description: "", risk: "critical", gate: "legal_action", data: {}, timestamp: "2 days ago", status: "rejected" },
];

export default function ApprovalGatesPage() {
  const [queue, setQueue] = useState(APPROVAL_QUEUE);
  const [expandedId, setExpandedId] = useState<string | null>("apr_001");

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setQueue(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const pendingCount = queue.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">✋</span>
            <h1 className="text-2xl font-bold text-text-primary">Approval Gates</h1>
            {pendingCount > 0 && <span className="badge badge-info text-[10px] animate-pulse">{pendingCount} pending</span>}
          </div>
          <p className="text-sm text-text-secondary">Human-in-the-loop — review and approve high-impact agent actions before execution.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Pending</div><div className="text-xl font-bold text-amber-400">{pendingCount}</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Approved Today</div><div className="text-xl font-bold text-emerald-400">12</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Rejected Today</div><div className="text-xl font-bold text-rose-400">2</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Avg Response Time</div><div className="text-xl font-bold text-text-primary">8 min</div></div>
      </div>

      {/* Pending Queue */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Pending Approvals</h3>
      <div className="space-y-3 mb-8">
        {queue.filter(r => r.status === "pending").map(request => {
          const isExpanded = expandedId === request.id;
          const riskStyle = RISK_STYLES[request.risk];
          return (
            <div key={request.id} className={`glass-card p-4 transition-all ${request.risk === "critical" ? "!border-rose-500/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{request.agentIcon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">{request.action}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${riskStyle.bg} ${riskStyle.text}`}>{request.risk}</span>
                    </div>
                    <div className="text-[11px] text-text-muted">{request.agentName} · {request.timestamp} · Gate: {request.gate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedId(isExpanded ? null : request.id)} className="btn-secondary text-[11px] !py-1">{isExpanded ? "▲" : "▼"}</button>
                  <button onClick={() => handleAction(request.id, "rejected")} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25">✕ Reject</button>
                  <button onClick={() => handleAction(request.id, "approved")} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25">✓ Approve</button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                  <p className="text-sm text-text-primary mb-3">{request.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(request.data).map(([key, value]) => (
                      <span key={key} className="text-[10px] px-2 py-1 rounded bg-navy-800 text-text-muted font-mono">
                        {key}: <span className="text-text-primary">{String(value)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {queue.filter(r => r.status === "pending").length === 0 && (
          <div className="glass-card p-8 text-center text-text-muted text-sm">✅ No pending approvals — all clear!</div>
        )}
      </div>

      {/* Completed */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Recent History</h3>
      <div className="space-y-2">
        {[...queue.filter(r => r.status !== "pending"), ...COMPLETED].map(r => (
          <div key={r.id} className="glass-card px-4 py-2.5 flex items-center justify-between opacity-60">
            <div className="flex items-center gap-2">
              <span>{r.agentIcon}</span>
              <span className="text-sm text-text-secondary">{r.action}</span>
              <span className="text-[10px] text-text-muted">{r.timestamp}</span>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
              {r.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
