"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// Agent Marketplace — Publish & Discover Agents
// ═══════════════════════════════════════════════

interface MarketplaceAgent {
  id: string;
  name: string;
  author: string;
  icon: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  installs: number;
  price: "free" | number;
  tags: string[];
  featured?: boolean;
  verified?: boolean;
}

const CATEGORIES = ["All", "Fraud & Risk", "Compliance", "Customer Support", "Data Analysis", "Automation", "Reporting"];

const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  {
    id: "mp1", name: "FraudShield Pro", author: "Acme Security", icon: "🛡️",
    category: "Fraud & Risk", description: "Enterprise-grade fraud detection with real-time transaction monitoring, ML-based risk scoring, and automated blocking. Supports 50+ payment processors.",
    rating: 4.9, reviews: 247, installs: 12400, price: 299, tags: ["fraud", "payments", "real-time"], featured: true, verified: true,
  },
  {
    id: "mp2", name: "KYC AutoVerify", author: "CompliTech", icon: "📋",
    category: "Compliance", description: "Automated KYC/AML verification agent with multi-jurisdiction support. PEP screening, sanctions checks, and document verification in 180+ countries.",
    rating: 4.8, reviews: 189, installs: 8900, price: 199, tags: ["kyc", "compliance", "aml"], featured: true, verified: true,
  },
  {
    id: "mp3", name: "SupportGenius", author: "HelpStack", icon: "🎧",
    category: "Customer Support", description: "AI-powered customer support agent with ticket routing, sentiment analysis, and auto-resolution. Integrates with Zendesk, Intercom, and Freshdesk.",
    rating: 4.7, reviews: 312, installs: 15200, price: 149, tags: ["support", "tickets", "sentiment"], verified: true,
  },
  {
    id: "mp4", name: "DataPipeline AI", author: "FlowData Inc", icon: "🔬",
    category: "Data Analysis", description: "Automated data pipeline agent — ETL, anomaly detection, and trend analysis. Connect to any database, API, or file system.",
    rating: 4.6, reviews: 98, installs: 4300, price: 249, tags: ["etl", "analytics", "database"],
  },
  {
    id: "mp5", name: "EmailCraft Pro", author: "MailGenius", icon: "✉️",
    category: "Automation", description: "Smart email automation agent with personalization, A/B testing, and deliverability optimization. Supports 20+ ESP integrations.",
    rating: 4.5, reviews: 156, installs: 7800, price: "free", tags: ["email", "automation", "personalization"], verified: true,
  },
  {
    id: "mp6", name: "DocAnalyzer", author: "PaperAI", icon: "📄",
    category: "Data Analysis", description: "Extract, analyze, and summarize documents at scale. Supports PDF, Word, Excel, images (OCR), and handwritten notes.",
    rating: 4.8, reviews: 201, installs: 9100, price: 179, tags: ["documents", "ocr", "extraction"], featured: true,
  },
  {
    id: "mp7", name: "SlackOps Bot", author: "ChatOps Co", icon: "💬",
    category: "Automation", description: "DevOps and ChatOps automation for Slack. Deploy, monitor, and manage infrastructure through natural language.",
    rating: 4.4, reviews: 87, installs: 3200, price: "free", tags: ["slack", "devops", "chatops"],
  },
  {
    id: "mp8", name: "RevenuePredict", author: "ForcastAI", icon: "📈",
    category: "Reporting", description: "Revenue forecasting agent with ML models. Predicts MRR, churn, and expansion with 94% accuracy based on historical data.",
    rating: 4.7, reviews: 134, installs: 5600, price: 349, tags: ["revenue", "forecast", "ml"], verified: true,
  },
  {
    id: "mp9", name: "AuditTrail Pro", author: "GovTech", icon: "🔒",
    category: "Compliance", description: "Automated audit trail generation with SOC 2, ISO 27001, and GDPR compliance. Tamper-proof logging and evidence collection.",
    rating: 4.9, reviews: 167, installs: 6700, price: 229, tags: ["audit", "soc2", "gdpr"], verified: true,
  },
  {
    id: "mp10", name: "LeadScorer", author: "SalesAI", icon: "🎯",
    category: "Data Analysis", description: "AI lead scoring agent that analyzes prospect behavior, engagement, and firmographic data. Integrates with Salesforce and HubSpot.",
    rating: 4.3, reviews: 76, installs: 2900, price: 99, tags: ["sales", "leads", "scoring"],
  },
  {
    id: "mp11", name: "ContractReview", author: "LegalBot", icon: "⚖️",
    category: "Compliance", description: "AI-powered contract review agent. Identifies risks, missing clauses, and non-standard terms in seconds instead of hours.",
    rating: 4.6, reviews: 112, installs: 4100, price: 399, tags: ["legal", "contracts", "review"],
  },
  {
    id: "mp12", name: "ScheduleOptimizer", author: "TimeStack", icon: "⏰",
    category: "Automation", description: "Intelligent scheduling agent that optimizes meeting times, resource allocation, and capacity planning across teams.",
    rating: 4.2, reviews: 54, installs: 1800, price: "free", tags: ["scheduling", "calendar", "optimization"],
  },
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());

  const filtered = MARKETPLACE_AGENTS.filter((a) => {
    const matchesCategory = activeCategory === "All" || a.category === activeCategory;
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.tags.some((t) => t.includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featured = MARKETPLACE_AGENTS.filter((a) => a.featured);

  const handleInstall = async (id: string) => {
    setInstallingId(id);
    await new Promise((r) => setTimeout(r, 1500));
    setInstalledIds((prev) => new Set(prev).add(id));
    setInstallingId(null);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🏪</span>
            <h1 className="text-2xl font-bold text-text-primary">Agent Marketplace</h1>
            <span className="badge badge-active text-[10px]">{MARKETPLACE_AGENTS.length} agents</span>
          </div>
          <p className="text-sm text-text-secondary">Discover, install, and deploy pre-built agent templates. 70/30 revenue share for publishers.</p>
        </div>
        <button className="btn-primary text-sm">📦 Publish Your Agent</button>
      </div>

      {/* Search + Categories */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents, tools, integrations..."
          className="input-field max-w-sm"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-electric-500/20 text-electric-400 border border-electric-500/30"
                  : "text-text-muted border border-border hover:text-text-primary hover:border-border-active"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banner */}
      {activeCategory === "All" && !searchQuery && (
        <div className="mb-6">
          <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">⭐ Featured</div>
          <div className="grid grid-cols-3 gap-4">
            {featured.map((agent) => (
              <div key={agent.id} className="glass-card p-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 rounded-bl-lg">FEATURED</div>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-text-primary">{agent.name}</h3>
                      {agent.verified && <span className="text-electric-400 text-[10px]">✓</span>}
                    </div>
                    <div className="text-[11px] text-text-muted">by {agent.author}</div>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed mb-3 line-clamp-2">{agent.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs">★ {agent.rating}</span>
                    <span className="text-[10px] text-text-muted">({agent.reviews})</span>
                    <span className="text-[10px] text-text-muted">· {(agent.installs / 1000).toFixed(1)}k installs</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {agent.price === "free" ? "Free" : `$${agent.price}/mo`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
        {activeCategory === "All" ? "All Agents" : activeCategory} ({filtered.length})
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const isInstalled = installedIds.has(agent.id);
          const isInstalling = installingId === agent.id;

          return (
            <div key={agent.id} className="glass-card p-4 flex flex-col hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-text-primary truncate">{agent.name}</h3>
                    {agent.verified && <span className="text-electric-400 text-[10px]" title="Verified">✓</span>}
                  </div>
                  <div className="text-[10px] text-text-muted">by {agent.author}</div>
                </div>
                <span className="text-xs font-bold text-emerald-400 shrink-0">
                  {agent.price === "free" ? "Free" : `$${agent.price}/mo`}
                </span>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed mb-3 flex-1 line-clamp-2">{agent.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {agent.tags.map((tag) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-navy-700 text-text-muted">{tag}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-xs">★ {agent.rating}</span>
                  <span className="text-[10px] text-text-muted">({agent.reviews})</span>
                  <span className="text-[10px] text-text-muted">· {(agent.installs / 1000).toFixed(1)}k</span>
                </div>
                <button
                  onClick={() => !isInstalled && handleInstall(agent.id)}
                  disabled={isInstalling}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    isInstalled
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-electric-500/15 text-electric-400 border border-electric-500/20 hover:bg-electric-500/25"
                  }`}
                >
                  {isInstalled ? "✓ Installed" : isInstalling ? "Installing..." : "Install →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Publisher CTA */}
      <div className="glass-card p-6 mt-8 text-center">
        <h3 className="text-lg font-bold text-text-primary mb-2">Build & Publish Your Own Agents</h3>
        <p className="text-sm text-text-secondary mb-4 max-w-lg mx-auto">
          Create agent templates in Agent Studio and publish them to the marketplace. Earn 70% of every subscription sale.
        </p>
        <div className="flex justify-center gap-3">
          <button className="btn-primary text-sm">Start Publishing →</button>
          <button className="btn-secondary text-sm">Read Publisher Guide</button>
        </div>
      </div>
    </div>
  );
}
