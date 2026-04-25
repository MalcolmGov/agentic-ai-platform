/**
 * Auth API — Logout
 *
 * POST /api/auth/logout
 * Clears the auth_token cookie, ending the session.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out" },
    timestamp: new Date().toISOString(),
  });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
