/**
 * Demo Environment Seeder
 *
 * Populates all in-memory engines with realistic demo data
 * for a complete product walkthrough experience.
 */

import { getMarketplaceEngine } from "../marketplace/marketplace-engine";
import { getGovernanceEngine } from "../governance/compliance-engine";
import { getOrchestrationEngine } from "../orchestration/orchestration-engine";
import { getDashboardEngine } from "../dashboard/dashboard-engine";
import { getDriftDetector } from "../drift/drift-detector";
import { getTeamEngine } from "../team/team-engine";
import { getPromptVersioningEngine } from "../prompt-versioning/prompt-versioning-engine";
import { getNotificationEngine } from "../notifications/notification-engine";

// ─── Types ─────────────────────────────────

export interface DemoEnvironment {
  tenantId: string;
  agents: DemoAgent[];
  initialized: boolean;
  seededAt: number;
}

interface DemoAgent {
  id: string;
  name: string;
  type: string;
}

// ─── Constants ─────────────────────────────

const DEMO_TENANT = "tenant_demo_001";
const DEMO_USER = "demo_user_001";

const DEMO_AGENTS: DemoAgent[] = [
  { id: "agent_fraud_01", name: "FraudGuard Pro", type: "FRAUD_MONITORING" },
  { id: "agent_support_01", name: "SupportBot AI", type: "CUSTOMER_SUPPORT" },
  { id: "agent_docs_01", name: "DocProcessor", type: "DOCUMENT_PROCESSING" },
  { id: "agent_compliance_01", name: "ComplianceChecker", type: "COMPLIANCE" },
  { id: "agent_data_01", name: "DataPipeline", type: "DATA_ANALYST" },
  { id: "agent_email_01", name: "EmailAutomation", type: "EMAIL_COMMUNICATION" },
  { id: "agent_report_01", name: "ReportGen", type: "REPORTING" },
  { id: "agent_workflow_01", name: "WorkflowOrchestrator", type: "WORKFLOW_AUTOMATION" },
];

// ─── Seed Functions ────────────────────────

