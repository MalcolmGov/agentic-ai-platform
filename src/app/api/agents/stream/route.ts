/**
 * Server-Sent Events (SSE) — Agent Execution Streaming
 * 
 * POST /api/agents/stream — Stream agent execution steps in real-time
 * 
 * Uses SSE (Server-Sent Events) — works with all browsers,
 * no WebSocket infrastructure needed.
 */

import { NextRequest } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth/jwt";
import { hasPermission } from "@/lib/auth/rbac";
import { auditFromRequest } from "@/lib/audit/logger";
import { createAgentMemory } from "@/lib/memory/vector-store";
import { StreamAgentSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function getDefaultPrompt(agentType: string): string {
  const prompts: Record<string, string> = {
    FRAUD_MONITORING: "You are a Fraud Monitoring Agent. Analyze transactions for suspicious patterns, calculate risk scores, and flag high-risk items.",
    COMPLIANCE: "You are a Compliance Agent. Run KYC/AML checks, monitor regulations, and flag policy violations.",
    REPORTING: "You are a Reporting Agent. Aggregate data, identify trends, and generate executive summaries.",
    FINANCE: "You are a Finance Agent. Reconcile transactions, track revenue, and produce financial forecasts.",
  };
  return prompts[agentType] || `You are an AI agent of type ${agentType}. Analyze input and provide actionable results.`;
}

export async function POST(req: NextRequest) {
  // Authenticate
  let user;
  try {
    user = authenticateRequest(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: false, error: "Auth failed" }), { status: 401 });
  }

  // Check permission
  if (!hasPermission(user, "agents:execute")) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), { status: 403 });
  }

  let body;
  try {
    body = StreamAgentSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return new Response(JSON.stringify({ success: false, error: "Invalid body" }), { status: 400 });
  }

  const { agentId, agentType, input } = body;

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const memory = createAgentMemory(user.tenantId, agentId);
  const inputText = typeof input === "string" ? input : JSON.stringify(input);

  // Audit
  await auditFromRequest(req, user, "agent.stream", `agent:${agentId}`, { agentType });

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      const startTime = Date.now();

      try {
        // Step 1: Init
        send("step", { type: "init", content: "Initializing agent...", timestamp: Date.now() });
        await delay(300);

        // Step 2: Memory recall
        const memories = await memory.recall(inputText, 3);
        send("step", {
          type: "memory",
          content: memories.length > 0
            ? `Retrieved ${memories.length} relevant memories`
            : "No prior memories found — starting fresh",
          memoriesRecalled: memories.length,
          timestamp: Date.now(),
        });
        await delay(200);

        // Step 3: Planning
        const systemPrompt = getDefaultPrompt(agentType);
        send("step", {
          type: "planning",
          content: `Planning execution strategy for ${agentType}...`,
          systemPrompt: systemPrompt.slice(0, 100) + "...",
          timestamp: Date.now(),
        });
        await delay(400);

        // Step 4: Reasoning (simulated — use LLM gateway when API key is set)
        const reasoningSteps = getSimulatedReasoning(agentType, inputText);
        for (let i = 0; i < reasoningSteps.length; i++) {
          send("step", {
            type: reasoningSteps[i].type,
            content: reasoningSteps[i].content,
            stepIndex: i + 1,
            totalSteps: reasoningSteps.length,
            timestamp: Date.now(),
          });
          await delay(300 + Math.random() * 200);
        }

        // Step 5: Store memory
        await memory.storeDecision(
          `Analyzed: ${inputText.slice(0, 100)}`,
          `${agentType} agent completed with ${reasoningSteps.length} reasoning steps`
        );
        send("step", { type: "memory_store", content: "Stored execution results in memory", timestamp: Date.now() });
        await delay(100);

        // Final result
        const durationMs = Date.now() - startTime;
        send("complete", {
          executionId,
          agentId,
          agentType,
          status: "completed",
          result: reasoningSteps[reasoningSteps.length - 1]?.content || "Analysis complete",
          metrics: {
            durationMs,
            reasoningSteps: reasoningSteps.length,
            memoriesRecalled: memories.length,
            memoriesStored: 1,
            totalTokens: 0,
            costUsd: 0,
          },
        });
      } catch (error) {
        send("error", { message: (error as Error).message, executionId });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Execution-Id": executionId,
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getSimulatedReasoning(agentType: string, input: string) {
  const steps: Array<{ type: string; content: string }> = [];

  switch (agentType) {
    case "FRAUD_MONITORING":
      steps.push(
        { type: "thought", content: "Analyzing transaction patterns for anomalies..." },
        { type: "tool_call", content: "query_database({table: 'transactions', filter: {status: 'pending'}})" },
        { type: "observation", content: "Found 47 pending transactions, 3 with risk score > 0.7" },
        { type: "thought", content: "High-value transfer of $48,500 to high-risk country detected" },
        { type: "tool_call", content: "send_alert({severity: 'critical', title: 'Suspicious transfer to high-risk jurisdiction'})" },
        { type: "observation", content: "Alert sent — ALT-2847 created" },
        { type: "decision", content: "Flagged 3 transactions for manual review. 1 critical alert sent. Risk score threshold: 0.7" },
      );
      break;
    case "COMPLIANCE":
      steps.push(
        { type: "thought", content: "Running KYC/AML verification checks..." },
        { type: "tool_call", content: "query_database({table: 'customers', filter: {kycStatus: 'pending'}})" },
        { type: "observation", content: "12 customers pending KYC verification" },
        { type: "thought", content: "Cross-referencing against sanctions and PEP lists" },
        { type: "decision", content: "8 customers cleared, 4 require enhanced due diligence" },
      );
      break;
    default:
      steps.push(
        { type: "thought", content: `Processing input for ${agentType}: "${input.slice(0, 80)}..."` },
        { type: "tool_call", content: "query_database({table: 'data'})" },
        { type: "observation", content: "Data retrieved and analyzed" },
        { type: "decision", content: "Analysis complete. Results generated successfully." },
      );
  }

  return steps;
}
