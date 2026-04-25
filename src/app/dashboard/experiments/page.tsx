"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// A/B Testing — Agent Experiments
// ═══════════════════════════════════════════════

interface Experiment {
  id: string;
  name: string;
  agentName: string;
  agentIcon: string;
  status: "running" | "complete" | "draft";
  startDate: string;
  traffic: number;
  variants: Variant[];
  winner?: string;
}

interface Variant {
  id: string;
  name: string;
  color: string;
  model: string;
  prompt: string;
  executions: number;
  successRate: number;
  avgLatency: number;
  avgCost: number;
  satisfaction: number;
}

const EXPERIMENTS: Experiment[] = [
  {
    id: "exp_001", name: "FraudGuard Model Comparison", agentName: "FraudGuard", agentIcon: "🛡️",
    status: "running", startDate: "Mar 20, 2026", traffic: 50,
    variants: [
      { id: "A", name: "Control (GPT-4o)", color: "text-electric-400", model: "gpt-4o", prompt: "Analyze transaction risk...", executions: 1247, successRate: 97.8, avgLatency: 1450, avgCost: 0.042, satisfaction: 4.2 },
      { id: "B", name: "Challenger (Claude 3.5)", color: "text-violet-400", model: "claude-3.5-sonnet", prompt: "Analyze transaction risk...", executions: 1253, successRate: 98.4, avgLatency: 1180, avgCost: 0.038, satisfaction: 4.5 },
    ],
  },
  {
    id: "exp_002", name: "ComplianceBot Prompt Optimization", agentName: "ComplianceBot", agentIcon: "📋",
    status: "complete", startDate: "Mar 10, 2026", traffic: 50, winner: "B",
    variants: [
      { id: "A", name: "Original Prompt", color: "text-electric-400", model: "gpt-4o", prompt: "Review KYC application...", executions: 3420, successRate: 95.2, avgLatency: 2100, avgCost: 0.051, satisfaction: 3.8 },
      { id: "B", name: "Optimized Prompt", color: "text-emerald-400", model: "gpt-4o", prompt: "As a senior compliance officer, systematically verify...", executions: 3380, successRate: 98.1, avgLatency: 2300, avgCost: 0.055, satisfaction: 4.6 },
    ],
  },
  {
    id: "exp_003", name: "SupportBot Temperature Tuning", agentName: "SupportBot", agentIcon: "🎧",
    status: "draft", startDate: "—", traffic: 30,
    variants: [
      { id: "A", name: "Temperature 0.3", color: "text-electric-400", model: "gpt-4o-mini", prompt: "Help the customer...", executions: 0, successRate: 0, avgLatency: 0, avgCost: 0, satisfaction: 0 },
      { id: "B", name: "Temperature 0.7", color: "text-amber-400", model: "gpt-4o-mini", prompt: "Help the customer...", executions: 0, successRate: 0, avgLatency: 0, avgCost: 0, satisfaction: 0 },
    ],
  },
];

function StatBar({ a, b, metric, higherIsBetter = true }: { a: number; b: number; metric: string; higherIsBetter?: boolean }) {
  const total = a + b || 1;
  const aWidth = (a / total) * 100;
  const aWins = higherIsBetter ? a > b : a < b;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
        <span>{metric}</span>
        <span className={aWins ? "text-electric-400" : "text-violet-400"}>
          {aWins ? "A wins" : "B wins"} ({Math.abs(((a - b) / (b || 1)) * 100).toFixed(1)}%)
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="bg-electric-500 rounded-l-full" style={{ width: `${aWidth}%` }} />
        <div className="bg-violet-500 rounded-r-full" style={{ width: `${100 - aWidth}%` }} />
      </div>
    </div>
  );
}

