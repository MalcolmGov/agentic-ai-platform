/**
 * Upgraded Agent Framework — Full Reasoning Loop
 * 
 * observe → retrieve memory → reason (LLM) → plan → execute tools → evaluate → store memory → report
 * 
 * This replaces the basic init → plan → execute → report lifecycle
 * with a full cognitive loop that uses LLM reasoning and persistent memory.
 */

import { LLMToolDefinition } from "@/lib/llm/gateway";
import { AgentMemoryStore, createAgentMemory } from "@/lib/memory/vector-store";

// ─── Types ─────────────────────────────────

export interface IntelligentAgentConfig {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
  model: string;
  tools: AgentToolDef[];
  maxIterations: number;
  memoryEnabled: boolean;
}

export interface AgentToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentExecutionContext {
  tenantId: string;
  executionId: string;
  input: string;
}

export interface ReasoningStep {
  phase: "observe" | "retrieve" | "reason" | "plan" | "execute" | "evaluate" | "store" | "report";
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  durationMs: number;
}

export interface AgentExecutionResult {
  executionId: string;
  success: boolean;
  output: string;
  steps: ReasoningStep[];
  metrics: {
    totalDurationMs: number;
    reasoningIterations: number;
    toolCallsMade: number;
    memoriesRecalled: number;
    memoriesStored: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

// ─── Planner ──────────────────────────────

export class AgentPlanner {
  /**
   * Generate an execution plan based on input + context
   */
  static plan(input: string, agentType: string, memories: string[]): string[] {
    const basePlan: string[] = [];

    // Add memory-aware steps
    if (memories.length > 0) {
      basePlan.push("review_prior_context");
    }

    // Type-specific planning
    switch (agentType) {
      case "FRAUD_MONITORING":
        basePlan.push("analyze_transaction_patterns", "calculate_risk_scores", "identify_anomalies", "generate_alerts");
        break;
      case "COMPLIANCE":
        basePlan.push("run_kyc_checks", "verify_sanctions_list", "check_regulatory_requirements", "generate_compliance_report");
        break;
      case "REPORTING":
        basePlan.push("aggregate_data_sources", "identify_trends", "generate_visualizations", "compile_report");
        break;
      default:
        basePlan.push("analyze_input", "process_data", "generate_output");
    }

    basePlan.push("evaluate_results", "store_findings");
    return basePlan;
  }
}

// ─── Reasoner ─────────────────────────────

export class AgentReasoner {
  /**
   * Generate reasoning about the current state.
   * In production, this calls the LLM. Here we simulate.
   */
  static async reason(
    input: string,
    observations: string[],
    plan: string[],
    currentStep: string
  ): Promise<string> {
    // Simulated reasoning (production: LLM call)
    const context = observations.join("; ");
    return `Based on input "${input.slice(0, 50)}..." and observations [${context.slice(0, 100)}], ` +
      `executing step "${currentStep}" as part of plan [${plan.join(" → ")}]`;
  }
}

// ─── Evaluator ────────────────────────────

export class AgentEvaluator {
  /**
   * Evaluate whether the execution was successful
   * and whether further iterations are needed
   */
  static evaluate(
    steps: ReasoningStep[],
    _toolResults: unknown[]
  ): { complete: boolean; confidence: number; assessment: string } {
    const errors = steps.filter((s) => s.content.toLowerCase().includes("error"));
    const toolCalls = steps.filter((s) => s.phase === "execute");

    if (errors.length > 0) {
      return {
        complete: true,
        confidence: 0.3,
        assessment: `Completed with ${errors.length} issues detected`,
      };
    }

    return {
      complete: true,
      confidence: toolCalls.length > 0 ? 0.9 : 0.7,
      assessment: `Successfully completed ${toolCalls.length} tool operations across ${steps.length} steps`,
    };
  }
}

// ─── Learning Module ──────────────────────

export class AgentLearning {
  /**
   * Extract learnings from execution for future reference
   */
  static async extractAndStore(
    memory: AgentMemoryStore,
    executionId: string,
    steps: ReasoningStep[],
    result: string
  ): Promise<number> {
    let stored = 0;

    // Store key decisions
    const decisions = steps.filter((s) => s.phase === "evaluate" || s.phase === "reason");
    for (const decision of decisions.slice(0, 3)) {
      await memory.storeDecision(decision.content, `execution:${executionId}`);
      stored++;
    }

    // Store execution summary as a fact
    await memory.storeFact(
      `Execution ${executionId}: ${result.slice(0, 200)}`,
      `agent_execution`
    );
    stored++;

    return stored;
  }
}

// ─── Main Intelligent Agent ───────────────

export class IntelligentAgent {
  private config: IntelligentAgentConfig;
  private steps: ReasoningStep[] = [];
  private toolCallCount = 0;

  constructor(config: IntelligentAgentConfig) {
    this.config = config;
  }

  /**
   * Full cognitive execution loop
   */
  async execute(context: AgentExecutionContext): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    this.steps = [];
    this.toolCallCount = 0;

    const memory = createAgentMemory(context.tenantId, this.config.id);
    const toolResults: unknown[] = [];

    // Phase 1: OBSERVE — Understand the input
    const observeStart = Date.now();
    this.addStep("observe", `Received input: "${context.input.slice(0, 200)}"`);

    // Phase 2: RETRIEVE — Recall relevant memories
    const memories = await memory.recall(context.input, 5);
    const memoryContext = memories.map((m) => m.content);
    this.addStep("retrieve", 
      memories.length > 0
        ? `Retrieved ${memories.length} relevant memories (best match: ${memories[0].score.toFixed(2)} similarity)`
        : "No prior memories found — first execution for this context",
      { memoriesRecalled: memories.length }
    );

    // Phase 3: REASON — Think about the problem
    const reasoning = await AgentReasoner.reason(
      context.input,
      memoryContext,
      [],
      "initial_reasoning"
    );
    this.addStep("reason", reasoning);

    // Phase 4: PLAN — Create execution plan
    const plan = AgentPlanner.plan(context.input, this.config.type, memoryContext);
    this.addStep("plan", `Execution plan: ${plan.join(" → ")}`, { steps: plan });

    // Phase 5: EXECUTE — Run each planned step with tools
    for (const step of plan) {
      if (step === "evaluate_results" || step === "store_findings") continue;

      const tool = this.findToolForStep(step);
      if (tool) {
        try {
          const result = await tool.handler({ step, input: context.input });
          toolResults.push(result);
          this.toolCallCount++;
          this.addStep("execute", `Tool "${tool.name}": ${JSON.stringify(result).slice(0, 200)}`, { tool: tool.name });
        } catch (error) {
          this.addStep("execute", `Tool "${tool.name}" failed: ${(error as Error).message}`);
        }
      } else {
        this.addStep("execute", `Step "${step}" completed (no tool required)`);
      }
    }

    // Phase 6: EVALUATE — Assess results
    const evaluation = AgentEvaluator.evaluate(this.steps, toolResults);
    this.addStep("evaluate", evaluation.assessment, { 
      confidence: evaluation.confidence,
      complete: evaluation.complete 
    });

    // Phase 7: STORE — Persist learnings
    const memoriesStored = await AgentLearning.extractAndStore(
      memory,
      context.executionId,
      this.steps,
      evaluation.assessment
    );
    this.addStep("store", `Stored ${memoriesStored} new memories for future reference`);

    // Phase 8: REPORT — Generate final output
    const report = this.generateReport(evaluation);
    this.addStep("report", report);

    return {
      executionId: context.executionId,
      success: evaluation.confidence > 0.5,
      output: report,
      steps: this.steps,
      metrics: {
        totalDurationMs: Date.now() - startTime,
        reasoningIterations: 1,
        toolCallsMade: this.toolCallCount,
        memoriesRecalled: memories.length,
        memoriesStored,
        totalTokens: 0, // Set by LLM gateway in production
        estimatedCost: 0,
      },
    };
  }

  private addStep(
    phase: ReasoningStep["phase"],
    content: string,
    metadata?: Record<string, unknown>
  ) {
    this.steps.push({
      phase,
      content,
      metadata,
      timestamp: Date.now(),
      durationMs: 0,
    });
  }

  private findToolForStep(step: string): AgentToolDef | undefined {
    // Map plan steps to tools
    const toolMap: Record<string, string> = {
      analyze_transaction_patterns: "query_database",
      calculate_risk_scores: "query_database",
      identify_anomalies: "query_database",
      generate_alerts: "send_alert",
      run_kyc_checks: "query_database",
      verify_sanctions_list: "query_database",
      aggregate_data_sources: "query_database",
      generate_compliance_report: "generate_report",
      generate_visualizations: "generate_report",
      compile_report: "generate_report",
    };

    const toolName = toolMap[step];
    return toolName ? this.config.tools.find((t) => t.name === toolName) : undefined;
  }

  private generateReport(evaluation: { confidence: number; assessment: string }): string {
    return `${this.config.name} completed with ${(evaluation.confidence * 100).toFixed(0)}% confidence. ` +
      `${evaluation.assessment}. ` +
      `Executed ${this.toolCallCount} tool operations across ${this.steps.length} reasoning steps.`;
  }
}
