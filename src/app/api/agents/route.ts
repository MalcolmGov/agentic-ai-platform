/**
 * Secured Agents API — Protected with RBAC
 * 
 * GET  /api/agents — List available agent types (requires agents:read)
 * POST /api/agents — Create a new agent (requires agents:create)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { auditFromRequest } from "@/lib/audit/logger";

const AGENT_TYPES = [
  { id: "FRAUD_MONITORING", name: "Fraud Monitoring Agent", description: "Monitors transactions, flags anomalies, generates risk scores", category: "Security" },
  { id: "COMPLIANCE", name: "Compliance Agent", description: "Automates KYC/AML checks, monitors regulatory changes", category: "Compliance" },
  { id: "REPORTING", name: "Reporting Agent", description: "Generates scheduled and ad-hoc business reports", category: "Analytics" },
  { id: "FINANCE", name: "Finance Agent", description: "Handles reconciliation, invoicing, and forecasting", category: "Finance" },
  { id: "CUSTOMER_SUPPORT", name: "Customer Support Agent", description: "Routes tickets, generates responses, escalates issues", category: "Support" },
  { id: "DATA_ANALYST", name: "Data Analyst Agent", description: "Analyzes datasets, detects patterns, generates insights", category: "Analytics" },
  { id: "WORKFLOW_AUTOMATION", name: "Workflow Automation Agent", description: "Orchestrates multi-step workflows", category: "Automation" },
  { id: "DOCUMENT_PROCESSING", name: "Document Processing Agent", description: "Extracts data from PDFs, invoices, contracts", category: "Processing" },
  { id: "EMAIL_COMMUNICATION", name: "Email / Communication Agent", description: "Processes inbound emails, generates responses", category: "Communication" },
  { id: "OPERATIONS", name: "Operations Agent", description: "Monitors system health, handles incident response", category: "Operations" },
];

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

// GET /api/agents — List agent types (requires agents:read)
export const GET = withAuth("agents:read", async (_req, { user }) => {
  // In production: filter by tenant
  // const agents = await prisma.agent.findMany({
  //   where: { tenantId: user.tenantId },
  // });

  return apiResponse({
    agentTypes: AGENT_TYPES,
    total: AGENT_TYPES.length,
    tenantId: user.tenantId,
  });
});

// POST /api/agents — Create a new agent (requires agents:create)
export const POST = withAuth("agents:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { name, type, llmProvider, llmModel, systemPrompt, schedule } = body;

    if (!name || !type) {
      return apiError("name and type are required", 400);
    }

    if (!AGENT_TYPES.find((a) => a.id === type)) {
      return apiError(`Invalid agent type: ${type}`, 400);
    }

    const agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      type,
      tenantId: user.tenantId,
      llmProvider: llmProvider || "openai",
      llmModel: llmModel || "gpt-4o",
      systemPrompt: systemPrompt || "",
      schedule: schedule || null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    // Audit log
    await auditFromRequest(req, user, "agent.create", `agent:${agent.id}`, {
      name, type, llmProvider: agent.llmProvider,
    });

    return apiResponse(agent, 201);
  } catch {
    return apiError("Invalid request body", 400);
  }
});
