/**
 * JWT Authentication Library
 * 
 * Handles token generation, verification, password hashing,
 * and request authentication for the multi-tenant platform.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "@/lib/config/env";
import { NextRequest } from "next/server";

// ─── Types ─────────────────────────────────

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

export type UserRole = "OWNER" | "ADMIN" | "DEVELOPER" | "ANALYST" | "VIEWER";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

// ─── Password Hashing ─────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token Management ─────────────────

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY,
    issuer: "swifter-ai-platform",
    audience: payload.tenantId,
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "swifter-ai-platform",
    });
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Token expired", 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError("Invalid token", 401);
    }
    throw new AuthError("Authentication failed", 401);
  }
}

// ─── Request Authentication ───────────────

/**
 * Extract and verify the auth token from a Next.js request.
 * Supports both Authorization header (Bearer) and cookie.
 */
export function authenticateRequest(req: NextRequest): AuthenticatedUser {
  // Try Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  // Try cookie
  const tokenCookie = req.cookies.get("auth_token");
  if (tokenCookie?.value) {
    return verifyToken(tokenCookie.value);
  }

  throw new AuthError("No authentication token provided", 401);
}

// ─── Error Class ──────────────────────────

export class AuthError extends Error {
  status: number;
  
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
