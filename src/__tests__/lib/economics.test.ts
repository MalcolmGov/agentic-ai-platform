import { describe, it, expect, beforeEach } from "vitest";
import { EconomicsEngine } from "@/lib/economics/roi-engine";

describe("EconomicsEngine", () => {
  let engine: EconomicsEngine;

  beforeEach(() => {
    engine = new EconomicsEngine();
  });

  describe("calculateAgentEconomics", () => {
    it("calculates ROI for a fraud monitoring agent", () => {
      const economics = engine.calculateAgentEconomics({
        agentId: "a1", agentName: "Fraud Monitor", agentType: "FRAUD_MONITORING",
        executions: 1000, successRate: 0.97, avgLatencyMs: 500,
        totalTokens: 500000, totalCostUsd: 25,
      }, "t1");
      expect(economics.laborSavings.dollarsSaved).toBeGreaterThan(0);
      expect(economics.errorReduction.errorsAvoided).toBeGreaterThanOrEqual(0);
      expect(economics.totalSavings).toBeGreaterThan(0);
      expect(economics.roi).toBeGreaterThan(0);
    });

    it("calculates speed gains correctly", () => {
      const economics = engine.calculateAgentEconomics({
        agentId: "a2", agentName: "Doc Processor", agentType: "DOCUMENT_PROCESSING",
        executions: 500, successRate: 0.99, avgLatencyMs: 2000,
        totalTokens: 250000, totalCostUsd: 10,
      }, "t1");
      expect(economics.speedGains.speedMultiplier).toBeGreaterThan(1);
      expect(economics.speedGains.totalTimeSavedHours).toBeGreaterThan(0);
    });

    it("calculates compliance savings", () => {
      const economics = engine.calculateAgentEconomics({
        agentId: "a3", agentName: "Compliance Agent", agentType: "COMPLIANCE",
        executions: 200, successRate: 0.98, avgLatencyMs: 1000,
        totalTokens: 100000, totalCostUsd: 5,
      }, "t1");
      expect(economics.complianceSavings.dollarsSaved).toBeGreaterThan(0);
    });
  });

  describe("generateROIReport", () => {
    it("generates a portfolio ROI report", () => {
      const report = engine.generateROIReport([
        { agentId: "a1", agentName: "Fraud", agentType: "FRAUD_MONITORING", executions: 1000, successRate: 0.97, avgLatencyMs: 500, totalTokens: 500000, totalCostUsd: 25 },
        { agentId: "a2", agentName: "Compliance", agentType: "COMPLIANCE", executions: 500, successRate: 0.95, avgLatencyMs: 1000, totalTokens: 250000, totalCostUsd: 15 },
      ], "t1");
      expect(report.id).toMatch(/^roi_/);
      expect(report.agents.length).toBe(2);
      expect(report.totals.totalSavings).toBeGreaterThan(0);
      expect(report.totals.overallROI).toBeGreaterThan(0);
      expect(report.executiveSummary).toBeTruthy();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("stores reports for retrieval", () => {
      engine.generateROIReport([
        { agentId: "a1", agentName: "Test", agentType: "FRAUD_MONITORING", executions: 100, successRate: 0.9, avgLatencyMs: 500, totalTokens: 50000, totalCostUsd: 5 },
      ], "t1");
      const reports = engine.getReports("t1");
      expect(reports.length).toBe(1);
    });
  });

  describe("getBenchmarks", () => {
    it("returns industry benchmarks", () => {
      const benchmarks = engine.getBenchmarks();
      expect(Object.keys(benchmarks).length).toBeGreaterThan(0);
      expect(benchmarks["FRAUD_MONITORING"]).toBeDefined();
    });
  });
});