function seedMarketplace(): void {
  const engine = getMarketplaceEngine();
  const listings = [
    {
      name: "FraudGuard Enterprise",
      description: "Real-time fraud detection with ML-powered anomaly scoring",
      longDescription: "Enterprise-grade fraud monitoring agent that analyzes transaction patterns, flags suspicious activity, and integrates with payment gateways. Supports custom rule engines and regulatory reporting.",
      category: "fraud_detection" as const,
      tags: ["fraud", "ml", "real-time", "compliance"],
      tenantId: "vendor_acme",
      authorName: "ACME Security",
      version: "2.1.0",
      pricing: { type: "subscription" as const, priceUsd: 299, billingPeriod: "monthly" as const },
      agentConfig: { type: "FRAUD_MONITORING", systemPrompt: "Monitor transactions for fraud patterns", model: "gpt-4o", provider: "openai", tools: ["transaction_analyzer", "risk_scorer"], triggers: [], integrations: ["stripe", "plaid"], complianceFrameworks: ["PCI-DSS", "SOX"], requiredPermissions: ["transactions:read", "alerts:write"] },
    },
    {
      name: "SupportBot Pro",
      description: "AI-powered customer support with sentiment analysis and auto-escalation",
      longDescription: "Handles tier-1 support tickets, routes complex issues, and learns from resolution patterns. Supports multi-language and integrates with popular helpdesk platforms.",
      category: "customer_support" as const,
      tags: ["support", "nlp", "sentiment", "ticketing"],
      tenantId: "vendor_helpai",
      authorName: "HelpAI Inc",
      version: "3.0.1",
      pricing: { type: "usage_based" as const, priceUsd: 0, usageRate: 0.02 },
      agentConfig: { type: "CUSTOMER_SUPPORT", systemPrompt: "Resolve customer inquiries efficiently", model: "gpt-4o-mini", provider: "openai", tools: ["ticket_manager", "knowledge_search"], triggers: [], integrations: ["zendesk", "intercom"], complianceFrameworks: [], requiredPermissions: ["tickets:read", "tickets:write"] },
    },
    {
      name: "DocProcessor AI",
      description: "Intelligent document extraction with OCR and classification",
      longDescription: "Processes invoices, contracts, and forms with 99.2% accuracy. Extracts key fields, classifies document types, and routes for approval workflows.",
      category: "document_processing" as const,
      tags: ["ocr", "extraction", "classification", "invoices"],
      tenantId: "vendor_docai",
      authorName: "DocAI Labs",
      version: "1.5.0",
      pricing: { type: "one_time" as const, priceUsd: 499 },
      agentConfig: { type: "DOCUMENT_PROCESSING", systemPrompt: "Extract and classify document content", model: "gpt-4o", provider: "openai", tools: ["ocr_engine", "field_extractor"], triggers: [], integrations: ["s3", "google-drive"], complianceFrameworks: ["GDPR"], requiredPermissions: ["documents:read", "documents:write"] },
    },
    {
      name: "ComplianceGuard",
      description: "Automated regulatory compliance monitoring and reporting",
      longDescription: "Continuously monitors operations against SOX, GDPR, HIPAA, and PCI-DSS frameworks. Generates audit-ready reports and tracks remediation.",
      category: "compliance" as const,
      tags: ["compliance", "audit", "sox", "gdpr", "hipaa"],
      tenantId: "vendor_regtech",
      authorName: "RegTech Solutions",
      version: "2.0.0",
      pricing: { type: "subscription" as const, priceUsd: 199, billingPeriod: "monthly" as const },
      agentConfig: { type: "COMPLIANCE", systemPrompt: "Monitor and report on regulatory compliance", model: "gpt-4o", provider: "openai", tools: ["compliance_checker", "report_generator"], triggers: [], integrations: ["jira", "confluence"], complianceFrameworks: ["SOX", "GDPR", "HIPAA", "PCI-DSS"], requiredPermissions: ["compliance:read", "reports:write"] },
    },
    {
      name: "DataPipeline Builder",
      description: "No-code data pipeline creation with anomaly detection",
      longDescription: "Build ETL pipelines with natural language. Monitors data quality, detects anomalies, and alerts on schema drift. Supports 50+ data source connectors.",
      category: "data_analysis" as const,
      tags: ["etl", "data-quality", "anomaly-detection", "pipeline"],
      tenantId: "vendor_dataflow",
      authorName: "DataFlow Inc",
      version: "1.2.0",
      pricing: { type: "free" as const, priceUsd: 0 },
      agentConfig: { type: "DATA_ANALYST", systemPrompt: "Build and monitor data pipelines", model: "gpt-4o-mini", provider: "openai", tools: ["query_builder", "schema_analyzer"], triggers: [], integrations: ["postgresql", "snowflake", "bigquery"], complianceFrameworks: [], requiredPermissions: ["data:read", "pipelines:write"] },
    },
    {
      name: "EmailCampaign AI",
      description: "Personalized email automation with A/B testing and analytics",
      longDescription: "Creates targeted email campaigns, optimizes send times, personalizes content per recipient, and provides detailed engagement analytics.",
      category: "marketing" as const,
      tags: ["email", "campaigns", "personalization", "analytics"],
      tenantId: "vendor_mailai",
      authorName: "MailAI Corp",
      version: "1.8.0",
      pricing: { type: "subscription" as const, priceUsd: 79, billingPeriod: "monthly" as const },
      agentConfig: { type: "EMAIL_COMMUNICATION", systemPrompt: "Optimize email campaigns for engagement", model: "gpt-4o-mini", provider: "openai", tools: ["template_builder", "ab_tester"], triggers: [], integrations: ["sendgrid", "mailchimp"], complianceFrameworks: ["CAN-SPAM", "GDPR"], requiredPermissions: ["emails:write", "contacts:read"] },
    },
    {
      name: "ReportGen Enterprise",
      description: "Automated executive reporting with data visualization",
      longDescription: "Generates scheduled and ad-hoc reports from multiple data sources. Creates executive summaries, trend analyses, and interactive dashboards.",
      category: "data_analysis" as const,
      tags: ["reports", "visualization", "executive", "scheduled"],
      tenantId: "vendor_bitools",
      authorName: "BI Tools Co",
      version: "2.3.0",
      pricing: { type: "subscription" as const, priceUsd: 149, billingPeriod: "monthly" as const },
      agentConfig: { type: "REPORTING", systemPrompt: "Generate comprehensive business reports", model: "gpt-4o", provider: "openai", tools: ["data_aggregator", "chart_builder"], triggers: [], integrations: ["tableau", "looker", "postgresql"], complianceFrameworks: [], requiredPermissions: ["data:read", "reports:write"] },
    },
    {
      name: "WorkflowMaster",
      description: "Visual multi-agent workflow orchestration with conditional routing",
      longDescription: "Design complex multi-step workflows with drag-and-drop. Supports conditional branching, parallel execution, error handling, and human-in-the-loop approvals.",
      category: "operations" as const,
      tags: ["workflow", "orchestration", "automation", "no-code"],
      tenantId: "vendor_flowai",
      authorName: "FlowAI Systems",
      version: "1.0.0",
      pricing: { type: "free" as const, priceUsd: 0 },
      agentConfig: { type: "WORKFLOW_AUTOMATION", systemPrompt: "Orchestrate multi-step agent workflows", model: "gpt-4o", provider: "openai", tools: ["dag_builder", "condition_evaluator"], triggers: [], integrations: ["slack", "jira", "github"], complianceFrameworks: [], requiredPermissions: ["workflows:write", "agents:execute"] },
    },
  ];

  for (const listing of listings) {
    engine.publish(listing);
  }
}

