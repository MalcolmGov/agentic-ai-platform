"use client";

import { useState, useEffect, useRef } from "react";

// ─── Mock Ticket Data ──────────────────────

interface Ticket {
  id: string;
  author: string;
  department: string;
  category: string;
  priority: "P1" | "P2" | "P3" | "P4";
  subject: string;
  description: string;
  time: string;
  status: "open" | "processing" | "auto-resolved" | "escalated" | "assigned";
  resolution?: string;
  assignedTo?: string;
  agentSteps?: string[];
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: "TKT-4001", author: "Jessica Park", department: "Marketing", category: "Password Reset",
    priority: "P4", subject: "Can't log into Salesforce — forgot password",
    description: "I changed my password last week and now I can't remember the new one. I've tried the reset link but it says my email isn't found. I need access urgently for a client call at 2pm.",
    time: "8 min ago", status: "open",
  },
  {
    id: "TKT-4002", author: "Raj Patel", department: "Engineering", category: "Access Request",
    priority: "P3", subject: "Need AWS Console access for new project",
    description: "I've been assigned to the Orion project and need AWS Console access with IAM permissions for S3, Lambda, and DynamoDB. Manager approval: approved by @michael.chen on 03/24.",
    time: "22 min ago", status: "open",
  },
  {
    id: "TKT-4003", author: "Maria Garcia", department: "Finance", category: "Software Install",
    priority: "P3", subject: "Install Tableau Desktop on my laptop",
    description: "I need Tableau Desktop 2024.1 installed on my Windows laptop (asset tag: FIN-LP-0847). I have a valid enterprise license — license key attached in the PDF. IT policy approval ref: SW-2026-0341.",
    time: "35 min ago", status: "open",
  },
  {
    id: "TKT-4004", author: "David Kim", department: "Sales", category: "VPN Issue",
    priority: "P2", subject: "VPN disconnects every 10 minutes — can't work remotely",
    description: "Since Monday, my GlobalProtect VPN drops every 10 minutes. I'm on Comcast 200Mbps, Windows 11, GP version 6.1.4. I've reinstalled and restarted multiple times. This is severely impacting my ability to work.",
    time: "1h ago", status: "open",
  },
  {
    id: "TKT-4005", author: "Sarah Chen", department: "Product", category: "Hardware Issue",
    priority: "P2", subject: "Laptop screen flickering and overheating",
    description: "My MacBook Pro M3 (asset: ENG-MB-0324) screen has been flickering with horizontal lines since Tuesday. It also gets extremely hot during video calls. I think the GPU might be failing. Under warranty until Dec 2026.",
    time: "1.5h ago", status: "open",
  },
  {
    id: "TKT-4006", author: "Tom Wilson", department: "Engineering", category: "Service Outage",
    priority: "P1", subject: "Jenkins CI/CD pipeline completely down",
    description: "All Jenkins builds are failing across every team. The master node shows 'out of memory' errors and the web UI is unresponsive. 14 engineers are blocked. Last working build was at 02:47 AM. This is blocking our release scheduled for today.",
    time: "2h ago", status: "open",
  },
  {
    id: "TKT-4007", author: "Aisha Mohammed", department: "HR", category: "New Hire Setup",
    priority: "P3", subject: "Onboard 3 new engineers starting Monday",
    description: "Three new backend engineers start Monday (March 31). Need: (1) Email + Slack accounts (2) GitHub org invite (3) Jira access to Platform team (4) Standard dev laptop provisioning. Names: Alex Rivera, Jun Tanaka, Elena Popov.",
    time: "3h ago", status: "open",
  },
  {
    id: "TKT-4008", author: "Chris Johnson", department: "Legal", category: "Permissions",
    priority: "P3", subject: "Can't access shared drive — 'Access Denied' on legal contracts folder",
    description: "I'm getting 'Access Denied' when trying to open \\\\fileserver\\legal\\contracts. I was moved from Compliance to Legal last week and I think my permissions weren't updated. My old Compliance access also stopped working.",
    time: "4h ago", status: "open",
  },
];

