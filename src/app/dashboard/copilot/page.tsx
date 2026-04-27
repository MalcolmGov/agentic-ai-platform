"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════
// AI Ops Copilot — Natural Language Control Plane
// ═══════════════════════════════════════════════

interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  action?: ExecutedAction;
}

interface ExecutedAction {
  type: "deploy" | "configure" | "status" | "analyze" | "alert" | "scale" | "schedule";
  label: string;
  icon: string;
  status: "success" | "pending" | "error";
  details: Record<string, unknown>;
  duration?: number;
}

// Quick command suggestions
const QUICK_COMMANDS = [
  { label: "Deploy fraud agent", icon: "🚀", cmd: "Deploy a fraud monitoring agent for transactions above $5,000" },
  { label: "Show agent status", icon: "📊", cmd: "Show me the current status of all active agents" },
  { label: "Analyze today's alerts", icon: "🔍", cmd: "Analyze today's alerts and summarize patterns" },
  { label: "Scale ComplianceBot", icon: "📈", cmd: "Scale ComplianceBot to handle 3x current throughput" },
  { label: "Schedule daily report", icon: "📅", cmd: "Schedule a daily fraud report at 8 AM" },
  { label: "Pause DocProcessor", icon: "⏸️", cmd: "Pause the DocProcessor agent until further notice" },
];

// ─── API call with streaming ────────────────────────────────
async function streamCopilot(
  messages: { role: string; content: string }[],
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  try {
    const res = await fetch("/api/orchestration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, stream: true }),
    });

    if (!res.ok) {
      // Non-streaming JSON fallback
      const json = await res.json();
      onDelta(json?.data?.content ?? "Something went wrong.");
      onDone();
      return;
    }

    const contentType = res.headers.get("content-type") ?? "";

    // Non-streaming JSON response (e.g. fallback mode)
    if (!contentType.includes("text/event-stream")) {
      const json = await res.json();
      onDelta(json?.data?.content ?? "");
      onDone();
      return;
    }

    // Streaming SSE
    const reader = res.body?.getReader();
    if (!reader) { onError("No response body"); return; }
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") { onDone(); return; }
        try {
          const { delta } = JSON.parse(payload);
          if (delta) onDelta(delta);
        } catch { /* skip malformed */ }
      }
    }
    onDone();
  } catch (err) {
    onError((err as Error).message);
  }
}

