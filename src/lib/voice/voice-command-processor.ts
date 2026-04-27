/**
 * Voice Command Processor — Fintech Edition
 *
 * Parses voice transcripts into structured commands with
 * fintech-specific intent taxonomy for banking and payments use cases.
 */

// ═══ Types ═══════════════════════════════════════════════

export type VoiceIntent =
  // Platform operations
  | "create_agent"
  | "check_status"
  | "run_agent"
  | "get_report"
  | "modify_config"
  | "list_agents"
  | "show_alerts"
  | "ask_question"
  // Fintech: Account & Balances
  | "check_balance"
  | "account_summary"
  | "transaction_history"
  // Fintech: Payments
  | "initiate_payment"
  | "payment_status"
  | "payment_history"
  // Fintech: Fraud & Risk
  | "fraud_report"
  | "flag_transaction"
  | "risk_score"
  // Fintech: Compliance & KYC
  | "kyc_status"
  | "compliance_report"
  | "regulatory_alert"
  // Fintech: Cards
  | "card_status"
  | "freeze_card"
  | "card_transactions"
  | "unknown";

export interface VoiceCommand {
  id: string;
  transcript: string;
  intent: VoiceIntent;
  entities: Record<string, string>;
  confidence: number;
  timestamp: number;
  response: string;
  executed: boolean;
  category: "platform" | "fintech";
}

export interface AgentStatusNarration {
  agentId: string;
  agentName: string;
  narration: string;
  metrics: Record<string, string>;
}

// ═══ Intent Patterns ═════════════════════════════════════

