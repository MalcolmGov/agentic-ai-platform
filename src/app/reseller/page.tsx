"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  agents: number;
  markets: number;
  status: string;
  joined: string;
};

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
  clients: Client[];
  commissions: { month: string; revenue: number; commission: number; status: string }[];
};

type ProvisionResult = {
  tenantSlug: string;
  temporaryPassword: string;
  loginUrl: string;
};

const HEALTH_MAP: Record<string, { label: string; dot: string }> = {
  c1: { label: "Healthy", dot: "🟢" },
  c2: { label: "Healthy", dot: "🟢" },
  c3: { label: "Healthy", dot: "🟢" },
  c4: { label: "At Risk", dot: "🟡" },
  c5: { label: "Healthy", dot: "🟢" },
  c6: { label: "At Risk", dot: "🟡" },
};

const PLAN_COLORS: Record<string, string> = {
  ENTERPRISE: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  PROFESSIONAL: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  STARTER: "text-slate-400 bg-slate-400/10 border-slate-600/20",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  highlight,
  progress,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  progress?: { current: number; max: number };
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-yellow-400/5 border-yellow-400/20" : "bg-slate-900 border-slate-800"}`}>
      <div className="text-xs text-slate-500 font-medium mb-2">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-yellow-400" : "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {progress && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-300"
              style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-600 mt-1">
            {progress.current} / {progress.max} ({Math.round((progress.current / progress.max) * 100)}% of limit)
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({
  icon,
  title,
  desc,
  onClick,
  href,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
  );

  const cls =
    "block rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 p-4 text-left transition-all cursor-pointer w-full";

  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}

// ─── Provision Modal ──────────────────────────────────────────────────────────
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
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Company Name</label>
                <input type="text" required value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/60" placeholder="Acme Corporation" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Contact Email</label>
                <input type="email" required value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/60" placeholder="admin@client.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Industry</label>
                  <select value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-yellow-400/60">
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Plan</label>
                  <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-yellow-400/60">
                    {PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Markets</label>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map((m) => (
                    <button key={m} type="button" onClick={() => toggleMarket(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.markets.includes(m) ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/60 resize-none"
                  placeholder="Optional notes about this client…" />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {loading ? "Provisioning…" : "Provision Client"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResellerOverviewPage() {
  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/resellers")
      .then((r) => r.json())
      .then((data) => { if (data.success) setReseller(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const r = reseller!;
  const pendingCommission = r.commissions.find((c) => c.status === "pending");
  const ytdCommission = r.commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commission, 0);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm shadow-2xl">
          {toast}
        </div>
      )}

      {/* Section 1: Partner Status Card */}
      <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 via-amber-400/5 to-slate-900 p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {r.name}</h1>
            <p className="text-slate-400 text-sm">Here's your partner performance snapshot</p>
            <div className="mt-4 flex items-center flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-300 text-slate-900 text-sm font-bold">
                ★ {r.tier} PARTNER
              </span>
              <span className="text-xs text-slate-500">
                Commission Rate: <span className="text-white font-semibold">{(r.commissionRate * 100).toFixed(0)}%</span>
              </span>
              <span className="text-xs text-slate-500">
                Contract Until: <span className="text-white font-semibold">{new Date(r.contractEnd).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${r.status === "ACTIVE" ? "bg-emerald-400" : "bg-slate-500"}`} />
            <span className="text-xs text-slate-400 font-medium">{r.status}</span>
          </div>
        </div>
      </div>

      {/* Section 2: KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Clients"
          value={`${r.totalClients}`}
          sub={`of ${r.clientLimit} limit`}
          progress={{ current: r.totalClients, max: r.clientLimit }}
        />
        <KpiCard
          label="This Month's Revenue"
          value={`R ${(pendingCommission?.revenue ?? r.totalMRR).toLocaleString()}`}
          sub="client-generated MRR"
        />
        <KpiCard
          label="Estimated Commission"
          value={`R ${(pendingCommission?.commission ?? r.estimatedCommission).toLocaleString()}`}
          sub="pending payout"
          highlight
        />
        <KpiCard
          label="Total Earned YTD"
          value={`R ${ytdCommission.toLocaleString()}`}
          sub="paid commissions"
        />
      </div>

      {/* Section 3: Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionCard
            icon="🚀"
            title="Provision New Client"
            desc="Create a tenant for a new client"
            onClick={() => setProvisionOpen(true)}
          />
          <ActionCard
            icon="💰"
            title="View Commission Statement"
            desc="See your earning history"
            href="/reseller/commissions"
          />
          <ActionCard
            icon="📦"
            title="Download Sales Kit"
            desc="Partner resources & decks"
            onClick={() => showToast("Downloading partner resources…")}
          />
          <ActionCard
            icon="🎧"
            title="Request Support"
            desc="Contact partner success team"
            onClick={() => window.location.href = "mailto:support@{{YOUR_DOMAIN}}?subject=Partner Support Request"}
          />
        </div>
      </div>

      {/* Section 4: Client Health Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Client Health Overview</h2>
          <Link href="/reseller/clients" className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
            View all →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Client</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Plan</th>
                <th className="text-right px-5 py-3.5 text-xs text-slate-500 font-medium">MRR</th>
                <th className="text-right px-5 py-3.5 text-xs text-slate-500 font-medium">Agents</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {r.clients.map((client, i) => {
                const health = HEALTH_MAP[client.id] ?? { label: "Healthy", dot: "🟢" };
                return (
                  <tr key={client.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i === r.clients.length - 1 ? "border-0" : ""}`}>
                    <td className="px-5 py-4">
                      <span className="font-medium text-white">{client.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${PLAN_COLORS[client.plan] ?? "text-slate-400 bg-slate-400/10 border-slate-600/20"}`}>
                        {client.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-white">R {client.mrr.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-slate-300">{client.agents}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${client.status === "active" ? "text-emerald-400" : "text-yellow-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                        {client.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span>{health.dot}</span>
                        <span className="text-slate-400">{health.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {provisionOpen && <ProvisionModal onClose={() => setProvisionOpen(false)} />}
    </div>
  );
}
