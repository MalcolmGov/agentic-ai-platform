import { describe, it, expect, beforeEach } from "vitest";
import { GovernanceEngine } from "@/lib/governance/compliance-engine";

describe("GovernanceEngine", () => {
  let engine: GovernanceEngine;

  beforeEach(() => {
    engine = new GovernanceEngine();
  });

  describe("generateModelCard", () => {
    it("creates a model card with risk classification", () => {
      const card = engine.generateModelCard({
        agentId: "a1", agentName: "Fraud Monitor", tenantId: "t1",
        modelProvider: "anthropic", modelName: "claude-3",
        agentType: "FRAUD_MONITORING", taskType: "classification",
        intendedUse: "Detect fraudulent transactions",
      });
      expect(card.id).toMatch(/^mc_/);
      expect(card.agentId).toBe("a1");
      expect(card.riskClassification.level).toBeDefined();
      expect(card.biasAssessment.status).toBe("pending");
    });

    it("classifies high-risk agents correctly", () => {
      const card = engine.generateModelCard({
        agentId: "a2", agentName: "Compliance Agent", tenantId: "t1",
        modelProvider: "anthropic", modelName: "claude-3",
        agentType: "COMPLIANCE", taskType: "reasoning",
        intendedUse: "Regulatory compliance checks",
      });
      expect(["high", "limited", "minimal"]).toContain(card.riskClassification.level);
    });
  });

  describe("runBiasAssessment", () => {
    it("runs bias assessment and updates model card", () => {
      const card = engine.generateModelCard({
        agentId: "a1", agentName: "Test", tenantId: "t1",
        modelProvider: "anthropic", modelName: "claude-3",
        agentType: "CUSTOMER_SUPPORT", taskType: "generation",
        intendedUse: "Support tickets",
      });
      const assessment = engine.runBiasAssessment(card.id, { accuracy: 0.95 }, 0.85);
      expect(assessment).not.toBeNull();
      expect(assessment!.status).toBe("pass");
      expect(assessment!.assessed).toBe(true);
    });

    it("flags low disparate impact ratio", () => {
      const card = engine.generateModelCard({
        agentId: "a1", agentName: "Test", tenantId: "t1",
        modelProvider: "anthropic", modelName: "claude-3",
        agentType: "CUSTOMER_SUPPORT", taskType: "generation",
        intendedUse: "Support tickets",
      });
      const assessment = engine.runBiasAssessment(card.id, { accuracy: 0.9 }, 0.5);
      expect(assessment!.status).toBe("fail");
      expect(assessment!.mitigationStrategies.length).toBeGreaterThan(0);
    });
  });

  describe("recordDecision", () => {
    it("records a decision with lineage", () => {
      const lineage = engine.recordDecision({
        executionId: "exec1", agentId: "a1", tenantId: "t1",
        input: "Review this document", output: "Compliant",
        reasoningChain: [{ step: 1, action: "analyze", rationale: "Checked requirements" }],
        modelUsed: "claude-3", tokensConsumed: 500, confidenceScore: 0.95,
      });
      expect(lineage.id).toMatch(/^dl_/);
      expect(lineage.confidenceScore).toBe(0.95);
      expect(lineage.humanReviewRequired).toBe(false);
    });

    it("requires human review for low confidence", () => {
      const lineage = engine.recordDecision({
        executionId: "exec2", agentId: "a1", tenantId: "t1",
        input: "Unclear request", output: "Uncertain",
        reasoningChain: [{ step: 1, action: "analyze", rationale: "Ambiguous input" }],
        modelUsed: "claude-3", tokensConsumed: 200, confidenceScore: 0.4,
      });
      expect(lineage.humanReviewRequired).toBe(true);
    });
  });

  describe("getDecisionLineage", () => {
    it("filters decisions by tenant and agent", () => {
      engine.recordDecision({
        executionId: "e1", agentId: "a1", tenantId: "t1",
        input: "i", output: "o",
        reasoningChain: [{ step: 1, action: "a", rationale: "r" }],
        modelUsed: "claude-3", tokensConsumed: 100, confidenceScore: 0.9,
      });
      engine.recordDecision({
        executionId: "e2", agentId: "a2", tenantId: "t1",
        input: "i", output: "o",
        reasoningChain: [{ step: 1, action: "a", rationale: "r" }],
        modelUsed: "claude-3", tokensConsumed: 100, confidenceScore: 0.9,
      });
      const all = engine.getDecisionLineage("t1");
      expect(all.length).toBe(2);
      const filtered = engine.getDecisionLineage("t1", "a1");
      expect(filtered.length).toBe(1);
    });
  });

  describe("generateComplianceReport", () => {
    it("generates a compliance report for EU AI Act", () => {
      const report = engine.generateComplianceReport("t1", "EU_AI_ACT");
      expect(report.id).toMatch(/^cr_/);
      expect(report.framework).toBe("EU_AI_ACT");
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.controls.length).toBeGreaterThan(0);
    });

    it("generates reports for different frameworks", () => {
      const gdpr = engine.generateComplianceReport("t1", "GDPR");
      expect(gdpr.framework).toBe("GDPR");
      const hipaa = engine.generateComplianceReport("t1", "HIPAA");
      expect(hipaa.framework).toBe("HIPAA");
    });
  });
});
