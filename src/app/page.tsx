"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   AGENTIC AI PLATFORM — LANDING PAGE
   Showcases all 19+ platform capabilities with compelling visuals
   ═══════════════════════════════════════════════════════════════ */

/* ── Animated Counter Hook ── */
function useCounter(end: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = Date.now();
          const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            setVal(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return { val, ref };
}

/* ── Scroll Reveal Hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Typewriter Hook ── */
function useTypewriter(text: string, speed = 40, startDelay = 400) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

/* ── Hero Typewriter Component ── */
function HeroTypewriter() {
  const line1 = 'The Operating System';
  const line2 = 'for AI Agents';
  const { displayed: d1, done: done1 } = useTypewriter(line1, 40, 300);
  const { displayed: d2, done: done2 } = useTypewriter(line2, 50, 300 + line1.length * 40 + 200);
  return (
    <>
      {d1}
      {done1 && <br />}
      {done1 && (
        <span className="bg-gradient-to-r from-blue-400 via-fuchsia-500 to-lime-400 bg-clip-text text-transparent" style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
          {d2}
        </span>
      )}
      {!done2 && <span className="typewriter-cursor" />}
    </>
  );
}

/* ── 7 Wow Features ── */
const WOW_FEATURES = [
  {
    title: "Agent Studio",
    tagline: "No-Code Agent Builder",
    desc: "Drag-and-drop visual canvas — build production AI agents in minutes, not weeks. 6 node types, 3 templates, instant deploy.",
    icon: "🎨",
    gradient: "from-violet-500 to-fuchsia-500",
    route: "/dashboard/studio",
    image: "/feature-studio.png",
    stats: ["6 node types", "3 templates", "Zero code"],
  },
  {
    title: "Glass Box AI",
    tagline: "Full Reasoning Transparency",
    desc: "See exactly WHY your agents make decisions. 6-phase reasoning replay, confidence scores, and compliance-ready PDF exports.",
    icon: "🔍",
    gradient: "from-cyan-500 to-blue-500",
    route: "/dashboard/glass-box",
    image: "/feature-glassbox.png",
    stats: ["6-phase replay", "Audit-ready", "PDF export"],
  },
  {
    title: "Multi-Agent Collaboration",
    tagline: "Agents That Work Together",
    desc: "Agents delegate, coordinate, and solve problems autonomously. FraudGuard detects → ComplianceBot checks → DataMiner analyzes.",
    icon: "🤝",
    gradient: "from-emerald-500 to-teal-500",
    route: "/dashboard/collaboration",
    image: "/feature-multiagent.png",
    stats: ["5 message types", "Live replay", "Auto-delegate"],
  },
  {
    title: "AI Ops Copilot",
    tagline: "Natural Language Control",
    desc: '"Deploy a fraud agent monitoring $5K+ transactions" — type it and it happens. Manage your entire agent fleet conversationally.',
    icon: "💬",
    iconImg: "/icons/copilot.png",
    gradient: "from-amber-500 to-orange-500",
    route: "/dashboard/copilot",
    stats: ["6 quick commands", "Intent AI", "3-sec deploy"],
  },
  {
    title: "Agent Marketplace",
    tagline: "App Store for AI Agents",
    desc: "Browse 12 pre-built agents, one-click install. Publish your own agents and earn 70% revenue share. FraudShield Pro, KYC AutoVerify, DocAnalyzer.",
    icon: "🏪",
    iconImg: "/icons/marketplace.png",
    gradient: "from-rose-500 to-pink-500",
    route: "/dashboard/marketplace",
    stats: ["12 agents", "70/30 split", "1-click install"],
  },
  {
    title: "Crystal Ball",
    tagline: "Predictive Intelligence",
    desc: "AI predictions that alert you BEFORE problems happen. Fraud ring activation (87% confidence), volume surges, compliance deadline risks.",
    icon: "🔮",
    iconImg: "/icons/crystal-ball.png",
    gradient: "from-indigo-500 to-violet-500",
    route: "/dashboard/crystal-ball",
    stats: ["6 predictions", "87% confidence", "Auto-action"],
  },
  {
    title: "Voice Co-Pilot",
    tagline: "Talk to Your Agents",
    desc: "WebRTC speech-to-speech with live data. Ask questions, get briefings, deploy agents — all by voice. Powered by OpenAI Realtime API.",
    icon: "🎙️",
    iconImg: "/icons/voice.png",
    gradient: "from-sky-500 to-cyan-500",
    route: "/dashboard/voice",
    stats: ["Real-time voice", "14 tool calls", "Live data"],
  },
];

/* ── Enterprise Features ── */
const ENTERPRISE_FEATURES = [
  { title: "Human-in-the-Loop", desc: "Approval gates for high-risk agent actions. 5 risk levels, auto-escalation.", iconImg: "/icons/approval-gate.png", gradient: "from-rose-500 to-red-600", route: "/dashboard/approvals" },
  { title: "Agent A/B Testing", desc: "Run experiments comparing GPT-4o vs Claude 3.5. Statistical significance analysis.", iconImg: "/icons/ab-testing.png", gradient: "from-violet-500 to-purple-600", route: "/dashboard/experiments" },
  { title: "Knowledge Graph", desc: "Cross-agent institutional memory. Gets smarter the longer you use it.", iconImg: "/icons/knowledge-graph.png", gradient: "from-emerald-500 to-green-600", route: "/dashboard/knowledge" },
  { title: "Agent Versioning", desc: "Version control for agents — clone, fork, diff, and rollback configurations.", iconImg: "/icons/versioning.png", gradient: "from-amber-500 to-yellow-600", route: "/dashboard/agents/versions" },
  { title: "Self-Improvement", desc: "Agents optimize their own prompts, reduce token cost, and improve accuracy.", iconImg: "/icons/self-improve.png", gradient: "from-cyan-500 to-teal-600", route: "/dashboard/agents/improve" },
  { title: "Custom Tool SDK", desc: "Create and deploy custom tools with sandboxed execution and versioning.", iconImg: "/icons/custom-tools.png", gradient: "from-slate-400 to-zinc-500", route: "/dashboard/tools" },
  { title: "Workflow Replay", desc: "Time-travel through any execution. Modify inputs and compare outcomes.", iconImg: "/icons/replay.png", gradient: "from-blue-500 to-indigo-600", route: "/dashboard/workflows/replay" },
  { title: "Predictive Engine", desc: "538-line ML engine powering Crystal Ball. Time-series, anomaly detection, trends.", iconImg: "/icons/predictive.png", gradient: "from-fuchsia-500 to-pink-500", route: "/dashboard/insights" },
  { title: "SSO / SAML", desc: "Okta, Azure AD, Google Workspace, OneLogin. Auto-provision from your directory.", iconImg: "/icons/sso.png", gradient: "from-electric-500 to-blue-600", route: "/dashboard/settings/sso" },
  { title: "Scaling Dashboard", desc: "7 BullMQ workers, 5 queues. One-click horizontal scaling. Auto-scale toggle.", iconImg: "/icons/scaling.png", gradient: "from-orange-500 to-red-500", route: "/dashboard/scaling" },
  { title: "Integrations Hub", desc: "10 connectors — Slack, Datadog, S3, Teams, Salesforce, GitHub, Jira, and more.", iconImg: "/icons/integrations.png", gradient: "from-teal-500 to-cyan-500", route: "/dashboard/settings/integrations" },
  { title: "Stripe Billing", desc: "Usage-based billing. 3 plans: Free, Pro ($99), Enterprise ($499). Invoice history.", iconImg: "/icons/billing.png", gradient: "from-indigo-500 to-violet-500", route: "/dashboard/settings/billing" },
];

/* ── Social Proof Stats ── */
const PROOF_STATS = [
  { value: 42580, suffix: "+", label: "Agent Executions", icon: "⚡" },
  { value: 847, suffix: "K", label: "Cost Savings", prefix: "$", icon: "💰" },
  { value: 297, suffix: "x", label: "ROI on LLM Spend", icon: "📈" },
  { value: 99, suffix: ".95%", label: "Platform Uptime", icon: "🟢" },
];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll reveal refs for each major section
  const revealCaps = useReveal();
  const revealEnterprise = useReveal();
  const revealHow = useReveal();
  const revealSecurity = useReveal();
  const revealPricing = useReveal(); // kept to avoid breaking refs
  const revealCta = useReveal();

  // Auto-rotate featured features
  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((p) => (p + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on anchor click
  const handleNavClick = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen">
      {/* ═══ CSS Animations ═══ */}
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes glow-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes blink-caret { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .slide-up { animation: slide-up 0.8s ease-out both; }
        .fade-scale { animation: fade-scale 0.6s ease-out both; }
        .mobile-menu-open { animation: slideInRight 0.3s ease-out both; }
        .typewriter-cursor { display: inline-block; width: 3px; height: 1em; background: linear-gradient(to bottom, #3b82f6, #a855f7); margin-left: 4px; vertical-align: text-bottom; animation: blink-caret 0.75s step-end infinite; }
      `}</style>

      {/* ═══════════ NAV ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-3d.png" alt="AI Platform" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-text-primary text-lg">AI Platform</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#capabilities" className="hover:text-text-primary transition-colors">Capabilities</a>
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#enterprise" className="hover:text-text-primary transition-colors">Enterprise</a>

          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/demo" className="hidden md:inline-block text-sm px-4 py-2 text-electric-400 border border-electric-500/30 rounded-xl hover:bg-electric-500/10 transition-all">Live Demo</Link>
            <Link href="/dashboard" className="btn-primary text-sm px-5 py-2">Open Dashboard →</Link>
          </div>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Menu">
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mobile-menu-open border-t border-white/5 bg-navy-950/95 backdrop-blur-xl px-6 py-4 space-y-3">
            <a href="#capabilities" onClick={handleNavClick} className="block text-sm text-text-secondary hover:text-text-primary py-2">Capabilities</a>
            <a href="#features" onClick={handleNavClick} className="block text-sm text-text-secondary hover:text-text-primary py-2">Features</a>
            <a href="#enterprise" onClick={handleNavClick} className="block text-sm text-text-secondary hover:text-text-primary py-2">Enterprise</a>

            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              <Link href="/demo" onClick={handleNavClick} className="text-sm text-electric-400 py-2">Live Demo</Link>
              <Link href="/dashboard" onClick={handleNavClick} className="btn-primary text-sm px-5 py-2 text-center">Open Dashboard →</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-[700px] h-[700px] bg-electric-500/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/6 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left side — Text + CTAs */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-500/10 border border-electric-500/20 text-electric-400 text-sm font-medium mb-8 slide-up">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                19+ Enterprise Capabilities · Shipping Q2 2026
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-[1.05] mb-8">
                <HeroTypewriter />
              </h1>

              <p className="text-lg md:text-xl text-text-secondary max-w-xl mb-10 leading-relaxed slide-up" style={{ animationDelay: '200ms' }}>
                Build agents visually. Watch them reason in real-time. Let them collaborate autonomously.{' '}
                <span className="text-text-primary font-medium">One platform for the entire agent lifecycle.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6 slide-up" style={{ animationDelay: '300ms' }}>
                <Link href="/dashboard" className="btn-primary px-10 py-4 text-lg font-semibold shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                  Open Dashboard →
                </Link>
                <Link href="/demo" className="group flex items-center gap-3 px-8 py-4 text-lg font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-all hover:border-white/20">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-r from-electric-500 to-violet-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">▶</span>
                  Watch 2-min Demo
                </Link>
              </div>

              <p className="text-sm text-text-muted slide-up" style={{ animationDelay: '350ms' }}>Full access · No sign-in required · Explore all 19+ capabilities</p>
            </div>

            {/* Right side — Hero Image */}
            <div className="flex-1 relative slide-up" style={{ animationDelay: '400ms' }}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] bg-electric-500/10 rounded-full blur-[120px]" />
              </div>
              <div className="relative" style={{ animation: 'float 8s ease-in-out infinite' }}>
                <Image
                  src="/hero-swifter-ai.png"
                  alt="AI Platform Platform — Enterprise Agent Orchestration Dashboard"
                  width={700}
                  height={700}
                  className="w-full"
                  priority
                />
                {/* Edge-blending gradients — seamless fade into background */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-l from-navy-950/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-white/80 font-medium">12 agents active · Processing 42,580 executions</span>
                  </div>
                  <div className="text-xs text-white/60">99.95% uptime · $847K saved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By / Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {PROOF_STATS.map((stat) => {
              const counter = useCounter(stat.value);
              return (
                <div key={stat.label} ref={counter.ref} className="group glass-card p-6 text-center hover:-translate-y-1 transition-all duration-300">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-electric-400 to-violet-400 bg-clip-text text-transparent">
                    {stat.prefix || ""}{counter.val.toLocaleString()}{stat.suffix}
                  </p>
                  <p className="text-sm text-text-muted mt-2">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ CAPABILITIES OVERVIEW ═══════════ */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 py-6">
            {[
              { label: "Visual Builder", icon: "🎨", gradient: "from-violet-500 to-fuchsia-500", bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-300" },
              { label: "Reasoning Replay", icon: "🔄", gradient: "from-cyan-500 to-blue-500", bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-300" },
              { label: "Multi-Agent", icon: "🤖", gradient: "from-electric-500 to-violet-500", bg: "bg-electric-500/10", border: "border-electric-500/25", text: "text-electric-300" },
              { label: "Voice Control", icon: "🎙️", gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500/10", border: "border-rose-500/25", text: "text-rose-300" },
              { label: "Marketplace", icon: "🏪", gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-300" },
              { label: "Predictions", icon: "🔮", gradient: "from-purple-500 to-indigo-500", bg: "bg-purple-500/10", border: "border-purple-500/25", text: "text-purple-300" },
              { label: "Approvals", icon: "✅", gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300" },
              { label: "A/B Testing", icon: "⚗️", gradient: "from-sky-500 to-cyan-500", bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-300" },
              { label: "Knowledge Graph", icon: "🧠", gradient: "from-indigo-500 to-blue-500", bg: "bg-indigo-500/10", border: "border-indigo-500/25", text: "text-indigo-300" },
              { label: "Auto-Scale", icon: "📈", gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", border: "border-green-500/25", text: "text-green-300" },
              { label: "SSO/SAML", icon: "🔐", gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-500/10", border: "border-yellow-500/25", text: "text-yellow-300" },
              { label: "Custom Tools", icon: "🔧", gradient: "from-orange-500 to-red-500", bg: "bg-orange-500/10", border: "border-orange-500/25", text: "text-orange-300" },
            ].map((cap) => (
              <div
                key={cap.label}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full ${cap.bg} border ${cap.border} hover:shadow-[0_0_20px_-5px] hover:shadow-current hover:scale-105 transition-all duration-300 cursor-default`}
              >
                <span className="text-base">{cap.icon}</span>
                <span className={`text-sm font-semibold ${cap.text}`}>{cap.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 7 WOW FEATURES — HERO SHOWCASE ═══════════ */}
      <section id="capabilities" ref={revealCaps} className="py-24 px-6 bg-navy-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">7 Market-Disrupting Capabilities</div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              Not Just Another
              <span className="bg-gradient-to-r from-electric-400 to-violet-400 bg-clip-text text-transparent"> AI Dashboard</span>
            </h2>
            <p className="text-text-secondary text-xl max-w-3xl mx-auto">Each capability is a product in its own right. Together, they create the most complete agent orchestration platform on the market.</p>
          </div>

          {/* Feature showcase with alternating layout */}
          <div className="space-y-32">
            {WOW_FEATURES.slice(0, 3).map((feature, i) => (
              <div key={feature.title} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20`}>
                {/* Text side */}
                <div className="flex-1 max-w-xl">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${feature.gradient} bg-opacity-10 text-white text-xs font-semibold uppercase tracking-wider mb-4`} style={{ background: `linear-gradient(135deg, rgba(var(--tw-gradient-from), 0.1), rgba(var(--tw-gradient-to), 0.1))` }}>
                    <span className="text-lg">{feature.icon}</span> {feature.tagline}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{feature.title}</h3>
                  <p className="text-lg text-text-secondary leading-relaxed mb-8">{feature.desc}</p>
                  <div className="flex flex-wrap gap-3 mb-8">
                    {feature.stats.map((s) => (
                      <span key={s} className="px-4 py-2 rounded-lg bg-navy-900/80 border border-white/5 text-sm text-text-primary font-medium">{s}</span>
                    ))}
                  </div>
                  <Link href={feature.route} className="inline-flex items-center gap-2 text-electric-400 hover:text-electric-300 font-semibold transition-colors group">
                    Explore {feature.title}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Image side */}
                {feature.image && (
                  <div className="flex-1 relative">
                    <div className={`absolute -inset-8 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-3xl opacity-[0.07]`} />
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
                      <Image src={feature.image} alt={feature.title} width={700} height={450} className="w-full" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Remaining 4 wow features as cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
            {WOW_FEATURES.slice(3).map((feature, i) => (
              <Link key={feature.title} href={feature.route} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-6 hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)] block no-underline" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                <div className="relative w-[80px] h-[80px] mb-5 mx-auto">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-20 group-hover:opacity-40 blur-2xl scale-150 transition-opacity duration-500`} />
                  {feature.iconImg ? (
                    <Image src={feature.iconImg} alt={feature.title} width={80} height={80} className="relative object-contain drop-shadow-[0_8px_30px_rgba(59,130,246,0.4)] group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className={`w-[80px] h-[80px] rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl`}>{feature.icon}</div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-electric-400 transition-colors">{feature.title}</h3>
                <p className="text-xs text-electric-400 font-medium mb-3">{feature.tagline}</p>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">{feature.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.stats.map((s) => (
                    <span key={s} className="px-2 py-1 rounded bg-white/5 text-xs text-text-muted">{s}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ENTERPRISE FEATURES GRID ═══════════ */}
      <section id="enterprise" ref={revealEnterprise} className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">🏢 Enterprise & Scale</div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">12 More Reasons to Choose Us</h2>
            <p className="text-text-secondary text-xl max-w-3xl mx-auto">Deep infrastructure for teams that need approval gates, A/B testing, knowledge graphs, versioning, SSO, and auto-scaling.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
            {ENTERPRISE_FEATURES.map((feat, i) => (
              <Link key={feat.title} href={feat.route} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/40 p-6 hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)] block no-underline" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${feat.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                <div className="relative w-[96px] h-[96px] mb-5 mx-auto">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feat.gradient} opacity-15 group-hover:opacity-30 blur-2xl scale-150 transition-opacity duration-500`} />
                  <Image src={feat.iconImg} alt={feat.title} width={96} height={96} className="relative object-contain drop-shadow-[0_8px_30px_rgba(59,130,246,0.4)] group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-2 text-center group-hover:text-electric-400 transition-colors">{feat.title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed text-center">{feat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="features" ref={revealHow} className="py-24 px-6 bg-navy-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-400 text-xs font-semibold uppercase tracking-wider mb-4">How It Works</div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Five Minutes to Your First Agent</h2>
            <p className="text-text-secondary text-xl max-w-2xl mx-auto">From zero to autonomous operations in 4 steps</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Build Visually", desc: "Drag nodes onto the Agent Studio canvas. Connect triggers → LLM calls → tools → outputs. Use a template or start blank.", iconImg: "/icons/build.png", gradient: "from-electric-500 to-cyan-500" },
              { step: "02", title: "Deploy & Connect", desc: "One-click deploy. Connect to Slack, Datadog, S3, Salesforce, and 6 more integrations. Agents start executing immediately.", iconImg: "/icons/deploy.png", gradient: "from-violet-500 to-fuchsia-500" },
              { step: "03", title: "Monitor & Approve", desc: "Real-time dashboard shows every execution. Glass Box AI reveals reasoning. Approval gates catch high-risk actions before they fire.", iconImg: "/icons/monitor.png", gradient: "from-emerald-500 to-teal-500" },
              { step: "04", title: "Optimize & Scale", desc: "A/B test model changes. Agents self-improve. Crystal Ball predicts issues. Auto-scale infrastructure as your fleet grows.", iconImg: "/icons/optimize.png", gradient: "from-amber-500 to-orange-500" },
            ].map((item, i) => (
              <div key={item.step} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-8 hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)]" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute top-8 right-6 text-6xl font-black text-white/[0.03] group-hover:text-white/[0.06] transition-colors">{item.step}</div>
                <div className="relative w-[100px] h-[100px] mb-6 mx-auto">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${item.gradient} opacity-20 group-hover:opacity-40 blur-2xl scale-[1.8] transition-opacity duration-500`} />
                  <Image src={item.iconImg} alt={item.title} width={100} height={100} className="relative object-contain drop-shadow-[0_8px_30px_rgba(59,130,246,0.4)] group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 text-center">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SECURITY & COMPLIANCE ═══════════ */}
      <section ref={revealSecurity} className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">🔒 Security</div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Built for Regulated Industries</h2>
            <p className="text-text-secondary text-xl max-w-2xl mx-auto">Banks, fintechs, insurance, healthcare — every agent action is encrypted, logged, and auditable</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Glass Box Compliance", desc: "Full reasoning audit trail. Export any agent decision as a compliance-ready PDF. SOX, GDPR, PCI-DSS compatible.", iconImg: "/icons/soc2.png", gradient: "from-emerald-500 to-green-600" },
              { title: "SSO + RBAC", desc: "SAML 2.0 / OIDC with Okta, Azure AD, Google. 5 roles, 25+ permissions. Auto-provision from your directory.", iconImg: "/icons/rbac.png", gradient: "from-electric-500 to-blue-600" },
              { title: "Approval Gates", desc: "High-risk agent actions pause for human review. 5 risk levels. Critical decisions never go unsupervised.", iconImg: "/icons/approval-gate.png", gradient: "from-rose-500 to-red-600" },
              { title: "AES-256 Encryption", desc: "All secrets encrypted at rest with GCM authentication. JWT + scoped API keys. Rate limiting per tenant.", iconImg: "/icons/encryption.png", gradient: "from-amber-500 to-yellow-600" },
              { title: "Full Audit Trail", desc: "Every login, execution, config change, and API call logged. Searchable logs with filters and export.", iconImg: "/icons/audit-trail.png", gradient: "from-violet-500 to-purple-600" },
              { title: "Data Residency", desc: "South Africa (POPIA), EU (GDPR), US data residency options. Multi-tenant isolation with row-level security.", iconImg: "/icons/data-residency.png", gradient: "from-cyan-500 to-teal-600" },
            ].map((feat, i) => (
              <div key={feat.title} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-8 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.12)]" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feat.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-[72px] h-[72px] mb-5">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${feat.gradient} opacity-20 group-hover:opacity-40 blur-xl scale-[2] transition-opacity duration-500`} />
                    <Image src={feat.iconImg} alt={feat.title} width={72} height={72} className="relative object-contain drop-shadow-[0_4px_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-emerald-400 transition-colors">{feat.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING — HIDDEN ═══════════ */}

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section ref={revealCta} className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-electric-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-8">🚀</div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Your Agents Are
            <span className="bg-gradient-to-r from-electric-400 to-violet-400 bg-clip-text text-transparent"> Waiting</span>
          </h2>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Join teams deploying autonomous AI agents for fraud detection, compliance automation, predictive analytics, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/dashboard" className="btn-primary px-10 py-4 text-lg font-semibold shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              Open Dashboard →
            </Link>
            <Link href="/demo" className="px-8 py-4 text-lg font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-all hover:border-white/20">
              Explore Live Demo
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Full access</span>
            <span>·</span>
            <span>No sign-in required</span>
            <span>·</span>
            <span>Deploy in 5 minutes</span>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo-3d.png" alt="AI Platform" width={28} height={28} className="rounded-lg" />
                <span className="font-bold text-text-primary">AI Platform</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">The operating system for AI agents. Build, deploy, monitor, and optimize autonomous agents at enterprise scale.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Product</h4>
              <div className="space-y-2 text-sm text-text-muted">
                <div><Link href="/dashboard/studio" className="hover:text-text-primary transition-colors">Agent Studio</Link></div>
                <div><Link href="/dashboard/glass-box" className="hover:text-text-primary transition-colors">Glass Box AI</Link></div>
                <div><Link href="/dashboard/marketplace" className="hover:text-text-primary transition-colors">Marketplace</Link></div>
                <div><Link href="/dashboard/crystal-ball" className="hover:text-text-primary transition-colors">Crystal Ball</Link></div>

              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Enterprise</h4>
              <div className="space-y-2 text-sm text-text-muted">
                <div><Link href="/dashboard/settings/sso" className="hover:text-text-primary transition-colors">SSO / SAML</Link></div>
                <div><Link href="/dashboard/approvals" className="hover:text-text-primary transition-colors">Approval Gates</Link></div>
                <div><Link href="/dashboard/experiments" className="hover:text-text-primary transition-colors">A/B Testing</Link></div>
                <div><Link href="/dashboard/knowledge" className="hover:text-text-primary transition-colors">Knowledge Graph</Link></div>
                <div><Link href="/dashboard/scaling" className="hover:text-text-primary transition-colors">Infrastructure</Link></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Resources</h4>
              <div className="space-y-2 text-sm text-text-muted">
                <div><Link href="/demo" className="hover:text-text-primary transition-colors">Live Demo</Link></div>
                <div><Link href="/docs" className="hover:text-text-primary transition-colors">Documentation</Link></div>
                <div><Link href="/blog" className="hover:text-text-primary transition-colors">Blog</Link></div>
                <div><Link href="/changelog" className="hover:text-text-primary transition-colors">Changelog</Link></div>
                <div><Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link></div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">© 2026 AI Platform Platform. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <Link href="/dashboard" className="hover:text-electric-400 transition-colors">Dashboard</Link>
              <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-text-primary transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
