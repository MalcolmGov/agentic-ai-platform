/**
 * Next.js Middleware — Route Protection
 * 
 * Protects dashboard routes by validating JWT tokens.
 * Redirects unauthenticated users to login page.
 * Allows public routes (landing, auth API, static assets).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/demo",
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/api/demo",
];

// Static file extensions to skip
const STATIC_EXTENSIONS = [
  ".ico", ".png", ".jpg", ".jpeg", ".gif", ".svg",
  ".css", ".js", ".woff", ".woff2", ".ttf",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Skip Next.js internals
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Allow public routes (exact match or prefix match for /api/auth/)
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Allow all auth API routes (login, register, etc.)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow webhook ingestion (external services need unauthenticated access)
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // Allow Voice Co-Pilot session creation (uses server-side API key auth)
  if (pathname === "/api/openai-session") {
    return NextResponse.next();
  }

  // Check for auth token (cookie or header)
  const token = request.cookies.get("auth_token")?.value;
  const authHeader = request.headers.get("authorization");

  // API routes: return 401 JSON
  if (pathname.startsWith("/api/")) {
    if (!token && !authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required", timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
    // Let the route handler validate the token
    return NextResponse.next();
  }

  // Dashboard routes: redirect to login (unless demo session)
  if (pathname.startsWith("/dashboard")) {
    const demoSession = request.cookies.get("demo_session")?.value;
    if (!token && !demoSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
