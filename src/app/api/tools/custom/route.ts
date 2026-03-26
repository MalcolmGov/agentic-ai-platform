/**
 * Custom Tools API
 *
 * GET    /api/tools/custom — List custom tools
 * POST   /api/tools/custom — Create or test a tool
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getToolRegistry, getToolSandbox } from "@/lib/tools/custom-tool-sdk";
import { CustomToolSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

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
    const parsed = CustomToolSchema.parse(body);

    if (parsed.action === "test") {
      const sandbox = getToolSandbox();
      const result = await sandbox.testRun(parsed.toolDef as Parameters<typeof sandbox.testRun>[0], parsed.sampleInput);
      return apiResponse({ testResult: result });
    }

    if (parsed.action === "create") {
      const sandbox = getToolSandbox();
      const toolDef = {
        id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: parsed.name, description: parsed.description || "",
        inputSchema: parsed.inputSchema || {}, outputSchema: parsed.outputSchema || {},
        code: parsed.code, tenantId: user.tenantId,
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

    return apiError("Invalid action", 400);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
