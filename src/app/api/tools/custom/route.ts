/**
 * Custom Tools API
 *
 * GET    /api/tools/custom — List custom tools
 * POST   /api/tools/custom — Create or test a tool
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getToolRegistry, getToolSandbox } from "@/lib/tools/custom-tool-sdk";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("agents:read", async (_req, { user }) => {
  const registry = getToolRegistry();
  const tools = registry.listByTenant(user.tenantId);
  const stats = registry.getStats(user.tenantId);
  return apiResponse({ tools, stats });
});

export const POST = withAuth("agents:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "test") {
      const { toolDef, sampleInput } = body;
      if (!toolDef || !sampleInput) return apiError("toolDef and sampleInput required");
      const sandbox = getToolSandbox();
      const result = await sandbox.testRun(toolDef, sampleInput);
      return apiResponse({ testResult: result });
    }

    if (action === "create") {
      const { name, description, inputSchema, outputSchema, code } = body;
      if (!name || !code) return apiError("name and code required");

      const sandbox = getToolSandbox();
      const toolDef = {
        id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name, description: description || "", inputSchema: inputSchema || {},
        outputSchema: outputSchema || {}, code, tenantId: user.tenantId,
        createdBy: user.email, version: 1, status: "draft" as const,
        executionCount: 0, avgLatencyMs: 0, successRate: 0,
        createdAt: Date.now(), updatedAt: Date.now(),
      };

      const validation = sandbox.validate(toolDef);
      if (!validation.valid) return apiError(`Validation failed: ${validation.errors.join("; ")}`);

      const registry = getToolRegistry();
      registry.register(toolDef);
      return apiResponse({ tool: toolDef, validation }, 201);
    }

    return apiError("Invalid action. Supported: create, test");
  } catch {
    return apiError("Invalid request body");
  }
});
