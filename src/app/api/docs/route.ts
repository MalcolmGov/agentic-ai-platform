/**
 * API Documentation — OpenAPI spec, code samples, endpoint catalog
 */

import { NextRequest, NextResponse } from "next/server";
import { getOpenApiEngine } from "@/lib/openapi/openapi-spec";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}
function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

// Public endpoint — no auth required
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "spec";
    const engine = getOpenApiEngine();

    if (view === "spec") {
      const baseUrl = url.searchParams.get("baseUrl") || undefined;
      return apiResponse({ spec: engine.getSpec(baseUrl) });
    }
    if (view === "endpoints") {
      return apiResponse({ endpoints: engine.listEndpoints() });
    }
    if (view === "code_samples") {
      const path = url.searchParams.get("path");
      const method = url.searchParams.get("method");
      if (!path || !method) return apiError("path and method required", 400);
      return apiResponse({ samples: engine.getCodeSamples(path, method) });
    }
    if (view === "tag") {
      const tag = url.searchParams.get("tag");
      if (!tag) return apiError("tag required", 400);
      return apiResponse({ endpoints: engine.getEndpointsByTag(tag) });
    }
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
}
