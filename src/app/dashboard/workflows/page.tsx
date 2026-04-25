"use client";

import { useState } from "react";
import { PlusIcon, ChevronRightIcon } from "@/components/icons";

const workflows = [
  {
    id: "wf-001",
    name: "Fraud Alert Pipeline",
    description: "Monitors transactions → flags anomalies → sends alerts → generates reports",
    trigger: "Real-time",
    steps: 6,
    status: "active",
    lastRun: "1 min ago",
    executions: 12847,
    category: "Security",
  },
  {
    id: "wf-002",
    name: "KYC Onboarding Flow",
    description: "Collects documents → OCR extraction → identity verification → compliance check → approval",
    trigger: "On-demand",
    steps: 5,
    status: "active",
    lastRun: "4 min ago",
    executions: 3421,
    category: "Compliance",
  },
  {
    id: "wf-003",
    name: "Daily Financial Reconciliation",
    description: "Fetches bank data → matches transactions → flags discrepancies → generates ledger",
    trigger: "Scheduled (06:00)",
    steps: 4,
    status: "active",
    lastRun: "6 hours ago",
    executions: 892,
    category: "Finance",
  },
  {
    id: "wf-004",
    name: "Customer Ticket Triage",
    description: "Ingest ticket → classify intent → route to team → auto-respond → escalate if needed",
    trigger: "Real-time",
    steps: 5,
    status: "active",
    lastRun: "12 sec ago",
    executions: 8934,
    category: "Support",
  },
  {
    id: "wf-005",
    name: "Weekly Executive Report",
    description: "Aggregate metrics → analyze trends → generate insights → compile report → email C-suite",
    trigger: "Scheduled (Mon 08:00)",
    steps: 5,
    status: "active",
    lastRun: "2 days ago",
    executions: 156,
    category: "Reporting",
  },
  {
    id: "wf-006",
    name: "Invoice Processing Pipeline",
    description: "Receive invoice → OCR extract → validate → match PO → approve → schedule payment",
    trigger: "Webhook",
    steps: 6,
    status: "paused",
    lastRun: "1 hour ago",
    executions: 2134,
    category: "Finance",
  },
];

const workflowStepExample = [
  { name: "Data Ingestion", type: "trigger", description: "Listen for new transaction events via webhook" },
  { name: "Risk Scoring", type: "agent", description: "Fraud Monitoring Agent analyzes transaction patterns" },
  { name: "Threshold Check", type: "condition", description: "If risk score > 0.85, proceed to alert path" },
  { name: "Alert Generation", type: "action", description: "Create alert with details and risk assessment" },
  { name: "Team Notification", type: "integration", description: "Send notification via Slack and email" },
  { name: "Report Update", type: "agent", description: "Reporting Agent updates daily fraud summary" },
];

const stepColors: Record<string, string> = {
  trigger: "from-cyan-500 to-cyan-400",
  agent: "from-electric-500 to-violet-500",
  condition: "from-amber-500 to-amber-400",
  action: "from-emerald-500 to-emerald-400",
  integration: "from-rose-500 to-rose-400",
};

export default function WorkflowsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>("wf-001");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workflows</h1>
          <p className="text-text-secondary mt-1">Design and manage automated agent workflows</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow List */}
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => setSelectedWorkflow(wf.id)}
              className={`glass-card p-5 cursor-pointer transition-all ${
                selectedWorkflow === wf.id ? "border-electric-500/40 glow-blue" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary text-sm">{wf.name}</h3>
                    <span className={`badge text-[10px] ${wf.status === "active" ? "badge-active" : "badge-warning"}`}>
                      {wf.status}
                    </span>
                  </div>
                  <span className="badge badge-neutral text-[10px] mt-1">{wf.category}</span>
                </div>
                <ChevronRightIcon className={`w-4 h-4 text-text-muted transition-transform ${selectedWorkflow === wf.id ? "rotate-90" : ""}`} />
              </div>
              <p className="text-xs text-text-muted mb-3">{wf.description}</p>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>{wf.steps} steps</span>
                <span>•</span>
                <span>{wf.trigger}</span>
                <span>•</span>
                <span>{wf.executions.toLocaleString()} runs</span>
                <span>•</span>
                <span>{wf.lastRun}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Detail / Step Builder */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Workflow Steps</h2>
              <p className="text-sm text-text-muted">Fraud Alert Pipeline</p>
            </div>
            <button className="btn-secondary text-sm">Edit Flow</button>
          </div>

          <div className="space-y-0">
            {workflowStepExample.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < workflowStepExample.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-8 bg-gradient-to-b from-border-active to-border" />
                )}

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-elevated transition-colors">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stepColors[step.type]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-primary">{step.name}</h4>
                      <span className="badge badge-neutral text-[10px] capitalize">{step.type}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 p-3 rounded-xl border border-dashed border-border text-text-muted text-sm hover:border-electric-500/40 hover:text-electric-400 transition-colors flex items-center justify-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Step
          </button>
        </div>
      </div>
    </div>
  );
}
