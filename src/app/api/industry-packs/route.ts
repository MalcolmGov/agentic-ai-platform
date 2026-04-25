/**
 * Industry Packs API — Pre-built agent blueprints with regulatory knowledge
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getIndustryPackManager } from "@/lib/industry-packs/industry-packs";
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
    action: z.literal("deploy_blueprint"),
    blueprintId: z.string(),
    overrides: z.record(z.unknown()).default({}),
  }),
  z.object({
    action: z.literal("search"),
    query: z.string(),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const industry = url.searchParams.get("industry");
    const manager = getIndustryPackManager();

    if (industry) {
      const pack = manager.getPack(industry);
      if (!pack) return apiError("Industry pack not found", 404);
      return apiResponse({ pack });
    }
    return apiResponse({ packs: manager.getPacks() });
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const manager = getIndustryPackManager();

    if (body.action === "deploy_blueprint") {
      const config = manager.deployBlueprint(body.blueprintId, tenantId);
      if (!config) return apiError("Blueprint not found", 404);
      return apiResponse({ config }, 201);
    }
    if (body.action === "search") {
      return apiResponse({ results: manager.searchBlueprints(body.query) });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
