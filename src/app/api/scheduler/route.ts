/**
 * Scheduler API — Manage agent schedules
 * 
 * GET  /api/scheduler — List scheduled jobs
 * POST /api/scheduler — Schedule an agent
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { scheduler } from "@/lib/scheduler/scheduler";
import { auditFromRequest } from "@/lib/audit/logger";
import { ScheduleAgentSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// GET — List scheduled jobs for tenant
export const GET = withAuth("agents:read", async (_req, { user }) => {
  const jobs = scheduler.listJobs(user.tenantId);
  return apiResponse({
    jobs,
    total: jobs.length,
    tenantId: user.tenantId,
  });
});

// POST — Schedule an agent
export const POST = withAuth("agents:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = ScheduleAgentSchema.parse(body);

    const validSchedules = [
      "manual", "realtime",
      "every_minute", "every_5_minutes", "every_15_minutes",
      "every_30_minutes", "every_hour", "every_6_hours",
      "every_12_hours", "daily", "weekly",
      "*/1 * * * *", "*/5 * * * *", "*/15 * * * *",
      "*/30 * * * *", "0 * * * *", "0 */6 * * *",
      "0 0 * * *", "0 0 * * 1",
    ];

    if (!validSchedules.includes(parsed.schedule)) {
      return apiError(`Invalid schedule. Valid values: ${validSchedules.join(", ")}`, 400);
    }

    const job = scheduler.schedule(parsed.agentId, user.tenantId, parsed.schedule, parsed.enabled !== false);

    await auditFromRequest(req, user, "scheduler.create", `job:${job.id}`, {
      agentId: parsed.agentId, schedule: parsed.schedule, enabled: job.enabled,
    });

    return apiResponse(job, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body", 400);
  }
});
