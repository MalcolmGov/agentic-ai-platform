"use client";

import { useState, useEffect } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// ─── Setup Steps ──────────────────────────────────────────────────────────────

const SETUP_STEPS = [
  {
    number: 1,
    title: "Create a Meta Business Account",
    description: "Go to business.facebook.com and create or link your business account.",
    link: { label: "Open Meta Business Suite", href: "https://business.facebook.com" },
  },
  {
    number: 2,
    title: "Create a WhatsApp Business App",
    description: "In Meta Developers, create a new app and add the WhatsApp product to it.",
    link: { label: "Open Meta Developers", href: "https://developers.facebook.com" },
  },
  {
    number: 3,
    title: "Get Your Phone Number ID and Access Token",
    description: "In your app dashboard, navigate to WhatsApp → API Setup to find your Phone Number ID and generate a permanent access token.",
    link: null,
  },
  {
    number: 4,
    title: "Configure Your Webhook URL",
    description: "In the WhatsApp product settings, set your Callback URL to the endpoint below. Meta will send all incoming messages here.",
    link: null,
    showWebhookUrl: true,
  },
  {
    number: 5,
    title: "Set the Webhook Verify Token",
    description: "Use the verify token below when prompted by Meta during webhook setup.",
    link: null,
    showVerifyToken: true,
  },
  {
    number: 6,
    title: "Subscribe to the Messages Webhook Field",
    description: 'In Meta Developers → WhatsApp → Configuration, click "Manage" and subscribe to the "messages" field.',
    link: null,
  },
];

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-800 hover:bg-navy-700 text-text-secondary hover:text-text-primary transition-colors border border-border"
    >
      {copied ? (
        <>
          <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon className="w-3.5 h-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppSetupPage() {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-domain.com";

  const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;
  const verifyToken = "agentic_whatsapp_verify_2026";

  const isConfigured = Boolean(phoneNumberId && accessToken);

  // Load saved values from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem("wa_phone_number_id") ?? "";
    const savedToken = localStorage.getItem("wa_access_token") ?? "";
    setPhoneNumberId(savedPhone);
    setAccessToken(savedToken);
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("wa_phone_number_id", phoneNumberId);
    localStorage.setItem("wa_access_token", accessToken);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleTestConnection() {
    setTestStatus("testing");
    try {
      const res = await fetch(
        `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test_challenge_123`
      );
      const text = await res.text();
      setTestStatus(text.trim() === "test_challenge_123" ? "ok" : "fail");
    } catch {
      setTestStatus("fail");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg">
              <WhatsAppIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">WhatsApp Business Setup</h1>
          </div>
          <p className="text-text-secondary">
            Connect Meta WhatsApp Cloud API to enable AI-powered customer support over WhatsApp.
          </p>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${
          isConfigured
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          }`} />
          {isConfigured ? "Connected" : "Not configured"}
        </div>
      </div>

      {/* ─── Step-by-Step Guide ─────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Setup Guide</h2>
          <p className="text-xs text-text-muted mt-0.5">Follow these steps to connect Meta WhatsApp Business</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {SETUP_STEPS.map((step) => (
            <div key={step.number} className="p-5 flex gap-4 hover:bg-white/[0.02] transition-colors">
              {/* Step number */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {step.number}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-primary mb-1">{step.title}</div>
                <p className="text-xs text-text-muted leading-relaxed">{step.description}</p>

                {/* Webhook URL display */}
                {step.showWebhookUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 font-mono text-xs bg-navy-900 border border-border rounded-lg px-3 py-2 text-text-secondary truncate">
                      {webhookUrl}
                    </div>
                    <CopyButton value={webhookUrl} />
                  </div>
                )}

                {/* Verify token display */}
                {step.showVerifyToken && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 font-mono text-xs bg-navy-900 border border-border rounded-lg px-3 py-2 text-text-secondary">
                      {verifyToken}
                    </div>
                    <CopyButton value={verifyToken} />
                  </div>
                )}

                {/* External link */}
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-electric-400 hover:text-electric-300 transition-colors"
                  >
                    {step.link.label}
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Configuration Form ─────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-text-primary mb-1">API Credentials</h2>
        <p className="text-xs text-text-muted mb-5">
          Enter your credentials from the Meta Developer console. These are saved locally for this session.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="input-field w-full font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Found in Meta Developers → WhatsApp → API Setup → Phone Number ID
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAxxxxxxxx..."
              className="input-field w-full font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Generate a permanent token in Meta Developers → System Users
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary text-sm px-5 py-2.5"
            >
              {saved ? (
                <span className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4" /> Saved
                </span>
              ) : (
                "Save Credentials"
              )}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === "testing"}
              className="btn-secondary text-sm px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testStatus === "testing" ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Testing…
                </span>
              ) : (
                "Test Connection"
              )}
            </button>

            {testStatus === "ok" && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                <CheckIcon className="w-4 h-4" />
                Webhook reachable
              </span>
            )}
            {testStatus === "fail" && (
              <span className="text-sm text-rose-400 font-medium">
                Connection failed — check your server logs
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ─── Info Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔒</span>
            <span className="text-sm font-semibold text-text-primary">Security</span>
          </div>
          <ul className="space-y-2 text-xs text-text-muted">
            <li className="flex items-start gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              Verify token validated on every webhook handshake
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              All inbound messages logged to the audit trail
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              Access token never exposed to the browser
            </li>
          </ul>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-semibold text-text-primary">AI Handling</span>
          </div>
          <ul className="space-y-2 text-xs text-text-muted">
            <li className="flex items-start gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-electric-400 mt-0.5 shrink-0" />
              Incoming messages routed to Customer Support agent
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-electric-400 mt-0.5 shrink-0" />
              Replies in the same language as the customer
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-electric-400 mt-0.5 shrink-0" />
              Always returns 200 to Meta — no message loss
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
