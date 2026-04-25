"use client";

import { useState } from "react";

// ═══ Demo Data ═══

const predictions = [
  { metric: "Execution Volume", current: "4,812", predicted: "5,940", change: "+23.4%", confidence: 87, direction: "up" as const, horizon: "Next 7 days", description: "Agent execution volume trending upward due to increased fraud monitoring activity" },
  { metric: "Success Rate", current: "97.2%", predicted: "96.1%", change: "-1.1%", confidence: 72, direction: "down" as const, horizon: "Next 7 days", description: "Slight decline predicted — compliance agent showing increased timeout errors" },
  { metric: "Avg Latency", current: "4.2s", predicted: "5.8s", change: "+38%", confidence: 68, direction: "up" as const, horizon: "Next 3 days", description: "LLM provider latency increasing during peak hours — consider caching strategy" },
  { metric: "Monthly Cost", current: "$847", predicted: "$1,120", change: "+32%", confidence: 81, direction: "up" as const, horizon: "Next 30 days", description: "Costs rising proportionally with volume — multi-model routing could save 25%" },
];

const anomalies = [
  { metric: "Fraud Agent Latency", severity: "critical" as const, value: "18.4s", expected: "4.2s", deviation: "+338%", description: "Fraud agent response time spiked 4x — possible LLM rate limiting", detectedAt: "12 min ago" },
  { metric: "Support Ticket Volume", severity: "warning" as const, value: "342", expected: "180", deviation: "+90%", description: "Support tickets nearly doubled — correlates with billing system update", detectedAt: "45 min ago" },
  { metric: "Compliance Success Rate", severity: "info" as const, value: "94.1%", expected: "99.2%", deviation: "-5.1%", description: "KYC verification timeout rate increased — third-party API may be degraded", detectedAt: "2 hours ago" },
];

const insights = [
  { type: "optimization" as const, title: "Route Classification Tasks to GPT-4o-mini", description: "42% of fraud agent calls are simple classification tasks. Routing these to GPT-4o-mini would save $312/month with <1% quality impact.", impact: "high" as const, confidence: 82, action: "Enable multi-model routing" },
  { type: "risk" as const, title: "Compliance Agent Error Rate Trending Up", description: "Error rate has increased from 0.8% to 5.1% over the past 72 hours. Primary cause: third-party KYC API timeouts.", impact: "high" as const, confidence: 91, action: "Add retry logic + fallback provider" },
  { type: "opportunity" as const, title: "Customer Support Auto-Resolution at 73%", description: "Support agent auto-resolves 73% of tickets. Adding knowledge base integration could push this to 85%, saving 40+ hours/week.", impact: "medium" as const, confidence: 76, action: "Deploy knowledge base connector" },
  { type: "trend" as const, title: "Monday Volume Spike Pattern", description: "Agent execution volume consistently spikes 40% on Mondays. Pre-scaling resources could reduce latency by 30%.", impact: "low" as const, confidence: 88, action: "Configure auto-scaling schedule" },
];

const whatIfPresets = [
  { name: "Double Volume", modifications: { throughput: 100, cost: 80 }, description: "What if execution volume doubles?" },
  { name: "Switch to GPT-4o-mini", modifications: { cost: -60, successRate: -3 }, description: "What if we use cheaper models?" },
  { name: "Add 2 New Agents", modifications: { throughput: 40, cost: 35 }, description: "What if we deploy 2 more agents?" },
];

// ═══ Styling ═══

