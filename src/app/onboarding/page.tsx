"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  type OnboardingStateV2,
  defaultOnboardingStateV2,
} from "@/lib/onboarding/wizard-schema";

const LS_KEY = "swifter_onboarding_v2";
const TOTAL_STEPS = 9;

// ─── Types (server + local) ─────────────────────────────────────────────────

type OnboardingState = OnboardingStateV2 & { skipped?: boolean };

// ─── Department Data ─────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: "HR", label: "Human Resources", icon: "👥", description: "HR agents for onboarding, policies & people management", color: "#8b5cf6" },
  { id: "LEGAL", label: "Legal", icon: "⚖️", description: "Contract review, policy Q&A, and compliance", color: "#0891b2" },
  { id: "ENGINEERING", label: "Engineering", icon: "💻", description: "Code review, incidents, and runbooks", color: "#0d9488" },
  { id: "RISK", label: "Risk", icon: "⚠️", description: "Risk assessment, monitoring, and incident reporting", color: "#dc2626" },
  { id: "SECURITY", label: "Security", icon: "🔒", description: "Alert triage, access review, and phishing response", color: "#b45309" },
  { id: "COMPLIANCE", label: "Compliance", icon: "📋", description: "Regulation Q&A, policy checking, and audit logging", color: "#1d4ed8" },
  { id: "QA", label: "Quality Assurance", icon: "🧪", description: "Test generation, bug triage, and regression analysis", color: "#059669" },
  { id: "PRODUCT", label: "Product", icon: "💡", description: "Feedback analysis, PRD writing, and roadmap insights", color: "#7c3aed" },
  { id: "OPERATIONS", label: "Operations", icon: "⚙️", description: "Workflow automation and data analysis", color: "#475569" },
  { id: "FINANCE", label: "Finance", icon: "💰", description: "Reporting, budget analysis, and forecasting", color: "#ca8a04" },
  { id: "EXECUTIVE", label: "Executive", icon: "🎯", description: "Executive overview across all departments", color: "#be123c" },
  { id: "IT", label: "Information Technology", icon: "🖥️", description: "IT management and support agents", color: "#0369a1" },
  { id: "MARKETING", label: "Marketing", icon: "📣", description: "Campaigns, content, SEO, and brand management", color: "#e11d48" },
  { id: "DATA_ANALYTICS", label: "Data & Analytics", icon: "📊", description: "Quality checks, SQL generation, and anomaly detection", color: "#0284c7" },
  { id: "INFRA_OPS", label: "Infrastructure & Ops", icon: "🖧", description: "Incident triage, capacity planning, and SLA monitoring", color: "#374151" },
  { id: "CUSTOMER_SUPPORT", label: "Customer Support", icon: "🎧", description: "Ticket management, chatbots, and sentiment analysis", color: "#0d9488" },
] as const;

// ─── Market Data ─────────────────────────────────────────────────────────────

const MARKETS = [
  { id: "za", name: "South Africa", flag: "🇿🇦", status: "pilot", law: "POPIA", channels: "WhatsApp · Web · Mobile", recommended: true },
  { id: "ng", name: "Nigeria", flag: "🇳🇬", status: "available", law: "NDPR", channels: "WhatsApp · Web · USSD" },
  { id: "ke", name: "Kenya", flag: "🇰🇪", status: "available", law: "DPA 2019", channels: "WhatsApp · Web · M-Pesa" },
  { id: "gh", name: "Ghana", flag: "🇬🇭", status: "available", law: "DPA 2012", channels: "WhatsApp · Web · Mobile" },
  { id: "tz", name: "Tanzania", flag: "🇹🇿", status: "available", law: "PDPA 2022", channels: "WhatsApp · Web" },
  { id: "zm", name: "Zambia", flag: "🇿🇲", status: "available", law: "DPB 2021", channels: "WhatsApp · Web" },
] as const;

// ─── App Types ────────────────────────────────────────────────────────────────

const APP_TYPES = [
  { id: "website", label: "Website", icon: "🌐", inputLabel: "Your website URL", inputPlaceholder: "https://yoursite.com" },
  { id: "mobile", label: "Mobile App", icon: "📱", inputLabel: "App bundle ID / store link", inputPlaceholder: "com.yourapp or https://apps.apple.com/..." },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", inputLabel: "Business phone number", inputPlaceholder: "+27 12 345 6789" },
  { id: "portal", label: "Internal Portal", icon: "🏢", inputLabel: "Portal URL", inputPlaceholder: "https://portal.yourcompany.com" },
  { id: "api", label: "API / Backend", icon: "⚙️", inputLabel: "API base URL", inputPlaceholder: "https://api.yourcompany.com" },
] as const;

// ─── Agent Recommendations by Department ─────────────────────────────────────

