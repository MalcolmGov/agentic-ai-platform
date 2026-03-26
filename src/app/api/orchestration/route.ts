/**
 * Orchestration API — Multi-agent DAG workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getOrchestrationEngine } from "@/lib/orchestration/orchestration-engine";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}
function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

const nodeSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string(),
  dependsOn: z.array(z.string()).default([]),
  condition: z.object({
    sourceNodeId: z.string(),
    field: z.string(),
    operator: z.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "exists"]),
    value: z.unknown(),
  }).optional(),
  inputMapping: z.record(z.string()).optional(),
  timeoutMs: z.number().default(30000),
  retryPolicy: z.object({
    maxRetries: z.number().default(2),
    backoffMs: z.number().default(1000),
    backoffMultiplier: z.number().default(2),
  }).default({ maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 }),
});

const PostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    name: z.string(),
    description: z.string(),
    nodes: z.array(nodeSchema),
    globalTimeout: z.number().default(300000),
  }),
  z.object({
    action: z.literal("create_from_template"),
    templateId: z.string(),
    agentMapping: z.record(z.string()),
    name: z.string().optional(),
  }),
  z.object({
    action: z.literal("start"),
    workflowId: z.string(),
  }),
  z.object({
    action: z.literal("complete_node"),
    workflowId: z.string(),
    nodeId: z.string(),
    output: z.record(z.unknown()).default({}),
    tokensUsed: z.number().default(0),
    latencyMs: z.number().default(0),
    costUsd: z.number().default(0),
    error: z.string().optional(),
  }),
  z.object({
    action: z.literal("pause"),
    workflowId: z.string(),
  }),
  z.object({
    action: z.literal("cancel"),
    workflowId: z.string(),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "workflows";
    const engine = getOrchestrationEngine();

    if (view === "workflows") {
      return apiResponse({ workflows: engine.listWorkflows(tenantId) });
    }
    if (view === "workflow") {
      const id = url.searchParams.get("id");
      if (!id) return apiError("id required", 400);
      const wf = engine.getWorkflow(id);
      return wf ? apiResponse({ workflow: wf }) : apiError("Not found", 404);
    }
    if (view === "topology") {
      const id = url.searchParams.get("id");
      if (!id) return apiError("id required", 400);
      const topo = engine.getTopology(id);
      return topo ? apiResponse({ topology: topo }) : apiError("Not found", 404);
    }
    if (view === "templates") {
      return apiResponse({ templates: engine.getTemplates() });
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
    const engine = getOrchestrationEngine();

    if (body.action === "create") {
      const wf = engine.createWorkflow({ ...body, tenantId });
      return apiResponse({ workflow: wf }, 201);
    }
    if (body.action === "create_from_template") {
      const wf = engine.createFromTemplate(body.templateId, tenantId, body.agentMapping, body.name);
      return wf ? apiResponse({ workflow: wf }, 201) : apiError("Template not found", 404);
    }
    if (body.action === "start") {
      const wf = engine.startWorkflow(body.workflowId);
      return wf ? apiResponse({ workflow: wf }) : apiError("Cannot start workflow", 400);
    }
    if (body.action === "complete_node") {
      const wf = engine.completeNode(body.workflowId, body.nodeId, {
        output: body.output, tokensUsed: body.tokensUsed,
        latencyMs: body.latencyMs, costUsd: body.costUsd, error: body.error,
      });
      return wf ? apiResponse({ workflow: wf }) : apiError("Node not found or not running", 400);
    }
    if (body.action === "pause") {
      return engine.pauseWorkflow(body.workflowId) ? apiResponse({ paused: true }) : apiError("Cannot pause", 400);
    }
    if (body.action === "cancel") {
      return engine.cancelWorkflow(body.workflowId) ? apiResponse({ cancelled: true }) : apiError("Cannot cancel", 400);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
