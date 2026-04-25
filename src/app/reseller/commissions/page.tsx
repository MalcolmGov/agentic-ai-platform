"use client";

import { useState, useEffect } from "react";

type Commission = {
  month: string;
  revenue: number;
  commission: number;
  status: string;
  paidAt?: string;
};

type ResellerData = {
  commissionRate: number;
  tier: string;
  commissions: Commission[];
};

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Calculator Widget ────────────────────────────────────────────────────────
function CommissionCalculator({ rate, tier }: { rate: number; tier: string }) {
  const [revenue, setRevenue] = useState(50000);
  const monthly = Math.round(revenue * rate);
  const annual = monthly * 12;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">Commission Calculator</h3>
        <p className="text-xs text-slate-500">Estimate your earnings based on client revenue</p>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2 font-medium">
          Monthly Client Revenue (R)
        </label>
        <input
          type="number"
          min={0}
          step={1000}
          value={revenue}
          onChange={(e) => setRevenue(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg font-mono focus:outline-none focus:border-yellow-400/60"
        />
      </div>

      <div className="rounded-xl bg-yellow-400/5 border border-yellow-400/20 p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Commission per month</span>
          <span className="text-xl font-bold text-yellow-400">R {monthly.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Commission per year</span>
          <span className="text-lg font-bold text-white">R {annual.toLocaleString()}</span>
        </div>
        <div className="pt-2 border-t border-yellow-400/10">
          <p className="text-[10px] text-slate-500">
            Based on your <span className="text-yellow-400 font-semibold">{tier} tier</span> commission rate of {(rate * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommissionsPage() {
  const [data, setData] = useState<ResellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/resellers")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const d = data!;
  const paidCommissions = d.commissions.filter((c) => c.status === "paid");
  const pendingCommission = d.commissions.find((c) => c.status === "pending");
  const totalEarned = paidCommissions.reduce((s, c) => s + c.commission, 0);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm shadow-2xl">
          {toast}
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Commissions</h1>
        <p className="text-slate-400 text-sm">Track your earnings and payout history</p>
      </div>

      {/* Section 1: Earnings Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-500 mb-2">Total Earned (All Time)</div>
          <div className="text-2xl font-bold text-white">R {totalEarned.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 mt-1">Paid commissions</div>
        </div>
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
          <div className="text-xs text-slate-500 mb-2">This Month (Pending)</div>
          <div className="text-2xl font-bold text-yellow-400">
            R {(pendingCommission?.commission ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">awaiting payout</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-500 mb-2">Next Payout</div>
          <div className="text-2xl font-bold text-white">5th May 2026</div>
          <div className="text-xs text-slate-500 mt-1">automatic bank transfer</div>
        </div>
      </div>

      {/* Section 2: Commission History Table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Commission History</h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Month</th>
                <th className="text-right px-5 py-3.5 text-xs text-slate-500 font-medium">Client Revenue</th>
                <th className="text-right px-5 py-3.5 text-xs text-slate-500 font-medium">Commission (25%)</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium">Paid Date</th>
                <th className="text-right px-5 py-3.5 text-xs text-slate-500 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {d.commissions.map((row, i) => (
                <tr
                  key={row.month}
                  className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i === d.commissions.length - 1 ? "border-0" : ""}`}
                >
                  <td className="px-5 py-4 font-medium text-white">{formatMonth(row.month)}</td>
                  <td className="px-5 py-4 text-right font-mono text-slate-300">R {row.revenue.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-white">R {row.commission.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    {row.status === "paid" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">
                    {row.paidAt ? formatDate(row.paidAt) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => showToast(`Downloading statement for ${formatMonth(row.month)}…`)}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Commission Calculator */}
      <CommissionCalculator rate={d.commissionRate} tier={d.tier} />
    </div>
  );
}
