import { NextResponse } from "next/server";

/**
 * POST /api/openai-session
 *
 * Creates an ephemeral session token for the OpenAI Realtime API.
 * The OPENAI_API_KEY env var must be set for production use.
 *
 * NOTE: Uses NODE_TLS_REJECT_UNAUTHORIZED bypass for development environments
 * with corporate proxies that inject self-signed certificates.
 */

// Bypass corporate proxy SSL interception in dev
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Set OPENAI_API_KEY in your .env file." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "sage",
        modalities: ["audio", "text"],
        instructions: `You are the Agentic AI Platform co-pilot — a senior AI operations analyst.
You help users understand their agent fleet: performance, anomalies, costs, and security posture.
You have access to live platform data through function calls.
Be concise, professional, and insightful. Proactively highlight risks and opportunities.
When reporting numbers, round appropriately and use natural language.
Always identify yourself as the "Agentic AI Co-Pilot".`,
        tools: [
          {
            type: "function",
            name: "get_platform_overview",
            description: "Gets a high-level overview of the agentic AI platform: total agents, active/paused counts, execution stats, uptime, and overall health.",
          },
          {
            type: "function",
            name: "get_agent_performance",
            description: "Gets detailed performance metrics for all AI agents: success rates, execution counts, average latency, and trend data.",
          },
          {
            type: "function",
            name: "get_anomalies",
            description: "Gets the latest anomalies and security alerts detected across the platform.",
          },
          {
            type: "function",
            name: "get_cost_analysis",
            description: "Gets cost savings analysis: total saved, breakdown by category, LLM token usage, and ROI metrics.",
          },
          {
            type: "function",
            name: "get_active_workflows",
            description: "Gets status of all active automated workflows: names, execution counts, last run times, and statuses.",
          },
          {
            type: "function",
            name: "get_security_posture",
            description: "Gets the current security posture: threat level, recent security events, API key status, and compliance metrics.",
          },
        ],
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.85,
          prefix_padding_ms: 400,
          silence_duration_ms: 1000,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[openai-session] Failed:", res.status, err);
      let parsed = err;
      try { parsed = JSON.parse(err)?.error?.message || err; } catch {}
      return NextResponse.json(
        { error: `OpenAI ${res.status}: ${parsed}` },
        { status: res.status }
      );
    }

    const session = await res.json();
    return NextResponse.json(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[openai-session] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
