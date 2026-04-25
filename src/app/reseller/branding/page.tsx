"use client";

import { useState } from "react";

interface ClientBranding {
  name: string;
  domain: string | null;
  logoSet: boolean;
  colorsSet: boolean;
  status: "active" | "pending" | "unconfigured";
}

const MOCK_CLIENT_BRANDING: ClientBranding[] = [
  { name: "Acme Corp", domain: "acme.swifterai.io", logoSet: true, colorsSet: true, status: "active" },
  { name: "TechStart SA", domain: null, logoSet: false, colorsSet: false, status: "unconfigured" },
  { name: "MegaRetail Ltd", domain: "megaretail.swifterai.io", logoSet: true, colorsSet: false, status: "pending" },
  { name: "FinServ Group", domain: "finserv.swifterai.io", logoSet: true, colorsSet: true, status: "active" },
  { name: "LogiCo Africa", domain: null, logoSet: false, colorsSet: false, status: "unconfigured" },
  { name: "HealthCare ZA", domain: null, logoSet: false, colorsSet: false, status: "unconfigured" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
  unconfigured: "bg-slate-500/15 text-slate-500 border border-slate-500/25",
};

export default function ResellerBrandingPage() {
  const [partnerLogo, setPartnerLogo] = useState("");
  const [partnerName, setPartnerName] = useState("Demo Partner Agency");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Partner Branding</h1>
        <p className="text-sm text-text-muted mt-1">
          Configure your default brand template applied to all client deployments.
        </p>
      </div>

      {/* Partner Brand Config */}
      <div className="rounded-xl border border-border bg-navy-900/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Your Partner Brand</h2>
          <p className="text-xs text-text-muted mt-0.5">
            These settings are used as defaults when you provision new clients.
          </p>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Partner Company Name</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full bg-navy-950 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-electric-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Partner Logo URL</label>
              <input
                type="url"
                value={partnerLogo}
                onChange={(e) => setPartnerLogo(e.target.value)}
                placeholder="https://yourcompany.com/logo.png"
                className="w-full bg-navy-950 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric-500"
              />
              {partnerLogo && (
                <div className="mt-2 p-3 border border-border rounded-lg bg-navy-950 flex items-center justify-center h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={partnerLogo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 rounded border border-border bg-navy-950 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-navy-950 border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-12 rounded border border-border bg-navy-950 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-navy-950 border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-text-muted">
              These colors are applied as defaults for all new clients you provision. Clients can override individually.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-5 py-2.5 text-sm rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Brand Settings"}
            </button>
          </div>

          {/* Live Preview */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-text-secondary">Preview</p>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: "#0a0a1a" }}
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2"
                style={{ backgroundColor: primaryColor + "22" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryColor }}>
                  {partnerName.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-white">{partnerName || "Your Company"}</span>
                <span className="ml-auto text-[10px] text-white/40 uppercase tracking-widest">Platform</span>
              </div>
              <div className="p-6 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: primaryColor }}>
                  {partnerName.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Welcome to {partnerName || "Your Platform"}</div>
                  <div className="text-white/40 text-xs mt-0.5">AI Agent Platform</div>
                </div>
                <button className="px-4 py-1.5 rounded-lg text-white text-xs font-medium mt-1"
                  style={{ backgroundColor: primaryColor }}>
                  Sign In
                </button>
                <p className="text-white/30 text-[10px]">Powered by Swifter AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Branding Overrides */}
      <div className="rounded-xl border border-border bg-navy-900/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Client Branding Overrides</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Track which clients have custom branding configured.
            </p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Client</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Custom Domain</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Logo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Colors</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_CLIENT_BRANDING.map((client) => (
              <tr key={client.name} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-text-primary">{client.name}</td>
                <td className="px-6 py-4 text-sm text-text-muted font-mono">
                  {client.domain ?? <span className="text-text-muted/50 italic">Not set</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${client.logoSet ? "text-emerald-400" : "text-slate-500"}`}>
                    {client.logoSet ? "✓" : "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${client.colorsSet ? "text-emerald-400" : "text-slate-500"}`}>
                    {client.colorsSet ? "✓" : "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[client.status]}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-electric-400 hover:text-electric-300 transition-colors">
                    Configure →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom Domain Setup */}
      <div className="rounded-xl border border-border bg-navy-900/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Partner Subdomain Setup</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Host your partner portal on a branded subdomain.
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-emerald-400">Domain Active</p>
              <p className="text-xs text-text-muted mt-0.5 font-mono">demo-partner.swifterai.io</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-text-secondary">DNS Records Required</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border bg-navy-950">
                    <th className="text-left px-4 py-2 text-text-muted">Type</th>
                    <th className="text-left px-4 py-2 text-text-muted">Name</th>
                    <th className="text-left px-4 py-2 text-text-muted">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-electric-400">CNAME</td>
                    <td className="px-4 py-3 text-text-primary">app</td>
                    <td className="px-4 py-3 text-text-muted">platform.swifterai.io</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-electric-400">TXT</td>
                    <td className="px-4 py-3 text-text-primary">_agentic-verify</td>
                    <td className="px-4 py-3 text-text-muted">verify=demo-partner</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
