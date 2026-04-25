"use client";

/**
 * AgenticVoiceCoPilot — AI Voice Co-Pilot for the Swifter AI Platform
 *
 * WebRTC speech-to-speech with function calling for live platform data.
 * Pure CSS animations (no framer-motion dependency).
 */
import { useState, useRef, useCallback, useEffect } from "react";

/* ── Live Platform Data (simulated) ── */
function getPlatformData() {
  const totalAgents = 13;
  const activeAgents = 12;
  const totalExecs = 42580 + Math.floor(Math.random() * 500);
  const successRate = 97.5 + Math.random() * 2;
  const avgLatency = 4 + Math.random() * 3;
  const uptime = 99.95 + Math.random() * 0.04;

  return {
    overview: {
      totalAgents,
      activeAgents,
      pausedAgents: totalAgents - activeAgents,
      totalExecutions: totalExecs,
      successRate: `${successRate.toFixed(1)}%`,
      avgLatency: `${avgLatency.toFixed(1)}s`,
      uptime: `${uptime.toFixed(2)}%`,
      health: successRate > 98 ? "HEALTHY" : "DEGRADED",
    },
    agents: [
      { name: "Fraud Monitoring", executions: 4823, successRate: 99.7, avgLatency: "4.2s", status: "active", trend: "improving" },
      { name: "Compliance", executions: 2156, successRate: 99.9, avgLatency: "12.8s", status: "active", trend: "stable" },
      { name: "Customer Support", executions: 7234, successRate: 96.8, avgLatency: "2.1s", status: "paused", trend: "declining" },
      { name: "Workflow Automation", executions: 5678, successRate: 99.1, avgLatency: "6.7s", status: "active", trend: "improving" },
      { name: "Finance", executions: 1543, successRate: 99.2, avgLatency: "3.4s", status: "active", trend: "stable" },
      { name: "Document Processing", executions: 1876, successRate: 98.3, avgLatency: "15.3s", status: "active", trend: "improving" },
      { name: "Data Analyst", executions: 3421, successRate: 97.9, avgLatency: "8.1s", status: "active", trend: "stable" },
      { name: "Operations", executions: 4102, successRate: 99.5, avgLatency: "1.8s", status: "active", trend: "stable" },
      { name: "Reporting", executions: 892, successRate: 98.5, avgLatency: "22.4s", status: "active", trend: "stable" },
      { name: "IT Helpdesk", executions: 3890, successRate: 98.1, avgLatency: "5.6s", status: "active", trend: "improving" },
      { name: "App Store Review", executions: 1245, successRate: 97.6, avgLatency: "3.2s", status: "active", trend: "stable" },
      { name: "Competitive Intel", executions: 987, successRate: 98.9, avgLatency: "18.5s", status: "active", trend: "stable" },
      { name: "Email/Communication", executions: 2345, successRate: 97.4, avgLatency: "2.8s", status: "active", trend: "improving" },
    ],
    anomalies: [
      { time: "19:48", severity: "critical", title: "Transaction volume spike 340%", agent: "Fraud Monitoring", action: "Auto-blocked 3 transactions" },
      { time: "19:35", severity: "warning", title: "API latency increased to 890ms", agent: "Operations", action: "Monitoring" },
      { time: "19:22", severity: "info", title: "Customer segment B ticket volume +28%", agent: "Data Analyst", action: "Report generated" },
      { time: "18:55", severity: "warning", title: "AML screening quota at 92%", agent: "Compliance", action: "Alert sent to admin" },
    ],
    costs: {
      totalSaved: "$847K",
      laborSavings: "$420K",
      errorReduction: "$180K",
      speedGains: "$147K",
      complianceAutomation: "$100K",
      llmTokensUsed: "18.4M tokens",
      estimatedLlmCost: "$2,847",
      roi: "297x return on LLM spend",
      revenueImpact: "$2.4M",
    },
    workflows: [
      { name: "Fraud Alert Pipeline", status: "active", executions: 12847, lastRun: "1 min ago", trigger: "Real-time" },
      { name: "KYC Onboarding", status: "active", executions: 3421, lastRun: "4 min ago", trigger: "On-demand" },
      { name: "Daily Reconciliation", status: "active", executions: 892, lastRun: "6 hours ago", trigger: "Scheduled 06:00" },
      { name: "Customer Ticket Triage", status: "active", executions: 8934, lastRun: "12 sec ago", trigger: "Real-time" },
      { name: "Weekly Executive Report", status: "active", executions: 156, lastRun: "2 days ago", trigger: "Mon 08:00" },
      { name: "Invoice Processing", status: "paused", executions: 2134, lastRun: "1 hour ago", trigger: "Webhook" },
    ],
    security: {
      threatLevel: Math.random() > 0.7 ? "ELEVATED" : "NORMAL",
      activeApiKeys: 3,
      revokedApiKeys: 1,
      lastKeyRotation: "5 days ago",
      failedLoginAttempts: Math.floor(Math.random() * 5),
      complianceScore: "98.2%",
      dataResidency: "South Africa (POPIA compliant)",
      encryptionStatus: "AES-256-GCM — all secrets encrypted at rest",
      recentSecurityEvents: [
        { time: "19:50", event: "API key rotation reminder sent", severity: "warning" },
        { time: "18:30", event: "New login from unrecognized device (James)", severity: "info" },
        { time: "16:15", event: "Fraud agent blocked $45,200 suspicious transfer", severity: "critical" },
      ],
    },
  };
}

