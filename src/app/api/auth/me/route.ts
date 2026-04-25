/**
 * Auth API — Current User
 *
 * GET /api/auth/me
 * Returns the authenticated user's profile from JWT (+ optional DB enrichment).
 * Works without a database — the JWT already contains all needed fields.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth/jwt";
import {
  getLocalDevTenant,
  getLocalDevUserDisplayName,
} from "@/lib/auth/local-dev-registrations";

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

// Demo tenant info keyed by tenantId (fallback when DB unavailable)
const DEMO_TENANTS: Record<string, { name: string; slug: string; plan: string }> = {
  "tenant_acme_demo": { name: "Acme Corporation", slug: "acme-corp", plan: "ENTERPRISE" },
};

// Demo user names keyed by userId (fallback when DB unavailable)
const DEMO_NAMES: Record<string, string> = {
  "user_demo_admin": "Enterprise Admin",
  "user_demo_hr":    "Sarah Johnson",
  "user_demo_legal": "James Mitchell",
  "user_demo_risk":  "Priya Sharma",
  "user_demo_sec":   "Marcus Williams",
  "user_demo_comp":  "Fatima Al-Hassan",
  "user_demo_qa":    "David Chen",
  "user_demo_prod":  "Aisha Patel",
  "user_demo_eng":   "Luca Ferrari",
  "user_demo_mkt":   "Zara Williams",
  "user_demo_data":  "Raj Krishnamurthy",
  "user_demo_infra": "Tom Okafor",
  "user_demo_cs":    "Nadia Petrov",
};

export async function GET(req: NextRequest) {
  try {
    // Decode JWT — throws AuthError if token missing or invalid
    const auth = authenticateRequest(req);

    // Build base response from JWT payload (no DB needed)
    const baseUser = {
      id: auth.userId,
      email: auth.email,
      role: auth.role,
      department: (auth as { department?: string | null }).department ?? null,
      name: DEMO_NAMES[auth.userId] ?? auth.email.split("@")[0],
    };
    const baseTenant = DEMO_TENANTS[auth.tenantId] ?? { name: auth.tenantId, slug: null, plan: "STARTER" };

    // Try to enrich from DB (optional — graceful fallback if unavailable)
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const [dbUser, dbTenant] = await Promise.all([
        prisma.user.findUnique({
          where: { id: auth.userId },
          select: { id: true, email: true, name: true, role: true, department: true, tenantId: true },
        }),
        prisma.tenant.findUnique({
          where: { id: auth.tenantId },
          select: { id: true, name: true, slug: true, plan: true },
        }),
      ]);

      if (dbUser) {
        return apiResponse({
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            department: (dbUser as { department?: string | null }).department ?? null,
          },
          tenant: dbTenant
            ? { id: dbTenant.id, name: dbTenant.name, slug: dbTenant.slug, plan: dbTenant.plan }
            : { id: auth.tenantId, ...baseTenant },
          source: "database",
        });
      }
    } catch {
      // DB unavailable — return JWT-derived data below
    }

    const localT = getLocalDevTenant(auth.tenantId);
    if (localT) {
      const displayName =
        getLocalDevUserDisplayName(auth.userId) ??
        baseUser.name ??
        auth.email.split("@")[0];
      return apiResponse({
        user: { ...baseUser, name: displayName },
        tenant: { id: auth.tenantId, name: localT.name, slug: localT.slug, plan: "ENTERPRISE" },
        source: "local-dev",
      });
    }

    // Return JWT-derived data (works without DB)
    return apiResponse({
      user: baseUser,
      tenant: { id: auth.tenantId, ...baseTenant },
      source: "token",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    console.error("[Auth Me]", error);
    return apiError("Authentication failed", 401);
  }
}

// POST /api/auth/me — Logout
export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out successfully" },
    timestamp: new Date().toISOString(),
  });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
