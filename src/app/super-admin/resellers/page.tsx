"use client";

import { useState, useEffect } from "react";

interface Reseller {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactName: string;
  status: string;
  tier: string;
  commissionRate: number;
  clientLimit: number;
  totalMRR: number;
  totalClients: number;
  contractStart?: string | null;
  contractEnd?: string | null;
}

const TIER_COLORS: Record<string, string> = {
  STANDARD: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  SILVER: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  GOLD: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  PLATINUM: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  SUSPENDED: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  CHURNED: "bg-slate-500/15 text-slate-500 border-slate-500/25",
};

const TIERS = [
  { id: "STANDARD", label: "Standard", icon: "⭐", desc: "15–20% commission, up to 25 clients" },
  { id: "SILVER", label: "Silver", icon: "⭐⭐", desc: "20–25% commission, up to 50 clients" },
  { id: "GOLD", label: "Gold", icon: "⭐⭐⭐", desc: "25–30% commission, up to 100 clients" },
  { id: "PLATINUM", label: "Platinum", icon: "👑", desc: "30–35% commission, unlimited clients" },
];

const FILTER_TABS = ["All", "Active", "Pending", "Suspended"];

function fmt(n: number) {
  return `R ${n.toLocaleString("en-ZA")}`;
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface NewResellerForm {
  name: string;
  slug: string;
  contactName: string;
  contactEmail: string;
  tier: string;
  commissionRate: number;
  clientLimit: number;
  contractStart: string;
  contractEnd: string;
}

const EMPTY_FORM: NewResellerForm = {
  name: "",
  slug: "",
  contactName: "",
  contactEmail: "",
  tier: "STANDARD",
  commissionRate: 20,
  clientLimit: 10,
  contractStart: "",
  contractEnd: "",
};

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewResellerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/resellers")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setResellers(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = resellers.filter((r) => {
    if (filter === "All") return true;
    return r.status === filter.toUpperCase();
  });

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/super-admin/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commissionRate: form.commissionRate / 100,
          contractStart: form.contractStart || undefined,
          contractEnd: form.contractEnd || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResellers((prev) => [data.data, ...prev]);
        setShowModal(false);
        setForm(EMPTY_FORM);
      } else {
        setError(data.error ?? "Failed to create reseller");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSuspend(id: string) {
    const res = await fetch("/api/super-admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "SUSPENDED" }),
    });
    const data = await res.json();
    if (data.success) {
      setResellers((prev) => prev.map((r) => (r.id === id ? { ...r, status: "SUSPENDED" } : r)));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resellers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage white-label partners and their contracts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-rose-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Reseller
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === tab
                ? "bg-slate-700 text-white shadow"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filter === tab ? "bg-slate-600" : "bg-slate-800"} text-slate-400`}>
              {tab === "All" ? resellers.length : resellers.filter((r) => r.status === tab.toUpperCase()).length}
            </span>
          </button>
        ))}
      </div>

      {/* Reseller Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse">
              <div className="h-5 w-40 rounded bg-slate-800 mb-3" />
              <div className="h-3 w-32 rounded bg-slate-800 mb-6" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="h-8 rounded bg-slate-800" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const usedPct = r.clientLimit > 0 ? (r.totalClients / r.clientLimit) * 100 : 0;
            const commission = r.totalMRR * r.commissionRate;
            return (
              <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm hover:border-slate-700 transition-colors group">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{r.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TIER_COLORS[r.tier] ?? TIER_COLORS.STANDARD}`}>
                        {r.tier}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.contactName} · {r.contactEmail}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[r.status] ?? STATUS_COLORS.PENDING}`}>
                    <span className={`w-1 h-1 rounded-full ${r.status === "ACTIVE" ? "bg-emerald-400" : r.status === "PENDING" ? "bg-yellow-400" : "bg-rose-400"}`} />
                    {r.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-slate-800/50 p-3">
                    <div className="text-[10px] text-slate-600 mb-0.5">Clients</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {r.totalClients} <span className="text-slate-600 font-normal">/ {r.clientLimit}</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${usedPct > 80 ? "bg-rose-500" : usedPct > 60 ? "bg-yellow-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(usedPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3">
                    <div className="text-[10px] text-slate-600 mb-0.5">Monthly MRR</div>
                    <div className="text-sm font-semibold text-slate-200 font-mono">{fmt(r.totalMRR)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3">
                    <div className="text-[10px] text-slate-600 mb-0.5">Commission Rate</div>
                    <div className="text-sm font-semibold text-slate-200">{(r.commissionRate * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">≈ {fmt(Math.round(commission))}/mo</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3">
                    <div className="text-[10px] text-slate-600 mb-0.5">Contract End</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {r.contractEnd
                        ? new Date(r.contractEnd).toLocaleDateString("en-ZA", { year: "numeric", month: "short" })
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    View Clients
                  </button>
                  <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    Edit
                  </button>
                  {r.status !== "SUSPENDED" && (
                    <button
                      onClick={() => handleSuspend(r.id)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reseller Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Add New Reseller</h2>
                <p className="text-xs text-slate-500 mt-0.5">Create a new white-label partner account</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Accenture Africa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    required
                    placeholder="accenture-africa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Name *</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    required
                    placeholder="John Smith"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Email *</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    required
                    placeholder="partners@accenture.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Partnership Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tier: tier.id }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.tier === tier.id
                          ? "border-rose-500/50 bg-rose-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="text-base mb-1">{tier.icon}</div>
                      <div className="text-sm font-semibold text-white">{tier.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Commission Rate Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">Commission Rate</label>
                  <span className="text-sm font-bold text-white">{form.commissionRate}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={35}
                  step={1}
                  value={form.commissionRate}
                  onChange={(e) => setForm((f) => ({ ...f, commissionRate: Number(e.target.value) }))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>15%</span><span>35%</span>
                </div>
              </div>

              {/* Client Limit */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Client Limit</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={form.clientLimit}
                  onChange={(e) => setForm((f) => ({ ...f, clientLimit: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>

              {/* Contract Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Contract Start</label>
                  <input
                    type="date"
                    value={form.contractStart}
                    onChange={(e) => setForm((f) => ({ ...f, contractStart: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Contract End</label>
                  <input
                    type="date"
                    value={form.contractEnd}
                    onChange={(e) => setForm((f) => ({ ...f, contractEnd: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-sm text-rose-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {submitting ? "Creating…" : "Create Reseller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