const AGENT_RECOMMENDATIONS: Record<string, { id: string; icon: string; name: string; description: string; time: string }[]> = {
  HR: [
    { id: "HR_ONBOARDING", icon: "🧑‍💼", name: "HR Onboarding Agent", description: "Automates new hire onboarding checklists, document collection, and orientation scheduling.", time: "~5 min setup" },
    { id: "HR_POLICY_QA", icon: "📖", name: "HR Policy Q&A", description: "Answers employee questions about company policies, leave, and benefits instantly.", time: "~3 min setup" },
    { id: "HR_LEAVE_ASSISTANT", icon: "🏖️", name: "Leave Assistant", description: "Handles leave requests, balance checks, and calendar sync automatically.", time: "~4 min setup" },
  ],
  LEGAL: [
    { id: "LEGAL_CONTRACT_REVIEW", icon: "📄", name: "Contract Review Agent", description: "Reviews contracts for red flags, missing clauses, and compliance issues.", time: "~5 min setup" },
    { id: "LEGAL_POLICY_QA", icon: "⚖️", name: "Legal Policy Q&A", description: "Answers regulatory and policy questions with cited legal references.", time: "~3 min setup" },
    { id: "LEGAL_NDA_CLASSIFIER", icon: "🔐", name: "NDA Classifier", description: "Classifies NDA types, extracts key terms, and flags unusual provisions.", time: "~4 min setup" },
  ],
  ENGINEERING: [
    { id: "ENGINEERING_CODE_REVIEWER", icon: "🔍", name: "Code Review Agent", description: "Reviews pull requests for bugs, security issues, and code quality.", time: "~5 min setup" },
    { id: "ENGINEERING_INCIDENT_RESPONDER", icon: "🚨", name: "Incident Responder", description: "Triages incidents, suggests fixes, and coordinates runbook execution.", time: "~6 min setup" },
    { id: "ENGINEERING_RUNBOOK_ASSISTANT", icon: "📚", name: "Runbook Assistant", description: "Guides engineers through runbooks step-by-step during incidents.", time: "~3 min setup" },
  ],
  RISK: [
    { id: "RISK_FRAUD_MONITORING", icon: "🛡️", name: "Fraud Monitoring Agent", description: "Real-time transaction monitoring with ML-based fraud detection.", time: "~8 min setup" },
    { id: "RISK_ASSESSMENT", icon: "📊", name: "Risk Assessment Agent", description: "Automated risk scoring and mitigation recommendations.", time: "~5 min setup" },
    { id: "RISK_INCIDENT_REPORTER", icon: "📋", name: "Incident Reporter", description: "Auto-generates incident reports with root cause and remediation steps.", time: "~4 min setup" },
  ],
  SECURITY: [
    { id: "SECURITY_ALERT_EXPLAINER", icon: "🔔", name: "Security Alert Explainer", description: "Explains security alerts in plain English with recommended actions.", time: "~3 min setup" },
    { id: "SECURITY_PHISHING_TRIAGE", icon: "🎣", name: "Phishing Triage Agent", description: "Analyzes suspicious emails and URLs for phishing indicators.", time: "~4 min setup" },
    { id: "SECURITY_ACCESS_REVIEW", icon: "🔑", name: "Access Review Agent", description: "Periodic automated access reviews with anomaly flagging.", time: "~6 min setup" },
  ],
  COMPLIANCE: [
    { id: "COMPLIANCE_REGULATION_QA", icon: "📜", name: "Regulation Q&A Agent", description: "Answers questions about GDPR, POPIA, NDPR, and other regulations.", time: "~3 min setup" },
    { id: "COMPLIANCE_POLICY_CHECKER", icon: "✅", name: "Policy Checker", description: "Validates internal documents against regulatory requirements.", time: "~5 min setup" },
    { id: "COMPLIANCE_AUDIT_LOGGER", icon: "🗂️", name: "Audit Logger Agent", description: "Automatically logs compliance events for audit trail.", time: "~4 min setup" },
  ],
  QA: [
    { id: "QA_TEST_CASE_GENERATOR", icon: "🧪", name: "Test Case Generator", description: "Generates comprehensive test cases from requirements and user stories.", time: "~4 min setup" },
    { id: "QA_BUG_TRIAGE", icon: "🐛", name: "Bug Triage Agent", description: "Classifies, prioritises, and routes bug reports automatically.", time: "~3 min setup" },
    { id: "QA_REGRESSION_ANALYST", icon: "📉", name: "Regression Analyst", description: "Identifies regression risk areas and suggests targeted test runs.", time: "~5 min setup" },
  ],
  PRODUCT: [
    { id: "PRODUCT_FEEDBACK_SUMMARISER", icon: "💬", name: "Feedback Summariser", description: "Aggregates and summarises product feedback from multiple channels.", time: "~3 min setup" },
    { id: "PRODUCT_PRD_ASSISTANT", icon: "✍️", name: "PRD Writing Assistant", description: "Helps write and refine product requirement documents.", time: "~4 min setup" },
    { id: "PRODUCT_ROADMAP_ANALYST", icon: "🗺️", name: "Roadmap Analyst", description: "Analyses backlog and suggests prioritisation based on impact.", time: "~5 min setup" },
  ],
  OPERATIONS: [
    { id: "OPERATIONS_WORKFLOW_AUTOMATION", icon: "⚙️", name: "Workflow Automation Agent", description: "Automates repetitive operational tasks and approval workflows.", time: "~5 min setup" },
    { id: "OPERATIONS_DATA_ANALYST", icon: "📊", name: "Operations Data Analyst", description: "Analyses operational metrics and generates actionable insights.", time: "~4 min setup" },
  ],
  FINANCE: [
    { id: "FINANCE_REPORTING", icon: "📈", name: "Finance Reporting Agent", description: "Generates automated financial reports with trend analysis.", time: "~5 min setup" },
    { id: "FINANCE_BUDGET_ANALYST", icon: "💰", name: "Budget Analyst Agent", description: "Monitors budget vs actuals and flags variances in real time.", time: "~4 min setup" },
  ],
  EXECUTIVE: [
    { id: "EXEC_DASHBOARD_SUMMARISER", icon: "🎯", name: "Executive Briefing Agent", description: "Daily AI-generated executive briefings across all departments.", time: "~3 min setup" },
    { id: "EXEC_KPI_MONITOR", icon: "📊", name: "KPI Monitor", description: "Tracks key performance indicators and alerts on deviations.", time: "~5 min setup" },
    { id: "EXEC_BOARD_REPORT", icon: "📋", name: "Board Report Generator", description: "Auto-generates board-ready reports from operational data.", time: "~6 min setup" },
  ],
  IT: [
    { id: "IT_HELPDESK_BOT", icon: "🎫", name: "IT Helpdesk Bot", description: "Resolves common IT issues automatically via chat.", time: "~4 min setup" },
    { id: "IT_ACCESS_PROVISIONER", icon: "🔐", name: "Access Provisioner", description: "Automates user account creation, access requests, and offboarding.", time: "~6 min setup" },
    { id: "IT_ASSET_TRACKER", icon: "🖥️", name: "Asset Tracker", description: "Tracks hardware and software assets with automated inventory.", time: "~5 min setup" },
  ],
  MARKETING: [
    { id: "MARKETING_CAMPAIGN_COPYWRITER", icon: "✍️", name: "Campaign Copywriter", description: "Generates on-brand ad copy, emails, and social content at scale.", time: "~3 min setup" },
    { id: "MARKETING_SEO_OPTIMIZER", icon: "🔍", name: "SEO Optimiser", description: "Analyses content and suggests SEO improvements automatically.", time: "~4 min setup" },
    { id: "MARKETING_SOCIAL_MEDIA", icon: "📣", name: "Social Media Agent", description: "Schedules, publishes, and monitors social media posts.", time: "~5 min setup" },
  ],
  DATA_ANALYTICS: [
    { id: "DATA_QUALITY_CHECKER", icon: "✅", name: "Data Quality Checker", description: "Validates data pipelines and flags quality issues automatically.", time: "~4 min setup" },
    { id: "DATA_SQL_GENERATOR", icon: "🗄️", name: "SQL Generator Agent", description: "Generates complex SQL queries from natural language questions.", time: "~3 min setup" },
    { id: "DATA_ANOMALY_DETECTOR", icon: "🚨", name: "Anomaly Detector", description: "Real-time detection of data anomalies and statistical outliers.", time: "~5 min setup" },
  ],
  INFRA_OPS: [
    { id: "INFRA_INCIDENT_TRIAGE", icon: "🚨", name: "Incident Triage Agent", description: "Auto-triages infrastructure incidents and notifies the right team.", time: "~5 min setup" },
    { id: "INFRA_CAPACITY_PLANNING", icon: "📈", name: "Capacity Planner", description: "Forecasts resource needs and recommends scaling actions.", time: "~6 min setup" },
    { id: "INFRA_SLA_MONITOR", icon: "📊", name: "SLA Monitor", description: "Monitors SLA compliance and alerts before breaches occur.", time: "~4 min setup" },
  ],
  CUSTOMER_SUPPORT: [
    { id: "SUPPORT_TICKET_CLASSIFIER", icon: "🎫", name: "Ticket Classifier", description: "Auto-classifies and routes support tickets to the right team.", time: "~3 min setup" },
    { id: "CHATBOT_WHATSAPP_BOT", icon: "💬", name: "WhatsApp Support Bot", description: "24/7 AI customer support via WhatsApp Business API.", time: "~6 min setup" },
    { id: "SUPPORT_RESPONSE_DRAFTER", icon: "✍️", name: "Response Drafter", description: "Drafts personalised support responses from ticket context.", time: "~4 min setup" },
  ],
};