export default function ABTestingPage() {
  const [selectedExp, setSelectedExp] = useState<Experiment>(EXPERIMENTS[0]);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🧪</span>
            <h1 className="text-2xl font-bold text-text-primary">A/B Testing</h1>
            <span className="badge badge-info text-[10px]">Agent Experiments</span>
          </div>
          <p className="text-sm text-text-secondary">Compare agent configurations side-by-side with statistical rigor.</p>
        </div>
        <button className="btn-primary text-sm">+ New Experiment</button>
      </div>

      {/* Experiment List */}
      <div className="flex gap-3 mb-6">
        {EXPERIMENTS.map(exp => (
          <button key={exp.id} onClick={() => setSelectedExp(exp)}
            className={`glass-card px-4 py-3 text-left flex-1 cursor-pointer transition-all ${selectedExp.id === exp.id ? "!border-electric-500/40 glow-blue" : "hover:border-border-active"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{exp.agentIcon}</span>
              <span className="text-sm font-bold text-text-primary">{exp.name}</span>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                exp.status === "running" ? "bg-emerald-500/15 text-emerald-400" : exp.status === "complete" ? "bg-electric-500/15 text-electric-400" : "bg-navy-600 text-text-muted"
              }`}>{exp.status}</span>
            </div>
            <div className="text-[11px] text-text-muted">{exp.agentName} · Started {exp.startDate} · {exp.traffic}% traffic split</div>
          </button>
        ))}
      </div>

      {/* Experiment Detail */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{selectedExp.name}</h3>
            <div className="text-[11px] text-text-muted">Traffic split: {selectedExp.traffic}% / {100 - selectedExp.traffic}%{selectedExp.winner ? ` · Winner: Variant ${selectedExp.winner}` : ""}</div>
          </div>
          {selectedExp.status === "running" && (
            <div className="flex gap-2">
              <button className="btn-secondary text-[11px] !py-1.5">⏸ Pause</button>
              <button className="btn-primary text-[11px] !py-1.5">🏆 Declare Winner</button>
            </div>
          )}
        </div>

        {/* Variant Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {selectedExp.variants.map(variant => (
            <div key={variant.id} className={`rounded-xl border p-4 ${selectedExp.winner === variant.id ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-navy-900/50"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${variant.color}`}>Variant {variant.id}</span>
                  <span className="text-sm text-text-primary">{variant.name}</span>
                  {selectedExp.winner === variant.id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">🏆 WINNER</span>}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-navy-700 text-text-muted font-mono">{variant.model}</span>
              </div>

              {variant.executions > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-text-muted">Executions</div>
                    <div className="text-lg font-bold text-text-primary">{variant.executions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">Success Rate</div>
                    <div className={`text-lg font-bold ${variant.successRate > 98 ? "text-emerald-400" : "text-text-primary"}`}>{variant.successRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">Avg Latency</div>
                    <div className="text-lg font-bold text-text-primary">{variant.avgLatency}ms</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">Avg Cost</div>
                    <div className="text-lg font-bold text-text-primary">${variant.avgCost.toFixed(3)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-text-muted">User Satisfaction</div>
                    <div className="text-lg font-bold text-amber-400">{"★".repeat(Math.round(variant.satisfaction))}{"☆".repeat(5 - Math.round(variant.satisfaction))} {variant.satisfaction}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-text-muted text-sm">No data yet — experiment not started</div>
              )}
            </div>
          ))}
        </div>

        {/* Statistical Comparison */}
        {selectedExp.variants[0].executions > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Statistical Comparison</h4>
            <StatBar a={selectedExp.variants[0].successRate} b={selectedExp.variants[1].successRate} metric="Success Rate (%)" />
            <StatBar a={selectedExp.variants[0].avgLatency} b={selectedExp.variants[1].avgLatency} metric="Latency (ms)" higherIsBetter={false} />
            <StatBar a={selectedExp.variants[0].avgCost} b={selectedExp.variants[1].avgCost} metric="Cost ($)" higherIsBetter={false} />
            <StatBar a={selectedExp.variants[0].satisfaction} b={selectedExp.variants[1].satisfaction} metric="Satisfaction (★)" />
            <div className="mt-2 text-[10px] text-text-muted">
              <span className="text-emerald-400">✓ Statistically significant</span> (p-value: 0.003, confidence: 99.7%, sample size: {(selectedExp.variants[0].executions + selectedExp.variants[1].executions).toLocaleString()})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
