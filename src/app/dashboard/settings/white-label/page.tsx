"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  fontFamily?: string;
}

interface LoginPageConfig {
  headline?: string;
  subheadline?: string;
  backgroundUrl?: string | null;
  showPoweredBy?: boolean;
}

interface EmailBrandingConfig {
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  headerColor?: string;
}

interface WhiteLabelConfig {
  tenantId?: string;
  theme?: ThemeConfig;
  customDomain?: string | null;
  domainVerified?: boolean;
  emailBranding?: EmailBrandingConfig | null;
  loginPage?: LoginPageConfig | null;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-navy-900/60 overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-secondary">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-border bg-navy-950/60 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-electric-400/50 focus:border-electric-400/50 transition-colors"
    />
  );
}

function ColorField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value || "#6366f1"}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 absolute inset-0 w-10 h-10 cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer shadow-sm"
            style={{ backgroundColor: value || "#6366f1" }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-navy-950/60 text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-electric-400/50 focus:border-electric-400/50 transition-colors"
          maxLength={7}
        />
      </div>
    </Field>
  );
}

// ─── Live Preview Panel ───────────────────────────────────────────────────────

function LivePreview({ theme, loginPage }: {
  theme: ThemeConfig;
  loginPage: LoginPageConfig;
}) {
  const primary = theme.primaryColor || "#6366f1";
  const headline = loginPage.headline || "Your Brand";
  const subheadline = loginPage.subheadline || "Platform";
  const showPoweredBy = loginPage.showPoweredBy !== false;

  return (
    <div className="rounded-xl border border-border bg-navy-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-[10px] text-text-muted ml-1">Login page preview</span>
      </div>

      <div
        className="p-6 flex items-center justify-center min-h-[280px] relative"
        style={{
          background: loginPage.backgroundUrl
            ? `linear-gradient(rgba(8,12,28,0.75), rgba(8,12,28,0.85)), url(${loginPage.backgroundUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, #080c1c 0%, #0f1629 60%, #1a1040 100%)",
        }}
      >
        <div className="w-full max-w-[220px] bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm text-center">
          {theme.logoUrl ? (
            <Image
              src={theme.logoUrl}
              alt="Logo"
              width={40}
              height={40}
              className="rounded-xl mx-auto mb-3 object-contain"
              onError={() => {}}
              unoptimized
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${primary}, ${theme.secondaryColor || "#8b5cf6"})` }}
            >
              {headline.slice(0, 1)}
            </div>
          )}
          <div className="text-sm font-bold text-white mb-0.5">{headline}</div>
          <div className="text-[10px] text-white/50 uppercase tracking-widest mb-4">{subheadline}</div>

          <div className="space-y-2 mb-3">
            <div className="h-6 rounded-md bg-white/10 w-full" />
            <div className="h-6 rounded-md bg-white/10 w-full" />
          </div>

          <button
            className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Sign In
          </button>

          {showPoweredBy && (
            <p className="text-[9px] text-white/30 mt-3">Powered by Swifter AI</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
      type === "success"
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
    }`}>
      {type === "success" ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhiteLabelPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [tenantId, setTenantId] = useState<string>("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [plan, setPlan] = useState<string>("STARTER");

  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
    logoUrl: "",
    faviconUrl: "",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const [customDomain, setCustomDomain] = useState("");
  const [loginPage, setLoginPage] = useState<LoginPageConfig>({
    headline: "",
    subheadline: "",
    backgroundUrl: "",
    showPoweredBy: true,
  });
  const [emailBranding, setEmailBranding] = useState<EmailBrandingConfig>({
    fromName: "",
    fromEmail: "",
    replyTo: "",
    headerColor: "#6366f1",
  });

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [wlRes, meRes] = await Promise.all([
          fetch("/api/white-label"),
          fetch("/api/auth/me"),
        ]);
        const wlData = await wlRes.json();
        const meData = await meRes.json();

        if (meData.success) {
          setPlan(meData.data?.tenant?.plan ?? "STARTER");
        }

        if (wlData.success && wlData.data?.config) {
          const cfg: WhiteLabelConfig = wlData.data.config;
          setTenantId(cfg.tenantId ?? "");
          setDomainVerified(cfg.domainVerified ?? false);
          if (cfg.theme) {
            setTheme({
              primaryColor: cfg.theme.primaryColor ?? "#6366f1",
              secondaryColor: cfg.theme.secondaryColor ?? "#8b5cf6",
              accentColor: cfg.theme.accentColor ?? "#06b6d4",
              logoUrl: cfg.theme.logoUrl ?? "",
              faviconUrl: cfg.theme.faviconUrl ?? "",
              fontFamily: cfg.theme.fontFamily ?? "Inter, system-ui, sans-serif",
            });
          }
          setCustomDomain(cfg.customDomain ?? "");
          if (cfg.loginPage) {
            setLoginPage({
              headline: cfg.loginPage.headline ?? "",
              subheadline: cfg.loginPage.subheadline ?? "",
              backgroundUrl: cfg.loginPage.backgroundUrl ?? "",
              showPoweredBy: cfg.loginPage.showPoweredBy !== false,
            });
          }
          if (cfg.emailBranding) {
            setEmailBranding({
              fromName: cfg.emailBranding.fromName ?? "",
              fromEmail: cfg.emailBranding.fromEmail ?? "",
              replyTo: cfg.emailBranding.replyTo ?? "",
              headerColor: cfg.emailBranding.headerColor ?? "#6366f1",
            });
          }
        }
      } catch {
        // Non-fatal — user can still edit
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/white-label", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          customDomain: customDomain || null,
          emailBranding,
          loginPage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Changes saved successfully!", "success");
      } else {
        showToast(data.error ?? "Failed to save changes", "error");
      }
    } catch {
      showToast("Network error — please try again", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyDomain() {
    setVerifying(true);
    try {
      const res = await fetch("/api/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-domain" }),
      });
      const data = await res.json();
      if (data.success) {
        setDomainVerified(true);
        showToast("Domain verified successfully!", "success");
      } else {
        showToast(data.error ?? "Domain verification failed", "error");
      }
    } catch {
      showToast("Network error — please try again", "error");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-white/5" />
        <div className="h-4 w-96 rounded bg-white/5" />
        <div className="h-48 rounded-xl bg-white/5" />
        <div className="h-48 rounded-xl bg-white/5" />
      </div>
    );
  }

  const isStarterPlan = plan === "STARTER";

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-text-primary">White-Label Branding</h1>
            {isStarterPlan && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Pro Feature
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">Configure your branded experience for clients</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-electric-500 hover:bg-electric-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* Brand Identity */}
          <Section title="Brand Identity" description="Set your logo, colors, and typography">
            <Field label="Product / Company Name" hint="Used as the headline on your login page">
              <TextInput
                value={loginPage.headline ?? ""}
                onChange={(v) => setLoginPage((p) => ({ ...p, headline: v }))}
                placeholder="Accenture AI"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <ColorField
                label="Primary Color"
                value={theme.primaryColor ?? "#6366f1"}
                onChange={(v) => setTheme((p) => ({ ...p, primaryColor: v }))}
              />
              <ColorField
                label="Secondary / Accent Color"
                value={theme.secondaryColor ?? "#8b5cf6"}
                onChange={(v) => setTheme((p) => ({ ...p, secondaryColor: v }))}
              />
            </div>

            <Field label="Logo URL" hint="Recommended: PNG or SVG, 200×200 px minimum">
              <TextInput
                value={theme.logoUrl ?? ""}
                onChange={(v) => setTheme((p) => ({ ...p, logoUrl: v }))}
                placeholder="https://cdn.example.com/logo.png"
              />
              {theme.logoUrl && (
                <div className="mt-2 p-3 rounded-lg border border-border bg-navy-950/40 inline-flex items-center gap-3">
                  <Image
                    src={theme.logoUrl}
                    alt="Logo preview"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain"
                    onError={() => {}}
                    unoptimized
                  />
                  <span className="text-xs text-text-muted">Logo preview</span>
                </div>
              )}
            </Field>

            <Field label="Favicon URL" hint="Square ICO/PNG, 32×32 px">
              <TextInput
                value={theme.faviconUrl ?? ""}
                onChange={(v) => setTheme((p) => ({ ...p, faviconUrl: v }))}
                placeholder="https://cdn.example.com/favicon.ico"
              />
            </Field>
          </Section>

          {/* Custom Domain */}
          <Section title="Custom Domain" description="Serve the platform from your own domain">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Field label="Domain">
                  <div className="flex items-center gap-2">
                    <TextInput
                      value={customDomain}
                      onChange={setCustomDomain}
                      placeholder="app.yourbrand.com"
                    />
                    {domainVerified && (
                      <span className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {customDomain && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-text-secondary">
                  Add these DNS records at your domain registrar:
                </p>
                <div className="rounded-lg border border-border overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-navy-950/60 border-b border-border">
                        <th className="px-4 py-2.5 text-left font-semibold text-text-muted">Type</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-text-muted">Name</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-text-muted">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5 font-mono text-electric-400">CNAME</td>
                        <td className="px-4 py-2.5 font-mono text-text-secondary">app</td>
                        <td className="px-4 py-2.5 font-mono text-text-secondary">platform.swifterai.io</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono text-electric-400">TXT</td>
                        <td className="px-4 py-2.5 font-mono text-text-secondary">_agentic-verify</td>
                        <td className="px-4 py-2.5 font-mono text-text-secondary break-all">
                          verify={tenantId || "your-tenant-id"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleVerifyDomain}
                  disabled={verifying || domainVerified}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-electric-400/40 text-electric-400 hover:bg-electric-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying…
                    </>
                  ) : domainVerified ? (
                    "Domain Verified"
                  ) : (
                    "Verify Domain"
                  )}
                </button>
              </div>
            )}

            {!customDomain && (
              <p className="text-xs text-text-muted italic">No custom domain configured. Enter a domain above to get started.</p>
            )}
          </Section>

          {/* Login Page */}
          <Section title="Login Page Customisation" description="Control what clients see when they sign in">
            <Field label="Headline" hint="Shown as the main heading on the login page">
              <TextInput
                value={loginPage.headline ?? ""}
                onChange={(v) => setLoginPage((p) => ({ ...p, headline: v }))}
                placeholder="Welcome to Accenture AI"
              />
            </Field>

            <Field label="Subheadline">
              <TextInput
                value={loginPage.subheadline ?? ""}
                onChange={(v) => setLoginPage((p) => ({ ...p, subheadline: v }))}
                placeholder="Sign in to your AI agent platform"
              />
            </Field>

            <Field label="Background Image URL" hint="Recommended: 1920×1080 px or larger">
              <TextInput
                value={loginPage.backgroundUrl ?? ""}
                onChange={(v) => setLoginPage((p) => ({ ...p, backgroundUrl: v }))}
                placeholder="https://cdn.example.com/bg.jpg"
              />
            </Field>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={loginPage.showPoweredBy !== false}
                  onChange={(e) => setLoginPage((p) => ({ ...p, showPoweredBy: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full border border-border bg-navy-950 peer-checked:bg-electric-500 peer-checked:border-electric-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-text-primary">Show &ldquo;Powered by Swifter AI&rdquo;</span>
                <p className="text-xs text-text-muted">Display the Swifter AI attribution on the login page</p>
              </div>
            </label>
          </Section>

          {/* Email Branding */}
          <Section title="Email Branding" description="Customise the sender details for outbound emails">
            <div className="grid grid-cols-2 gap-4">
              <Field label="From Name">
                <TextInput
                  value={emailBranding.fromName ?? ""}
                  onChange={(v) => setEmailBranding((p) => ({ ...p, fromName: v }))}
                  placeholder="Accenture AI"
                />
              </Field>
              <Field label="From Email">
                <TextInput
                  value={emailBranding.fromEmail ?? ""}
                  onChange={(v) => setEmailBranding((p) => ({ ...p, fromEmail: v }))}
                  placeholder="noreply@accenture.com"
                  type="email"
                />
              </Field>
            </div>

            <Field label="Reply-To Email">
              <TextInput
                value={emailBranding.replyTo ?? ""}
                onChange={(v) => setEmailBranding((p) => ({ ...p, replyTo: v }))}
                placeholder="support@accenture.com"
                type="email"
              />
            </Field>
          </Section>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Live Preview</p>
            <LivePreview theme={theme} loginPage={loginPage} />
            <p className="text-[10px] text-text-muted mt-2 text-center">Updates as you type</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
