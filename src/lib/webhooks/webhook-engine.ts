/**
 * Webhook System
 *
 * Inbound/outbound webhooks with HMAC signing, retry logic,
 * delivery logs, and subscription management.
 */

import { createHmac } from "crypto";

// ─── Types ─────────────────────────────────

export type WebhookEvent =
  | "agent.created" | "agent.updated" | "agent.deleted"
  | "execution.started" | "execution.completed" | "execution.failed"
  | "drift.detected" | "drift.critical"
  | "workflow.started" | "workflow.completed" | "workflow.failed"
  | "billing.invoice" | "billing.payment_failed"
  | "compliance.report_generated" | "compliance.violation";

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  description: string;
  headers: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed" | "retrying";
  statusCode: number | null;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: number | null;
  nextRetryAt: number | null;
  responseBody: string | null;
  createdAt: number;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ─── Engine ────────────────────────────────

export class WebhookEngine {
  private subscriptions = new Map<string, WebhookSubscription>();
  private deliveries: WebhookDelivery[] = [];

  /**
   * Subscribe to webhook events
   */
  subscribe(params: {
    tenantId: string;
    url: string;
    events: WebhookEvent[];
    description?: string;
    headers?: Record<string, string>;
  }): WebhookSubscription {
    const secret = `whsec_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const sub: WebhookSubscription = {
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId: params.tenantId,
      url: params.url,
      events: params.events,
      secret,
      active: true,
      description: params.description || "",
      headers: params.headers || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.subscriptions.set(sub.id, sub);
    return sub;
  }

  /**
   * Unsubscribe (deactivate)
   */
  unsubscribe(subscriptionId: string): boolean {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return false;
    sub.active = false;
    sub.updatedAt = Date.now();
    return true;
  }

  /**
   * Dispatch an event to all matching subscriptions
   */
  dispatch(tenantId: string, event: WebhookEvent, data: Record<string, unknown>): WebhookDelivery[] {
    const matching = Array.from(this.subscriptions.values()).filter(
      (s) => s.tenantId === tenantId && s.active && s.events.includes(event)
    );

    const deliveries: WebhookDelivery[] = [];
    for (const sub of matching) {
      const payload: WebhookPayload = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        event,
        tenantId,
        timestamp: new Date().toISOString(),
        data,
      };

      const delivery: WebhookDelivery = {
        id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        subscriptionId: sub.id,
        event,
        payload,
        status: "pending",
        statusCode: null,
        attempts: 0,
        maxAttempts: 5,
        lastAttemptAt: null,
        nextRetryAt: null,
        responseBody: null,
        createdAt: Date.now(),
      };

      this.deliveries.push(delivery);
      deliveries.push(delivery);
    }
    return deliveries;
  }

  /**
   * Simulate delivery attempt (in production, this would make HTTP calls)
   */
  attemptDelivery(deliveryId: string, success: boolean, statusCode = 200, responseBody = ""): WebhookDelivery | null {
    const delivery = this.deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return null;

    delivery.attempts++;
    delivery.lastAttemptAt = Date.now();

    if (success) {
      delivery.status = "delivered";
      delivery.statusCode = statusCode;
      delivery.responseBody = responseBody;
    } else {
      if (delivery.attempts >= delivery.maxAttempts) {
        delivery.status = "failed";
      } else {
        delivery.status = "retrying";
        // Exponential backoff: 30s, 60s, 120s, 240s
        delivery.nextRetryAt = Date.now() + 30000 * Math.pow(2, delivery.attempts - 1);
      }
      delivery.statusCode = statusCode;
      delivery.responseBody = responseBody;
    }
    return delivery;
  }

  /**
   * Sign a payload with HMAC-SHA256
   */
  signPayload(payload: Record<string, unknown>, secret: string): string {
    const body = JSON.stringify(payload);
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  /**
   * Verify a webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    return expected === signature;
  }

  /**
   * Get subscriptions for a tenant
   */
  getSubscriptions(tenantId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.tenantId === tenantId);
  }

  /**
   * Get delivery logs
   */
  getDeliveryLogs(tenantId: string, limit = 50): WebhookDelivery[] {
    const tenantSubs = new Set(
      Array.from(this.subscriptions.values()).filter((s) => s.tenantId === tenantId).map((s) => s.id)
    );
    return this.deliveries
      .filter((d) => tenantSubs.has(d.subscriptionId))
      .slice(-limit)
      .reverse();
  }

  /**
   * Replay a failed delivery
   */
  replay(deliveryId: string): WebhookDelivery | null {
    const original = this.deliveries.find((d) => d.id === deliveryId);
    if (!original) return null;

    const replay: WebhookDelivery = {
      ...original,
      id: `del_replay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: "pending",
      statusCode: null,
      attempts: 0,
      lastAttemptAt: null,
      nextRetryAt: null,
      responseBody: null,
      createdAt: Date.now(),
    };
    this.deliveries.push(replay);
    return replay;
  }

  /**
   * Get a subscription by ID
   */
  getSubscription(subscriptionId: string): WebhookSubscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }
}

// ─── Singleton ─────────────────────────────

let engine: WebhookEngine | null = null;
export function getWebhookEngine(): WebhookEngine {
  if (!engine) engine = new WebhookEngine();
  return engine;
}
