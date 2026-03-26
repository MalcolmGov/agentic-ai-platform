/**
 * SSO API — SAML/OIDC configuration, login, session management
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getSSOEngine, SSOProtocol } from "@/lib/sso/sso-engine";
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
    protocol: z.enum(["saml", "oidc"]),
    displayName: z.string(),
    saml: z.object({ entityId: z.string(), ssoUrl: z.string(), sloUrl: z.string(), certificate: z.string(), nameIdFormat: z.string().default("email") }).optional(),
    oidc: z.object({ issuer: z.string(), clientId: z.string(), clientSecret: z.string(), authorizationUrl: z.string(), tokenUrl: z.string(), userInfoUrl: z.string(), scopes: z.array(z.string()).default(["openid", "profile", "email"]) }).optional(),
    roleMapping: z.record(z.string()).default({}),
    allowedDomains: z.array(z.string()).default([]),
    enforced: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("activate"),
  }),
  z.object({
    action: z.literal("deactivate"),
  }),
  z.object({
    action: z.literal("login"),
  }),
  z.object({
    action: z.literal("callback"),
    email: z.string().email(),
    name: z.string(),
    groups: z.array(z.string()).default([]),
    attributes: z.record(z.string()).default({}),
  }),
  z.object({
    action: z.literal("logout"),
    sessionId: z.string(),
  }),
]);

export const GET = withAuth("admin")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "config";
    const engine = getSSOEngine();

    if (view === "config") {
      const config = engine.getConfig(tenantId);
      return config ? apiResponse({ config }) : apiError("SSO not configured", 404);
    }
    if (view === "sessions") {
      return apiResponse({ sessions: engine.listSessions(tenantId) });
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
    const engine = getSSOEngine();

    if (body.action === "configure") {
      const config = engine.configure({ tenantId, protocol: body.protocol as SSOProtocol, displayName: body.displayName, saml: body.saml, oidc: body.oidc, roleMapping: body.roleMapping, allowedDomains: body.allowedDomains, enforced: body.enforced });
      return apiResponse({ config }, 201);
    }
    if (body.action === "activate") {
      return engine.activate(tenantId) ? apiResponse({ activated: true }) : apiError("SSO not configured", 404);
    }
    if (body.action === "deactivate") {
      return engine.deactivate(tenantId) ? apiResponse({ deactivated: true }) : apiError("SSO not configured", 404);
    }
    if (body.action === "login") {
      const result = engine.initiateLogin(tenantId);
      return result.success ? apiResponse({ redirectUrl: result.redirectUrl }) : apiError(result.error || "Login failed", 400);
    }
    if (body.action === "callback") {
      const result = engine.processCallback(tenantId, { email: body.email, name: body.name, groups: body.groups, attributes: body.attributes });
      return result.success ? apiResponse({ session: result.session }, 201) : apiError(result.error || "Callback failed", 400);
    }
    if (body.action === "logout") {
      return engine.logout(body.sessionId) ? apiResponse({ loggedOut: true }) : apiError("Session not found", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
