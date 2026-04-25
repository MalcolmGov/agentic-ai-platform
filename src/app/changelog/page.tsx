import Link from "next/link";
import Image from "next/image";

const RELEASES = [
  {
    version: "0.9.0",
    date: "March 26, 2026",
    title: "Tier 3 Intelligence Layer",
    tag: "latest",
    changes: [
      { type: "feat", text: "Agent Versioning — clone, fork, diff, and rollback agent configs" },
      { type: "feat", text: "Self-Improvement Engine — agents optimize prompts and reduce token cost" },
      { type: "feat", text: "Predictive Insights — 538-line ML engine powering Crystal Ball predictions" },
      { type: "feat", text: "Knowledge Graph — cross-agent institutional memory with IQ scoring" },
      { type: "feat", text: "Custom Tool SDK — create and deploy tools with sandboxed execution" },
      { type: "feat", text: "Workflow Replay — time-travel through executions with input modification" },
      { type: "feat", text: "Zod validation — all 20 API routes now validate request bodies" },
      { type: "fix", text: "Fixed Prisma seed script TypeScript error (null → undefined for JSON fields)" },
    ],
  },
  {
    version: "0.8.0",
    date: "March 25, 2026",
    title: "Enterprise & Scale",
    changes: [
      { type: "feat", text: "SSO/SAML — Okta, Azure AD, Google Workspace integration" },
      { type: "feat", text: "Stripe Billing — usage metrics, plan comparison, invoice history" },
      { type: "feat", text: "Integrations Hub — 10 connector management (Slack, Datadog, S3, etc.)" },
      { type: "feat", text: "Human-in-the-Loop — approval gates for high-impact agent actions" },
      { type: "feat", text: "A/B Testing — agent experiment framework with statistical analysis" },
      { type: "feat", text: "Scaling Dashboard — BullMQ worker/queue monitoring" },
      { type: "feat", text: "Voice Co-Pilot — expanded to 14 tool calls with full knowledge base" },
    ],
  },
  {
    version: "0.7.0",
    date: "March 24, 2026",
    title: "Intelligence Features",
    changes: [
      { type: "feat", text: "Agent Studio — drag-and-drop visual canvas with 6 node types" },
      { type: "feat", text: "Glass Box AI — 6-phase reasoning replay with PDF export" },
      { type: "feat", text: "Multi-Agent Collaboration — 5 message types, live replay" },
      { type: "feat", text: "AI Ops Copilot — natural language agent management" },
      { type: "feat", text: "Crystal Ball — predictive intelligence with 87% confidence" },
      { type: "feat", text: "Agent Marketplace — 12 pre-built agents, 1-click install" },
      { type: "fix", text: "Fixed chart bar visibility on dashboard overview" },
    ],
  },
  {
    version: "0.6.0",
    date: "March 23, 2026",
    title: "Core Platform",
    changes: [
      { type: "feat", text: "Prisma schema with 12 models (Agent, Workflow, Execution, etc.)" },
      { type: "feat", text: "Docker Compose production configuration" },
      { type: "feat", text: "GitHub Actions CI/CD pipeline (lint, test, build, Docker)" },
      { type: "feat", text: "Redis/BullMQ job queue infrastructure" },
      { type: "feat", text: "13 autonomous agent types with real-time execution" },
      { type: "feat", text: "Dashboard with premium dark navy aesthetic" },
    ],
  },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  feat: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Feature" },
  fix: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Fix" },
  perf: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Perf" },
  docs: { bg: "bg-violet-500/10", text: "text-violet-400", label: "Docs" },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo-3d.png" alt="Swifter AI" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-text-primary">Swifter AI</span>
            <span className="text-text-muted text-sm">/ Changelog</span>
          </Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2">Start Free →</Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-400 text-xs font-semibold uppercase tracking-wider mb-4">Changelog</div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">What&apos;s New</h1>
          <p className="text-text-secondary text-lg">Every feature shipped, every bug squashed.</p>
        </div>

        <div className="space-y-12">
          {RELEASES.map((release) => (
            <div key={release.version} className="relative">
              {/* Version header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-text-primary">v{release.version}</span>
                  {release.tag && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full uppercase">{release.tag}</span>
                  )}
                </div>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-sm text-text-muted">{release.date}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">{release.title}</h3>

              {/* Changes */}
              <div className="space-y-2">
                {release.changes.map((change, i) => {
                  const colors = TYPE_COLORS[change.type] || TYPE_COLORS.feat;
                  return (
                    <div key={i} className="flex items-start gap-3 py-2 px-4 rounded-lg hover:bg-white/[0.02] transition-colors">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors.bg} ${colors.text} shrink-0 mt-0.5`}>{colors.label}</span>
                      <span className="text-sm text-text-secondary">{change.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
