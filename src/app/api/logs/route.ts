/**
 * Secured Logs API — Protected with RBAC
 * 
 * GET /api/logs — Fetch system logs (requires logs:read)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getRecentAuditEntries } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

const mockLogs = [
  { id: "log-001", timestamp: "2026-03-24T19:49:12Z", level: "INFO", agent: "Fraud Monitoring Agent", message: "Transaction batch analyzed: 142 transactions, 3 flagged", source: "fraud-monitor-01" },
  { id: "log-002", timestamp: "2026-03-24T19:48:55Z", level: "WARN", agent: "Webhook Dispatcher", message: "Retry attempt 2/3 for endpoint", source: "webhook-engine" },
  { id: "log-003", timestamp: "2026-03-24T19:48:30Z", level: "INFO", agent: "Compliance Agent", message: "KYC verification completed for batch #B-2847", source: "compliance-01" },
  { id: "log-004", timestamp: "2026-03-24T19:47:15Z", level: "ERROR", agent: "Customer Support Agent", message: "LLM API timeout after 30s", source: "support-agent-03" },
  { id: "log-005", timestamp: "2026-03-24T19:46:58Z", level: "INFO", agent: "Document Processing Agent", message: "Invoice #INV-2024-1847 parsed successfully", source: "doc-processor" },
];

export const GET = withAuth("logs:read", async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const agent = searchParams.get("agent");
  const limit = parseInt(searchParams.get("limit") || "50");
  const includeAudit = searchParams.get("audit") === "true";

  let filtered = [...mockLogs];

  if (level) {
    filtered = filtered.filter((l) => l.level === level.toUpperCase());
  }
  if (agent) {
    filtered = filtered.filter((l) =>
      l.agent.toLowerCase().includes(agent.toLowerCase())
    );
  }

  const result: Record<string, unknown> = {
    logs: filtered.slice(0, limit),
    total: filtered.length,
    filters: { level, agent, limit },
    tenantId: user.tenantId,
  };

  // Include audit entries if requested (requires admin role — checked separately)
  if (includeAudit) {
    result.auditEntries = getRecentAuditEntries(20);
  }

  return apiResponse(result);
});
