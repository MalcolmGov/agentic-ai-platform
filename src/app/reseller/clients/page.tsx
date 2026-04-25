"use client";

import { useState, useEffect, useMemo } from "react";

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
  clients: Client[];
  totalMRR: number;
};

const PLAN_COLORS: Record<string, string> = {
  ENTERPRISE: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  PROFESSIONAL: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  STARTER: "text-slate-400 bg-slate-400/10 border-slate-600/30",
};

const INDUSTRY_ICONS: Record<string, string> = {
  c1: "🏢",
  c2: "💻",
  c3: "🛒",
  c4: "🏦",
  c5: "🚚",
  c6: "🏥",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ─── Client Card ──────────────────────────────────────────────────────────────
function ClientCard({ client }: { client: Client }) {
  const icon = INDUSTRY_ICONS[client.id] ?? "🏢";
  const planCls = PLAN_COLORS[client.plan] ?? PLAN_COLORS.STARTER;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-all p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{client.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-emerald-400" : "bg-yellow-400"}`} />
              <span className={`text-xs capitalize ${client.status === "active" ? "text-emerald-400" : "text-yellow-400"}`}>
                {client.status}
              </span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${planCls}`}>
          {client.plan}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-800/60 p-2.5 text-center">
          <div className="text-xs text-slate-500 mb-0.5">MRR</div>
          <div className="text-sm font-bold text-white">R {client.mrr.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-2.5 text-center">
          <div className="text-xs text-slate-500 mb-0.5">Agents</div>
          <div className="text-sm font-bold text-white">{client.agents}</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-2.5 text-center">
          <div className="text-xs text-slate-500 mb-0.5">Markets</div>
          <div className="text-sm font-bold text-white">{client.markets}</div>
        </div>
      </div>

      {/* Last activity */}
      <div className="text-[10px] text-slate-600">
        Last activity: {timeAgo(client.joined)}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-slate-800">
        <button className="flex-1 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 text-yellow-400 text-xs font-medium transition-colors">
          Manage
        </button>
        <button className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors">
          Usage Report
        </button>
        <button className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors">
          Support
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [data, setData] = useState<ResellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/resellers")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.clients.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "ALL" || c.plan === planFilter;
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [data, search, planFilter, statusFilter]);

  const totalAgents = data?.clients.reduce((s, c) => s + c.agents, 0) ?? 0;
  const avgAgents = data ? Math.round(totalAgents / data.clients.length) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-500 mb-1">Total Clients</div>
          <div className="text-2xl font-bold text-white">{data?.clients.length ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-500 mb-1">Total MRR This Month</div>
          <div className="text-2xl font-bold text-white">R {(data?.totalMRR ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-500 mb-1">Avg Agents per Client</div>
          <div className="text-2xl font-bold text-white">{avgAgents}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-yellow-400/40"
        >
          <option value="ALL">All Plans</option>
          <option value="STARTER">Starter</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-yellow-400/40"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
        </select>
        <div className="text-xs text-slate-500">
          {filtered.length} of {data?.clients.length ?? 0} clients
        </div>
      </div>

      {/* Client grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No clients match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
