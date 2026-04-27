"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// Voice Copilot — Fintech AI Platform
// Uses: Web Speech API (STT) + API Copilot (OpenAI) + SpeechSynthesis (TTS)
// ═══════════════════════════════════════════════════════════

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isVoice: boolean;
  action?: string;
  aiEnhanced?: boolean;
  intent?: string;
  confidence?: number;
}

// ─── Quick command chips ─────────────────────────────────

const QUICK_COMMANDS = [
  { label: "Agent status",    icon: "📊", query: "What is the current status of all my agents?" },
  { label: "Fraud report",    icon: "🛡️", query: "Show me recent fraud alerts and suspicious transactions" },
  { label: "KYC compliance",  icon: "✅", query: "Summarise my KYC and compliance status" },
  { label: "Performance",     icon: "⚡", query: "How is agent performance looking today?" },
  { label: "Check alerts",    icon: "🔔", query: "Are there any active alerts I should know about?" },
  { label: "Deploy agent",    icon: "🚀", query: "Help me deploy a new monitoring agent" },
];

// ─── Component ───────────────────────────────────────────

export default function VoiceCopilotPage() {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I'm your Voice Copilot. Ask me about your agents, alerts, compliance status, or transactions. You can speak or type.",
      timestamp: new Date(),
      isVoice: false,
    },
  ]);
  const [input, setInput]                   = useState("");
  const [isListening, setIsListening]       = useState(false);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [transcript, setTranscript]         = useState("");
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(32).fill(0));

  const scrollRef     = useRef<HTMLDivElement>(null);
  const animFrameRef  = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ─── Init ───────────────────────────────────────────

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setSpeechAvailable(true);
      const rec = new SR();
      rec.lang = "en-ZA";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text   = result[0].transcript;
        setTranscript(text);
        if (result.isFinal) {
          setTranscript("");
          setIsListening(false);
          processInput(text, true);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error("[Speech] Error:", e.error);
        setIsListening(false);
        setTranscript("");
      };

      recognitionRef.current = rec;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-scroll ────────────────────────────────────

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ─── Visualizer ─────────────────────────────────────

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      setVisualizerBars(Array(32).fill(0));
      cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const animate = () => {
      setVisualizerBars(Array(32).fill(0).map(() =>
        isListening
          ? Math.random() * 70 + 10
          : Math.random() * 35 + 5
      ));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isListening, isSpeaking]);

  // ─── TTS ────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-ZA";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    // Prefer a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
      || voices.find(v => v.lang.startsWith("en-ZA"))
      || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart  = () => setIsSpeaking(true);
    utterance.onend    = () => setIsSpeaking(false);
    utterance.onerror  = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // ─── Core Processing ─────────────────────────────────

  const processInput = useCallback(async (text: string, isVoice: boolean) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    // Add user message
    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
      isVoice,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    try {
      // Call the voice commands API
      const res = await fetch("/api/voice/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const { data } = await res.json();
      const command = data?.command;

      const responseText = command?.response ?? "I'm sorry, I couldn't process that request.";

      const assistantMsg: VoiceMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        text: responseText,
        timestamp: new Date(),
        isVoice: true,
        action: command?.intent ? intentLabel(command.intent) : undefined,
        aiEnhanced: command?.aiEnhanced,
        intent: command?.intent,
        confidence: command?.confidence,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Speak the response
      if (isVoice) speak(responseText);

    } catch (err) {
      console.error("[Voice] API error:", err);
      const errMsg: VoiceMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        text: "Sorry, I had trouble connecting. Please check your network and try again.",
        timestamp: new Date(),
        isVoice: false,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, speak]);

  // ─── Mic Toggle ──────────────────────────────────────

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-navy-950">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-navy-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-electric-500 flex items-center justify-center text-lg shadow-lg shadow-violet-500/30">
            🎤
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">Voice Copilot</h1>
            <p className="text-[11px] text-text-secondary">Natural language control for your AI agents</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-border">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              isListening  ? "bg-rose-500 animate-pulse" :
              isSpeaking   ? "bg-emerald-500 animate-pulse" :
              isProcessing ? "bg-amber-500 animate-pulse" :
              "bg-emerald-500"
            }`} />
            <span className="text-xs text-text-muted">
              {isListening ? "Listening…" : isSpeaking ? "Speaking…" : isProcessing ? "Processing…" : "Ready"}
            </span>
          </div>

          {!speechAvailable && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
              Voice unavailable — use Chrome/Edge
            </span>
          )}
        </div>
      </div>

      {/* ── Message Thread ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-electric-500 flex items-center justify-center text-sm mr-2 mt-1 shrink-0">
                🤖
              </div>
            )}

            <div className={`max-w-[72%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-electric-500/15 border border-electric-500/25 rounded-tr-sm"
                : "bg-navy-800 border border-border rounded-tl-sm"
            }`}>

              {/* Action badge */}
              {msg.action && (
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/60">
                  <span className="text-[9px]">⚡</span>
                  <span className="text-[10px] text-electric-400 font-medium tracking-wide uppercase">{msg.action}</span>
                  {msg.aiEnhanced && (
                    <span className="ml-auto text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">
                      AI
                    </span>
                  )}
                </div>
              )}

              {/* Voice badge */}
              {msg.isVoice && (
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[10px]">{msg.role === "user" ? "🎤" : "🔊"}</span>
                  <span className="text-[10px] text-text-muted">Voice {msg.role === "user" ? "input" : "response"}</span>
                </div>
              )}

              <p className="text-sm text-text-primary leading-relaxed">{msg.text}</p>

              <div className={`flex items-center gap-2 mt-1.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                <span className={`text-[10px] ${msg.role === "user" ? "text-electric-400/50" : "text-text-muted"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.confidence !== undefined && msg.confidence > 0 && (
                  <span className="text-[10px] text-text-muted">
                    {Math.round(msg.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-sm ml-2 mt-1 shrink-0">
                👤
              </div>
            )}
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-electric-500 flex items-center justify-center text-sm mr-2 mt-1 shrink-0">
              🤖
            </div>
            <div className="bg-navy-800 border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }} />
                ))}
              </span>
              <span className="text-xs text-text-muted">Processing…</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Visualizer + Quick Commands ── */}
      <div className="px-6 pt-3 pb-2 border-t border-border bg-navy-900/40">

        {/* Interim transcript display */}
        {transcript && (
          <div className="text-center text-xs text-violet-400 italic mb-2 animate-pulse">
            "{transcript}"
          </div>
        )}

        {/* Waveform */}
        <div className="flex items-end justify-center gap-0.5 h-10 mb-3">
          {visualizerBars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isListening ? "bg-rose-500/80" :
                isSpeaking  ? "bg-emerald-500/80" :
                "bg-navy-700"
              }`}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
          ))}
        </div>

        {/* Quick command chips */}
        <div className="flex gap-1.5 flex-wrap justify-center mb-3">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => processInput(cmd.query, false)}
              disabled={isProcessing || isListening}
              className="px-2.5 py-1 rounded-lg border border-border text-[11px] text-text-muted hover:text-text-primary hover:border-electric-500/40 hover:bg-electric-500/5 transition-all disabled:opacity-40"
            >
              {cmd.icon} {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className="px-6 py-3 border-t border-border bg-navy-900/60 backdrop-blur-sm">
        <div className="flex gap-3 items-center">

          {/* Mic button */}
          <button
            onClick={toggleListening}
            disabled={isProcessing || isSpeaking || !speechAvailable}
            title={!speechAvailable ? "Speech recognition unavailable in this browser" : ""}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all shrink-0 ${
              isListening
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-110"
                : "bg-navy-800 border border-border text-text-muted hover:text-text-primary hover:border-electric-500/40 disabled:opacity-40"
            }`}
          >
            {isListening ? "⏹" : "🎤"}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && processInput(input, false)}
            placeholder={isListening ? "Listening…" : "Type a command or click the mic to speak…"}
            className="flex-1 input-field !rounded-xl"
            disabled={isProcessing || isListening}
          />

          <button
            onClick={() => processInput(input, false)}
            disabled={!input.trim() || isProcessing || isListening}
            className="btn-primary !px-5 !rounded-xl disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function intentLabel(intent: string): string {
  const map: Record<string, string> = {
    create_agent:  "Creating agent",
    check_status:  "Checking status",
    run_agent:     "Running agent",
    get_report:    "Generating report",
    list_agents:   "Listing agents",
    show_alerts:   "Retrieving alerts",
    modify_config: "Updating configuration",
    ask_question:  "Answering query",
    unknown:       "Processing command",
  };
  return map[intent] ?? "Processing command";
}
