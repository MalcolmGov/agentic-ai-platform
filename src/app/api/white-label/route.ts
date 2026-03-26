/**
 * White-Label API — Branding, custom domains, theming
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getWhiteLabelEngine } from "@/lib/white-label/white-label-engine";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}
function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

const PostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("configure"),
    companyName: z.string(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
    theme: z.object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      fontFamily: z.string().optional(),
      borderRadius: z.string().optional(),
      darkMode: z.boolean().optional(),
    }).optional(),
    loginPage: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      showPoweredBy: z.boolean().optional(),
    }).optional(),
  }),
  z.object({
    action: z.literal("setup_domain"),
    domain: z.string(),
  }),
  z.object({
    action: z.literal("verify_domain"),
  }),
  z.object({
    action: z.literal("remove_domain"),
  }),
  z.object({
    action: z.literal("reset_theme"),
  }),
]);

export const GET = withAuth("admin")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "config";
    const engine = getWhiteLabelEngine();

    if (view === "config") {
      const config = engine.getConfig(tenantId);
      return config ? apiResponse({ branding: config }) : apiError("Not configured", 404);
    }
    if (view === "css") {
      const css = engine.generateCssVariables(tenantId);
      return css ? apiResponse({ css }) : apiError("Not configured", 404);
    }
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("admin")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getWhiteLabelEngine();

    if (body.action === "configure") {
      const config = engine.configure({ tenantId, ...body });
      return apiResponse({ branding: config }, 201);
    }
    if (body.action === "setup_domain") {
      const domain = engine.setupCustomDomain(tenantId, body.domain);
      return domain ? apiResponse({ domain }, 201) : apiError("Domain unavailable or branding not configured", 400);
    }
    if (body.action === "verify_domain") {
      const domain = engine.verifyDomain(tenantId);
      return domain ? apiResponse({ domain }) : apiError("No domain to verify", 400);
    }
    if (body.action === "remove_domain") {
      return engine.removeDomain(tenantId) ? apiResponse({ removed: true }) : apiError("No domain configured", 400);
    }
    if (body.action === "reset_theme") {
      const theme = engine.resetTheme(tenantId);
      return theme ? apiResponse({ theme }) : apiError("Not configured", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
