"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════
// Crystal Ball — Predictive Insights
// ═══════════════════════════════════════════════

interface Prediction {
  id: string;
  title: string;
  icon: string;
  severity: "critical" | "warning" | "info" | "opportunity";
  confidence: number;
  timeframe: string;
  impact: string;
  description: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  unit: string;
  trend: number[];
  recommendation: string;
  agentSource: string;
}

const PREDICTIONS: Prediction[] = [
  {
    id: "p1", title: "Transaction Volume Surge", icon: "📈", severity: "warning",
    confidence: 0.91, timeframe: "Next 48 hours", impact: "HIGH",
    description: "Based on seasonal patterns and current trajectory, transaction volume will spike 340% above baseline. This will exceed current processing capacity.",
    metric: "Transactions/hour", currentValue: 2840, predictedValue: 9660, unit: "tx/h",
    trend: [2100, 2300, 2500, 2840, 4200, 6100, 8400, 9660],
    recommendation: "Scale FraudGuard and ComplianceBot workers to 5x before Thursday 6 AM UTC.",
    agentSource: "DataMiner",
  },
  {
    id: "p2", title: "Fraud Ring Activation", icon: "🚨", severity: "critical",
    confidence: 0.87, timeframe: "Next 24 hours", impact: "CRITICAL",
    description: "Pattern analysis indicates a dormant fraud ring (linked to 42 accounts) is preparing to activate. Similar pre-activation signals detected in March 2025 attack.",
    metric: "Risk Score", currentValue: 0.34, predictedValue: 0.89, unit: "",
    trend: [0.12, 0.15, 0.18, 0.22, 0.28, 0.34, 0.56, 0.89],
    recommendation: "Preemptively freeze 42 linked accounts and activate enhanced monitoring on associated IP ranges.",
    agentSource: "FraudGuard",
  },
  {
    id: "p3", title: "API Rate Limit Breach", icon: "⚠️", severity: "warning",
    confidence: 0.84, timeframe: "Next 12 hours", impact: "MEDIUM",
    description: "Current API usage growth rate will exceed the 100K daily limit by 3 PM UTC. Top consumer: Partner integration 'FinanceApp' using 67% of quota.",
    metric: "API Calls", currentValue: 67000, predictedValue: 112000, unit: "calls",
    trend: [45000, 48000, 52000, 57000, 62000, 67000, 89000, 112000],
    recommendation: "Contact FinanceApp about usage optimization. Consider upgrading to Enterprise tier (500K limit).",
    agentSource: "DataMiner",
  },
  {
    id: "p4", title: "Compliance Deadline Risk", icon: "📋", severity: "warning",
    confidence: 0.78, timeframe: "5 days", impact: "HIGH",
    description: "47 customer accounts have KYC renewals due in 5 days. At current processing rate (12/day), 11 accounts will miss the deadline, triggering regulatory penalties.",
    metric: "Pending KYC", currentValue: 47, predictedValue: 11, unit: "overdue",
    trend: [47, 35, 23, 19, 16, 14, 12, 11],
    recommendation: "Increase ComplianceBot batch size to 25/day or activate manual reviewer queue for overflow.",
    agentSource: "ComplianceBot",
  },
  {
    id: "p5", title: "Customer Churn Signal", icon: "📉", severity: "opportunity",
    confidence: 0.82, timeframe: "Next 30 days", impact: "MEDIUM",
    description: "3 enterprise customers showing declining engagement patterns: reduced API calls (-40%), fewer logins (-55%), and support ticket about competitor pricing.",
    metric: "Engagement Score", currentValue: 72, predictedValue: 31, unit: "/100",
    trend: [92, 88, 82, 78, 72, 58, 44, 31],
    recommendation: "Trigger proactive outreach via SupportBot. Offer custom pricing review and dedicated success manager call.",
    agentSource: "SupportBot",
  },
  {
    id: "p6", title: "Cost Optimization Found", icon: "💰", severity: "opportunity",
    confidence: 0.94, timeframe: "Immediate", impact: "LOW",
    description: "Analysis shows 34% of LLM calls to gpt-4o could be handled by gpt-4o-mini without quality loss. Potential monthly saving: $1,240.",
    metric: "Monthly Cost", currentValue: 3650, predictedValue: 2410, unit: "$/mo",
    trend: [3650, 3500, 3200, 2900, 2650, 2500, 2440, 2410],
    recommendation: "Enable automatic model routing: route simple classification tasks to gpt-4o-mini, keep complex reasoning on gpt-4o.",
    agentSource: "DataMiner",
  },
];

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: "bg-rose-500/8", border: "border-rose-500/25", text: "text-rose-400", badge: "bg-rose-500/15 text-rose-400" },
  warning: { bg: "bg-amber-500/8", border: "border-amber-500/25", text: "text-amber-400", badge: "bg-amber-500/15 text-amber-400" },
  info: { bg: "bg-electric-500/8", border: "border-electric-500/25", text: "text-electric-400", badge: "bg-electric-500/15 text-electric-400" },
  opportunity: { bg: "bg-emerald-500/8", border: "border-emerald-500/25", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
};

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {/* Endpoint dot */}
      {data.length > 0 && (
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / range) * h}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

