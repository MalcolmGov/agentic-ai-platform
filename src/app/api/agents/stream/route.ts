/**
 * Server-Sent Events (SSE) — Agent Execution Streaming
 *
 * POST /api/agents/stream — Stream agent execution steps in real-time
 *
 * When OPENAI_API_KEY is valid: streams real GPT-4o-mini tokens as SSE events.
 * Fallback: simulated reasoning steps (no API key required).
 *
 * Events emitted:
 *   step     — reasoning/planning steps (type: init|memory|planning|thinking|memory_store)
 *   token    — individual streamed tokens from OpenAI { delta, accumulated }
 *   complete — final result with metrics
 *   error    — on failure
 */

import { NextRequest } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth/jwt";
import { hasPermission } from "@/lib/auth/rbac";
import { auditFromRequest } from "@/lib/audit/logger";
import { createAgentMemory } from "@/lib/memory/vector-store";
import { StreamAgentSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";
import OpenAI from "openai";
import { env } from "@/lib/config/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isApiKeyValid(key: string): boolean {
  return !!(key && !key.startsWith("sk-placeholder") && key.length > 20);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Department System Prompts ─────────────────────────────────────────────────

const DEPT_PROMPTS: Record<string, string> = {
  HR: "You are an HR assistant for an enterprise platform. Help employees with HR policies, leave management, onboarding, payroll queries, and workplace matters. Be empathetic and practical.",
  LEGAL: "You are a legal assistant for an enterprise platform. Help with contract review, compliance, NDA analysis, and legal policy questions. Be thorough and highlight risks.",
  CUSTOMER_SUPPORT: "You are a customer support assistant. Help resolve customer issues quickly and professionally. Be empathetic and solution-focused.",
  ENGINEERING: "You are an engineering assistant. Help with code review, incident response, runbook generation, and technical problem-solving.",
  RISK: "You are a risk assessment assistant. Help identify, assess, and mitigate business risks. Be systematic and data-driven.",
  SECURITY: "You are a cybersecurity assistant. Help with threat analysis, security policies, and access review. Prioritise by severity.",
  COMPLIANCE: "You are a compliance assistant. Help with GDPR, POPIA, PCI-DSS, and other regulatory requirements. Cite specific regulations.",
  QA: "You are a QA assistant. Help generate test cases, triage bugs, and plan regression suites. Cover edge cases thoroughly.",
  PRODUCT: "You are a product management assistant. Help with feedback analysis, PRD writing, and roadmap decisions.",
  FINANCE: "You are a financial assistant. Help with budget analysis, financial reports, and forecasting. Be accurate and precise.",
  MARKETING: "You are a marketing assistant. Help with campaign copy, social media content, and SEO optimisation.",
  DATA_ANALYTICS: "You are a data analytics assistant. Help with data quality, SQL queries, and dashboard insights.",
  INFRA_OPS: "You are an infrastructure operations assistant. Help with incident triage, capacity planning, and change requests.",
  OPERATIONS: "You are an operations assistant. Help streamline processes and improve operational efficiency.",
  EXECUTIVE: "You are an executive assistant. Help with board reports, competitive intelligence, and strategic decisions.",
  IT: "You are an IT helpdesk assistant. Help users troubleshoot technical issues and manage access requests.",
};

const DEFAULT_DEPT_PROMPT =
  "You are a helpful AI assistant for an enterprise platform. Analyse the input and provide clear, professional, and actionable responses.";

function getSystemPrompt(agentType: string, department?: string): string {
  const deptKey = (department ?? agentType ?? "").toUpperCase();
  return DEPT_PROMPTS[deptKey] || DEFAULT_DEPT_PROMPT;
}

// ─── Simulated fallback reasoning ─────────────────────────────────────────────

function getSimulatedReasoning(agentType: string, input: string) {
  const steps: Array<{ type: string; content: string }> = [];

  switch (agentType) {
    case "FRAUD_MONITORING":
      steps.push(
        { type: "thought", content: "Analysing transaction patterns for anomalies..." },
        { type: "tool_call", content: "query_database({table: 'transactions', filter: {status: 'pending'}})" },
        { type: "observation", content: "Found 47 pending transactions, 3 with risk score > 0.7" },
        { type: "thought", content: "High-value transfer of $48,500 to high-risk jurisdiction detected" },
        { type: "tool_call", content: "send_alert({severity: 'critical', title: 'Suspicious transfer to high-risk jurisdiction'})" },
        { type: "observation", content: "Alert sent — ALT-2847 created" },
        { type: "decision", content: "Flagged 3 transactions for manual review. 1 critical alert sent. Risk score threshold: 0.7" }
      );
      break;
    case "COMPLIANCE":
      steps.push(
        { type: "thought", content: "Running KYC/AML verification checks..." },
        { type: "tool_call", content: "query_database({table: 'customers', filter: {kycStatus: 'pending'}})" },
        { type: "observation", content: "12 customers pending KYC verification" },
        { type: "thought", content: "Cross-referencing against sanctions and PEP lists" },
        { type: "decision", content: "8 customers cleared, 4 require enhanced due diligence" }
      );
      break;
    default:
      steps.push(
        { type: "thought", content: `Processing input for ${agentType}: "${input.slice(0, 80)}..."` },
        { type: "tool_call", content: "query_database({table: 'data'})" },
        { type: "observation", content: "Data retrieved and analysed" },
        { type: "decision", content: "Analysis complete. Results generated successfully." }
      );
  }

  return steps;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

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

  // Parse body
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

  await auditFromRequest(req, user, "agent.stream", `agent:${agentId}`, { agentType });

  const apiKey = env.OPENAI_API_KEY;
  const useRealLLM = isApiKeyValid(apiKey);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      const startTime = Date.now();

      try {
        // Step 1: Init
        send("step", { type: "init", content: "Initialising agent...", timestamp: Date.now() });
        await delay(200);

        // Step 2: Memory recall
        const memories = await memory.recall(inputText, 3);
        send("step", {
          type: "memory",
          content:
            memories.length > 0
              ? `Retrieved ${memories.length} relevant memories`
              : "No prior memories found — starting fresh",
          memoriesRecalled: memories.length,
          timestamp: Date.now(),
        });
        await delay(150);

        // Step 3: Planning
        const systemPrompt = getSystemPrompt(agentType);
        send("step", {
          type: "planning",
          content: `Planning execution for ${agentType}...`,
          model: useRealLLM ? "gpt-4o-mini" : "simulated",
          timestamp: Date.now(),
        });
        await delay(200);

        if (useRealLLM) {
          // ── Real OpenAI streaming ───────────────────────────────────────────

          send("step", {
            type: "thinking",
            content: "Calling GPT-4o mini...",
            timestamp: Date.now(),
          });

          const client = new OpenAI({ apiKey });
          const openaiStream = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: inputText },
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 1024,
          });

          let fullResponse = "";
          let chunkCount = 0;

          for await (const chunk of openaiStream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
              fullResponse += delta;
              chunkCount++;
              send("token", { delta, accumulated: fullResponse, chunkIndex: chunkCount });
            }
          }

          // Store memory
          await memory.storeDecision(
            fullResponse.slice(0, 200),
            `${agentType} agent streamed response for: ${inputText.slice(0, 100)}`
          );
          send("step", {
            type: "memory_store",
            content: "Stored response in agent memory",
            timestamp: Date.now(),
          });

          const durationMs = Date.now() - startTime;
          send("complete", {
            executionId,
            agentId,
            agentType,
            status: "completed",
            result: fullResponse,
            metrics: {
              durationMs,
              reasoningSteps: 1,
              memoriesRecalled: memories.length,
              memoriesStored: 1,
              totalTokens: chunkCount,
              model: "gpt-4o-mini",
            },
          });
        } else {
          // ── Simulated fallback ──────────────────────────────────────────────

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

          await memory.storeDecision(
            `Analysed: ${inputText.slice(0, 100)}`,
            `${agentType} agent completed with ${reasoningSteps.length} reasoning steps`
          );
          send("step", {
            type: "memory_store",
            content: "Stored execution results in memory",
            timestamp: Date.now(),
          });

          const durationMs = Date.now() - startTime;
          send("complete", {
            executionId,
            agentId,
            agentType,
            status: "completed",
            result: reasoningSteps[reasoningSteps.length - 1]?.content ?? "Analysis complete",
            metrics: {
              durationMs,
              reasoningSteps: reasoningSteps.length,
              memoriesRecalled: memories.length,
              memoriesStored: 1,
              totalTokens: 0,
              model: "simulated",
            },
          });
        }
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
