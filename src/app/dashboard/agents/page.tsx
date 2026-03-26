"use client";

import { useState } from "react";

// ═══ Agent Data ═══

const agentData: Record<string, {
  name: string; icon: string; status: string; color: string;
  description: string; longDescription: string;
  executions: number; successRate: number; lastRun: string; avgLatency: string;
  model: string; provider: string; temperature: number; maxTokens: number;
  schedule: string; retries: number; timeout: string;
  integrations: string[]; capabilities: string[];
  systemPrompt: string;
  executionLog: { time: string; status: "success" | "error" | "warning"; message: string; duration: string }[];
  performanceTrend: number[];
  latencyTrend: number[];
}> = {
  "fraud-monitoring": {
    name: "Fraud Monitoring Agent", icon: "🛡️", status: "active", color: "from-rose-500 to-rose-400",
    description: "Monitors transactions in real-time and flags anomalies",
    longDescription: "Uses ML models trained on 2M+ historical transactions to detect fraud patterns. Analyzes velocity, geo-anomalies, device fingerprints, and behavioral biometrics. Auto-blocks high-risk transactions and escalates medium-risk for human review.",
    executions: 4823, successRate: 99.7, lastRun: "2 min ago", avgLatency: "4.2s",
    model: "GPT-4o", provider: "OpenAI", temperature: 0.1, maxTokens: 2048,
    schedule: "Real-time (event-driven)", retries: 3, timeout: "30s",
    integrations: ["PostgreSQL", "Redis", "Slack", "PagerDuty", "SendGrid"],
    capabilities: ["Transaction scoring", "Pattern detection", "Auto-blocking", "Alert generation", "Report compilation"],
    systemPrompt: "You are a fraud detection specialist. Analyze each transaction for anomalies including unusual velocity, geo-location mismatches, device fingerprint changes, and behavioral deviations. Score risk on a 0-1 scale. If risk > 0.85, recommend immediate block. If risk > 0.6, flag for review. Provide detailed reasoning for all scores.",
    executionLog: [
      { time: "19:49:12", status: "success", message: "Batch analyzed: 142 transactions, 3 flagged (risk > 0.6)", duration: "3.8s" },
      { time: "19:47:45", status: "success", message: "High-risk block: $45,200 transfer to new beneficiary (score: 0.94)", duration: "1.2s" },
      { time: "19:45:03", status: "success", message: "Batch analyzed: 98 transactions, 0 flagged", duration: "2.4s" },
      { time: "19:42:18", status: "warning", message: "Latency spike: model inference took 12.4s (threshold: 10s)", duration: "12.4s" },
      { time: "19:39:55", status: "success", message: "Batch analyzed: 167 transactions, 1 flagged", duration: "4.1s" },
      { time: "19:37:22", status: "success", message: "Daily pattern model refresh completed", duration: "45.2s" },
      { time: "19:35:10", status: "error", message: "Redis connection timeout — retried successfully (attempt 2/3)", duration: "8.7s" },
      { time: "19:32:41", status: "success", message: "Batch analyzed: 203 transactions, 5 flagged", duration: "5.6s" },
    ],
    performanceTrend: [97.2, 97.8, 98.1, 98.5, 99.0, 99.2, 99.5, 99.7],
    latencyTrend: [6.8, 5.9, 5.2, 4.8, 4.5, 4.3, 4.1, 4.2],
  },
  "compliance": {
    name: "Compliance Agent", icon: "⚖️", status: "active", color: "from-violet-500 to-violet-400",
    description: "Automates KYC/AML checks and monitors regulatory changes",
    longDescription: "Full-stack compliance automation: document verification, sanctions screening, PEP checks, and ongoing monitoring. Integrates with FICA, POPIA, and international AML frameworks. Auto-generates SAR reports and maintains a complete audit trail.",
    executions: 2156, successRate: 99.9, lastRun: "5 min ago", avgLatency: "12.8s",
    model: "Claude 3.5 Sonnet", provider: "Anthropic", temperature: 0.0, maxTokens: 4096,
    schedule: "Real-time + Daily batch 06:00", retries: 2, timeout: "60s",
    integrations: ["PostgreSQL", "Okta", "Active Directory", "SendGrid", "AWS S3"],
    capabilities: ["KYC verification", "AML screening", "PEP checks", "SAR generation", "Audit trail"],
    systemPrompt: "You are a compliance specialist AI. Analyze documents and identity information against FICA, POPIA, and applicable AML frameworks. Verify identities, screen against sanctions lists, check politically exposed persons databases. Generate structured verification reports. Flag any inconsistencies for human review. Maintain zero-tolerance for false negatives.",
    executionLog: [
      { time: "19:48:30", status: "success", message: "KYC batch #B-2847: 23 approved, 1 flagged for manual review", duration: "14.2s" },
      { time: "19:40:15", status: "success", message: "Sanctions list updated: 12 new entries from OFAC", duration: "3.1s" },
      { time: "19:35:22", status: "success", message: "PEP screening: 45 customers cleared", duration: "8.5s" },
      { time: "19:30:00", status: "success", message: "Daily AML threshold report generated", duration: "22.4s" },
    ],
    performanceTrend: [98.5, 99.0, 99.2, 99.4, 99.6, 99.7, 99.8, 99.9],
    latencyTrend: [18.2, 16.5, 15.1, 14.2, 13.8, 13.2, 12.9, 12.8],
  },
};

