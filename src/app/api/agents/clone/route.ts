/**
 * Agent Cloning & Version API
 *
 * GET  /api/agents/clone — List versions for an agent
 * POST /api/agents/clone — Clone or fork an agent
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getCloneManager } from "@/lib/agents/agent-cloning";

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
    const { action, agentId, newName, modifications } = body;

    const manager = getCloneManager();

    if (action === "clone") {
      if (!agentId || !newName) return apiError("agentId and newName required");
      const result = manager.cloneAgent(agentId, newName, user.tenantId);
      return apiResponse({ clone: result }, 201);
    }

    if (action === "fork") {
      if (!agentId || !modifications) return apiError("agentId and modifications required");
      const result = manager.forkAgent(agentId, modifications, user.tenantId);
      return apiResponse({ fork: result }, 201);
    }

    if (action === "rollback") {
      const { versionId } = body;
      if (!agentId || !versionId) return apiError("agentId and versionId required");
      const version = manager.rollback(agentId, versionId);
      if (!version) return apiError("Version not found", 404);
      return apiResponse({ rolledBack: version });
    }

    return apiError("Invalid action. Supported: clone, fork, rollback");
  } catch {
    return apiError("Invalid request body");
  }
});