function seedGovernance(): void {
  const engine = getGovernanceEngine();

  // Model cards for 3 key agents
  const cardParams = [
    { agentId: "agent_fraud_01", agentName: "FraudGuard Pro", agentType: "FRAUD_MONITORING", taskType: "transaction_analysis", intendedUse: "Real-time fraud detection in financial transactions", performanceMetrics: { accuracy: 0.967, precision: 0.943, recall: 0.982, f1Score: 0.962 } },
    { agentId: "agent_compliance_01", agentName: "ComplianceChecker", agentType: "COMPLIANCE", taskType: "regulatory_monitoring", intendedUse: "Automated compliance checks against SOX, GDPR, HIPAA", performanceMetrics: { accuracy: 0.991, precision: 0.988, recall: 0.994, f1Score: 0.991 } },
    { agentId: "agent_support_01", agentName: "SupportBot AI", agentType: "CUSTOMER_SUPPORT", taskType: "ticket_resolution", intendedUse: "First-tier customer support ticket handling", performanceMetrics: { accuracy: 0.912, resolutionRate: 0.847, csat: 4.3, avgResponseTimeSec: 2.1 } },
  ];

  for (const params of cardParams) {
    engine.generateModelCard({ ...params, tenantId: DEMO_TENANT, modelProvider: "OpenAI", modelName: "gpt-4o" });
  }

  // Governance decisions
  const decisions = [
    { agentId: "agent_fraud_01", decision: "approved", rationale: "Passed all bias checks; disparate impact ratio within acceptable range", decidedBy: "Sarah Chen, Chief Risk Officer", impact: "high" as const },
    { agentId: "agent_fraud_01", decision: "approved_with_conditions", rationale: "Requires human review for transactions above $50,000", decidedBy: "James Wilson, VP Engineering", impact: "high" as const },
    { agentId: "agent_compliance_01", decision: "approved", rationale: "Meets SOX audit requirements; logging and lineage fully implemented", decidedBy: "Maria Lopez, General Counsel", impact: "medium" as const },
    { agentId: "agent_support_01", decision: "approved", rationale: "CSAT scores meet threshold; escalation paths properly configured", decidedBy: "David Park, CTO", impact: "low" as const },
    { agentId: "agent_data_01", decision: "deferred", rationale: "Pending data privacy impact assessment for PII handling", decidedBy: "Sarah Chen, Chief Risk Officer", impact: "medium" as const },
  ];

  for (const d of decisions) {
    engine.recordDecision({ ...d, tenantId: DEMO_TENANT });
  }

  // Compliance report
  engine.generateComplianceReport(DEMO_TENANT, "SOX", 90);
}