// Default agent data for IDs not explicitly defined
const defaultAgent = {
  longDescription: "This agent operates autonomously with configurable guardrails, integrating with your existing infrastructure. It processes events in real-time and generates actionable outputs.",
  model: "GPT-4o", provider: "OpenAI", temperature: 0.3, maxTokens: 2048,
  schedule: "Real-time", retries: 3, timeout: "30s",
  integrations: ["PostgreSQL", "Redis", "Slack"],
  capabilities: ["Event processing", "Data analysis", "Report generation", "Alert management"],
  systemPrompt: "You are a specialized AI agent. Process incoming data, analyze patterns, and produce structured outputs. Maintain accuracy and provide detailed reasoning.",
  executionLog: [
    { time: "19:48:00", status: "success" as const, message: "Batch processed successfully", duration: "3.2s" },
    { time: "19:42:00", status: "success" as const, message: "Report generated and distributed", duration: "5.1s" },
    { time: "19:36:00", status: "success" as const, message: "Data sync completed", duration: "2.8s" },
  ],
  performanceTrend: [94, 95.5, 96.2, 97.0, 97.8, 98.2, 98.5, 98.8],
  latencyTrend: [8.5, 7.8, 7.2, 6.5, 6.0, 5.5, 5.2, 5.0],
};

