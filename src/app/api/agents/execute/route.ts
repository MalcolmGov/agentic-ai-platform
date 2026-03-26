/**
 * Agent Execution API — Execute agents with LLM reasoning
 * 
 * POST /api/agents/[id]/execute — Trigger agent execution
 * 
 * Protected with RBAC (agents:execute permission).
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { auditFromRequest } from "@/lib/audit/logger";
import { reasonAndAct, LLMToolDefinition } from "@/lib/llm/gateway";
import { createAgentMemory } from "@/lib/memory/vector-store";
import { ExecuteAgentSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// Agent tool definitions for LLM function calling
const AGENT_TOOLS: LLMToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "query_database",
      description: "Query the database for records matching the given criteria",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name to query" },
          filter: { type: "object", description: "Filter criteria" },
          limit: { type: "number", description: "Max results to return" },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_alert",
      description: "Send an alert notification about a detected issue",
      parameters: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["info", "warning", "critical"], description: "Alert severity" },
          title: { type: "string", description: "Alert title" },
          description: { type: "string", description: "Detailed description" },
        },
        required: ["severity", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Generate a formatted report from analyzed data",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Report title" },
          sections: { type: "array", items: { type: "string" }, description: "Report sections" },
          format: { type: "string", enum: ["summary", "detailed", "executive"], description: "Report format" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recall_memory",
      description: "Search agent memory for relevant past observations and decisions",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to search for in memory" },
          limit: { type: "number", description: "Max results" },
        },
        required: ["query"],
      },
    },
  },
];

// Tool executor
async function executeAgentTool(
  name: string,
  args: Record<string, unknown>,
  memory: ReturnType<typeof createAgentMemory>
): Promise<unknown> {
  switch (name) {
    case "query_database":
      // Simulated DB query — in production uses Prisma
      return {
        rows: [
          { id: 1, amount: 15000, status: "flagged", riskScore: 0.89 },
          { id: 2, amount: 3200, status: "cleared", riskScore: 0.12 },
          { id: 3, amount: 48500, status: "flagged", riskScore: 0.94 },
        ],
        rowCount: 3,
        table: args.table,
      };

    case "send_alert":
      console.log(`🚨 Alert [${args.severity}]: ${args.title}`);
      return { alertId: `alt_${Date.now()}`, sent: true, severity: args.severity };

    case "generate_report":
      const reportId = `rpt_${Date.now()}`;
      console.log(`📄 Report generated: ${args.title} (${reportId})`);
      return { reportId, title: args.title, format: args.format || "summary", generated: true };

    case "recall_memory":
      const memories = await memory.recall(args.query as string, (args.limit as number) || 5);
      return { results: memories, count: memories.length };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// POST /api/agents/[id]/execute
export const POST = withAuth("agents:execute", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = ExecuteAgentSchema.parse(body);
    const { agentId, agentType, input, systemPrompt } = parsed;

    const startTime = Date.now();

    // Create agent memory
    const memory = createAgentMemory(user.tenantId, agentId);

    // Recall relevant memories
    const inputText = typeof input === "string" ? input : JSON.stringify(input);
    const pastMemories = await memory.recall(inputText, 3);
    const memoryContext = pastMemories.length > 0
      ? `\n\nRelevant past observations:\n${pastMemories.map((m) => `- ${m.content}`).join("\n")}`
      : "";

    // Build system prompt
    const fullSystemPrompt = (systemPrompt || getDefaultPrompt(agentType)) + memoryContext;

    // Execute with LLM ReAct loop
    let result;
    try {
      result = await reasonAndAct(
        fullSystemPrompt,
        inputText,
        AGENT_TOOLS,
        (name, args) => executeAgentTool(name, args, memory),
        { model: parsed.model || "gpt-4o-mini", maxIterations: 5 }
      );
    } catch (error) {
      // LLM not configured — return simulated execution
      result = {
        finalResponse: `[Simulated] Agent ${agentType} analyzed the input and generated results. Configure OPENAI_API_KEY for real LLM reasoning.`,
        steps: [
          { type: "thought" as const, content: "Analyzing input data..." },
          { type: "tool_call" as const, content: "query_database({table: 'transactions'})" },
          { type: "observation" as const, content: "Found 3 records matching criteria" },
          { type: "thought" as const, content: "Analysis complete. Generating response." },
        ],
        totalTokens: 0,
        totalCost: 0,
      };
    }

    // Store execution memory
    await memory.storeDecision(
      result.finalResponse.slice(0, 200),
      `Executed ${agentType} with ${result.steps.length} reasoning steps`
    );

    const durationMs = Date.now() - startTime;

    // Audit
    await auditFromRequest(req, user, "agent.execute", `agent:${agentId}`, {
      agentType,
      durationMs,
      steps: result.steps.length,
      tokens: result.totalTokens,
      cost: result.totalCost,
    });

    return apiResponse({
      executionId: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId,
      agentType,
      status: "completed",
      result: result.finalResponse,
      reasoning: result.steps,
      metrics: {
        durationMs,
        totalTokens: result.totalTokens,
        totalCostUsd: result.totalCost,
        reasoningSteps: result.steps.length,
        memoriesRecalled: pastMemories.length,
        memoriesStored: 1,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    console.error("[Agent Execute]", error);
    return apiError("Agent execution failed: " + (error as Error).message, 500);
  }
});

// Default system prompts per agent type
function getDefaultPrompt(agentType: string): string {
  const prompts: Record<string, string> = {
    FRAUD_MONITORING: `You are a Fraud Monitoring Agent for an enterprise platform. Your job is to:
1. Analyze transaction data for suspicious patterns
2. Calculate risk scores based on multiple signals
3. Flag high-risk transactions for review
4. Generate alerts for critical findings
5. Store your observations as memory for future reference

Be precise, data-driven, and err on the side of caution for financial safety.`,
    
    COMPLIANCE: `You are a Compliance Agent for an enterprise platform. Your job is to:
1. Run KYC/AML checks on customer data
2. Monitor regulatory requirements
3. Flag policy violations
4. Generate compliance reports
5. Track audit trails

Be thorough, systematic, and cite specific regulations when flagging issues.`,
    
    REPORTING: `You are a Reporting Agent for an enterprise platform. Your job is to:
1. Aggregate data from multiple sources
2. Identify trends and patterns
3. Generate executive summaries
4. Create detailed analytical reports
5. Highlight key metrics and KPIs

Be clear, concise, and focus on actionable insights.`,
    
    FINANCE: `You are a Finance Agent for an enterprise platform. Your job is to:
1. Reconcile transactions across systems
2. Track revenue and expenses
3. Generate financial forecasts
4. Flag discrepancies
5. Produce financial statements

Maintain accuracy and follow accounting standards.`,
  };

  return prompts[agentType] || `You are an AI agent of type ${agentType}. Analyze the input, use available tools to gather information, reason about the data, and provide actionable results.`;
}
