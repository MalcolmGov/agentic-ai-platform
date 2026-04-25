/**
 * Email Integration — Alerts & Reports
 * 
 * Provides a unified interface for sending transactional emails.
 * Development: logs to console.
 * Production: SendGrid / AWS SES.
 */

import { env } from "@/lib/config/env";

// ─── Types ─────────────────────────────────

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
}

export interface EmailResult {
  id: string;
  sent: boolean;
  provider: string;
  timestamp: string;
}

// ─── Email Templates ──────────────────────

export const EmailTemplates = {
  agentAlert(params: {
    agentName: string;
    severity: string;
    title: string;
    description: string;
    executionId: string;
    dashboardUrl: string;
  }): EmailMessage {
    const severityColors: Record<string, string> = {
      critical: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6",
    };
    const color = severityColors[params.severity] || "#6b7280";

    return {
      to: [],
      subject: `[${params.severity.toUpperCase()}] ${params.title} — ${params.agentName}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, ${color}22, ${color}11); padding: 24px; border-bottom: 1px solid ${color}33;">
            <div style="display: inline-block; padding: 4px 12px; background: ${color}22; border: 1px solid ${color}44; border-radius: 6px; color: ${color}; font-size: 12px; font-weight: 600; text-transform: uppercase;">${params.severity}</div>
            <h2 style="margin: 12px 0 4px; color: #f1f5f9; font-size: 20px;">${params.title}</h2>
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Agent: ${params.agentName}</p>
          </div>
          <div style="padding: 24px;">
            <p style="color: #cbd5e1; line-height: 1.6;">${params.description}</p>
            <div style="margin: 20px 0; padding: 16px; background: #1e293b; border-radius: 8px; border: 1px solid #334155;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">Execution ID</p>
              <p style="margin: 4px 0 0; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 13px;">${params.executionId}</p>
            </div>
            <a href="${params.dashboardUrl}" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">View in Dashboard →</a>
          </div>
          <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Swifter AI Platform • Automated Alert</p>
          </div>
        </div>
      `,
      tags: ["alert", params.severity, params.agentName],
    };
  },

  executionReport(params: {
    agentName: string;
    executionId: string;
    status: string;
    duration: string;
    summary: string;
    metrics: Array<{ label: string; value: string }>;
    dashboardUrl: string;
  }): EmailMessage {
    const metricsHtml = params.metrics
      .map((m) => `
        <div style="flex: 1; min-width: 120px; padding: 12px; background: #1e293b; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase;">${m.label}</p>
          <p style="margin: 4px 0 0; color: #f1f5f9; font-size: 18px; font-weight: 600;">${m.value}</p>
        </div>
      `)
      .join("");

    return {
      to: [],
      subject: `Report: ${params.agentName} — ${params.status}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="padding: 24px; border-bottom: 1px solid #1e293b;">
            <h2 style="margin: 0 0 4px; color: #f1f5f9;">${params.agentName} Report</h2>
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Execution: ${params.executionId} • Duration: ${params.duration}</p>
          </div>
          <div style="padding: 24px;">
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">${metricsHtml}</div>
            <div style="padding: 16px; background: #1e293b; border-radius: 8px; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; color: #cbd5e1; line-height: 1.6;">${params.summary}</p>
            </div>
            <div style="margin-top: 20px;">
              <a href="${params.dashboardUrl}" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">View Full Report →</a>
            </div>
          </div>
          <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Swifter AI Platform • Automated Report</p>
          </div>
        </div>
      `,
      tags: ["report", params.agentName],
    };
  },

  welcomeEmail(params: { name: string; organizationName: string; loginUrl: string }): EmailMessage {
    return {
      to: [],
      subject: `Welcome to Swifter AI Platform — ${params.organizationName}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="padding: 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f622, #8b5cf622);">
            <h1 style="margin: 0; color: #f1f5f9; font-size: 24px;">Welcome, ${params.name}!</h1>
            <p style="margin: 8px 0 0; color: #94a3b8;">Your AI agent platform is ready.</p>
          </div>
          <div style="padding: 24px;">
            <p style="color: #cbd5e1; line-height: 1.6;">Your organization <strong>${params.organizationName}</strong> has been set up. You can now create AI agents, build workflows, and integrate with your enterprise systems.</p>
            <a href="${params.loginUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard →</a>
          </div>
        </div>
      `,
      tags: ["onboarding", "welcome"],
    };
  },
};

// ─── Email Sender ─────────────────────────

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const emailId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const from = message.from || env.FROM_EMAIL;

  // Development: log to console
  if (!env.SENDGRID_API_KEY) {
    console.log(`📧 [DEV EMAIL] To: ${Array.isArray(message.to) ? message.to.join(", ") : message.to}`);
    console.log(`   Subject: ${message.subject}`);
    console.log(`   Tags: ${message.tags?.join(", ") || "none"}`);
    return { id: emailId, sent: true, provider: "console", timestamp: new Date().toISOString() };
  }

  // Production: SendGrid
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: (Array.isArray(message.to) ? message.to : [message.to]).map((email) => ({ email })),
        }],
        from: { email: from },
        reply_to: message.replyTo ? { email: message.replyTo } : undefined,
        subject: message.subject,
        content: [
          { type: "text/html", value: message.html },
          ...(message.text ? [{ type: "text/plain", value: message.text }] : []),
        ],
        categories: message.tags,
      }),
    });

    return {
      id: emailId,
      sent: response.ok,
      provider: "sendgrid",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Email] SendGrid error:", error);
    return { id: emailId, sent: false, provider: "sendgrid", timestamp: new Date().toISOString() };
  }
}