export default function CrystalBallPage() {
  const [expandedId, setExpandedId] = useState<string | null>("p2");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const runScan = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => setIsScanning(false), 500);
      }
      setScanProgress(Math.min(progress, 100));
    }, 200);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const criticalCount = PREDICTIONS.filter((p) => p.severity === "critical").length;
  const warningCount = PREDICTIONS.filter((p) => p.severity === "warning").length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔮</span>
            <h1 className="text-2xl font-bold text-text-primary">Crystal Ball</h1>
            <span className="badge badge-info text-[10px]">Predictive Insights</span>
          </div>
          <p className="text-sm text-text-secondary">AI-powered predictions — see problems before they happen.</p>
        </div>
        <button
          onClick={runScan}
          disabled={isScanning}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {isScanning ? <><span className="animate-spin">🔮</span> Scanning... {scanProgress.toFixed(0)}%</> : <>🔮 Run Prediction Scan</>}
        </button>
      </div>

      {/* Scan Progress */}
      {isScanning && (
        <div className="glass-card p-3 mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Analyzing patterns across {PREDICTIONS.length} data streams...</span>
            <div className="flex-1 h-1.5 rounded-full bg-navy-700 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-electric-500 rounded-full transition-all duration-200" style={{ width: `${scanProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Predictions</div>
          <div className="text-2xl font-bold text-text-primary">{PREDICTIONS.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">🚨 Critical</div>
          <div className="text-2xl font-bold text-rose-400">{criticalCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">⚠️ Warnings</div>
          <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">💰 Opportunities</div>
          <div className="text-2xl font-bold text-emerald-400">{PREDICTIONS.filter(p => p.severity === "opportunity").length}</div>
        </div>
      </div>

      {/* Prediction Cards */}
      <div className="space-y-3">
        {PREDICTIONS.map((pred) => {
          const isExpanded = expandedId === pred.id;
          const style = SEVERITY_STYLES[pred.severity];
          const chartColor = pred.severity === "critical" ? "#fb7185" : pred.severity === "warning" ? "#fbbf24" : pred.severity === "opportunity" ? "#34d399" : "#60a5fa";

          return (
            <div key={pred.id} className={`rounded-xl border ${style.border} ${style.bg} transition-all`}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : pred.id)}
                className="w-full p-4 text-left cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{pred.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-text-primary">{pred.title}</h3>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge}`}>
                          {pred.severity}
                        </span>
                        <span className="text-[10px] text-text-muted">· {pred.timeframe}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">{pred.description.slice(0, 100)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MiniChart data={pred.trend} color={chartColor} />
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Confidence</div>
                      <div className={`text-sm font-bold ${style.text}`}>{(pred.confidence * 100).toFixed(0)}%</div>
                    </div>
                    <span className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 animate-fade-in">
                  <div className="border-t border-border pt-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {/* Current vs Predicted */}
                      <div className="bg-navy-900/50 rounded-lg p-3">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Current → Predicted</div>
                        <div className="flex items-end gap-2">
                          <span className="text-lg font-bold text-text-primary">
                            {pred.currentValue.toLocaleString()}
                          </span>
                          <span className="text-text-muted text-sm">→</span>
                          <span className={`text-lg font-bold ${style.text}`}>
                            {pred.predictedValue.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-text-muted">{pred.unit}</span>
                        </div>
                      </div>

                      {/* Impact */}
                      <div className="bg-navy-900/50 rounded-lg p-3">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Impact Level</div>
                        <div className={`text-lg font-bold ${style.text}`}>{pred.impact}</div>
                        <div className="text-[10px] text-text-muted">from {pred.agentSource}</div>
                      </div>

                      {/* Confidence */}
                      <div className="bg-navy-900/50 rounded-lg p-3">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Confidence</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-navy-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pred.confidence > 0.85 ? "bg-emerald-500" : pred.confidence > 0.7 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${pred.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-text-primary">{(pred.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Full Description */}
                    <div className="bg-navy-900/50 rounded-lg p-3 mb-4">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Analysis</div>
                      <p className="text-sm text-text-primary leading-relaxed">{pred.description}</p>
                    </div>

                    {/* Recommendation */}
                    <div className={`rounded-lg p-3 border ${style.border}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">💡</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Recommended Action</span>
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed">{pred.recommendation}</p>
                      <button className="mt-2 px-3 py-1 rounded-lg text-[11px] font-semibold bg-electric-500/15 text-electric-400 border border-electric-500/20 hover:bg-electric-500/25 transition-all">
                        Execute Recommendation →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
