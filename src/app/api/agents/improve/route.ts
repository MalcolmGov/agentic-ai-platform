/**
 * Agent Self-Improvement API
 *
 * GET  /api/agents/improve — Get improvement suggestions
 * POST /api/agents/improve — Apply improvement or start A/B test
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getPerformanceTracker, getPromptOptimizer, getABTester } from "@/lib/agents/self-improvement";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async (req: NextRequest) => {
  const agentId = req.nextUrl.searchParams.get("agentId");
  const tracker = getPerformanceTracker();
  const optimizer = getPromptOptimizer();

  if (agentId) {
    const metrics = tracker.getMetrics(agentId);
    const trend = tracker.getMetricsTrend(agentId);
    const suggestions = optimizer.suggestImprovements(agentId, metrics);
    return apiResponse({ agentId, metrics, trend, suggestions });
  }

  // Return all agents' performance
  const agentIds = tracker.getAllAgentIds();
  const allMetrics = agentIds.map((id) => ({
    agentId: id,
    metrics: tracker.getMetrics(id),
    suggestions: optimizer.suggestImprovements(id, tracker.getMetrics(id)),
  }));

  const abTests = getABTester().listTests();

  return apiResponse({ agents: allMetrics, abTests });
});

export const POST = withAuth("agents:execute", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "ab_test") {
      const { name, agentIdA, agentIdB, totalRuns } = body;
      if (!name || !agentIdA || !agentIdB) return apiError("name, agentIdA, agentIdB required");
      const test = getABTester().createTest(name, agentIdA, agentIdB, totalRuns || 100);
      return apiResponse({ test }, 201);
    }

    return apiError("Invalid action. Supported: ab_test");
  } catch {
    return apiError("Invalid request body");
  }
});
