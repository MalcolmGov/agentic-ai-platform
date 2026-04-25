/**
 * Knowledge Graph API
 *
 * GET  /api/knowledge — Query knowledge graph
 * POST /api/knowledge — Add knowledge or ingest execution
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getKnowledgeGraph, getIngester } from "@/lib/knowledge/knowledge-graph";
import { KnowledgeIngestSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("analytics:read", async (req: NextRequest, { user }) => {
  const graph = getKnowledgeGraph();
  const query = req.nextUrl.searchParams.get("q");
  const nodeId = req.nextUrl.searchParams.get("nodeId");

  if (query) {
    const results = graph.search(query, user.tenantId);
    return apiResponse({ results, query });
  }

  if (nodeId) {
    const node = graph.getNode(nodeId);
    if (!node) return apiError("Node not found", 404);
    const subgraph = graph.findRelated(nodeId, 2, user.tenantId);
    return apiResponse({ node, subgraph });
  }

  const stats = graph.getStats(user.tenantId);
  const recentKnowledge = graph.getOrganizationKnowledge(user.tenantId).slice(0, 20);

  return apiResponse({ stats, recentKnowledge });
});

export const POST = withAuth("agents:execute", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = KnowledgeIngestSchema.parse(body);

    const ingester = getIngester();
    const nodes = ingester.ingestExecutionResult({
      agentId: parsed.agentId, agentName: parsed.agentName || parsed.agentId,
      agentType: parsed.agentType || "unknown",
      tenantId: user.tenantId,
      result: parsed.result as Record<string, unknown>,
      reasoning: parsed.reasoning as string | undefined,
    });

    return apiResponse({ ingestedNodes: nodes.length, nodes }, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
