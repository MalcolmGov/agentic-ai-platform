/**
 * Onboarding API — Tenant provisioning, API keys, quickstart
 */

import { NextRequest, NextResponse } from "next/server";
import { getOnboardingEngine, PlanTier, OnboardingStep } from "@/lib/onboarding/onboarding-engine";
import { withAuth } from "@/lib/auth/rbac";
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
    action: z.literal("signup"),
    companyName: z.string().min(2),
    ownerEmail: z.string().email(),
    plan: z.enum(["starter", "professional", "enterprise"]),
    password: z.string().min(8),
  }),
  z.object({
    action: z.literal("generate_api_key"),
    name: z.string(),
    permissions: z.array(z.string()).default(["agent:read", "agent:write"]),
  }),
  z.object({
    action: z.literal("revoke_api_key"),
    keyId: z.string(),
  }),
  z.object({
    action: z.literal("complete_step"),
    step: z.enum(["account_created", "api_key_generated", "first_agent_created", "first_execution", "integration_connected", "team_invited", "billing_configured"]),
  }),
  z.object({
    action: z.literal("change_plan"),
    plan: z.enum(["starter", "professional", "enterprise"]),
  }),
]);

// Signup is public, other actions require auth
export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.parse(await req.json());
    const engine = getOnboardingEngine();

    if (body.action === "signup") {
      const result = engine.signup(body);
      return apiResponse({ tenant: result.tenant, apiKey: result.apiKey }, 201);
    }

    // All other actions need tenant context
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) return apiError("Authentication required", 401);

    if (body.action === "generate_api_key") {
      const result = engine.generateApiKey(tenantId, body.name, body.permissions);
      return result ? apiResponse({ key: result.key, rawKey: result.rawKey }, 201) : apiError("Tenant not found", 404);
    }
    if (body.action === "revoke_api_key") {
      return engine.revokeApiKey(tenantId, body.keyId) ? apiResponse({ revoked: true }) : apiError("Key not found", 404);
    }
    if (body.action === "complete_step") {
      const progress = engine.completeOnboardingStep(tenantId, body.step as OnboardingStep);
      return progress ? apiResponse({ progress }) : apiError("Tenant not found", 404);
    }
    if (body.action === "change_plan") {
      const tenant = engine.changePlan(tenantId, body.plan as PlanTier);
      return tenant ? apiResponse({ tenant }) : apiError("Tenant not found", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
}

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "tenant";
    const engine = getOnboardingEngine();

    if (view === "tenant") {
      const tenant = engine.getTenant(tenantId);
      return tenant ? apiResponse({ tenant }) : apiError("Tenant not found", 404);
    }
    if (view === "quickstart") {
      const guide = engine.getQuickstart(tenantId);
      return guide ? apiResponse({ guide }) : apiError("Tenant not found", 404);
    }
    if (view === "limits") {
      const resource = url.searchParams.get("resource") as "maxAgents" | null;
      const usage = parseInt(url.searchParams.get("usage") || "0", 10);
      if (!resource) return apiError("resource param required", 400);
      return apiResponse({ limits: engine.checkLimits(tenantId, resource, usage) });
    }
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
