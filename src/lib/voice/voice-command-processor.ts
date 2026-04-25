/**
 * Voice Command Processor
 *
 * Parses voice transcripts into structured commands,
 * executes platform actions, and generates narrations.
 */

// ═══ Types ═══

export type VoiceIntent =
  | "create_agent"
  | "check_status"
  | "run_agent"
  | "get_report"
  | "modify_config"
  | "ask_question"
  | "list_agents"
  | "show_alerts"
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
}

export interface AgentStatusNarration {
  agentId: string;
  agentName: string;
  narration: string;
  metrics: Record<string, string>;
}

// ═══ Intent Patterns ═══

const INTENT_PATTERNS: { intent: VoiceIntent; patterns: RegExp[]; entityExtractors: Record<string, RegExp> }[] = [
  {
    intent: "create_agent",
    patterns: [
      /(?:create|deploy|set up|build|add|make)\s+(?:a\s+)?(?:new\s+)?(\w+)\s+agent/i,
      /(?:I (?:want|need)\s+)?(?:a\s+)?(\w+)\s+agent/i,
    ],
    entityExtractors: { agentType: /(\w+)\s+agent/i, name: /(?:called|named)\s+"?([^"]+)"?/i },
  },
  {
    intent: "check_status",
    patterns: [
      /(?:what(?:'s| is)\s+the\s+)?status\s+(?:of\s+)?/i,
      /how(?:'s| is)\s+(?:the\s+)?(\w+)\s+(?:agent|doing|going)/i,
      /(?:check|show)\s+(?:me\s+)?(?:the\s+)?status/i,
    ],
    entityExtractors: { agentName: /(?:status\s+of|how'?s?\s+(?:the\s+)?)(\w+(?:\s+\w+)?)\s*(?:agent)?/i },
  },
  {
    intent: "run_agent",
    patterns: [
      /(?:run|execute|start|trigger)\s+(?:the\s+)?(\w+)\s+agent/i,
      /(?:run|execute|start|trigger)\s+(?:the\s+)?agent/i,
    ],
    entityExtractors: { agentName: /(?:run|execute|start|trigger)\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s*agent/i },
  },
  {
    intent: "get_report",
    patterns: [
      /(?:show|get|give|generate|pull)\s+(?:me\s+)?(?:the\s+)?(?:a\s+)?(\w+)?\s*report/i,
      /(?:how\s+many|what\s+are\s+the)\s+(\w+)/i,
    ],
    entityExtractors: { reportType: /(\w+)\s+report/i, metric: /how\s+many\s+(\w+)/i },
  },
  {
    intent: "list_agents",
    patterns: [
      /(?:list|show|what\s+are)\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?(?:my\s+)?agents/i,
      /how\s+many\s+agents/i,
    ],
    entityExtractors: {},
  },
  {
    intent: "show_alerts",
    patterns: [
      /(?:show|list|what\s+are)\s+(?:me\s+)?(?:the\s+)?(?:any\s+)?alerts/i,
      /(?:any|are\s+there)\s+(?:new\s+)?(?:alerts|warnings|issues)/i,
    ],
    entityExtractors: { severity: /(\w+)\s+(?:alerts|warnings)/i },
  },
  {
    intent: "modify_config",
    patterns: [
      /(?:change|update|modify|set|adjust)\s+(?:the\s+)?/i,
      /(?:turn|switch)\s+(?:on|off)\s+/i,
    ],
    entityExtractors: { setting: /(?:change|update|set)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i, value: /to\s+"?([^"]+)"?$/i },
  },
  {
    intent: "ask_question",
    patterns: [
      /^(?:what|why|when|where|how|who|which|can|do|does|is|are|will|should)/i,
    ],
    entityExtractors: {},
  },
];

// ═══ Voice Command Processor ═══

export class VoiceCommandProcessor {
  private commandHistory: VoiceCommand[] = [];

  /**
   * Parse a voice transcript into a structured command
   */
  processTranscript(transcript: string): VoiceCommand {
    const trimmed = transcript.trim();
    let bestIntent: VoiceIntent = "unknown";
    let bestConfidence = 0;
    let entities: Record<string, string> = {};

    for (const pattern of INTENT_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = trimmed.match(regex);
        if (match) {
          const confidence = this.calculateConfidence(trimmed, regex);
          if (confidence > bestConfidence) {
            bestIntent = pattern.intent;
            bestConfidence = confidence;
            entities = {};

            // Extract entities
            for (const [entityName, extractor] of Object.entries(pattern.entityExtractors)) {
              const entityMatch = trimmed.match(extractor);
              if (entityMatch && entityMatch[1]) {
                entities[entityName] = entityMatch[1].trim();
              }
            }
          }
        }
      }
    }

    const response = this.generateResponse(bestIntent, entities, trimmed);

    const command: VoiceCommand = {
      id: `vcmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      transcript: trimmed,
      intent: bestIntent,
      entities,
      confidence: Math.round(bestConfidence * 100) / 100,
      timestamp: Date.now(),
      response,
      executed: bestIntent !== "unknown",
    };

    this.commandHistory.push(command);
    return command;
  }

  /**
   * Generate narration for agent status
   */
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
      parts.push(`It has completed ${params.executionsToday} executions today with a ${(params.successRate * 100).toFixed(1)}% success rate.`);
    } else {
      parts.push("No executions have been recorded today.");
    }

    if (params.alertCount > 0) {
      parts.push(`There ${params.alertCount === 1 ? "is" : "are"} ${params.alertCount} active ${params.alertCount === 1 ? "alert" : "alerts"} requiring attention.`);
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

  /**
   * Get command history
   */
  getCommandHistory(limit = 50): VoiceCommand[] {
    return this.commandHistory.slice(-limit).reverse();
  }

  private calculateConfidence(transcript: string, pattern: RegExp): number {
    const match = transcript.match(pattern);
    if (!match) return 0;
    const matchedLength = match[0].length;
    return Math.min(0.95, 0.5 + (matchedLength / transcript.length) * 0.5);
  }

  private generateResponse(intent: VoiceIntent, entities: Record<string, string>, transcript: string): string {
    switch (intent) {
      case "create_agent":
        return entities.agentType
          ? `Creating a new ${entities.agentType} agent${entities.name ? ` called "${entities.name}"` : ""}. Configuring with default settings.`
          : "What type of agent would you like to create? Options include fraud monitoring, compliance, reporting, and customer support.";

      case "check_status":
        return entities.agentName
          ? `Checking the status of your ${entities.agentName} agent now.`
          : "Pulling up the status dashboard for all your agents.";

      case "run_agent":
        return entities.agentName
          ? `Starting execution of the ${entities.agentName} agent.`
          : "Which agent would you like to run?";

      case "get_report":
        return entities.reportType
          ? `Generating your ${entities.reportType} report now. This may take a few moments.`
          : "Pulling up your latest analytics report.";

      case "list_agents":
        return "Here are your active agents. You currently have 4 agents deployed across fraud monitoring, compliance, customer support, and reporting.";

      case "show_alerts":
        return "Checking your active alerts now.";

      case "modify_config":
        return entities.setting
          ? `Updating ${entities.setting}${entities.value ? ` to ${entities.value}` : ""}. Please confirm this change.`
          : "What setting would you like to change?";

      case "ask_question":
        return `Let me look into that. Analyzing: "${transcript}"`;

      default:
        return "I didn't quite catch that. You can ask me to create agents, check status, run reports, or show alerts.";
    }
  }
}

// ═══ Singleton ═══

let _processor: VoiceCommandProcessor | null = null;

export function getVoiceProcessor(): VoiceCommandProcessor {
  if (!_processor) _processor = new VoiceCommandProcessor();
  return _processor;
}
