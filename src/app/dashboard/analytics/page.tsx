"use client";

import { useState } from "react";

// ═══ SVG Chart Components ═══

function LineChart({ data, width = 600, height = 180, color = "#3b82f6", gradientId = "lc" }: { data: number[]; width?: number; height?: number; color?: string; gradientId?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 20 - ((v - min) / range) * (height - 40);
    return `${x},${y}`;
  });
  const pathD = `M${pts.join(" L")}`;
  const areaD = `${pathD} L${width},${height - 20} L0,${height - 20} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = 20 + pct * (height - 40);
        const val = Math.round(max - pct * range);
        return (
          <g key={pct}>
            <line x1="30" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x="25" y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">{val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}</text>
          </g>
        );
      })}
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - 20 - ((v - min) / range) * (height - 40);
        return i % 2 === 0 ? <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="#0a0e1a" strokeWidth="2" /> : null;
      })}
    </svg>
  );
}

function HeatMap({ data, xLabels, yLabels }: { data: number[][]; xLabels: string[]; yLabels: string[] }) {
  const flat = data.flat();
  const max = Math.max(...flat);
  const cellW = 100 / xLabels.length;
  const cellH = 100 / yLabels.length;
  function getColor(v: number) {
    const pct = v / max;
    if (pct > 0.8) return "#22c55e";
    if (pct > 0.6) return "#3b82f6";
    if (pct > 0.4) return "#8b5cf6";
    if (pct > 0.2) return "#6366f1";
    return "#1e1b4b";
  }
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${xLabels.length * 42 + 60} ${yLabels.length * 32 + 30}`} className="w-full">
        {yLabels.map((yl, yi) => (
          <text key={`yl-${yi}`} x="55" y={yi * 32 + 26} fill="#64748b" fontSize="9" textAnchor="end">{yl}</text>
        ))}
        {xLabels.map((xl, xi) => (
          <text key={`xl-${xi}`} x={xi * 42 + 60 + 18} y={yLabels.length * 32 + 22} fill="#64748b" fontSize="8" textAnchor="middle">{xl}</text>
        ))}
        {data.map((row, yi) =>
          row.map((val, xi) => (
            <g key={`${yi}-${xi}`}>
              <rect x={xi * 42 + 60} y={yi * 32 + 10} width="38" height="28" rx="4" fill={getColor(val)} opacity="0.85" />
              <text x={xi * 42 + 60 + 19} y={yi * 32 + 28} fill="white" fontSize="9" textAnchor="middle" fontWeight="600">{val}</text>
            </g>
          ))
        )}
      </svg>
    </div>
  );
}

