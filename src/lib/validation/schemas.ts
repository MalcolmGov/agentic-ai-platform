/**
 * Zod Validation Schemas
 *
 * Shared request validation for all API routes.
 * Aligned with Prisma schema enums and field types.
 */

import { z } from "zod";
import { NextResponse } from "next/server";

// ═══ Helpers ═══

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join("."),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

// ═══ Enums (from Prisma schema) ═══

export const AgentTypeEnum = z.enum([
  "FRAUD_MONITORING",
  "COMPLIANCE",
  "REPORTING",
  "FINANCE",
  "CUSTOMER_SUPPORT",
  "DATA_ANALYST",
  "WORKFLOW_AUTOMATION",
  "DOCUMENT_PROCESSING",
  "EMAIL_COMMUNICATION",
  "OPERATIONS",
]);

export const TriggerTypeEnum = z.enum([
  "MANUAL",
  "SCHEDULED",
  "WEBHOOK",
  "EVENT",
  "REALTIME",
]);

export const StepTypeEnum = z.enum([
  "TRIGGER",
  "AGENT",
  "CONDITION",
  "ACTION",
  "INTEGRATION",
  "NOTIFICATION",
]);

// ═══ Auth Schemas ═══

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  organizationName: z.string().min(1, "Organization name is required"),
  industry: z.string().optional(),
});

// ═══ Agent Schemas ═══

export const CreateAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: AgentTypeEnum,
  description: z.string().optional(),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
  systemPrompt: z.string().optional(),
  schedule: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const ExecuteAgentSchema = z.object({
  agentId: z.string().min(1, "agentId is required"),
  agentType: z.string().min(1, "agentType is required"),
  input: z.unknown().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
});

export const StreamAgentSchema = z.object({
  agentId: z.string().min(1, "agentId is required"),
  agentType: z.string().min(1, "agentType is required"),
  input: z.unknown().optional(),
});

// ═══ Agent Clone Schemas ═══

const CloneActionSchema = z.object({
  action: z.literal("clone"),
  agentId: z.string().min(1, "agentId is required"),
  newName: z.string().min(1, "newName is required"),
});

const ForkActionSchema = z.object({
  action: z.literal("fork"),
  agentId: z.string().min(1, "agentId is required"),
  modifications: z.record(z.string(), z.unknown()).check(
    z.refine((v) => Object.keys(v).length > 0, "modifications must not be empty")
  ),
});

const RollbackActionSchema = z.object({
  action: z.literal("rollback"),
  agentId: z.string().min(1, "agentId is required"),
  versionId: z.string().min(1, "versionId is required"),
});

export const AgentCloneSchema = z.discriminatedUnion("action", [
  CloneActionSchema,
  ForkActionSchema,
  RollbackActionSchema,
]);

// ═══ Agent Improve Schemas ═══

export const AgentImproveSchema = z.object({
  action: z.literal("ab_test"),
  name: z.string().min(1, "name is required"),
  agentIdA: z.string().min(1, "agentIdA is required"),
  agentIdB: z.string().min(1, "agentIdB is required"),
  totalRuns: z.number().int().positive().optional(),
});

// ═══ Agent Routing Schema ═══

export const AgentRoutingSchema = z.object({
  route: z.object({
    taskType: z.string().min(1, "taskType is required"),
    model: z.string().min(1, "model is required"),
    provider: z.string().min(1, "provider is required"),
    costPer1kTokens: z.number().optional(),
    maxTokens: z.number().int().positive().optional(),
    priority: z.number().optional(),
  }),
});

// ═══ Workflow Schemas ═══

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  triggerType: TriggerTypeEnum.optional(),
  steps: z.array(z.object({
    name: z.string().min(1),
    type: StepTypeEnum.optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    agentId: z.string().optional(),
  })).optional(),
});

export const WorkflowReplaySchema = z.object({
  executionId: z.string().min(1, "executionId is required"),
  fromStepIndex: z.number().int().min(0, "fromStepIndex must be >= 0"),
  modifiedInput: z.record(z.string(), z.unknown()).check(
    z.refine((v) => Object.keys(v).length > 0, "modifiedInput must not be empty")
  ),
});

// ═══ Approval Schema ═══

export const ApprovalResponseSchema = z.object({
  gateId: z.string().min(1, "gateId is required"),
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().optional(),
});

// ═══ Collaboration Schemas ═══

const PresenceActionSchema = z.object({
  action: z.literal("presence"),
  page: z.string().min(1, "page is required"),
});

const AnnotateActionSchema = z.object({
  action: z.literal("annotate"),
  executionId: z.string().min(1, "executionId is required"),
  stepIndex: z.number().int().min(0, "stepIndex must be >= 0"),
  comment: z.string().min(1, "comment is required"),
});

export const CollaborationSchema = z.discriminatedUnion("action", [
  PresenceActionSchema,
  AnnotateActionSchema,
]);

// ═══ Insights Schema ═══

export const WhatIfScenarioSchema = z.object({
  scenario: z.object({
    name: z.string().min(1, "scenario name is required"),
    modifications: z.record(z.string(), z.number()).check(
      z.refine((v) => Object.keys(v).length > 0, "modifications must not be empty")
    ),
  }),
});

// ═══ Knowledge Schema ═══

export const KnowledgeIngestSchema = z.object({
  action: z.literal("ingest"),
  agentId: z.string().min(1, "agentId is required"),
  agentName: z.string().optional(),
  agentType: z.string().optional(),
  result: z.unknown(),
  reasoning: z.unknown().optional(),
});

// ═══ Custom Tool Schemas ═══

const CreateToolActionSchema = z.object({
  action: z.literal("create"),
  name: z.string().min(2, "Tool name must be at least 2 characters").regex(/^[a-z][a-z0-9_]*$/, "Tool name must be lowercase with underscores only"),
  description: z.string().optional(),
  inputSchema: z.record(z.string(), z.unknown()).optional(),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
  code: z.string().min(1, "code is required"),
});

const TestToolActionSchema = z.object({
  action: z.literal("test"),
  toolDef: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional().default(""),
    inputSchema: z.record(z.string(), z.unknown()).optional().default({}),
    outputSchema: z.record(z.string(), z.unknown()).optional().default({}),
    code: z.string().min(1),
    tenantId: z.string().optional().default(""),
    createdBy: z.string().optional().default(""),
    version: z.number().optional().default(1),
    status: z.enum(["active", "draft", "deprecated"]).optional().default("draft"),
    executionCount: z.number().optional().default(0),
    avgLatencyMs: z.number().optional().default(0),
    successRate: z.number().optional().default(0),
    createdAt: z.number().optional().default(0),
    updatedAt: z.number().optional().default(0),
  }),
  sampleInput: z.record(z.string(), z.unknown()),
});

export const CustomToolSchema = z.discriminatedUnion("action", [
  CreateToolActionSchema,
  TestToolActionSchema,
]);

// ═══ Voice Command Schema ═══

export const VoiceCommandSchema = z.object({
  transcript: z.string().min(1, "transcript is required"),
});

// ═══ Scheduler Schema ═══

export const ScheduleAgentSchema = z.object({
  agentId: z.string().min(1, "agentId is required"),
  schedule: z.string().min(1, "schedule is required"),
  enabled: z.boolean().optional(),
});

// ═══ API Keys Schemas ═══

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, "name is required"),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
  expiresInDays: z.number().int().positive().optional(),
});

export const RevokeApiKeySchema = z.object({
  keyId: z.string().min(1, "keyId is required"),
});
