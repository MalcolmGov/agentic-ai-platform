/**
 * Audit Logger
 * 
 * Records all significant actions for compliance and security.
 * Writes to database (when connected) and console.
 */

import { NextRequest } from "next/server";
import { AuthenticatedUser } from "@/lib/auth/jwt";

export interface AuditEntry {
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  userId?: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 * In production, writes to PostgreSQL via Prisma.
 * Currently logs to console + collects for batch insert.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const timestamp = new Date().toISOString();
  
  const log = {
    ...entry,
    timestamp,
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };

  // Console log for development
  console.log(`[AUDIT] ${timestamp} | ${entry.action} | ${entry.resource} | user:${entry.userId || "system"} | tenant:${entry.tenantId}`);

  // In production with DB connection:
  // await prisma.auditLog.create({ data: log });
  
  // For now, store in memory for the session
  auditBuffer.push(log);
  
  // Flush buffer if it gets too large
  if (auditBuffer.length > 100) {
    await flushAuditBuffer();
  }
}

// In-memory buffer (replaced by DB writes in production)
const auditBuffer: Array<AuditEntry & { timestamp: string; id: string }> = [];

async function flushAuditBuffer(): Promise<void> {
  // In production: batch insert to PostgreSQL
  // await prisma.auditLog.createMany({ data: auditBuffer });
  auditBuffer.length = 0;
}

/**
 * Create an audit entry from a request context
 */
export function auditFromRequest(
  req: NextRequest,
  user: AuthenticatedUser,
  action: string,
  resource: string,
  details?: Record<string, unknown>
): Promise<void> {
  return logAudit({
    action,
    resource,
    details,
    userId: user.userId,
    tenantId: user.tenantId,
    ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    userAgent: req.headers.get("user-agent") || undefined,
  });
}

/**
 * Get recent audit entries (development only)
 */
export function getRecentAuditEntries(limit = 50) {
  return auditBuffer.slice(-limit).reverse();
}
