/**
 * Health Check Endpoint
 * 
 * GET /api/health — Public health check for monitoring
 */

import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      api: "operational",
      database: "pending_connection", // Updated when Prisma is connected
      agentEngine: "operational",
      auditLogger: "operational",
    },
  };

  return NextResponse.json(health, { status: 200 });
}
