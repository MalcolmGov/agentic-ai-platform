/**
 * Voice Commands API
 *
 * GET  /api/voice/commands  — Get command history
 * POST /api/voice/commands  — Process voice transcript → OpenAI → structured response
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getVoiceProcessor } from "@/lib/voice/voice-command-processor";
import { VoiceCommandSchema, validationError } from "@/lib/validation/schemas";
import { complete } from "@/lib/llm/gateway";
import { ZodError } from "zod";

// ─── Helpers ──────────────────────────────────────────────────

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

// ─── Fintech Voice Copilot System Prompt ─────────────────────

const FINTECH_VOICE_SYSTEM_PROMPT = `You are a voice-powered AI Copilot for a financial services platform.
You help users manage their agents, monitor transactions, review compliance, and navigate the platform — all via natural language voice commands.

CAPABILITIES:
- Check agent status and execution metrics
- Report on fraud detection and suspicious transactions
- Summarise compliance, KYC, and regulatory events
- Answer questions about account balances and payment flows
- Deploy, pause, or reconfigure AI agents
- Surface alerts, anomalies, and performance reports

TONE: Professional, concise, and confident. You are speaking aloud — keep responses clear and under 3 sentences unless a detailed report is explicitly requested. Avoid markdown — use plain text only.

CONTEXT: The user is authenticated on the platform dashboard. They have active agents covering: Fraud Monitoring, KYC/Compliance, Customer Support, Reporting, and Risk Scoring.

If you cannot take a real action (e.g., actually deploying an agent), acknowledge the request and confirm what would happen — then remind the user to confirm via the dashboard.`;

// ─── Routes ───────────────────────────────────────────────────

export const GET = withAuth("agents:read", async () => {
  const processor = getVoiceProcessor();
  const history = processor.getCommandHistory();
  return apiResponse({ commands: history });
});

export const POST = withAuth("agents:execute", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = VoiceCommandSchema.parse(body);

    // 1. Classify intent locally (fast, no API cost)
    const processor = getVoiceProcessor();
    const command = processor.processTranscript(parsed.transcript);

    // 2. If API key is available, enhance with real LLM response
    let aiResponse: string | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const llmResult = await complete({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: FINTECH_VOICE_SYSTEM_PROMPT },
            { role: "user", content: parsed.transcript },
          ],
          temperature: 0.4,
          maxTokens: 200,
        });
        aiResponse = llmResult.content;
      } catch (llmErr) {
        // LLM failure is non-fatal — fall back to rule-based response
        console.warn("[Voice API] LLM call failed, using rule-based fallback:", llmErr);
      }
    }

    // 3. Return enriched command (override response with AI if available)
    const enriched = {
      ...command,
      response: aiResponse ?? command.response,
      aiEnhanced: !!aiResponse,
    };

    return apiResponse({ command: enriched });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