function seedOrchestration(): void {
  const engine = getOrchestrationEngine();

  engine.createFromTemplate(DEMO_TENANT, "fraud_detection_pipeline");
  engine.createFromTemplate(DEMO_TENANT, "customer_escalation");
}

function seedDashboard(): void {
  const engine = getDashboardEngine();

  const agentMetrics = [
    { agentId: "agent_fraud_01", agentName: "FraudGuard Pro", agentType: "FRAUD_MONITORING", executions: 12450, successRate: 0.967, avgLatencyMs: 340, costUsd: 1245.00, savingsUsd: 45000, roi: 3515, trend: "improving" as const, healthStatus: "healthy" as const },
    { agentId: "agent_support_01", agentName: "SupportBot AI", agentType: "CUSTOMER_SUPPORT", executions: 8920, successRate: 0.912, avgLatencyMs: 520, costUsd: 446.00, savingsUsd: 28500, roi: 6290, trend: "stable" as const, healthStatus: "healthy" as const },
    { agentId: "agent_docs_01", agentName: "DocProcessor", agentType: "DOCUMENT_PROCESSING", executions: 5640, successRate: 0.992, avgLatencyMs: 1800, costUsd: 845.00, savingsUsd: 18900, roi: 2137, trend: "improving" as const, healthStatus: "healthy" as const },
    { agentId: "agent_compliance_01", agentName: "ComplianceChecker", agentType: "COMPLIANCE", executions: 3200, successRate: 0.991, avgLatencyMs: 890, costUsd: 640.00, savingsUsd: 22000, roi: 3337, trend: "stable" as const, healthStatus: "healthy" as const },
    { agentId: "agent_data_01", agentName: "DataPipeline", agentType: "DATA_ANALYST", executions: 7100, successRate: 0.945, avgLatencyMs: 2100, costUsd: 355.00, savingsUsd: 15200, roi: 4182, trend: "stable" as const, healthStatus: "warning" as const },
    { agentId: "agent_email_01", agentName: "EmailAutomation", agentType: "EMAIL_COMMUNICATION", executions: 15300, successRate: 0.988, avgLatencyMs: 210, costUsd: 153.00, savingsUsd: 9200, roi: 5913, trend: "improving" as const, healthStatus: "healthy" as const },
    { agentId: "agent_report_01", agentName: "ReportGen", agentType: "REPORTING", executions: 1890, successRate: 0.978, avgLatencyMs: 3200, costUsd: 567.00, savingsUsd: 12400, roi: 2087, trend: "declining" as const, healthStatus: "healthy" as const },
    { agentId: "agent_workflow_01", agentName: "WorkflowOrchestrator", agentType: "WORKFLOW_AUTOMATION", executions: 4250, successRate: 0.956, avgLatencyMs: 1450, costUsd: 425.00, savingsUsd: 19800, roi: 4558, trend: "improving" as const, healthStatus: "healthy" as const },
  ];

  for (const metrics of agentMetrics) {
    engine.recordAgentMetrics(DEMO_TENANT, metrics);
  }

  engine.configure({
    tenantId: DEMO_TENANT,
    periodDays: 30,
    refreshIntervalMinutes: 15,
    alertThresholds: { minSuccessRate: 0.90, maxLatencyMs: 5000, maxCostPerDay: 500, minROI: 100 },
  });
}

