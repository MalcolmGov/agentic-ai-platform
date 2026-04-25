/**
 * Next.js Edge Middleware — Route Protection
 *
 * Runs before every request (except static assets).
 * - Dashboard routes: redirect to /login if unauthenticated
 * - Protected API routes: return 401 JSON if unauthenticated
 * - Public routes and /api/auth/* are always allowed
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/blog",
  "/docs",
  "/contact",
  "/changelog",
  "/demo",
  "/pricing",
];

// Routes that require auth but have their own layouts (not dashboard)
const PROTECTED_NON_DASHBOARD = ["/super-admin", "/reseller", "/onboarding"];

const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/health",
  "/api/demo",
  "/api/docs",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static files and Next.js internals — always pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public page paths
  if (
    PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
  ) {
    return NextResponse.next();
  }

  // Public API prefixes
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ||
        "local-dev-super-secret-jwt-key-minimum-64-chars-for-swifter-ai-platform-2026"
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
