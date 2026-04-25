/**
 * Rate Limiter — Per-tenant API rate limiting
 * 
 * Uses in-memory sliding window counters.
 * Production: Redis-backed with ioredis.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Types ─────────────────────────────────

interface RateLimit {
  limit: number;
  window: number; // seconds
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

// ─── Plan-based Rate Limits ───────────────

const PLAN_LIMITS: Record<string, RateLimit> = {
  STARTER:      { limit: 100,   window: 60 },   // 100 req/min
  PROFESSIONAL: { limit: 500,   window: 60 },   // 500 req/min
  ENTERPRISE:   { limit: 2000,  window: 60 },   // 2000 req/min
};

// ─── In-Memory Store ──────────────────────

const windows: Map<string, WindowEntry> = new Map();

/**
 * Check and consume a rate limit token
 */
export function checkRateLimit(
  tenantId: string,
  plan: string = "STARTER"
): {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
} {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.STARTER;
  const key = `rl:${tenantId}`;
  const now = Date.now();

  let entry = windows.get(key);

  // Reset window if expired
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + limits.window * 1000 };
    windows.set(key, entry);
  }

  entry.count++;
  const allowed = entry.count <= limits.limit;
  const remaining = Math.max(0, limits.limit - entry.count);

  return { allowed, remaining, limit: limits.limit, resetAt: entry.resetAt };
}

// ─── Middleware Wrapper ───────────────────

/**
 * Rate limiting middleware for API routes.
 * Extracts tenantId from JWT token or API key.
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    // Extract tenant ID from various sources
    let tenantId = "anonymous";
    let plan = "STARTER";

    // Check JWT payload (set by auth middleware)
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const jwt = await import("jsonwebtoken");
        const token = authHeader.slice(7);
        const decoded = jwt.default.decode(token) as { tenantId?: string } | null;
        if (decoded?.tenantId) {
          tenantId = decoded.tenantId;
          plan = "ENTERPRISE"; // Would look up actual plan in production
        }
      }
    } catch {
      // Continue with anonymous rate limiting
    }

    // Check API key header
    const apiKey = req.headers.get("x-api-key");
    if (apiKey && tenantId === "anonymous") {
      tenantId = `apikey:${apiKey.slice(0, 8)}`;
    }

    // Check rate limit
    const result = checkRateLimit(tenantId, plan);

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          limit: result.limit,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
            "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Execute handler
    const response = await handler(req);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000).toString());

    return response;
  };
}
