"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SCENARIOS, EXECUTION_SCRIPTS, type Step } from "./scenarios";

interface ExecutedStep extends Step {
  timestamp: number;
}

// ─── Phase Config ─────────────────────────

const PHASE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  observe:  { label: "Observe",   icon: "👁️",  color: "text-sky-400" },
  retrieve: { label: "Retrieve",  icon: "🧠",  color: "text-violet-400" },
  reason:   { label: "Reason",    icon: "💭",  color: "text-amber-400" },
  plan:     { label: "Plan",      icon: "📋",  color: "text-teal-400" },
  execute:  { label: "Execute",   icon: "⚡",  color: "text-electric-400" },
  evaluate: { label: "Evaluate",  icon: "✅",  color: "text-emerald-400" },
  store:    { label: "Store",     icon: "💾",  color: "text-indigo-400" },
  report:   { label: "Report",    icon: "📊",  color: "text-cyan-400" },
};

// ─── Demo Page ────────────────────────────

export default function DemoPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<ExecutedStep[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  async function runAgent(scenarioId: string) {
    const script = EXECUTION_SCRIPTS[scenarioId];
    if (!script) return;

    setSelectedScenario(scenarioId);
    setIsRunning(true);
    setSteps([]);
    setIsComplete(false);

    for (const step of script) {
      setCurrentPhase(step.phase);

      // Simulate real-time execution delay
      if (step.delay > 0) {
        await new Promise((r) => setTimeout(r, step.delay));
      }

      setSteps((prev) => [...prev, { ...step, timestamp: Date.now() }]);
    }

    setIsRunning(false);
    setCurrentPhase(null);
    setIsComplete(true);
  }

  function resetDemo() {
    setSelectedScenario(null);
    setSteps([]);
    setIsRunning(false);
    setCurrentPhase(null);
    setIsComplete(false);
  }

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary text-lg">Agentic AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">Start Free →</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-500/10 border border-electric-500/20 text-electric-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Agent Demo
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Watch AI Agents Think & Act
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Select a scenario below and watch an autonomous AI agent observe, reason, call tools, and produce real results — all in real-time.
            </p>
          </div>

          {/* Scenario Selector (show when not running) */}
          {!selectedScenario && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => runAgent(s.id)}
                  className="glass-card p-5 text-left group hover:border-electric-500/30 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-text-primary group-hover:text-electric-400 transition-colors">{s.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted font-medium">{s.category}</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed mb-3">{s.description}</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${s.color} text-white text-xs font-semibold`}>
                        Run Agent →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Execution View */}
          {selectedScenario && scenario && (
            <div className="max-w-4xl mx-auto">
              {/* Agent Header */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenario.color} flex items-center justify-center text-2xl`}>
                      {scenario.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">{scenario.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {isRunning ? (
                          <span className="badge badge-info">
                            <span className="w-2 h-2 rounded-full bg-electric-400 animate-pulse" />
                            Running autonomously...
                          </span>
                        ) : isComplete ? (
                          <span className="badge badge-active">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Complete
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetDemo}
                    className="px-4 py-2 text-sm text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-all"
                  >
                    ← Back to Scenarios
                  </button>
                </div>

                {/* Input */}
                <div className="mt-4 p-4 rounded-xl bg-navy-800/50 border border-white/5">
                  <div className="text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">Agent Input</div>
                  <p className="text-sm text-text-secondary">{scenario.input}</p>
                </div>
              </div>

              {/* Phase Progress Bar */}
              <div className="glass-card p-4 mb-6">
                <div className="flex items-center gap-1">
                  {Object.entries(PHASE_CONFIG).map(([phase, config], i) => {
                    const isActive = currentPhase === phase;
                    const isDone = steps.some((s) => s.phase === phase);
                    return (
                      <div key={phase} className="flex items-center flex-1">
                        <div className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                          isActive ? "bg-electric-500/15 text-electric-400 scale-105" :
                          isDone ? "bg-white/5 text-text-secondary" :
                          "text-text-muted"
                        }`}>
                          <span>{config.icon}</span>
                          <span className="hidden lg:inline">{config.label}</span>
                        </div>
                        {i < 7 && <span className="text-text-muted/30 mx-0.5 hidden md:block">›</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Log */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-mono text-text-muted ml-2">agent-execution-log</span>
                  </div>
                  {steps.length > 0 && (
                    <span className="text-xs text-text-muted font-mono">{steps.length} steps</span>
                  )}
                </div>
                <div ref={scrollRef} className="p-4 space-y-3 max-h-[600px] overflow-y-auto bg-navy-950/50">
                  {steps.map((step, i) => {
                    const config = PHASE_CONFIG[step.phase] || { label: step.phase, icon: "•", color: "text-text-secondary" };
                    return (
                      <div
                        key={i}
                        className="flex gap-3 animate-fade-in"
                        style={{ animationDelay: "0ms" }}
                      >
                        {/* Phase indicator */}
                        <div className="flex-shrink-0 pt-0.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                            step.phase === "report" ? "bg-emerald-500/15" :
                            step.phase === "execute" ? "bg-electric-500/15" :
                            "bg-white/5"
                          }`}>
                            {config.icon}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                              {config.label}
                            </span>
                            {step.tool && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-400 font-mono">
                                {step.tool}
                              </span>
                            )}
                          </div>
                          <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            step.phase === "report" ? "text-text-primary font-medium" : "text-text-secondary"
                          }`}>
                            {step.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-sm text-text-muted animate-pulse">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span>Agent is {currentPhase ? `${PHASE_CONFIG[currentPhase]?.label.toLowerCase() || currentPhase}ing` : "thinking"}...</span>
                    </div>
                  )}

                  {/* Empty state */}
                  {steps.length === 0 && !isRunning && (
                    <div className="text-center py-12 text-text-muted text-sm">
                      Agent execution will appear here...
                    </div>
                  )}
                </div>
              </div>

              {/* Post-completion CTA */}
              {isComplete && (
                <div className="mt-6 glass-card p-6 text-center animate-fade-in"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))" }}
                >
                  <h3 className="text-lg font-bold text-text-primary mb-2">This agent just ran autonomously</h3>
                  <p className="text-sm text-text-secondary mb-5 max-w-xl mx-auto">
                    It observed data, recalled past patterns from memory, reasoned about risks, called tools to analyze and alert, and stored its findings for future reference.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={resetDemo} className="px-5 py-2.5 text-sm font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                      Try Another Agent
                    </button>
                    <Link href="/register" className="btn-primary px-5 py-2.5 text-sm font-semibold">
                      Deploy Your Own Agents →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
