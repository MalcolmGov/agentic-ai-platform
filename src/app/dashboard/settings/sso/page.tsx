"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// SSO / SAML Settings — Enterprise Authentication
// ═══════════════════════════════════════════════

interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  type: "saml" | "oidc" | "oauth2";
  status: "active" | "inactive" | "pending";
  domain: string;
  lastSync?: string;
  users?: number;
}

const SSO_PROVIDERS: SSOProvider[] = [
  { id: "okta", name: "Okta", icon: "🔐", type: "saml", status: "active", domain: "acme.okta.com", lastSync: "2 min ago", users: 247 },
  { id: "azure", name: "Azure AD", icon: "☁️", type: "oidc", status: "inactive", domain: "", users: 0 },
  { id: "google", name: "Google Workspace", icon: "🔵", type: "oauth2", status: "inactive", domain: "", users: 0 },
  { id: "onelogin", name: "OneLogin", icon: "🟢", type: "saml", status: "inactive", domain: "", users: 0 },
];

export default function SSOSettingsPage() {
  const [providers, setProviders] = useState(SSO_PROVIDERS);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [samlConfig, setSamlConfig] = useState({ entityId: "https://app.agentic-ai.com/api/auth/sso/saml", acsUrl: "https://app.agentic-ai.com/api/auth/sso/callback", metadataUrl: "", certificate: "" });

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p));
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔐</span>
            <h1 className="text-2xl font-bold text-text-primary">SSO / SAML</h1>
            <span className="badge badge-active text-[10px]">Enterprise</span>
          </div>
          <p className="text-sm text-text-secondary">Configure single sign-on for your organization.</p>
        </div>
      </div>

      {/* SAML Service Provider Info */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-bold text-text-primary mb-3">Service Provider Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Entity ID / Issuer</label>
            <div className="input-field !bg-navy-900 text-sm font-mono">{samlConfig.entityId}</div>
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">ACS URL (Reply URL)</label>
            <div className="input-field !bg-navy-900 text-sm font-mono">{samlConfig.acsUrl}</div>
          </div>
        </div>
      </div>

      {/* Identity Providers */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Identity Providers</h3>
      <div className="space-y-3 mb-8">
        {providers.map(provider => (
          <div key={provider.id} className={`glass-card p-4 transition-all ${provider.status === "active" ? "!border-emerald-500/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{provider.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-navy-700 text-text-muted">{provider.type}</span>
                  </div>
                  {provider.status === "active" ? (
                    <div className="text-[11px] text-emerald-400">Connected — {provider.domain} · {provider.users} users · Synced {provider.lastSync}</div>
                  ) : (
                    <div className="text-[11px] text-text-muted">Not configured</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {provider.status === "active" && (
                  <button onClick={() => setConfiguring(configuring === provider.id ? null : provider.id)} className="btn-secondary text-[11px] !py-1">⚙️ Configure</button>
                )}
                <button
                  onClick={() => provider.status === "inactive" ? setConfiguring(provider.id) : toggleProvider(provider.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    provider.status === "active"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-electric-500/15 text-electric-400 border border-electric-500/20 hover:bg-electric-500/25"
                  }`}
                >
                  {provider.status === "active" ? "✓ Connected" : "Connect →"}
                </button>
              </div>
            </div>

            {configuring === provider.id && (
              <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">IdP Metadata URL</label>
                    <input className="input-field text-sm" placeholder="https://your-idp.com/metadata.xml" value={samlConfig.metadataUrl} onChange={e => setSamlConfig(p => ({...p, metadataUrl: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Domain</label>
                    <input className="input-field text-sm" placeholder="acme.com" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">X.509 Certificate</label>
                    <textarea className="input-field text-sm font-mono !h-20 resize-none" placeholder="-----BEGIN CERTIFICATE-----" value={samlConfig.certificate} onChange={e => setSamlConfig(p => ({...p, certificate: e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary text-[11px] !py-1.5" onClick={() => { toggleProvider(provider.id); setConfiguring(null); }}>Save & Connect</button>
                  <button className="btn-secondary text-[11px] !py-1.5" onClick={() => setConfiguring(null)}>Cancel</button>
                  <button className="text-[11px] text-text-muted hover:text-text-primary ml-auto">Test Connection</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Policies */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Security Policies</h3>
      <div className="glass-card p-4 space-y-3">
        {[
          { label: "Enforce SSO for all users", desc: "Disable password login when SSO is active", enabled: true },
          { label: "Auto-provision users on first login", desc: "Create user accounts from IdP attributes", enabled: true },
          { label: "Require MFA as fallback", desc: "Enforce MFA when SSO is unavailable", enabled: false },
          { label: "Session timeout after inactivity", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
        ].map((policy, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <div className="text-sm text-text-primary">{policy.label}</div>
              <div className="text-[11px] text-text-muted">{policy.desc}</div>
            </div>
            <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${policy.enabled ? "bg-emerald-500" : "bg-navy-600"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${policy.enabled ? "ml-5.5 translate-x-1" : "ml-0.5"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
