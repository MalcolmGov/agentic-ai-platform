/**
 * Natural Language Pipeline API — Convert natural language descriptions to agent configs
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getNLPipeline } from "@/lib/nl-pipeline/nl-agent-pipeline";
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
    action: z.literal("generate"),
    description: z.string().min(10),
    name: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  }),
  z.object({
    action: z.literal("parse_intent"),
    description: z.string().min(10),
  }),
  z.object({
    action: z.literal("validate"),
    description: z.string().min(10),
  }),
]);

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const pipeline = getNLPipeline();

    if (body.action === "generate") {
      const result = pipeline.generateAgent({ description: body.description, name: body.name, priority: body.priority, tenantId });
      return apiResponse({ result }, 201);
    }
    if (body.action === "parse_intent") {
      const intent = pipeline.parseIntent(body.description);
      return apiResponse({ intent });
    }
    if (body.action === "validate") {
      const result = pipeline.generateAgent({ description: body.description, tenantId });
      return apiResponse({ success: result.success, warnings: result.warnings });
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
