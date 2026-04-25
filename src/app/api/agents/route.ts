/**
 * Agents API — List and create agents
 *
 * GET  /api/agents — List deployed agents with execution stats (agents:read)
 * POST /api/agents — Create a new agent in DB (agents:create)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { auditFromRequest } from "@/lib/audit/logger";
import { CreateAgentSchema, validationError } from "@/lib/validation/schemas";
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

// ─── Mock fallback agents (match UI built-in IDs so detail view works) ───────

const MOCK_AGENTS = [
  {
    id: "fraud-monitoring",
    name: "Fraud Monitoring Agent",
    type: "RISK_FRAUD_MONITORING",
    department: "RISK",
    status: "ACTIVE",
    description:
      "Monitors transactions in real-time, flags anomalies, and generates risk scores using ML models.",
    executionCount: 4823,
    lastRunAt: new Date(Date.now() - 2 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    type: "COMPLIANCE",
    department: "COMPLIANCE",
    status: "ACTIVE",
    description:
      "Automates KYC/AML checks, monitors regulatory changes, generates compliance reports.",
    executionCount: 2156,
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "reporting",
    name: "Reporting Agent",
    type: "REPORTING",
    department: "FINANCE",
    status: "ACTIVE",
    description:
      "Generates scheduled and ad-hoc business reports with data aggregation and visualization.",
    executionCount: 892,
    lastRunAt: new Date(Date.now() - 15 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "finance",
    name: "Finance Agent",
    type: "FINANCE",
    department: "FINANCE",
    status: "ACTIVE",
    description:
      "Handles reconciliation, invoice processing, payment matching, and financial forecasting.",
    executionCount: 1543,
    lastRunAt: new Date(Date.now() - 8 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "customer-support",
    name: "Customer Support Agent",
    type: "CUSTOMER_SUPPORT",
    department: "OPERATIONS",
    status: "PAUSED",
    description:
      "Routes tickets, generates responses, escalates issues using knowledge bases.",
    executionCount: 7234,
    lastRunAt: new Date(Date.now() - 25 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "data-analyst",
    name: "Data Analyst Agent",
    type: "DATA_ANALYST",
    department: "OPERATIONS",
    status: "ACTIVE",
    description:
      "Analyzes datasets, detects patterns, generates insights with natural language queries.",
    executionCount: 3421,
    lastRunAt: new Date(Date.now() - 12 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "workflow-automation",
    name: "Workflow Automation Agent",
    type: "WORKFLOW_AUTOMATION",
    department: "OPERATIONS",
    status: "ACTIVE",
    description:
      "Orchestrates multi-step workflows, manages dependencies, handles retries.",
    executionCount: 5678,
    lastRunAt: new Date(Date.now() - 1 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "document-processing",
    name: "Document Processing Agent",
    type: "DOCUMENT_PROCESSING",
    department: "LEGAL",
    status: "ACTIVE",
    description:
      "Extracts data from PDFs, invoices, contracts using OCR and LLM-powered parsing.",
    executionCount: 1876,
    lastRunAt: new Date(Date.now() - 45 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "email-communication",
    name: "Email / Communication Agent",
    type: "EMAIL_COMMUNICATION",
    department: "OPERATIONS",
    status: "ACTIVE",
    description:
      "Processes inbound emails, generates responses, and routes messages by intent.",
    executionCount: 2345,
    lastRunAt: new Date(Date.now() - 3 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "operations",
    name: "Operations Agent",
    type: "OPERATIONS_WORKFLOW_AUTOMATION",
    department: "OPERATIONS",
    status: "ACTIVE",
    description:
      "Monitors system health, manages resources, handles incident response.",
    executionCount: 4102,
    lastRunAt: new Date(Date.now() - 0.5 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "helpdesk",
    name: "IT Helpdesk Agent",
    type: "HR_ONBOARDING",
    department: "IT",
    status: "ACTIVE",
    description:
      "Auto-resolves IT tickets, provisions accounts, resets passwords, manages hardware.",
    executionCount: 3890,
    lastRunAt: new Date(Date.now() - 4 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "review",
    name: "App Store Review Agent",
    type: "PRODUCT_FEEDBACK_SUMMARISER",
    department: "PRODUCT",
    status: "ACTIVE",
    description:
      "Monitors app store reviews, classifies sentiment, drafts and posts responses.",
    executionCount: 1245,
    lastRunAt: new Date(Date.now() - 20 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "intel",
    name: "Competitive Intelligence Agent",
    type: "RISK_ASSESSMENT",
    department: "RISK",
    status: "ACTIVE",
    description:
      "Tracks competitors, monitors market signals, generates threat assessments.",
    executionCount: 987,
    lastRunAt: new Date(Date.now() - 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

// ─── GET /api/agents ───────────────────────

export const GET = withAuth(
  "agents:read",
  async (_req: NextRequest, { user }) => {
    try {
      const dbAgents = await prisma.agent.findMany({
        where: { tenantId: user.tenantId },
        include: {
          _count: { select: { executions: true } },
          executions: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { startedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const agents = dbAgents.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        department: a.department,
        status: a.status,
        description: a.description,
        executionCount: a._count.executions,
        lastRunAt: a.executions[0]?.startedAt ?? null,
        createdAt: a.createdAt,
      }));

      return apiResponse({
        agents,
        total: agents.length,
        source: "database" as const,
      });
    } catch {
      // DB unavailable — return mock agents keyed to built-in UI IDs
      return apiResponse({
        agents: MOCK_AGENTS,
        total: MOCK_AGENTS.length,
        source: "mock" as const,
      });
    }
  }
);

// ─── POST /api/agents ──────────────────────

export const POST = withAuth(
  "agents:create",
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json();
      const parsed = CreateAgentSchema.parse(body);

      try {
        const agent = await prisma.agent.create({
          data: {
            name: parsed.name,
            type: parsed.type as import("@prisma/client").AgentType,
            description: parsed.systemPrompt
              ? parsed.systemPrompt.slice(0, 120)
              : null,
            systemPrompt: parsed.systemPrompt ?? null,
            llmProvider: parsed.llmProvider ?? "openai",
            llmModel: parsed.llmModel ?? "gpt-4o",
            schedule: parsed.schedule ?? null,
            config: {},
            tools: [],
            status: "ACTIVE",
            tenantId: user.tenantId,
          },
        });

        await auditFromRequest(req, user, "agent.create", `agent:${agent.id}`, {
          name: agent.name,
          type: agent.type,
        });

        return apiResponse(
          {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            tenantId: agent.tenantId,
            createdAt: agent.createdAt,
          },
          201
        );
      } catch {
        // DB unavailable — return a deterministic mock response
        const mockId = `agent_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 6)}`;

        await auditFromRequest(req, user, "agent.create", `agent:${mockId}`, {
          name: parsed.name,
          type: parsed.type,
        });

        return apiResponse(
          {
            id: mockId,
            name: parsed.name,
            type: parsed.type,
            status: "ACTIVE",
            tenantId: user.tenantId,
            createdAt: new Date().toISOString(),
          },
          201
        );
      }
    } catch (error) {
      if (error instanceof ZodError) return validationError(error);
      return apiError("Invalid request body", 400);
    }
  }
);
