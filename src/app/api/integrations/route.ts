/**
 * Integrations API — Connect and manage third-party services
 *
 * GET  /api/integrations — List connections, catalog, webhook log
 * POST /api/integrations — Connect, disconnect, test, send message
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getIntegrationManager, IntegrationProvider } from "@/lib/integrations/connector";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

// GET — list connections, catalog, webhook log
export const GET = withAuth("integrations:read", async (req: NextRequest, { user }) => {
  const mgr = getIntegrationManager();
  const view = req.nextUrl.searchParams.get("view");

  if (view === "catalog") {
    return apiResponse({ catalog: mgr.getCatalog() });
  }

  if (view === "webhooks") {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
    return apiResponse({ webhookLog: mgr.getWebhookLog(user.tenantId, limit) });
  }

  const connections = mgr.listConnections(user.tenantId);
  // Mask credentials in response
  const safeConnections = connections.map((c) => ({
    ...c,
    credentials: Object.fromEntries(
      Object.entries(c.credentials).map(([k, v]) => [k, v ? `***${v.slice(-4)}` : ""])
    ),
  }));

  return apiResponse({ connections: safeConnections, catalog: mgr.getCatalog() });
});

// Schemas
const ConnectSchema = z.object({
  action: z.literal("connect"),
  provider: z.string().min(1),
  credentials: z.record(z.string(), z.string()),
  config: z.record(z.string(), z.unknown()).optional(),
});

const DisconnectSchema = z.object({
  action: z.literal("disconnect"),
  integrationId: z.string().min(1),
});

const HealthCheckSchema = z.object({
  action: z.literal("health_check"),
  integrationId: z.string().min(1),
});

const SendMessageSchema = z.object({
  action: z.literal("send_message"),
  integrationId: z.string().min(1),
  text: z.string().min(1),
  channel: z.string().optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
});

const DispatchEventSchema = z.object({
  action: z.literal("dispatch_event"),
  event: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

const UpdateConfigSchema = z.object({
  action: z.literal("update_config"),
  integrationId: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
});

const IntegrationActionSchema = z.discriminatedUnion("action", [
  ConnectSchema,
  DisconnectSchema,
  HealthCheckSchema,
  SendMessageSchema,
  DispatchEventSchema,
  UpdateConfigSchema,
]);

// POST — manage integrations
export const POST = withAuth("integrations:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = IntegrationActionSchema.parse(body);
    const mgr = getIntegrationManager();

    switch (parsed.action) {
      case "connect": {
        const connection = mgr.connect(
          user.tenantId,
          parsed.provider as IntegrationProvider,
          parsed.credentials,
          parsed.config || {}
        );
        return apiResponse({ connection: { ...connection, credentials: "***" } }, 201);
      }

      case "disconnect": {
        const ok = mgr.disconnect(parsed.integrationId, user.tenantId);
        if (!ok) return apiError("Integration not found", 404);
        return apiResponse({ disconnected: true, integrationId: parsed.integrationId });
      }

      case "health_check": {
        const health = mgr.healthCheck(parsed.integrationId, user.tenantId);
        if (!health) return apiError("Integration not found", 404);
        return apiResponse({ health });
      }

      case "send_message": {
        const result = await mgr.sendMessage(parsed.integrationId, user.tenantId, {
          text: parsed.text,
          channel: parsed.channel,
          severity: parsed.severity,
        });
        if (!result.sent) return apiError("Failed to send message", 500);
        return apiResponse({ message: result });
      }

      case "dispatch_event": {
        const events = await mgr.dispatchEvent(user.tenantId, parsed.event, parsed.payload);
        return apiResponse({ dispatched: events.length, events });
      }

      case "update_config": {
        const updated = mgr.updateConfig(parsed.integrationId, user.tenantId, parsed.config);
        if (!updated) return apiError("Integration not found", 404);
        return apiResponse({ integration: { ...updated, credentials: "***" } });
      }

      default:
        return apiError("Invalid action");
    }
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError((error as Error).message);
  }
});
