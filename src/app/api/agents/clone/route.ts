/**
 * Agent Cloning & Version API
 *
 * GET  /api/agents/clone — List versions for an agent
 * POST /api/agents/clone — Clone or fork an agent
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getCloneManager } from "@/lib/agents/agent-cloning";
import { AgentCloneSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async (req: NextRequest) => {
  const agentId = req.nextUrl.searchParams.get("agentId");
  const manager = getCloneManager();

  if (agentId) {
    const versions = manager.listVersions(agentId);
    const config = manager.getConfig(agentId);
    return apiResponse({ agentId, currentConfig: config, versions });
  }

  const agentIds = manager.getAgentIds();
  const agents = agentIds.map((id) => ({
    agentId: id,
    config: manager.getConfig(id),
    versionCount: manager.listVersions(id).length,
  }));

  return apiResponse({ agents });
});

export const POST = withAuth("agents:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = AgentCloneSchema.parse(body);

    const manager = getCloneManager();

    if (parsed.action === "clone") {
      const result = manager.cloneAgent(parsed.agentId, parsed.newName, user.tenantId);
      return apiResponse({ clone: result }, 201);
    }

    if (parsed.action === "fork") {
      const result = manager.forkAgent(parsed.agentId, parsed.modifications, user.tenantId);
      return apiResponse({ fork: result }, 201);
    }

    if (parsed.action === "rollback") {
      const version = manager.rollback(parsed.agentId, parsed.versionId);
      if (!version) return apiError("Version not found", 404);
      return apiResponse({ rolledBack: version });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