const RESOLUTIONS: Record<string, { resolution: string; assignedTo?: string; steps: string[] }> = {
  "TKT-4001": {
    resolution: "Password reset for Salesforce completed. Temporary password sent to jessica.park@company.com. SSO sync verified. Forced password change on next login enabled.",
    steps: [
      "🔍 Analyzing ticket... Category: Password Reset | Priority: P4 (auto-resolvable)",
      "🔑 Tool: verify_identity({user: 'jessica.park', method: 'employee_directory'})\n→ Verified: Employee ID #2847, Marketing dept",
      "🔄 Tool: reset_password({system: 'salesforce', user: 'jessica.park@company.com'})\n→ Temporary password generated, email sent",
      "✅ Tool: verify_sso_sync({user: 'jessica.park', systems: ['okta', 'salesforce']})\n→ SSO sync confirmed. All auth tokens refreshed",
      "📧 Notification sent to jessica.park@company.com with reset instructions",
      "✅ Auto-resolved in 47 seconds. No human intervention needed.",
    ],
  },
  "TKT-4002": {
    resolution: "AWS IAM access provisioned for Orion project. Permissions: S3 (read/write), Lambda (deploy), DynamoDB (full). MFA enrollment required within 24 hours.",
    steps: [
      "🔍 Analyzing ticket... Category: Access Request | Priority: P3 | Manager approval: VERIFIED",
      "✅ Tool: verify_approval({manager: 'michael.chen', ticket: 'TKT-4002'})\n→ Approval confirmed on 03/24",
      "🔐 Tool: provision_iam({user: 'raj.patel', project: 'orion', services: ['s3', 'lambda', 'dynamodb']})\n→ IAM role 'orion-developer' assigned",
      "📧 Tool: send_credentials({user: 'raj.patel', method: 'encrypted_email'})\n→ Access details sent. MFA enrollment link included",
      "✅ Auto-resolved. Access provisioned per policy IAM-2026-R3.",
    ],
  },
  "TKT-4003": {
    resolution: "Tableau Desktop 2024.1 deployment queued via SCCM. Estimated install: within 2 hours. License key activated and assigned to asset FIN-LP-0847.",
    steps: [
      "🔍 Analyzing ticket... Category: Software Install | Priority: P3 | Policy approval: VERIFIED",
      "📋 Tool: verify_license({software: 'tableau_desktop', key: 'attached'})\n→ License valid. Enterprise pool: 47/50 seats used",
      "💻 Tool: deploy_software({asset: 'FIN-LP-0847', package: 'tableau-desktop-2024.1', method: 'SCCM'})\n→ Deployment queued. ETA: 2 hours",
      "✅ Auto-resolved. Deployment will complete silently in background.",
    ],
  },
  "TKT-4004": {
    resolution: "VPN configuration updated. Root cause: split-tunnel policy conflict with Comcast DNS. Applied fix: forced internal DNS resolver. User should restart GlobalProtect client.",
    assignedTo: "Network Team",
    steps: [
      "🔍 Analyzing ticket... Category: VPN Issue | Priority: P2 | Recurring pattern detected",
      "🔗 Tool: check_vpn_logs({user: 'david.kim', period: '7d'})\n→ 47 disconnections in 5 days. Timeout error: DNS resolution failure",
      "🧠 Retrieved similar resolved ticket: TKT-3847 (same ISP, same error)\n→ Root cause: split-tunnel policy conflict with Comcast DNS",
      "🔧 Tool: update_vpn_config({user: 'david.kim', fix: 'force_internal_dns'})\n→ Configuration pushed to user's GP profile",
      "📧 Notification sent with restart instructions",
      "✅ Resolved. Monitoring for 24h to confirm stability.",
    ],
  },
  "TKT-4005": {
    resolution: "Hardware issue confirmed. Genius Bar appointment booked for Wednesday 10am at nearest Apple Store. Loaner MacBook Pro provisioned (asset: LOAN-MB-0012).",
    assignedTo: "Hardware Team",
    steps: [
      "🔍 Analyzing ticket... Category: Hardware Issue | Priority: P2 | Warranty: VALID",
      "💻 Tool: check_warranty({asset: 'ENG-MB-0324', vendor: 'apple'})\n→ AppleCare+ active until Dec 2026. GPU issue covered",
      "📅 Tool: book_repair({vendor: 'apple', issue: 'GPU_flickering', location: 'nearest'})\n→ Genius Bar appointment: Wednesday 10:00 AM",
      "💻 Tool: provision_loaner({type: 'macbook_pro', user: 'sarah.chen'})\n→ Loaner LOAN-MB-0012 prepared. Data migration scheduled",
      "📧 Notified sarah.chen with appointment details and loaner pickup instructions",
      "✅ Assigned to Hardware Team for follow-up.",
    ],
  },
  "TKT-4006": {
    resolution: "CRITICAL: Jenkins master node OOM resolved. Heap increased from 4GB to 8GB, zombie jobs purged (47 orphaned). All 14 blocked engineers unblocked. Monitoring active.",
    assignedTo: "DevOps On-Call",
    steps: [
      "🔍 Analyzing ticket... Category: Service Outage | Priority: P1 ⚠️ CRITICAL — 14 engineers blocked",
      "🚨 Tool: escalate({channel: '#incidents', severity: 'P1', message: 'Jenkins CI/CD down — 14 engineers blocked'})\n→ Slack alert sent. PagerDuty triggered for DevOps on-call",
      "🖥️ Tool: check_service_health({service: 'jenkins-master', metrics: ['cpu', 'memory', 'disk']})\n→ Memory: 99.2% (OOM) | 47 zombie jobs consuming 3.8GB | Heap: 4GB max",
      "🔧 Tool: emergency_remediate({action: 'kill_zombie_jobs', service: 'jenkins-master'})\n→ 47 orphaned build jobs terminated. 3.8GB freed",
      "🔧 Tool: update_config({service: 'jenkins-master', heap_size: '8GB'})\n→ JVM heap increased 4GB → 8GB. Service restarting...",
      "✅ Tool: verify_service({service: 'jenkins-master'})\n→ Jenkins online. Build queue processing. 14 engineers unblocked",
      "🚨 Escalated to DevOps On-Call for root cause analysis and permanent fix.",
    ],
  },
  "TKT-4007": {
    resolution: "3 new hire accounts created: Email, Slack, GitHub, Jira (Platform team). Laptops queued for provisioning (pickup: Friday). Welcome emails sent to all 3.",
    steps: [
      "🔍 Analyzing ticket... Category: New Hire Setup | Priority: P3 | 3 employees",
      "👤 Tool: create_accounts({employees: ['alex.rivera', 'jun.tanaka', 'elena.popov'], systems: ['email', 'slack', 'github', 'jira']})\n→ 12 accounts created (4 per employee)",
      "🔐 Tool: assign_groups({users: 3, groups: ['engineering', 'platform-team', 'github-backend']})\n→ Group memberships assigned. GitHub org invites sent",
      "💻 Tool: queue_laptop_provisioning({count: 3, spec: 'engineering_standard', pickup: 'Friday'})\n→ 3 x MacBook Pro M4 queued with standard dev image",
      "📧 Tool: send_welcome_emails({employees: 3, include: ['credentials', 'first_day_guide', 'it_contact']})\n→ Welcome emails sent with encrypted credential packages",
      "✅ Auto-resolved. All 3 employees ready for Day 1.",
    ],
  },
  "TKT-4008": {
    resolution: "Permissions updated: removed Compliance group, added Legal group. Access to \\\\fileserver\\legal\\contracts confirmed. AD sync completed.",
    steps: [
      "🔍 Analyzing ticket... Category: Permissions | Priority: P3 | Department transfer detected",
      "👤 Tool: check_ad_groups({user: 'chris.johnson'})\n→ Current groups: Compliance-ReadWrite, Legal-None. Issue confirmed: dept transfer not synced",
      "🔐 Tool: update_groups({user: 'chris.johnson', remove: ['compliance-rw'], add: ['legal-rw', 'legal-contracts']})\n→ AD groups updated. LDAP sync triggered",
      "✅ Tool: verify_access({user: 'chris.johnson', path: '\\\\fileserver\\legal\\contracts'})\n→ Access confirmed. Read/Write permissions active",
      "✅ Auto-resolved. AD sync complete.",
    ],
  },
};

