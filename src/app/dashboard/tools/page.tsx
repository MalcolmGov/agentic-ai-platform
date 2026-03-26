"use client";

import { useState } from "react";

const tools = [
  { id: "tool_1", name: "calculate_risk_score", description: "Calculate risk score from transaction attributes", status: "active" as const, version: 2, executions: 1247, avgLatency: "3ms", successRate: 99.8, updatedAgo: "2 days ago" },
  { id: "tool_2", name: "format_currency", description: "Format a number as currency string", status: "active" as const, version: 1, executions: 3891, avgLatency: "1ms", successRate: 100, updatedAgo: "3 weeks ago" },
  { id: "tool_3", name: "classify_ticket_priority", description: "Classify support ticket priority based on keywords", status: "active" as const, version: 3, executions: 892, avgLatency: "2ms", successRate: 96, updatedAgo: "5 days ago" },
];

const stats = { total: 3, active: 3, draft: 0, totalExecutions: 6030 };
const statusStyles: Record<string, string> = { active: "bg-emerald-500/15 text-emerald-400", draft: "bg-amber-500/15 text-amber-400", deprecated: "bg-rose-500/15 text-rose-400" };

const sampleCode = `// Calculate risk based on input attributes
const score = (input.amount > 10000 ? 0.4 : 0.1)
  + (input.isNewCustomer ? 0.3 : 0)
  + (['CY','RU','IR'].includes(input.country) ? 0.3 : 0);
const level = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
return { score: Math.min(1, score), level };`;

export default function CustomToolsPage() {
  const [activeTab, setActiveTab] = useState<"library" | "builder">("library");
  const [testOutput, setTestOutput] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Custom Tool SDK</h1>
          <p className="text-text-secondary mt-1">Create, test, and deploy custom agent tools with sandboxed execution</p>
        </div>
        <div className="flex gap-1">
          {(["library", "builder"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${tab === activeTab ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
              {tab === "builder" ? "Tool Builder" : "Tool Library"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Tools", value: stats.total, color: "text-electric-400" },
          { label: "Active", value: stats.active, color: "text-emerald-400" },
          { label: "Drafts", value: stats.draft, color: "text-amber-400" },
          { label: "Total Executions", value: stats.totalExecutions.toLocaleString(), color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {activeTab === "library" && (
        <div className="space-y-3">
          {tools.map((tool) => (
            <div key={tool.id} className="glass-card p-5 hover:border-electric-500/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-sm font-semibold text-electric-400 font-mono">{tool.name}</code>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${statusStyles[tool.status]}`}>{tool.status}</span>
                <span className="text-[10px] text-text-muted">v{tool.version}</span>
                <span className="text-[10px] text-text-muted ml-auto">{tool.updatedAgo}</span>
              </div>
              <p className="text-xs text-text-muted mb-3">{tool.description}</p>
              <div className="flex items-center gap-6">
                <div className="text-[10px] text-text-muted"><span className="text-text-primary font-semibold">{tool.executions.toLocaleString()}</span> executions</div>
                <div className="text-[10px] text-text-muted"><span className="text-text-primary font-semibold">{tool.avgLatency}</span> avg latency</div>
                <div className="text-[10px] text-text-muted"><span className="text-emerald-400 font-semibold">{tool.successRate}%</span> success</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Tool Code</h2>
            <div className="space-y-3 mb-4">
              <input type="text" defaultValue="calculate_risk_score" placeholder="tool_name" className="w-full px-3 py-2 text-xs rounded-lg bg-navy-800/60 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric-500/50 font-mono" />
              <input type="text" defaultValue="Calculate risk score from transaction attributes" placeholder="Description" className="w-full px-3 py-2 text-xs rounded-lg bg-navy-800/60 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric-500/50" />
            </div>
            <pre className="p-4 rounded-xl bg-navy-900 border border-border text-xs text-text-secondary font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{sampleCode}</pre>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setTestOutput(JSON.stringify({ score: 0.7, level: "medium" }, null, 2))} className="flex-1 py-2 text-xs font-semibold rounded-lg bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 transition-colors">Test Tool</button>
              <button className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">Save &amp; Deploy</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Test Input</h2>
              <pre className="p-4 rounded-xl bg-navy-900 border border-border text-xs text-text-secondary font-mono">{`{\n  "amount": 25000,\n  "country": "CY",\n  "isNewCustomer": true\n}`}</pre>
            </div>
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Test Output</h2>
              {testOutput ? (
                <pre className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400 font-mono">{testOutput}</pre>
              ) : (
                <div className="text-center py-6 text-text-muted text-xs">Click &quot;Test Tool&quot; to see output</div>
              )}
            </div>
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Security Sandbox</h2>
              <div className="space-y-1.5">
                {["No filesystem access", "No network unless whitelisted", "5-second execution timeout", "No require() or import()", "Isolated per execution"].map((rule) => (
                  <div key={rule} className="flex items-center gap-2 text-xs text-text-muted"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{rule}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
