import { describe, it, expect, beforeEach } from "vitest";
import { WebhookEngine } from "@/lib/webhooks/webhook-engine";

describe("WebhookEngine", () => {
  let engine: WebhookEngine;

  beforeEach(() => {
    engine = new WebhookEngine();
  });

  describe("subscribe", () => {
    it("creates a webhook subscription with secret", () => {
      const sub = engine.subscribe({ tenantId: "t1", url: "https://example.com/hook", events: ["agent.created", "execution.completed"] });
      expect(sub.id).toMatch(/^wh_/);
      expect(sub.secret).toMatch(/^whsec_/);
      expect(sub.active).toBe(true);
      expect(sub.events.length).toBe(2);
    });
  });

  describe("unsubscribe", () => {
    it("deactivates a subscription", () => {
      const sub = engine.subscribe({ tenantId: "t1", url: "https://example.com/hook", events: ["agent.created"] });
      expect(engine.unsubscribe(sub.id)).toBe(true);
      expect(engine.getSubscription(sub.id)!.active).toBe(false);
    });
  });

  describe("dispatch", () => {
    it("creates deliveries for matching subscriptions", () => {
      engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      engine.subscribe({ tenantId: "t1", url: "https://b.com/hook", events: ["agent.created", "execution.completed"] });
      const deliveries = engine.dispatch("t1", "agent.created", { agentId: "a1" });
      expect(deliveries.length).toBe(2);
      expect(deliveries[0].status).toBe("pending");
    });

    it("only dispatches to matching events", () => {
      engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      const deliveries = engine.dispatch("t1", "execution.completed", { executionId: "e1" });
      expect(deliveries.length).toBe(0);
    });

    it("skips inactive subscriptions", () => {
      const sub = engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      engine.unsubscribe(sub.id);
      const deliveries = engine.dispatch("t1", "agent.created", {});
      expect(deliveries.length).toBe(0);
    });
  });

  describe("attemptDelivery", () => {
    it("marks delivery as delivered on success", () => {
      engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      const [delivery] = engine.dispatch("t1", "agent.created", {});
      const result = engine.attemptDelivery(delivery.id, true, 200, "OK");
      expect(result!.status).toBe("delivered");
      expect(result!.attempts).toBe(1);
    });

    it("retries on failure with exponential backoff", () => {
      engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      const [delivery] = engine.dispatch("t1", "agent.created", {});
      const result = engine.attemptDelivery(delivery.id, false, 500, "Server Error");
      expect(result!.status).toBe("retrying");
      expect(result!.nextRetryAt).toBeGreaterThan(Date.now());
    });

    it("marks as failed after max attempts", () => {
      engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      const [delivery] = engine.dispatch("t1", "agent.created", {});
      for (let i = 0; i < 5; i++) {
        engine.attemptDelivery(delivery.id, false, 500);
      }
      const logs = engine.getDeliveryLogs("t1");
      expect(logs[0].status).toBe("failed");
      expect(logs[0].attempts).toBe(5);
    });
  });

  describe("signing", () => {
    it("signs and verifies payloads", () => {
      const payload = { event: "agent.created", data: { id: "a1" } };
      const signature = engine.signPayload(payload, "my_secret");
      expect(engine.verifySignature(JSON.stringify(payload), signature, "my_secret")).toBe(true);
      expect(engine.verifySignature(JSON.stringify(payload), "wrong", "my_secret")).toBe(false);
    });
  });

  describe("replay", () => {
    it("replays a failed delivery", () => {
      engine.subscribe({ tenantId: "t1", url: "https://a.com/hook", events: ["agent.created"] });
      const [delivery] = engine.dispatch("t1", "agent.created", {});
      engine.attemptDelivery(delivery.id, false, 500);
      const replayed = engine.replay(delivery.id);
      expect(replayed).not.toBeNull();
      expect(replayed!.id).toContain("replay");
      expect(replayed!.status).toBe("pending");
    });
  });
});
