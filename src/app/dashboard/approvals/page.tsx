"use client";

import { useState } from "react";

// ═══ Demo Data ═══

const pendingGates = [
  { id: "gate_1", agentName: "Fraud Monitoring Agent", action: "Block transaction and freeze account", priority: "critical" as const, reason: "Transaction of $78,500 to Cyprus exceeds $50K threshold with risk score 0.92", context: { transactionId: "txn_892341", amount: "$78,500", country: "Cyprus", riskScore: "0.92", customer: "Apex Holdings Ltd" }, requestedAt: "12 min ago" },
  { id: "gate_2", agentName: "Compliance Agent", action: "Override sanctions screening result", priority: "high" as const, reason: "Partial OFAC match (67%) for Global Trade Corp — requires human verification", context: { entity: "Global Trade Corp", matchType: "Partial", matchScore: "67%", listSource: "OFAC SDN" }, requestedAt: "34 min ago" },
  { id: "gate_3", agentName: "Fraud Monitoring Agent", action: "Send alert to payment processor", priority: "medium" as const, reason: "Customer cust_4521 has 15 transactions in the last hour (normal: 3)", context: { customerId: "cust_4521", transactionsInHour: "15", normalAvg: "3", alertType: "Velocity Check" }, requestedAt: "1 hour ago" },
];

const recentHistory = [
  { agentName: "Fraud Agent", action: "Block account", decision: "approved", respondedBy: "Sarah Kim", time: "2 hours ago" },
  { agentName: "Compliance Agent", action: "Override KYC result", decision: "rejected", respondedBy: "Malcolm Chen", time: "5 hours ago" },
  { agentName: "Fraud Agent", action: "Escalate to legal", decision: "approved", respondedBy: "James Rodriguez", time: "Yesterday" },
  { agentName: "Operations Agent", action: "Restart service", decision: "approved", respondedBy: "Sarah Kim", time: "Yesterday" },
];

const stats = { pending: 3, approvedToday: 8, rejectedToday: 2, avgResponseTime: "18 min" };

const priorityStyles: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

// ═══ Page ═══

export default function ApprovalsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "history">("pending");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Approval Gates</h1>
          <p className="text-text-secondary mt-1">Human-in-the-loop checkpoints for high-stakes agent actions</p>
        </div>
        <div className="flex gap-1">
          {(["pending", "history", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${f === filter ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
              {f} {f === "pending" && `(${stats.pending})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats.pending, color: "text-amber-400", icon: "⏳" },
          { label: "Approved Today", value: stats.approvedToday, color: "text-emerald-400", icon: "✓" },
          { label: "Rejected Today", value: stats.rejectedToday, color: "text-rose-400", icon: "✕" },
          { label: "Avg Response", value: stats.avgResponseTime, color: "text-electric-400", icon: "⚡" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className="text-2xl">{s.icon}</div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      {(filter === "pending" || filter === "all") && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Pending Approvals</h2>
          {pendingGates.map((gate) => (
            <div key={gate.id} className="glass-card p-5 hover:border-electric-500/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priorityStyles[gate.priority]}`}>{gate.priority}</span>
                <span className="text-xs font-medium text-electric-400">{gate.agentName}</span>
                <span className="text-[10px] text-text-muted ml-auto">{gate.requestedAt}</span>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{gate.action}</h3>
              <p className="text-xs text-text-muted mb-3">{gate.reason}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {Object.entries(gate.context).map(([key, val]) => (
                  <div key={key} className="p-2 rounded-lg bg-navy-800/40">
                    <div className="text-[9px] text-text-muted uppercase">{key.replace(/([A-Z])/g, " $1")}</div>
                    <div className="text-xs font-semibold text-text-primary mt-0.5">{val}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                  Approve
                </button>
                <button className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {(filter === "history" || filter === "all") && (
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Decisions</h2>
          <div className="space-y-3">
            {recentHistory.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-navy-800/30">
                <div className={`w-2 h-2 rounded-full ${item.decision === "approved" ? "bg-emerald-400" : "bg-rose-400"}`} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-text-primary">{item.agentName}: {item.action}</div>
                  <div className="text-[10px] text-text-muted">by {item.respondedBy}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.decision === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                  {item.decision}
                </span>
                <span className="text-[10px] text-text-muted w-20 text-right">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
