"use client";

import { useState } from "react";

// ═══ Notification Data ═══

interface Notification {
  id: string; type: "alert" | "system" | "agent" | "security" | "billing";
  title: string; message: string; time: string; read: boolean;
  severity?: "critical" | "warning" | "info" | "success";
  agent?: string; actionUrl?: string; actionLabel?: string;
}

const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "alert", title: "High-risk transaction blocked", message: "$45,200 transfer to new beneficiary blocked automatically. Risk score: 0.94. Originating from unusual geo-location (Lagos, Nigeria).", time: "2 min ago", read: false, severity: "critical", agent: "Fraud Monitoring Agent", actionLabel: "Review Transaction" },
  { id: "n2", type: "security", title: "API key rotation reminder", message: "Production API key 'sk-prod-****7a9f' has not been rotated in 25 days. Security policy recommends rotation every 30 days.", time: "15 min ago", read: false, severity: "warning", actionLabel: "Rotate Key" },
  { id: "n3", type: "agent", title: "Compliance threshold approaching", message: "Monthly AML screening quota at 92% utilization. Projected to exceed limit by March 28. Consider increasing allocation.", time: "35 min ago", read: false, severity: "warning", agent: "Compliance Agent", actionLabel: "Adjust Quota" },
  { id: "n4", type: "system", title: "Model upgrade available", message: "GPT-4o-2026-03 is now available. Performance benchmarks show 12% improvement in fraud detection accuracy and 8% faster inference.", time: "1 hour ago", read: false, severity: "info", actionLabel: "View Benchmark" },
  { id: "n5", type: "agent", title: "Customer Support Agent: 500 auto-resolved", message: "Milestone reached: 500 tickets auto-resolved this week. Current auto-resolution rate: 73%. Average CSAT: 4.6/5.", time: "2 hours ago", read: true, severity: "success", agent: "Customer Support Agent" },
  { id: "n6", type: "alert", title: "API latency spike detected", message: "Average response time increased from 120ms to 890ms for payment gateway integration over the last 15 minutes.", time: "3 hours ago", read: true, severity: "warning", agent: "Operations Agent", actionLabel: "View Metrics" },
  { id: "n7", type: "system", title: "Scheduled maintenance: March 29", message: "Planned infrastructure maintenance from 02:00–04:00 SAST. Agent execution queues will be paused during this window.", time: "5 hours ago", read: true, severity: "info" },
  { id: "n8", type: "billing", title: "Usage report: February 2026", message: "Total agent executions: 42,580. LLM token usage: 18.4M tokens. Estimated cost: $2,847. 12% under budget.", time: "1 day ago", read: true, severity: "info", actionLabel: "View Report" },
  { id: "n9", type: "agent", title: "Weekly executive report sent", message: "Q1 2026 Interim Report compiled and distributed to 5 C-suite recipients. 14 pages, 23 charts.", time: "2 days ago", read: true, severity: "success", agent: "Reporting Agent" },
  { id: "n10", type: "security", title: "New login from unrecognized device", message: "James van der Merwe (james@swifter.digital) logged in from a new device: MacBook Pro, Johannesburg. No action required if expected.", time: "2 days ago", read: true, severity: "info" },
];

interface Webhook {
  id: string; name: string; url: string; events: string[]; status: "active" | "paused" | "failing";
  lastTriggered: string; successRate: string;
}

const WEBHOOKS: Webhook[] = [
  { id: "wh1", name: "Slack Alerts Channel", url: "https://hooks.slack.com/services/T0****/B0****", events: ["alert.critical", "alert.warning", "agent.error"], status: "active", lastTriggered: "2 min ago", successRate: "99.8%" },
  { id: "wh2", name: "PagerDuty Escalation", url: "https://events.pagerduty.com/v2/enqueue", events: ["alert.critical", "agent.error"], status: "active", lastTriggered: "5 hours ago", successRate: "100%" },
  { id: "wh3", name: "Email Digest (Daily)", url: "internal://email-digest", events: ["report.generated", "billing.update"], status: "active", lastTriggered: "6 hours ago", successRate: "100%" },
  { id: "wh4", name: "Custom SIEM Integration", url: "https://siem.company.com/api/ingest", events: ["security.*", "alert.*"], status: "failing", lastTriggered: "2 days ago", successRate: "78.2%" },
];

