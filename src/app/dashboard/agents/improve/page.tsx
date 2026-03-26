"use client";

import { useState } from "react";

// ═══ Demo Data ═══

const agents = [
  {
    id: "agent_fraud_001", name: "Fraud Monitoring Agent", type: "FRAUD_MONITORING",
    metrics: { successRate: 98.2, avgLatency: 4200, avgCost: 0.042, totalExecutions: 1247 },
    trend: [95.1, 96.3, 97.0, 97.5, 97.8, 98.0, 98.2],
    suggestions: [
      { type: "parameter_adjust", title: "Reduce Token Usage", description: "Average cost is $0.042/execution. Tighter output constraints could save 25%.", expected: 25, confidence: 70 },
    ],
  },
  {
    id: "agent_compliance_001", name: "Compliance Agent", type: "COMPLIANCE",
    metrics: { successRate: 95.8, avgLatency: 12800, avgCost: 0.068, totalExecutions: 892 },
    trend: [92.0, 93.5, 94.2, 95.0, 95.5, 95.2, 95.8],
    suggestions: [
      { type: "model_upgrade", title: "Optimize Model for Speed", description: "Avg latency is 12.8s. Use GPT-4o-mini for initial triage.", expected: 40, confidence: 82 },
      { type: "prompt_tune", title: "Refine System Prompt", description: "Success rate 95.8%. Adding error handling instructions may help.", expected: 8, confidence: 75 },
    ],
  },
  {
    id: "agent_support_001", name: "Customer Support Agent", type: "CUSTOMER_SUPPORT",
    metrics: { successRate: 93.1, avgLatency: 2100, avgCost: 0.018, totalExecutions: 3421 },
    trend: [88.0, 89.5, 90.2, 91.0, 91.8, 92.5, 93.1],
    suggestions: [
      { type: "prompt_tune", title: "Improve Response Accuracy", description: "6.9% error rate dominated by 'Invalid output format'. Add format constraints.", expected: 12, confidence: 78 },
      { type: "tool_swap", title: "Add Knowledge Base Tool", description: "42% of failures from missing context. KB integration could resolve.", expected: 15, confidence: 68 },
    ],
  },
];

const abTests = [
  { name: "Fraud Agent: Concise vs Verbose Prompt", status: "running" as const, progress: 67, agentA: "v2.1 (concise)", agentB: "v2.0 (verbose)", rateA: 98.5, rateB: 97.8, costA: 0.031, costB: 0.042 },
  { name: "Support Agent: GPT-4o vs GPT-4o-mini", status: "completed" as const, progress: 100, agentA: "GPT-4o", agentB: "GPT-4o-mini", rateA: 93.1, rateB: 91.8, costA: 0.018, costB: 0.004, winner: "B" },
];

const suggestionTypeIcons: Record<string, string> = {
  prompt_tune: "📝", parameter_adjust: "⚙️", model_upgrade: "🔄", tool_swap: "🔧", schedule_optimize: "📅",
};

// ═══ Page ═══

export default function AgentImprovePage() {
  const [selectedAgent, setSelectedAgent] = useState(0);
  const agent = agents[selectedAgent];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Agent Self-Improvement</h1>
        <p className="text-text-secondary mt-1">Performance tracking, optimization suggestions, and A/B testing</p>
      </div>

      {/* Agent Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {agents.map((a, i) => (
          <button key={a.id} onClick={() => setSelectedAgent(i)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${i === selectedAgent ? "bg-electric-500/15 text-electric-400 border border-electric-500/30" : "bg-navy-800/30 text-text-muted hover:text-text-secondary border border-transparent"}`}>
            {a.name}
          </button>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Success Rate", value: `${agent.metrics.successRate}%`, color: agent.metrics.successRate > 97 ? "text-emerald-400" : "text-amber-400" },
          { label: "Avg Latency", value: `${(agent.metrics.avgLatency / 1000).toFixed(1)}s`, color: agent.metrics.avgLatency < 5000 ? "text-emerald-400" : "text-amber-400" },
          { label: "Avg Cost", value: `$${agent.metrics.avgCost.toFixed(3)}`, color: agent.metrics.avgCost < 0.05 ? "text-emerald-400" : "text-amber-400" },
          { label: "Executions", value: agent.metrics.totalExecutions.toLocaleString(), color: "text-electric-400" },
        ].map((m) => (
          <div key={m.label} className="glass-card p-4">
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-[10px] text-text-muted mt-0.5">{m.label} (7d)</div>
          </div>
        ))}
      </div>

      {/* Trend + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Success Rate Trend (7 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {agent.trend.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-text-muted">{val}%</div>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-electric-500/60 to-electric-500/20 transition-all duration-500"
                  style={{ height: `${((val - 85) / 15) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-text-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* Suggestions */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Improvement Suggestions</h2>
          {agent.suggestions.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs">No suggestions — this agent is performing optimally!</div>
          ) : (
            <div className="space-y-3">
              {agent.suggestions.map((sug, i) => (
                <div key={i} className="p-4 rounded-xl bg-navy-800/40 border border-border hover:border-border-active transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{suggestionTypeIcons[sug.type] || "💡"}</span>
                    <h3 className="text-xs font-semibold text-text-primary flex-1">{sug.title}</h3>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">+{sug.expected}%</span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-3">{sug.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 rounded-full bg-navy-800"><div className="h-full rounded-full bg-electric-500" style={{ width: `${sug.confidence}%` }} /></div>
                      <span className="text-[9px] text-text-muted">{sug.confidence}%</span>
                    </div>
                    <button className="text-[10px] font-medium text-electric-400 bg-electric-500/10 px-2 py-1 rounded-lg hover:bg-electric-500/20 transition-colors">Apply</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* A/B Tests */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">A/B Tests</h2>
          <button className="text-[10px] font-medium text-electric-400 bg-electric-500/10 px-3 py-1.5 rounded-lg hover:bg-electric-500/20 transition-colors">+ New Test</button>
        </div>
        <div className="space-y-4">
          {abTests.map((test, i) => (
            <div key={i} className="p-4 rounded-xl bg-navy-800/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-text-primary flex-1">{test.name}</h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${test.status === "running" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>{test.status}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-navy-800 mb-3"><div className="h-full rounded-full bg-electric-500 transition-all" style={{ width: `${test.progress}%` }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${test.status === "completed" && test.winner === "A" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-navy-800/40"}`}>
                  <div className="text-[10px] text-text-muted mb-1">Variant A: {test.agentA}</div>
                  <div className="flex gap-3">
                    <div><div className="text-xs font-bold text-text-primary">{test.rateA}%</div><div className="text-[9px] text-text-muted">success</div></div>
                    <div><div className="text-xs font-bold text-text-primary">${test.costA}</div><div className="text-[9px] text-text-muted">cost/exec</div></div>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${test.status === "completed" && test.winner === "B" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-navy-800/40"}`}>
                  <div className="text-[10px] text-text-muted mb-1">Variant B: {test.agentB}</div>
                  <div className="flex gap-3">
                    <div><div className="text-xs font-bold text-text-primary">{test.rateB}%</div><div className="text-[9px] text-text-muted">success</div></div>
                    <div><div className="text-xs font-bold text-text-primary">${test.costB}</div><div className="text-[9px] text-text-muted">cost/exec</div></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
