"use client";

import { useState, useRef, useEffect } from "react";

// ─── Mock Competitor Data ──────────────────

interface Competitor {
  id: string;
  name: string;
  logo: string;
  threat: "high" | "medium" | "low";
  lastUpdate: string;
}

interface IntelItem {
  id: string;
  competitor: string;
  type: "product_launch" | "pricing_change" | "funding" | "hiring" | "partnership" | "press";
  title: string;
  summary: string;
  impact: "high" | "medium" | "low";
  date: string;
  source: string;
  recommendation?: string;
}

const COMPETITORS: Competitor[] = [
  { id: "c1", name: "NexaFlow AI", logo: "🔵", threat: "high", lastUpdate: "2h ago" },
  { id: "c2", name: "AutoPilot.io", logo: "🟣", threat: "high", lastUpdate: "5h ago" },
  { id: "c3", name: "AgentForge", logo: "🟠", threat: "medium", lastUpdate: "1d ago" },
  { id: "c4", name: "WorkflowAI", logo: "🟢", threat: "medium", lastUpdate: "2d ago" },
  { id: "c5", name: "BotBuilder Pro", logo: "🔴", threat: "low", lastUpdate: "3d ago" },
];

const INTEL_FEED: IntelItem[] = [
  {
    id: "INT-001", competitor: "NexaFlow AI", type: "funding",
    title: "NexaFlow raises $42M Series B led by Sequoia",
    summary: "NexaFlow AI announced $42M Series B funding, bringing total raised to $58M. They plan to expand into enterprise compliance automation and hire 80 engineers. Press release mentions 'direct competition with horizontal agent platforms.'",
    impact: "high", date: "2h ago", source: "TechCrunch",
    recommendation: "URGENT: Accelerate enterprise compliance features. Consider targeted outreach to NexaFlow prospects before they close deals. Update competitive battle card.",
  },
  {
    id: "INT-002", competitor: "AutoPilot.io", type: "pricing_change",
    title: "AutoPilot slashes enterprise pricing by 35%",
    summary: "AutoPilot.io reduced enterprise tier from $799/mo to $519/mo and added unlimited agents. This undercuts our Professional plan by $20/mo. Change effective April 1. Blog post signals aggressive land-and-expand strategy.",
    impact: "high", date: "5h ago", source: "Company Blog",
    recommendation: "Review our pricing strategy. Consider adding more value to Professional tier (e.g., custom agents, priority support) rather than matching price. Prepare sales talking points on quality + security differentiators.",
  },
  {
    id: "INT-003", competitor: "NexaFlow AI", type: "product_launch",
    title: "NexaFlow launches 'ReasonEngine' — multi-step agent reasoning",
    summary: "NexaFlow released ReasonEngine, a multi-step reasoning framework supporting chain-of-thought, ReAct, and tree-of-thought patterns. Early reviews praise the UI but note limited tool integrations (only 8 vs our 12).",
    impact: "high", date: "1d ago", source: "Product Hunt",
    recommendation: "Our 8-phase cognitive loop is more comprehensive. Create comparison content showing depth advantage. Consider publishing a benchmark comparison.",
  },
  {
    id: "INT-004", competitor: "AgentForge", type: "partnership",
    title: "AgentForge partners with Snowflake for data integrations",
    summary: "AgentForge announced strategic partnership with Snowflake, enabling agents to directly query Snowflake warehouses. Joint webinar planned for April 15. This could attract data-heavy enterprise prospects.",
    impact: "medium", date: "1d ago", source: "LinkedIn",
    recommendation: "Fast-track our Snowflake integration from H2 roadmap to Q2. Consider partnership counter-announcement with a competing data platform (Databricks, BigQuery).",
  },
  {
    id: "INT-005", competitor: "AutoPilot.io", type: "hiring",
    title: "AutoPilot posting 12 senior security engineer roles",
    summary: "AutoPilot.io posted 12 senior security engineer positions on LinkedIn, including a Head of Security and SOC 2 Compliance Lead. Current reviews on G2 mention security as their weakness. This signals they're addressing it aggressively.",
    impact: "medium", date: "2d ago", source: "LinkedIn Jobs",
    recommendation: "Our security stack is currently a major differentiator (AES-256, RBAC, scoped keys). Accelerate SOC 2 certification process. Create security-focused content to maintain leadership position while they catch up.",
  },
  {
    id: "INT-006", competitor: "WorkflowAI", type: "press",
    title: "WorkflowAI featured in Gartner Magic Quadrant for RPA",
    summary: "WorkflowAI included as 'Niche Player' in Gartner's 2026 Magic Quadrant for Robotic Process Automation. Report notes strong agent orchestration but weak analytics and limited vertical solutions.",
    impact: "medium", date: "3d ago", source: "Gartner",
    recommendation: "Submit for next cycle's evaluation. Our agent intelligence + analytics combination positions us for 'Visionary' quadrant. Prepare Gartner analyst briefing packet.",
  },
  {
    id: "INT-007", competitor: "BotBuilder Pro", type: "product_launch",
    title: "BotBuilder launches free tier with 2 agents",
    summary: "BotBuilder Pro introduced a free tier allowing 2 agents with 1K executions/month. Clearly targeting startup segment. Product reviews note limited reasoning capabilities and no enterprise features.",
    impact: "low", date: "3d ago", source: "Hacker News",
    recommendation: "Low threat — different market segment. Monitor for enterprise expansion signals. No immediate action needed.",
  },
];

