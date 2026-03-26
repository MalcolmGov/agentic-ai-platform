import { describe, it, expect, beforeEach } from "vitest";
import { HealthEngine } from "@/lib/health/health-engine";

describe("HealthEngine", () => {
  let engine: HealthEngine;

  beforeEach(() => {
    engine = new HealthEngine();
  });

  describe("check", () => {
    it("returns healthy status with all services", () => {
      const check = engine.check();
      expect(check.status).toBe("healthy");
      expect(check.version).toBe("1.0.0");
      expect(check.uptime).toBeGreaterThanOrEqual(0);
      expect(check.services.length).toBeGreaterThan(5);
      expect(check.metrics).toBeDefined();
    });
  });

  describe("liveness", () => {
    it("returns alive status", () => {
      const { alive, uptime } = engine.liveness();
      expect(alive).toBe(true);
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("readiness", () => {
    it("returns ready when all services are up", () => {
      const ready = engine.readiness();
      expect(ready.ready).toBe(true);
      expect(ready.services.every((s) => s.ready)).toBe(true);
    });
  });

  describe("getStatusPage", () => {
    it("returns status page data with uptime history", () => {
      const status = engine.getStatusPage();
      expect(status.overall).toBe("operational");
      expect(status.uptimePercentage).toBeGreaterThan(99);
      expect(status.uptimeHistory.length).toBe(30);
    });
  });

  describe("incidents", () => {
    it("creates an incident and degrades service", () => {
      const incident = engine.createIncident({ title: "Database outage", severity: "critical", affectedServices: ["Database"], message: "Investigating database connectivity issues" });
      expect(incident.id).toMatch(/^inc_/);
      expect(incident.status).toBe("investigating");
      const check = engine.check();
      expect(check.status).toBe("unhealthy");
    });

    it("resolves an incident and restores service", () => {
      const incident = engine.createIncident({ title: "Cache slow", severity: "minor", affectedServices: ["Cache"], message: "Investigating" });
      engine.updateIncident(incident.id, "resolved", "Cache performance restored");
      const check = engine.check();
      expect(check.status).toBe("healthy");
    });

    it("includes active incidents on status page", () => {
      engine.createIncident({ title: "API Gateway issue", severity: "major", affectedServices: ["API Gateway"], message: "Elevated error rates" });
      const status = engine.getStatusPage();
      expect(status.overall).toBe("degraded");
      expect(status.incidents.length).toBe(1);
    });
  });

  describe("recordRequest", () => {
    it("tracks request metrics", () => {
      engine.recordRequest(50);
      engine.recordRequest(100, true);
      const metrics = engine.getCurrentMetrics();
      expect(metrics.requestsPerMinute).toBe(2);
      expect(metrics.errorRate).toBe(0.5);
    });
  });
});