function seedDrift(): void {
  const detector = getDriftDetector();
  const now = Date.now();

  // Seed 25 normal samples for each of 3 agents to establish baselines
  const agentProfiles = [
    { agentId: "agent_fraud_01", tenantId: DEMO_TENANT, baseLatency: 340, baseTokens: 850, baseConfidence: 0.95, baseCost: 0.10 },
    { agentId: "agent_support_01", tenantId: DEMO_TENANT, baseLatency: 520, baseTokens: 1200, baseConfidence: 0.88, baseCost: 0.06 },
    { agentId: "agent_docs_01", tenantId: DEMO_TENANT, baseLatency: 1800, baseTokens: 2400, baseConfidence: 0.97, baseCost: 0.15 },
  ];

  for (const profile of agentProfiles) {
    for (let i = 0; i < 25; i++) {
      const jitter = 0.9 + Math.random() * 0.2; // 0.9-1.1 range
      detector.recordSample({
        agentId: profile.agentId,
        tenantId: profile.tenantId,
        timestamp: now - (25 - i) * 3600_000,
        latencyMs: Math.round(profile.baseLatency * jitter),
        tokenUsage: Math.round(profile.baseTokens * jitter),
        confidence: Math.min(1, profile.baseConfidence * jitter),
        toolsUsed: ["analyzer", "scorer"],
        outcome: "success",
        reasoningSteps: 3,
        costUsd: profile.baseCost * jitter,
        success: true,
      });
    }
  }

  // Inject anomalous samples to trigger drift events
  // Critical: fraud agent latency spike
  detector.recordSample({
    agentId: "agent_fraud_01", tenantId: DEMO_TENANT, timestamp: now - 1800_000,
    latencyMs: 1200, tokenUsage: 2800, confidence: 0.62,
    toolsUsed: ["analyzer"], outcome: "flagged", reasoningSteps: 8, costUsd: 0.35, success: true,
  });

  // Warning: support agent confidence drop
  detector.recordSample({
    agentId: "agent_support_01", tenantId: DEMO_TENANT, timestamp: now - 900_000,
    latencyMs: 780, tokenUsage: 1800, confidence: 0.55,
    toolsUsed: ["knowledge_search"], outcome: "escalated", reasoningSteps: 5, costUsd: 0.12, success: true,
  });
}

function seedTeam(): void {
  const engine = getTeamEngine();

  engine.addOwner(DEMO_TENANT, "admin@acme-demo.com", "Sarah Chen");

  // Invite and accept team members
  const members = [
    { email: "james.wilson@acme-demo.com", name: "James Wilson", role: "admin" as const },
    { email: "dev1@acme-demo.com", name: "Alex Rivera", role: "editor" as const },
    { email: "dev2@acme-demo.com", name: "Priya Patel", role: "editor" as const },
  ];

  for (const m of members) {
    const invite = engine.invite({ tenantId: DEMO_TENANT, email: m.email, role: m.role, invitedBy: "admin@acme-demo.com" });
    engine.acceptInvite(invite.token, m.name);
  }
}

