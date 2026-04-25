"use client";

import { useState } from "react";

const timelines = [
  {
    id: "exec_wf_001", workflowName: "Fraud Detection Pipeline", status: "completed" as const, duration: "12.4s", startedAt: "1 hour ago",
    steps: [
      { name: "Ingest Transaction", duration: "340ms", input: "txn_001, $25,000, USD, CY", output: "validated, enriched, 2 risk flags", status: "success" as const },
      { name: "Risk Scoring", duration: "4.2s", input: "2 risk flags, $25,000", output: "Risk: 0.72 (HIGH) — high_value, high_risk_country", status: "success" as const },
      { name: "Compliance Check", duration: "5.8s", input: "Risk 0.72, Country CY", output: "No sanctions match, KYC valid, Status: CLEAR", status: "success" as const },
      { name: "Decision & Alert", duration: "2.1s", input: "Risk 0.72, Compliance CLEAR", output: "Flagged for review, alert sent to analyst team", status: "success" as const },
    ],
  },
  {
    id: "exec_wf_002", workflowName: "Support Ticket Router", status: "completed" as const, duration: "4.8s", startedAt: "2 hours ago",
    steps: [
      { name: "Classify Ticket", duration: "1.2s", input: "Subject: Cannot login to account", output: "Category: auth, Priority: HIGH, Sentiment: negative", status: "success" as const },
      { name: "Route to Agent", duration: "800ms", input: "Category: auth, Priority: HIGH", output: "Assigned: Support Agent, Queue: 0, Wait: 0 min", status: "success" as const },
      { name: "Generate Response", duration: "2.8s", input: "Auth issue, error 403", output: "Auto-resolved: Clear cache and retry. Confidence: 87%", status: "success" as const },
    ],
  },
];

const stepStatusColors: Record<string, string> = { success: "bg-emerald-500", failed: "bg-rose-500", running: "bg-blue-500" };

export default function WorkflowReplayPage() {
  const [selectedTimeline, setSelectedTimeline] = useState(0);
  const [replayStep, setReplayStep] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const timeline = timelines[selectedTimeline];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Workflow Replay & Time Travel</h1>
        <p className="text-text-secondary mt-1">Replay executions, modify inputs at any step, compare outcomes</p>
      </div>

      {/* Timeline Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {timelines.map((t, i) => (
          <button key={t.id} onClick={() => { setSelectedTimeline(i); setReplayStep(null); setShowDiff(false); }}
            className={`glass-card p-4 text-left transition-all ${i === selectedTimeline ? "border-electric-500/30 bg-electric-500/5" : ""}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-text-primary">{t.workflowName}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">{t.status}</span>
            </div>
            <div className="flex gap-4 text-[10px] text-text-muted">
              <span>{t.steps.length} steps</span>
              <span>{t.duration}</span>
              <span>{t.startedAt}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Execution Timeline */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Execution Timeline — {timeline.workflowName}</h2>
          {replayStep !== null && (
            <button onClick={() => setShowDiff(!showDiff)}
              className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-3 py-1 rounded-lg hover:bg-violet-500/20 transition-colors">
              {showDiff ? "Hide" : "Show"} What-If Comparison
            </button>
          )}
        </div>

        <div className="space-y-0">
          {timeline.steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < timeline.steps.length - 1 && <div className="absolute left-[15px] top-[36px] w-px h-[calc(100%-20px)] bg-border" />}

              <div className={`flex gap-4 p-4 rounded-xl transition-all cursor-pointer ${replayStep === i ? "bg-electric-500/10 border border-electric-500/20" : "hover:bg-navy-800/30"}`}
                onClick={() => setReplayStep(i)}>
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-[10px] h-[10px] rounded-full ${stepStatusColors[step.status]} ring-4 ring-navy-900`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-text-primary">{step.name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{step.duration}</span>
                    {replayStep === i && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-electric-500/15 text-electric-400 font-semibold">selected</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-navy-800/40">
                      <div className="text-[9px] text-text-muted uppercase mb-0.5">Input</div>
                      <div className="text-[11px] text-text-secondary">{step.input}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-navy-800/40">
                      <div className="text-[9px] text-text-muted uppercase mb-0.5">Output</div>
                      <div className="text-[11px] text-text-secondary">{step.output}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Replay Controls */}
      {replayStep !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Modify Input at Step {replayStep + 1}: {timeline.steps[replayStep].name}</h3>
            <div className="space-y-3">
              <textarea
                defaultValue={timeline.steps[replayStep].input}
                className="w-full px-3 py-2 text-xs rounded-lg bg-navy-800/60 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric-500/50 h-20 resize-none font-mono"
              />
              <button className="w-full py-2 text-xs font-semibold rounded-lg bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 transition-colors">
                Replay from Step {replayStep + 1}
              </button>
            </div>
          </div>

          {showDiff && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">What-If Comparison</h3>
              <div className="space-y-3">
                {timeline.steps.slice(replayStep).map((step, i) => (
                  <div key={i} className="p-3 rounded-xl bg-navy-800/30">
                    <div className="text-xs font-medium text-text-primary mb-1">{step.name}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-navy-800/40">
                        <div className="text-[9px] text-text-muted mb-0.5">Original</div>
                        <div className="text-[10px] text-text-secondary">{step.output}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/15">
                        <div className="text-[9px] text-violet-400 mb-0.5">Modified</div>
                        <div className="text-[10px] text-text-secondary italic">Run replay to see projected output</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
