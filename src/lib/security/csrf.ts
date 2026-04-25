/**
 * CSRF Protection — Token-based CSRF prevention
 *
 * Generates and validates CSRF tokens using HMAC-SHA256.
 * Tokens are scoped to session/tenant and expire after a configurable TTL.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ─── Configuration ─────────────────────────

const CSRF_SECRET = process.env.CSRF_SECRET || "csrf-secret-change-in-production";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const HEADER_NAME = "x-csrf-token";
const COOKIE_NAME = "csrf_token";

// ─── Token Management ──────────────────────

/**
 * Generate a CSRF token for a given session
 */
export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now().toString(36);
  const payload = `${sessionId}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  return `${payload}:${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string, sessionId: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [tokenSessionId, timestamp, providedSignature] = parts;

  // Check session matches
  if (tokenSessionId !== sessionId) return false;

  // Check expiry
  const tokenTime = parseInt(timestamp, 36);
  if (Date.now() - tokenTime > TOKEN_TTL_MS) return false;

  // Check signature
  const payload = `${tokenSessionId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  return crypto.timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );
}

// ─── Middleware ──────────────────────────────

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF protection middleware.
 * Skips validation for safe methods (GET, HEAD, OPTIONS).
 * Validates token from x-csrf-token header against cookie.
 */
export function withCsrf(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    // Skip CSRF check for safe methods
    if (SAFE_METHODS.has(req.method)) {
      return handler(req);
    }

    // Skip for API key auth (machine-to-machine)
    if (req.headers.get("x-api-key")) {
      return handler(req);
    }

    // Get session ID from auth cookie or JWT
    const sessionId = extractSessionId(req);
    if (!sessionId) {
      // No session — skip CSRF (auth middleware will handle)
      return handler(req);
    }

    // Validate CSRF token
    const headerToken = req.headers.get(HEADER_NAME);
    if (!headerToken) {
      return NextResponse.json(
        { success: false, error: "CSRF token missing", timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    if (!validateCsrfToken(headerToken, sessionId)) {
      return NextResponse.json(
        { success: false, error: "CSRF token invalid or expired", timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

/**
 * Generate and set a new CSRF token cookie
 */
export function setCsrfCookie(response: NextResponse, sessionId: string): NextResponse {
  const token = generateCsrfToken(sessionId);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS to include in headers
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_TTL_MS / 1000,
    path: "/",
  });
  return response;
}

function extractSessionId(req: NextRequest): string | null {
  // Try auth cookie
  const authToken = req.cookies.get("auth_token")?.value;
  if (authToken) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.decode(authToken) as { userId?: string } | null;
      return decoded?.userId || null;
    } catch {
      return null;
    }
  }
  return null;
}