const severityStyles: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const insightTypeStyles: Record<string, { icon: string; color: string; border: string }> = {
  optimization: { icon: "⚡", color: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/15" },
  risk: { icon: "⚠️", color: "from-rose-500/10 to-red-500/5", border: "border-rose-500/15" },
  opportunity: { icon: "🚀", color: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/15" },
  trend: { icon: "📈", color: "from-blue-500/10 to-indigo-500/5", border: "border-blue-500/15" },
};

const impactStyles: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-emerald-500/15 text-emerald-400",
};

// ═══ Page ═══

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<"predictions" | "anomalies" | "insights" | "whatif">("predictions");
  const [selectedScenario, setSelectedScenario] = useState(0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Predictive Insights</h1>
          <p className="text-text-secondary mt-1">AI-powered predictions, anomaly detection, and what-if analysis</p>
        </div>
        <div className="flex gap-1">
          {(["predictions", "anomalies", "insights", "whatif"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${tab === activeTab ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
              {tab === "whatif" ? "What-If" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions */}
      {activeTab === "predictions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {predictions.map((pred) => (
            <div key={pred.metric} className="glass-card p-5 hover:border-electric-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">{pred.metric}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pred.direction === "up" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                  {pred.change}
                </span>
              </div>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Current</div>
                  <div className="text-lg font-bold text-text-primary">{pred.current}</div>
                </div>
                <div className="text-text-muted mb-1">{pred.direction === "up" ? "→" : "→"}</div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Predicted</div>
                  <div className="text-lg font-bold text-electric-400">{pred.predicted}</div>
                </div>
              </div>
              <p className="text-xs text-text-muted mb-3">{pred.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-navy-800">
                    <div className="h-full rounded-full bg-electric-500" style={{ width: `${pred.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-text-muted">{pred.confidence}% confidence</span>
                </div>
                <span className="text-[10px] text-text-muted">{pred.horizon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anomalies */}
      {activeTab === "anomalies" && (
        <div className="space-y-4">
          {anomalies.map((a, i) => (
            <div key={i} className="glass-card p-5 hover:border-electric-500/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${severityStyles[a.severity]}`}>{a.severity}</span>
                <h3 className="text-sm font-semibold text-text-primary flex-1">{a.metric}</h3>
                <span className="text-[10px] text-text-muted">{a.detectedAt}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div><div className="text-[10px] text-text-muted">Actual</div><div className="text-base font-bold text-rose-400">{a.value}</div></div>
                <div><div className="text-[10px] text-text-muted">Expected</div><div className="text-base font-bold text-text-secondary">{a.expected}</div></div>
                <div><div className="text-[10px] text-text-muted">Deviation</div><div className="text-base font-bold text-amber-400">{a.deviation}</div></div>
              </div>
              <p className="text-xs text-text-muted">{a.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          {insights.map((insight) => {
            const style = insightTypeStyles[insight.type];
            return (
              <div key={insight.title} className={`glass-card p-5 bg-gradient-to-br ${style.color} border ${style.border} hover:scale-[1.005] transition-transform`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{style.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary">{insight.title}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${impactStyles[insight.impact]}`}>{insight.impact} impact</span>
                    </div>
                    <p className="text-xs text-text-muted mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <button className="text-xs font-medium text-electric-400 hover:text-electric-300 transition-colors bg-electric-500/10 px-3 py-1 rounded-lg">
                        {insight.action}
                      </button>
                      <span className="text-[10px] text-text-muted">{insight.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* What-If Simulator */}
      {activeTab === "whatif" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Scenario Presets</h3>
            <div className="space-y-2">
              {whatIfPresets.map((preset, i) => (
                <button key={preset.name} onClick={() => setSelectedScenario(i)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${i === selectedScenario ? "bg-electric-500/15 border border-electric-500/30" : "bg-navy-800/30 hover:bg-navy-800/50 border border-transparent"}`}>
                  <div className="text-xs font-semibold text-text-primary">{preset.name}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Projected Outcome</h3>
            <p className="text-xs text-text-muted mb-4">{whatIfPresets[selectedScenario].description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(whatIfPresets[selectedScenario].modifications).map(([key, value]) => (
                <div key={key} className="p-4 rounded-xl bg-navy-800/40">
                  <div className="text-[10px] text-text-muted uppercase mb-1">{key}</div>
                  <div className={`text-xl font-bold ${(value as number) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {(value as number) > 0 ? "+" : ""}{value as number}%
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                <div className="text-xs font-semibold text-emerald-400 mb-1">Opportunities</div>
                <p className="text-xs text-text-muted">Increased capacity could enable automation of 3 additional workflows, potentially saving $15K/month in operational costs.</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/15">
                <div className="text-xs font-semibold text-amber-400 mb-1">Risks</div>
                <p className="text-xs text-text-muted">Higher volume may exceed current plan limits. LLM API costs projected to increase proportionally. Monitor rate limit headroom.</p>
              </div>
            </div>

            <button className="mt-4 w-full py-2 text-xs font-semibold rounded-lg bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 transition-colors">
              Run Full Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
