/**
 * Agent Checkpoint/Resume API
 *
 * GET  /api/agents/checkpoint — Get checkpoints, progress, active executions, DLQ
 * POST /api/agents/checkpoint — Create checkpoint, pause, resume, complete, fail, retry
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getCheckpointManager } from "@/lib/agents/checkpoint";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

// GET — query checkpoints, progress, active executions
export const GET = withAuth("agents:read", async (req: NextRequest, { user }) => {
  const mgr = getCheckpointManager();
  const view = req.nextUrl.searchParams.get("view");
  const executionId = req.nextUrl.searchParams.get("executionId");

  if (view === "active") {
    const active = mgr.listActiveExecutions(user.tenantId);
    return apiResponse({ activeExecutions: active, total: active.length });
  }

  if (view === "dlq") {
    const dlq = mgr.getDeadLetterQueue(user.tenantId);
    return apiResponse({ deadLetterQueue: dlq, total: dlq.length });
  }

  if (executionId) {
    const checkpoints = mgr.getCheckpoints(executionId);
    const progress = mgr.getProgress(executionId);
    const latest = mgr.getLatestCheckpoint(executionId);
    return apiResponse({ executionId, checkpoints, progress, latest });
  }

  // Default: list active + recent
  const active = mgr.listActiveExecutions(user.tenantId);
  const dlq = mgr.getDeadLetterQueue(user.tenantId);
  return apiResponse({ activeExecutions: active, deadLetterQueue: dlq });
});

// Schemas
const CreateCheckpointSchema = z.object({
  action: z.literal("checkpoint"),
  executionId: z.string().min(1),
  agentId: z.string().min(1),
  stepIndex: z.number().int().min(0),
  totalSteps: z.number().int().positive(),
  state: z.record(z.string(), z.unknown()),
  intermediateResults: z.array(z.unknown()).optional(),
  tokensUsed: z.number().optional(),
  costUsd: z.number().optional(),
  costLimitUsd: z.number().optional(),
});

const PauseSchema = z.object({
  action: z.literal("pause"),
  executionId: z.string().min(1),
});

const ResumeSchema = z.object({
  action: z.literal("resume"),
  checkpointId: z.string().min(1),
});

const CompleteSchema = z.object({
  action: z.literal("complete"),
  executionId: z.string().min(1),
  finalResult: z.unknown().optional(),
});

const FailSchema = z.object({
  action: z.literal("fail"),
  executionId: z.string().min(1),
  error: z.string().min(1),
  maxRetries: z.number().int().positive().optional(),
});

const RetryDlqSchema = z.object({
  action: z.literal("retry_dlq"),
  dlqId: z.string().min(1),
});

const CheckpointActionSchema = z.discriminatedUnion("action", [
  CreateCheckpointSchema,
  PauseSchema,
  ResumeSchema,
  CompleteSchema,
  FailSchema,
  RetryDlqSchema,
]);

// POST — manage checkpoints
export const POST = withAuth("agents:execute", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = CheckpointActionSchema.parse(body);
    const mgr = getCheckpointManager();

    switch (parsed.action) {
      case "checkpoint": {
        const cp = mgr.createCheckpoint({
          executionId: parsed.executionId,
          agentId: parsed.agentId,
          tenantId: user.tenantId,
          stepIndex: parsed.stepIndex,
          totalSteps: parsed.totalSteps,
          state: parsed.state,
          intermediateResults: parsed.intermediateResults,
          tokensUsed: parsed.tokensUsed,
          costUsd: parsed.costUsd,
          costLimitUsd: parsed.costLimitUsd,
        });
        return apiResponse({ checkpoint: cp }, 201);
      }

      case "pause": {
        const cp = mgr.pauseExecution(parsed.executionId);
        if (!cp) return apiError("Execution not found", 404);
        return apiResponse({ checkpoint: cp });
      }

      case "resume": {
        const cp = mgr.resumeFromCheckpoint(parsed.checkpointId);
        if (!cp) return apiError("Checkpoint not found or not in resumable state", 404);
        return apiResponse({ checkpoint: cp });
      }

      case "complete": {
        const cp = mgr.completeExecution(parsed.executionId, parsed.finalResult);
        if (!cp) return apiError("Execution not found", 404);
        return apiResponse({ checkpoint: cp });
      }

      case "fail": {
        const cp = mgr.failExecution(parsed.executionId, parsed.error, parsed.maxRetries);
        if (!cp) return apiError("Execution not found", 404);
        return apiResponse({ checkpoint: cp });
      }

      case "retry_dlq": {
        const result = mgr.retryDeadLetter(parsed.dlqId);
        if (!result.checkpoint) return apiError("Dead letter entry not found or max retries exceeded", 404);
        return apiResponse({ retried: true, checkpoint: result.checkpoint });
      }

      default:
        return apiError("Invalid action");
    }
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError((error as Error).message);
  }
});
