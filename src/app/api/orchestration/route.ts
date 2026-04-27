/**
 * Copilot Chat API
 *
 * POST /api/orchestration
 * Streams a response from OpenAI GPT-4o using the Fintech AI Ops Copilot system prompt.
 * Falls back to a structured rule-based response if no API key is configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth/jwt";
import OpenAI from "openai";

function authError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ─── System Prompt ────────────────────────────────────────────

const COPILOT_SYSTEM_PROMPT = `You are an AI Ops Copilot for a Fintech AI Platform — a natural language control plane that allows users to manage AI agents, monitor transactions, review compliance, and operate the platform via plain English commands.

CAPABILITIES:
- Deploy, configure, pause, resume, and scale AI agents
- Show agent status, execution history, and performance metrics
- Analyze alerts and surface patterns
- Schedule automated reports and tasks
- Query fraud monitoring, KYC/compliance, risk scoring
- Explain platform features and guide users

PLATFORM CONTEXT:
- Active agents include: FraudGuard, ComplianceBot, KYC-Verify, ReportGen, SupportBot, DataMiner
- Plans: Starter (5 agents), Professional (25 agents), Enterprise (unlimited)
- Current tenant is on Enterprise plan
- All agent types: FRAUD_MONITORING, COMPLIANCE, KYC_VERIFICATION, REPORTING, CUSTOMER_SUPPORT, DATA_ANALYTICS, RISK_SCORING

TONE: Professional, precise, and action-oriented. Format responses using markdown — use tables, bold, and bullet points where helpful. Always confirm actions taken.

IMPORTANT: You are a platform assistant, not a real banking system. If asked to perform irreversible financial actions (e.g., actual fund transfers), acknowledge the request and instruct the user to confirm via the appropriate dashboard.`;

// ─── Route ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  try {
    authenticateRequest(req);
  } catch (error) {
    if (error instanceof AuthError) return authError(error.message, error.status);
    return authError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const { messages = [], stream: wantsStream = true } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: "messages array is required" }, { status: 400 });
    }

    // Build the message array
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: COPILOT_SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // ── No API key: return rule-based fallback ───────────────
    if (!process.env.OPENAI_API_KEY) {
      const lastMessage = messages[messages.length - 1]?.content ?? "";
      const fallback = getRuleBasedResponse(lastMessage);
      return NextResponse.json({
        success: true,
        data: { content: fallback, aiEnhanced: false },
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ── Streaming response ───────────────────────────────────
    if (wantsStream) {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        temperature: 0.4,
        max_tokens: 1200,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content ?? "";
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (err) {
            console.error("[Copilot Stream] Error:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // ── Non-streaming (fallback) ─────────────────────────────
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
      temperature: 0.4,
      max_tokens: 1200,
      stream: false,
    });

    const content = response.choices[0]?.message?.content ?? "No response generated.";
    return NextResponse.json({ success: true, data: { content, aiEnhanced: true } });

  } catch (error) {
    console.error("[Copilot] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process copilot request" },
      { status: 500 }
    );
  }
}

// ─── Rule-based fallback ──────────────────────────────────────

function getRuleBasedResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("deploy") || lower.includes("create") || lower.includes("launch")) {
    return "✅ **Agent deployment requested.**\n\nTo deploy a new agent, navigate to **Agents → New Agent** and select the agent type, model, and tools. Once configured, the agent will be active immediately.\n\n> **Note:** Add your `OPENAI_API_KEY` to `.env.local` to enable AI-powered responses.";
  }
  if (lower.includes("status") || lower.includes("show") || lower.includes("list")) {
    return "📊 **Agent Status**\n\nYour agents are monitored in real time on the **Agents** dashboard. Navigate there to see execution counts, success rates, and latency metrics.\n\n> **Note:** Add your `OPENAI_API_KEY` to `.env.local` to enable AI-powered responses.";
  }
  if (lower.includes("fraud") || lower.includes("suspicious")) {
    return "🛡️ **Fraud Monitoring**\n\nFraud detection is handled by your FraudGuard agent. View flagged transactions in **Agents → FraudGuard → Executions**.\n\n> **Note:** Add your `OPENAI_API_KEY` to `.env.local` to enable AI-powered responses.";
  }

  return "👋 I'm your AI Ops Copilot. To enable full AI-powered responses, add your `OPENAI_API_KEY` to `.env.local` and restart the server.\n\nIn the meantime, you can navigate the platform manually using the sidebar.";
}
