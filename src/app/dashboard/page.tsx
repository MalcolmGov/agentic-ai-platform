"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AgentIcon, ArrowTrendUpIcon, ExclamationTriangleIcon, CpuIcon, KeyIcon } from "@/components/icons";

// ─── Sparkline SVG Component ───────────────
function Sparkline({ data, color, height = 32, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  const fillPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sparkGrad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Donut Chart Component ─────────────────
function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let accOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLength = pct * circumference;
        const offset = accOffset;
        accOffset += dashLength;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="10"
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={-offset} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} opacity="0.85"
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-text-primary text-lg font-bold">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-text-muted text-[9px]">executions</text>
    </svg>
  );
}

// ─── Skeleton Loader ───────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-navy-800" />
        <div className="w-20 h-5 rounded bg-navy-800" />
      </div>
      <div className="h-8 w-20 rounded bg-navy-800 mb-1" />
      <div className="h-3 w-24 rounded bg-navy-800" />
    </div>
  );
}

// ─── Static Spark / Chart Data ─────────────

const sparkData = {
  agents:     [5, 6, 7, 8, 8, 9, 10, 11, 10, 12, 11, 13],
  executions: [180, 220, 320, 480, 420, 560, 680, 750, 820, 920, 1100, 1400],
  alerts:     [12, 9, 11, 8, 7, 6, 5, 7, 6, 4, 5, 4],
  api:        [12, 18, 22, 28, 32, 35, 38, 40, 42, 44, 46, 48],
};

const hourlyActivity = [35, 22, 18, 15, 12, 28, 55, 120, 180, 210, 195, 240, 220, 190, 175, 210, 250, 280, 260, 220, 180, 145, 110, 75];

const agentPerformance = [
  { name: "Fraud Monitoring", icon: "🛡️", executions: 487, success: 99.4, avgTime: "4.2s", trend: "+12%", color: "from-rose-500 to-orange-500", sparkData: [30, 35, 42, 38, 45, 50, 48, 55, 60, 58, 62, 65] },
  { name: "IT Helpdesk", icon: "🎫", executions: 342, success: 97.8, avgTime: "1.2s", trend: "+28%", color: "from-cyan-500 to-blue-500", sparkData: [15, 20, 25, 30, 28, 35, 40, 38, 45, 48, 50, 55] },
  { name: "Review Agent", icon: "📱", executions: 298, success: 98.6, avgTime: "2.3s", trend: "+45%", color: "from-pink-500 to-rose-500", sparkData: [8, 12, 18, 22, 28, 32, 35, 38, 40, 42, 45, 48] },
  { name: "Competitive Intel", icon: "🔍", executions: 156, success: 99.1, avgTime: "7.8s", trend: "+8%", color: "from-amber-500 to-red-500", sparkData: [10, 12, 11, 14, 13, 15, 14, 16, 15, 17, 16, 18] },
  { name: "Compliance", icon: "⚖️", executions: 412, success: 99.7, avgTime: "12.8s", trend: "+15%", color: "from-violet-500 to-indigo-500", sparkData: [25, 28, 32, 30, 35, 38, 36, 40, 42, 44, 46, 48] },
  { name: "Support Agent", icon: "💬", executions: 524, success: 96.2, avgTime: "3.8s", trend: "+22%", color: "from-sky-500 to-cyan-500", sparkData: [30, 35, 38, 42, 40, 45, 48, 50, 52, 55, 58, 62] },
];

const donutSegments = [
  { label: "Fraud", value: 487, color: "#f43f5e" },
  { label: "Helpdesk", value: 342, color: "#06b6d4" },
  { label: "Reviews", value: 298, color: "#ec4899" },
  { label: "Compliance", value: 412, color: "#8b5cf6" },
  { label: "Support", value: 524, color: "#0ea5e9" },
  { label: "Others", value: 784, color: "#6366f1" },
];

