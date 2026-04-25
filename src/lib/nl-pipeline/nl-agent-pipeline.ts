/**
 * Natural Language → Production Agent Pipeline
 *
 * Takes a plain English description and generates a fully configured,
 * deployable agent with integrations, approval gates, and scheduling.
 * "Build me a fraud agent that monitors transactions over $5K and Slacks the team"
 * → production-ready agent config.
 */

// ─── Types ─────────────────────────────────

export interface NLAgentRequest {
  description: string;
  tenantId: string;
  requestedBy: string;
}

export interface ParsedIntent {
  agentType: string;
  agentName: string;
  description: string;
  triggers: TriggerConfig[];
  actions: ActionConfig[];
  integrations: IntegrationRef[];
  approvalGates: ApprovalGateConfig[];
  schedule: string | null;
  model: string;
  confidence: number;
  extractedEntities: Record<string, unknown>;
}

export interface TriggerConfig {
  type: "threshold" | "schedule" | "webhook" | "event" | "manual";
  condition: string;
  parameters: Record<string, unknown>;
}

export interface ActionConfig {
  type: "alert" | "block" | "report" | "escalate" | "notify" | "analyze" | "create_ticket";
  target: string;
  parameters: Record<string, unknown>;
}

export interface IntegrationRef {
  provider: string;
  purpose: string;
  config: Record<string, unknown>;
}

export interface ApprovalGateConfig {
  action: string;
  threshold: string;
  approvers: string[];
}

export interface GeneratedAgentConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  status: "draft" | "ready" | "deployed";
  systemPrompt: string;
  model: string;
  provider: string;
  tools: string[];
  triggers: TriggerConfig[];
  actions: ActionConfig[];
  integrations: IntegrationRef[];
  approvalGates: ApprovalGateConfig[];
  schedule: string | null;
  estimatedCostPerMonth: number;
  tenantId: string;
  createdBy: string;
  createdAt: number;
  parsedIntent: ParsedIntent;
}

export interface PipelineResult {
  success: boolean;
  agentConfig: GeneratedAgentConfig;
  warnings: string[];
  requiredSetup: string[];
  deploymentChecklist: string[];
}

// ─── Intent Patterns ───────────────────────

interface IntentPattern {
  keywords: string[];
  agentType: string;
  defaultModel: string;
  defaultTools: string[];
  systemPromptTemplate: string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    keywords: ["fraud", "suspicious", "anomal", "risk score", "flag", "block transaction", "money laundering"],
    agentType: "FRAUD_MONITORING",
    defaultModel: "gpt-4o",
    defaultTools: ["query_database", "send_alert", "recall_memory"],
    systemPromptTemplate: "You are a Fraud Monitoring Agent. Analyze transactions for suspicious patterns, calculate risk scores, and flag high-risk items for review. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["compliance", "kyc", "aml", "regulat", "audit", "policy", "sanction", "pep"],
    agentType: "COMPLIANCE",
    defaultModel: "gpt-4o",
    defaultTools: ["query_database", "generate_report", "recall_memory"],
    systemPromptTemplate: "You are a Compliance Agent. Run KYC/AML checks, monitor regulatory requirements, flag policy violations, and generate compliance reports. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["report", "summary", "dashboard", "metric", "kpi", "analytic", "digest"],
    agentType: "REPORTING",
    defaultModel: "gpt-4o-mini",
    defaultTools: ["query_database", "generate_report"],
    systemPromptTemplate: "You are a Reporting Agent. Aggregate data from multiple sources, identify trends, and generate executive summaries. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["customer", "support", "ticket", "complaint", "help desk", "respond", "escalat"],
    agentType: "CUSTOMER_SUPPORT",
    defaultModel: "gpt-4o",
    defaultTools: ["query_database", "send_alert", "recall_memory"],
    systemPromptTemplate: "You are a Customer Support Agent. Route tickets, generate responses, and escalate issues requiring human attention. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["finance", "invoice", "reconcil", "forecast", "budget", "expense", "revenue", "payment"],
    agentType: "FINANCE",
    defaultModel: "gpt-4o",
    defaultTools: ["query_database", "generate_report"],
    systemPromptTemplate: "You are a Finance Agent. Handle reconciliation, invoicing, and forecasting. Track financial discrepancies and flag anomalies. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["data", "analyz", "pattern", "insight", "trend", "dataset", "correlation"],
    agentType: "DATA_ANALYST",
    defaultModel: "gpt-4o",
    defaultTools: ["query_database", "generate_report", "recall_memory"],
    systemPromptTemplate: "You are a Data Analyst Agent. Analyze datasets, detect patterns, and generate actionable insights. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["workflow", "automat", "orchestrat", "pipeline", "process", "sequence"],
    agentType: "WORKFLOW_AUTOMATION",
    defaultModel: "gpt-4o-mini",
    defaultTools: ["query_database", "send_alert"],
    systemPromptTemplate: "You are a Workflow Automation Agent. Orchestrate multi-step processes and ensure reliable execution. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["document", "pdf", "extract", "contract", "invoice processing", "ocr"],
    agentType: "DOCUMENT_PROCESSING",
    defaultModel: "gpt-4o",
    defaultTools: ["query_database", "generate_report"],
    systemPromptTemplate: "You are a Document Processing Agent. Extract structured data from documents, contracts, and invoices. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["email", "communicat", "message", "notify", "outreach"],
    agentType: "EMAIL_COMMUNICATION",
    defaultModel: "gpt-4o-mini",
    defaultTools: ["query_database", "send_alert"],
    systemPromptTemplate: "You are an Email/Communication Agent. Process inbound messages, generate responses, and manage communications. {CUSTOM_INSTRUCTIONS}",
  },
  {
    keywords: ["monitor", "health", "incident", "uptime", "alert", "ops", "devops"],
    agentType: "OPERATIONS",
    defaultModel: "gpt-4o-mini",
    defaultTools: ["query_database", "send_alert", "recall_memory"],
    systemPromptTemplate: "You are an Operations Agent. Monitor system health, detect incidents, and coordinate response. {CUSTOM_INSTRUCTIONS}",
  },
];