function seedPromptVersioning(): void {
  const engine = getPromptVersioningEngine();

  // FraudGuard prompt evolution
  const fraudPrompts = [
    { content: "You are a fraud detection agent. Flag suspicious transactions.", message: "Initial fraud detection prompt", author: "Sarah Chen" },
    { content: "You are a fraud detection agent. Analyze transaction patterns including amount, frequency, and location. Flag transactions that deviate from the user's historical pattern by more than 2 standard deviations.", message: "Add statistical thresholds for pattern matching", author: "James Wilson" },
    { content: "You are a fraud detection agent. Analyze transaction patterns including amount, frequency, location, and device fingerprint. Flag transactions that deviate from the user's historical pattern by more than 2 standard deviations. For high-value transactions (>$10,000), always require human review. Report confidence scores with each flag.", message: "Add high-value threshold and confidence scoring", author: "Alex Rivera" },
    { content: "You are a fraud detection agent specializing in real-time transaction monitoring.\n\nAnalysis criteria:\n- Amount deviation (>2 sigma from user history)\n- Frequency anomalies (velocity checks)\n- Geographic impossibility (speed-of-travel)\n- Device fingerprint changes\n- Merchant category shifts\n\nEscalation rules:\n- Transactions >$10,000: mandatory human review\n- Confidence <70%: queue for manual analysis\n- Multiple flags in 1hr: trigger account freeze recommendation\n\nAlways include: confidence score, risk factors, recommended action.", message: "Production-ready prompt with structured analysis criteria", author: "Sarah Chen" },
  ];

  for (const p of fraudPrompts) {
    engine.commit({ agentId: "agent_fraud_01", tenantId: DEMO_TENANT, ...p });
  }

  // SupportBot prompt evolution
  const supportPrompts = [
    { content: "You are a customer support agent. Help customers with their issues.", message: "Initial support prompt", author: "Priya Patel" },
    { content: "You are a customer support agent for ACME Corp. Help customers with billing, technical issues, and account management. Be friendly and professional. Escalate to human support when you cannot resolve an issue within 3 exchanges.", message: "Add scope and escalation rules", author: "Priya Patel" },
    { content: "You are a customer support agent for ACME Corp.\n\nCapabilities:\n- Billing inquiries: check balance, explain charges, process refunds (<$50)\n- Technical support: troubleshoot common issues, guide through setup\n- Account management: update info, password resets, plan changes\n\nGuidelines:\n- Greet customers by name when available\n- Maintain professional, empathetic tone\n- Escalate to human after 3 unresolved exchanges\n- Never share internal system details\n- Log all interactions for quality review", message: "Structured capabilities and guidelines", author: "James Wilson" },
  ];

  for (const p of supportPrompts) {
    engine.commit({ agentId: "agent_support_01", tenantId: DEMO_TENANT, ...p });
  }

  // ComplianceChecker prompt evolution
  const compliancePrompts = [
    { content: "Monitor regulatory compliance for the organization.", message: "Initial compliance prompt", author: "Sarah Chen" },
    { content: "You are a compliance monitoring agent. Check operations against SOX, GDPR, HIPAA, and PCI-DSS frameworks. Generate findings with severity levels (critical, high, medium, low). Track remediation status and deadlines.", message: "Add framework-specific monitoring", author: "Sarah Chen" },
    { content: "You are a compliance monitoring agent for regulated industries.\n\nFrameworks monitored:\n- SOX: Financial controls, audit trails, access management\n- GDPR: Data processing, consent management, right to erasure\n- HIPAA: PHI handling, access controls, breach notification\n- PCI-DSS: Cardholder data, network security, vulnerability management\n\nFor each finding:\n1. Classify severity (critical/high/medium/low)\n2. Reference specific regulation section\n3. Provide remediation steps\n4. Set deadline based on severity\n5. Track evidence of compliance\n\nGenerate weekly summary reports and real-time alerts for critical findings.", message: "Comprehensive multi-framework compliance prompt", author: "Maria Lopez" },
  ];

  for (const p of compliancePrompts) {
    engine.commit({ agentId: "agent_compliance_01", tenantId: DEMO_TENANT, ...p });
  }
}

