"use client";

import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════
// Multi-Agent Collaboration — Autonomous Coordination
// ═══════════════════════════════════════════════

interface CollabAgent {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  status: "idle" | "thinking" | "acting" | "delegating" | "complete";
}

interface CollabMessage {
  id: string;
  from: string;
  to: string;
  type: "request" | "response" | "delegate" | "broadcast" | "result";
  content: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

interface CollabSession {
  id: string;
  name: string;
  description: string;
  icon: string;
  agents: CollabAgent[];
  messages: CollabMessage[];
  status: "ready" | "running" | "complete";
  result?: string;
}

const DEMO_SESSIONS: CollabSession[] = [
  {
    id: "collab_fraud",
    name: "Coordinated Fraud Investigation",
    description: "FraudGuard detects a suspicious pattern and delegates to ComplianceBot and DataMiner for deep analysis",
    icon: "🛡️",
    agents: [
      { id: "fg", name: "FraudGuard", type: "Orchestrator", icon: "🛡️", color: "text-rose-400", status: "complete" },
      { id: "cb", name: "ComplianceBot", type: "Specialist", icon: "📋", color: "text-violet-400", status: "complete" },
      { id: "dm", name: "DataMiner", type: "Analyst", icon: "🔬", color: "text-electric-400", status: "complete" },
      { id: "rg", name: "ReportGen", type: "Reporter", icon: "📊", color: "text-emerald-400", status: "complete" },
    ],
    messages: [
      { id: "m1", from: "fg", to: "broadcast", type: "broadcast", content: "🚨 Suspicious pattern detected: 14 transactions from same IP in 3 minutes, total $127,450", timestamp: 0, data: { severity: "CRITICAL", ip: "196.21.45.88", txCount: 14, totalAmount: 127450 } },
      { id: "m2", from: "fg", to: "cb", type: "delegate", content: "Check sanctions lists and AML flags for accounts linked to IP 196.21.45.88", timestamp: 1200 },
      { id: "m3", from: "fg", to: "dm", type: "delegate", content: "Analyze transaction patterns — find clusters, velocity anomalies, and related accounts", timestamp: 1400 },
      { id: "m4", from: "dm", to: "fg", type: "response", content: "Found 3 account clusters sharing device fingerprints. 89% match with known mule-network patterns. Graph analysis shows ring topology.", timestamp: 4200, data: { clusters: 3, confidence: 0.89, pattern: "mule_ring" } },
      { id: "m5", from: "cb", to: "fg", type: "response", content: "2 accounts flagged on OFAC watchlist. 1 account linked to previous SAR filing (SAR-2026-0847). Recommend immediate freeze.", timestamp: 5100, data: { ofacMatches: 2, sarLinked: 1, recommendation: "FREEZE" } },
      { id: "m6", from: "fg", to: "broadcast", type: "broadcast", content: "Decision: FREEZE all 14 accounts. Combined evidence from ComplianceBot (OFAC/SAR) and DataMiner (mule ring pattern) exceeds threshold.", timestamp: 5800 },
      { id: "m7", from: "fg", to: "rg", type: "delegate", content: "Generate regulatory filing report with all evidence from this investigation", timestamp: 6000 },
      { id: "m8", from: "rg", to: "fg", type: "result", content: "📄 Investigation report generated: 14 pages with evidence chain, account network graph, and SAR recommendation. Ready for compliance review.", timestamp: 8500, data: { pages: 14, format: "PDF", includesGraph: true } },
    ],
    status: "complete",
    result: "14 accounts frozen. SAR filing prepared. Mule ring network identified with 89% confidence.",
  },
  {
    id: "collab_onboard",
    name: "Intelligent Customer Onboarding",
    description: "Multi-agent pipeline: KYC verification, risk scoring, welcome flow, and support routing",
    icon: "👋",
    agents: [
      { id: "cb", name: "ComplianceBot", type: "Verifier", icon: "📋", color: "text-violet-400", status: "complete" },
      { id: "fg", name: "FraudGuard", type: "Risk Scorer", icon: "🛡️", color: "text-rose-400", status: "complete" },
      { id: "ea", name: "EmailAgent", type: "Communicator", icon: "✉️", color: "text-amber-400", status: "complete" },
      { id: "sb", name: "SupportBot", type: "Router", icon: "🎧", color: "text-electric-400", status: "complete" },
    ],
    messages: [
      { id: "o1", from: "cb", to: "broadcast", type: "broadcast", content: "New customer onboarding: Acme Payments Ltd (business account, 3 directors)", timestamp: 0 },
      { id: "o2", from: "cb", to: "broadcast", type: "response", content: "KYC verification complete: 3/3 directors verified. Company registration confirmed. PEP check: clear.", timestamp: 3200, data: { verified: 3, pep: "clear", status: "APPROVED" } },
      { id: "o3", from: "cb", to: "fg", type: "delegate", content: "Run risk assessment on Acme Payments Ltd for financial services tier assignment", timestamp: 3400 },
      { id: "o4", from: "fg", to: "cb", type: "response", content: "Risk score: 0.23 (LOW). Industry: fintech, jurisdiction: UK (low risk), no adverse media. Tier: Standard.", timestamp: 5600, data: { riskScore: 0.23, tier: "Standard", riskLevel: "LOW" } },
      { id: "o5", from: "cb", to: "ea", type: "delegate", content: "Send welcome email with account credentials and API documentation to Acme Payments Ltd", timestamp: 5800 },
      { id: "o6", from: "ea", to: "cb", type: "response", content: "Welcome email sent to 3 recipients with personalized onboarding guide and API keys.", timestamp: 6400 },
      { id: "o7", from: "cb", to: "sb", type: "delegate", content: "Create dedicated support channel and assign onboarding specialist for Acme Payments Ltd", timestamp: 6600 },
      { id: "o8", from: "sb", to: "cb", type: "result", content: "Support channel created. Onboarding specialist Sarah Johnson assigned. First check-in scheduled for March 28.", timestamp: 7200, data: { specialist: "Sarah Johnson", checkIn: "2026-03-28" } },
    ],
    status: "complete",
    result: "Customer onboarded successfully. Low risk (0.23). Welcome flow completed. Support specialist assigned.",
  },
];

const MSG_TYPE_STYLES: Record<string, { bg: string; label: string; icon: string }> = {
  request: { bg: "bg-electric-500/10 border-electric-500/20", label: "REQUEST", icon: "→" },
  response: { bg: "bg-emerald-500/10 border-emerald-500/20", label: "RESPONSE", icon: "←" },
  delegate: { bg: "bg-violet-500/10 border-violet-500/20", label: "DELEGATE", icon: "⤴" },
  broadcast: { bg: "bg-amber-500/10 border-amber-500/20", label: "BROADCAST", icon: "📢" },
  result: { bg: "bg-teal-500/10 border-teal-500/20", label: "RESULT", icon: "✓" },
};

export default function CollaborationPage() {
  const [activeSession, setActiveSession] = useState<CollabSession>(DEMO_SESSIONS[0]);
  const [visibleMessages, setVisibleMessages] = useState(DEMO_SESSIONS[0].messages.length);
  const [isReplaying, setIsReplaying] = useState(false);

  const replay = useCallback(async () => {
    setVisibleMessages(0);
    setIsReplaying(true);

    for (let i = 0; i < activeSession.messages.length; i++) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
      setVisibleMessages(i + 1);
    }

    setIsReplaying(false);
  }, [activeSession]);

