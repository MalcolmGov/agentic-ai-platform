/**
 * Auth API — Register
 * 
 * POST /api/auth/register
 * Creates a new tenant + owner user account.
 */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken, TokenPayload } from "@/lib/auth/jwt";
import { logAudit } from "@/lib/audit/logger";
import { RegisterSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendWelcomeEmail } from "@/lib/email/sender";
import {
  isLocalDevAuthEnabled,
  localDevRegister,
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

type RegResult = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    plan: string;
  };
  user: { id: string; email: string; name: string; role: string };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.parse(body);
    const { email, password, name, organizationName, industry } = parsed;

    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let result: RegResult;

    try {
      const passwordHash = await hashPassword(password);
      const pr = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing) throw new Error("EMAIL_EXISTS");

        let finalSlug = slug;
        const slugExists = await tx.tenant.findUnique({ where: { slug } });
        if (slugExists) finalSlug = `${slug}-${Date.now().toString(36)}`;

        const tenant = await tx.tenant.create({
          data: {
            name: organizationName,
            slug: finalSlug,
            industry: industry || null,
            users: {
              create: {
                email,
                name,
                passwordHash,
                role: "OWNER",
              },
            },
            subscription: {
              create: {
                plan: "STARTER",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + 14 * 24 * 60 * 60 * 1000
                ),
                agentLimit: 3,
                executionLimit: 1000,
                priceMonthly: 0,
              },
            },
          },
          include: { users: true },
        });

        return { tenant, user: tenant.users[0] };
      });
      result = {
        tenant: {
          id: pr.tenant.id,
          name: pr.tenant.name,
          slug: pr.tenant.slug,
          industry: pr.tenant.industry ?? null,
          plan: pr.tenant.plan,
        },
        user: {
          id: pr.user.id,
          email: pr.user.email,
          name: pr.user.name,
          role: pr.user.role,
        },
      };
    } catch (dbErr) {
      if (dbErr instanceof Error && dbErr.message === "EMAIL_EXISTS") {
        return apiError("An account with this email already exists", 409);
      }
      if (!isLocalDevAuthEnabled()) {
        throw dbErr;
      }
      console.warn(
        "[Auth Register] Database unavailable, using in-memory dev registration:",
        dbErr
      );
      try {
        const { user: u, tenant: t } = await localDevRegister({
          email,
          password,
          name,
          organizationName,
        });
        result = {
          tenant: {
            id: u.tenantId,
            name: t.name,
            slug: t.slug,
            industry: industry ?? null,
            plan: "ENTERPRISE",
          },
          user: {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
          },
        };
      } catch (localErr) {
        if (localErr instanceof Error && localErr.message === "EMAIL_EXISTS") {
          return apiError("An account with this email already exists", 409);
        }
        throw localErr;
      }
    }

    const { tenant, user } = result;

    const tokenPayload: TokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
    };
    const token = generateToken(tokenPayload);

    await logAudit({
      action: "auth.register",
      resource: `tenant:${tenant.id}`,
      details: { email, organizationName, industry },
      userId: user.id,
      tenantId: tenant.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    const response = apiResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          industry: tenant.industry ?? null,
          plan: tenant.plan,
        },
      },
      201
    );

    // Fire-and-forget welcome email
    sendWelcomeEmail(user.email, user.name ?? user.email, tenant.name).catch(console.error);

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
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return apiError("An account with this email already exists", 409);
    }
    console.error("[Auth Register]", error);
    return apiError("Registration failed", 500);
  }
}
