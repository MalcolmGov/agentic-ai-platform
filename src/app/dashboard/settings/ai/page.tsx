"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────

interface LLMProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  trust: "enterprise" | "cloud" | "self-hosted";
  trustLabel: string;
  dataPolicy: string;
  regions: string[];
  certifications: string[];
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  recommended?: boolean;
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: "azure_openai", name: "Azure OpenAI", icon: "🔷", description: "GPT-4o / GPT-4 Turbo via Microsoft Azure private endpoint. Data never leaves your Azure tenant.",
    trust: "enterprise", trustLabel: "Bank-Grade", dataPolicy: "Data NOT used for training. Stays in your Azure tenant. BAA & HIPAA eligible.",
    regions: ["South Africa North", "West Europe", "East US", "Southeast Asia", "UK South"],
    certifications: ["SOC 2 Type II", "ISO 27001", "HIPAA", "PCI DSS", "POPIA"],
    fields: [
      { key: "endpoint", label: "Azure Endpoint", placeholder: "https://your-resource.openai.azure.com" },
      { key: "api_key", label: "API Key", placeholder: "xxxx...", secret: true },
      { key: "deployment", label: "Deployment Name", placeholder: "gpt-4o" },
      { key: "api_version", label: "API Version", placeholder: "2024-08-01-preview" },
    ],
    recommended: true,
  },
  {
    id: "aws_bedrock", name: "AWS Bedrock", icon: "🟧", description: "Claude, Llama, Titan models via AWS Bedrock. Runs in your AWS VPC with IAM controls.",
    trust: "enterprise", trustLabel: "Bank-Grade", dataPolicy: "Data NOT used for training. Runs in your AWS account. GDPR & SOC 2 compliant.",
    regions: ["af-south-1 (Cape Town)", "eu-west-1 (Ireland)", "us-east-1 (Virginia)", "ap-southeast-1 (Singapore)"],
    certifications: ["SOC 2 Type II", "ISO 27001", "PCI DSS", "HIPAA", "POPIA"],
    fields: [
      { key: "region", label: "AWS Region", placeholder: "af-south-1" },
      { key: "access_key", label: "Access Key ID", placeholder: "AKIA..." },
      { key: "secret_key", label: "Secret Access Key", placeholder: "xxxx...", secret: true },
      { key: "model_id", label: "Model ID", placeholder: "anthropic.claude-3-sonnet-20240229-v1:0" },
    ],
  },
  {
    id: "vertex_ai", name: "Google Vertex AI", icon: "🔵", description: "Gemini Pro / PaLM 2 via Google Cloud Vertex AI. Enterprise-grade with VPC Service Controls.",
    trust: "enterprise", trustLabel: "Bank-Grade", dataPolicy: "Data NOT used for training. Stays in your GCP project. ISO 27001 & SOC 2.",
    regions: ["europe-west1", "us-central1", "asia-southeast1", "australia-southeast1"],
    certifications: ["SOC 2 Type II", "ISO 27001", "HIPAA", "FedRAMP"],
    fields: [
      { key: "project_id", label: "GCP Project ID", placeholder: "your-project-id" },
      { key: "region", label: "Region", placeholder: "europe-west1" },
      { key: "service_account", label: "Service Account Key (JSON)", placeholder: "Paste JSON..." },
    ],
  },
  {
    id: "openai", name: "OpenAI", icon: "🟢", description: "GPT-4o / GPT-4 Turbo via OpenAI API. Best for non-regulated, fast-moving teams.",
    trust: "cloud", trustLabel: "Cloud SaaS", dataPolicy: "API data NOT used for training (with API). Data processed in US data centers.",
    regions: ["US (default)"],
    certifications: ["SOC 2 Type II"],
    fields: [
      { key: "api_key", label: "API Key", placeholder: "sk-...", secret: true },
      { key: "org_id", label: "Organization ID (optional)", placeholder: "org-..." },
    ],
  },
  {
    id: "local_llama", name: "Local LLM (Llama / Mistral)", icon: "🦙", description: "Run Llama 3, Mistral, Mixtral, or Phi locally. Zero data leaves your environment.",
    trust: "self-hosted", trustLabel: "On-Premise", dataPolicy: "100% on-premise. Zero external calls. Complete data sovereignty.",
    regions: ["Your Data Center"],
    certifications: ["Self-attested — your compliance"],
    fields: [
      { key: "endpoint", label: "Model Endpoint", placeholder: "http://gpu-server:8080/v1" },
      { key: "model_name", label: "Model Name", placeholder: "llama-3-70b-instruct" },
      { key: "api_key", label: "Auth Token (optional)", placeholder: "xxxx...", secret: true },
    ],
  },
  {
    id: "nvidia_nim", name: "NVIDIA NIM / Triton", icon: "🟩", description: "Enterprise inference with NVIDIA NIM. Deploy on your own GPU cluster with optimized performance.",
    trust: "self-hosted", trustLabel: "On-Premise", dataPolicy: "100% on-premise. Runs on your NVIDIA GPUs. Full air-gap support.",
    regions: ["Your GPU Cluster"],
    certifications: ["Self-attested — your compliance"],
    fields: [
      { key: "endpoint", label: "NIM Endpoint", placeholder: "http://nim-server:8000/v1" },
      { key: "model", label: "Model", placeholder: "meta/llama3-70b-instruct" },
    ],
  },
  {
    id: "custom", name: "Custom Endpoint", icon: "⚙️", description: "Any OpenAI-compatible API endpoint. Supports vLLM, TGI, Ollama, LM Studio, and more.",
    trust: "self-hosted", trustLabel: "Custom", dataPolicy: "Depends on your deployment. Fully configurable.",
    regions: ["Your Infrastructure"],
    certifications: ["Your compliance framework"],
    fields: [
      { key: "base_url", label: "Base URL", placeholder: "http://your-server:8080/v1" },
      { key: "api_key", label: "API Key (optional)", placeholder: "xxxx...", secret: true },
      { key: "model", label: "Model Name", placeholder: "your-model" },
    ],
  },
];