const recentExecutions = [
  { agent: "Fraud Monitoring", icon: "🛡️", status: "completed", time: "2 min ago", duration: "4.2s", result: "3 alerts generated — $48.5K wire flagged", gradient: "from-rose-500 to-orange-500" },
  { agent: "IT Helpdesk", icon: "🎫", status: "completed", time: "4 min ago", duration: "1.2s", result: "TKT-4001 auto-resolved — password reset", gradient: "from-cyan-500 to-blue-500" },
  { agent: "Review Agent", icon: "📱", status: "completed", time: "6 min ago", duration: "8.7s", result: "47 reviews processed — 3 escalated to support", gradient: "from-pink-500 to-rose-500" },
  { agent: "Competitive Intel", icon: "🔍", status: "completed", time: "12 min ago", duration: "7.8s", result: "NexaFlow $42M Series B detected — alert sent", gradient: "from-amber-500 to-red-500" },
  { agent: "Compliance", icon: "⚖️", status: "running", time: "Just now", duration: "—", result: "Processing KYC batch — 8/12 screened", gradient: "from-violet-500 to-indigo-500" },
  { agent: "Finance Agent", icon: "💰", status: "completed", time: "18 min ago", duration: "6.4s", result: "1,247 transactions reconciled — $3.89M", gradient: "from-amber-500 to-yellow-500" },
  { agent: "Support Agent", icon: "💬", status: "failed", time: "25 min ago", duration: "1.2s", result: "API timeout — auto-retry scheduled in 5 min", gradient: "from-sky-500 to-cyan-500" },
  { agent: "Reporting Agent", icon: "📊", status: "completed", time: "30 min ago", duration: "8.1s", result: "Q1 executive report generated — 12 charts", gradient: "from-emerald-500 to-teal-500" },
];

const systemHealth = [
  { name: "Agent Orchestrator", status: "operational", uptime: 99.99, load: 34 },
  { name: "LLM Gateway", status: "operational", uptime: 99.95, load: 62 },
  { name: "Vector Database", status: "operational", uptime: 99.97, load: 28 },
  { name: "Job Scheduler", status: "operational", uptime: 99.92, load: 45 },
  { name: "Webhook Dispatcher", status: "degraded", uptime: 98.20, load: 89 },
  { name: "Redis Cache", status: "operational", uptime: 99.99, load: 18 },
];

// ─── Types ─────────────────────────────────

interface DashboardStats {
  agents: { total: number; active: number };
  executions: { total: number; completed: number; failed: number; successRate: number };
  alerts: { active: number };
  cost: { totalUsd: number };
  performance: { avgDurationMs: number };
  recentActivity: { action: string; resource: string; createdAt: string; userId: string | null }[];
  source: "database" | "mock";
}