const typeIcons: Record<string, string> = { alert: "🚨", system: "⚙️", agent: "🤖", security: "🔒", billing: "💳" };
const severityStyles: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: "border-rose-500/20", bg: "bg-rose-500/5", text: "text-rose-400", dot: "bg-rose-400" },
  warning: { border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400", dot: "bg-amber-400" },
  info: { border: "border-electric-500/20", bg: "bg-electric-500/5", text: "text-electric-400", dot: "bg-electric-400" },
  success: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-400" },
};
const webhookStatusColors: Record<string, string> = { active: "text-emerald-400 bg-emerald-500/10", paused: "text-amber-400 bg-amber-500/10", failing: "text-rose-400 bg-rose-500/10" };

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"notifications" | "webhooks" | "preferences">("notifications");
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  function markAllRead() { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }
  function markRead(id: string) { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-text-secondary mt-1">Alerts, system events, and webhook management</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{unreadCount}</span>
          )}
        </div>
        {activeTab === "notifications" && unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-electric-400 hover:text-electric-300 font-medium transition-colors">Mark all read</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Unread", value: unreadCount, icon: "🔔", gradient: "from-rose-500 to-pink-500" },
          { label: "Critical Alerts", value: notifications.filter(n => n.severity === "critical").length, icon: "🚨", gradient: "from-amber-500 to-orange-500" },
          { label: "Active Webhooks", value: WEBHOOKS.filter(w => w.status === "active").length, icon: "🪝", gradient: "from-electric-500 to-cyan-500" },
          { label: "Events Today", value: "247", icon: "📊", gradient: "from-violet-500 to-purple-500" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-lg`}>{s.icon}</div>
              <div><div className="text-xl font-bold text-text-primary">{s.value}</div><div className="text-[10px] text-text-muted">{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "notifications" as const, label: "Notifications" },
          { key: "webhooks" as const, label: "Webhooks" },
          { key: "preferences" as const, label: "Preferences" },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.key ? "border-electric-500 text-electric-400" : "border-transparent text-text-muted hover:text-text-secondary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["all", "alert", "agent", "security", "system", "billing"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[10px] font-medium rounded-lg capitalize transition-colors ${f === filter ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
                {f === "all" ? `All (${notifications.length})` : `${typeIcons[f] || ""} ${f} (${notifications.filter(n => n.type === f).length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map(n => {
              const style = severityStyles[n.severity || "info"];
              return (
                <div key={n.id} onClick={() => markRead(n.id)}
                  className={`glass-card p-5 cursor-pointer transition-all hover:border-electric-500/20 ${!n.read ? `border-l-2 ${style.border} ${style.bg}` : "opacity-70"}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-xl mt-0.5">{typeIcons[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold ${!n.read ? "text-text-primary" : "text-text-secondary"}`}>{n.title}</h3>
                        {!n.read && <span className={`w-2 h-2 rounded-full ${style.dot}`} />}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${style.bg} ${style.text}`}>{n.severity}</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-text-muted">{n.time}</span>
                        {n.agent && <span className="text-[10px] text-electric-400 font-medium">{n.agent}</span>}
                        {n.actionLabel && <button className="text-[10px] text-electric-400 hover:text-electric-300 font-semibold ml-auto">{n.actionLabel} →</button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Webhooks Tab */}
      {activeTab === "webhooks" && (
        <div className="space-y-4 animate-fade-in">
          <button className="btn-primary flex items-center gap-2 text-sm"><span className="text-lg leading-none">+</span> Add Webhook</button>
          {WEBHOOKS.map(wh => (
            <div key={wh.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-lg">🪝</div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{wh.name}</h3>
                    <code className="text-[10px] text-text-muted font-mono">{wh.url.length > 50 ? wh.url.slice(0, 50) + "..." : wh.url}</code>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${webhookStatusColors[wh.status]}`}>{wh.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {wh.events.map(e => <span key={e} className="text-[9px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono">{e}</span>)}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-text-muted pt-3 border-t border-white/5">
                <span>Last triggered: {wh.lastTriggered}</span><span>•</span><span>Success rate: <span className={wh.successRate === "100%" ? "text-emerald-400" : parseFloat(wh.successRate) > 95 ? "text-emerald-400" : "text-rose-400"}>{wh.successRate}</span></span>
                <div className="ml-auto flex gap-2">
                  <button className="text-[10px] text-electric-400 hover:text-electric-300 font-medium">Edit</button>
                  <button className="text-[10px] text-electric-400 hover:text-electric-300 font-medium">Test</button>
                  <button className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Notification Channels</h3>
            <div className="space-y-4">
              {[
                { channel: "Email Notifications", desc: "Receive alerts and reports via email", enabled: true },
                { channel: "Slack Integration", desc: "Post alerts to designated Slack channels", enabled: true },
                { channel: "SMS Alerts", desc: "Critical alerts sent via SMS (Twilio)", enabled: false },
                { channel: "Browser Push", desc: "Desktop push notifications for real-time alerts", enabled: true },
                { channel: "Mobile Push", desc: "Push notifications to mobile app", enabled: false },
              ].map(ch => (
                <div key={ch.channel} className="flex items-center justify-between p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{ch.channel}</div>
                    <div className="text-[10px] text-text-muted">{ch.desc}</div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${ch.enabled ? "bg-electric-500" : "bg-navy-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${ch.enabled ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Alert Thresholds</h3>
            <div className="space-y-4">
              {[
                { name: "Critical alerts", desc: "Always delivered immediately to all channels", level: "critical" },
                { name: "Warning alerts", desc: "Batched every 5 minutes, delivered to email + Slack", level: "warning" },
                { name: "Info notifications", desc: "Included in daily digest email only", level: "info" },
                { name: "Success milestones", desc: "Included in weekly summary report", level: "success" },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/30">
                  <span className={`w-3 h-3 rounded-full ${severityStyles[t.level].dot}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">{t.name}</div>
                    <div className="text-[10px] text-text-muted">{t.desc}</div>
                  </div>
                  <button className="text-[10px] text-electric-400 hover:text-electric-300 font-medium">Configure</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
