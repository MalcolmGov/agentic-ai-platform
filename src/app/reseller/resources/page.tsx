"use client";

import { useState } from "react";

interface Resource {
  title: string;
  description: string;
  type: "pdf" | "pptx" | "xlsx" | "zip" | "video" | "link";
  action: "download" | "open" | "watch";
  href?: string;
}

const SALES_RESOURCES: Resource[] = [
  { title: "Partner Sales Deck", description: "Full slide deck for enterprise sales conversations", type: "pptx", action: "download" },
  { title: "ROI Calculator Template", description: "Customisable Excel model to demonstrate client value", type: "xlsx", action: "download" },
  { title: "Competitive Battle Cards", description: "Head-to-head comparisons vs ServiceNow, Microsoft Copilot, etc.", type: "pdf", action: "download" },
  { title: "Case Study: FNB 12-Week Deployment", description: "How FNB deployed 23 agents across 5 departments in 12 weeks", type: "pdf", action: "download" },
  { title: "Pricing & Packaging Guide", description: "How to price and position AI Platform for different client profiles", type: "pdf", action: "download" },
];

const TECHNICAL_RESOURCES: Resource[] = [
  { title: "Integration Guide", description: "Connect AI Platform to SAP, Salesforce, Microsoft 365, and more", type: "pdf", action: "download" },
  { title: "API Documentation", description: "Full REST API reference for custom integrations", type: "link", action: "open", href: "/dashboard/docs" },
  { title: "Mobile SDK Guide", description: "Embed AI agents in iOS and Android apps", type: "link", action: "open", href: "/dashboard/docs/mobile-sdk" },
  { title: "WhatsApp Setup Guide", description: "Connect WhatsApp Business API to agents", type: "link", action: "open", href: "/dashboard/settings/whatsapp" },
  { title: "Security & Compliance Pack", description: "POPIA, NDPR, ISO 27001 compliance documentation", type: "pdf", action: "download" },
];

const MARKETING_RESOURCES: Resource[] = [
  { title: "Partner Logo Pack", description: "Official AI Platform partner badges and co-brand assets", type: "zip", action: "download" },
  { title: "Co-branded Email Templates", description: "Email sequences for prospect outreach and nurture", type: "zip", action: "download" },
  { title: "Social Media Kit", description: "LinkedIn, Twitter/X, and WhatsApp ready social assets", type: "zip", action: "download" },
  { title: "One-Page Product Summary", description: "Leave-behind PDF for in-person meetings", type: "pdf", action: "download" },
];

const TRAINING_RESOURCES: Resource[] = [
  { title: "Partner Certification Course", description: "3-hour online course to become a certified AI Platform partner", type: "link", action: "open" },
  { title: "Product Demo Script", description: "Step-by-step guide to running an impactful live demo", type: "pdf", action: "download" },
  { title: "Webinar: Selling AI to Enterprise Africa", description: "60-min recorded session on African enterprise AI buying patterns", type: "video", action: "watch" },
  { title: "Objection Handling Guide", description: "Responses to the 20 most common enterprise objections", type: "pdf", action: "download" },
];

const TYPE_ICONS: Record<Resource["type"], string> = {
  pdf: "📄",
  pptx: "📊",
  xlsx: "📈",
  zip: "📦",
  video: "🎬",
  link: "🔗",
};

const TYPE_COLORS: Record<Resource["type"], string> = {
  pdf: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  pptx: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  xlsx: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  zip: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  video: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  link: "bg-electric-500/15 text-electric-400 border-electric-500/25",
};

function ResourceCard({ resource }: { resource: Resource }) {
  const [clicked, setClicked] = useState(false);

  function handleAction() {
    if (resource.href) {
      window.location.href = resource.href;
      return;
    }
    setClicked(true);
    setTimeout(() => setClicked(false), 2000);
  }

  const actionLabel = resource.action === "download" ? "Download"
    : resource.action === "watch" ? "Watch"
    : "Open";

  return (
    <div className="rounded-xl border border-border bg-navy-900/60 p-5 flex items-start gap-4 hover:bg-navy-900/80 transition-colors">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg flex-shrink-0 ${TYPE_COLORS[resource.type]}`}>
        {TYPE_ICONS[resource.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">{resource.title}</p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{resource.description}</p>
          </div>
          <button
            onClick={handleAction}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:border-electric-500/50 hover:text-electric-400 transition-colors whitespace-nowrap"
          >
            {clicked ? "✓ Done" : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResourceSection({ title, resources }: { title: string; resources: Resource[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{title}</h2>
      <div className="space-y-2">
        {resources.map((r) => (
          <ResourceCard key={r.title} resource={r} />
        ))}
      </div>
    </div>
  );
}

export default function ResellerResourcesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Partner Resources</h1>
          <p className="text-sm text-text-muted mt-1">
            Sales enablement, technical docs, and training materials for certified partners.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-yellow-500/25 bg-yellow-500/10">
          <span className="text-yellow-400 text-sm">⭐⭐⭐</span>
          <span className="text-xs font-medium text-yellow-400">GOLD Partner</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Resources Available", value: "22", sub: "Sales, Technical, Marketing" },
          { label: "Your Certification", value: "Active", sub: "Certified Partner — 2026" },
          { label: "Next Training", value: "May 8", sub: "Product roadmap webinar" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-navy-900/60 p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="text-xl font-bold text-text-primary mt-1">{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <ResourceSection title="Sales Resources" resources={SALES_RESOURCES} />
      <ResourceSection title="Technical Resources" resources={TECHNICAL_RESOURCES} />
      <ResourceSection title="Marketing Resources" resources={MARKETING_RESOURCES} />
      <ResourceSection title="Training & Enablement" resources={TRAINING_RESOURCES} />

      {/* Support CTA */}
      <div className="rounded-xl border border-electric-500/20 bg-electric-500/5 p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">Need something not listed here?</p>
          <p className="text-xs text-text-muted mt-1">Contact your dedicated partner success manager for custom materials.</p>
        </div>
        <a
          href="mailto:partners@{{YOUR_DOMAIN}}"
          className="px-4 py-2 rounded-lg bg-electric-500/20 border border-electric-500/30 text-electric-400 text-sm font-medium hover:bg-electric-500/30 transition-colors"
        >
          Contact Partner Success →
        </a>
      </div>
    </div>
  );
}
