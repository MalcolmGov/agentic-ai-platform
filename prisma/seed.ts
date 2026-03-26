/**
 * Prisma Seed Script
 *
 * Seeds the database with a demo tenant, users, agents, executions,
 * workflows, integrations, and audit logs for development.
 *
 * Usage: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

// Use dynamic import for bcryptjs to avoid ESM issues
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Agentic AI Platform database...\n");

  // ─── Bcrypt ──────────────────────────────
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("admin123", 12);

  // ─── Tenant ──────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "ACME Corporation",
      slug: "acme-corp",
      industry: "Financial Services",
      plan: "ENTERPRISE",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Users ───────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      name: "Enterprise Admin",
      passwordHash,
      role: "OWNER",
      tenantId: tenant.id,
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: "dev@acme.com" },
    update: {},
    create: {
      email: "dev@acme.com",
      name: "Jane Developer",
      passwordHash,
      role: "DEVELOPER",
      tenantId: tenant.id,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@acme.com" },
    update: {},
    create: {
      email: "analyst@acme.com",
      name: "Alex Analyst",
      passwordHash,
      role: "ANALYST",
      tenantId: tenant.id,
    },
  });

  console.log(`✅ Users: admin@acme.com, dev@acme.com, analyst@acme.com (password: admin123)`);

  // ─── Agents ──────────────────────────────
  const agentDefs = [
    { name: "FraudGuard", type: "FRAUD_MONITORING" as const, desc: "Real-time transaction fraud detection and risk scoring", status: "ACTIVE" as const, model: "gpt-4o", tools: ["query_transactions", "calculate_risk_score", "send_alert", "block_account"] },
    { name: "ComplianceBot", type: "COMPLIANCE" as const, desc: "Automated KYC/AML checks and sanctions screening", status: "ACTIVE" as const, model: "gpt-4o", tools: ["check_sanctions_list", "verify_identity", "generate_sar", "flag_suspicious"] },
    { name: "ReportGen", type: "REPORTING" as const, desc: "Daily executive summaries and trend analysis", status: "ACTIVE" as const, model: "gpt-4o-mini", tools: ["aggregate_metrics", "generate_chart", "send_email", "query_database"] },
    { name: "FinanceAgent", type: "FINANCE" as const, desc: "Reconciliation, invoicing, and financial forecasting", status: "ACTIVE" as const, model: "gpt-4o", tools: ["match_transactions", "generate_invoice", "forecast_revenue", "query_ledger"] },
    { name: "SupportBot", type: "CUSTOMER_SUPPORT" as const, desc: "Intelligent ticket routing and auto-responses", status: "ACTIVE" as const, model: "gpt-4o-mini", tools: ["classify_ticket", "draft_response", "escalate_ticket", "search_kb"] },
    { name: "DataMiner", type: "DATA_ANALYST" as const, desc: "Pattern discovery and anomaly detection across datasets", status: "ACTIVE" as const, model: "gpt-4o", tools: ["run_sql", "statistical_analysis", "generate_visualization", "export_csv"] },
    { name: "DocProcessor", type: "DOCUMENT_PROCESSING" as const, desc: "OCR extraction, classification, and data entry", status: "PAUSED" as const, model: "gpt-4o", tools: ["ocr_extract", "classify_document", "extract_fields", "store_record"] },
    { name: "EmailAgent", type: "EMAIL_COMMUNICATION" as const, desc: "Automated email campaigns and intelligent responses", status: "ACTIVE" as const, model: "gpt-4o-mini", tools: ["read_inbox", "draft_email", "send_email", "categorize_email"] },
    { name: "WorkflowMaster", type: "WORKFLOW_AUTOMATION" as const, desc: "Multi-step process orchestration and execution", status: "ACTIVE" as const, model: "gpt-4o", tools: ["trigger_workflow", "evaluate_condition", "run_step", "notify_slack"] },
    { name: "OpsGuard", type: "OPERATIONS" as const, desc: "System monitoring, incident response, and optimization", status: "ACTIVE" as const, model: "gpt-4o", tools: ["check_health", "restart_service", "analyze_logs", "create_incident"] },
    { name: "ReviewBot", type: "COMPLIANCE" as const, desc: "Content moderation and quality review automation", status: "ACTIVE" as const, model: "gpt-4o-mini", tools: ["review_content", "flag_violation", "approve_content", "generate_report"] },
    { name: "IntelAgent", type: "DATA_ANALYST" as const, desc: "Competitive intelligence and market analysis", status: "ACTIVE" as const, model: "gpt-4o", tools: ["search_web", "analyze_competitor", "extract_pricing", "summarize_report"] },
    { name: "HelpdeskBot", type: "CUSTOMER_SUPPORT" as const, desc: "IT helpdesk ticket management and auto-resolution", status: "ACTIVE" as const, model: "gpt-4o-mini", tools: ["diagnose_issue", "run_script", "reset_password", "close_ticket"] },
  ];

  const agents = [];
  for (const def of agentDefs) {
    const agent = await prisma.agent.create({
      data: {
        name: def.name,
        type: def.type,
        description: def.desc,
        systemPrompt: `You are ${def.name}, a specialized ${def.type.toLowerCase().replace(/_/g, " ")} agent. ${def.desc}. Follow your instructions carefully and use the tools available to you.`,
        config: { maxRetries: 3, timeout: 30000 },
        llmModel: def.model,
        status: def.status,
        schedule: def.status === "ACTIVE" ? "realtime" : null,
        tools: def.tools,
        tenantId: tenant.id,
      },
    });
    agents.push(agent);
  }
  console.log(`✅ Agents: ${agents.length} created (${agents.filter(a => a.status === "ACTIVE").length} active)`);

  // ─── Agent Executions (last 24h of activity) ─────
  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "FAILED"] as const;
  const now = Date.now();
  let execCount = 0;

  for (const agent of agents.filter(a => a.status === "ACTIVE")) {
    // Generate 50-250 executions per active agent in last 24h
    const count = Math.floor(Math.random() * 200) + 50;
    const executions = [];

    for (let i = 0; i < count; i++) {
      const startedAt = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
      const durationMs = Math.floor(Math.random() * 5000) + 200;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const tokenUsage = Math.floor(Math.random() * 2000) + 100;

      executions.push({
        status,
        input: { trigger: "realtime", source: "api" },
        output: status === "COMPLETED" ? { result: "success", confidence: (Math.random() * 0.4 + 0.6).toFixed(2) } : null,
        error: status === "FAILED" ? "Timeout: external API did not respond within 30s" : null,
        durationMs,
        tokenUsage,
        costUsd: parseFloat((tokenUsage * 0.00003).toFixed(4)),
        startedAt,
        completedAt: new Date(startedAt.getTime() + durationMs),
        agentId: agent.id,
      });
    }

    await prisma.agentExecution.createMany({ data: executions });
    execCount += count;
  }
  console.log(`✅ Executions: ${execCount} seeded (last 24h)`);

  // ─── Workflows ───────────────────────────
  const workflows = await Promise.all([
    prisma.workflow.create({
      data: {
        name: "New Customer Onboarding",
        description: "Automated KYC verification, account setup, and welcome email",
        triggerType: "WEBHOOK",
        triggerConfig: { event: "customer.created" },
        status: "ACTIVE",
        category: "Onboarding",
        tenantId: tenant.id,
        steps: {
          create: [
            { order: 1, name: "Verify Identity", type: "AGENT", config: { agentType: "COMPLIANCE" } },
            { order: 2, name: "Risk Assessment", type: "AGENT", config: { agentType: "FRAUD_MONITORING" } },
            { order: 3, name: "Check Risk Score", type: "CONDITION", config: { field: "riskScore", operator: "lt", value: 0.7 } },
            { order: 4, name: "Create Account", type: "ACTION", config: { action: "create_account" } },
            { order: 5, name: "Send Welcome Email", type: "NOTIFICATION", config: { template: "welcome" } },
          ],
        },
      },
    }),
    prisma.workflow.create({
      data: {
        name: "Daily Fraud Report",
        description: "Aggregate daily fraud metrics and email to compliance team",
        triggerType: "SCHEDULED",
        triggerConfig: { cron: "0 8 * * *" },
        status: "ACTIVE",
        category: "Reporting",
        tenantId: tenant.id,
        steps: {
          create: [
            { order: 1, name: "Query Fraud Data", type: "AGENT", config: { agentType: "DATA_ANALYST" } },
            { order: 2, name: "Generate Report", type: "AGENT", config: { agentType: "REPORTING" } },
            { order: 3, name: "Email Report", type: "NOTIFICATION", config: { recipients: ["compliance@acme.com"] } },
          ],
        },
      },
    }),
    prisma.workflow.create({
      data: {
        name: "High-Risk Transaction Alert",
        description: "Escalation chain for transactions scoring above risk threshold",
        triggerType: "EVENT",
        triggerConfig: { event: "transaction.high_risk" },
        status: "ACTIVE",
        category: "Fraud",
        tenantId: tenant.id,
        steps: {
          create: [
            { order: 1, name: "Deep Fraud Analysis", type: "AGENT", config: { agentType: "FRAUD_MONITORING" } },
            { order: 2, name: "Check Severity", type: "CONDITION", config: { field: "severity", operator: "eq", value: "CRITICAL" } },
            { order: 3, name: "Block Transaction", type: "ACTION", config: { action: "block_transaction" } },
            { order: 4, name: "Alert Compliance", type: "NOTIFICATION", config: { channel: "slack", urgency: "high" } },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Workflows: ${workflows.length} created with steps`);

  // ─── Integrations ────────────────────────
  await prisma.integration.createMany({
    data: [
      { name: "Production PostgreSQL", type: "DATABASE", provider: "postgresql", config: {}, status: "CONNECTED", tenantId: tenant.id },
      { name: "Redis Cache", type: "DATABASE", provider: "redis", config: {}, status: "CONNECTED", tenantId: tenant.id },
      { name: "Slack Notifications", type: "MESSAGING", provider: "slack", config: { channel: "#ai-alerts" }, status: "CONNECTED", tenantId: tenant.id },
      { name: "SendGrid Email", type: "MESSAGING", provider: "sendgrid", config: {}, status: "CONNECTED", tenantId: tenant.id },
      { name: "Stripe Billing", type: "PAYMENT", provider: "stripe", config: {}, status: "CONNECTED", tenantId: tenant.id },
      { name: "AWS S3 Storage", type: "CLOUD_SERVICE", provider: "aws-s3", config: { bucket: "acme-ai-files" }, status: "CONNECTED", tenantId: tenant.id },
    ],
  });
  console.log(`✅ Integrations: 6 connected`);

  // ─── Subscription ────────────────────────
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      plan: "ENTERPRISE",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-03-01"),
      currentPeriodEnd: new Date("2026-03-31"),
      agentLimit: 999,
      executionLimit: 999999,
      priceMonthly: 2499.0,
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Subscription: Enterprise plan`);

  // ─── API Keys ────────────────────────────
  const keyHash = await bcrypt.hash("sk-agentic-live-acme-01234567890abcdef", 12);
  await prisma.apiKey.create({
    data: {
      name: "Production API Key",
      keyHash,
      prefix: "sk-agent",
      status: "ACTIVE",
      tenantId: tenant.id,
    },
  });
  console.log(`✅ API Key: sk-agent... (production)`);

  // ─── Alerts ──────────────────────────────
  await prisma.alert.createMany({
    data: [
      { severity: "CRITICAL", title: "Unusual login pattern detected", description: "User admin@acme.com logged in from 3 different countries in 2 hours", source: "FraudGuard", tenantId: tenant.id },
      { severity: "WARNING", title: "API rate limit approaching", description: "Tenant has used 87% of daily API quota (87,000/100,000)", source: "OpsGuard", tenantId: tenant.id },
      { severity: "INFO", title: "Daily compliance report generated", description: "All 847 transactions passed KYC/AML screening", source: "ComplianceBot", tenantId: tenant.id },
      { severity: "CRITICAL", title: "Failed transaction spike", description: "22 failed transactions in the last 15 minutes (baseline: 3)", source: "FraudGuard", tenantId: tenant.id },
    ],
  });
  console.log(`✅ Alerts: 4 seeded`);

  // ─── Audit Logs ──────────────────────────
  const auditActions = [
    { action: "user.login", resource: "auth", details: { method: "password", ip: "196.21.45.88" } },
    { action: "agent.execute", resource: "FraudGuard", details: { executionId: "exec_001", durationMs: 1245 } },
    { action: "workflow.trigger", resource: "New Customer Onboarding", details: { trigger: "webhook", customerId: "cust_789" } },
    { action: "agent.config.update", resource: "ComplianceBot", details: { field: "llmModel", from: "gpt-4o-mini", to: "gpt-4o" } },
    { action: "api_key.create", resource: "Production API Key", details: { prefix: "sk-agent" } },
    { action: "integration.connect", resource: "Slack Notifications", details: { provider: "slack", channel: "#ai-alerts" } },
  ];

  await prisma.auditLog.createMany({
    data: auditActions.map((a, i) => ({
      action: a.action,
      resource: a.resource,
      details: a.details,
      ipAddress: "196.21.45.88",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      tenantId: tenant.id,
      userId: admin.id,
      createdAt: new Date(now - (auditActions.length - i) * 3600 * 1000),
    })),
  });
  console.log(`✅ Audit Logs: ${auditActions.length} entries`);

  // ─── Summary ─────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("🎉 Seed complete!");
  console.log("═".repeat(50));
  console.log(`  Tenant:       ${tenant.name}`);
  console.log(`  Users:        3 (admin/dev/analyst)`);
  console.log(`  Agents:       ${agents.length}`);
  console.log(`  Executions:   ${execCount}`);
  console.log(`  Workflows:    ${workflows.length}`);
  console.log(`  Integrations: 6`);
  console.log(`  Alerts:       4`);
  console.log(`  Audit Logs:   ${auditActions.length}`);
  console.log(`\n  Login: admin@acme.com / admin123\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