const allAgents = [
  { id: "fraud-monitoring", name: "Fraud Monitoring Agent", icon: "🛡️", status: "active", executions: 4823, successRate: 99.7, lastRun: "2 min ago", color: "from-rose-500 to-rose-400", description: "Monitors transactions in real-time, flags anomalies, and generates risk scores using ML models." },
  { id: "compliance", name: "Compliance Agent", icon: "⚖️", status: "active", executions: 2156, successRate: 99.9, lastRun: "5 min ago", color: "from-violet-500 to-violet-400", description: "Automates KYC/AML checks, monitors regulatory changes, generates compliance reports." },
  { id: "reporting", name: "Reporting Agent", icon: "📊", status: "active", executions: 892, successRate: 98.5, lastRun: "15 min ago", color: "from-electric-500 to-electric-400", description: "Generates scheduled and ad-hoc business reports with data aggregation and visualization." },
  { id: "finance", name: "Finance Agent", icon: "💰", status: "active", executions: 1543, successRate: 99.2, lastRun: "8 min ago", color: "from-emerald-500 to-emerald-400", description: "Handles reconciliation, invoice processing, payment matching, and financial forecasting." },
  { id: "customer-support", name: "Customer Support Agent", icon: "🎧", status: "paused", executions: 7234, successRate: 96.8, lastRun: "25 min ago", color: "from-cyan-500 to-cyan-400", description: "Routes tickets, generates responses, escalates issues using knowledge bases." },
  { id: "data-analyst", name: "Data Analyst Agent", icon: "🔍", status: "active", executions: 3421, successRate: 97.9, lastRun: "12 min ago", color: "from-amber-500 to-amber-400", description: "Analyzes datasets, detects patterns, generates insights with natural language queries." },
  { id: "workflow-automation", name: "Workflow Automation Agent", icon: "⚡", status: "active", executions: 5678, successRate: 99.1, lastRun: "1 min ago", color: "from-electric-500 to-violet-500", description: "Orchestrates multi-step workflows, manages dependencies, handles retries." },
  { id: "document-processing", name: "Document Processing Agent", icon: "📄", status: "active", executions: 1876, successRate: 98.3, lastRun: "45 min ago", color: "from-rose-500 to-violet-500", description: "Extracts data from PDFs, invoices, contracts using OCR and LLM-powered parsing." },
  { id: "email-communication", name: "Email / Communication Agent", icon: "✉️", status: "active", executions: 2345, successRate: 97.4, lastRun: "3 min ago", color: "from-cyan-500 to-electric-500", description: "Processes inbound emails, generates responses, and routes messages by intent." },
  { id: "operations", name: "Operations Agent", icon: "🏗️", status: "active", executions: 4102, successRate: 99.5, lastRun: "30 sec ago", color: "from-emerald-500 to-cyan-500", description: "Monitors system health, manages resources, handles incident response." },
  { id: "helpdesk", name: "IT Helpdesk Agent", icon: "🎫", status: "active", executions: 3890, successRate: 98.1, lastRun: "4 min ago", color: "from-blue-500 to-indigo-500", description: "Auto-resolves IT tickets, provisions accounts, resets passwords, manages hardware." },
  { id: "review", name: "App Store Review Agent", icon: "⭐", status: "active", executions: 1245, successRate: 97.6, lastRun: "20 min ago", color: "from-yellow-500 to-orange-500", description: "Monitors app store reviews, classifies sentiment, drafts and posts responses." },
  { id: "intel", name: "Competitive Intelligence Agent", icon: "🕵️", status: "active", executions: 987, successRate: 98.9, lastRun: "1 hour ago", color: "from-purple-500 to-pink-500", description: "Tracks competitors, monitors market signals, generates threat assessments." },
];

const statusLogColors: Record<string, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  warning: "text-amber-400",
};

const statusLogDots: Record<string, string> = {
  success: "bg-emerald-400",
  error: "bg-rose-400",
  warning: "bg-amber-400",
};

