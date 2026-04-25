/**
 * Agent Deploy API
 *
 * POST /api/agents/deploy — Deploy an agent from a template
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/logger";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";
import { checkPlanLimit } from "@/lib/billing/stripe";
import { sendAgentDeployedEmail } from "@/lib/email/sender";

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

const DeploySchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(120),
  department: z.string().optional().default("GENERAL"),
  markets: z.array(z.string()).optional().default([]),
  apps: z.array(z.string()).optional().default([]),
  config: z.record(z.unknown()).optional().default({}),
});

export const POST = withAuth(
  "agents:create",
  async (req: NextRequest, { user }) => {
    try {
      const body = DeploySchema.parse(await req.json());
      const { templateId, name, department, markets, apps, config } = body;

      const tenantId = user.tenantId;
      const deployedBy = user.userId;

      // ── Billing enforcement ───────────────────────────────────────────────
      try {
        const limitCheck = await checkPlanLimit(tenantId, 'agents')
        if (!limitCheck.allowed) {
          return NextResponse.json({
            success: false,
            error: `Agent limit reached (${limitCheck.current}/${limitCheck.max}). Upgrade your plan to deploy more agents.`,
            upgradeUrl: '/dashboard/settings/billing',
          }, { status: 402 })
        }
      } catch {
        // Never block deployments if billing check fails
      }

      // Generate a deployment instance ID
      const instanceId = `inst_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const deployment = {
        instanceId,
        templateId,
        name,
        department,
        markets,
        apps,
        config,
        status: "ACTIVE" as const,
        deployedBy,
        tenantId,
        deployedAt: new Date().toISOString(),
      };

      // Audit the deployment
      await logAudit({
        action: "AGENT_DEPLOYED",
        resource: `agent:${instanceId}`,
        details: { templateId, name, markets, apps, department },
        userId: deployedBy,
        tenantId,
      });

      // ── Fire-and-forget email notification ───────────────────────────────
      sendAgentDeployedEmail(
        user.email,
        name,
        markets.length > 0 ? markets.join(", ") : "Platform",
        "Platform"
      ).catch(console.error);

      return apiResponse({ deployment }, 201);
    } catch (err) {
      if (err instanceof ZodError) return validationError(err);
      return apiError(
        err instanceof Error ? err.message : "Deployment failed",
        500
      );
    }
  }
);
