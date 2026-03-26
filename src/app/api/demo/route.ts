/**
 * Demo Mode API
 * 
 * GET /api/demo — Sets a demo session cookie and redirects to dashboard.
 * No login required. Creates a temporary demo tenant session.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const demoToken = Buffer.from(JSON.stringify({
    userId: "demo_user_001",
    tenantId: "tenant_demo_001",
    email: "demo@agentic-ai.com",
    role: "VIEWER",
    name: "Demo User",
    tenantName: "Agentic AI Demo",
    isDemo: true,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  })).toString("base64");

  const response = NextResponse.redirect(new URL("/dashboard", "http://localhost:3000"));

  // Set demo session cookie
  response.cookies.set("demo_session", "true", {
    httpOnly: false, // Client-side needs to read it for the banner
    sameSite: "lax",
    maxAge: 3600, // 1 hour
    path: "/",
  });

  // Set auth token using the demo payload (base64, not JWT — purely for middleware bypass)
  response.cookies.set("auth_token", `demo.${demoToken}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });

  return response;
}
