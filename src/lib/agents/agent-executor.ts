/**
 * Agent Executor — Orchestration Engine
 * 
 * Manages agent lifecycle, handles execution context,
 * provides memory and tool interfaces, manages retries.
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResult, AgentMemory, AgentToolkit, MemoryResult } from "./base-agent";
import { AgentRegistry } from "./agent-registry";

// In-memory store (replace with Redis/Vector DB in production)
const memoryStore = new Map<string, { value: unknown; expiry?: number }>();

class InMemoryAgentMemory implements AgentMemory {
  private prefix: string;

  constructor(tenantId: string, agentId: string) {
    this.prefix = `${tenantId}:${agentId}:`;
  }

  async get(key: string): Promise<unknown> {
    const entry = memoryStore.get(this.prefix + key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      memoryStore.delete(this.prefix + key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    memoryStore.set(this.prefix + key, {
      value,
      expiry: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async search(query: string, topK = 5): Promise<MemoryResult[]> {
    // In production, this queries Pinecone/Weaviate/pgvector
    // For now, simple keyword search across memory
    const results: MemoryResult[] = [];
    for (const [key, entry] of memoryStore.entries()) {
      if (key.startsWith(this.prefix)) {
        const content = JSON.stringify(entry.value);
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            content,
            score: 1.0,
            metadata: { key: key.replace(this.prefix, "") },
          });
        }
      }
    }
    return results.slice(0, topK);
  }

  async clear(): Promise<void> {
    for (const key of memoryStore.keys()) {
      if (key.startsWith(this.prefix)) {
        memoryStore.delete(key);
      }
    }
  }
}

// Tool registry (extensible)
const toolHandlers = new Map<string, (params: Record<string, unknown>) => Promise<unknown>>();

// Register built-in tools
toolHandlers.set("api_call", async (params) => {
  const { url, method = "GET", headers = {}, body } = params as {
    url: string; method?: string; headers?: Record<string, string>; body?: unknown;
  };
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
});

toolHandlers.set("db_query", async (params) => {
  // In production, this executes against the tenant's connected database
  console.log(`[DB Query] ${JSON.stringify(params)}`);
  return { rows: [], rowCount: 0 };
});

toolHandlers.set("send_email", async (params) => {
  console.log(`[Email] Sending to ${(params as { to: string }).to}`);
  return { sent: true };
});

toolHandlers.set("generate_report", async (params) => {
  console.log(`[Report] Generating: ${(params as { title: string }).title}`);
  return { reportId: `rpt_${Date.now()}`, status: "generated" };
});

toolHandlers.set("send_alert", async (params) => {
  console.log(`[Alert] ${(params as { severity: string }).severity}: ${(params as { message: string }).message}`);
  return { alertId: `alt_${Date.now()}`, sent: true };
});

class AgentToolkitImpl implements AgentToolkit {
  private allowedTools: string[];

  constructor(allowedTools: string[]) {
    this.allowedTools = allowedTools;
  }

  async call(toolName: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.allowedTools.includes(toolName) && this.allowedTools.length > 0) {
      throw new Error(`Tool "${toolName}" is not authorized for this agent`);
    }
    const handler = toolHandlers.get(toolName);
    if (!handler) {
      throw new Error(`Tool "${toolName}" is not registered`);
    }
    return handler(params);
  }

  available(): string[] {
    return this.allowedTools.length > 0
      ? this.allowedTools.filter((t) => toolHandlers.has(t))
      : Array.from(toolHandlers.keys());
  }
}

/**
 * Main executor — creates and runs agents
 */
export class AgentExecutor {
  /**
   * Execute an agent by config
   */
  static async execute(
    config: AgentConfig,
    input: Record<string, unknown>,
    tenantId: string
  ): Promise<AgentResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Create agent instance
    const agent = AgentRegistry.create(config);

    // Build context
    const context: AgentContext = {
      tenantId,
      executionId,
      input,
      memory: new InMemoryAgentMemory(tenantId, config.id),
      tools: new AgentToolkitImpl(config.tools),
    };

    console.log(`🚀 Executing agent "${config.name}" (${config.type}) | Execution: ${executionId}`);

    // Run with timeout
    const timeoutMs = 60_000; // 60 second timeout
    const result = await Promise.race([
      agent.run(context),
      new Promise<AgentResult>((_, reject) =>
        setTimeout(() => reject(new Error("Agent execution timed out")), timeoutMs)
      ),
    ]);

    console.log(
      `${result.success ? "✅" : "❌"} Agent "${config.name}" completed in ${result.metadata.durationMs}ms`
    );

    return result;
  }

  /**
   * Register a tool handler
   */
  static registerTool(
    name: string,
    handler: (params: Record<string, unknown>) => Promise<unknown>
  ): void {
    toolHandlers.set(name, handler);
    console.log(`🔧 Registered tool: ${name}`);
  }
}
