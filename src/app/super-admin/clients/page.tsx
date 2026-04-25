"use client";

import { useState, useMemo } from "react";

interface Client {
  name: string;
  reseller: string;
  plan: string;
  mrr: number;
  agents: number;
  markets: number;
  status: string;
  joined: string;
}

const MOCK_CLIENTS: Client[] = [
  { name: "FNB Corporate", reseller: "Deloitte Digital", plan: "ENTERPRISE", mrr: 8500, agents: 23, markets: 5, status: "active", joined: "2026-01-15" },
  { name: "Woolworths SA", reseller: "iOCO Digital", plan: "PROFESSIONAL", mrr: 3200, agents: 11, markets: 3, status: "active", joined: "2026-02-20" },
  { name: "Standard Bank", reseller: "Accenture Africa", plan: "ENTERPRISE", mrr: 9200, agents: 31, markets: 7, status: "active", joined: "2025-12-01" },
  { name: "Shoprite Group", reseller: "Deloitte Digital", plan: "ENTERPRISE", mrr: 7800, agents: 18, markets: 4, status: "active", joined: "2026-03-10" },
  { name: "MTN Business", reseller: "Accenture Africa", plan: "ENTERPRISE", mrr: 12000, agents: 42, markets: 9, status: "active", joined: "2025-11-15" },
  { name: "Absa Bank", reseller: "PwC Advisory", plan: "PROFESSIONAL", mrr: 3500, agents: 9, markets: 2, status: "trial", joined: "2026-04-01" },
  { name: "Naspers", reseller: "Deloitte Digital", plan: "PROFESSIONAL", mrr: 2800, agents: 7, markets: 2, status: "active", joined: "2026-01-28" },
];

const PLAN_COLORS: Record<string, string> = {
  ENTERPRISE: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  PROFESSIONAL: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  STARTER: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  trial: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  suspended: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

const PLANS = ["All Plans", "ENTERPRISE", "PROFESSIONAL", "STARTER"];

function fmt(n: number) {
  return `R ${n.toLocaleString("en-ZA")}`;
}

export default function AllClientsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All Plans");

  const filtered = useMemo(() => {
    return MOCK_CLIENTS.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.reseller.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "All Plans" || c.plan === planFilter;
      return matchSearch && matchPlan;
    });
  }, [search, planFilter]);

  const totalMRR = filtered.reduce((s, c) => s + c.mrr, 0);
  const avgAgents = filtered.length > 0 ? (filtered.reduce((s, c) => s + c.agents, 0) / filtered.length).toFixed(1) : "0";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">All Clients</h1>
        <p className="text-sm text-slate-500 mt-1">All tenant accounts across every reseller partner</p>
      </div>

      {/* Summary Row */}
      <div className="flex items-center gap-6 px-5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Total Clients:</span>
          <span className="font-semibold text-white">{filtered.length}</span>
        </div>
        <div className="w-px h-4 bg-slate-800" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Total MRR:</span>
          <span className="font-semibold font-mono text-white">{fmt(totalMRR)}</span>
        </div>
        <div className="w-px h-4 bg-slate-800" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Avg Agents:</span>
          <span className="font-semibold text-white">{avgAgents}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients or resellers…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
        >
          {PLANS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Client", "Reseller", "Plan", "MRR", "Agents", "Markets", "Status", "Joined"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-600 text-sm">
                    No clients match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{c.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-400">{c.reseller}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PLAN_COLORS[c.plan] ?? PLAN_COLORS.STARTER}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-300">{fmt(c.mrr)}</td>
                    <td className="px-5 py-4 text-slate-400">{c.agents}</td>
                    <td className="px-5 py-4 text-slate-400">{c.markets}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.active}`}>
                        <span className={`w-1 h-1 rounded-full ${c.status === "active" ? "bg-emerald-400" : c.status === "trial" ? "bg-yellow-400 animate-pulse" : "bg-rose-400"}`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(c.joined).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-800 bg-slate-900/80">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-400" colSpan={3}>
                    {filtered.length} clients shown
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold font-mono text-slate-300">
                    {fmt(totalMRR)}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{filtered.reduce((s, c) => s + c.agents, 0)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{filtered.reduce((s, c) => s + c.markets, 0)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