const INTENT_PATTERNS: {
  intent: VoiceIntent;
  category: "platform" | "fintech";
  patterns: RegExp[];
  entityExtractors: Record<string, RegExp>;
}[] = [
  // ── Platform ──────────────────────────────────────────
  {
    intent: "create_agent",
    category: "platform",
    patterns: [
      /(?:create|deploy|set up|build|add|make)\s+(?:a\s+)?(?:new\s+)?(\w+)\s+agent/i,
      /(?:I (?:want|need)\s+)?(?:a\s+)?(\w+)\s+agent/i,
    ],
    entityExtractors: {
      agentType: /(\w+)\s+agent/i,
      name: /(?:called|named)\s+"?([^"]+)"?/i,
    },
  },
  {
    intent: "check_status",
    category: "platform",
    patterns: [
      /(?:what(?:'s| is)\s+the\s+)?status\s+(?:of\s+)?/i,
      /how(?:'s| is)\s+(?:the\s+)?(\w+)\s+(?:agent|doing|going)/i,
      /(?:check|show)\s+(?:me\s+)?(?:the\s+)?status/i,
    ],
    entityExtractors: {
      agentName: /(?:status\s+of|how'?s?\s+(?:the\s+)?)([\w\s]+?)\s*(?:agent)?$/i,
    },
  },
  {
    intent: "run_agent",
    category: "platform",
    patterns: [
      /(?:run|execute|start|trigger)\s+(?:the\s+)?(\w+)\s+agent/i,
    ],
    entityExtractors: {
      agentName: /(?:run|execute|start|trigger)\s+(?:the\s+)?([\w\s]+?)\s*agent/i,
    },
  },
  {
    intent: "get_report",
    category: "platform",
    patterns: [
      /(?:show|get|give|generate|pull)\s+(?:me\s+)?(?:the\s+)?(?:a\s+)?(\w+)?\s*report/i,
    ],
    entityExtractors: {
      reportType: /(\w+)\s+report/i,
    },
  },
  {
    intent: "list_agents",
    category: "platform",
    patterns: [
      /(?:list|show|what\s+are)\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?(?:my\s+)?agents/i,
      /how\s+many\s+agents/i,
    ],
    entityExtractors: {},
  },
  {
    intent: "show_alerts",
    category: "platform",
    patterns: [
      /(?:show|list|what\s+are)\s+(?:me\s+)?(?:the\s+)?(?:any\s+)?alerts/i,
      /(?:any|are\s+there)\s+(?:new\s+)?(?:alerts|warnings|issues)/i,
    ],
    entityExtractors: {
      severity: /(\w+)\s+(?:alerts|warnings)/i,
    },
  },
  {
    intent: "modify_config",
    category: "platform",
    patterns: [
      /(?:change|update|modify|set|adjust)\s+(?:the\s+)?/i,
    ],
    entityExtractors: {
      setting: /(?:change|update|set)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i,
      value: /to\s+"?([^"]+)"?$/i,
    },
  },

  // ── Fintech: Account ──────────────────────────────────
  {
    intent: "check_balance",
    category: "fintech",
    patterns: [
      /(?:what(?:'s| is)?)\s+(?:my\s+)?(?:current\s+)?balance/i,
      /(?:check|show|get)\s+(?:my\s+)?(?:account\s+)?balance/i,
      /how\s+much\s+(?:do\s+I\s+have|is\s+in\s+my\s+account)/i,
    ],
    entityExtractors: {
      accountType: /(\w+)\s+(?:account|balance)/i,
    },
  },
  {
    intent: "account_summary",
    category: "fintech",
    patterns: [
      /(?:account\s+summary|financial\s+summary|overview)/i,
      /show\s+(?:my\s+)?accounts/i,
    ],
    entityExtractors: {},
  },
  {
    intent: "transaction_history",
    category: "fintech",
    patterns: [
      /(?:show|get|list)\s+(?:my\s+)?(?:recent\s+)?transactions/i,
      /(?:transaction\s+history|payment\s+history)/i,
      /what\s+did\s+I\s+(?:spend|pay)\s+/i,
    ],
    entityExtractors: {
      period: /(?:last|past)\s+(\d+\s+(?:days?|weeks?|months?))/i,
    },
  },

  // ── Fintech: Payments ─────────────────────────────────
  {
    intent: "initiate_payment",
    category: "fintech",
    patterns: [
      /(?:send|transfer|pay)\s+(?:R|ZAR|rand)?\s*[\d,]+/i,
      /(?:make|initiate|do)\s+(?:a\s+)?payment/i,
    ],
    entityExtractors: {
      amount: /(?:R|ZAR|rand)?\s*([\d,]+(?:\.\d{2})?)/i,
      recipient: /(?:to|for)\s+([A-Za-z\s]+?)(?:\s+now|\s+please)?$/i,
    },
  },
  {
    intent: "payment_status",
    category: "fintech",
    patterns: [
      /(?:status\s+of|check)\s+(?:my\s+)?payment/i,
      /(?:did|has)\s+(?:my\s+)?payment\s+(?:go\s+through|arrive|clear)/i,
    ],
    entityExtractors: {},
  },

  // ── Fintech: Fraud ────────────────────────────────────
  {
    intent: "fraud_report",
    category: "fintech",
    patterns: [
      /(?:fraud|suspicious)\s+(?:report|activity|transactions?)/i,
      /(?:show|list)\s+(?:me\s+)?(?:any\s+)?(?:fraud|suspicious)/i,
      /(?:flagged|blocked)\s+transactions?/i,
    ],
    entityExtractors: {},
  },
  {
    intent: "flag_transaction",
    category: "fintech",
    patterns: [
      /(?:flag|report|mark)\s+(?:this\s+)?(?:transaction|payment)\s+(?:as\s+)?(?:fraud|suspicious)/i,
      /I\s+(?:don't\s+recognise|didn't\s+make)\s+this/i,
    ],
    entityExtractors: {
      transactionId: /transaction\s+([A-Z0-9]+)/i,
    },
  },
  {
    intent: "risk_score",
    category: "fintech",
    patterns: [
      /(?:risk\s+score|risk\s+rating|risk\s+level)/i,
      /how\s+risky\s+is/i,
    ],
    entityExtractors: {},
  },

  // ── Fintech: Compliance ───────────────────────────────
  {
    intent: "kyc_status",
    category: "fintech",
    patterns: [
      /(?:KYC|know\s+your\s+customer)\s+(?:status|check|update)/i,
      /(?:verification|identity)\s+status/i,
    ],
    entityExtractors: {},
  },
  {
    intent: "compliance_report",
    category: "fintech",
    patterns: [
      /(?:compliance|regulatory)\s+(?:report|status|summary)/i,
      /(?:FICA|FSCA|POPIA)\s+(?:status|compliance)/i,
    ],
    entityExtractors: {},
  },
  {
    intent: "regulatory_alert",
    category: "fintech",
    patterns: [
      /(?:regulatory|compliance)\s+(?:alert|warning|deadline)/i,
    ],
    entityExtractors: {},
  },

  // ── Fintech: Cards ────────────────────────────────────
  {
    intent: "card_status",
    category: "fintech",
    patterns: [
      /(?:card\s+status|is\s+my\s+card\s+active)/i,
      /(?:check|show)\s+(?:my\s+)?card/i,
    ],
    entityExtractors: {
      cardLast4: /(?:ending\s+in|card|number)\s+(\d{4})/i,
    },
  },
  {
    intent: "freeze_card",
    category: "fintech",
    patterns: [
      /(?:freeze|block|lock)\s+(?:my\s+)?card/i,
      /(?:unfreeze|unblock|unlock)\s+(?:my\s+)?card/i,
    ],
    entityExtractors: {
      action: /(freeze|block|lock|unfreeze|unblock|unlock)/i,
      cardLast4: /(?:ending\s+in|card)\s+(\d{4})/i,
    },
  },
  {
    intent: "card_transactions",
    category: "fintech",
    patterns: [
      /(?:card\s+transactions|card\s+spend|card\s+history)/i,
    ],
    entityExtractors: {},
  },

  // ── Fallback ──────────────────────────────────────────
  {
    intent: "ask_question",
    category: "platform",
    patterns: [
      /^(?:what|why|when|where|how|who|which|can|do|does|is|are|will|should)/i,
    ],
    entityExtractors: {},
  },
];

// ═══ Responses ════════════════════════════════════════════

const RESPONSES: Partial<Record<VoiceIntent, (entities: Record<string, string>, transcript: string) => string>> = {
  create_agent: (e) =>
    e.agentType
      ? `Creating a new ${e.agentType} agent${e.name ? ` called "${e.name}"` : ""}. Configuring with default settings.`
      : "What type of agent would you like to create? Options include fraud monitoring, compliance, KYC, and customer support.",
  check_status: (e) =>
    e.agentName ? `Checking the status of your ${e.agentName} agent now.` : "Pulling up the status for all active agents.",
  run_agent: (e) =>
    e.agentName ? `Starting execution of the ${e.agentName} agent.` : "Which agent would you like to run?",
  get_report: (e) =>
    e.reportType ? `Generating your ${e.reportType} report now.` : "Pulling up your latest analytics report.",
  list_agents: () =>
    "You have agents deployed across fraud monitoring, KYC compliance, customer support, and reporting.",
  show_alerts: () =>
    "Checking your active alerts now.",
  modify_config: (e) =>
    e.setting ? `Updating ${e.setting}${e.value ? ` to ${e.value}` : ""}. Please confirm this change.` : "What setting would you like to change?",

  // Fintech responses
  check_balance: (e) =>
    `Retrieving your ${e.accountType ?? "account"} balance now.`,
  account_summary: () =>
    "Pulling up your full account summary.",
  transaction_history: (e) =>
    `Fetching your transaction history${e.period ? ` for the ${e.period}` : ""}.`,
  initiate_payment: (e) =>
    e.amount
      ? `Initiating a payment of R${e.amount}${e.recipient ? ` to ${e.recipient}` : ""}. Please confirm on screen.`
      : "How much would you like to send, and to whom?",
  payment_status: () =>
    "Checking the status of your recent payments.",
  fraud_report: () =>
    "Pulling up your fraud detection report and flagged transactions.",
  flag_transaction: () =>
    "Flagging that transaction as suspicious. Our fraud team will review it within 24 hours.",
  risk_score: () =>
    "Retrieving the risk score for that transaction now.",
  kyc_status: () =>
    "Checking your KYC verification status. All customer identity checks are tracked in real time.",
  compliance_report: () =>
    "Generating your FICA and POPIA compliance summary.",
  regulatory_alert: () =>
    "Retrieving outstanding regulatory alerts and upcoming compliance deadlines.",
  card_status: (e) =>
    `Checking status for your card${e.cardLast4 ? ` ending in ${e.cardLast4}` : ""}.`,
  freeze_card: (e) =>
    `${e.action === "freeze" || e.action === "block" || e.action === "lock" ? "Freezing" : "Unfreezing"} your card${e.cardLast4 ? ` ending in ${e.cardLast4}` : ""}. Confirm on screen.`,
  card_transactions: () =>
    "Fetching recent card transactions.",
  ask_question: (_, t) =>
    `Let me look into that. Analysing: "${t}"`,
  unknown: () =>
    "I didn't quite catch that. Try asking about your agent status, fraud reports, balance, or compliance.",
};

// ═══ Processor Class ══════════════════════════════════════

export class VoiceCommandProcessor {
  private commandHistory: VoiceCommand[] = [];

  processTranscript(transcript: string): VoiceCommand {
    const trimmed = transcript.trim();
    let bestIntent: VoiceIntent = "unknown";
    let bestConfidence = 0;
    let entities: Record<string, string> = {};
    let bestCategory: "platform" | "fintech" = "platform";

    for (const pattern of INTENT_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = trimmed.match(regex);
        if (match) {
          const confidence = this.calculateConfidence(trimmed, regex);
          if (confidence > bestConfidence) {
            bestIntent    = pattern.intent;
            bestConfidence = confidence;
            bestCategory  = pattern.category;
            entities = {};
            for (const [name, extractor] of Object.entries(pattern.entityExtractors)) {
              const entityMatch = trimmed.match(extractor);
              if (entityMatch?.[1]) {
                entities[name] = entityMatch[1].trim();
              }
            }
          }
        }
      }
    }

    const responseFn = RESPONSES[bestIntent] ?? RESPONSES.unknown!;
    const response   = responseFn(entities, trimmed);

    const command: VoiceCommand = {
      id: `vcmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      transcript: trimmed,
      intent: bestIntent,
      entities,
      confidence: Math.round(bestConfidence * 100) / 100,
      timestamp: Date.now(),
      response,
      executed: bestIntent !== "unknown",
      category: bestCategory,
    };

    this.commandHistory.push(command);
    return command;
  }

  generateNarration(params: {
    agentId: string;
    agentName: string;
    status: string;
    successRate: number;
    executionsToday: number;
    alertCount: number;
    lastExecutionAge: string;
  }): AgentStatusNarration {
    const parts: string[] = [];
    parts.push(`${params.agentName} is currently ${params.status}.`);

    if (params.executionsToday > 0) {
      parts.push(
        `It has completed ${params.executionsToday} executions today with a ${(params.successRate * 100).toFixed(1)}% success rate.`
      );
    } else {
      parts.push("No executions have been recorded today.");
    }

    if (params.alertCount > 0) {
      parts.push(
        `There ${params.alertCount === 1 ? "is" : "are"} ${params.alertCount} active ${params.alertCount === 1 ? "alert" : "alerts"} requiring attention.`
      );
    }

    parts.push(`Last execution was ${params.lastExecutionAge} ago.`);

    return {
      agentId: params.agentId,
      agentName: params.agentName,
      narration: parts.join(" "),
      metrics: {
        status: params.status,
        successRate: `${(params.successRate * 100).toFixed(1)}%`,
        executionsToday: String(params.executionsToday),
        alerts: String(params.alertCount),
      },
    };
  }

  getCommandHistory(limit = 50): VoiceCommand[] {
    return this.commandHistory.slice(-limit).reverse();
  }

  private calculateConfidence(transcript: string, pattern: RegExp): number {
    const match = transcript.match(pattern);
    if (!match) return 0;
    return Math.min(0.95, 0.5 + (match[0].length / transcript.length) * 0.5);
  }
}

// ═══ Singleton ════════════════════════════════════════════

let _processor: VoiceCommandProcessor | null = null;

export function getVoiceProcessor(): VoiceCommandProcessor {
  if (!_processor) _processor = new VoiceCommandProcessor();
  return _processor;
}