function seedNotifications(): void {
  const engine = getNotificationEngine();
  const now = Date.now();

  const notifications = [
    { category: "alert" as const, priority: "critical" as const, title: "Drift Detected: FraudGuard Pro", message: "Latency spike detected — 253% above baseline. Review recommended.", actionUrl: "/dashboard/agents/agent_fraud_01" },
    { category: "alert" as const, priority: "high" as const, title: "SupportBot Confidence Drop", message: "Average confidence score dropped to 55% in the last hour.", actionUrl: "/dashboard/agents/agent_support_01" },
    { category: "alert" as const, priority: "medium" as const, title: "DataPipeline Health Warning", message: "Success rate at 94.5% — below 95% threshold.", actionUrl: "/dashboard/agents/agent_data_01" },
    { category: "system" as const, priority: "low" as const, title: "Weekly Compliance Report Ready", message: "SOX compliance report for Q1 2026 has been generated.", actionUrl: "/dashboard/governance" },
    { category: "team" as const, priority: "low" as const, title: "James Wilson joined the team", message: "James Wilson accepted the invitation and joined as Admin.", actionUrl: "/dashboard/users" },
    { category: "team" as const, priority: "low" as const, title: "Alex Rivera joined the team", message: "Alex Rivera accepted the invitation and joined as Editor.", actionUrl: "/dashboard/users" },
    { category: "update" as const, priority: "low" as const, title: "FraudGuard Prompt Updated", message: "Sarah Chen committed version 4 of the FraudGuard Pro prompt.", actionUrl: "/dashboard/agents/versions" },
    { category: "system" as const, priority: "low" as const, title: "Marketplace: New Listing Published", message: "FraudGuard Enterprise is now available in the marketplace.", actionUrl: "/dashboard/marketplace" },
    { category: "billing" as const, priority: "medium" as const, title: "Usage Alert: 75% of Monthly Quota", message: "You have used 75% of your monthly execution quota (37,500 / 50,000).", actionUrl: "/dashboard/settings/billing" },
    { category: "update" as const, priority: "low" as const, title: "Orchestration Workflow Started", message: "Fraud Detection Pipeline workflow is now running.", actionUrl: "/dashboard/workflows" },
    { category: "system" as const, priority: "low" as const, title: "Daily Performance Summary", message: "All 8 agents operational. Total savings: $4,250 today.", actionUrl: "/dashboard" },
    { category: "alert" as const, priority: "high" as const, title: "API Rate Limit Warning", message: "Tenant approaching 80% of API rate limit (96/120 requests per minute).", actionUrl: "/dashboard/settings" },
    { category: "update" as const, priority: "low" as const, title: "ComplianceChecker Model Card Updated", message: "Model card for ComplianceChecker has been approved by Maria Lopez.", actionUrl: "/dashboard/governance" },
    { category: "team" as const, priority: "low" as const, title: "Priya Patel joined the team", message: "Priya Patel accepted the invitation and joined as Editor.", actionUrl: "/dashboard/users" },
    { category: "system" as const, priority: "low" as const, title: "Platform Update v2.4.0", message: "New features: enhanced drift detection, improved marketplace search, and prompt branching.", actionUrl: "/dashboard" },
  ];

  // Spread notifications over the last 48 hours
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    engine.send({
      tenantId: DEMO_TENANT,
      recipientId: DEMO_USER,
      category: n.category,
      priority: n.priority,
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl,
      metadata: { createdOffset: now - (notifications.length - i) * 3_600_000 },
    });
  }
}

// ─── Main Seeder ───────────────────────────

let demoEnvironment: DemoEnvironment | null = null;

export function seedDemoEnvironment(): DemoEnvironment {
  if (demoEnvironment?.initialized) {
    return demoEnvironment;
  }

  seedMarketplace();
  seedGovernance();
  seedOrchestration();
  seedDashboard();
  seedDrift();
  seedTeam();
  seedPromptVersioning();
  seedNotifications();

  demoEnvironment = {
    tenantId: DEMO_TENANT,
    agents: DEMO_AGENTS,
    initialized: true,
    seededAt: Date.now(),
  };

  return demoEnvironment;
}

export function getDemoEnvironment(): DemoEnvironment | null {
  return demoEnvironment;
}

export function isDemoInitialized(): boolean {
  return demoEnvironment?.initialized ?? false;
}