async function resolveToolCall(fnName: string, args?: string): Promise<string> {
  const d = getPlatformData();
  switch (fnName) {
    case "get_platform_overview":
      return JSON.stringify(d.overview);
    case "get_agent_performance":
      return JSON.stringify(d.agents);
    case "get_anomalies":
      return JSON.stringify(d.anomalies);
    case "get_cost_analysis":
      return JSON.stringify(d.costs);
    case "get_active_workflows":
      return JSON.stringify(d.workflows);
    case "get_security_posture":
      return JSON.stringify(d.security);

    case "get_feature_details": {
      const parsed = args ? JSON.parse(args) : {};
      const name = (parsed.feature_name || "").toLowerCase();
      const features: Record<string, object> = {
        "agent studio": { route: "/dashboard/studio", status: "active", nodeTypes: 6, templates: 3, description: "Drag-and-drop visual agent builder with canvas, node palette, and config panel. Templates: Fraud Detection, Customer Onboarding, Daily Report." },
        "glass box": { route: "/dashboard/glass-box", status: "active", phases: 6, description: "Full reasoning replay — 6-phase timeline (Observe/Retrieve/Reason/Plan/Execute/Evaluate) with LLM prompts, confidence scores, and compliance PDF export." },
        "copilot": { route: "/dashboard/copilot", status: "active", commands: 6, description: "Natural language control plane — type commands like 'Deploy a fraud agent' and it executes. 6 quick commands available." },
        "multi-agent": { route: "/dashboard/collaboration", status: "active", sessions: 2, messageTypes: 5, description: "Autonomous agent coordination — agents delegate, share findings, and solve problems together. 5 message types: REQUEST, RESPONSE, DELEGATE, BROADCAST, RESULT." },
        "marketplace": { route: "/dashboard/marketplace", status: "active", agents: 12, categories: 6, revenueShare: "70/30", description: "Shopify-style app store for AI agents. 12 listings, 6 categories, one-click install, ratings and reviews." },
        "crystal ball": { route: "/dashboard/crystal-ball", status: "active", predictions: 6, criticalAlerts: 1, description: "AI-powered predictions. 6 active predictions including fraud ring activation (87% confidence) and transaction volume surge (91% confidence)." },
        "voice": { route: "/dashboard/voice", status: "active", intents: 6, description: "Voice interface for hands-free agent management with mic, audio visualizer, and quick voice commands." },
        "approvals": { route: "/dashboard/approvals", status: "active", pending: 5, description: "Human-in-the-loop approval gates. 5 pending high-impact actions requiring human review before execution." },
        "ab testing": { route: "/dashboard/experiments", status: "active", experiments: 3, description: "Agent A/B testing with statistical significance analysis. Currently comparing GPT-4o vs Claude 3.5 for FraudGuard." },
        "scaling": { route: "/dashboard/scaling", status: "active", workers: 7, queues: 5, description: "BullMQ infrastructure dashboard with 7 workers, 5 queues, CPU/memory monitoring, and auto-scale controls." },
        "sso": { route: "/dashboard/settings/sso", status: "active", providers: 4, connectedProvider: "Okta (247 users)", description: "SSO/SAML enterprise authentication with Okta, Azure AD, Google Workspace, OneLogin support." },
        "billing": { route: "/dashboard/settings/billing", status: "active", currentPlan: "Enterprise $499/mo", description: "Stripe billing dashboard with 3-tier plans, 6 usage metrics, and invoice history." },
        "integrations": { route: "/dashboard/settings/integrations", status: "active", total: 10, connected: 3, description: "Integrations hub — 10 services across 5 categories. Connected: Slack, Datadog, AWS S3." },
      };
      const key = Object.keys(features).find(k => name.includes(k)) || "";
      return JSON.stringify(features[key] || { error: "Feature not found. Available: agent studio, glass box, copilot, multi-agent, marketplace, crystal ball, voice, approvals, ab testing, scaling, sso, billing, integrations" });
    }

    case "get_predictions":
      return JSON.stringify([
        { title: "Fraud Ring Activation", severity: "critical", confidence: "87%", timeframe: "Next 24 hours", impact: "CRITICAL", accounts: 42, recommendation: "Preemptively freeze 42 linked accounts" },
        { title: "Transaction Volume Surge", severity: "warning", confidence: "91%", timeframe: "Next 48 hours", impact: "HIGH", predictedSpike: "340% above baseline", recommendation: "Scale workers to 5x before Thursday" },
        { title: "API Rate Limit Breach", severity: "warning", confidence: "84%", timeframe: "Next 12 hours", topConsumer: "FinanceApp (67% of quota)", recommendation: "Contact FinanceApp about usage optimization" },
        { title: "Compliance Deadline Risk", severity: "warning", confidence: "78%", pendingKYC: 47, willMissDeadline: 11, recommendation: "Increase ComplianceBot batch size to 25/day" },
        { title: "Customer Churn Signal", severity: "opportunity", confidence: "82%", atRiskCustomers: 3, recommendation: "Trigger proactive outreach via SupportBot" },
        { title: "Cost Optimization", severity: "opportunity", confidence: "94%", monthlySaving: "$1,240", recommendation: "Enable automatic model routing to gpt-4o-mini for simple tasks" },
      ]);

    case "get_pending_approvals":
      return JSON.stringify([
        { agent: "FraudGuard", action: "Freeze 14 linked accounts", risk: "critical", totalBalance: "$847,200", evidence: "89% mule ring match", timestamp: "2 min ago" },
        { agent: "ComplianceBot", action: "Submit SAR filing to FinCEN", risk: "high", subject: "ACC-4821", amount: "$127,450", timestamp: "15 min ago" },
        { agent: "ReportGen", action: "Send executive report to board", risk: "medium", recipients: 8, timestamp: "1 hour ago" },
        { agent: "DataMiner", action: "Delete 2,340 stale customer records", risk: "high", policy: "GDPR Art. 5(1)(e)", timestamp: "3 hours ago" },
        { agent: "FraudGuard", action: "Block IP range 196.21.0.0/16", risk: "high", fraudAttempts: 47, legitimateUsers: "~12,000", timestamp: "5 hours ago" },
      ]);

    case "get_experiments":
      return JSON.stringify([
        { name: "FraudGuard Model Comparison", status: "running", variantA: "GPT-4o (97.8% success, 1450ms)", variantB: "Claude 3.5 (98.4% success, 1180ms, winning)", totalSamples: 2500 },
        { name: "ComplianceBot Prompt Optimization", status: "complete", winner: "Optimized Prompt (98.1% vs 95.2%)", improvement: "+2.9% success rate" },
        { name: "SupportBot Temperature Tuning", status: "draft", variants: "Temperature 0.3 vs 0.7" },
      ]);

    case "get_infrastructure_status":
      return JSON.stringify({
        workers: 7, queues: 5, totalProcessed: "41.3K", totalFailed: 108, successRate: "99.74%", autoScaleEnabled: true,
        queues_detail: [
          { name: "fraud-detection", waiting: 12, active: 4, throughput: "142/h", workers: 2 },
          { name: "compliance", waiting: 47, active: 1, throughput: "12/h", workers: 1 },
          { name: "default", waiting: 5, active: 8, throughput: "234/h", workers: 2 },
          { name: "reports", waiting: 0, active: 0, throughput: "3/h", workers: 1 },
          { name: "email", waiting: 156, active: 0, throughput: "45/h", workers: 1, alert: "High queue depth — consider adding worker" },
        ],
      });

    case "get_marketplace_catalog":
      return JSON.stringify({
        totalAgents: 12, categories: 6,
        featured: [
          { name: "FraudShield Pro", price: "$299/mo", rating: 4.9, installs: "12.4K", author: "Acme Security" },
          { name: "KYC AutoVerify", price: "$199/mo", rating: 4.8, installs: "8.9K", author: "CompliTech" },
          { name: "DocAnalyzer", price: "$179/mo", rating: 4.8, installs: "9.1K", author: "PaperAI" },
        ],
        free: ["EmailCraft Pro", "SlackOps Bot", "ScheduleOptimizer"],
        categories_list: ["Fraud & Risk", "Compliance", "Customer Support", "Data Analysis", "Automation", "Reporting"],
      });

    case "get_integration_status":
      return JSON.stringify({
        connected: [
          { name: "Slack", workspace: "acme-corp.slack.com", channel: "#agent-ops", features: ["Alert notifications", "Agent commands", "Approval workflows"] },
          { name: "Datadog", region: "US1", environment: "production", features: ["APM integration", "Custom metrics", "Log forwarding"] },
          { name: "AWS S3", bucket: "acme-agentic-prod", region: "us-east-1", features: ["Report storage", "Log archival", "Data export"] },
        ],
        available: ["Microsoft Teams", "Salesforce", "HubSpot", "PagerDuty", "GitHub", "Jira", "Twilio"],
      });

    case "get_billing_info":
      return JSON.stringify({
        currentPlan: "Enterprise", price: "$499/month", status: "Active", nextBilling: "April 1, 2026",
        usage: { agents: 12, executions: "47.8K", llmTokens: "2.8M", storage: "12.4 GB", apiCalls: "156K", teamMembers: 24 },
        recentInvoices: [
          { id: "INV-2026-003", period: "Mar 2026", amount: "$499", status: "paid" },
          { id: "INV-2026-002", period: "Feb 2026", amount: "$499", status: "paid" },
        ],
        plans: ["Starter (Free)", "Pro ($99/mo)", "Enterprise ($499/mo)"],
      });

    default:
      return JSON.stringify({ error: `Unknown function: ${fnName}` });
  }
}

