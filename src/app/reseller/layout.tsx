"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

type ResellerData = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  commissionRate: number;
  clientLimit: number;
  totalClients: number;
  totalMRR: number;
  estimatedCommission: number;
  status: string;
  contractEnd: string;
};

const NAV_ITEMS = [
  { href: "/reseller", label: "Overview", icon: "📊", exact: true },
  { href: "/reseller/clients", label: "My Clients", icon: "👥" },
  { href: "/reseller/commissions", label: "Commissions", icon: "💰" },
  { href: "/reseller/branding", label: "Branding", icon: "⚙️" },
  { href: "/reseller/resources", label: "Resources", icon: "📚" },
];

const TIER_COLORS: Record<string, string> = {
  PLATINUM: "from-slate-300 to-slate-100",
  GOLD: "from-yellow-400 to-amber-300",
  SILVER: "from-slate-400 to-slate-300",
  BRONZE: "from-amber-700 to-amber-600",
};

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [userName, setUserName] = useState<string>("Partner");
  const [userEmail, setUserEmail] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          router.push("/login");
          return;
        }
        setUserName(data.data.user.name || data.data.user.email);
        setUserEmail(data.data.user.email || "");
      })
      .catch(() => router.push("/login"));

    fetch("/api/resellers")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReseller(data.data);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function handleSignOut() {
    try { await fetch("/api/auth/me", { method: "POST" }); } catch {}
    localStorage.removeItem("auth_token");
    router.push("/login");
  }

  const tierGradient = TIER_COLORS[reseller?.tier ?? "GOLD"] ?? TIER_COLORS.GOLD;
  const tierLabel = reseller?.tier ?? "GOLD";

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl flex flex-col fixed left-0 h-screen z-40 top-0">
        {/* Gold accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-yellow-400 to-amber-300" />

        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/reseller" className="flex items-center gap-3 no-underline">
            <Image src="/logo-3d.png" alt="Swifter AI" width={36} height={36} className="rounded-xl" />
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Swifter AI</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Partner Portal</div>
            </div>
          </Link>

          {/* Partner tier badge */}
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${tierGradient} text-slate-900`}>
              ★ {tierLabel} PARTNER
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Support footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
            <div className="text-xs text-slate-500 mb-1">Partner Support</div>
            <a
              href="mailto:support@swifterai.io"
              className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              support@swifterai.io
            </a>
            <div className="mt-2 text-[10px] text-slate-600">
              {reseller ? `${reseller.totalClients} / ${reseller.clientLimit} clients` : "Loading…"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">
              {reseller ? (
                <span className="text-white font-medium">{reseller.name}</span>
              ) : (
                <span className="text-slate-500 animate-pulse">Demo Partner</span>
              )}
            </span>
            {reseller && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${tierGradient} text-slate-900`}>
                {tierLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setProvisionOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Provision New Client
            </button>

            <div className="h-6 w-px bg-slate-800" />

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-900 text-xs font-bold">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm text-left">
                  <div className="font-medium text-white">{userName}</div>
                  <div className="text-xs text-slate-500">{userEmail}</div>
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <div className="text-sm font-semibold text-white">{userName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{userEmail}</div>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
                      Main Dashboard
                    </Link>
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>

      {/* Provision modal (global, triggered from top bar) */}
      {provisionOpen && (
        <ProvisionModal onClose={() => setProvisionOpen(false)} />
      )}
    </div>
  );
}

// ─── Provision Modal ───────────────────────────────────────────────────────────

type ProvisionResult = {
  tenantSlug: string;
  temporaryPassword: string;
  loginUrl: string;
};

function ProvisionModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    companyName: "",
    contactEmail: "",
    plan: "PROFESSIONAL",
    industry: "Financial Services",
    markets: [] as string[],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState("");

  const MARKETS = ["🇿🇦 South Africa", "🇳🇬 Nigeria", "🇰🇪 Kenya"];
  const INDUSTRIES = ["Financial Services", "Retail", "Healthcare", "Logistics", "Manufacturing", "Government", "Other"];
  const PLANS = [
    { value: "STARTER", label: "Starter — $299/mo" },
    { value: "PROFESSIONAL", label: "Professional — $799/mo" },
    { value: "ENTERPRISE", label: "Enterprise — $1,999/mo" },
  ];

  function toggleMarket(m: string) {
    setForm((f) => ({
      ...f,
      markets: f.markets.includes(m) ? f.markets.filter((x) => x !== m) : [...f.markets, m],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "provision-client", ...form }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "Provisioning failed.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Provision New Client</h2>
            <p className="text-xs text-slate-500 mt-0.5">Create a new tenant for your client</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          {result ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-lg font-bold text-white">Client Provisioned!</div>
                <div className="text-sm text-slate-400 mt-1">Tenant has been created successfully</div>
              </div>
              <div className="text-left space-y-3 rounded-xl bg-slate-800 border border-slate-700 p-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Tenant Slug</div>
                  <code className="text-sm text-yellow-400 font-mono">{result.tenantSlug}</code>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Temporary Password</div>
                  <code className="text-sm text-emerald-400 font-mono">{result.temporaryPassword}</code>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Login URL</div>
                  <a href={result.loginUrl} className="text-xs text-blue-400 hover:underline break-all">{result.loginUrl}</a>
                </div>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Company Name</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/60"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Contact Email</label>
                <input
                  type="email"
                  required
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/60"
                  placeholder="admin@acme.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-yellow-400/60"
                  >
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-yellow-400/60"
                  >
                    {PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Markets</label>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMarket(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.markets.includes(m)
                          ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/60 resize-none"
                  placeholder="Optional notes about this client…"
                />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {loading ? "Provisioning…" : "Provision Client"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