// ─── Component ─────────────────────────────

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [liveSteps, setLiveSteps] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepsRef.current) stepsRef.current.scrollTop = stepsRef.current.scrollHeight;
  }, [liveSteps]);

  async function processTicket(ticket: Ticket) {
    setProcessingId(ticket.id);
    setIsProcessing(true);
    setSelectedTicket(ticket);
    setLiveSteps([]);
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "processing" as const } : t));

    const data = RESOLUTIONS[ticket.id];
    if (!data) return;

    for (const step of data.steps) {
      await new Promise(r => setTimeout(r, 650));
      setLiveSteps(prev => [...prev, step]);
    }

    await new Promise(r => setTimeout(r, 400));
    const newStatus = data.assignedTo ? "assigned" : "auto-resolved";
    setTickets(prev => prev.map(t =>
      t.id === ticket.id ? { ...t, status: newStatus as Ticket["status"], resolution: data.resolution, assignedTo: data.assignedTo, agentSteps: data.steps } : t
    ));
    setSelectedTicket(prev => prev && prev.id === ticket.id ? { ...prev, status: newStatus as Ticket["status"], resolution: data.resolution, assignedTo: data.assignedTo } : prev);
    setIsProcessing(false);
    setProcessingId(null);
  }

  async function autoProcessAll() {
    setIsAutoRunning(true);
    for (const t of tickets.filter(t => t.status === "open")) {
      await processTicket(t);
      await new Promise(r => setTimeout(r, 400));
    }
    setIsAutoRunning(false);
  }

  const filtered = filter === "all" ? tickets : tickets.filter(t => {
    if (filter === "open") return t.status === "open";
    if (filter === "resolved") return t.status === "auto-resolved";
    if (filter === "assigned") return t.status === "assigned";
    if (filter === "p1") return t.priority === "P1";
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    autoResolved: tickets.filter(t => t.status === "auto-resolved").length,
    assigned: tickets.filter(t => t.status === "assigned").length,
    avgTime: "1.2 min",
  };

  const priorityStyle: Record<string, string> = {
    P1: "bg-rose-500/15 text-rose-400", P2: "bg-amber-500/15 text-amber-400",
    P3: "bg-electric-500/15 text-electric-400", P4: "bg-slate-500/15 text-slate-400",
  };

  const statusStyle: Record<string, { cls: string; label: string }> = {
    open: { cls: "badge-info", label: "Open" },
    processing: { cls: "badge-info", label: "Processing..." },
    "auto-resolved": { cls: "badge-active", label: "Auto-Resolved" },
    assigned: { cls: "badge-warning", label: "Assigned" },
    escalated: { cls: "badge-error", label: "Escalated" },
  };

  const catIcons: Record<string, string> = {
    "Password Reset": "🔑", "Access Request": "🔐", "Software Install": "💾",
    "VPN Issue": "🌐", "Hardware Issue": "💻", "Service Outage": "🚨",
    "New Hire Setup": "👤", "Permissions": "🔒",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">IT Helpdesk</h1>
          <p className="text-text-secondary mt-1">AI-powered ticket triage, auto-resolution, and smart routing</p>
        </div>
        <button onClick={autoProcessAll} disabled={isAutoRunning || stats.open === 0}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isAutoRunning ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            : <>🤖 Auto-Resolve All ({stats.open} open)</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Tickets", value: stats.total, icon: "🎫", color: "from-electric-500 to-cyan-500" },
          { label: "Open", value: stats.open, icon: "⏳", color: "from-amber-500 to-yellow-500" },
          { label: "Auto-Resolved", value: stats.autoResolved, icon: "✅", color: "from-emerald-500 to-teal-500" },
          { label: "Assigned", value: stats.assigned, icon: "👤", color: "from-violet-500 to-fuchsia-500" },
          { label: "Avg Resolution", value: stats.avgTime, icon: "⚡", color: "from-rose-500 to-orange-500" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>{s.icon}</div>
              <div><div className="text-2xl font-bold text-text-primary">{s.value}</div><div className="text-xs text-text-muted">{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "open", "resolved", "assigned", "p1"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${filter === f ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}>
            {f === "p1" ? "P1 Critical" : f}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {filtered.map(t => (
            <button key={t.id} onClick={() => { setSelectedTicket(t); setLiveSteps([]); }}
              className={`w-full text-left glass-card p-4 transition-all hover:border-electric-500/30 cursor-pointer ${selectedTicket?.id === t.id ? "border-electric-500/40 ring-1 ring-electric-500/10" : ""} ${processingId === t.id ? "animate-pulse" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityStyle[t.priority]}`}>{t.priority}</span>
                  <span className="text-xs text-text-muted">{catIcons[t.category]} {t.category}</span>
                </div>
                <span className={`badge ${statusStyle[t.status]?.cls || "badge-neutral"} text-[10px]`}>{statusStyle[t.status]?.label || t.status}</span>
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1 line-clamp-1">{t.subject}</h4>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>{t.author}</span><span>·</span><span>{t.department}</span><span>·</span><span>{t.time}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selectedTicket ? (
            <>
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                      {selectedTicket.author.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{selectedTicket.author}</div>
                      <div className="text-xs text-text-muted">{selectedTicket.department} · {selectedTicket.time}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${priorityStyle[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{selectedTicket.subject}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{selectedTicket.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="badge badge-neutral">{catIcons[selectedTicket.category]} {selectedTicket.category}</span>
                  <span className={`badge ${statusStyle[selectedTicket.status]?.cls}`}>{statusStyle[selectedTicket.status]?.label}</span>
                  {selectedTicket.assignedTo && <span className="badge badge-warning">→ {selectedTicket.assignedTo}</span>}
                </div>
              </div>

              {selectedTicket.status === "open" && (
                <button onClick={() => processTicket(selectedTicket)} disabled={isProcessing}
                  className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  🤖 Let AI Agent Handle This Ticket
                </button>
              )}

              {liveSteps.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" /><div className="w-3 h-3 rounded-full bg-amber-500" /><div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-text-muted ml-1">helpdesk-agent reasoning</span>
                  </div>
                  <div ref={stepsRef} className="p-4 space-y-2 max-h-56 overflow-y-auto bg-navy-950/50" style={{ fontFamily: "var(--font-mono)" }}>
                    {liveSteps.map((s, i) => <div key={i} className="text-xs text-text-secondary animate-fade-in">{s}</div>)}
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-xs text-text-muted animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedTicket.resolution || tickets.find(t => t.id === selectedTicket.id)?.resolution) && (
                <div className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.03), rgba(59,130,246,0.03))" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
                    <div><div className="text-sm font-semibold text-text-primary">Resolution</div>
                      <div className="text-[10px] text-text-muted">{selectedTicket.assignedTo ? `Assigned to ${selectedTicket.assignedTo}` : "Auto-resolved by AI agent"}</div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{selectedTicket.resolution || tickets.find(t => t.id === selectedTicket.id)?.resolution}</p>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Select a ticket</h3>
              <p className="text-sm text-text-secondary">Click a ticket to view details and let the AI agent resolve it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