type ConnState = "disconnected" | "connecting" | "connected" | "error";
interface TranscriptEntry { id: string; role: "user" | "assistant"; text: string; ts: number; }

export default function AgenticVoiceCoPilot() {
  const [conn, setConn] = useState<ConnState>("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingRef = useRef<Map<string, { name: string; args: string }>>(new Map());
  const greetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { disconnect(); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [transcript]);

  const addMsg = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript(p => [...p.slice(-14), { id: `${role}-${Date.now()}-${Math.random()}`, role, text, ts: Date.now() }]);
  }, []);

  const connect = useCallback(async () => {
    setConn("connecting");
    setErrorMsg("");
    try {
      let tokenRes: Response;
      try { tokenRes = await fetch("/api/openai-session", { method: "POST" }); }
      catch { throw new Error("Cannot reach voice server"); }
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({ error: "Failed to get session token" }));
        throw new Error(err.error || `Token failed: ${tokenRes.status}`);
      }
      const session = await tokenRes.json();
      const ek = session.client_secret?.value;
      if (!ek) throw new Error("No ephemeral key — check your OPENAI_API_KEY");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audio.volume = 1.0;
      document.body.appendChild(audio);
      audioRef.current = audio;
      audio.play().catch(() => {});
      pc.ontrack = e => {
        audio.srcObject = e.streams[0];
        audio.play().catch(err => {
          const retry = () => { audio.play().catch(() => {}); document.removeEventListener("click", retry); };
          document.addEventListener("click", retry);
        });
      };
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") setErrorMsg("Audio connection failed");
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setConn("connected");
        if (dc.readyState === "open") {
          dc.send(JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["audio", "text"],
              voice: "sage",
              input_audio_transcription: { model: "whisper-1" },
              turn_detection: { type: "server_vad", threshold: 0.85, prefix_padding_ms: 400, silence_duration_ms: 1000 },
            },
          }));
        }
        setTimeout(() => {
          if (dc.readyState === "open") {
            dc.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio", "text"],
                instructions: 'Greet the user. Say "Hi, I\'m your Swifter AI co-pilot. I can brief you on agent performance, anomalies, costs, workflows, and security posture. What would you like to know?" Keep it brief and professional.',
              },
            }));
          }
        }, 800);
        greetRef.current = setTimeout(() => {
          setTranscript(p => p.length === 0
            ? [{ id: `g-${Date.now()}`, role: "assistant", text: "Hi, I'm your Swifter AI co-pilot. What would you like to know?", ts: Date.now() }]
            : p);
        }, 6000);
      };
      dc.onmessage = (e) => handleEvent(JSON.parse(e.data));
      dc.onerror = () => { setErrorMsg("Data channel error"); setConn("error"); };
      dc.onclose = () => setConn("disconnected");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03", {
        method: "POST",
        headers: { Authorization: `Bearer ${ek}`, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`);
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setErrorMsg(message);
      setConn("error");
      disconnect();
    }
  }, [addMsg]);

  const handleEvent = useCallback((ev: Record<string, unknown>) => {
    const evType = ev.type as string;
    switch (evType) {
      case "output_audio_buffer.speech_started": setIsAiSpeaking(true); break;
      case "output_audio_buffer.speech_stopped": setIsAiSpeaking(false); break;
      case "response.audio_transcript.done": if (ev.transcript) { addMsg("assistant", ev.transcript as string); setIsAiSpeaking(false); } break;
      case "response.text.done": if (ev.text) addMsg("assistant", ev.text as string); break;
      case "response.content_part.done": { const part = ev.part as Record<string, string> | undefined; if (part?.text) addMsg("assistant", part.text); } break;
      case "conversation.item.input_audio_transcription.completed": if (ev.transcript) addMsg("user", ev.transcript as string); break;
      case "response.function_call_arguments.delta":
        if (ev.call_id) { const c = pendingRef.current.get(ev.call_id as string); if (c) c.args += (ev.delta as string) || ""; } break;
      case "response.output_item.added": {
        const item = ev.item as Record<string, string> | undefined;
        if (item?.type === "function_call") pendingRef.current.set(item.call_id, { name: item.name, args: "" });
      } break;
      case "response.function_call_arguments.done":
        if (ev.call_id) {
          const call = pendingRef.current.get(ev.call_id as string);
          if (call) {
            const cid = ev.call_id as string;
            resolveToolCall(call.name, call.args).then(result => {
              if (dcRef.current?.readyState === "open") {
                dcRef.current.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: cid, output: result } }));
                dcRef.current.send(JSON.stringify({ type: "response.create" }));
              }
              pendingRef.current.delete(cid);
            }).catch(err => {
              if (dcRef.current?.readyState === "open") {
                dcRef.current.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: cid, output: JSON.stringify({ error: String(err) }) } }));
                dcRef.current.send(JSON.stringify({ type: "response.create" }));
              }
              pendingRef.current.delete(cid);
            });
          }
        } break;
      case "error": { const errObj = ev.error as Record<string, string> | undefined; setErrorMsg(errObj?.message || "API error"); } break;
      case "response.done": setIsAiSpeaking(false); break;
    }
  }, [addMsg]);

  const disconnect = useCallback(() => {
    if (greetRef.current) { clearTimeout(greetRef.current); greetRef.current = null; }
    if (dcRef.current) { try { dcRef.current.close(); } catch {} dcRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioRef.current) { audioRef.current.srcObject = null; audioRef.current.remove(); audioRef.current = null; }
    pendingRef.current.clear();
    setConn("disconnected");
    setIsAiSpeaking(false);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const t = streamRef.current.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
    }
  }, []);

  const toggleOpen = useCallback(() => {
    if (!isOpen) { setIsOpen(true); } else {
      if (conn === "connected" || conn === "connecting") disconnect();
      setIsOpen(false);
      setTranscript([]);
      setErrorMsg("");
    }
  }, [isOpen, conn, disconnect]);

  /* ── Styles ── */
  const fabStyle: React.CSSProperties = {
    position: "fixed", bottom: 24, right: 24, zIndex: 999,
    display: "flex", alignItems: "center", gap: 10,
    borderRadius: 16, fontWeight: 700, border: "1px solid rgba(255,255,255,0.15)",
    padding: "14px 20px", cursor: "pointer", color: "#fff",
    background: conn === "connected"
      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
      : "linear-gradient(135deg, #3b82f6, #6366f1)",
    boxShadow: "0 0 25px rgba(59,130,246,0.4), 0 8px 32px rgba(0,0,0,0.3)",
    transition: "transform 0.15s, box-shadow 0.15s",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed", bottom: 90, right: 24, zIndex: 999, width: 400, borderRadius: 16,
    background: "#0a0e1a", border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)", overflow: "hidden",
    animation: "voicePanelIn 0.25s ease-out",
  };

  return (
    <>
      {/* Global animation keyframes */}
      <style>{`
        @keyframes voicePanelIn { from { opacity:0; transform:translateY(12px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes voicePulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes voiceOrb { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.3); opacity:1; } }
        .voice-fab:hover { transform:scale(1.05); box-shadow: 0 0 35px rgba(59,130,246,0.5), 0 8px 32px rgba(0,0,0,0.3) !important; }
        .voice-fab:active { transform:scale(0.96); }
      `}</style>

      {/* Floating Action Button */}
      <button onClick={toggleOpen} className="voice-fab" style={fabStyle}>
        {conn === "connected" ? (
          <>
            <span style={{ fontSize: 18 }}>🔊</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, lineHeight: 1.2 }}>Co-Pilot Active</div>
              <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>{isAiSpeaking ? "Speaking..." : "Listening..."}</div>
            </div>
          </>
        ) : (
          <>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, lineHeight: 1.2 }}>Voice Co-Pilot</div>
              <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>Talk to Swifter AI</div>
            </div>
          </>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontSize: 18,
              }}>🤖</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>Swifter AI Co-Pilot</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                  {conn === "connected" ? (isAiSpeaking ? "🔊 Speaking..." : "🎤 Listening...") : conn === "connecting" ? "⏳ Connecting..." : conn === "error" ? "❌ Error" : "Ready"}
                </p>
              </div>
            </div>
            <button onClick={toggleOpen} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1 }}>✕</button>
          </div>

          {/* Transcript Area */}
          <div ref={scrollRef} style={{
            height: 300, overflowY: "auto", padding: "16px 20px",
            background: "linear-gradient(180deg, #080b14 0%, #0d1017 100%)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {transcript.length === 0 && conn !== "connected" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                  border: "1px solid rgba(59,130,246,0.15)", fontSize: 32,
                }}>🤖</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Voice Co-Pilot</p>
                <p style={{ fontSize: 12, color: "#3b82f6", margin: 0, fontWeight: 600 }}>Powered by Swifter AI</p>
                <p style={{ fontSize: 11, color: "#475569", margin: 0, maxWidth: 240, lineHeight: 1.5 }}>Two-way voice with live access to agent performance, costs, anomalies, and security data</p>
              </div>
            )}
            {transcript.length === 0 && conn === "connected" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 24, background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "voiceOrb 2s ease-in-out infinite",
                }}>
                  <span style={{ fontSize: 20 }}>{isAiSpeaking ? "🔊" : "🎤"}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{isAiSpeaking ? "AI is speaking..." : "Listening for your voice..."}</p>
              </div>
            )}
            {transcript.map(t => (
              <div key={t.id} style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                animation: "voicePanelIn 0.2s ease-out",
                ...(t.role === "assistant"
                  ? { background: "rgba(30,41,59,0.7)", color: "#e2e8f0", alignSelf: "flex-start", borderBottomLeftRadius: 4, border: "1px solid rgba(255,255,255,0.04)" }
                  : { background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", alignSelf: "flex-end", borderBottomRightRadius: 4 }),
              }}>{t.text}</div>
            ))}
          </div>

          {/* Error Bar */}
          {errorMsg && (
            <div style={{ padding: "8px 20px", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 600, borderTop: "1px solid rgba(239,68,68,0.15)" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Controls */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {conn === "connected" ? (
              <>
                <button onClick={toggleMute} style={{
                  width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", fontSize: 18,
                  background: isMuted ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                  color: isMuted ? "#ef4444" : "#94a3b8", transition: "all 0.15s",
                }}>{isMuted ? "🔇" : "🎤"}</button>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20,
                  background: isAiSpeaking ? "rgba(139,92,246,0.1)" : "rgba(34,197,94,0.1)",
                  border: `1px solid ${isAiSpeaking ? "rgba(139,92,246,0.2)" : "rgba(34,197,94,0.2)"}`,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isAiSpeaking ? "#8b5cf6" : "#22c55e",
                    animation: "voicePulse 2s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: isAiSpeaking ? "#8b5cf6" : "#22c55e" }}>
                    {isAiSpeaking ? "Speaking" : "Listening"}
                  </span>
                </div>
                <button onClick={disconnect} style={{
                  width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", fontSize: 18,
                  background: "rgba(239,68,68,0.15)", color: "#ef4444", transition: "all 0.15s",
                }}>📴</button>
              </>
            ) : (
              <button onClick={connect} disabled={conn === "connecting"} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 28px", borderRadius: 14, border: "none",
                cursor: conn === "connecting" ? "wait" : "pointer",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff",
                fontWeight: 700, fontSize: 14, boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
                opacity: conn === "connecting" ? 0.7 : 1, transition: "all 0.15s",
              }}>
                {conn === "connecting" ? "⏳ Connecting..." : "📞 Start Conversation"}
              </button>
            )}
          </div>
          <p style={{ textAlign: "center", fontSize: 10, color: "#334155", paddingBottom: 12, margin: 0 }}>
            Swifter AI Platform · Voice-powered operations intelligence
          </p>
        </div>
      )}
    </>
  );
}
