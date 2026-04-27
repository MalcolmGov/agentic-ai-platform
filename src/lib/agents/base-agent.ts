/**
 * AI Platform Platform — Base Agent Framework
 * 
 * Abstract base class that all AI agents must extend.
 * Implements the Agent Lifecycle: init → plan → execute → report
 */

export interface AgentConfig {
  id: string;
  name: string;
  type: string;
  llmProvider: string;
  llmModel: string;
  systemPrompt: string;
  tools: string[];
  schedule?: string;
  parameters: Record<string, unknown>;
}

export interface AgentContext {
  tenantId: string;
  executionId: string;
  input: Record<string, unknown>;
  memory: AgentMemory;
  tools: AgentToolkit;
}

export interface AgentMemory {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  search(query: string, topK?: number): Promise<MemoryResult[]>;
  clear(): Promise<void>;
}

export interface MemoryResult {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface AgentToolkit {
  call(toolName: string, params: Record<string, unknown>): Promise<unknown>;
  available(): string[];
}

export interface AgentResult {
  success: boolean;
  data: unknown;
  metadata: {
    durationMs: number;
    tokenUsage: number;
    toolCalls: number;
    steps: AgentStep[];
  };
}

export interface AgentStep {
  name: string;
  type: "thought" | "tool_call" | "decision" | "output";
  content: string;
  timestamp: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected steps: AgentStep[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Full agent lifecycle execution
   */
  async run(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    let tokenUsage = 0;
    let toolCalls = 0;

    try {
      // Phase 1: Initialize
      await this.init(context);
      this.log("thought", "Agent initialized and ready");

      // Phase 2: Plan
      const plan = await this.plan(context);
      this.log("thought", `Planning complete: ${plan.description}`);

      // Phase 3: Execute steps
      for (const step of plan.steps) {
        this.log("thought", `Executing step: ${step}`);
        const result = await this.executeStep(step, context);
        
        if (result.toolCalls) {
          toolCalls += result.toolCalls;
        }
        if (result.tokenUsage) {
          tokenUsage += result.tokenUsage;
        }
      }

      // Phase 4: Generate report
      const output = await this.report(context);
      this.log("output", "Execution complete, report generated");

      return {
        success: true,
        data: output,
        metadata: {
          durationMs: Date.now() - startTime,
          tokenUsage,
          toolCalls,
          steps: this.steps,
        },
      };
    } catch (error) {
      this.log("output", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      return {
        success: false,
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        metadata: {
          durationMs: Date.now() - startTime,
          tokenUsage,
          toolCalls,
          steps: this.steps,
        },
      };
    }
  }

  /** Initialize agent state, load memory, verify tools */
  protected abstract init(context: AgentContext): Promise<void>;

  /** Create execution plan based on input and memory */
  protected abstract plan(context: AgentContext): Promise<{
    description: string;
    steps: string[];
  }>;

  /** Execute a single step in the plan */
  protected abstract executeStep(
    step: string,
    context: AgentContext
  ): Promise<{ toolCalls?: number; tokenUsage?: number }>;

  /** Generate final report / output */
  protected abstract report(context: AgentContext): Promise<unknown>;

  /** Log an agent step */
  protected log(type: AgentStep["type"], content: string) {
    this.steps.push({
      name: this.config.name,
      type,
      content,
      timestamp: Date.now(),
    });
  }
}