// Placeholder — kept only for typing; unused after wiring API
const SIMULATED_RESPONSES: Record<string, { text: string; action: ExecutedAction }> = {
  deploy: {
    text: `✅ **FraudGuard-v2** deployed successfully.

**Configuration:**
- **Type:** FRAUD_MONITORING
- **Model:** gpt-4o
- **Threshold:** $5,000+
- **Tools:** query_transactions, calculate_risk_score, send_alert, block_account
- **Schedule:** Real-time (webhook triggered)
- **Status:** ACTIVE

The agent is now monitoring all incoming transactions above $5,000. It will automatically flag high-risk transactions and notify the compliance team via Slack.`,
    action: {
      type: "deploy",
      label: "Agent Deployed: FraudGuard-v2",
      icon: "🚀",
      status: "success",
      details: { agentName: "FraudGuard-v2", type: "FRAUD_MONITORING", model: "gpt-4o", threshold: "$5,000+" },
      duration: 2340,
    },
  },
  status: {
    text: `📊 **Active Agent Status Report**

| Agent | Type | Status | Executions (24h) | Success Rate | Avg Latency |
|-------|------|--------|-----------------|--------------|-------------|
| FraudGuard | Fraud Monitoring | 🟢 Active | 847 | 99.2% | 1.2s |
| ComplianceBot | Compliance | 🟢 Active | 312 | 98.7% | 2.1s |
| ReportGen | Reporting | 🟢 Active | 24 | 100% | 3.4s |
| SupportBot | Customer Support | 🟢 Active | 1,247 | 97.8% | 0.8s |
| DataMiner | Data Analysis | 🟢 Active | 156 | 99.4% | 4.2s |
| EmailAgent | Email | 🟢 Active | 89 | 100% | 1.1s |
| DocProcessor | Document Processing | ⏸️ Paused | 0 | — | — |

**Summary:** 12 agents active, 1 paused. Total: 2,675 executions in the last 24 hours. Overall success rate: 98.9%.`,
    action: {
      type: "status",
      label: "Agent Status Retrieved",
      icon: "📊",
      status: "success",
      details: { activeAgents: 12, pausedAgents: 1, totalExecutions: 2675, successRate: "98.9%" },
      duration: 450,
    },
  },
  analyze: {
    text: `🔍 **Alert Analysis — Last 24 Hours**

**4 alerts detected** with the following patterns:

1. 🔴 **Unusual Login Pattern** (CRITICAL)
   - Admin account accessed from 3 countries in 2 hours
   - Recommendation: Enable MFA enforcement

2. 🟡 **API Rate Limit Approaching** (WARNING)
   - 87% of daily quota used (87,000/100,000)
   - Recommendation: Consider upgrading plan or optimizing queries

3. 🟢 **Daily Compliance Report** (INFO)
   - All 847 transactions passed screening
   - No action needed

4. 🔴 **Failed Transaction Spike** (CRITICAL)
   - 22 failed transactions in 15 minutes (baseline: 3)
   - Recommendation: Investigate payment processor connectivity

**AI Insight:** The login pattern and transaction spike may be correlated — suggest investigating whether the unusual access triggered the failures.`,
    action: {
      type: "analyze",
      label: "Alert Analysis Complete",
      icon: "🔍",
      status: "success",
      details: { totalAlerts: 4, critical: 2, warning: 1, info: 1, correlation: true },
      duration: 3120,
    },
  },
  scale: {
    text: `📈 **ComplianceBot scaled successfully.**

**Changes:**
- **Previous capacity:** 100 req/min
- **New capacity:** 300 req/min (3x)
- **Workers:** 1 → 3
- **Queue priority:** Normal → High
- **Estimated cost increase:** +$45/day

The scaling took effect immediately. ComplianceBot can now handle 3x the current throughput. I've also set up auto-scaling rules to scale down during off-peak hours (10 PM - 6 AM) to optimize costs.`,
    action: {
      type: "scale",
      label: "ComplianceBot Scaled 3x",
      icon: "📈",
      status: "success",
      details: { agent: "ComplianceBot", previousCapacity: "100/min", newCapacity: "300/min", workers: 3 },
      duration: 1890,
    },
  },
  schedule: {
    text: `📅 **Daily fraud report scheduled.**

**Schedule Details:**
- **Time:** Every day at 8:00 AM UTC
- **Agent:** ReportGen
- **Report includes:** Fraud metrics, risk trends, blocked transactions, compliance status
- **Delivery:** Email to compliance@acme.com + Slack #daily-reports
- **First run:** Tomorrow, March 27, 2026 at 8:00 AM

The schedule has been created and the ReportGen agent will automatically trigger at the specified time.`,
    action: {
      type: "schedule",
      label: "Daily Report Scheduled",
      icon: "📅",
      status: "success",
      details: { cron: "0 8 * * *", agent: "ReportGen", delivery: ["email", "slack"] },
      duration: 670,
    },
  },
  pause: {
    text: `⏸️ **DocProcessor paused.**

**Details:**
- **Agent:** DocProcessor
- **Previous status:** Active
- **New status:** Paused
- **Queued items:** 12 documents (will be processed when resumed)
- **Reason:** Manual pause via Copilot

To resume, just say "Resume DocProcessor" or use the Agents dashboard.`,
    action: {
      type: "configure",
      label: "DocProcessor Paused",
      icon: "⏸️",
      status: "success",
      details: { agent: "DocProcessor", previousStatus: "ACTIVE", newStatus: "PAUSED", queuedItems: 12 },
      duration: 340,
    },
  },
};

function classifyIntent(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("deploy") || lower.includes("create") || lower.includes("launch")) return "deploy";
  if (lower.includes("status") || lower.includes("show") || lower.includes("list")) return "status";
  if (lower.includes("analyze") || lower.includes("alert") || lower.includes("pattern")) return "analyze";
  if (lower.includes("scale") || lower.includes("throughput") || lower.includes("capacity")) return "scale";
  if (lower.includes("schedule") || lower.includes("daily") || lower.includes("cron")) return "schedule";
  if (lower.includes("pause") || lower.includes("stop") || lower.includes("disable")) return "pause";
  return "status";
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 **Welcome to AI Ops Copilot.**