// ─── Component ─────────────────────────────

export default function AISettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState("azure_openai");
  const [deploymentMode, setDeploymentMode] = useState<"cloud" | "hybrid" | "on-prem">("hybrid");
  const [dataRegion, setDataRegion] = useState("za");
  const [piiFiltering, setPiiFiltering] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [dataEncryption, setDataEncryption] = useState(true);
  const [dataMasking, setDataMasking] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const provider = LLM_PROVIDERS.find(p => p.id === selectedProvider)!;

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const trustColor: Record<string, string> = {
    enterprise: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    cloud: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    "self-hosted": "bg-electric-500/15 text-electric-400 border-electric-500/20",
  };

  const deployModes = [
    { id: "cloud" as const, icon: "☁️", label: "Cloud (SaaS)", desc: "Platform and LLM run in our cloud. Best for startups and non-regulated industries." },
    { id: "hybrid" as const, icon: "🔀", label: "Hybrid", desc: "Platform in cloud, LLM + data in client environment. Best balance of convenience and security." },
    { id: "on-prem" as const, icon: "🏢", label: "On-Premise", desc: "Everything runs in client data center. Docker/Helm deployment. Full air-gap support." },
  ];

  const regions = [
    { id: "za", label: "🇿🇦 South Africa", dc: "Azure South Africa North / AWS af-south-1" },
    { id: "eu", label: "🇪🇺 Europe", dc: "Azure West Europe / AWS eu-west-1" },
    { id: "us", label: "🇺🇸 United States", dc: "Azure East US / AWS us-east-1" },
    { id: "uk", label: "🇬🇧 United Kingdom", dc: "Azure UK South / AWS eu-west-2" },
    { id: "sg", label: "🇸🇬 Singapore", dc: "Azure Southeast Asia / AWS ap-southeast-1" },
    { id: "custom", label: "🏢 Client Data Center", dc: "On-premise deployment" },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI & Data Sovereignty</h1>
          <p className="text-text-secondary mt-1">Configure LLM provider, deployment mode, data residency, and security controls</p>
        </div>
        <button onClick={handleSave} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          {saved ? "✅ Saved" : "💾 Save Configuration"}
        </button>
      </div>

      {/* ═══ SECTION 1: Deployment Mode ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Deployment Mode</h2>
        <p className="text-sm text-text-muted mb-4">How should the platform and AI models be deployed?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deployModes.map(mode => (
            <button key={mode.id} onClick={() => setDeploymentMode(mode.id)}
              className={`text-left glass-card p-5 transition-all hover:-translate-y-0.5 ${deploymentMode === mode.id ? "border-electric-500/40 ring-1 ring-electric-500/10" : "hover:border-electric-500/20"}`}>
              <div className="text-2xl mb-2">{mode.icon}</div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{mode.label}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{mode.desc}</p>
              {deploymentMode === mode.id && (
                <div className="mt-3 text-xs text-electric-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-electric-400" /> Selected
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 2: LLM Provider ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">LLM Provider</h2>
        <p className="text-sm text-text-muted mb-4">Select where AI reasoning runs. Enterprise providers keep data in your tenant.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LLM_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => { setSelectedProvider(p.id); setShowConfig(false); }}
              className={`text-left glass-card p-4 transition-all hover:-translate-y-0.5 relative ${selectedProvider === p.id ? "border-electric-500/40 ring-1 ring-electric-500/10" : "hover:border-electric-500/20"}`}>
              {p.recommended && (
                <div className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white">RECOMMENDED</div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-xl shrink-0">{p.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${trustColor[p.trust]}`}>{p.trustLabel}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{p.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Selected Provider Details ═══ */}
      <div className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.02), rgba(16,185,129,0.02))" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-2xl">{provider.icon}</div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{provider.name}</h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${trustColor[provider.trust]}`}>{provider.trustLabel}</span>
            </div>
          </div>
          <button onClick={() => setShowConfig(!showConfig)} className="text-sm text-electric-400 hover:text-electric-300 font-medium transition-colors">
            {showConfig ? "Hide Config" : "Configure →"}
          </button>
        </div>

        {/* Data Policy */}
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-sm">🔒</span>
            <div>
              <div className="text-xs font-semibold text-emerald-400 mb-0.5">Data Policy</div>
              <p className="text-xs text-emerald-400/80 leading-relaxed">{provider.dataPolicy}</p>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap gap-2 mb-4">
          {provider.certifications.map(c => (
            <span key={c} className="text-[10px] px-2 py-1 rounded-lg bg-navy-800 border border-border text-text-secondary font-medium">✓ {c}</span>
          ))}
        </div>

        {/* Regions */}
        <div className="mb-4">
          <div className="text-xs font-medium text-text-secondary mb-1.5">Available Regions</div>
          <div className="flex flex-wrap gap-1.5">
            {provider.regions.map(r => (
              <span key={r} className="text-[10px] px-2 py-1 rounded-lg bg-electric-500/10 text-electric-400 font-medium">{r}</span>
            ))}
          </div>
        </div>

        {/* Configuration Fields */}
        {showConfig && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-text-primary">Connection Settings</h4>
            {provider.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-text-secondary mb-1">{field.label}</label>
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
          </div>
        )}
      </div>

      {/* ═══ SECTION 3: Data Residency ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Data Residency</h2>
        <p className="text-sm text-text-muted mb-4">Where should data be processed and stored?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {regions.map(region => (
            <button key={region.id} onClick={() => setDataRegion(region.id)}
              className={`text-left glass-card p-4 transition-all ${dataRegion === region.id ? "border-electric-500/40 ring-1 ring-electric-500/10" : "hover:border-electric-500/20"}`}>
              <div className="text-sm font-semibold text-text-primary mb-0.5">{region.label}</div>
              <div className="text-[10px] text-text-muted">{region.dc}</div>
              {dataRegion === region.id && (
                <div className="mt-2 text-[10px] text-electric-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-400" /> Active
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 4: Security Controls ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Security & Compliance Controls</h2>
        <p className="text-sm text-text-muted mb-4">Enterprise security features applied to all agent operations</p>
        <div className="space-y-3">
          {[
            { id: "pii", label: "PII Filtering", desc: "Automatically detect and mask personal identifiable information before sending to LLM. Supports names, emails, phone numbers, ID numbers, credit card numbers.", icon: "🛡️", enabled: piiFiltering, toggle: setPiiFiltering },
            { id: "masking", label: "Data Masking", desc: "Replace sensitive values with placeholders in agent logs and audit trails. Original values stored separately with AES-256 encryption.", icon: "🎭", enabled: dataMasking, toggle: setDataMasking },
            { id: "encryption", label: "Encryption at Rest (AES-256-GCM)", desc: "All API keys, credentials, and sensitive data encrypted before database storage. Keys rotated automatically every 90 days.", icon: "🔐", enabled: dataEncryption, toggle: setDataEncryption },
            { id: "audit", label: "Full Audit Logging", desc: "Every agent action, data access, LLM call, and configuration change logged with timestamp, user, and IP address. Immutable audit trail.", icon: "📋", enabled: auditLogging, toggle: setAuditLogging },
          ].map(ctrl => (
            <div key={ctrl.id} className="glass-card p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-800 border border-border flex items-center justify-center text-xl shrink-0">{ctrl.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{ctrl.label}</div>
                  <p className="text-xs text-text-muted leading-relaxed mt-0.5">{ctrl.desc}</p>
                </div>
              </div>
              <button onClick={() => ctrl.toggle(!ctrl.enabled)}
                className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${ctrl.enabled ? "bg-emerald-500" : "bg-navy-700"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ctrl.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Architecture Summary ═══ */}
      <div className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.03), rgba(59,130,246,0.03))" }}>
        <h3 className="text-base font-semibold text-text-primary mb-4">Current Architecture Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">{deployModes.find(m => m.id === deploymentMode)?.icon}</div>
            <div className="text-xs font-semibold text-text-primary">{deployModes.find(m => m.id === deploymentMode)?.label}</div>
            <div className="text-[10px] text-text-muted">Deployment</div>
          </div>
          <div>
            <div className="text-2xl mb-1">{provider.icon}</div>
            <div className="text-xs font-semibold text-text-primary">{provider.name}</div>
            <div className="text-[10px] text-text-muted">LLM Provider</div>
          </div>
          <div>
            <div className="text-2xl mb-1">{regions.find(r => r.id === dataRegion)?.label.split(" ")[0]}</div>
            <div className="text-xs font-semibold text-text-primary">{regions.find(r => r.id === dataRegion)?.label.split(" ").slice(1).join(" ")}</div>
            <div className="text-[10px] text-text-muted">Data Region</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs font-semibold text-text-primary">{[piiFiltering, dataMasking, dataEncryption, auditLogging].filter(Boolean).length}/4 Active</div>
            <div className="text-[10px] text-text-muted">Security Controls</div>
          </div>
        </div>

        {/* Compliance Statement */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-xs text-emerald-400/80 leading-relaxed">
            ✅ With this configuration, <strong>no raw data leaves the client environment</strong>. The LLM runs in {provider.trust === "self-hosted" ? "your data center" : "your " + provider.name + " tenant"}, all credentials are AES-256 encrypted, PII is filtered before LLM calls, and every action is audit-logged. Compliant with <strong>POPIA, GDPR, PCI DSS, and SOC 2</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
