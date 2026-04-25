"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Reseller {
  id: string;
  name: string;
  slug: string;
  status: string;
  tier: string;
  commissionRate: number;
  clientLimit: number;
  totalMRR: number;
  totalClients: number;
  contractEnd?: string | null;
  contactEmail: string;
  contactName: string;
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

const TOP_MARKETS = [
  { flag: "🇿🇦", country: "South Africa", clients: 47, mrr: "R 1.2M" },
  { flag: "🇳🇬", country: "Nigeria", clients: 12, mrr: "R 380K" },
  { flag: "🇰🇪", country: "Kenya", clients: 8, mrr: "R 240K" },
  { flag: "🇬🇭", country: "Ghana", clients: 2, mrr: "R 60K" },
];

const ACTIVITY_FEED = [
  { event: "Deloitte Digital onboarded FNB Corporate", time: "2h ago", icon: "🏦" },
  { event: "iOCO activated 3 new agents for Woolworths", time: "5h ago", icon: "🤖" },
  { event: "Commission payment of R 37,500 sent to Accenture", time: "1d ago", icon: "💸" },
  { event: "New reseller application: BCX Digital", time: "2d ago", icon: "📋" },
];

function fmt(n: number) {
  return `R ${n.toLocaleString("en-ZA")}`;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${color}`} />
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      <div className="text-[10px] text-slate-600 mt-1">{sub}</div>
    </div>
  );
}

export default function SuperAdminOverview() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/resellers")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setResellers(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalMRR = resellers.reduce((s, r) => s + r.totalMRR, 0);
  const totalClients = resellers.reduce((s, r) => s + r.totalClients, 0);
  const totalCommissions = resellers.reduce((s, r) => s + r.totalMRR * r.commissionRate, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          White-label reseller network · {resellers.length} partners active
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse">
              <div className="h-8 w-16 rounded bg-slate-800 mb-3" />
              <div className="h-8 w-24 rounded bg-slate-800 mb-1" />
              <div className="h-3 w-32 rounded bg-slate-800" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Resellers" value={String(resellers.length)} sub={`${resellers.filter(r => r.status === "ACTIVE").length} active`} icon="🤝" color="bg-gradient-to-r from-rose-500 to-rose-600" />
            <StatCard label="Active Clients" value={String(totalClients)} sub="across all partners" icon="🏢" color="bg-gradient-to-r from-blue-500 to-blue-600" />
            <StatCard label="Platform MRR" value={fmt(totalMRR)} sub="monthly recurring revenue" icon="📈" color="bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <StatCard label="Total Commissions" value={fmt(Math.round(totalCommissions))} sub="owed to partners" icon="💰" color="bg-gradient-to-r from-purple-500 to-purple-600" />
          </>
        )}
      </div>

      {/* Resellers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Reseller Network</h2>
            <p className="text-xs text-slate-500 mt-0.5">All white-label partners</p>
          </div>
          <Link
            href="/super-admin/resellers"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Manage all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Partner", "Tier", "Status", "Clients", "MRR", "Commission", "Contract End"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded bg-slate-800 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : resellers.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.contactName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TIER_COLORS[r.tier] ?? TIER_COLORS.STANDARD}`}>
                          {r.tier}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[r.status] ?? STATUS_COLORS.PENDING}`}>
                          <span className={`w-1 h-1 rounded-full ${r.status === "ACTIVE" ? "bg-emerald-400" : r.status === "PENDING" ? "bg-yellow-400" : "bg-rose-400"}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {r.totalClients} <span className="text-slate-600">/ {r.clientLimit}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">{fmt(r.totalMRR)}</td>
                      <td className="px-5 py-4 text-slate-400">{(r.commissionRate * 100).toFixed(0)}%</td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {r.contractEnd ? new Date(r.contractEnd).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: Markets + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Markets */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white mb-4">Top Markets by Deployment</h2>
          <div className="space-y-3">
            {TOP_MARKETS.map((m, i) => (
              <div key={m.country} className="flex items-center gap-4">
                <span className="text-2xl">{m.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">{m.country}</span>
                    <span className="text-xs font-mono text-slate-400">{m.mrr} MRR</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700"
                      style={{ width: `${[100, 32, 20, 5][i]}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">{m.clients} clients</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300">{item.event}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{item.time}</div>
                </div>
                {i < ACTIVITY_FEED.length - 1 && (
                  <div className="absolute left-[1.75rem] mt-8 w-px h-4 bg-slate-800 ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