I'm your natural language control plane for the AI Platform Platform. You can tell me what to do in plain English:

- **"Deploy a fraud agent monitoring $5K+ transactions"**
- **"Show me agent status"**
- **"Analyze today's alerts"**
- **"Scale ComplianceBot to 3x throughput"**

What would you like to do?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isProcessing) return;

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: msg.trim(),
      timestamp: new Date(),
    };

    // Build conversation history for the API
    const history = [
      ...messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: msg.trim() },
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    // Placeholder streaming message
    const streamId = `assistant_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: streamId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    streamCopilot(
      history,
      (delta) => {
        setMessages((prev) =>
          prev.map(m => m.id === streamId ? { ...m, content: m.content + delta } : m)
        );
      },
      () => {
        setIsProcessing(false);
        inputRef.current?.focus();
      },
      (err) => {
        console.error("[Copilot]", err);
        setMessages((prev) =>
          prev.map(m => m.id === streamId
            ? { ...m, content: "Sorry, I encountered an error. Please try again." }
            : m
          )
        );
        setIsProcessing(false);
      }
    );
  }, [input, isProcessing, messages]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-navy-900/50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AI Ops Copilot</h1>
            <p className="text-[11px] text-text-secondary">Natural language control plane — manage your agents with words</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-electric-500/20 border border-electric-500/30 text-text-primary"
                  : msg.role === "system"
                    ? "bg-navy-800/50 border border-border text-text-muted text-sm italic"
                    : "bg-navy-800 border border-border text-text-primary"
              }`}
            >
              {/* Action Badge */}
              {msg.action && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                  <span className="text-base">{msg.action.icon}</span>
                  <span className="text-xs font-bold text-text-primary">{msg.action.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    msg.action.status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  }`}>
                    {msg.action.status === "success" ? "✓ Done" : "⏳ Pending"}
                  </span>
                  {msg.action.duration && (
                    <span className="text-[10px] text-text-muted ml-auto font-mono">{msg.action.duration}ms</span>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap copilot-markdown">
                {renderMarkdown(msg.content)}
              </div>

              {/* Timestamp */}
              <div className={`text-[10px] mt-2 ${msg.role === "user" ? "text-electric-400/50 text-right" : "text-text-muted"}`}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-navy-800 border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-xs text-text-muted">Copilot is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Commands */}
      <div className="px-6 py-2 border-t border-border bg-navy-950/50">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => handleSend(cmd.cmd)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-navy-800/50 text-[11px] text-text-secondary hover:text-text-primary hover:border-electric-500/30 transition-all whitespace-nowrap shrink-0 disabled:opacity-40"
            >
              <span>{cmd.icon}</span>
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="px-6 py-3 border-t border-border bg-navy-900/50">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tell me what to do... (e.g. 'Deploy a fraud agent')"
            className="flex-1 input-field !rounded-xl"
            disabled={isProcessing}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="btn-primary !px-6 !rounded-xl disabled:opacity-40"
          >
            {isProcessing ? "..." : "Send →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Simple Markdown Renderer
// ═══════════════════════════════════════════════

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows
      if (line.includes("---")) continue;
      const cells = line.split("|").filter((c) => c.trim()).map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      inTable = false;
      elements.push(
        <div key={`table_${i}`} className="overflow-x-auto my-2">
          <table className="text-[11px] w-full">
            <thead>
              <tr className="border-b border-border">
                {tableRows[0]?.map((cell, ci) => (
                  <th key={ci} className="text-left px-2 py-1 text-text-muted font-bold">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 text-text-secondary">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Bold
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<b class="text-text-primary font-semibold">$1</b>');

    if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
      );
      if (i < lines.length - 1) elements.push(<br key={`br_${i}`} />);
    }
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="table_end" className="overflow-x-auto my-2">
        <table className="text-[11px] w-full">
          <thead>
            <tr className="border-b border-border">
              {tableRows[0]?.map((cell, ci) => (
                <th key={ci} className="text-left px-2 py-1 text-text-muted font-bold">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri} className="border-b border-border/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1 text-text-secondary">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <>{elements}</>;
}
