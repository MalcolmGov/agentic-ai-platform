"use client";

import { useState, useRef, useEffect } from "react";

// ─── Integration Data ──────────────────────

type ConnStatus = "connected" | "disconnected" | "testing" | "error";

interface Integration {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  authType: "oauth2" | "api_key" | "connection_string" | "webhook";
  status: ConnStatus;
  connectedAt?: string;
  lastSync?: string;
  usedBy: string[];
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  docsUrl: string;
}

const INTEGRATIONS: Integration[] = [
  // ── Communication ──
  {
    id: "slack", name: "Slack", icon: "💬", category: "Communication",
    description: "Send alerts, receive commands, and post agent reports to Slack channels",
    authType: "oauth2", status: "disconnected", usedBy: ["Helpdesk Agent", "Operations Agent", "Intel Agent"],
    fields: [{ key: "bot_token", label: "Bot Token", placeholder: "xoxb-...", secret: true }],
    docsUrl: "https://api.slack.com/apps",
  },
  {
    id: "teams", name: "Microsoft Teams", icon: "🟦", category: "Communication",
    description: "Post notifications and receive commands via Microsoft Teams channels",
    authType: "oauth2", status: "disconnected", usedBy: ["Helpdesk Agent", "Support Agent"],
    fields: [{ key: "webhook_url", label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/..." }],
    docsUrl: "https://learn.microsoft.com/en-us/microsoftteams/",
  },
  {
    id: "sendgrid", name: "SendGrid", icon: "📧", category: "Communication",
    description: "Send transactional emails, notifications, and agent reports via SendGrid",
    authType: "api_key", status: "connected", connectedAt: "Mar 15, 2026", lastSync: "2 min ago",
    usedBy: ["Support Agent", "HR Agent", "Finance Agent"],
    fields: [{ key: "api_key", label: "API Key", placeholder: "SG.xxxx...", secret: true }],
    docsUrl: "https://docs.sendgrid.com/",
  },
  {
    id: "twilio", name: "Twilio", icon: "📱", category: "Communication",
    description: "Send SMS alerts, voice notifications, and WhatsApp messages",
    authType: "api_key", status: "disconnected", usedBy: ["Support Agent", "Fraud Agent"],
    fields: [
      { key: "account_sid", label: "Account SID", placeholder: "ACxxxx..." },
      { key: "auth_token", label: "Auth Token", placeholder: "xxxx...", secret: true },
    ],
    docsUrl: "https://www.twilio.com/docs",
  },
  // ── CRM & Sales ──
  {
    id: "salesforce", name: "Salesforce", icon: "☁️", category: "CRM & Sales",
    description: "Sync leads, contacts, opportunities, and account data with Salesforce CRM",
    authType: "oauth2", status: "connected", connectedAt: "Mar 10, 2026", lastSync: "5 min ago",
    usedBy: ["Sales Agent", "Support Agent", "Intel Agent"],
    fields: [
      { key: "instance_url", label: "Instance URL", placeholder: "https://yourorg.salesforce.com" },
      { key: "client_id", label: "Client ID", placeholder: "3MVG9..." },
      { key: "client_secret", label: "Client Secret", placeholder: "xxxx...", secret: true },
    ],
    docsUrl: "https://developer.salesforce.com/docs",
  },
  {
    id: "hubspot", name: "HubSpot", icon: "🎯", category: "CRM & Sales",
    description: "Manage contacts, deals, and marketing automation via HubSpot API",
    authType: "api_key", status: "disconnected", usedBy: ["Sales Agent", "Marketing"],
    fields: [{ key: "api_key", label: "Private App Token", placeholder: "pat-xxxx...", secret: true }],
    docsUrl: "https://developers.hubspot.com/docs",
  },
  // ── Databases ──
  {
    id: "postgresql", name: "PostgreSQL", icon: "🐘", category: "Databases",
    description: "Direct read/write access to PostgreSQL databases for agent queries and data storage",
    authType: "connection_string", status: "connected", connectedAt: "Mar 1, 2026", lastSync: "Live",
    usedBy: ["All Agents"],
    fields: [
      { key: "host", label: "Host", placeholder: "db.example.com" },
      { key: "port", label: "Port", placeholder: "5432" },
      { key: "database", label: "Database", placeholder: "app_production" },
      { key: "username", label: "Username", placeholder: "agent_reader" },
      { key: "password", label: "Password", placeholder: "••••••••", secret: true },
    ],
    docsUrl: "https://www.postgresql.org/docs/",
  },
  {
    id: "snowflake", name: "Snowflake", icon: "❄️", category: "Databases",
    description: "Query Snowflake data warehouses for analytics, reporting, and intelligence agents",
    authType: "connection_string", status: "disconnected", usedBy: ["Reporting Agent", "Data Analyst Agent"],
    fields: [
      { key: "account", label: "Account", placeholder: "xy12345.us-east-1" },
      { key: "warehouse", label: "Warehouse", placeholder: "COMPUTE_WH" },
      { key: "database", label: "Database", placeholder: "ANALYTICS" },
      { key: "username", label: "Username", placeholder: "agent_user" },
      { key: "password", label: "Password", placeholder: "••••••••", secret: true },
    ],
    docsUrl: "https://docs.snowflake.com/",
  },
  {
    id: "redis", name: "Redis", icon: "⚡", category: "Databases",
    description: "In-memory caching, rate limiting, job queues, and real-time agent state management",
    authType: "connection_string", status: "connected", connectedAt: "Mar 1, 2026", lastSync: "Live",
    usedBy: ["All Agents (cache, queues)"],
    fields: [{ key: "url", label: "Redis URL", placeholder: "redis://default:xxxx@host:6379" }],
    docsUrl: "https://redis.io/docs/",
  },
  // ── Cloud Infra ──
  {
    id: "aws", name: "Amazon Web Services", icon: "🟧", category: "Cloud & Infrastructure",
    description: "IAM, S3, Lambda, SES, CloudWatch — full AWS integration for compute and storage",
    authType: "api_key", status: "connected", connectedAt: "Mar 5, 2026", lastSync: "10 min ago",
    usedBy: ["Operations Agent", "Document Agent", "Helpdesk Agent"],
    fields: [
      { key: "access_key_id", label: "Access Key ID", placeholder: "AKIAIOSFODNN7EXAMPLE" },
      { key: "secret_access_key", label: "Secret Access Key", placeholder: "wJalrXUtnFEMI/K7MDENG/...", secret: true },
      { key: "region", label: "Region", placeholder: "us-east-1" },
    ],
    docsUrl: "https://docs.aws.amazon.com/",
  },
  {
    id: "gcp", name: "Google Cloud Platform", icon: "🔵", category: "Cloud & Infrastructure",
    description: "BigQuery, Cloud Storage, Vertex AI, and Google Workspace integrations",
    authType: "oauth2", status: "disconnected", usedBy: ["Reporting Agent", "Data Analyst Agent"],
    fields: [{ key: "service_account_json", label: "Service Account Key (JSON)", placeholder: "Paste JSON key..." }],
    docsUrl: "https://cloud.google.com/docs",
  },
  // ── Dev & IT Tools ──
  {
    id: "jira", name: "Jira", icon: "📋", category: "DevOps & IT",
    description: "Create, triage, and manage Jira tickets. Sync sprint data and project status",
    authType: "api_key", status: "disconnected", usedBy: ["Helpdesk Agent", "Operations Agent"],
    fields: [
      { key: "domain", label: "Jira Domain", placeholder: "yourorg.atlassian.net" },
      { key: "email", label: "Email", placeholder: "admin@company.com" },
      { key: "api_token", label: "API Token", placeholder: "xxxx...", secret: true },
    ],
    docsUrl: "https://developer.atlassian.com/cloud/jira/",
  },
  {
    id: "github", name: "GitHub", icon: "🐙", category: "DevOps & IT",
    description: "Monitor repos, manage access, automate PR reviews, and provision team permissions",
    authType: "api_key", status: "disconnected", usedBy: ["Operations Agent", "Helpdesk Agent"],
    fields: [{ key: "token", label: "Personal Access Token", placeholder: "ghp_xxxx...", secret: true }],
    docsUrl: "https://docs.github.com/en/rest",
  },
  {
    id: "pagerduty", name: "PagerDuty", icon: "🚨", category: "DevOps & IT",
    description: "Trigger and resolve incidents, manage on-call schedules, and auto-escalate alerts",
    authType: "api_key", status: "disconnected", usedBy: ["Operations Agent"],
    fields: [{ key: "api_key", label: "API Key", placeholder: "u+xxxx...", secret: true }],
    docsUrl: "https://developer.pagerduty.com/docs/",
  },
  // ── App Stores ──
  {
    id: "google_play", name: "Google Play Console", icon: "▶️", category: "App Stores",
    description: "Fetch reviews, reply to users, and monitor ratings from Google Play Developer Console",
    authType: "oauth2", status: "disconnected", usedBy: ["Review Agent"],
    fields: [{ key: "service_account_json", label: "Service Account Key (JSON)", placeholder: "Paste JSON key..." }],
    docsUrl: "https://developers.google.com/android-publisher",
  },
  {
    id: "app_store", name: "App Store Connect", icon: "🍎", category: "App Stores",
    description: "Fetch reviews, reply to users, and monitor ratings from Apple App Store Connect",
    authType: "api_key", status: "disconnected", usedBy: ["Review Agent"],
    fields: [
      { key: "issuer_id", label: "Issuer ID", placeholder: "xxxx-xxxx-xxxx" },
      { key: "key_id", label: "Key ID", placeholder: "XXXXXXXXXX" },
      { key: "private_key", label: "Private Key (.p8)", placeholder: "-----BEGIN PRIVATE KEY-----...", secret: true },
    ],
    docsUrl: "https://developer.apple.com/documentation/appstoreconnectapi",
  },
  // ── Identity & HR ──
  {
    id: "okta", name: "Okta", icon: "🔐", category: "Identity & HR",
    description: "SSO/SAML authentication, user provisioning, and directory sync via Okta",
    authType: "oauth2", status: "disconnected", usedBy: ["Helpdesk Agent", "HR Agent"],
    fields: [
      { key: "domain", label: "Okta Domain", placeholder: "yourorg.okta.com" },
      { key: "client_id", label: "Client ID", placeholder: "0oaxxxx..." },
      { key: "client_secret", label: "Client Secret", placeholder: "xxxx...", secret: true },
    ],
    docsUrl: "https://developer.okta.com/docs/",
  },
  {
    id: "ad", name: "Active Directory", icon: "🏢", category: "Identity & HR",
    description: "LDAP/Microsoft Graph — manage users, groups, and permissions for IT automation",
    authType: "connection_string", status: "disconnected", usedBy: ["Helpdesk Agent", "HR Agent"],
    fields: [
      { key: "domain", label: "Domain", placeholder: "corp.company.com" },
      { key: "bind_dn", label: "Bind DN", placeholder: "CN=agent,OU=Service Accounts,DC=corp" },
      { key: "bind_password", label: "Bind Password", placeholder: "••••••••", secret: true },
    ],
    docsUrl: "https://learn.microsoft.com/en-us/graph/",
  },
  // ── Webhooks / Automation ──
  {
    id: "zapier", name: "Zapier", icon: "🔄", category: "Automation",
    description: "Trigger and receive Zapier automations, connect to 5,000+ apps",
    authType: "webhook", status: "disconnected", usedBy: ["Any Agent"],
    fields: [{ key: "webhook_url", label: "Zap Webhook URL", placeholder: "https://hooks.zapier.com/hooks/catch/..." }],
    docsUrl: "https://zapier.com/developer",
  },
  {
    id: "webhooks", name: "Custom Webhooks", icon: "🪝", category: "Automation",
    description: "Receive events from any system via HTTP webhooks with signature verification",
    authType: "webhook", status: "connected", connectedAt: "Mar 12, 2026", lastSync: "1 min ago",
    usedBy: ["All Agents"],
    fields: [{ key: "signing_secret", label: "Signing Secret", placeholder: "whsec_xxxx...", secret: true }],
    docsUrl: "/docs/webhooks",
  },
];

const CATEGORIES = [...new Set(INTEGRATIONS.map(i => i.category))];

const AUTH_LABELS: Record<string, string> = {
  oauth2: "OAuth 2.0", api_key: "API Key", connection_string: "Connection String", webhook: "Webhook",
};

// ─── Component ─────────────────────────────

export default function IntegrationsPage() {
  const [filter, setFilter] = useState("all");
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testSteps, setTestSteps] = useState<string[]>([]);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [testSteps]);

  const filtered = filter === "all" ? integrations : integrations.filter(i => i.category === filter);

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === "connected").length,
    categories: CATEGORIES.length,
    agents: 13,
  };

  function openConfig(integration: Integration) {
    setConfiguring(integration);
    setFieldValues({});
    setTestResult(null);
    setTestSteps([]);
    setShowSecrets({});
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    setTestSteps([]);

    const name = configuring?.name || "Service";
    const steps = [
      `🔐 Encrypting credentials with AES-256-GCM...`,
      `🌐 Resolving ${name} endpoint...`,
      `📡 Establishing TLS 1.3 connection...`,
      `🔑 Authenticating with ${AUTH_LABELS[configuring?.authType || "api_key"]}...`,
      `✅ Authentication successful — access granted`,
      `📊 Verifying permissions and scopes...`,
      `✅ Connection test passed — all permissions verified`,
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 500));
      setTestSteps(prev => [...prev, step]);
    }

    setTesting(false);
    setTestResult("success");
  }

  function connectIntegration() {
    if (!configuring) return;
    setIntegrations(prev => prev.map(i =>
      i.id === configuring.id ? { ...i, status: "connected" as ConnStatus, connectedAt: "Just now", lastSync: "Just now" } : i
    ));
    setConfiguring(null);
  }

  function disconnectIntegration(id: string) {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: "disconnected" as ConnStatus, connectedAt: undefined, lastSync: undefined } : i
    ));
  }

  const statusStyle: Record<string, { cls: string; dot: string; label: string }> = {
    connected: { cls: "badge-active", dot: "bg-emerald-400", label: "Connected" },
    disconnected: { cls: "badge-neutral", dot: "bg-slate-500", label: "Not Connected" },
    testing: { cls: "badge-info", dot: "bg-electric-400 animate-pulse", label: "Testing..." },
    error: { cls: "badge-error", dot: "bg-rose-400", label: "Error" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Integration Builder</h1>
          <p className="text-text-secondary mt-1">Connect your company systems — agents use these to read data, take actions, and send notifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available", value: stats.total, icon: "🔌", color: "from-electric-500 to-cyan-500" },
          { label: "Connected", value: stats.connected, icon: "✅", color: "from-emerald-500 to-teal-500" },
          { label: "Categories", value: stats.categories, icon: "📁", color: "from-violet-500 to-fuchsia-500" },
          { label: "Agents Using", value: stats.agents, icon: "🤖", color: "from-amber-500 to-orange-500" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>{s.icon}</div>
              <div><div className="text-2xl font-bold text-text-primary">{s.value}</div><div className="text-xs text-text-muted">{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === "all" ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
          All ({integrations.length})
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === cat ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
            {cat} ({integrations.filter(i => i.category === cat).length})
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((integ, i) => (
          <div key={integ.id} className="group glass-card p-5 transition-all hover:border-electric-500/30 hover:-translate-y-0.5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  {integ.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">{integ.name}</h3>
                  <span className={`inline-flex items-center gap-1 badge ${statusStyle[integ.status].cls} text-[9px]`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle[integ.status].dot}`} />
                    {statusStyle[integ.status].label}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-text-muted bg-navy-800 px-1.5 py-0.5 rounded font-mono">{AUTH_LABELS[integ.authType]}</span>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mb-3">{integ.description}</p>

            {/* Used by agents */}
            <div className="flex flex-wrap gap-1 mb-3">
              {integ.usedBy.slice(0, 3).map(a => (
                <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-electric-500/10 text-electric-400 font-medium">{a}</span>
              ))}
              {integ.usedBy.length > 3 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-navy-800 text-text-muted">+{integ.usedBy.length - 3} more</span>
              )}
            </div>

            {/* Connection info or connect button */}
            {integ.status === "connected" ? (
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-text-muted">
                  Connected {integ.connectedAt} · Last sync: {integ.lastSync}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openConfig(integ)} className="text-[10px] text-electric-400 hover:text-electric-300 font-medium transition-colors">Configure</button>
                  <button onClick={() => disconnectIntegration(integ.id)} className="text-[10px] text-rose-400 hover:text-rose-300 font-medium transition-colors">Disconnect</button>
                </div>
              </div>
            ) : (
              <button onClick={() => openConfig(integ)}
                className="w-full py-2 text-xs font-semibold text-electric-400 border border-electric-500/20 rounded-lg hover:bg-electric-500/10 transition-colors">
                Connect {integ.name} →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ═══ Configuration Modal ═══ */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfiguring(null)}>
          <div className="w-full max-w-lg mx-4 glass-card p-0 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-2xl">
                    {configuring.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Connect {configuring.name}</h2>
                    <span className="text-xs text-text-muted">{AUTH_LABELS[configuring.authType]} · {configuring.category}</span>
                  </div>
                </div>
                <button onClick={() => setConfiguring(null)} className="text-text-muted hover:text-text-primary transition-colors text-xl">✕</button>
              </div>
              <p className="text-sm text-text-secondary mt-3">{configuring.description}</p>
            </div>

            {/* OAuth Button (for OAuth integrations) */}
            {configuring.authType === "oauth2" && (
              <div className="px-6 pt-5">
                <button onClick={testConnection} disabled={testing}
                  className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {testing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
                    : <>🔗 Connect with {configuring.name} (OAuth 2.0)</>}
                </button>
                <p className="text-[10px] text-text-muted text-center mt-2">You'll be redirected to {configuring.name} to authorize access</p>
              </div>
            )}

            {/* Credential Fields */}
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">
                {configuring.authType === "oauth2" ? "Or configure manually" : "Credentials"}
              </h3>
              {configuring.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={fieldValues[field.key] || ""}
                      onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-navy-900 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric-500/50 focus:ring-1 focus:ring-electric-500/20 font-mono"
                    />
                    {field.secret && (
                      <button onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary text-xs">
                        {showSecrets[field.key] ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Encryption notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-sm">🔒</span>
                <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                  All credentials are encrypted with AES-256-GCM before storage. Keys are never logged or exposed in API responses. Tenant-isolated with row-level security.
                </p>
              </div>

              {/* Used by */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Used by these agents</label>
                <div className="flex flex-wrap gap-1.5">
                  {configuring.usedBy.map(a => (
                    <span key={a} className="text-[10px] px-2 py-1 rounded-lg bg-electric-500/10 text-electric-400 font-medium border border-electric-500/10">{a}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Connection Terminal */}
            {testSteps.length > 0 && (
              <div className="mx-6 mb-4 rounded-lg overflow-hidden border border-border">
                <div className="p-2 border-b border-border flex items-center gap-2 bg-navy-950">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono text-text-muted ml-1">connection test</span>
                </div>
                <div ref={termRef} className="p-3 space-y-1.5 max-h-40 overflow-y-auto bg-navy-950/80" style={{ fontFamily: "var(--font-mono)" }}>
                  {testSteps.map((s, i) => <div key={i} className="text-xs text-text-secondary animate-fade-in">{s}</div>)}
                  {testing && (
                    <div className="flex items-center gap-2 text-xs text-text-muted animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 border-t border-border flex items-center justify-between">
              <button onClick={testConnection} disabled={testing}
                className="text-sm text-electric-400 hover:text-electric-300 font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {testing ? <><span className="w-3 h-3 border-2 border-electric-400/30 border-t-electric-400 rounded-full animate-spin" /> Testing...</>
                  : <>🧪 Test Connection</>}
              </button>
              <div className="flex gap-3">
                <button onClick={() => setConfiguring(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors">Cancel</button>
                <button onClick={connectIntegration} disabled={testing}
                  className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50">
                  {testResult === "success" ? "✅ Save & Connect" : "Save & Connect"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
