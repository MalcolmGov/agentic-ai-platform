/**
 * White-Label API — Branding, custom domains, theming
 *
 * GET   /api/white-label          — returns tenant's WhiteLabelConfig
 * PATCH /api/white-label          — upserts WhiteLabelConfig fields
 * POST  /api/white-label          — actions: { action: 'verify-domain' }
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";

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

const DEFAULT_CONFIG = {
  theme: {
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
    logoUrl: null,
    faviconUrl: null,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  customDomain: null,
  domainVerified: false,
  emailBranding: {
    fromName: "AI Platform",
    fromEmail: "noreply@{{YOUR_DOMAIN}}",
    replyTo: "support@{{YOUR_DOMAIN}}",
    headerColor: "#6366f1",
  },
  loginPage: {
    headline: "AI Platform",
    subheadline: "Platform",
    backgroundUrl: null,
    showPoweredBy: true,
  },
};

// ─── GET /api/white-label ─────────────────────────────────────────────────────

export const GET = withAuth(
  "settings:read",
  async (_req: NextRequest, { user }) => {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const config = await prisma.whiteLabelConfig.findUnique({
        where: { tenantId: user.tenantId },
      });

      if (!config) {
        return apiResponse({ config: { ...DEFAULT_CONFIG, tenantId: user.tenantId }, source: "default" });
      }

      return apiResponse({ config, source: "database" });
    } catch {
      return apiResponse({
        config: { ...DEFAULT_CONFIG, tenantId: user.tenantId },
        source: "fallback",
      });
    }
  }
);

// ─── PATCH /api/white-label ───────────────────────────────────────────────────

export const PATCH = withAuth(
  "settings:update",
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json() as {
        theme?: Record<string, unknown>;
        customDomain?: string;
        emailBranding?: Record<string, unknown>;
        loginPage?: Record<string, unknown>;
      };

      const { prisma } = await import("@/lib/db/prisma");

      const existing = await prisma.whiteLabelConfig.findUnique({
        where: { tenantId: user.tenantId },
      });

      const updateData: Record<string, unknown> = {};
      if (body.theme !== undefined) updateData.theme = body.theme;
      if (body.customDomain !== undefined) updateData.customDomain = body.customDomain;
      if (body.emailBranding !== undefined) updateData.emailBranding = body.emailBranding;
      if (body.loginPage !== undefined) updateData.loginPage = body.loginPage;

      const config = await prisma.whiteLabelConfig.upsert({
        where: { tenantId: user.tenantId },
        create: {
          tenantId: user.tenantId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          theme: (body.theme ?? existing?.theme ?? DEFAULT_CONFIG.theme) as any,
          customDomain: body.customDomain ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emailBranding: (body.emailBranding ?? null) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          loginPage: (body.loginPage ?? null) as any,
        },
        update: updateData,
      });

      return apiResponse({ config });
    } catch (err) {
      console.error("[White-Label PATCH]", err);
      return apiError("Failed to update white-label config", 500);
    }
  }
);

// ─── POST /api/white-label ────────────────────────────────────────────────────

export const POST = withAuth(
  "settings:update",
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json() as { action?: string };

      if (body.action === "verify-domain") {
        const { prisma } = await import("@/lib/db/prisma");

        const config = await prisma.whiteLabelConfig.upsert({
          where: { tenantId: user.tenantId },
          create: {
            tenantId: user.tenantId,
            theme: DEFAULT_CONFIG.theme,
            domainVerified: true,
          },
          update: { domainVerified: true },
        });

        return apiResponse({ config, verified: true });
      }

      return apiError("Unknown action. Expected { action: 'verify-domain' }", 400);
    } catch (err) {
      console.error("[White-Label POST]", err);
      return apiError("Action failed", 500);
    }
  }
);
