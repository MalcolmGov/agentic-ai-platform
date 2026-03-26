"use client";

import { useState } from "react";
import { SearchIcon } from "@/components/icons";

const logs = [
  { id: "log-001", timestamp: "2026-03-24 19:49:12", level: "INFO", agent: "Fraud Monitoring Agent", message: "Transaction batch analyzed: 142 transactions, 3 flagged", source: "fraud-monitor-01", traceId: "abc123" },
  { id: "log-002", timestamp: "2026-03-24 19:48:55", level: "WARN", agent: "Webhook Dispatcher", message: "Retry attempt 2/3 for endpoint https://api.partner.com/notify", source: "webhook-engine", traceId: "def456" },
  { id: "log-003", timestamp: "2026-03-24 19:48:30", level: "INFO", agent: "Compliance Agent", message: "KYC verification completed for batch #B-2847. 23 approved, 1 flagged for review", source: "compliance-01", traceId: "ghi789" },
  { id: "log-004", timestamp: "2026-03-24 19:47:15", level: "ERROR", agent: "Customer Support Agent", message: "LLM API timeout after 30s. Request ID: req_7f8a9b. Falling back to template response", source: "support-agent-03", traceId: "jkl012" },
  { id: "log-005", timestamp: "2026-03-24 19:46:58", level: "INFO", agent: "Document Processing Agent", message: "Invoice #INV-2024-1847 parsed successfully. Amount: $14,250.00, Vendor: Acme Corp", source: "doc-processor", traceId: "mno345" },
  { id: "log-006", timestamp: "2026-03-24 19:45:32", level: "INFO", agent: "Finance Agent", message: "Daily reconciliation complete. 847 transactions matched, 3 discrepancies flagged", source: "finance-agent-01", traceId: "pqr678" },
  { id: "log-007", timestamp: "2026-03-24 19:44:10", level: "WARN", agent: "Operations Agent", message: "Memory usage at 82% on agent-worker-05. Consider scaling horizontally", source: "ops-monitor", traceId: "stu901" },
  { id: "log-008", timestamp: "2026-03-24 19:43:45", level: "INFO", agent: "Reporting Agent", message: "Q1 2026 Executive Summary generated. 14 pages, 23 charts. Sent to 5 recipients", source: "reporting-01", traceId: "vwx234" },
  { id: "log-009", timestamp: "2026-03-24 19:42:20", level: "INFO", agent: "Email Agent", message: "Processed 14 inbound emails. 8 auto-responded, 4 routed to support, 2 archived", source: "email-agent-02", traceId: "yza567" },
  { id: "log-010", timestamp: "2026-03-24 19:41:00", level: "ERROR", agent: "Data Analyst Agent", message: "Query timeout on analytics_warehouse.transactions_2026. Query exceeded 60s limit", source: "analyst-agent-01", traceId: "bcd890" },
  { id: "log-011", timestamp: "2026-03-24 19:39:45", level: "INFO", agent: "Workflow Automation Agent", message: "Workflow 'Invoice Processing Pipeline' completed successfully. 6/6 steps passed", source: "workflow-engine", traceId: "efg123" },
  { id: "log-012", timestamp: "2026-03-24 19:38:22", level: "INFO", agent: "Fraud Monitoring Agent", message: "High-risk transaction detected: $45,200 transfer to new beneficiary. Risk score: 0.94", source: "fraud-monitor-01", traceId: "hij456" },
];

const auditEvents = [
  { time: "19:50:01", user: "admin@acme.com", action: "agent.execute", resource: "Fraud Monitoring Agent", ip: "10.0.1.45" },
  { time: "19:48:33", user: "system", action: "workflow.trigger", resource: "Fraud Alert Pipeline", ip: "internal" },
  { time: "19:45:12", user: "ops@acme.com", action: "integration.update", resource: "Slack Connector", ip: "10.0.1.89" },
  { time: "19:42:07", user: "admin@acme.com", action: "agent.config.update", resource: "Customer Support Agent", ip: "10.0.1.45" },
  { time: "19:38:55", user: "system", action: "alert.create", resource: "High-risk transaction", ip: "internal" },
  { time: "19:35:20", user: "security@acme.com", action: "apikey.rotate", resource: "Production API Key", ip: "10.0.1.23" },
];

const levelColors: Record<string, string> = {
  INFO: "badge-info",
  WARN: "badge-warning",
  ERROR: "badge-error",
  DEBUG: "badge-neutral",
};

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "audit">("logs");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) && !log.agent.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Logs & Audit Trail</h1>
        <p className="text-text-secondary mt-1">Monitor agent activity and track all system events</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {(["logs", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-electric-500 text-electric-400"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab === "logs" ? "System Logs" : "Audit Trail"}
          </button>
        ))}
      </div>

      {activeTab === "logs" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="input-field pl-10 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {["all", "INFO", "WARN", "ERROR"].map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                    levelFilter === level
                      ? "bg-electric-500/15 text-electric-400"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Log entries */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-navy-900/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-44">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-20">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-48">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="table-row group">
                      <td className="px-4 py-3 text-xs font-mono text-text-muted">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] ${levelColors[log.level]}`}>{log.level}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{log.agent}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "audit" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-navy-900/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3 text-xs font-mono text-text-muted">{event.time}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{event.user}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info text-[10px] font-mono">{event.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">{event.resource}</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-muted">{event.ip}</td>
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