// Fallback agents for any department not explicitly mapped
const DEFAULT_AGENTS = [
  { id: "GENERAL_ASSISTANT", icon: "🤖", name: "General Assistant Agent", description: "A versatile AI agent that handles common tasks in your department.", time: "~3 min setup" },
  { id: "REPORTING_AGENT", icon: "📊", name: "Reporting Agent", description: "Auto-generates weekly summaries and status reports.", time: "~4 min setup" },
  { id: "WORKFLOW_AGENT", icon: "⚙️", name: "Workflow Automation Agent", description: "Automates repetitive tasks and sends smart notifications.", time: "~5 min setup" },
];

function getAgentsForDepartment(deptId: string | null) {
  if (!deptId) return DEFAULT_AGENTS;
  return (AGENT_RECOMMENDATIONS[deptId] ?? DEFAULT_AGENTS).slice(0, 3);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadState(): OnboardingState {
  const base = defaultState();
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OnboardingState>;
      return { ...base, ...parsed } as OnboardingState;
    }
  } catch {
    // ignore parse errors
  }
  return base;
}

function defaultState(): OnboardingState {
  return { ...defaultOnboardingStateV2() };
}

function saveState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-[3px] bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-electric-500 to-violet-500 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                done
                  ? "bg-electric-500 text-white"
                  : active
                  ? "bg-electric-500/20 border border-electric-500 text-electric-400"
                  : "bg-white/5 border border-white/10 text-text-muted"
              }`}
            >
              {done ? "✓" : n}
            </div>
            {i < total - 1 && (
              <div className={`w-8 h-px transition-all duration-500 ${done ? "bg-electric-500" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [mounted, setMounted] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "offline">("idle");
  const skipNextAutosync = useRef(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const local = loadState();
      let merged: OnboardingState = { ...defaultState(), ...local };
      try {
        const r = await fetch("/api/onboarding/progress", { cache: "no-store" });
        const j = await r.json();
        if (!cancel && j?.success && j.data?.state && typeof j.data.state === "object") {
          merged = {
            ...defaultState(),
            ...local,
            ...j.data.state,
            skipped: (j.data.state as OnboardingState).skipped ?? local.skipped,
          };
        }
      } catch {
        // offline / no DB: keep local
      }
      if (cancel) return;
      if (merged.completed) {
        router.push("/dashboard");
        return;
      }
      setState(merged);
      saveState(merged);
      setMounted(true);
    })();
    return () => {
      cancel = true;
    };
  }, [router]);

  const update = useCallback(
    (patch: Partial<OnboardingState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        saveState(next);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!mounted) return;
    if (skipNextAutosync.current) {
      skipNextAutosync.current = false;
      return;
    }
    const body: OnboardingStateV2 = {
      completed: state.completed,
      step: state.step,
      department: state.department,
      markets: state.markets,
      dataResidencyAck: state.dataResidencyAck,
      auditLoggingEnabled: state.auditLoggingEnabled,
      connectSso: state.connectSso,
      connectMessaging: state.connectMessaging,
      connectHris: state.connectHris,
      connectCrm: state.connectCrm,
      connectWhatsapp: state.connectWhatsapp,
      connectApi: state.connectApi,
      deployApprovalRequired: state.deployApprovalRequired,
      approverScope: state.approverScope,
      hitlHighRisk: state.hitlHighRisk,
      appType: state.appType,
      appUrl: state.appUrl,
      selectedAgent: state.selectedAgent,
      completedAt: state.completedAt,
    };
    const t = setTimeout(() => {
      setSyncStatus("idle");
      const putBody =
        state.skipped === true ? { ...body, skipped: true } : { ...body };
      fetch("/api/onboarding/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(putBody),
      })
        .then((r) => (r.ok ? "synced" : "offline") as "synced" | "offline")
        .then((s) => setSyncStatus(s))
        .catch(() => setSyncStatus("offline"));
    }, 500);
    return () => clearTimeout(t);
  }, [mounted, state]);

  function nextStep() {
    update({ step: Math.min(state.step + 1, TOTAL_STEPS) });
  }

  function prevStep() {
    update({ step: Math.max(state.step - 1, 1) });
  }

  function toServerPayload(s: OnboardingState): OnboardingStateV2 & { skipped?: boolean } {
    return {
      completed: s.completed,
      step: s.step,
      department: s.department,
      markets: s.markets,
      dataResidencyAck: s.dataResidencyAck,
      auditLoggingEnabled: s.auditLoggingEnabled,
      connectSso: s.connectSso,
      connectMessaging: s.connectMessaging,
      connectHris: s.connectHris,
      connectCrm: s.connectCrm,
      connectWhatsapp: s.connectWhatsapp,
      connectApi: s.connectApi,
      deployApprovalRequired: s.deployApprovalRequired,
      approverScope: s.approverScope,
      hitlHighRisk: s.hitlHighRisk,
      appType: s.appType,
      appUrl: s.appUrl,
      selectedAgent: s.selectedAgent,
      completedAt: s.completedAt,
      ...(s.skipped === true ? { skipped: true } : {}),
    };
  }

  async function handleSkip() {
    const skipped: OnboardingState = {
      ...state,
      completed: true,
      skipped: true,
      completedAt: new Date().toISOString(),
    };
    saveState(skipped);
    setState(skipped);
    try {
      await fetch("/api/onboarding/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toServerPayload(skipped)),
      });
    } catch {
      // offline: localStorage still has progress
    }
    router.push("/dashboard");
  }

  async function handleDeploy() {
    setDeploying(true);
    await new Promise((r) => setTimeout(r, 2200));
    setDeploying(false);
    setDeployed(true);
    const completed: OnboardingState = {
      ...state,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    setState(completed);
    saveState(completed);
    try {
      await fetch("/api/onboarding/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toServerPayload(completed)),
      });
      setSyncStatus("synced");
    } catch {
      setSyncStatus("offline");
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-electric-500/30 border-t-electric-500 rounded-full animate-spin" />
      </div>
    );
  }

  const agents = getAgentsForDepartment(state.department);

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Progress bar */}
      {!deployed && <ProgressBar step={state.step} />}

      {/* Skip button */}
      {!deployed && (
        <div className="fixed top-5 right-6 z-50">
          <button
            onClick={handleSkip}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Skip for now →
          </button>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          {/* Step indicator */}
          {!deployed && (
            <div className="flex items-center justify-between mb-10 flex-wrap gap-2">
              <StepIndicator current={state.step} total={TOTAL_STEPS} />
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>
                  Step {state.step} of {TOTAL_STEPS}
                </span>
                {syncStatus === "synced" && (
                  <span className="text-emerald-500/90">Saved to cloud</span>
                )}
                {syncStatus === "offline" && (
                  <span className="text-amber-500/90">Local only (sync when online)</span>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 1: Welcome ─── */}
          {state.step === 1 && (
            <div className="animate-fade-in text-center space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-500/10 border border-electric-500/20 text-electric-400 text-sm font-medium mb-2">
                  <span className="w-2 h-2 rounded-full bg-electric-400 animate-pulse" />
                  New account activated
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-text-primary leading-tight">
                  Welcome to{" "}
                  <span className="gradient-text">AI Platform</span>
                </h1>
                <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
                  Configure governance, connections, and your first agent in about{" "}
                  <span className="text-electric-400 font-semibold">6–8 minutes</span>.
                </p>
              </div>

              {/* What to expect */}
              <div className="glass-card p-6 text-left space-y-2.5 max-w-lg mx-auto">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">
                  What we&apos;ll set up
                </p>
                {[
                  { icon: "🏢", label: "Department & primary use case" },
                  { icon: "🌍", label: "Markets & data regions" },
                  { icon: "🛡️", label: "Compliance & data residency baselines" },
                  { icon: "🔌", label: "Connect: SSO, messaging, HR, CRM, WhatsApp, APIs" },
                  { icon: "✅", label: "Approvals: who signs off, HITL for high-risk" },
                  { icon: "📲", label: "First app or channel to deploy to" },
                  { icon: "📋", label: "Review configuration before go-live" },
                  { icon: "🤖", label: "First AI agent deployment" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-base shrink-0 w-6 text-center">{item.icon}</span>
                    <span className="text-sm text-text-secondary leading-snug">{item.label}</span>
                  </div>
                ))}
                <p className="text-[11px] text-text-muted pt-2 border-t border-border mt-2">
                  Deep configuration continues in <span className="text-electric-400">Settings</span> after onboarding — this wizard captures your intent and policy defaults.
                </p>
              </div>

              <button
                onClick={nextStep}
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5"
              >
                Let&apos;s get started <span>→</span>
              </button>
            </div>
          )}

          {/* ─── Step 2: Department ─── */}
          {state.step === 2 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">What&apos;s your primary role?</h2>
                <p className="text-text-secondary">
                  We&apos;ll recommend the best agents and workflows for your team.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {DEPARTMENTS.map((dept) => {
                  const selected = state.department === dept.id;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => update({ department: dept.id })}
                      className={`group relative glass-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-electric-500/60 shadow-[0_0_24px_rgba(59,130,246,0.15)]"
                          : "hover:border-white/20"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-electric-500 flex items-center justify-center">
                          <span className="text-white text-[9px] font-bold">✓</span>
                        </div>
                      )}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2 transition-transform duration-200 group-hover:scale-110"
                        style={{ background: `${dept.color}20`, boxShadow: selected ? `0 0 12px ${dept.color}30` : undefined }}
                      >
                        {dept.icon}
                      </div>
                      <div className="text-sm font-semibold text-text-primary leading-tight">{dept.label}</div>
                      <div className="text-[10px] text-text-muted mt-1 leading-tight line-clamp-2">
                        {dept.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!state.department}
                  className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Markets ─── */}
          {state.step === 3 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">Where will you deploy first?</h2>
                <p className="text-text-secondary">
                  Select the markets where your agents will operate.
                </p>
              </div>

              {/* Tip box */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-electric-500/10 border border-electric-500/20">
                <span className="text-xl shrink-0">💡</span>
                <p className="text-sm text-electric-300">
                  <span className="font-semibold">South Africa is recommended as your pilot market.</span>{" "}
                  It has the most mature regulatory framework (POPIA) and the widest channel support.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MARKETS.map((market) => {
                  const selected = state.markets.includes(market.id);
                  return (
                    <button
                      key={market.id}
                      onClick={() => {
                        const next = selected
                          ? state.markets.filter((m) => m !== market.id)
                          : [...state.markets, market.id];
                        update({ markets: next });
                      }}
                      className={`glass-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-electric-500/60 shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                          : "hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{market.flag}</span>
                          <div>
                            <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                              {market.name}
                              {"recommended" in market && market.recommended && (
                                <span className="badge badge-active text-[9px] px-2 py-0.5">Recommended</span>
                              )}
                            </div>
                            <div className="text-[10px] text-text-muted">{market.law}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`badge text-[9px] px-2 py-0.5 ${
                              market.status === "pilot" ? "badge-active" : "badge-info"
                            }`}
                          >
                            {market.status}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              selected
                                ? "bg-electric-500 border-electric-500"
                                : "border-white/20"
                            }`}
                          >
                            {selected && (
                              <span className="text-white text-[10px] font-bold">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-text-muted">{market.channels}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={state.markets.length === 0}
                  className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Compliance & data setup ─── */}
          {state.step === 4 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">Compliance & data baseline</h2>
                <p className="text-text-secondary max-w-xl mx-auto">
                  Align the platform with how your organisation governs data before you connect systems or deploy agents.
                </p>
              </div>

              <div className="glass-card p-5 space-y-4 border-amber-500/20">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={state.dataResidencyAck}
                    onChange={(e) => update({ dataResidencyAck: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-border bg-navy-800 text-electric-500 accent-electric-500"
                  />
                  <span>
                    <span className="text-sm font-medium text-text-primary">I confirm our processing aligns with each selected market&apos;s data laws</span>
                    <span className="block text-xs text-text-muted mt-1 leading-relaxed">
                      e.g. POPIA (ZA), NDPR (NG), and your internal data classification. You can attach evidence packs in Settings later.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={state.auditLoggingEnabled}
                    onChange={(e) => update({ auditLoggingEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-border bg-navy-800 text-electric-500 accent-electric-500"
                  />
                  <span>
                    <span className="text-sm font-medium text-text-primary">Enable audit logging for agent actions by default</span>
                    <span className="block text-xs text-text-muted mt-1">Recommended for regulated and enterprise tenants. You can refine retention in Governance.</span>
                  </span>
                </label>
              </div>

              <p className="text-center text-[11px] text-text-muted">
                Next: choose which systems you want to <span className="text-electric-400">connect</span> — you can complete OAuth and webhooks in Settings.
              </p>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!state.dataResidencyAck}
                  className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 5: Connect integrations ─── */}
          {state.step === 5 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">Connect your stack</h2>
                <p className="text-text-secondary max-w-xl mx-auto">
                  Select what you plan to connect. This sets up your checklist — actual OAuth, tokens, and webhooks are completed in <strong className="text-text-primary">Settings → Integrations</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "connectSso" as const, icon: "🔐", label: "SSO / IdP", sub: "Azure AD, Okta, SAML" },
                  { key: "connectMessaging" as const, icon: "💬", label: "Slack or Teams", sub: "Approvals & alerts" },
                  { key: "connectHris" as const, icon: "👤", label: "HR / Workday", sub: "Employee context" },
                  { key: "connectCrm" as const, icon: "🧾", label: "CRM", sub: "Salesforce, HubSpot…" },
                  { key: "connectWhatsapp" as const, icon: "📱", label: "WhatsApp Business", sub: "Cloud API" },
                  { key: "connectApi" as const, icon: "🔗", label: "Internal APIs", sub: "Keys & webhooks" },
                ].map((row) => {
                  const on = state[row.key];
                  return (
                    <button
                      type="button"
                      key={row.key}
                      onClick={() => update({ [row.key]: !on })}
                      className={`glass-card p-4 text-left flex items-start gap-3 transition-all ${
                        on ? "border-electric-500/50 bg-electric-500/5" : "hover:border-white/20"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{row.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-primary">{row.label}</div>
                        <div className="text-[11px] text-text-muted">{row.sub}</div>
                      </div>
                      <div
                        className={`ml-auto w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          on ? "bg-electric-500 border-electric-500" : "border-white/25"
                        }`}
                      >
                        {on && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-text-muted text-center max-w-2xl mx-auto">
                Nothing here blocks you from finishing onboarding — you can return anytime. Links:{" "}
                <a className="text-electric-400 hover:underline" href="/dashboard/settings/sso">SSO</a>
                {" · "}
                <a className="text-electric-400 hover:underline" href="/dashboard/integrations">Integrations</a>
                {" · "}
                <a className="text-electric-400 hover:underline" href="/dashboard/settings/whatsapp">WhatsApp</a>
              </p>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary text-sm px-6 py-2.5">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 6: Approvals & governance ─── */}
          {state.step === 6 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">Approvals & governance</h2>
                <p className="text-text-secondary max-w-xl mx-auto">
                  Define who must sign off on agent changes and when human review (HITL) applies — aligned with your enterprise risk model.
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="glass-card p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">New agent & deployment approvals</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.deployApprovalRequired}
                      onChange={(e) => update({ deployApprovalRequired: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-navy-800 accent-electric-500"
                    />
                    <span className="text-sm text-text-primary">Require an approval before an agent is deployed or materially changed in production</span>
                  </label>
                  <div className="pl-7 space-y-2">
                    <p className="text-[11px] text-text-muted">Default approver role for this tenant (can be refined per department later):</p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: "owner" as const, label: "Owner" },
                          { id: "admin" as const, label: "Admin" },
                          { id: "security" as const, label: "Security" },
                          { id: "compliance" as const, label: "Compliance" },
                        ] as const
                      ).map((o) => (
                        <button
                          type="button"
                          key={o.id}
                          onClick={() => update({ approverScope: o.id })}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            state.approverScope === o.id
                              ? "border-electric-500 bg-electric-500/10 text-electric-300"
                              : "border-border text-text-secondary hover:border-white/20"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.hitlHighRisk}
                      onChange={(e) => update({ hitlHighRisk: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-border bg-navy-800 accent-electric-500"
                    />
                    <span>
                      <span className="text-sm font-medium text-text-primary">Human-in-the-loop (HITL) for high-risk actions</span>
                      <span className="block text-xs text-text-muted mt-1">
                        e.g. bulk messaging, PII access, or production config changes. Exceptions can be created under{" "}
                        <span className="text-electric-400">Approvals</span> in the dashboard.
                      </span>
                    </span>
                  </label>
                </div>

                <p className="text-[11px] text-text-muted text-center">
                  You&apos;ll use <a className="text-electric-400 hover:underline" href="/dashboard/approvals">Approvals</a> to process review queues. Policies can be tightened in Settings.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 max-w-2xl mx-auto w-full">
                <button type="button" onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary text-sm px-6 py-2.5">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 7: Connect app / channel ─── */}
          {state.step === 7 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">
                  Which app will your agent appear in?
                </h2>
                <p className="text-text-secondary">
                  Choose where you want to deploy your first AI agent.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {APP_TYPES.map((app) => {
                  const selected = state.appType === app.id;
                  return (
                    <button
                      key={app.id}
                      onClick={() => update({ appType: app.id })}
                      className={`glass-card p-5 flex flex-col items-center gap-2 text-center transition-all duration-200 hover:-translate-y-1 ${
                        selected
                          ? "border-electric-500/60 shadow-[0_0_24px_rgba(59,130,246,0.15)]"
                          : "hover:border-white/20"
                      }`}
                    >
                      <span className="text-3xl">{app.icon}</span>
                      <span className="text-xs font-semibold text-text-primary">{app.label}</span>
                      {selected && (
                        <span className="w-4 h-4 rounded-full bg-electric-500 flex items-center justify-center text-white text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic form based on selected type */}
              {state.appType && (() => {
                const appConfig = APP_TYPES.find((a) => a.id === state.appType)!;
                return (
                  <div className="glass-card p-5 space-y-3">
                    <label className="block text-sm font-medium text-text-secondary">
                      {appConfig.inputLabel}
                    </label>
                    <input
                      type="text"
                      value={state.appUrl}
                      onChange={(e) => update({ appUrl: e.target.value })}
                      placeholder={appConfig.inputPlaceholder}
                      className="w-full bg-navy-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
                    />
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-2">
                <button onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!state.appType}
                  className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 8: Review configuration ─── */}
          {state.step === 8 && (
            <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">Review your configuration</h2>
                <p className="text-text-secondary text-sm">
                  Summary before you pick and deploy an agent. Use <strong className="text-text-primary">Back</strong> to change any step.
                </p>
              </div>

              <div className="glass-card p-5 space-y-4 text-left">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">Department</p>
                    <p className="text-text-primary font-medium">{DEPARTMENTS.find((d) => d.id === state.department)?.label ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">Markets</p>
                    <p className="text-text-primary font-medium">
                      {state.markets
                        .map((id) => MARKETS.find((m) => m.id === id)?.name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">Compliance</p>
                    <p className="text-text-primary">
                      {state.dataResidencyAck ? "Residency / laws acknowledged" : "—"}{" "}
                      {state.auditLoggingEnabled && (
                        <span className="text-text-muted"> · audit logging on</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">Connections (intent)</p>
                    <p className="text-text-primary text-xs leading-relaxed">
                      {[
                        state.connectSso && "SSO",
                        state.connectMessaging && "Slack/Teams",
                        state.connectHris && "HR",
                        state.connectCrm && "CRM",
                        state.connectWhatsapp && "WhatsApp",
                        state.connectApi && "APIs",
                      ]
                        .filter(Boolean)
                        .join(", ") || "None selected yet"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] text-text-muted uppercase font-semibold">Approvals & HITL</p>
                    <p className="text-text-primary text-sm">
                      {state.deployApprovalRequired
                        ? `Approvals required · default approver: ${state.approverScope}`
                        : "No deployment approval gate"}
                      {state.hitlHighRisk && " · HITL for high-risk actions"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] text-text-muted uppercase font-semibold">First channel / app</p>
                    <p className="text-text-primary">
                      {APP_TYPES.find((a) => a.id === state.appType)?.label ?? "—"}
                      {state.appUrl && (
                        <span className="text-text-muted text-xs break-all block mt-0.5">{state.appUrl}</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted border-t border-border pt-3">
                  Fine-tune policies anytime under Settings, Approvals, and Integrations. This review does not lock legal terms — it captures operational defaults.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary text-sm px-6 py-2.5">
                  Continue to agent →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 9: Deploy Agent ─── */}
          {state.step === 9 && !deployed && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-text-primary">Deploy your first AI agent</h2>
                <p className="text-text-secondary">
                  Based on your{" "}
                  <span className="text-electric-400 font-medium">
                    {DEPARTMENTS.find((d) => d.id === state.department)?.label ?? "team"}
                  </span>{" "}
                  department, here are our top recommendations.
                </p>
              </div>

              <div className="space-y-3">
                {agents.map((agent) => {
                  const selected = state.selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => update({ selectedAgent: agent.id })}
                      className={`w-full glass-card p-5 flex items-center gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-electric-500/60 shadow-[0_0_24px_rgba(59,130,246,0.15)]"
                          : "hover:border-white/20"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-navy-800 flex items-center justify-center text-2xl shrink-0">
                        {agent.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-text-primary">{agent.name}</span>
                          <span className="badge badge-info text-[9px] px-2 py-0.5">beginner</span>
                          <span className="text-[10px] text-text-muted font-mono">{agent.time}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{agent.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? "bg-electric-500 border-electric-500" : "border-white/20"
                        }`}
                      >
                        {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                  ← Back
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!state.selectedAgent || deploying}
                  className="btn-primary text-sm px-7 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-2"
                >
                  {deploying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deploying…
                    </>
                  ) : (
                    <>🚀 Deploy Agent →</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── Completion ─── */}
          {deployed && (
            <div className="animate-fade-in text-center space-y-8">
              {/* Success animation */}
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                    <span className="text-4xl">✓</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-text-primary">You&apos;re all set!</h2>
                <p className="text-lg text-emerald-400 font-medium">
                  ✓ Your first agent is being configured
                </p>
                <p className="text-text-secondary max-w-sm mx-auto">
                  Your{" "}
                  <span className="text-text-primary font-medium">
                    {agents.find((a) => a.id === state.selectedAgent)?.name ?? "agent"}
                  </span>{" "}
                  is deploying now. You&apos;ll receive a notification when it&apos;s ready.
                </p>
              </div>

              {/* Summary */}
              <div className="glass-card p-5 text-left space-y-3 max-w-md mx-auto">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                  Setup summary
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">Department</span>
                    <span className="text-text-primary font-medium text-right">
                      {DEPARTMENTS.find((d) => d.id === state.department)?.label ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">Markets</span>
                    <span className="text-text-primary font-medium text-right text-xs">
                      {state.markets
                        .map((id) => MARKETS.find((m) => m.id === id)?.name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">Compliance</span>
                    <span className="text-text-primary font-medium text-right text-xs">
                      {state.dataResidencyAck ? "Laws acknowledged" : "—"}
                      {state.auditLoggingEnabled && " · audit on"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">Connect</span>
                    <span className="text-text-primary font-medium text-right text-xs">
                      {[
                        state.connectSso && "SSO",
                        state.connectMessaging && "Slack/Teams",
                        state.connectHris && "HR",
                        state.connectCrm && "CRM",
                        state.connectWhatsapp && "WhatsApp",
                        state.connectApi && "APIs",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">Approvals</span>
                    <span className="text-text-primary font-medium text-right text-xs">
                      {state.deployApprovalRequired
                        ? `On · ${state.approverScope}`
                        : "Off"}{" "}
                      {state.hitlHighRisk && "· HITL"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">App / channel</span>
                    <span className="text-text-primary font-medium text-right text-xs">
                      {APP_TYPES.find((a) => a.id === state.appType)?.label ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-muted shrink-0">Agent</span>
                    <span className="text-text-primary font-medium truncate text-right max-w-[200px]">
                      {agents.find((a) => a.id === state.selectedAgent)?.name ?? "—"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted pt-1">
                  Next: finish integrations in Settings, then route approvals in <span className="text-electric-400">Approvals</span>.
                </p>
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5"
              >
                → Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