// ─── Agent Thinking Steps ──────────────────

const SCAN_STEPS = [
  "🌐 Scanning 847 sources across 5 competitors: news sites, blogs, job boards, social media, SEC filings...",
  "📰 Tool: scan_news({competitors: 5, sources: ['techcrunch', 'venturebeat', 'hacker_news', 'product_hunt']})\n→ 12 relevant articles found in last 72 hours",
  "💼 Tool: scan_job_postings({competitors: 5, platforms: ['linkedin', 'indeed', 'wellfound']})\n→ 147 open positions detected. AutoPilot.io: 34 new (↑47% vs last week)",
  "💰 Tool: scan_funding({sources: ['crunchbase', 'pitchbook', 'sec_filings']})\n→ 1 new funding round detected: NexaFlow $42M Series B",
  "📊 Tool: analyze_pricing_pages({competitors: 5, compare_vs: 'our_plans'})\n→ 1 pricing change detected: AutoPilot.io -35% on enterprise tier",
  "🔍 Tool: scan_product_launches({sources: ['product_hunt', 'github', 'company_blogs']})\n→ 2 product launches: NexaFlow ReasonEngine, BotBuilder Free Tier",
  "🤝 Tool: scan_partnerships({sources: ['press_releases', 'linkedin', 'blogs']})\n→ 1 partnership: AgentForge × Snowflake",
  "🧠 Analyzing competitive positioning shifts... Cross-referencing with our feature matrix...",
  "📋 Tool: generate_battle_cards({competitors: ['nexaflow', 'autopilot'], type: 'updated'})\n→ 2 sales battle cards updated with latest intelligence",
  "⚠️ Tool: generate_alerts({priority: 'high', count: 3})\n→ 3 high-priority alerts generated for leadership team",
  "📊 Generating competitive landscape report with threat assessment and recommendations...",
  "✅ Intelligence scan complete. 7 signals detected. 3 high-priority alerts. 2 battle cards updated.",
];

// ─── Component ─────────────────────────────