// ─── Transactional Email Senders ─────────────────────────────────────────────

/**
 * Sent when an agent is successfully deployed to a market.
 */
export async function sendAgentDeployedEmail(
  to: string,
  agentName: string,
  market: string,
  appName: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Agent Deployed: ${agentName} is live on ${market}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(135deg, #3b82f622, #8b5cf622); border-bottom: 1px solid #1e293b;">
          <h2 style="margin: 0 0 4px; color: #f1f5f9; font-size: 20px;">🚀 Agent Deployed</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">${agentName} is now live</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px; width: 120px;">Agent</td><td style="padding: 8px 0; color: #f1f5f9; font-size: 13px; font-weight: 600;">${agentName}</td></tr>
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Market</td><td style="padding: 8px 0; color: #f1f5f9; font-size: 13px;">${market}</td></tr>
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Application</td><td style="padding: 8px 0; color: #f1f5f9; font-size: 13px;">${appName}</td></tr>
          </table>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Swifter AI Platform • Deployment Notification</p>
        </div>
      </div>
    `,
    tags: ["deployment", "agent"],
  });
}

/**
 * Sent to approvers when a deployment request needs review.
 */
export async function sendApprovalRequestEmail(
  to: string,
  agentName: string,
  requestedBy: string,
  approvalUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Approval Required: ${agentName}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(135deg, #f59e0b22, #f59e0b11); border-bottom: 1px solid #f59e0b33;">
          <h2 style="margin: 0 0 4px; color: #f1f5f9; font-size: 20px;">🔔 Approval Requested</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">Review required for ${agentName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #cbd5e1; line-height: 1.6;">
            <strong style="color: #f1f5f9;">${requestedBy}</strong> has requested deployment approval for agent
            <strong style="color: #f1f5f9;">${agentName}</strong>. Please review and approve or reject this request.
          </p>
          <a href="${approvalUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Review Request →</a>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Swifter AI Platform • Approval Workflow</p>
        </div>
      </div>
    `,
    tags: ["approval", "workflow"],
  });
}

/**
 * Sent to the requester once their deployment is approved or rejected.
 */
export async function sendApprovalDecisionEmail(
  to: string,
  agentName: string,
  approved: boolean,
  notes?: string
): Promise<void> {
  const color = approved ? "#10b981" : "#ef4444";
  const label = approved ? "✅ Approved" : "❌ Rejected";

  await sendEmail({
    to,
    subject: `${label}: ${agentName} deployment request`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="padding: 24px; background: ${color}11; border-bottom: 1px solid ${color}33;">
          <h2 style="margin: 0 0 4px; color: #f1f5f9; font-size: 20px;">${label}</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">Deployment decision for ${agentName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #cbd5e1; line-height: 1.6;">
            Your deployment request for <strong style="color: #f1f5f9;">${agentName}</strong> has been
            <strong style="color: ${color};">${approved ? "approved" : "rejected"}</strong>.
          </p>
          ${notes ? `<div style="margin-top: 16px; padding: 12px 16px; background: #1e293b; border-radius: 8px; border-left: 3px solid ${color};"><p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Notes</p><p style="margin: 0; color: #cbd5e1; font-size: 13px;">${notes}</p></div>` : ""}
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Swifter AI Platform • Approval Workflow</p>
        </div>
      </div>
    `,
    tags: ["approval", "decision", approved ? "approved" : "rejected"],
  });
}

/**
 * Sent to a new user after successful registration.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  tenantName: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/dashboard`;
  const message = EmailTemplates.welcomeEmail({ name, organizationName: tenantName, loginUrl });
  message.to = to;
  await sendEmail(message);
}

/**
 * Sent to the tenant admin when a new market is enabled.
 */
export async function sendMarketEnabledEmail(
  to: string,
  marketName: string,
  agentCount: number
): Promise<void> {
  await sendEmail({
    to,
    subject: `Market Enabled: ${marketName}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(135deg, #10b98122, #10b98111); border-bottom: 1px solid #10b98133;">
          <h2 style="margin: 0 0 4px; color: #f1f5f9; font-size: 20px;">🌍 Market Enabled</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">${marketName} is now active</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #cbd5e1; line-height: 1.6;">
            The <strong style="color: #f1f5f9;">${marketName}</strong> market has been enabled on your platform.
            ${agentCount > 0 ? `<strong style="color: #10b981;">${agentCount} agent${agentCount !== 1 ? "s" : ""}</strong> are available for deployment in this market.` : "You can now deploy agents to this market."}
          </p>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Swifter AI Platform • Market Notification</p>
        </div>
      </div>
    `,
    tags: ["market", "enabled"],
  });
}

// ─── Alert Sender ─────────────────────────────

/**
 * Send an agent alert email
 */
export async function sendAgentAlert(
  recipients: string[],
  agentName: string,
  severity: string,
  title: string,
  description: string,
  executionId: string
): Promise<EmailResult> {
  const message = EmailTemplates.agentAlert({
    agentName,
    severity,
    title,
    description,
    executionId,
    dashboardUrl: `${env.APP_URL}/dashboard/logs?execution=${executionId}`,
  });
  message.to = recipients;
  return sendEmail(message);
}
