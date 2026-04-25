/**
 * Auth API — Login
 * 
 * POST /api/auth/login
 * Authenticates user with email + password, returns JWT.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken, TokenPayload } from "@/lib/auth/jwt";
import { logAudit } from "@/lib/audit/logger";
import { LoginSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { localDevVerifyLogin } from "@/lib/auth/local-dev-registrations";

// Fallback demo users — active when DB is unavailable
const DEMO_USERS = [
  { id: "user_demo_admin", email: "admin@acme.com",       name: "Enterprise Admin",  role: "OWNER"   as const, department: null,           passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_hr",    email: "hr@acme.com",          name: "Sarah Johnson",     role: "ANALYST" as const, department: "HR",            passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_legal", email: "legal@acme.com",       name: "James Mitchell",    role: "ANALYST" as const, department: "LEGAL",         passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_risk",  email: "risk@acme.com",        name: "Priya Sharma",      role: "ANALYST" as const, department: "RISK",          passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_sec",   email: "security@acme.com",    name: "Marcus Williams",   role: "DEVELOPER" as const, department: "SECURITY",    passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_comp",  email: "compliance@acme.com",  name: "Fatima Al-Hassan",  role: "ANALYST" as const, department: "COMPLIANCE",   passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_qa",    email: "qa@acme.com",          name: "David Chen",        role: "DEVELOPER" as const, department: "QA",          passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_prod",  email: "product@acme.com",     name: "Aisha Patel",       role: "ANALYST" as const, department: "PRODUCT",      passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_eng",   email: "engineering@acme.com", name: "Luca Ferrari",      role: "DEVELOPER" as const, department: "ENGINEERING", passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_mkt",   email: "marketing@acme.com",  name: "Zara Williams",     role: "ANALYST" as const, department: "MARKETING",       passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_data",  email: "data@acme.com",        name: "Raj Krishnamurthy", role: "DEVELOPER" as const, department: "DATA_ANALYTICS", passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_infra", email: "infra@acme.com",       name: "Tom Okafor",        role: "DEVELOPER" as const, department: "INFRA_OPS",     passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
  { id: "user_demo_cs",    email: "support@acme.com",     name: "Nadia Petrov",      role: "ANALYST" as const, department: "CUSTOMER_SUPPORT", passwordHash: "", tenantId: "tenant_acme_demo", tenantName: "Acme Corporation", tenantSlug: "acme-corp", tenantPlan: "ENTERPRISE" },
];
let demoSeeded = false;
async function seedDemoPasswords() {
  if (demoSeeded) return;
  demoSeeded = true;
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("admin123456", 10);
  DEMO_USERS.forEach(u => { u.passwordHash = hash; });
}


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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.parse(body);
    const { email, password } = parsed;

    // Try real DB first, then demo (if DB is down), then in-memory dev registrations
    let resolvedUser: {
      id: string; email: string; name: string;
      role: "OWNER" | "ADMIN" | "DEVELOPER" | "ANALYST" | "VIEWER";
      department: string | null; passwordHash: string;
      tenantId: string; tenantName: string; tenantSlug: string; tenantPlan: string;
    } | null = null;

    let skipPasswordCheck = false;

    try {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        include: { tenant: { select: { id: true, name: true, slug: true, plan: true } } },
      });
      if (dbUser) {
        resolvedUser = {
          id: dbUser.id, email: dbUser.email, name: dbUser.name,
          role: dbUser.role, department: (dbUser as { department?: string | null }).department ?? null,
          passwordHash: dbUser.passwordHash, tenantId: dbUser.tenantId,
          tenantName: dbUser.tenant.name, tenantSlug: dbUser.tenant.slug,
          tenantPlan: dbUser.tenant.plan,
        };
      }
    } catch {
      // DB unavailable — fall through to demo users
      await seedDemoPasswords();
      const demo = DEMO_USERS.find(u => u.email === email);
      if (demo) resolvedUser = demo;
    }

    if (!resolvedUser) {
      const local = await localDevVerifyLogin(email, password);
      if (local) {
        skipPasswordCheck = true;
        resolvedUser = {
          id: local.id,
          email: local.email,
          name: local.name,
          role: local.role,
          department: null,
          passwordHash: "",
          tenantId: local.tenantId,
          tenantName: local.tenantName,
          tenantSlug: local.tenantSlug,
          tenantPlan: "ENTERPRISE",
        };
      }
    }

    if (!resolvedUser) {
      await logAudit({ action: "auth.login.failed", resource: `email:${email}`, details: { reason: "user_not_found" }, tenantId: "unknown", ipAddress: req.headers.get("x-forwarded-for") || "unknown" });
      return apiError("Invalid email or password", 401);
    }

    if (!skipPasswordCheck) {
      const isValid = await verifyPassword(password, resolvedUser.passwordHash);
      if (!isValid) {
        await logAudit({ action: "auth.login.failed", resource: `user:${resolvedUser.id}`, details: { reason: "invalid_password" }, userId: resolvedUser.id, tenantId: resolvedUser.tenantId, ipAddress: req.headers.get("x-forwarded-for") || "unknown" });
        return apiError("Invalid email or password", 401);
      }
    }

    const tokenPayload = {
      userId: resolvedUser.id,
      tenantId: resolvedUser.tenantId,
      email: resolvedUser.email,
      role: resolvedUser.role,
      department: resolvedUser.department,
    };
    const token = generateToken(tokenPayload as TokenPayload);

    await logAudit({ action: "auth.login.success", resource: `user:${resolvedUser.id}`, userId: resolvedUser.id, tenantId: resolvedUser.tenantId, ipAddress: req.headers.get("x-forwarded-for") || "unknown" });

    const response = apiResponse({
      token,
      user: { id: resolvedUser.id, email: resolvedUser.email, name: resolvedUser.name, role: resolvedUser.role, department: resolvedUser.department },
      tenant: { id: resolvedUser.tenantId, name: resolvedUser.tenantName, slug: resolvedUser.tenantSlug, plan: resolvedUser.tenantPlan },
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
    if (error instanceof ZodError) return validationError(error);
    console.error("[Auth Login]", error);
    return apiError("Login failed", 500);
  }
}
