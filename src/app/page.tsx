"use client";

import Link from "next/link";
import Image from "next/image";

// ─── Data ──────────────────────────────────

const AGENT_TYPES = [
  { name: "Fraud Monitoring", icon: "🛡️", desc: "Real-time transaction analysis, risk scoring, and anomaly detection", gradient: "from-rose-500 to-orange-500", stat: "99.4% accuracy", statLabel: "Detection Rate" },
  { name: "Compliance", icon: "⚖️", desc: "Automated KYC/AML checks, sanctions screening, regulatory monitoring", gradient: "from-violet-500 to-indigo-500", stat: "12x faster", statLabel: "vs Manual" },
  { name: "Reporting", icon: "📊", desc: "Executive summaries, trend analysis, and automated report generation", gradient: "from-emerald-500 to-teal-500", stat: "6 sources", statLabel: "Aggregated" },
  { name: "Finance", icon: "💰", desc: "Reconciliation, invoicing, forecasting, and financial statement automation", gradient: "from-amber-500 to-yellow-500", stat: "96.1%", statLabel: "Auto-Match" },
  { name: "Customer Support", icon: "💬", desc: "Ticket routing, intelligent responses, and escalation management", gradient: "from-sky-500 to-cyan-500", stat: "34%", statLabel: "Auto-Resolved" },
  { name: "Operations", icon: "⚙️", desc: "System monitoring, incident response, and operational optimization", gradient: "from-slate-400 to-zinc-500", stat: "90s MTTR", statLabel: "Auto-Remediate" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Deploy Agents", desc: "Select from 10 pre-built agent types or create custom agents with your own system prompts and tools.", icon: "🚀", gradient: "from-electric-500 to-cyan-500" },
  { step: "02", title: "Connect Systems", desc: "Integrate with your existing databases, APIs, CRMs, and communication platforms.", icon: "🔗", gradient: "from-violet-500 to-fuchsia-500" },
  { step: "03", title: "Automate Operations", desc: "Agents observe, reason, plan, execute, and learn — autonomously handling complex workflows.", icon: "⚡", gradient: "from-emerald-500 to-teal-500" },
  { step: "04", title: "Monitor & Optimize", desc: "Real-time dashboards, audit trails, and performance analytics across every agent execution.", icon: "📈", gradient: "from-amber-500 to-orange-500" },
];

const SECURITY_FEATURES = [
  { title: "Multi-Tenant Isolation", desc: "Complete data separation between organizations with row-level security", icon: "🏛️", gradient: "from-electric-500 to-blue-600" },
  { title: "RBAC with 5 Roles", desc: "Owner, Admin, Developer, Analyst, Viewer — 25+ granular permissions", icon: "👤", gradient: "from-violet-500 to-purple-600" },
  { title: "AES-256 Encryption", desc: "All secrets and API keys encrypted at rest with GCM authentication", icon: "🔐", gradient: "from-emerald-500 to-green-600" },
  { title: "JWT + Scoped API Keys", desc: "Token-based auth with expiring, scope-limited API keys for integrations", icon: "🔑", gradient: "from-amber-500 to-yellow-600" },
  { title: "Full Audit Trail", desc: "Every action logged — logins, agent executions, config changes, API calls", icon: "📋", gradient: "from-rose-500 to-pink-600" },
  { title: "Rate Limiting", desc: "Per-tenant, plan-based rate limiting with sliding window counters", icon: "🚦", gradient: "from-cyan-500 to-teal-600" },
];

const INTEGRATIONS = [
  { name: "PostgreSQL", icon: "🐘" }, { name: "Redis", icon: "⚡" }, { name: "OpenAI", icon: "🧠" },
  { name: "Slack", icon: "💬" }, { name: "SendGrid", icon: "📧" }, { name: "AWS S3", icon: "☁️" },
  { name: "Twilio", icon: "📱" }, { name: "Zapier", icon: "🔄" }, { name: "Salesforce", icon: "💼" },
  { name: "HubSpot", icon: "🎯" }, { name: "Snowflake", icon: "❄️" }, { name: "Stripe", icon: "💳" },
];

const COGNITIVE_PHASES = [
  { label: "Observe", icon: "👁️", color: "from-sky-500 to-sky-400" },
  { label: "Retrieve Memory", icon: "🧠", color: "from-violet-500 to-violet-400" },
  { label: "Reason (LLM)", icon: "💭", color: "from-amber-500 to-amber-400" },
  { label: "Plan", icon: "📋", color: "from-teal-500 to-teal-400" },
  { label: "Execute Tools", icon: "⚡", color: "from-electric-500 to-electric-400" },
  { label: "Evaluate", icon: "✅", color: "from-emerald-500 to-emerald-400" },
  { label: "Store Memory", icon: "💾", color: "from-indigo-500 to-indigo-400" },
  { label: "Report", icon: "📊", color: "from-cyan-500 to-cyan-400" },
];

// ─── Landing Page ──────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary text-lg">Agentic AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#agents" className="hover:text-text-primary transition-colors">Agents</a>
            <a href="#security" className="hover:text-text-primary transition-colors">Security</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">Start Free →</Link>
          </div>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-electric-500/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/6 rounded-full blur-[100px]" />
          <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-emerald-500/4 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-500/10 border border-electric-500/20 text-electric-400 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Now in Beta — Enterprise agents shipping Q2 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary leading-[1.1] mb-6 animate-fade-in">
            AI Agents That Run Your
            <span className="bg-gradient-to-r from-electric-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent"> Business Operations</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Deploy autonomous AI agents for fraud monitoring, compliance, reporting, and workflow automation.
            Enterprise-grade security. Real-time reasoning. Persistent memory.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-lg font-semibold">
              Deploy Your First Agent →
            </Link>
            <Link href="/demo" className="px-8 py-3.5 text-lg font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-all hover:border-white/20">
              Try Live Demo
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative mt-16 mb-8 flex justify-center animate-fade-in">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[400px] h-[400px] bg-electric-500/10 rounded-full blur-[80px]" />
            </div>
            <div className="relative" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <Image
                src="/hero-agentic-ai.png"
                alt="Agentic AI — Autonomous intelligent agents"
                width={600}
                height={600}
                className="rounded-3xl"
                style={{ filter: 'drop-shadow(0 0 60px rgba(59, 130, 246, 0.15))' }}
                priority
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 max-w-4xl mx-auto">
            {[
              { value: "99.7%", label: "Uptime SLA", icon: "🟢" },
              { value: "<500ms", label: "Avg Response", icon: "⚡" },
              { value: "10+", label: "Agent Types", icon: "🤖" },
              { value: "AES-256", label: "Encryption", icon: "🔒" },
            ].map((stat) => (
              <div key={stat.label} className="group relative glass-card p-5 text-center overflow-hidden hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-electric-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="text-lg mb-1">{stat.icon}</div>
                  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-electric-400 to-violet-400 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-sm text-text-muted mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-400 text-xs font-semibold uppercase tracking-wider mb-4">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">From Deployment to Optimization</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Four steps to autonomous operations</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-6 hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)]" style={{ animationDelay: `${i * 100}ms` }}>
                {/* Gradient top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                {/* Glow orb */}
                <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${item.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                >
                  {item.icon}
                </div>
                {/* Step number */}
                <div className="absolute top-6 right-6 text-5xl font-black text-white/[0.03] group-hover:text-white/[0.06] transition-colors">{item.step}</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                {/* Animated arrow */}
                {i < 3 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-navy-900 border border-white/10 items-center justify-center text-text-muted text-xs">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ AGENT TYPES ════════════ */}
      <section id="agents" className="py-24 px-6 bg-navy-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">Autonomous Agents</div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">10 Agent Types, Infinite Possibilities</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Pre-built agents that observe, reason, plan, execute, and learn from every interaction</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENT_TYPES.map((agent, i) => (
              <div key={agent.name} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-6 hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)]" style={{ animationDelay: `${i * 80}ms` }}>
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${agent.gradient} opacity-40 group-hover:opacity-100 transition-opacity`} />
                {/* Background glow */}
                <div className={`absolute -bottom-12 -right-12 w-40 h-40 bg-gradient-to-br ${agent.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-[0.07] transition-opacity duration-700`} />
                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                      {agent.icon}
                    </div>
                    {/* Mini stat */}
                    <div className="text-right opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="text-sm font-bold text-text-primary">{agent.stat}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">{agent.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-electric-400 transition-colors">{agent.name}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{agent.desc}</p>
                  {/* Animated bar */}
                  <div className="mt-4 h-1 rounded-full bg-navy-800 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${agent.gradient} w-0 group-hover:w-full transition-all duration-1000 ease-out`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/demo" className="inline-flex items-center gap-2 text-electric-400 hover:text-electric-300 font-medium text-sm transition-colors">
              See all 10 agents in action →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════ 8-PHASE COGNITIVE LOOP ════════════ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">Agent Intelligence</div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">8-Phase Cognitive Loop</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Every agent follows a full reasoning cycle — not just prompt → response</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COGNITIVE_PHASES.map((phase, i) => (
              <div key={phase.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-5 text-center hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(59,130,246,0.12)]" style={{ animationDelay: `${i * 60}ms` }}>
                {/* Phase number watermark */}
                <div className="absolute top-2 right-3 text-3xl font-black text-white/[0.03] group-hover:text-white/[0.06] transition-colors">{i + 1}</div>
                {/* Gradient top bar */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${phase.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                {/* Glow */}
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br ${phase.color} rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                {/* Icon */}
                <div className={`mx-auto w-12 h-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center text-xl mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                  {phase.icon}
                </div>
                <div className="text-sm font-semibold text-text-primary">{phase.label}</div>
                {/* Connector arrow (visible on md+) */}
                {i < 7 && i !== 3 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-text-muted/30 text-xs">›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ SECURITY ════════════ */}
      <section id="security" className="py-24 px-6 bg-navy-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">🔒 Enterprise Security</div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Bank-Grade Security</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Built for regulated industries — banks, fintechs, telcos, healthcare</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECURITY_FEATURES.map((feat, i) => (
              <div key={feat.title} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-6 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.12)]" style={{ animationDelay: `${i * 80}ms` }}>
                {/* Gradient accent */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feat.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                {/* Glow */}
                <div className={`absolute -top-8 -left-8 w-28 h-28 bg-gradient-to-br ${feat.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-[0.07] transition-opacity duration-700`} />
                <div className="relative flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-lg shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1.5 group-hover:text-emerald-400 transition-colors">{feat.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ INTEGRATIONS ════════════ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">Integrations</div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Connects to Your Entire Stack</h2>
          <p className="text-text-secondary text-lg mb-12 max-w-2xl mx-auto">Databases, APIs, cloud services, and communication platforms</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {INTEGRATIONS.map((item, i) => (
              <div key={item.name} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 p-4 text-center hover:border-electric-500/30 transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <div className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{item.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section id="pricing" className="py-24 px-6 bg-navy-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Simple, Transparent Pricing</h2>
            <p className="text-text-secondary text-lg">Scale from prototype to enterprise</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "$99", period: "/month", agents: "3 agents", executions: "10K", gradient: "from-slate-500 to-zinc-500", features: ["Basic dashboard", "Email support", "5GB storage", "Community access"] },
              { name: "Professional", price: "$499", period: "/month", agents: "15 agents", executions: "100K", gradient: "from-electric-500 to-violet-500", features: ["Advanced analytics", "Priority support", "50GB storage", "API access", "Custom prompts"], highlighted: true },
              { name: "Enterprise", price: "Custom", period: "", agents: "Unlimited", executions: "Unlimited", gradient: "from-emerald-500 to-teal-500", features: ["SSO/SAML", "Dedicated support", "Unlimited storage", "SLA guarantee", "Custom agents", "On-premise option"] },
            ].map((plan) => (
              <div key={plan.name} className={`group relative overflow-hidden rounded-2xl border bg-navy-900/50 p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)] ${plan.highlighted ? "border-electric-500/30" : "border-white/5 hover:border-electric-500/20"}`}>
                {plan.highlighted && (
                  <>
                    <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-electric-500 to-violet-500" />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-electric-500 to-violet-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Most Popular</div>
                  </>
                )}
                {/* Glow */}
                <div className={`absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br ${plan.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700`} />
                <div className="relative">
                  <h3 className="text-xl font-bold text-text-primary mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-text-muted text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-6">{plan.agents} • {plan.executions} executions/mo</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0`}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${plan.highlighted ? "btn-primary" : "border border-white/10 text-text-secondary hover:bg-white/5 hover:border-white/20"}`}>
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CTA ════════════ */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-electric-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Ready to Automate Your Operations?</h2>
          <p className="text-text-secondary text-lg mb-8">Deploy your first AI agent in under 5 minutes. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-lg font-semibold">
              Start Building →
            </Link>
            <Link href="/demo" className="px-8 py-3.5 text-lg font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-all hover:border-white/20">
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <span className="font-semibold text-text-secondary">Agentic AI Platform</span>
          </div>
          <p className="text-sm text-text-muted">© 2026 Agentic AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