export default function AgentsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "logs">("overview");

  const filtered = filter === "all" ? allAgents : allAgents.filter(a => a.status === filter);

  if (selectedId) {
    const agentBase = allAgents.find(a => a.id === selectedId)!;
    const detail = agentData[selectedId] || { ...defaultAgent, name: agentBase.name, icon: agentBase.icon, status: agentBase.status, color: agentBase.color, description: agentBase.description, executions: agentBase.executions, successRate: agentBase.successRate, lastRun: agentBase.lastRun, avgLatency: "5.0s" };
    const data = { ...detail, name: agentBase.name, icon: agentBase.icon, status: agentBase.status, color: agentBase.color, executions: agentBase.executions, successRate: agentBase.successRate, lastRun: agentBase.lastRun };

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedId(null)} className="w-9 h-9 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-electric-500/30 transition-colors">←</button>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center text-2xl`}>{data.icon}</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">{data.name}</h1>
            <p className="text-sm text-text-muted">{data.description}</p>
          </div>
          <span className={`badge text-[10px] ${data.status === "active" ? "badge-active" : "badge-warning"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${data.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} /> {data.status}
          </span>
          <button className="btn-secondary text-sm px-4 py-2">{data.status === "active" ? "⏸️ Pause" : "▶️ Resume"}</button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Executions", value: data.executions.toLocaleString(), icon: "🔄", gradient: "from-electric-500 to-cyan-500" },
            { label: "Success Rate", value: `${data.successRate}%`, icon: "✅", gradient: "from-emerald-500 to-teal-500" },
            { label: "Avg Latency", value: (data as typeof detail).avgLatency || "5.0s", icon: "⏱️", gradient: "from-amber-500 to-orange-500" },
            { label: "Last Run", value: data.lastRun, icon: "🕐", gradient: "from-violet-500 to-purple-500" },
          ].map(k => (
            <div key={k.label} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center text-lg`}>{k.icon}</div>
                <div><div className="text-xl font-bold text-text-primary">{k.value}</div><div className="text-[10px] text-text-muted">{k.label}</div></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["overview", "config", "logs"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-electric-500 text-electric-400" : "border-transparent text-text-muted hover:text-text-secondary"}`}>
              {tab === "overview" ? "Overview" : tab === "config" ? "Configuration" : "Execution Logs"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
            {/* Performance Trend */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Accuracy Trend</h3>
              <p className="text-xs text-text-muted mb-4">Last 8 execution windows</p>
              <svg viewBox="0 0 400 120" className="w-full">
                <defs><linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" /></linearGradient></defs>
                {[0, 0.5, 1].map(pct => { const y = 10 + pct * 90; return <line key={pct} x1="30" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />; })}
                {(() => {
                  const trend = (data as typeof detail).performanceTrend || defaultAgent.performanceTrend;
                  const min = Math.min(...trend) - 1; const max = Math.max(...trend) + 0.5; const range = max - min;
                  const pts = trend.map((v, i) => ({ x: 30 + (i / (trend.length - 1)) * 370, y: 100 - ((v - min) / range) * 90 }));
                  const pathD = `M${pts.map(p => `${p.x},${p.y}`).join(" L")}`;
                  const areaD = `${pathD} L${pts[pts.length-1].x},100 L${pts[0].x},100 Z`;
                  return (<><path d={areaD} fill="url(#perfGrad)" /><path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#22c55e" stroke="#0a0e1a" strokeWidth="2" />)}</>);
                })()}
              </svg>
            </div>

            {/* Latency Trend */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Latency Trend (seconds)</h3>
              <p className="text-xs text-text-muted mb-4">Improving over time</p>
              <svg viewBox="0 0 400 120" className="w-full">
                <defs><linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" /></linearGradient></defs>
                {(() => {
                  const trend = (data as typeof detail).latencyTrend || defaultAgent.latencyTrend;
                  const min = Math.min(...trend) - 0.5; const max = Math.max(...trend) + 1; const range = max - min;
                  const pts = trend.map((v, i) => ({ x: 30 + (i / (trend.length - 1)) * 370, y: 10 + ((v - min) / range) * 90 }));
                  const pathD = `M${pts.map(p => `${p.x},${p.y}`).join(" L")}`;
                  const areaD = `${pathD} L${pts[pts.length-1].x},100 L${pts[0].x},100 Z`;
                  return (<><path d={areaD} fill="url(#latGrad)" /><path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#06b6d4" stroke="#0a0e1a" strokeWidth="2" />)}</>);
                })()}
              </svg>
            </div>

            {/* Capabilities */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {((data as typeof detail).capabilities || defaultAgent.capabilities).map(c => (
                  <span key={c} className="text-xs px-3 py-1.5 rounded-lg bg-electric-500/10 text-electric-400 border border-electric-500/10 font-medium">{c}</span>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-text-primary mt-6 mb-3">Connected Integrations</h3>
              <div className="flex flex-wrap gap-2">
                {((data as typeof detail).integrations || defaultAgent.integrations).map(i => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/10 font-medium">{i}</span>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">About this Agent</h3>
              <p className="text-sm text-text-muted leading-relaxed">{(data as typeof detail).longDescription || defaultAgent.longDescription}</p>
              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/5">
                <div><div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Schedule</div><div className="text-sm text-text-primary font-medium">{(data as typeof detail).schedule || defaultAgent.schedule}</div></div>
                <div><div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Timeout</div><div className="text-sm text-text-primary font-medium">{(data as typeof detail).timeout || defaultAgent.timeout}</div></div>
                <div><div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Retries</div><div className="text-sm text-text-primary font-medium">{(data as typeof detail).retries ?? defaultAgent.retries}</div></div>
                <div><div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Model</div><div className="text-sm text-text-primary font-medium">{(data as typeof detail).model || defaultAgent.model}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">LLM Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Provider</label>
                  <select className="input-field text-sm"><option>{(data as typeof detail).provider || defaultAgent.provider}</option><option>OpenAI</option><option>Anthropic</option><option>Google</option><option>Self-hosted</option></select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Model</label>
                  <select className="input-field text-sm"><option>{(data as typeof detail).model || defaultAgent.model}</option><option>GPT-4o</option><option>GPT-4o-mini</option><option>Claude 3.5 Sonnet</option><option>Gemini Pro</option></select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Temperature: {(data as typeof detail).temperature ?? defaultAgent.temperature}</label>
                  <input type="range" min="0" max="1" step="0.1" defaultValue={(data as typeof detail).temperature ?? defaultAgent.temperature} className="w-full accent-electric-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Max Tokens</label>
                  <input type="number" defaultValue={(data as typeof detail).maxTokens || defaultAgent.maxTokens} className="input-field text-sm font-mono" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">System Prompt</h3>
              <textarea className="input-field text-sm font-mono min-h-[120px] leading-relaxed" defaultValue={(data as typeof detail).systemPrompt || defaultAgent.systemPrompt} />
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-text-muted">🔒 Changes require approval from an admin user</span>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Execution Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Schedule</label>
                  <select className="input-field text-sm"><option>{(data as typeof detail).schedule || defaultAgent.schedule}</option><option>Real-time</option><option>Every 5 mins</option><option>Hourly</option><option>Daily</option></select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Timeout</label>
                  <input type="text" defaultValue={(data as typeof detail).timeout || defaultAgent.timeout} className="input-field text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Max Retries</label>
                  <input type="number" defaultValue={(data as typeof detail).retries ?? defaultAgent.retries} className="input-field text-sm font-mono" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary px-5 py-2 text-sm">Save Configuration</button>
              <button className="btn-secondary px-5 py-2 text-sm">Reset to Defaults</button>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Execution History</h3>
            <div className="space-y-0">
              {((data as typeof detail).executionLog || defaultAgent.executionLog).map((log, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-navy-800/30 transition-colors px-2 rounded-lg">
                  <div className="relative mt-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusLogDots[log.status]}`} />
                    {i < ((data as typeof detail).executionLog || defaultAgent.executionLog).length - 1 && <div className="absolute left-1 top-3 w-0.5 h-6 bg-border" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-muted">{log.time}</span>
                      <span className={`text-xs font-semibold ${statusLogColors[log.status]}`}>{log.status.toUpperCase()}</span>
                      <span className="text-[10px] text-text-muted font-mono ml-auto">{log.duration}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══ Agents Grid (listing view) ═══
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Agents</h1>
          <p className="text-text-secondary mt-1">Manage and configure your autonomous agents</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <span className="text-lg leading-none">+</span> Create Agent
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "paused"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${filter === f ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
            {f} ({f === "all" ? allAgents.length : allAgents.filter(a => a.status === f).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((agent, i) => (
          <div key={agent.id} onClick={() => { setSelectedId(agent.id); setActiveTab("overview"); }}
            className="glass-card p-5 cursor-pointer group hover:border-electric-500/30 hover:-translate-y-0.5 transition-all animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl group-hover:scale-105 transition-transform`}>{agent.icon}</div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">{agent.name}</h3>
                  <span className={`badge text-[9px] mt-0.5 ${agent.status === "active" ? "badge-active" : "badge-warning"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} /> {agent.status}
                  </span>
                </div>
              </div>
              <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-3">{agent.description}</p>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div><div className="text-base font-bold text-text-primary">{agent.executions.toLocaleString()}</div><div className="text-[9px] text-text-muted">Executions</div></div>
              <div><div className="text-base font-bold text-emerald-400">{agent.successRate}%</div><div className="text-[9px] text-text-muted">Success</div></div>
              <div><div className="text-xs font-medium text-text-secondary">{agent.lastRun}</div><div className="text-[9px] text-text-muted">Last Run</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
