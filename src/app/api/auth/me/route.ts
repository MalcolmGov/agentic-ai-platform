/**
 * Auth API — Me (Session Validation)
 * 
 * GET /api/auth/me — Returns current user info from JWT
 * POST /api/auth/me/logout — Clears auth cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthentication } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

// GET /api/auth/me — Validate session and return user
export const GET = withAuthentication(async (_req, { user }) => {
  return apiResponse({
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
    tenant: {
      id: user.tenantId,
    },
  });
});

// POST /api/auth/me — Logout (clear cookie)
export async function POST(req: NextRequest) {
  // Try to get user for audit log
  try {
    const { authenticateRequest } = await import("@/lib/auth/jwt");
    const user = authenticateRequest(req);
    await logAudit({
      action: "auth.logout",
      resource: `user:${user.userId}`,
      userId: user.userId,
      tenantId: user.tenantId,
    });
  } catch {
    // User may already be unauthenticated
  }

  const response = apiResponse({ message: "Logged out successfully" });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
