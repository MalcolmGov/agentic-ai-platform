"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════
// Scaling Dashboard — Infrastructure & Workers
// ═══════════════════════════════════════════════

interface Worker {
  id: string;
  name: string;
  type: string;
  status: "running" | "idle" | "draining" | "error";
  queue: string;
  processed: number;
  failed: number;
  uptime: string;
  cpu: number;
  memory: number;
}

interface QueueInfo {
  name: string;
  icon: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  workers: number;
  throughput: number;
}

const WORKERS: Worker[] = [
  { id: "w1", name: "fraud-worker-1", type: "FRAUD", status: "running", queue: "fraud-detection", processed: 4821, failed: 12, uptime: "3d 14h", cpu: 67, memory: 54 },
  { id: "w2", name: "fraud-worker-2", type: "FRAUD", status: "running", queue: "fraud-detection", processed: 4756, failed: 8, uptime: "3d 14h", cpu: 72, memory: 58 },
  { id: "w3", name: "compliance-worker-1", type: "COMPLIANCE", status: "running", queue: "compliance", processed: 2134, failed: 3, uptime: "7d 2h", cpu: 34, memory: 41 },
  { id: "w4", name: "report-worker-1", type: "REPORTING", status: "idle", queue: "reports", processed: 847, failed: 0, uptime: "7d 2h", cpu: 2, memory: 22 },
  { id: "w5", name: "general-worker-1", type: "GENERAL", status: "running", queue: "default", processed: 12847, failed: 45, uptime: "14d 6h", cpu: 55, memory: 48 },
  { id: "w6", name: "general-worker-2", type: "GENERAL", status: "running", queue: "default", processed: 12653, failed: 38, uptime: "14d 6h", cpu: 49, memory: 45 },
  { id: "w7", name: "email-worker-1", type: "EMAIL", status: "draining", queue: "email", processed: 3241, failed: 2, uptime: "5d 8h", cpu: 8, memory: 23 },
];

const QUEUES: QueueInfo[] = [
  { name: "fraud-detection", icon: "🛡️", waiting: 12, active: 4, completed: 9577, failed: 20, delayed: 3, workers: 2, throughput: 142 },
  { name: "compliance", icon: "📋", waiting: 47, active: 1, completed: 2134, failed: 3, delayed: 8, workers: 1, throughput: 12 },
  { name: "default", icon: "⚡", waiting: 5, active: 8, completed: 25500, failed: 83, delayed: 0, workers: 2, throughput: 234 },
  { name: "reports", icon: "📊", waiting: 0, active: 0, completed: 847, failed: 0, delayed: 1, workers: 1, throughput: 3 },
  { name: "email", icon: "✉️", waiting: 156, active: 0, completed: 3241, failed: 2, delayed: 12, workers: 1, throughput: 45 },
];

export default function ScalingPage() {
  const [autoScale, setAutoScale] = useState(true);
  const [scalingTo, setScalingTo] = useState<string | null>(null);

  const totalProcessed = WORKERS.reduce((s, w) => s + w.processed, 0);
  const totalFailed = WORKERS.reduce((s, w) => s + w.failed, 0);

  const scaleWorker = async (queue: string) => {
    setScalingTo(queue);
    await new Promise(r => setTimeout(r, 1500));
    setScalingTo(null);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📈</span>
            <h1 className="text-2xl font-bold text-text-primary">Infrastructure & Scaling</h1>
          </div>
          <p className="text-sm text-text-secondary">BullMQ workers, queues, and horizontal scaling controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Auto-Scale</span>
            <button onClick={() => setAutoScale(!autoScale)} className={`w-10 h-5 rounded-full transition-colors ${autoScale ? "bg-emerald-500" : "bg-navy-600"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${autoScale ? "translate-x-5.5 ml-0.5" : "ml-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Workers</div><div className="text-xl font-bold text-text-primary">{WORKERS.length}</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Queues</div><div className="text-xl font-bold text-text-primary">{QUEUES.length}</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Processed</div><div className="text-xl font-bold text-emerald-400">{(totalProcessed / 1000).toFixed(1)}K</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Failed</div><div className="text-xl font-bold text-rose-400">{totalFailed}</div></div>
        <div className="glass-card p-3"><div className="text-[10px] text-text-muted uppercase">Success Rate</div><div className="text-xl font-bold text-emerald-400">{((1 - totalFailed / totalProcessed) * 100).toFixed(2)}%</div></div>
      </div>

      {/* Queues */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Queue Status</h3>
      <div className="grid grid-cols-5 gap-3 mb-6">
        {QUEUES.map(queue => (
          <div key={queue.name} className={`glass-card p-3 ${queue.waiting > 100 ? "!border-amber-500/30" : ""}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span>{queue.icon}</span>
              <span className="text-xs font-bold text-text-primary truncate">{queue.name}</span>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-text-muted">Waiting</span><span className={`font-mono ${queue.waiting > 50 ? "text-amber-400" : "text-text-primary"}`}>{queue.waiting}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Active</span><span className="text-text-primary font-mono">{queue.active}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Workers</span><span className="text-text-primary font-mono">{queue.workers}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Throughput</span><span className="text-emerald-400 font-mono">{queue.throughput}/h</span></div>
            </div>
            <button
              onClick={() => scaleWorker(queue.name)}
              disabled={scalingTo === queue.name}
              className="w-full mt-2 py-1 rounded text-[10px] font-semibold bg-electric-500/10 text-electric-400 border border-electric-500/20 hover:bg-electric-500/20 transition-all disabled:opacity-50"
            >
              {scalingTo === queue.name ? "Scaling..." : "+1 Worker"}
            </button>
          </div>
        ))}
      </div>

      {/* Workers Table */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Active Workers</h3>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Worker</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Type</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Status</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Queue</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Processed</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">CPU</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Memory</th>
              <th className="text-left text-[10px] text-text-muted uppercase px-4 py-2">Uptime</th>
            </tr>
          </thead>
          <tbody>
            {WORKERS.map(worker => (
              <tr key={worker.id} className="border-b border-border/50 hover:bg-navy-800/30">
                <td className="px-4 py-2 text-sm text-text-primary font-mono">{worker.name}</td>
                <td className="px-4 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-700 text-text-muted">{worker.type}</span></td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    worker.status === "running" ? "bg-emerald-500/15 text-emerald-400" :
                    worker.status === "idle" ? "bg-navy-600 text-text-muted" :
                    worker.status === "draining" ? "bg-amber-500/15 text-amber-400" :
                    "bg-rose-500/15 text-rose-400"
                  }`}>{worker.status}</span>
                </td>
                <td className="px-4 py-2 text-sm text-text-secondary font-mono">{worker.queue}</td>
                <td className="px-4 py-2 text-sm text-text-primary">{worker.processed.toLocaleString()}<span className="text-rose-400 text-[10px] ml-1">({worker.failed})</span></td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div className={`h-full rounded-full ${worker.cpu > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${worker.cpu}%` }} />
                    </div>
                    <span className="text-[10px] text-text-muted">{worker.cpu}%</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div className="h-full rounded-full bg-electric-500" style={{ width: `${worker.memory}%` }} />
                    </div>
                    <span className="text-[10px] text-text-muted">{worker.memory}%</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-[11px] text-text-muted font-mono">{worker.uptime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