export default function IntelPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const [selectedIntel, setSelectedIntel] = useState<IntelItem | null>(null);
  const [filter, setFilter] = useState("all");
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepsRef.current) stepsRef.current.scrollTop = stepsRef.current.scrollHeight;
  }, [scanSteps]);

  async function runScan() {
    setIsScanning(true);
    setScanComplete(false);
    setScanSteps([]);
    for (const step of SCAN_STEPS) {
      await new Promise(r => setTimeout(r, 700));
      setScanSteps(prev => [...prev, step]);
    }
    await new Promise(r => setTimeout(r, 400));
    setIsScanning(false);
    setScanComplete(true);
  }

  const filtered = filter === "all" ? INTEL_FEED : INTEL_FEED.filter(i => {
    if (filter === "high") return i.impact === "high";
    if (filter === "pricing") return i.type === "pricing_change";
    if (filter === "product") return i.type === "product_launch";
    if (filter === "funding") return i.type === "funding";
    return true;
  });

  const typeIcons: Record<string, { icon: string; label: string; color: string }> = {
    funding: { icon: "💰", label: "Funding", color: "badge-active" },
    pricing_change: { icon: "💲", label: "Pricing", color: "badge-error" },
    product_launch: { icon: "🚀", label: "Launch", color: "badge-info" },
    partnership: { icon: "🤝", label: "Partnership", color: "badge-warning" },
    hiring: { icon: "👥", label: "Hiring", color: "badge-neutral" },
    press: { icon: "📰", label: "Press", color: "badge-neutral" },
  };

  const impactColor: Record<string, string> = {
    high: "text-rose-400 bg-rose-500/15", medium: "text-amber-400 bg-amber-500/15", low: "text-slate-400 bg-slate-500/15",
  };

  const threatColor: Record<string, string> = {
    high: "from-rose-500 to-orange-500", medium: "from-amber-500 to-yellow-500", low: "from-slate-400 to-zinc-500",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Competitive Intelligence</h1>
          <p className="text-text-secondary mt-1">AI-powered competitor monitoring, analysis, and strategic recommendations</p>
        </div>
        <button onClick={runScan} disabled={isScanning}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isScanning ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</>
            : <>🔍 Run Intelligence Scan</>}
        </button>
      </div>

      {/* Competitor Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {COMPETITORS.map(c => (
          <div key={c.id} className="glass-card p-4 group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">{c.logo}</div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{c.name}</div>
                <div className="text-[10px] text-text-muted">Updated {c.lastUpdate}</div>
              </div>
            </div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-gradient-to-r ${threatColor[c.threat]} text-white`}>
              {c.threat === "high" ? "⚠️" : c.threat === "medium" ? "🔶" : "🟢"} {c.threat.toUpperCase()} THREAT
            </div>
          </div>
        ))}
      </div>

      {/* Scan Terminal (if active) */}
      {(isScanning || scanSteps.length > 0) && (
        <div className="glass-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" /><div className="w-3 h-3 rounded-full bg-amber-500" /><div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-text-muted ml-1">intel-agent • scanning 847 sources</span>
            {scanComplete && <span className="ml-auto badge badge-active text-[10px]">Scan Complete</span>}
          </div>
          <div ref={stepsRef} className="p-4 space-y-2 max-h-56 overflow-y-auto bg-navy-950/50" style={{ fontFamily: "var(--font-mono)" }}>
            {scanSteps.map((s, i) => <div key={i} className="text-xs text-text-secondary animate-fade-in">{s}</div>)}
            {isScanning && (
              <div className="flex items-center gap-2 text-xs text-text-muted animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "high", "pricing", "product", "funding"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${filter === f ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
            {f === "high" ? "⚠️ High Impact" : f}
          </button>
        ))}
      </div>

      {/* Intel Feed + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(item => (
            <button key={item.id} onClick={() => setSelectedIntel(item)}
              className={`w-full text-left glass-card p-4 transition-all hover:border-electric-500/30 cursor-pointer ${selectedIntel?.id === item.id ? "border-electric-500/40 ring-1 ring-electric-500/10" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${typeIcons[item.type]?.color} text-[10px]`}>{typeIcons[item.type]?.icon} {typeIcons[item.type]?.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${impactColor[item.impact]}`}>{item.impact.toUpperCase()}</span>
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2">{item.title}</h4>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>{item.competitor}</span><span>·</span><span>{item.date}</span><span>·</span><span>{item.source}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selectedIntel ? (
            <>
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${typeIcons[selectedIntel.type]?.color}`}>{typeIcons[selectedIntel.type]?.icon} {typeIcons[selectedIntel.type]?.label}</span>
                    <span className="text-xs text-text-muted">{selectedIntel.competitor}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${impactColor[selectedIntel.impact]}`}>{selectedIntel.impact.toUpperCase()} IMPACT</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">{selectedIntel.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{selectedIntel.summary}</p>
                <div className="text-xs text-text-muted">Source: {selectedIntel.source} · {selectedIntel.date}</div>
              </div>

              {selectedIntel.recommendation && (
                <div className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.03), rgba(59,130,246,0.03))" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
                    <div><div className="text-sm font-semibold text-text-primary">Strategic Recommendation</div>
                      <div className="text-[10px] text-text-muted">Generated by competitive intelligence agent</div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{selectedIntel.recommendation}</p>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Select an intelligence signal</h3>
              <p className="text-sm text-text-secondary">Click a signal to view full analysis and AI recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
