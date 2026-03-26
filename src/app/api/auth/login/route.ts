/**
 * Auth API — Login
 * 
 * POST /api/auth/login
 * Authenticates user with email + password, returns JWT.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken, TokenPayload } from "@/lib/auth/jwt";
import { logAudit } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// In-memory user store for development (replaced by Prisma in production)
const devUsers: Array<{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "ANALYST" | "VIEWER";
  tenantId: string;
  tenantName: string;
}> = [];

// Lazy-init: seed demo user on first request
let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("admin123456", 12);
  devUsers.push({
    id: "user_demo_001",
    email: "admin@acme.com",
    name: "Enterprise Admin",
    passwordHash: hash,
    role: "OWNER",
    tenantId: "tenant_acme_001",
    tenantName: "Acme Corporation",
  });
}

export async function POST(req: NextRequest) {
  try {
    // Ensure demo user exists
    await ensureSeeded();
    
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("email and password are required", 400);
    }

    // Development: check in-memory store
    // Production: await prisma.user.findUnique({ where: { email }, include: { tenant: true } })
    const user = devUsers.find((u) => u.email === email);

    if (!user) {
      // Don't reveal whether email exists
      await logAudit({
        action: "auth.login.failed",
        resource: `email:${email}`,
        details: { reason: "user_not_found" },
        tenantId: "unknown",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
      return apiError("Invalid email or password", 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAudit({
        action: "auth.login.failed",
        resource: `user:${user.id}`,
        details: { reason: "invalid_password" },
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
      return apiError("Invalid email or password", 401);
    }

    // Generate JWT
    const tokenPayload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    // Audit log
    await logAudit({
      action: "auth.login.success",
      resource: `user:${user.id}`,
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    // Set cookie + return response
    const response = apiResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: user.tenantId,
        name: user.tenantName,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth Login]", error);
    return apiError("Login failed", 500);
  }
}
