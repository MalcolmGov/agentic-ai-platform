"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// Simulated Execution Data — Glass Box AI
// ═══════════════════════════════════════════════

interface ReasoningStep {
  id: string;
  phase: "observe" | "retrieve" | "reason" | "plan" | "execute" | "evaluate";
  title: string;
  duration: number;
  timestamp: string;
  icon: string;
  status: "success" | "warning" | "error";
  summary: string;
  details: {
    type: "llm" | "tool" | "decision" | "memory" | "output";
    input?: string;
    output?: string;
    model?: string;
    tokens?: number;
    cost?: number;
    confidence?: number;
    reasoning?: string;
    toolName?: string;
    toolParams?: Record<string, unknown>;
    toolResult?: unknown;
    memoryKey?: string;
    memoryAction?: string;
  };
}

interface ExecutionReplay {
  id: string;
  agentName: string;
  agentType: string;
  triggeredBy: string;
  startedAt: string;
  completedAt: string;
  totalDuration: number;
  totalTokens: number;
  totalCost: number;
  status: "completed" | "failed";
  steps: ReasoningStep[];
}

const DEMO_EXECUTIONS: ExecutionReplay[] = [
  {
    id: "exec_fraud_001",
    agentName: "FraudGuard",
    agentType: "FRAUD_MONITORING",
    triggeredBy: "webhook: transaction.created",
    startedAt: "2026-03-26T04:12:33Z",
    completedAt: "2026-03-26T04:12:36Z",
    totalDuration: 3247,
    totalTokens: 2847,
    totalCost: 0.0284,
    status: "completed",
    steps: [
      {
        id: "s1", phase: "observe", title: "Received Transaction Event", duration: 12, timestamp: "04:12:33.000",
        icon: "👁️", status: "success", summary: "Webhook payload received — $8,750 wire transfer from Account #4821",
        details: {
          type: "tool", toolName: "parse_webhook",
          input: '{"event":"transaction.created","data":{"amount":8750,"currency":"USD","type":"wire","from":"ACC-4821","to":"ACC-9173","country":"NG","ip":"196.21.45.88"}}',
          output: '{"parsed":true,"riskFlags":["high_amount","cross_border","new_recipient"]}',
        },
      },
      {
        id: "s2", phase: "retrieve", title: "Memory: Account History Lookup", duration: 45, timestamp: "04:12:33.012",
        icon: "💾", status: "success", summary: "Retrieved 6 months of transaction history for ACC-4821",
        details: {
          type: "memory", memoryAction: "search", memoryKey: "account_history:ACC-4821",
          input: "Query: Last 180 days of transactions for ACC-4821",
          output: '{"totalTransactions":847,"avgAmount":1250,"maxAmount":3200,"flaggedCount":2,"lastFlagged":"2026-02-14"}',
        },
      },
      {
        id: "s3", phase: "retrieve", title: "Memory: Recipient Risk Profile", duration: 38, timestamp: "04:12:33.057",
        icon: "💾", status: "warning", summary: "Recipient ACC-9173 has no prior transaction history — new entity",
        details: {
          type: "memory", memoryAction: "search", memoryKey: "recipient_profile:ACC-9173",
          input: "Query: Risk profile and history for ACC-9173",
          output: '{"found":false,"isNewRecipient":true,"riskLevel":"unknown","note":"First transaction to this recipient"}',
        },
      },
      {
        id: "s4", phase: "reason", title: "LLM: Risk Analysis", duration: 1847, timestamp: "04:12:33.095",
        icon: "🧠", status: "success", summary: "GPT-4o analyzed 5 risk factors — concluded HIGH RISK (0.87)",
        details: {
          type: "llm", model: "gpt-4o", tokens: 1523, cost: 0.0152,
          input: `SYSTEM: You are FraudGuard, a real-time fraud detection agent. Analyze the following transaction and provide a risk score (0-1) with reasoning.

TRANSACTION:
- Amount: $8,750 USD (wire transfer)
- From: ACC-4821 (avg $1,250, max $3,200 in 6mo)
- To: ACC-9173 (NEW recipient, no history)  
- Origin: Nigeria (IP: 196.21.45.88)
- Time: 04:12 UTC (unusual hours)

ACCOUNT HISTORY:
- 847 transactions in 6 months
- 2 previously flagged (last: Feb 14)
- Average: $1,250, Maximum: $3,200

Provide risk_score, risk_factors[], and recommendation.`,
          output: `{
  "risk_score": 0.87,
  "risk_factors": [
    "Amount ($8,750) is 2.7x the historical maximum ($3,200)",
    "New recipient with no transaction history",
    "Cross-border wire transfer to unverified entity",
    "Transaction at unusual hours (04:12 UTC)",
    "Account has 2 prior flags in last 6 months"
  ],
  "recommendation": "BLOCK",
  "confidence": 0.92,
  "reasoning": "The combination of significantly elevated amount, new unverified recipient, cross-border nature, and unusual timing creates a high-risk profile. The account's prior flagging history further compounds the risk. Recommend immediate block and manual review."
}`,
          reasoning: "The combination of significantly elevated amount, new unverified recipient, cross-border nature, and unusual timing creates a high-risk profile.",
          confidence: 0.92,
        },
      },
      {
        id: "s5", phase: "plan", title: "Decision: Block Transaction", duration: 23, timestamp: "04:12:34.942",
        icon: "🔀", status: "success", summary: "Risk score 0.87 exceeds threshold 0.70 → BLOCK path selected",
        details: {
          type: "decision",
          reasoning: "Risk score (0.87) > threshold (0.70). Policy requires blocking transactions above threshold and notifying compliance team. Selected BLOCK action chain.",
          input: "Condition: riskScore (0.87) > threshold (0.70)",
          output: "Action: BLOCK → notify_compliance → create_case",
          confidence: 0.92,
        },
      },
      {
        id: "s6", phase: "execute", title: "Tool: Block Transaction", duration: 156, timestamp: "04:12:34.965",
        icon: "🔧", status: "success", summary: "Transaction TXN-28491 blocked successfully",
        details: {
          type: "tool", toolName: "block_transaction",
          toolParams: { transactionId: "TXN-28491", reason: "High risk score (0.87)", blockedBy: "FraudGuard" },
          input: '{"transactionId":"TXN-28491","reason":"High risk score (0.87)"}',
          output: '{"success":true,"blockId":"BLK-7721","timestamp":"2026-03-26T04:12:35.121Z"}',
        },
      },
      {
        id: "s7", phase: "execute", title: "Tool: Notify Compliance", duration: 89, timestamp: "04:12:35.121",
        icon: "🔧", status: "success", summary: "Alert sent to #compliance-alerts Slack channel",
        details: {
          type: "tool", toolName: "send_slack_alert",
          toolParams: { channel: "#compliance-alerts", severity: "HIGH", transactionId: "TXN-28491" },
          input: '{"channel":"#compliance-alerts","message":"🚨 HIGH RISK: $8,750 wire blocked (TXN-28491)"}',
          output: '{"delivered":true,"messageId":"msg_991","channel":"#compliance-alerts"}',
        },
      },
      {
        id: "s8", phase: "execute", title: "Tool: Create Investigation Case", duration: 134, timestamp: "04:12:35.210",
        icon: "🔧", status: "success", summary: "Case CASE-1847 created and assigned to compliance queue",
        details: {
          type: "tool", toolName: "create_case",
          toolParams: { type: "fraud_investigation", priority: "HIGH", assignee: "compliance_queue" },
          input: '{"type":"fraud_investigation","transactionId":"TXN-28491","riskScore":0.87}',
          output: '{"caseId":"CASE-1847","status":"open","assignedTo":"compliance_queue","sla":"4h"}',
        },
      },
      {
        id: "s9", phase: "evaluate", title: "LLM: Generate Audit Summary", duration: 892, timestamp: "04:12:35.344",
        icon: "🧠", status: "success", summary: "Generated compliance-ready audit report with full reasoning chain",
        details: {
          type: "llm", model: "gpt-4o-mini", tokens: 1324, cost: 0.0132,
          input: "Generate a compliance-ready audit summary for this fraud detection action. Include risk factors, decision rationale, and actions taken.",
          output: `AUDIT SUMMARY — FraudGuard Execution
═══════════════════════════════════
Transaction: TXN-28491 ($8,750 USD wire)
Risk Score: 0.87 / 1.00 (HIGH)
Decision: BLOCKED
Time: 3.2 seconds (automated)

Risk Factors Identified:
1. Amount 2.7x historical maximum
2. New unverified recipient
3. Cross-border wire transfer
4. Unusual transaction hours
5. Prior flagging history

Actions Taken:
✓ Transaction blocked (BLK-7721)
✓ Compliance team notified (#compliance-alerts)
✓ Investigation case created (CASE-1847, SLA: 4h)

Confidence: 92% | Model: gpt-4o | Tokens: 2,847`,
          confidence: 0.92,
        },
      },
    ],
  },
  {
    id: "exec_compliance_001",
    agentName: "ComplianceBot",
    agentType: "COMPLIANCE",
    triggeredBy: "scheduled: daily KYC review",
    startedAt: "2026-03-26T08:00:01Z",
    completedAt: "2026-03-26T08:00:04Z",
    totalDuration: 2891,
    totalTokens: 1956,
    totalCost: 0.0196,
    status: "completed",
    steps: [
      {
        id: "c1", phase: "observe", title: "Scheduled Trigger: Daily KYC", duration: 8, timestamp: "08:00:01.000",
        icon: "👁️", status: "success", summary: "Daily KYC review triggered — 23 new customers pending verification",
        details: { type: "tool", toolName: "query_pending_kyc", input: "SELECT * FROM customers WHERE kyc_status = 'PENDING'", output: '{"count":23,"oldest":"2026-03-24"}' },
      },
      {
        id: "c2", phase: "reason", title: "LLM: Batch Risk Assessment", duration: 1456, timestamp: "08:00:01.008",
        icon: "🧠", status: "success", summary: "Assessed 23 customers — 20 approved, 2 flagged, 1 rejected",
        details: { type: "llm", model: "gpt-4o", tokens: 1200, cost: 0.012, input: "Batch assess 23 pending KYC applications...", output: '{"approved":20,"flagged":2,"rejected":1}', confidence: 0.95 },
      },
      {
        id: "c3", phase: "execute", title: "Tool: Update KYC Statuses", duration: 234, timestamp: "08:00:02.464",
        icon: "🔧", status: "success", summary: "Updated 23 customer records in database",
        details: { type: "tool", toolName: "batch_update_kyc", input: '{"updates":23}', output: '{"updated":23,"errors":0}' },
      },
      {
        id: "c4", phase: "execute", title: "Tool: Send Rejection Notice", duration: 67, timestamp: "08:00:02.698",
        icon: "🔧", status: "warning", summary: "Rejection email sent to 1 customer — manual review recommended",
        details: { type: "tool", toolName: "send_email", input: '{"template":"kyc_rejection","to":"customer@example.com"}', output: '{"sent":true,"warning":"High-risk jurisdiction"}' },
      },
      {
        id: "c5", phase: "evaluate", title: "LLM: Daily Summary", duration: 756, timestamp: "08:00:02.765",
        icon: "🧠", status: "success", summary: "Generated daily compliance summary report",
        details: { type: "llm", model: "gpt-4o-mini", tokens: 756, cost: 0.0076, input: "Summarize today's KYC review...", output: "Daily KYC Report: 23 processed, 20 approved, 2 flagged for review, 1 rejected.", confidence: 0.98 },
      },
    ],
  },
];

