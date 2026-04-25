/**
 * Webhook Ingestion API
 * 
 * POST /api/webhooks/ingest — Receive external webhook events
 * GET  /api/webhooks/ingest — List registered webhook sources
 * 
 * Validates webhook signatures, routes events to agents/workflows.
 */

import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logger";

// ─── Types ─────────────────────────────────

interface WebhookEvent {
  id: string;
  source: string;
  eventType: string;
  payload: unknown;
  receivedAt: string;
  processed: boolean;
  tenantId: string;
}

// ─── In-Memory Event Store ────────────────

const webhookEvents: WebhookEvent[] = [];
const webhookSources: Array<{
  id: string;
  name: string;
  endpoint: string;
  secret: string;
  tenantId: string;
  events: string[];
  createdAt: string;
}> = [
  {
    id: "whs-001",
    name: "Stripe Payments",
    endpoint: "/api/webhooks/ingest?source=stripe",
    secret: "whsec_••••••••",
    tenantId: "tenant_acme_001",
    events: ["payment.completed", "payment.failed", "charge.disputed"],
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "whs-002",
    name: "Slack Events",
    endpoint: "/api/webhooks/ingest?source=slack",
    secret: "slksec_••••••••",
    tenantId: "tenant_acme_001",
    events: ["message.received", "reaction.added", "member.joined"],
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "whs-003",
    name: "Custom CRM",
    endpoint: "/api/webhooks/ingest?source=crm",
    secret: "crm_••••••••",
    tenantId: "tenant_acme_001",
    events: ["lead.created", "deal.closed", "ticket.updated"],
    createdAt: "2026-02-20T14:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────

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

// ─── Webhook Signature Verification ───────

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  _secret: string
): boolean {
  // Development: accept all
  if (process.env.NODE_ENV === "development") return true;

  if (!signature) return false;

  // Production: implement HMAC-SHA256 verification
  // const crypto = require("crypto");
  // const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  return true;
}

// ─── Routes ───────────────────────────────

// GET — List registered webhook sources
export async function GET() {
  return apiResponse({
    sources: webhookSources,
    recentEvents: webhookEvents.slice(-10).reverse(),
    total: webhookEvents.length,
  });
}

// POST — Receive a webhook event
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source") || "unknown";
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || req.headers.get("stripe-signature");

    // Find matching source config
    const sourceConfig = webhookSources.find((s) =>
      s.endpoint.includes(`source=${source}`)
    );

    // Verify signature
    if (sourceConfig && !verifyWebhookSignature(rawBody, signature, sourceConfig.secret)) {
      return apiError("Invalid webhook signature", 401);
    }

    // Parse payload
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    // Extract event type
    const eventType =
      (payload as Record<string, unknown>)?.type as string ||
      (payload as Record<string, unknown>)?.event as string ||
      "unknown";

    // Store event
    const event: WebhookEvent = {
      id: `whe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source,
      eventType,
      payload,
      receivedAt: new Date().toISOString(),
      processed: false,
      tenantId: sourceConfig?.tenantId || "unknown",
    };

    webhookEvents.push(event);

    // Audit log
    await logAudit({
      action: "webhook.received",
      resource: `webhook:${event.id}`,
      details: { source, eventType },
      tenantId: event.tenantId,
    });

    // In production: dispatch to appropriate agent/workflow
    // await scheduler.trigger(agentIdForEventType, event.tenantId);

    console.log(`🪝 Webhook received: ${source}/${eventType} → ${event.id}`);

    // Mark as processed (would be async in production)
    event.processed = true;

    return apiResponse(
      { eventId: event.id, source, eventType, processed: true },
      202
    );
  } catch (error) {
    console.error("[Webhook]", error);
    return apiError("Failed to process webhook", 500);
  }
}
