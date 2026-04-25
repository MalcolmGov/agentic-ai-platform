import { NextRequest, NextResponse } from "next/server";
import { withAuthentication } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";
import { OnboardingStateSchema, type OnboardingStateV2 } from "@/lib/onboarding/wizard-schema";
import { Prisma } from "@prisma/client";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

export const GET = withAuthentication(async (_req, { user }) => {
  try {
    const row = await prisma.onboardingProgress.findUnique({
      where: { tenantId: user.tenantId },
    });
    if (!row) {
      return apiResponse({
        state: null,
        done: false,
        source: "database" as const,
      });
    }
    const raw = row.payload;
    if (!raw || typeof raw !== "object" || Object.keys(raw as object).length === 0) {
      return apiResponse({
        state: null,
        done: row.done,
        source: "database" as const,
        meta: { id: row.id, updatedAt: row.updatedAt.toISOString() },
      });
    }
    const parsed = OnboardingStateSchema.safeParse(raw);
    if (!parsed.success) {
      return apiResponse({
        state: null,
        done: row.done,
        source: "database" as const,
        parseWarning: "stored payload did not match current schema",
        meta: { id: row.id, updatedAt: row.updatedAt.toISOString() },
      });
    }
    return apiResponse({
      state: parsed.data,
      done: row.done,
      source: "database" as const,
      meta: { id: row.id, updatedAt: row.updatedAt.toISOString() },
    });
  } catch (e) {
    console.warn("[onboarding/progress GET]", e);
    return apiResponse(
      { state: null, done: false, source: "unavailable" as const },
      200
    );
  }
});

export const PUT = withAuthentication(async (req, { user }) => {
  try {
    const body = await req.json();
    const parsed = OnboardingStateSchema.parse(body);
    const done =
      parsed.completed === true || parsed.skipped === true;
    const stepStr = String(parsed.step);

    const row = await prisma.onboardingProgress.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        payload: parsed as unknown as Prisma.InputJsonValue,
        done,
        currentStep: stepStr,
        completedSteps: buildCompletedStepLabels(parsed),
      },
      update: {
        payload: parsed as unknown as Prisma.InputJsonValue,
        done,
        currentStep: stepStr,
        completedSteps: buildCompletedStepLabels(parsed),
        updatedAt: new Date(),
      },
    });
    return apiResponse({
      id: row.id,
      done: row.done,
      currentStep: row.currentStep,
      source: "database" as const,
    });
  } catch (e) {
    if (e instanceof ZodError) return validationError(e);
    console.error("[onboarding/progress PUT]", e);
    return apiError("Could not save onboarding progress", 503);
  }
});

const STEP_LABELS: Record<number, string> = {
  1: "welcome",
  2: "department",
  3: "markets",
  4: "compliance",
  5: "connect",
  6: "approvals",
  7: "app",
  8: "review",
  9: "deploy",
};

function buildCompletedStepLabels(state: OnboardingStateV2): string[] {
  const s = state.step;
  return Array.from({ length: Math.max(0, s - 1) }, (_, i) => STEP_LABELS[i + 1] ?? `step-${i + 1}`);
}