// Phase colors and labels
const PHASE_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  observe: { color: "text-amber-400", bgColor: "bg-amber-500/15 border-amber-500/20", label: "Observe" },
  retrieve: { color: "text-indigo-400", bgColor: "bg-indigo-500/15 border-indigo-500/20", label: "Retrieve" },
  reason: { color: "text-violet-400", bgColor: "bg-violet-500/15 border-violet-500/20", label: "Reason" },
  plan: { color: "text-teal-400", bgColor: "bg-teal-500/15 border-teal-500/20", label: "Plan" },
  execute: { color: "text-electric-400", bgColor: "bg-electric-500/15 border-electric-500/20", label: "Execute" },
  evaluate: { color: "text-emerald-400", bgColor: "bg-emerald-500/15 border-emerald-500/20", label: "Evaluate" },
};

// ═══════════════════════════════════════════════
// Glass Box AI Page
// ═══════════════════════════════════════════════

export default function GlassBoxPage() {
  const [selectedExec, setSelectedExec] = useState<ExecutionReplay>(DEMO_EXECUTIONS[0]);
  const [expandedStep, setExpandedStep] = useState<string | null>("s4");
  const [showRaw, setShowRaw] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate PDF export
    await new Promise((r) => setTimeout(r, 1500));
    setIsExporting(false);
    // In production: generate PDF with jsPDF or server-side
    alert("Compliance report exported as PDF");
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔍</span>
            <h1 className="text-2xl font-bold text-text-primary">Glass Box AI</h1>
            <span className="badge badge-info text-[10px]">Reasoning Replay</span>
          </div>
          <p className="text-sm text-text-secondary">
            Full transparency into every AI decision. Click any step to see exactly why.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <span className="animate-spin">⏳</span> Exporting...
            </>
          ) : (
            <>📄 Export Compliance PDF</>
          )}
        </button>
      </div>

      {/* Execution Selector */}
      <div className="flex gap-3 mb-6">
        {DEMO_EXECUTIONS.map((exec) => (
          <button
            key={exec.id}
            onClick={() => { setSelectedExec(exec); setExpandedStep(null); }}
            className={`glass-card px-4 py-3 text-left flex-1 cursor-pointer transition-all ${
              selectedExec.id === exec.id
                ? "!border-electric-500/40 glow-blue"
                : "hover:border-border-active"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${exec.status === "completed" ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className="text-sm font-bold text-text-primary">{exec.agentName}</span>
              <span className="text-[10px] text-text-muted uppercase">{exec.agentType.replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span>{exec.totalDuration}ms</span>
              <span>•</span>
              <span>{exec.totalTokens} tokens</span>
              <span>•</span>
              <span>${exec.totalCost.toFixed(4)}</span>
              <span>•</span>
              <span>{exec.steps.length} steps</span>
            </div>
          </button>
        ))}
      </div>

      {/* Execution Overview Bar */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Triggered By</div>
              <div className="text-sm text-text-primary font-mono">{selectedExec.triggeredBy}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Started</div>
              <div className="text-sm text-text-primary">{new Date(selectedExec.startedAt).toLocaleTimeString()}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Duration</div>
              <div className="text-sm text-text-primary font-mono">{selectedExec.totalDuration}ms</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Tokens</div>
              <div className="text-sm text-text-primary font-mono">{selectedExec.totalTokens.toLocaleString()}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Cost</div>
              <div className="text-sm text-emerald-400 font-mono">${selectedExec.totalCost.toFixed(4)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className={`px-3 py-1 text-[11px] rounded-lg border transition-colors ${
                showRaw ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-border text-text-muted hover:text-text-primary"
              }`}
            >
              {showRaw ? "🔓 Raw JSON" : "🔒 Raw JSON"}
            </button>
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-navy-900">
          {selectedExec.steps.map((step) => {
            const pct = (step.duration / selectedExec.totalDuration) * 100;
            const phaseColors: Record<string, string> = {
              observe: "bg-amber-500", retrieve: "bg-indigo-500", reason: "bg-violet-500",
              plan: "bg-teal-500", execute: "bg-electric-500", evaluate: "bg-emerald-500",
            };
            return (
              <div
                key={step.id}
                className={`${phaseColors[step.phase]} transition-all hover:opacity-80 cursor-pointer`}
                style={{ width: `${Math.max(pct, 1)}%` }}
                title={`${step.title} (${step.duration}ms)`}
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              />
            );
          })}
        </div>
        <div className="flex gap-4 mt-2">
          {Object.entries(PHASE_CONFIG).map(([key, cfg]) => {
            const count = selectedExec.steps.filter((s) => s.phase === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 text-[10px]">
                <span className={`w-2 h-2 rounded-full ${key === "observe" ? "bg-amber-500" : key === "retrieve" ? "bg-indigo-500" : key === "reason" ? "bg-violet-500" : key === "plan" ? "bg-teal-500" : key === "execute" ? "bg-electric-500" : "bg-emerald-500"}`} />
                <span className="text-text-muted">{cfg.label} ({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reasoning Timeline */}
      <div className="space-y-0">
        {selectedExec.steps.map((step, idx) => {
          const isExpanded = expandedStep === step.id;
          const phaseConfig = PHASE_CONFIG[step.phase];
          const isLast = idx === selectedExec.steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center w-10 shrink-0">
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all z-10 cursor-pointer ${
                    isExpanded
                      ? `${phaseConfig.bgColor} border-current scale-110`
                      : "bg-navy-800 border-border hover:border-border-active hover:scale-105"
                  }`}
                >
                  {step.icon}
                </button>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 ${isExpanded ? "bg-electric-500/30" : "bg-border"}`} />
                )}
              </div>

              {/* Step Content */}
              <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                    isExpanded
                      ? `${phaseConfig.bgColor} shadow-lg`
                      : "bg-navy-900/50 border-border hover:border-border-active hover:bg-navy-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${phaseConfig.color}`}>
                        {phaseConfig.label}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">{step.title}</span>
                      {step.status === "warning" && <span className="text-amber-400 text-xs">⚠️</span>}
                      {step.status === "error" && <span className="text-rose-400 text-xs">❌</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      <span className="font-mono">{step.timestamp}</span>
                      <span className="font-mono">{step.duration}ms</span>
                      {step.details.tokens && <span className="font-mono">{step.details.tokens} tok</span>}
                      <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{step.summary}</p>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-2 rounded-xl border border-border bg-navy-900/80 overflow-hidden animate-fade-in">
                    {/* Reasoning (if LLM or Decision) */}
                    {step.details.reasoning && (
                      <div className="p-4 border-b border-border">
                        <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                          💭 Chain of Thought
                        </div>
                        <p className="text-sm text-text-primary leading-relaxed italic">
                          &ldquo;{step.details.reasoning}&rdquo;
                        </p>
                        {step.details.confidence !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-text-muted">Confidence:</span>
                            <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-navy-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  step.details.confidence > 0.8 ? "bg-emerald-500" : step.details.confidence > 0.5 ? "bg-amber-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${step.details.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-text-primary">
                              {(step.details.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input / Output */}
                    <div className="grid grid-cols-2 divide-x divide-border">
                      {step.details.input && (
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-electric-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span>→</span> Input
                            {step.details.model && (
                              <span className="ml-auto text-text-muted font-normal normal-case">
                                {step.details.model}
                              </span>
                            )}
                          </div>
                          <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                            {showRaw ? step.details.input : formatContent(step.details.input)}
                          </pre>
                        </div>
                      )}
                      {step.details.output && (
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span>←</span> Output
                            {step.details.cost !== undefined && (
                              <span className="ml-auto text-text-muted font-normal normal-case">
                                ${step.details.cost.toFixed(4)}
                              </span>
                            )}
                          </div>
                          <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                            {showRaw ? step.details.output : formatContent(step.details.output)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Tool Details */}
                    {step.details.toolName && (
                      <div className="p-3 border-t border-border bg-navy-950/50 flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-electric-500/10 text-electric-400 font-mono">
                          {step.details.toolName}()
                        </span>
                        {step.details.toolParams && (
                          <span className="text-[10px] text-text-muted font-mono">
                            params: {JSON.stringify(step.details.toolParams)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Memory Details */}
                    {step.details.memoryAction && (
                      <div className="p-3 border-t border-border bg-navy-950/50 flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                          memory.{step.details.memoryAction}()
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          key: {step.details.memoryKey}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Footer */}
      <div className="glass-card p-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-sm font-semibold text-text-primary">Compliance Ready</div>
              <div className="text-[11px] text-text-secondary">
                Full audit trail with LLM reasoning, tool execution, and decision rationale. SOC 2 & ISO 27001 compatible.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-active text-[10px]">✓ Tamper-proof</span>
            <span className="badge badge-info text-[10px]">✓ Exportable</span>
            <span className="badge badge-neutral text-[10px]">✓ Searchable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function formatContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
}