// ─── Page ──────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [apiStats, setApiStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect new users to onboarding if not yet completed (local + server)
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      let localDone = false;
      try {
        const raw =
          localStorage.getItem("swifter_onboarding_v2") ||
          localStorage.getItem("agentic_onboarding_v1");
        if (raw) {
          const state = JSON.parse(raw) as { completed?: boolean };
          localDone = !!state.completed;
        }
      } catch {
        // fall through
      }
      if (localDone) return;
      try {
        const r = await fetch("/api/onboarding/progress", { cache: "no-store" });
        const j = await r.json();
        if (j?.success && (j.data?.done === true || j.data?.state?.completed === true)) {
          return;
        }
      } catch {
        // network / no DB
      }
      if (!localDone) {
        router.push("/onboarding");
      }
    })();
  }, [router]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApiStats(data.data as DashboardStats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxHourly = Math.max(...hourlyActivity);

  // Derive display values — prefer API data, fall back to static
  const activeAgents = apiStats?.agents.active ?? 13;
  const totalAgents  = apiStats?.agents.total  ?? 13;
  const totalExecs   = apiStats?.executions.total ?? 2847;
  const successRate  = apiStats?.executions.successRate ?? 98;
  const activeAlerts = apiStats?.alerts.active ?? 4;
  const isLive       = apiStats?.source === "database";

  const kpiCards = [
    {
      label: "Active Agents",
      value: String(activeAgents),
      change: `${totalAgents} total`,
      icon: AgentIcon,
      color: "from-electric-500 to-cyan-500",
      badge: "badge-active",
      sparkData: sparkData.agents,
      sparkColor: "#3b82f6",
    },
    {
      label: "Executions Today",
      value: totalExecs.toLocaleString(),
      change: `${successRate}% success`,
      icon: CpuIcon,
      color: "from-emerald-500 to-emerald-400",
      badge: "badge-active",
      sparkData: sparkData.executions,
      sparkColor: "#10b981",
    },
    {
      label: "Active Alerts",
      value: String(activeAlerts),
      change: activeAlerts > 0 ? `${activeAlerts} need review` : "All clear",
      icon: ExclamationTriangleIcon,
      color: "from-amber-500 to-amber-400",
      badge: activeAlerts > 0 ? "badge-warning" : "badge-active",
      sparkData: sparkData.alerts,
      sparkColor: "#f59e0b",
    },
    {
      label: "API Calls (24h)",
      value: "47.8K",
      change: "+24.1%",
      icon: KeyIcon,
      color: "from-violet-500 to-violet-400",
      badge: "badge-info",
      sparkData: sparkData.api,
      sparkColor: "#8b5cf6",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Real-time monitoring across {totalAgents} autonomous agents
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Data source badge */}
          {!loading && (
            <span className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border ${
              isLive
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-amber-500/30 text-amber-400 bg-amber-500/10"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isLive ? "Live data" : "Demo data"}
            </span>
          )}
          <span className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live — last updated 12s ago
          </span>
        </div>
      </div>

      {/* ═══ KPI Cards with Sparklines ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiCards.map((stat, i) => (
              <div key={stat.label} className="group relative overflow-hidden glass-card p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_-12px_rgba(59,130,246,0.12)]" style={{ animationDelay: `${i * 60}ms` }}>
                {/* Gradient top line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                {/* Glow */}
                <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700`} />

                <div className="relative flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`badge ${stat.badge} text-[10px]`}>
                    <ArrowTrendUpIcon className="w-3 h-3" />
                    {stat.change}
                  </span>
                </div>
                <div className="relative flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
                    <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                  </div>
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={stat.sparkData} color={stat.sparkColor} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* ═══ Row 2: Activity Chart + Agent Breakdown Donut ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-6 group">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Agent Activity</h2>
              <p className="text-xs text-text-muted">Executions per hour — last 24 hours</p>
            </div>
            <div className="flex gap-1">
              {["24h", "7d", "30d"].map((p) => (
                <button key={p} className={`px-3 py-1 text-[10px] font-medium rounded-lg transition-colors ${p === "24h" ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>{p}</button>
              ))}
            </div>
          </div>
          {/* SVG Bar Chart — immune to hydration issues */}
          <svg viewBox="0 0 720 200" className="w-full h-52" preserveAspectRatio="none">
            <defs>
              <linearGradient id="barHigh" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#059669" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
              <linearGradient id="barMid" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#60a5fa" /></linearGradient>
              <linearGradient id="barLow" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#818cf8" /></linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 50, 100, 150].map(y => (
              <line key={y} x1="0" y1={y} x2="720" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            {/* Bars */}
            {hourlyActivity.map((val, i) => {
              const barH = (val / maxHourly) * 190;
              const pct = (val / maxHourly) * 100;
              const fill = pct > 70 ? "url(#barHigh)" : pct > 40 ? "url(#barMid)" : "url(#barLow)";
              const barW = 720 / hourlyActivity.length - 3;
              const x = i * (720 / hourlyActivity.length) + 1.5;
              return <rect key={i} x={x} y={200 - barH} width={barW} height={barH} fill={fill} rx="2" />;
            })}
          </svg>
          <div className="flex justify-between mt-1.5 text-[9px] text-text-muted">
            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span>
          </div>
          {/* Mini stats under chart */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
            {[
              { label: "Peak Hour", value: "17:00", sub: "280 executions", color: "text-emerald-400" },
              { label: "Avg / Hour", value: "118.6", sub: "±42 std dev", color: "text-electric-400" },
              { label: "Throughput", value: `${successRate}%`, sub: "success rate", color: "text-violet-400" },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-text-muted">{m.label}</div>
                <div className="text-[9px] text-text-muted/60">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Breakdown Donut */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-1">Agent Breakdown</h2>
          <p className="text-xs text-text-muted mb-4">Executions by agent type today</p>
          <div className="flex justify-center mb-4">
            <DonutChart segments={donutSegments} size={140} />
          </div>
          <div className="space-y-2">
            {donutSegments.map(seg => (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-text-secondary">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">{seg.value}</span>
                  <span className="text-[9px] text-text-muted">{((seg.value / donutSegments.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Row 3: Agent Performance Grid ═══ */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-3">Agent Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentPerformance.map((agent, i) => (
            <div key={agent.name} className="group relative overflow-hidden glass-card p-5 transition-all duration-500 hover:-translate-y-1 hover:border-electric-500/30 hover:shadow-[0_16px_48px_-12px_rgba(59,130,246,0.1)]" style={{ animationDelay: `${i * 50}ms` }}>
              {/* Accent bar */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${agent.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
              {/* Glow */}
              <div className={`absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br ${agent.color} rounded-full blur-3xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700`} />

              <div className="relative flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`} style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.3)" }}>
                    {agent.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{agent.name}</div>
                    <div className="text-[10px] text-text-muted">{agent.executions.toLocaleString()} executions</div>
                  </div>
                </div>
                <span className="badge badge-active text-[9px]">{agent.trend}</span>
              </div>

              {/* Success rate bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-text-muted">Success Rate</span>
                  <span className="text-[10px] font-bold text-emerald-400">{agent.success}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-navy-800 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${agent.color} transition-all duration-1000`} style={{ width: `${agent.success}%` }} />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-text-muted">Avg: <span className="text-text-secondary font-mono">{agent.avgTime}</span></div>
                <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                  <Sparkline data={agent.sparkData} color="#3b82f6" width={60} height={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Row 4: Recent Executions + System Health ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Executions */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Recent Executions</h2>
              <p className="text-xs text-text-muted mt-0.5">Live agent activity feed</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recentExecutions.map((exec, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${exec.gradient} flex items-center justify-center text-base shrink-0 shadow-lg`} style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                  {exec.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{exec.agent}</span>
                    <span className={`inline-flex items-center gap-1 badge text-[9px] ${exec.status === "completed" ? "badge-active" : exec.status === "running" ? "badge-info" : "badge-error"}`}>
                      <span className={`w-1 h-1 rounded-full ${exec.status === "completed" ? "bg-emerald-400" : exec.status === "running" ? "bg-electric-400 animate-pulse" : "bg-rose-400"}`} />
                      {exec.status}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted truncate">{exec.result}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-text-secondary">{exec.duration}</div>
                  <div className="text-[9px] text-text-muted">{exec.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">System Health</h2>
              <p className="text-xs text-text-muted">Infrastructure status</p>
            </div>
            <span className="badge badge-active text-[9px]">99.84% SLA</span>
          </div>
          <div className="space-y-3">
            {systemHealth.map(svc => (
              <div key={svc.name} className="p-3 rounded-xl bg-navy-800/40 hover:bg-navy-800/60 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${svc.status === "operational" ? "bg-emerald-400" : "bg-amber-400"} ${svc.status === "operational" ? "" : "animate-pulse"}`} />
                    <span className="text-xs font-medium text-text-primary">{svc.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-secondary">{svc.uptime}%</span>
                </div>
                {/* Load bar */}
                <div className="h-1 rounded-full bg-navy-900 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${svc.load > 80 ? "bg-rose-500" : svc.load > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${svc.load}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-text-muted">Load</span>
                  <span className={`text-[9px] font-mono ${svc.load > 80 ? "text-rose-400" : svc.load > 50 ? "text-amber-400" : "text-emerald-400"}`}>{svc.load}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
