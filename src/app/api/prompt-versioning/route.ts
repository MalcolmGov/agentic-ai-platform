/**
 * Prompt Versioning API — Version control for system prompts
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getPromptVersioningEngine } from "@/lib/prompt-versioning/prompt-versioning-engine";
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
    action: z.literal("commit"),
    agentId: z.string(),
    content: z.string(),
    message: z.string(),
    author: z.string(),
    metadata: z.record(z.unknown()).default({}),
  }),
  z.object({
    action: z.literal("rollback"),
    agentId: z.string(),
    targetVersion: z.number(),
    author: z.string(),
  }),
  z.object({
    action: z.literal("tag"),
    agentId: z.string(),
    version: z.number(),
    tagName: z.string(),
  }),
  z.object({
    action: z.literal("create_branch"),
    agentId: z.string(),
    branchName: z.string(),
  }),
  z.object({
    action: z.literal("switch_branch"),
    agentId: z.string(),
    branchName: z.string(),
  }),
  z.object({
    action: z.literal("compare"),
    agentId: z.string(),
    versionA: z.number(),
    versionB: z.number(),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "agents";
    const engine = getPromptVersioningEngine();

    if (view === "agents") {
      return apiResponse({ agents: engine.listAgents(tenantId) });
    }
    if (view === "history") {
      const agentId = url.searchParams.get("agentId");
      if (!agentId) return apiError("agentId required", 400);
      const history = engine.getHistory(agentId);
      return history ? apiResponse({ history }) : apiError("No history found", 404);
    }
    if (view === "current") {
      const agentId = url.searchParams.get("agentId");
      if (!agentId) return apiError("agentId required", 400);
      const current = engine.getCurrentPrompt(agentId);
      return current ? apiResponse({ version: current }) : apiError("No prompt found", 404);
    }
    if (view === "version") {
      const agentId = url.searchParams.get("agentId");
      const version = url.searchParams.get("version");
      if (!agentId || !version) return apiError("agentId and version required", 400);
      const v = engine.getVersion(agentId, parseInt(version, 10));
      return v ? apiResponse({ version: v }) : apiError("Version not found", 404);
    }
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getPromptVersioningEngine();

    if (body.action === "commit") {
      const version = engine.commit({ ...body, tenantId });
      return apiResponse({ version }, 201);
    }
    if (body.action === "rollback") {
      const result = engine.rollback(body.agentId, body.targetVersion, body.author);
      return result ? apiResponse({ rollback: result }) : apiError("Cannot rollback", 400);
    }
    if (body.action === "tag") {
      const ok = engine.tag(body.agentId, body.version, body.tagName);
      return ok ? apiResponse({ tagged: true }) : apiError("Version not found", 404);
    }
    if (body.action === "create_branch") {
      const branch = engine.createBranch(body.agentId, body.branchName);
      return branch ? apiResponse({ branch }, 201) : apiError("Branch exists or no versions", 400);
    }
    if (body.action === "switch_branch") {
      const ok = engine.switchBranch(body.agentId, body.branchName);
      return ok ? apiResponse({ switched: true }) : apiError("Branch not found", 404);
    }
    if (body.action === "compare") {
      const result = engine.compare(body.agentId, body.versionA, body.versionB);
      return result ? apiResponse({ comparison: result }) : apiError("Versions not found", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
