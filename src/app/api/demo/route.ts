/**
 * Demo Mode API
 *
 * GET  /api/demo           — Initialize demo, seed engines, redirect to dashboard
 * POST /api/demo           — Initialize demo (JSON response, no redirect)
 * DELETE /api/demo         — Tear down demo session
 *
 * GET  /api/demo?view=status   — Check demo status
 * GET  /api/demo?view=tour     — Get guided product tour steps
 * GET  /api/demo?view=checklist — Get quick-start checklist
 */

import { NextRequest, NextResponse } from "next/server";
import { seedDemoEnvironment, getDemoEnvironment, isDemoInitialized } from "@/lib/demo/demo-seed";
import { getProductTour, getQuickStartChecklist } from "@/lib/demo/guided-tour";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function buildDemoToken() {
  return Buffer.from(JSON.stringify({
    userId: "demo_user_001",
    tenantId: "tenant_demo_001",
    email: "demo@swifter-ai.com",
    role: "ADMIN",
    name: "Demo User",
    tenantName: "AI Platform Demo",
    isDemo: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64");
}

function setDemoCookies(response: NextResponse) {
  response.cookies.set("demo_session", "true", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });
  response.cookies.set("auth_token", `demo.${buildDemoToken()}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");

  if (view === "status") {
    const env = getDemoEnvironment();
    return apiResponse({
      active: isDemoInitialized(),
      environment: env,
    });
  }

  if (view === "tour") {
    return apiResponse(getProductTour());
  }

  if (view === "checklist") {
    return apiResponse(getQuickStartChecklist());
  }

  // Default: seed and redirect
  seedDemoEnvironment();

  const response = NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  return setDemoCookies(response);
}

export async function POST() {
  const env = seedDemoEnvironment();

  const response = apiResponse({
    message: "Demo environment initialized",
    tenantId: env.tenantId,
    agents: env.agents,
    seededAt: env.seededAt,
    credentials: {
      email: "demo@swifter-ai.com",
      role: "ADMIN",
      note: "Demo session expires in 1 hour",
    },
    tour: getProductTour().length + " steps available at GET /api/demo?view=tour",
    checklist: getQuickStartChecklist().length + " items available at GET /api/demo?view=checklist",
  });

  return setDemoCookies(response);
}

export async function DELETE() {
  const response = apiResponse({ message: "Demo session ended" });

  response.cookies.set("demo_session", "", { maxAge: 0, path: "/" });
  response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });

  return response;
}
