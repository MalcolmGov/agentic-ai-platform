/**
 * Voice Commands API
 *
 * GET  /api/voice/commands — Get command history
 * POST /api/voice/commands — Process voice transcript
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getVoiceProcessor } from "@/lib/voice/voice-command-processor";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async () => {
  const processor = getVoiceProcessor();
  const history = processor.getCommandHistory();
  return apiResponse({ commands: history });
});

export const POST = withAuth("agents:execute", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) return apiError("transcript is required");

    const processor = getVoiceProcessor();
    const command = processor.processTranscript(transcript);

    return apiResponse({ command });
  } catch {
    return apiError("Invalid request body");
  }
});