  const loadSession = useCallback((session: CollabSession) => {
    setActiveSession(session);
    setVisibleMessages(session.messages.length);
  }, []);

  const getAgent = (id: string) => activeSession.agents.find((a) => a.id === id);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🤝</span>
            <h1 className="text-2xl font-bold text-text-primary">Multi-Agent Collaboration</h1>
            <span className="badge badge-info text-[10px]">Autonomous Coordination</span>
          </div>
          <p className="text-sm text-text-secondary">
            Watch agents delegate, coordinate, and solve complex problems together.
          </p>
        </div>
        <button
          onClick={replay}
          disabled={isReplaying}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {isReplaying ? <><span className="animate-spin">⏳</span> Replaying...</> : <>▶ Replay Session</>}
        </button>
      </div>

      {/* Session Selector */}
      <div className="flex gap-3 mb-6">
        {DEMO_SESSIONS.map((session) => (
          <button
            key={session.id}
            onClick={() => loadSession(session)}
            className={`glass-card px-4 py-3 text-left flex-1 cursor-pointer transition-all ${
              activeSession.id === session.id
                ? "!border-electric-500/40 glow-blue"
                : "hover:border-border-active"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{session.icon}</span>
              <span className="text-sm font-bold text-text-primary">{session.name}</span>
            </div>
            <p className="text-[11px] text-text-secondary">{session.description}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Agent Panel */}
        <div className="w-56 shrink-0 space-y-2">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 px-1">
            Participating Agents
          </div>
          {activeSession.agents.map((agent) => (
            <div key={agent.id} className="glass-card px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${agent.color}`}>{agent.name}</div>
                  <div className="text-[10px] text-text-muted">{agent.type}</div>
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  agent.status === "complete" ? "bg-emerald-500" :
                  agent.status === "thinking" ? "bg-violet-500 animate-pulse" :
                  agent.status === "acting" ? "bg-electric-500 animate-pulse" :
                  agent.status === "delegating" ? "bg-amber-500 animate-pulse" :
                  "bg-text-muted"
                }`} />
              </div>
              {/* Message count */}
              <div className="mt-1.5 text-[10px] text-text-muted">
                {activeSession.messages.filter((m) => m.from === agent.id).length} sent ·{" "}
                {activeSession.messages.filter((m) => m.to === agent.id).length} received
              </div>
            </div>
          ))}

          {/* Stats */}
          <div className="!mt-4 glass-card px-3 py-2.5">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Session Stats</div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Messages</span>
                <span className="text-text-primary font-mono">{activeSession.messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Delegations</span>
                <span className="text-text-primary font-mono">{activeSession.messages.filter((m) => m.type === "delegate").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Duration</span>
                <span className="text-text-primary font-mono">
                  {((activeSession.messages[activeSession.messages.length - 1]?.timestamp || 0) / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="text-emerald-400 font-semibold">{activeSession.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Timeline */}
        <div className="flex-1 space-y-3">
          {activeSession.messages.slice(0, visibleMessages).map((msg, idx) => {
            const fromAgent = getAgent(msg.from);
            const toAgent = msg.to === "broadcast" ? null : getAgent(msg.to);
            const style = MSG_TYPE_STYLES[msg.type];

            return (
              <div
                key={msg.id}
                className={`rounded-xl border p-3.5 ${style.bg} animate-fade-in`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{fromAgent?.icon}</span>
                    <span className={`text-xs font-bold ${fromAgent?.color || "text-text-primary"}`}>
                      {fromAgent?.name}
                    </span>
                    <span className="text-text-muted text-[10px]">{style.icon}</span>
                    {toAgent ? (
                      <>
                        <span className="text-base">{toAgent.icon}</span>
                        <span className={`text-xs font-bold ${toAgent.color}`}>{toAgent.name}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold">ALL AGENTS</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      msg.type === "delegate" ? "bg-violet-500/20 text-violet-400" :
                      msg.type === "response" ? "bg-emerald-500/20 text-emerald-400" :
                      msg.type === "broadcast" ? "bg-amber-500/20 text-amber-400" :
                      msg.type === "result" ? "bg-teal-500/20 text-teal-400" :
                      "bg-electric-500/20 text-electric-400"
                    }`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      +{(msg.timestamp / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>

                {/* Data Badge */}
                {msg.data && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(msg.data).map(([key, value]) => (
                      <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-navy-800/80 text-text-muted font-mono">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Result */}
          {activeSession.result && visibleMessages >= activeSession.messages.length && (
            <div className="glass-card p-4 !border-emerald-500/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <span className="text-sm font-bold text-emerald-400">Collaboration Complete</span>
              </div>
              <p className="text-sm text-text-primary">{activeSession.result}</p>
            </div>
          )}

          {/* Replay progress */}
          {isReplaying && (
            <div className="text-center text-sm text-text-muted py-4">
              <span className="animate-pulse">Processing agent collaboration...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
