import { describe, it, expect, beforeEach } from "vitest";
import { DashboardEngine, AgentPerformanceSummary } from "@/lib/dashboard/dashboard-engine";

function makeAgent(overrides: Partial<AgentPerformanceSummary> = {}): AgentPerformanceSummary {
  return {
    agentId: "a1", agentName: "Fraud Monitor", agentType: "FRAUD_MONITORING",
    executions: 1000, successRate: 0.97, avgLatencyMs: 300,
    costUsd: 25, savingsUsd: 5000, roi: 19900,
    trend: "stable", healthStatus: "healthy", ...overrides,
  };
}

describe("DashboardEngine", () => {
  let engine: DashboardEngine;

  beforeEach(() => {
    engine = new DashboardEngine();
  });

  describe("getOverview", () => {
    it("returns empty dashboard for new tenant", () => {
      const overview = engine.getOverview("t1");
      expect(overview.kpis.totalAgents).toBe(0);
      expect(overview.executiveSummary).toContain("No agents");
    });

    it("returns populated dashboard with metrics", () => {
      engine.recordAgentMetrics("t1", makeAgent());
      engine.recordAgentMetrics("t1", makeAgent({ agentId: "a2", agentName: "Compliance", agentType: "COMPLIANCE", executions: 500, costUsd: 15, savingsUsd: 3000 }));
      const overview = engine.getOverview("t1");
      expect(overview.kpis.totalAgents).toBe(2);
      expect(overview.kpis.totalExecutions).toBe(1500);
      expect(overview.kpis.totalSavingsUsd).toBe(8000);
      expect(overview.agentPerformance.length).toBe(2);
      expect(overview.executiveSummary).toContain("1,500");
    });
  });

  describe("getKPIs", () => {
    it("computes KPIs correctly", () => {
      engine.recordAgentMetrics("t1", makeAgent());
      const kpis = engine.getKPIs("t1");
      expect(kpis.totalExecutions).toBe(1000);
      expect(kpis.roi).toBeGreaterThan(0);
      expect(kpis.uptimePercent).toBe(99.9);
    });
  });

  describe("getCostBreakdown", () => {
    it("breaks down costs by category and agent", () => {
      engine.recordAgentMetrics("t1", makeAgent({ costUsd: 30 }));
      engine.recordAgentMetrics("t1", makeAgent({ agentId: "a2", agentType: "COMPLIANCE", costUsd: 20 }));
      const costs = engine.getCostBreakdown("t1");
      expect(costs.byCategory.length).toBe(2);
      expect(costs.byAgent.length).toBe(2);
      expect(costs.totalCostUsd).toBe(50);
    });
  });

  describe("alerts", () => {
    it("generates alerts for low success rate", () => {
      engine.recordAgentMetrics("t1", makeAgent({ successRate: 0.7, healthStatus: "critical" }));
      const overview = engine.getOverview("t1");
      expect(overview.alerts.length).toBeGreaterThan(0);
      expect(overview.alerts[0].severity).toBe("critical");
    });
  });

  describe("exportReport", () => {
    it("exports as CSV", () => {
      engine.recordAgentMetrics("t1", makeAgent());
      const report = engine.exportReport("t1", "csv");
      expect(report.format).toBe("csv");
      expect(report.data).toContain("Fraud Monitor");
    });

    it("exports as JSON", () => {
      engine.recordAgentMetrics("t1", makeAgent());
      const report = engine.exportReport("t1", "json");
      expect(report.format).toBe("json");
      expect(JSON.parse(report.data).kpis).toBeDefined();
    });
  });

  describe("configure", () => {
    it("sets dashboard config with alert thresholds", () => {
      const config = engine.configure({ tenantId: "t1", periodDays: 7, refreshIntervalMinutes: 5, alertThresholds: { minSuccessRate: 0.99, maxLatencyMs: 1000, maxCostPerDay: 50, minROI: 100 } });
      expect(config.periodDays).toBe(7);
      expect(config.alertThresholds.minSuccessRate).toBe(0.99);
    });
  });
});
