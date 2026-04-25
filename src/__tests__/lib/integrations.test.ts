import { describe, it, expect, beforeEach } from "vitest";
import { IntegrationManager, INTEGRATION_CATALOG } from "@/lib/integrations/connector";

describe("IntegrationManager", () => {
  let mgr: IntegrationManager;

  beforeEach(() => {
    mgr = new IntegrationManager();
  });

  describe("connect", () => {
    it("connects an integration with valid credentials", () => {
      const conn = mgr.connect("t1", "slack", {
        workspace: "acme",
        channel: "#ops",
        bot_token: "xoxb-test",
      });

      expect(conn.id).toMatch(/^int_/);
      expect(conn.provider).toBe("slack");
      expect(conn.status).toBe("connected");
      expect(conn.tenantId).toBe("t1");
    });

    it("throws for missing required fields", () => {
      expect(() =>
        mgr.connect("t1", "slack", { workspace: "acme" })
      ).toThrow("Missing required fields: channel, bot_token");
    });

    it("throws for unknown provider", () => {
      expect(() =>
        mgr.connect("t1", "unknown" as never, {})
      ).toThrow("Unknown provider: unknown");
    });
  });

  describe("disconnect", () => {
    it("disconnects and wipes credentials", () => {
      const conn = mgr.connect("t1", "webhook", { url: "https://example.com" });
      const ok = mgr.disconnect(conn.id, "t1");
      expect(ok).toBe(true);

      const updated = mgr.getConnection(conn.id, "t1");
      expect(updated!.status).toBe("disconnected");
      expect(Object.keys(updated!.credentials)).toHaveLength(0);
    });

    it("returns false for wrong tenant", () => {
      const conn = mgr.connect("t1", "webhook", { url: "https://example.com" });
      expect(mgr.disconnect(conn.id, "t2")).toBe(false);
    });
  });

  describe("listConnections", () => {
    it("filters by tenant", () => {
      mgr.connect("t1", "webhook", { url: "https://a.com" });
      mgr.connect("t2", "webhook", { url: "https://b.com" });

      expect(mgr.listConnections("t1")).toHaveLength(1);
      expect(mgr.listConnections("t2")).toHaveLength(1);
    });
  });

  describe("updateConfig", () => {
    it("updates config for an integration", () => {
      const conn = mgr.connect("t1", "webhook", { url: "https://example.com" });
      const updated = mgr.updateConfig(conn.id, "t1", { retryCount: 3 });
      expect(updated!.config.retryCount).toBe(3);
    });

    it("returns null for wrong tenant", () => {
      const conn = mgr.connect("t1", "webhook", { url: "https://example.com" });
      expect(mgr.updateConfig(conn.id, "t2", {})).toBeNull();
    });
  });

  describe("healthCheck", () => {
    it("performs health check on connected integration", () => {
      const conn = mgr.connect("t1", "webhook", { url: "https://example.com" });
      const health = mgr.healthCheck(conn.id, "t1");
      expect(health).not.toBeNull();
      expect(health!.provider).toBe("webhook");
      expect(["healthy", "down"]).toContain(health!.status);
      expect(health!.latencyMs).toBeGreaterThan(0);
    });

    it("returns null for unknown integration", () => {
      expect(mgr.healthCheck("unknown", "t1")).toBeNull();
    });
  });

  describe("dispatchEvent", () => {
    it("dispatches to subscribed integrations", async () => {
      mgr.connect("t1", "webhook", { url: "https://example.com" }); // webhook subscribes to *
      const events = await mgr.dispatchEvent("t1", "agent.completed", { agentId: "a1" });
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].event).toBe("agent.completed");
      expect(events[0].status).toBe("delivered");
    });

    it("skips integrations not subscribed to event", async () => {
      mgr.connect("t1", "datadog", {
        api_key: "key",
        app_key: "app",
        site: "us1",
      }); // datadog has no webhookEvents
      const events = await mgr.dispatchEvent("t1", "agent.completed", {});
      expect(events).toHaveLength(0);
    });
  });

  describe("sendMessage", () => {
    it("sends a message via a connected integration", async () => {
      const conn = mgr.connect("t1", "slack", {
        workspace: "acme",
        channel: "#ops",
        bot_token: "xoxb-test",
      });
      const result = await mgr.sendMessage(conn.id, "t1", { text: "Hello!" });
      expect(result.sent).toBe(true);
      expect(result.messageId).toMatch(/^msg_/);
    });

    it("fails for disconnected integration", async () => {
      const conn = mgr.connect("t1", "webhook", { url: "https://example.com" });
      mgr.disconnect(conn.id, "t1");
      const result = await mgr.sendMessage(conn.id, "t1", { text: "Hello!" });
      expect(result.sent).toBe(false);
    });
  });

  describe("getCatalog", () => {
    it("returns full integration catalog", () => {
      const catalog = mgr.getCatalog();
      expect(catalog.length).toBe(INTEGRATION_CATALOG.length);
      expect(catalog.length).toBeGreaterThanOrEqual(10);
    });
  });
});
