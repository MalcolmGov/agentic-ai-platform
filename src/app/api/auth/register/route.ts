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
    const parsed = RegisterSchema.parse(body);
    const { email, password, name, organizationName, industry } = parsed;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate IDs
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // In production: Create tenant + user in database via Prisma
    // const tenant = await prisma.tenant.create({
    //   data: {
    //     id: tenantId,
    //     name: organizationName,
    //     slug,
    //     industry,
    //     users: {
    //       create: {
    //         id: userId,
    //         email,
    //         name,
    //         passwordHash,
    //         role: "OWNER",
    //       },
    //     },
    //   },
    //   include: { users: true },
    // });

    // Generate JWT token
    const tokenPayload: TokenPayload = {
      userId,
      tenantId,
      email,
      role: "OWNER",
    };
    const token = generateToken(tokenPayload);

    // Audit log
    await logAudit({
      action: "auth.register",
      resource: `tenant:${tenantId}`,
      details: { email, organizationName, industry },
      userId,
      tenantId,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    // Set cookie
    const response = apiResponse(
      {
        token,
        user: {
          id: userId,
          email,
          name,
          role: "OWNER",
        },
        tenant: {
          id: tenantId,
          name: organizationName,
          slug,
          industry: industry || null,
          plan: "STARTER",
        },
      },
      201
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    console.error("[Auth Register]", error);
    return apiError("Registration failed", 500);
  }
}
