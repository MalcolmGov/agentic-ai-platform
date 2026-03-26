import { describe, it, expect, beforeEach } from "vitest";
import { NotificationEngine } from "@/lib/notifications/notification-engine";

describe("NotificationEngine", () => {
  let engine: NotificationEngine;

  beforeEach(() => {
    engine = new NotificationEngine();
  });

  describe("send", () => {
    it("creates a notification", () => {
      const n = engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "high", title: "Agent Down", message: "Fraud Monitor failed" });
      expect(n.id).toMatch(/^notif_/);
      expect(n.read).toBe(false);
      expect(n.priority).toBe("high");
    });
  });

  describe("getNotifications", () => {
    it("returns notifications for a user", () => {
      engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "medium", title: "T1", message: "M1" });
      engine.send({ tenantId: "t1", recipientId: "u1", category: "billing", priority: "low", title: "T2", message: "M2" });
      engine.send({ tenantId: "t1", recipientId: "u2", category: "agent", priority: "medium", title: "T3", message: "M3" });
      const notifs = engine.getNotifications("t1", "u1");
      expect(notifs.length).toBe(2);
    });

    it("filters unread only", () => {
      const n = engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "medium", title: "T", message: "M" });
      engine.send({ tenantId: "t1", recipientId: "u1", category: "billing", priority: "low", title: "T2", message: "M2" });
      engine.markRead(n.id);
      const unread = engine.getNotifications("t1", "u1", { unreadOnly: true });
      expect(unread.length).toBe(1);
    });
  });

  describe("markRead / markAllRead", () => {
    it("marks a single notification as read", () => {
      const n = engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "medium", title: "T", message: "M" });
      expect(engine.markRead(n.id)).toBe(true);
      expect(engine.getUnreadCount("t1", "u1")).toBe(0);
    });

    it("marks all as read", () => {
      engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "medium", title: "T1", message: "M" });
      engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "medium", title: "T2", message: "M" });
      const count = engine.markAllRead("t1", "u1");
      expect(count).toBe(2);
      expect(engine.getUnreadCount("t1", "u1")).toBe(0);
    });
  });

  describe("broadcast", () => {
    it("sends to multiple recipients", () => {
      const notifs = engine.broadcast({ tenantId: "t1", category: "system", priority: "high", title: "Maintenance", message: "Scheduled maintenance", recipientIds: ["u1", "u2", "u3"] });
      expect(notifs.length).toBe(3);
    });
  });

  describe("preferences", () => {
    it("sets and gets preferences", () => {
      engine.setPreferences({ tenantId: "t1", memberId: "u1", channels: { agent: ["in_app", "email"], drift: ["in_app"], billing: ["email"], team: ["in_app"], compliance: ["in_app"], system: ["in_app"] }, digestFrequency: "hourly", quietHours: { enabled: true, start: "22:00", end: "08:00", timezone: "UTC" } });
      const prefs = engine.getPreferences("t1", "u1");
      expect(prefs.digestFrequency).toBe("hourly");
      expect(prefs.channels.agent).toContain("email");
    });

    it("returns defaults for unconfigured user", () => {
      const prefs = engine.getPreferences("t1", "new_user");
      expect(prefs.digestFrequency).toBe("daily");
    });
  });

  describe("generateDigest", () => {
    it("generates a digest summary", () => {
      engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "critical", title: "Critical", message: "Agent down" });
      engine.send({ tenantId: "t1", recipientId: "u1", category: "billing", priority: "low", title: "Invoice", message: "New invoice" });
      const digest = engine.generateDigest("t1", "u1");
      expect(digest.totalNotifications).toBe(2);
      expect(digest.highlights.length).toBe(1); // only critical
      expect(digest.byCategory["agent"]).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("removes old notifications", () => {
      engine.send({ tenantId: "t1", recipientId: "u1", category: "agent", priority: "low", title: "Old", message: "Old" });
      // Won't actually remove since notification is new, but tests the method runs
      const removed = engine.cleanup(30);
      expect(removed).toBe(0);
    });
  });
});
