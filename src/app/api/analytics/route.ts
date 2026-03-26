/**
 * Secured Analytics API — Protected with RBAC
 * 
 * GET /api/analytics — Fetch platform analytics (requires analytics:read)
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

export const GET = withAuth("analytics:read", async (_req, { user }) => {
  const analytics = {
    tenantId: user.tenantId,
    overview: {
      activeAgents: 12,
      totalExecutions: 34567,
      executionsToday: 1847,
      apiCalls24h: 23400,
      successRate: 99.2,
      avgResponseTimeMs: 420,
    },
    revenue: {
      fraudPrevented: 1200000,
      costSaved: 847000,
      revenueImpact: 2400000,
      currency: "USD",
    },
    agentPerformance: [
      { type: "FRAUD_MONITORING", successRate: 99.7, executions: 4823, avgDurationMs: 4200 },
      { type: "COMPLIANCE", successRate: 99.9, executions: 2156, avgDurationMs: 12800 },
      { type: "REPORTING", successRate: 98.5, executions: 892, avgDurationMs: 8100 },
      { type: "FINANCE", successRate: 99.2, executions: 1543, avgDurationMs: 3400 },
      { type: "CUSTOMER_SUPPORT", successRate: 96.8, executions: 7234, avgDurationMs: 2100 },
      { type: "WORKFLOW_AUTOMATION", successRate: 99.1, executions: 5678, avgDurationMs: 6700 },
    ],
    anomalies: [
      { timestamp: "2026-03-24T19:48:00Z", severity: "critical", title: "Unusual transaction volume spike", agent: "FRAUD_MONITORING" },
      { timestamp: "2026-03-24T19:35:00Z", severity: "warning", title: "API latency increase", agent: "OPERATIONS" },
      { timestamp: "2026-03-24T19:22:00Z", severity: "info", title: "New data pattern identified", agent: "DATA_ANALYST" },
    ],
    usage: {
      agentExecutions: { used: 67423, limit: 100000 },
      apiRequests: { used: 234891, limit: 500000 },
      storageGb: { used: 12.4, limit: 50 },
      llmTokensM: { used: 8.2, limit: 20 },
    },
  };

  return apiResponse(analytics);
});