// ─── Entity Extractors ─────────────────────

const ENTITY_PATTERNS: Array<{ name: string; pattern: RegExp; extract: (match: RegExpMatchArray) => unknown }> = [
  { name: "monetary_threshold", pattern: /\$[\d,]+(?:\.\d{2})?|\d+(?:,\d{3})*\s*(?:dollars|usd)/i, extract: (m) => parseFloat(m[0].replace(/[$,]/g, "")) },
  { name: "time_interval", pattern: /(?:every|each)\s+(\d+)\s*(minute|hour|day|week|month)s?/i, extract: (m) => ({ value: parseInt(m[1]), unit: m[2] }) },
  { name: "schedule", pattern: /(daily|weekly|hourly|every morning|every evening|twice daily|real-?time)/i, extract: (m) => m[1].toLowerCase() },
  { name: "email_recipients", pattern: /(?:email|notify|send to|alert)\s+(?:the\s+)?([a-zA-Z\s,]+?)(?:\s+(?:team|group|department))?(?:\s|$|,|\.)/i, extract: (m) => m[1].trim() },
  { name: "channel", pattern: /#([a-z0-9_-]+)/i, extract: (m) => m[1] },
  { name: "count_threshold", pattern: /(?:more than|over|above|exceeds?|greater than)\s+(\d+)/i, extract: (m) => parseInt(m[1]) },
];

const INTEGRATION_KEYWORDS: Record<string, string> = {
  slack: "slack",
  teams: "teams",
  salesforce: "salesforce",
  hubspot: "hubspot",
  pagerduty: "pagerduty",
  jira: "jira",
  github: "github",
  email: "sendgrid",
  sms: "twilio",
  text: "twilio",
  s3: "aws_s3",
  webhook: "webhook",
};

const ACTION_KEYWORDS: Record<string, ActionConfig["type"]> = {
  alert: "alert",
  notify: "notify",
  block: "block",
  flag: "alert",
  escalate: "escalate",
  report: "report",
  ticket: "create_ticket",
  analyze: "analyze",
};

// ─── NL Pipeline ───────────────────────────

export class NLAgentPipeline {
  /**
   * Parse a natural language description into a structured intent
   */
  parseIntent(description: string): ParsedIntent {
    const lower = description.toLowerCase();

    // Match agent type
    let bestMatch: IntentPattern | null = null;
    let bestScore = 0;
    for (const pattern of INTENT_PATTERNS) {
      const score = pattern.keywords.filter((kw) => lower.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    if (!bestMatch) bestMatch = INTENT_PATTERNS[0]; // default to fraud

    // Extract entities
    const entities: Record<string, unknown> = {};
    for (const ep of ENTITY_PATTERNS) {
      const match = description.match(ep.pattern);
      if (match) {
        entities[ep.name] = ep.extract(match);
      }
    }

    // Detect integrations
    const integrations: IntegrationRef[] = [];
    for (const [keyword, provider] of Object.entries(INTEGRATION_KEYWORDS)) {
      if (lower.includes(keyword)) {
        integrations.push({
          provider,
          purpose: `Send ${keyword} notifications from agent`,
          config: {},
        });
      }
    }

    // Detect actions
    const actions: ActionConfig[] = [];
    for (const [keyword, actionType] of Object.entries(ACTION_KEYWORDS)) {
      if (lower.includes(keyword)) {
        actions.push({
          type: actionType,
          target: integrations[0]?.provider || "platform",
          parameters: {},
        });
      }
    }

    // Detect triggers
    const triggers: TriggerConfig[] = [];
    if (entities.monetary_threshold) {
      triggers.push({
        type: "threshold",
        condition: `amount > ${entities.monetary_threshold}`,
        parameters: { field: "amount", operator: "gt", value: entities.monetary_threshold },
      });
    }
    if (entities.count_threshold) {
      triggers.push({
        type: "threshold",
        condition: `count > ${entities.count_threshold}`,
        parameters: { field: "count", operator: "gt", value: entities.count_threshold },
      });
    }

    // Detect schedule
    let schedule: string | null = null;
    if (entities.schedule) {
      const scheduleMap: Record<string, string> = {
        daily: "0 0 * * *",
        weekly: "0 0 * * 1",
        hourly: "0 * * * *",
        "every morning": "0 8 * * *",
        "every evening": "0 18 * * *",
        "twice daily": "0 8,18 * * *",
        "real-time": "realtime",
        realtime: "realtime",
      };
      schedule = scheduleMap[entities.schedule as string] || null;
    }
    if (entities.time_interval) {
      const interval = entities.time_interval as { value: number; unit: string };
      const cronMap: Record<string, string> = {
        minute: `*/${interval.value} * * * *`,
        hour: `0 */${interval.value} * * *`,
        day: `0 0 */${interval.value} * *`,
      };
      schedule = cronMap[interval.unit] || null;
    }

    // Detect approval gates
    const approvalGates: ApprovalGateConfig[] = [];
    if (lower.includes("approv") || lower.includes("review") || lower.includes("human")) {
      approvalGates.push({
        action: "high_impact_action",
        threshold: entities.monetary_threshold ? `amount > ${entities.monetary_threshold}` : "high_risk",
        approvers: ["admin", "compliance_officer"],
      });
    }

    // Generate name from description
    const agentName = this.generateName(description, bestMatch.agentType);

    const confidence = Math.min(0.95, 0.4 + bestScore * 0.15 + Object.keys(entities).length * 0.05 + integrations.length * 0.05);

    return {
      agentType: bestMatch.agentType,
      agentName,
      description: description.slice(0, 200),
      triggers,
      actions: actions.length > 0 ? actions : [{ type: "alert", target: "platform", parameters: {} }],
      integrations,
      approvalGates,
      schedule,
      model: bestMatch.defaultModel,
      confidence: Math.round(confidence * 100) / 100,
      extractedEntities: entities,
    };
  }

  /**
   * Generate a full agent configuration from natural language
   */
  generateAgent(request: NLAgentRequest): PipelineResult {
    const intent = this.parseIntent(request.description);
    const pattern = INTENT_PATTERNS.find((p) => p.agentType === intent.agentType) || INTENT_PATTERNS[0];

    const customInstructions = this.buildCustomInstructions(intent);
    const systemPrompt = pattern.systemPromptTemplate.replace("{CUSTOM_INSTRUCTIONS}", customInstructions);

    const config: GeneratedAgentConfig = {
      id: `agent_nl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: intent.agentName,
      type: intent.agentType,
      description: intent.description,
      status: intent.confidence >= 0.7 ? "ready" : "draft",
      systemPrompt,
      model: intent.model,
      provider: intent.model.startsWith("gpt") ? "openai" : "anthropic",
      tools: pattern.defaultTools,
      triggers: intent.triggers,
      actions: intent.actions,
      integrations: intent.integrations,
      approvalGates: intent.approvalGates,
      schedule: intent.schedule,
      estimatedCostPerMonth: this.estimateMonthlyCost(intent),
      tenantId: request.tenantId,
      createdBy: request.requestedBy,
      createdAt: Date.now(),
      parsedIntent: intent,
    };

    const warnings: string[] = [];
    if (intent.confidence < 0.5) {
      warnings.push("Low confidence in intent detection — please review configuration carefully");
    }
    if (intent.integrations.length > 0) {
      warnings.push("Integrations detected — ensure they are connected in Settings > Integrations");
    }

    const requiredSetup: string[] = [];
    for (const integration of intent.integrations) {
      requiredSetup.push(`Connect ${integration.provider} integration in Settings > Integrations`);
    }
    if (intent.approvalGates.length > 0) {
      requiredSetup.push("Configure approval gate policies in Dashboard > Approvals");
    }

    const deploymentChecklist = [
      "Review generated system prompt",
      "Verify trigger conditions match your requirements",
      "Test agent with sample data before production deployment",
      ...requiredSetup,
      "Set up monitoring and drift detection",
      "Configure cost limits in agent settings",
    ];

    return { success: true, agentConfig: config, warnings, requiredSetup, deploymentChecklist };
  }

  /**
   * Validate a generated config before deployment
   */
  validateConfig(config: GeneratedAgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.length < 2) errors.push("Agent name is required");
    if (!config.type) errors.push("Agent type is required");
    if (!config.systemPrompt) errors.push("System prompt is required");
    if (!config.model) errors.push("Model is required");
    if (config.tools.length === 0) errors.push("At least one tool is required");

    return { valid: errors.length === 0, errors };
  }

  // ─── Private Helpers ─────────────────────

  private generateName(description: string, agentType: string): string {
    const words = description.split(/\s+/).slice(0, 6);
    const meaningful = words.filter((w) => w.length > 3 && !["that", "which", "this", "with", "from", "when", "build", "create", "make"].includes(w.toLowerCase()));
    if (meaningful.length >= 2) {
      return meaningful.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") + " Agent";
    }
    const typeNames: Record<string, string> = {
      FRAUD_MONITORING: "Fraud Monitor",
      COMPLIANCE: "Compliance Checker",
      REPORTING: "Report Generator",
      CUSTOMER_SUPPORT: "Support Agent",
      FINANCE: "Finance Agent",
      DATA_ANALYST: "Data Analyst",
      OPERATIONS: "Ops Monitor",
    };
    return typeNames[agentType] || "Custom Agent";
  }

  private buildCustomInstructions(intent: ParsedIntent): string {
    const parts: string[] = [];

    for (const trigger of intent.triggers) {
      parts.push(`Monitor for: ${trigger.condition}`);
    }
    for (const action of intent.actions) {
      parts.push(`Action: ${action.type} via ${action.target}`);
    }
    if (intent.schedule) {
      parts.push(`Schedule: ${intent.schedule}`);
    }

    return parts.length > 0 ? "\n\nSpecific instructions:\n" + parts.map((p) => `- ${p}`).join("\n") : "";
  }

  private estimateMonthlyCost(intent: ParsedIntent): number {
    const costPerToken: Record<string, number> = {
      "gpt-4o": 0.0025,
      "gpt-4o-mini": 0.00015,
      "claude-3-opus": 0.015,
      "claude-3-sonnet": 0.003,
    };

    const tokenRate = costPerToken[intent.model] || 0.0025;
    const avgTokensPerExec = 2000;

    let execsPerMonth = 100; // default
    if (intent.schedule === "realtime") execsPerMonth = 10000;
    else if (intent.schedule?.includes("* * * *")) execsPerMonth = 30 * 24 * 60; // per minute
    else if (intent.schedule?.includes("0 * * * *")) execsPerMonth = 30 * 24; // hourly

    return Math.round(execsPerMonth * avgTokensPerExec * tokenRate * 100) / 100;
  }
}

// ─── Singleton ──────────────────────────────

let pipeline: NLAgentPipeline | null = null;

export function getNLPipeline(): NLAgentPipeline {
  if (!pipeline) {
    pipeline = new NLAgentPipeline();
  }
  return pipeline;
}
