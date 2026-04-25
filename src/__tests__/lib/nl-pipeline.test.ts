import { describe, it, expect, beforeEach } from "vitest";
import { NLAgentPipeline } from "@/lib/nl-pipeline/nl-agent-pipeline";

describe("NLAgentPipeline", () => {
  let pipeline: NLAgentPipeline;

  beforeEach(() => {
    pipeline = new NLAgentPipeline();
  });

  describe("parseIntent", () => {
    it("detects fraud monitoring intent", () => {
      const intent = pipeline.parseIntent("Detect suspicious fraud transactions and flag anomalies on Slack");
      expect(intent.agentType).toBe("FRAUD_MONITORING");
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it("detects compliance intent", () => {
      const intent = pipeline.parseIntent("Check regulatory compliance for all documents daily");
      expect(intent.agentType).toBe("COMPLIANCE");
    });

    it("extracts monetary thresholds", () => {
      const intent = pipeline.parseIntent("Alert when transaction amount exceeds $5,000");
      expect(intent.extractedEntities).toBeDefined();
    });

    it("detects integrations", () => {
      const intent = pipeline.parseIntent("Send fraud alerts to Slack channel");
      expect(intent.integrations.length).toBeGreaterThan(0);
      expect(intent.integrations[0].provider).toBe("slack");
    });

    it("detects actions", () => {
      const intent = pipeline.parseIntent("Block suspicious transactions and escalate to manager");
      expect(intent.actions.length).toBeGreaterThan(0);
    });
  });

  describe("generateAgent", () => {
    it("generates a full agent config from description", () => {
      const result = pipeline.generateAgent({
        description: "Detect suspicious fraud transactions over $10,000 and flag anomalies on Slack daily",
        tenantId: "t1",
        requestedBy: "user1",
      });
      expect(result.agentConfig.type).toBe("FRAUD_MONITORING");
      expect(result.agentConfig.systemPrompt).toBeTruthy();
      expect(result.success).toBe(true);
    });

    it("generates valid config for customer support", () => {
      const result = pipeline.generateAgent({
        description: "Handle customer support tickets and respond to inquiries automatically",
        tenantId: "t1",
        requestedBy: "user1",
      });
      expect(result.agentConfig.type).toBe("CUSTOMER_SUPPORT");
      expect(result.success).toBe(true);
    });

    it("includes deployment checklist", () => {
      const result = pipeline.generateAgent({
        description: "Analyze data reports every hour and create summary",
        tenantId: "t1",
        requestedBy: "user1",
      });
      expect(result.deploymentChecklist.length).toBeGreaterThan(0);
    });
  });
});
