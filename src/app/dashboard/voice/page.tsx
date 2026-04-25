"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════
// Voice Interface — Talk to Your Agents
// ═══════════════════════════════════════════════

interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isVoice: boolean;
  action?: string;
}

const VOICE_RESPONSES: Record<string, { text: string; action: string }> = {
  status: {
    text: "All systems are running smoothly. You have 12 active agents with a 98.9% success rate in the last 24 hours. FraudGuard processed 847 transactions, and ComplianceBot completed 312 KYC reviews. No critical alerts at this time.",
    action: "Retrieved agent status report",
  },
  fraud: {
    text: "FraudGuard detected 4 suspicious transactions in the last hour, blocking 2 of them automatically. Total value blocked: $23,400. The latest block was a $8,750 wire transfer from Nigeria flagged for multiple risk factors. Would you like me to pull up the Glass Box replay?",
    action: "Queried FraudGuard activity log",
  },
  deploy: {
    text: "I've deployed a new monitoring agent called SentinelBot configured for real-time API abuse detection. It's watching for rate limit violations, credential stuffing patterns, and geographic anomalies. The agent is now active on all production endpoints.",
    action: "Deployed SentinelBot agent",
  },
  performance: {
    text: "Performance summary: Average response time is 1.4 seconds across all agents, down from 2.1 seconds last week — a 33% improvement. Token usage is up 12% but cost per execution dropped 8% thanks to the gpt-4o-mini routing optimization. Crystal Ball estimates you'll save $1,240 this month.",
    action: "Generated performance summary",
  },
  alert: {
    text: "You have 3 unread alerts. One critical: a possible fraud ring activation detected by FraudGuard with 87% confidence. Two warnings: API rate limit approaching 87% and a compliance deadline for 47 KYC renewals in 5 days. Shall I take you to Crystal Ball for details?",
    action: "Retrieved alert summary",
  },
  help: {
    text: "Here's what I can do: Check agent status, deploy new agents, review alerts, analyze performance, run predictions, manage schedules, and scale infrastructure. You can speak naturally or type — just tell me what you need and I'll handle it.",
    action: "Displayed capabilities",
  },
};

function classifyVoice(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("status") || lower.includes("how are") || lower.includes("running")) return "status";
  if (lower.includes("fraud") || lower.includes("suspicious") || lower.includes("blocked")) return "fraud";
  if (lower.includes("deploy") || lower.includes("create") || lower.includes("launch")) return "deploy";
  if (lower.includes("performance") || lower.includes("speed") || lower.includes("cost")) return "performance";
  if (lower.includes("alert") || lower.includes("notification") || lower.includes("warning")) return "alert";
  return "help";
}

export default function VoiceInterfacePage() {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey! I'm your voice assistant for the Swifter AI Platform. You can ask me anything about your agents, alerts, or operations. Try saying \"Hey Agent, what's the status?\" or just type your question below.",
      timestamp: new Date(),
      isVoice: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(24).fill(0));
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Visualizer animation
  useEffect(() => {
    if (!isListening && !isSpeaking) {
      setVisualizerBars(Array(24).fill(0));
      return;
    }

    const animate = () => {
      setVisualizerBars((prev) =>
        prev.map(() => {
          if (isListening) return Math.random() * 60 + 10;
          if (isSpeaking) return Math.random() * 40 + 5;
          return 0;
        })
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isListening, isSpeaking]);

  const processInput = useCallback(async (text: string, isVoice: boolean) => {
    if (!text.trim() || isProcessing) return;

    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
      isVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    // Simulate processing
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    const intent = classifyVoice(text);
    const response = VOICE_RESPONSES[intent];

    // Simulate speaking
    setIsSpeaking(true);
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    setIsSpeaking(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        text: response.text,
        timestamp: new Date(),
        isVoice: true,
        action: response.action,
      },
    ]);

    setIsProcessing(false);
  }, [isProcessing]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      // Simulate voice recognition result
      const phrases = [
        "What's the current agent status?",
        "Show me fraud alerts",
        "How's performance looking?",
        "Any new alerts?",
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      processInput(randomPhrase, true);
    } else {
      setIsListening(true);
      // Auto-stop after 4 seconds
      setTimeout(() => {
        setIsListening(false);
        const phrases = [
          "What's the current agent status?",
          "Show me fraud alerts",
          "How's performance looking?",
          "Any new alerts?",
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        processInput(randomPhrase, true);
      }, 3000);
    }
  }, [isListening, processInput]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-navy-900/50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎤</span>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Voice Interface</h1>
            <p className="text-[11px] text-text-secondary">Talk to your agents — ask questions, get verbal status updates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? "bg-rose-500 animate-pulse" : isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-text-muted"}`} />
          <span className="text-xs text-text-muted">
            {isListening ? "Listening..." : isSpeaking ? "Speaking..." : isProcessing ? "Processing..." : "Ready"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-electric-500/20 border border-electric-500/30"
                : "bg-navy-800 border border-border"
            }`}>
              {msg.isVoice && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px]">{msg.role === "user" ? "🎤" : "🔊"}</span>
                  <span className="text-[10px] text-text-muted">Voice {msg.role === "user" ? "input" : "response"}</span>
                </div>
              )}
              {msg.action && (
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border">
                  <span className="text-[10px]">⚡</span>
                  <span className="text-[10px] text-electric-400 font-medium">{msg.action}</span>
                </div>
              )}
              <p className="text-sm text-text-primary leading-relaxed">{msg.text}</p>
              <div className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-electric-400/50 text-right" : "text-text-muted"}`}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-navy-800 border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-xs text-text-muted">Processing voice command...</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice Visualizer */}
      <div className="px-6 py-3 border-t border-border bg-navy-950/50">
        <div className="flex items-end justify-center gap-0.5 h-12 mb-3">
          {visualizerBars.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                isListening ? "bg-rose-500" : isSpeaking ? "bg-emerald-500" : "bg-navy-700"
              }`}
              style={{ height: `${Math.max(height, 3)}%` }}
            />
          ))}
        </div>

        {/* Quick Voice Commands */}
        <div className="flex gap-2 justify-center mb-3">
          {[
            { label: "Agent status", icon: "📊" },
            { label: "Fraud report", icon: "🛡️" },
            { label: "Deploy agent", icon: "🚀" },
            { label: "Check alerts", icon: "🔔" },
          ].map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => processInput(cmd.label, false)}
              disabled={isProcessing || isListening}
              className="px-3 py-1.5 rounded-lg border border-border text-[11px] text-text-muted hover:text-text-primary hover:border-border-active transition-all disabled:opacity-40"
            >
              {cmd.icon} {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="px-6 py-3 border-t border-border bg-navy-900/50">
        <div className="flex gap-3 items-center">
          {/* Mic Button */}
          <button
            onClick={toggleListening}
            disabled={isProcessing || isSpeaking}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all shrink-0 ${
              isListening
                ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30"
                : "bg-navy-800 border border-border text-text-muted hover:text-text-primary hover:border-border-active"
            }`}
          >
            {isListening ? "⏹" : "🎤"}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && processInput(input, false)}
            placeholder={isListening ? "Listening..." : "Type or speak your command..."}
            className="flex-1 input-field !rounded-xl"
            disabled={isProcessing || isListening}
          />

          <button
            onClick={() => processInput(input, false)}
            disabled={!input.trim() || isProcessing}
            className="btn-primary !px-6 !rounded-xl disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