function DonutChart({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -90;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[180px]">
      {segments.map((seg) => {
        const angle = (seg.value / total) * 360;
        const endAngle = startAngle + angle;
        const largeArc = angle > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos((Math.PI / 180) * startAngle);
        const y1 = cy + r * Math.sin((Math.PI / 180) * startAngle);
        const x2 = cx + r * Math.cos((Math.PI / 180) * endAngle);
        const y2 = cy + r * Math.sin((Math.PI / 180) * endAngle);
        const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
        startAngle = endAngle;
        return <path key={seg.label} d={d} fill={seg.color} stroke="#0a0e1a" strokeWidth="2" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#0a0e1a" />
      <text x={cx} y={cy - 4} fill="white" fontSize="18" fontWeight="700" textAnchor="middle">{total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}</text>
      <text x={cx} y={cy + 12} fill="#64748b" fontSize="8" textAnchor="middle">TOTAL</text>
    </svg>
  );
}

// ═══ Data ═══

const revenueData = [180, 220, 195, 280, 310, 340, 420, 380, 450, 520, 490, 580];
const costSavingsData = [45, 52, 68, 72, 95, 110, 125, 140, 160, 190, 210, 240];
const ticketResolutionData = [320, 380, 410, 450, 520, 580, 620, 690, 740, 810, 860, 920];

const heatmapData = [
  [42, 68, 85, 92, 78, 65, 45],
  [38, 72, 94, 88, 82, 58, 35],
  [30, 55, 78, 95, 90, 72, 42],
  [25, 48, 65, 82, 88, 68, 38],
  [45, 75, 88, 90, 85, 62, 40],
];
const heatmapXLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heatmapYLabels = ["Fraud", "Support", "Compliance", "Finance", "Review"];

const agentPerformance = [
  { name: "Fraud Monitoring", score: 99.7, executions: "4.8K", avgTime: "4.2s", trend: [88, 92, 95, 97, 99, 99.5, 99.7], color: "#f43f5e" },
  { name: "Compliance", score: 99.9, executions: "2.1K", avgTime: "12.8s", trend: [94, 96, 97, 98, 99, 99.5, 99.9], color: "#8b5cf6" },
  { name: "Finance", score: 99.2, executions: "1.5K", avgTime: "3.4s", trend: [90, 93, 95, 97, 98, 99, 99.2], color: "#22c55e" },
  { name: "Workflow Automation", score: 99.1, executions: "5.6K", avgTime: "6.7s", trend: [85, 88, 92, 95, 97, 98, 99.1], color: "#3b82f6" },
  { name: "Document Processing", score: 98.3, executions: "1.8K", avgTime: "15.3s", trend: [82, 86, 89, 92, 95, 97, 98.3], color: "#f59e0b" },
  { name: "Customer Support", score: 96.8, executions: "7.2K", avgTime: "2.1s", trend: [78, 82, 85, 88, 92, 95, 96.8], color: "#06b6d4" },
];

const anomalies = [
  { time: "19:48", severity: "critical" as const, title: "Unusual transaction volume spike", description: "Transaction volume increased 340% in the last 15 minutes from region EU-WEST-2", agent: "Fraud Monitoring Agent" },
  { time: "19:35", severity: "warning" as const, title: "API latency increase detected", description: "Average response time increased from 120ms to 890ms for payment gateway integration", agent: "Operations Agent" },
  { time: "19:22", severity: "info" as const, title: "New data pattern identified", description: "Customer segment B showing 28% increase in support ticket volume related to billing", agent: "Data Analyst Agent" },
  { time: "18:55", severity: "warning" as const, title: "Compliance threshold approaching", description: "Monthly AML screening quota at 92%. Projected to exceed limit by March 28", agent: "Compliance Agent" },
];

const insights = [
  { title: "Top Revenue Driver", text: "Automated fraud prevention saved $1.2M this quarter — a 45% increase from Q4 2025. The Fraud Agent identified 142 high-risk transactions that would have bypassed traditional rule-based systems.", icon: "💡", color: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/15" },
  { title: "Efficiency Gain", text: "Document Processing Agent spends 62% of time on invoice normalization. Pre-processing templates could reduce avg processing time by 40%, saving ~$18K/month in operational costs.", icon: "⚡", color: "from-electric-500/10 to-cyan-500/5", border: "border-electric-500/15" },
  { title: "Customer Impact", text: "Auto-resolved tickets increased to 73% (from 54%). Average resolution dropped from 4.2 hours to 12 minutes. Predicted CSAT improvement: +8.4 points next quarter.", icon: "📈", color: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/15" },
];

const costBreakdown = [
  { label: "Labor Savings", value: 420, color: "#22c55e" },
  { label: "Error Reduction", value: 180, color: "#3b82f6" },
  { label: "Speed Gains", value: 147, color: "#8b5cf6" },
  { label: "Compliance Automation", value: 100, color: "#f59e0b" },
];

const severityColors: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-electric-500/15 text-electric-400 border-electric-500/20",
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ═══ Page ═══

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("12m");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics & Insights</h1>
          <p className="text-text-secondary mt-1">AI-generated business intelligence and anomaly detection</p>
        </div>
        <div className="flex gap-1">
          {["7d", "30d", "12m"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${p === period ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Revenue Impact", value: "$2.4M", change: "+18.3%", sub: "vs last quarter", icon: "📊", gradient: "from-emerald-500 to-teal-500" },
          { label: "Cost Saved", value: "$847K", change: "+32.1%", sub: "automated this quarter", icon: "💰", gradient: "from-electric-500 to-cyan-500" },
          { label: "Fraud Prevented", value: "$1.2M", change: "142", sub: "incidents blocked", icon: "🛡️", gradient: "from-rose-500 to-pink-500" },
          { label: "Agent Efficiency", value: "97.8%", change: "+2.4pp", sub: "improvement YoY", icon: "⚡", gradient: "from-violet-500 to-purple-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-5 group hover:border-electric-500/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center text-lg group-hover:scale-105 transition-transform`}>{kpi.icon}</div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{kpi.change}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">{kpi.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{kpi.label}</div>
            <div className="text-[10px] text-text-muted/60 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Revenue Trend + Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Revenue Impact Trend</h2>
              <p className="text-xs text-text-muted">Monthly revenue generated/saved by AI agents ($K)</p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg font-medium">↑ 18.3% YoY</span>
          </div>
          <LineChart data={revenueData} color="#22c55e" gradientId="revenue" />
          <div className="flex justify-between mt-2 text-[9px] text-text-muted px-7">
            {months.map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-text-primary">Cost Savings Breakdown</h2>
            <p className="text-xs text-text-muted">Where agents save money ($K)</p>
          </div>
          <div className="flex justify-center mb-4">
            <DonutChart segments={costBreakdown} />
          </div>
          <div className="space-y-2">
            {costBreakdown.map(seg => (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-text-secondary">{seg.label}</span>
                </div>
                <span className="text-xs font-bold text-text-primary">${seg.value}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap + Ticket Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-text-primary">Agent Activity Heatmap</h2>
            <p className="text-xs text-text-muted">Execution intensity by agent type and day of week</p>
          </div>
          <HeatMap data={heatmapData} xLabels={heatmapXLabels} yLabels={heatmapYLabels} />
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-[9px] text-text-muted">Low</span>
            {["#1e1b4b", "#6366f1", "#8b5cf6", "#3b82f6", "#22c55e"].map(c => (
              <div key={c} className="w-5 h-3 rounded" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[9px] text-text-muted">High</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Auto-Resolved Tickets</h2>
              <p className="text-xs text-text-muted">Monthly ticket volume auto-resolved by agents</p>
            </div>
            <span className="text-xs text-electric-400 bg-electric-500/10 px-2 py-1 rounded-lg font-medium">73% auto-rate</span>
          </div>
          <LineChart data={ticketResolutionData} color="#8b5cf6" gradientId="tickets" />
          <div className="flex justify-between mt-2 text-[9px] text-text-muted px-7">
            {months.map(m => <span key={m}>{m}</span>)}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/5">
            {[
              { label: "Avg Resolution", value: "12 min", color: "text-emerald-400" },
              { label: "CSAT Score", value: "4.6/5", color: "text-electric-400" },
              { label: "Escalation Rate", value: "8.2%", color: "text-amber-400" },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                <div className="text-[9px] text-text-muted">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Agent Performance with Sparklines */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-text-primary mb-1">Agent Performance Scoreboard</h2>
        <p className="text-xs text-text-muted mb-5">Real-time accuracy, throughput, and trend analysis</p>
        <div className="space-y-3">
          {agentPerformance.map((agent) => (
            <div key={agent.name} className="flex items-center gap-4 p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors">
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: agent.color }} />
              <div className="w-40 text-sm text-text-secondary font-medium truncate">{agent.name}</div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-navy-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${agent.score}%`, backgroundColor: agent.color }} />
                </div>
              </div>
              <div className="text-sm font-bold text-text-primary w-14 text-right">{agent.score}%</div>
              <div className="w-20">
                <svg viewBox="0 0 70 24" className="w-full">
                  <polyline
                    points={agent.trend.map((v, i) => `${i * 11},${24 - ((v - 75) / 25) * 20}`).join(" ")}
                    fill="none" stroke={agent.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-xs text-text-muted w-12 text-right font-mono">{agent.executions}</div>
              <div className="text-xs text-text-muted w-12 text-right font-mono">{agent.avgTime}</div>
            </div>
          ))}
          <div className="flex items-center gap-4 px-3 text-[10px] text-text-muted font-semibold uppercase tracking-wider">
            <div className="w-2" /><div className="w-40">Agent</div><div className="flex-1">Accuracy</div>
            <div className="w-14 text-right">Score</div><div className="w-20 text-center">Trend</div>
            <div className="w-12 text-right">Runs</div><div className="w-12 text-right">Avg Time</div>
          </div>
        </div>
      </div>

      {/* Row 5: Anomaly Detection + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Anomalies */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-1">Anomaly Detection</h2>
          <p className="text-xs text-text-muted mb-5">Real-time alerts from all monitoring agents</p>
          <div className="space-y-3">
            {anomalies.map((a, i) => (
              <div key={i} className="p-4 rounded-xl bg-navy-800/40 border border-border hover:border-border-active transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${severityColors[a.severity]}`}>{a.severity}</span>
                  <span className="text-[10px] text-text-muted font-mono">{a.time}</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary">{a.title}</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{a.description}</p>
                <div className="text-[10px] text-electric-400 mt-2 font-medium">Detected by {a.agent}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-1">AI-Generated Insights</h2>
          <p className="text-xs text-text-muted mb-5">Autonomous recommendations from the Intelligence Engine</p>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.title} className={`p-5 rounded-xl bg-gradient-to-br ${insight.color} border ${insight.border} hover:scale-[1.01] transition-transform`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{insight.icon}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-1.5">{insight.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 6: Cost Savings Trend */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Cumulative Cost Savings</h2>
            <p className="text-xs text-text-muted">Monthly agent-driven cost reductions ($K) — upward trend across all categories</p>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-semibold">$847K total saved</span>
        </div>
        <LineChart data={costSavingsData} color="#06b6d4" gradientId="costsavings" />
        <div className="flex justify-between mt-2 text-[9px] text-text-muted px-7">
          {months.map(m => <span key={m}>{m}</span>)}
        </div>
      </div>
    </div>
  );
}
