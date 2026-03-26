/**
 * Audit Log API — Query and manage audit logs
 *
 * GET    /api/audit — Query audit logs with filters
 * DELETE /api/audit — Purge old logs (data retention)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getRecentAuditEntries } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

// GET — Query audit logs
export const GET = withAuth("audit:read", async (req: NextRequest, { user }) => {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
  const action = req.nextUrl.searchParams.get("action");
  const resource = req.nextUrl.searchParams.get("resource");
  const userId = req.nextUrl.searchParams.get("userId");

  let entries = getRecentAuditEntries(Math.min(limit, 500));

  // Filter by tenant
  entries = entries.filter((e) => e.tenantId === user.tenantId);

  // Apply filters
  if (action) {
    entries = entries.filter((e) => e.action.includes(action));
  }
  if (resource) {
    entries = entries.filter((e) => e.resource.includes(resource));
  }
  if (userId) {
    entries = entries.filter((e) => e.userId === userId);
  }

  return apiResponse({
    entries,
    total: entries.length,
    filters: { action, resource, userId, limit },
  });
});

// DELETE — Purge old audit logs (data retention)
export const DELETE = withAuth("settings:update", async (req: NextRequest, { user }) => {
  const retentionDays = parseInt(req.nextUrl.searchParams.get("retentionDays") || "90", 10);

  if (retentionDays < 30) {
    return apiError("Minimum retention period is 30 days", 400);
  }

  // In production: DELETE FROM audit_logs WHERE tenant_id = ? AND created_at < NOW() - INTERVAL ? days
  const cutoffDate = new Date(Date.now() - retentionDays * 86_400_000);

  // For now, report what would be purged from the in-memory buffer
  const allEntries = getRecentAuditEntries(500);
  const tenantEntries = allEntries.filter((e) => e.tenantId === user.tenantId);
  const wouldPurge = tenantEntries.filter(
    (e) => new Date((e as { timestamp: string }).timestamp) < cutoffDate
  );

  return apiResponse({
    purged: wouldPurge.length,
    retentionDays,
    cutoffDate: cutoffDate.toISOString(),
    tenantId: user.tenantId,
    message: `${wouldPurge.length} audit entries older than ${retentionDays} days would be purged`,
  });
});
