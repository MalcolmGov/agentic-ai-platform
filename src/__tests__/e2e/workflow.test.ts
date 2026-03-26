import { describe, it, expect, beforeEach } from "vitest";
import { OnboardingEngine } from "@/lib/onboarding/onboarding-engine";
import { DriftDetector, ExecutionSample } from "@/lib/drift/drift-detector";
import { MarketplaceEngine } from "@/lib/marketplace/marketplace-engine";
import { PromptVersioningEngine } from "@/lib/prompt-versioning/prompt-versioning-engine";
import { TeamEngine } from "@/lib/team/team-engine";
import { GovernanceEngine } from "@/lib/governance/compliance-engine";

describe("E2E Workflow Tests", () => {
  describe("Signup to first agent", () => {
    it("completes onboarding from signup through agent creation and limit check", () => {
      const onboarding = new OnboardingEngine();

      // Step 1: Signup
      const { tenant, apiKey } = onboarding.signup({
        companyName: "E2E Corp",
        ownerEmail: "e2e@corp.com",
        plan: "starter",
        password: "securepass123",
      });

      expect(tenant.id).toMatch(/^tenant_/);
      expect(tenant.name).toBe("E2E Corp");
      expect(tenant.plan).toBe("starter");
      expect(tenant.onboarding.completedSteps).toContain("account_created");
      expect(apiKey).toMatch(/^ak_/);

      // Step 2: Generate an API key (simulates creating agent data)
      const keyResult = onboarding.generateApiKey(tenant.id, "Agent Key", ["agent:read", "agent:write"]);
      expect(keyResult).not.toBeNull();
      expect(keyResult!.rawKey).toMatch(/^ak_/);

      // Step 3: Complete onboarding step for agent creation
      const progress = onboarding.completeOnboardingStep(tenant.id, "first_agent_created");
      expect(progress).not.toBeNull();
      expect(progress!.completedSteps).toContain("first_agent_created");
      expect(progress!.percentComplete).toBeGreaterThan(14);

      // Step 4: Check limits - should be within starter plan
      const limits = onboarding.checkLimits(tenant.id, "maxAgents", 1);
      expect(limits.allowed).toBe(true);
      expect(limits.limit).toBe(3); // starter plan
      expect(limits.remaining).toBe(2);

      // Step 5: Check that exceeding limits is blocked
      const overLimit = onboarding.checkLimits(tenant.id, "maxAgents", 5);
      expect(overLimit.allowed).toBe(false);
      expect(overLimit.remaining).toBe(0);
    });
  });

  describe("Deploy and monitor", () => {
    it("creates agent baseline and generates drift report", () => {
      const drift = new DriftDetector();
      const agentId = "agent_e2e_001";
      const tenantId = "tenant_e2e_001";

      // Step 1: Record baseline samples (need >= 20 for auto-baseline)
      for (let i = 0; i < 25; i++) {
        const sample: ExecutionSample = {
          agentId,
          tenantId,
          timestamp: Date.now() + i * 1000,
          latencyMs: 200 + Math.random() * 50,
          tokenUsage: 500 + Math.random() * 100,
          confidence: 0.9 + Math.random() * 0.05,
          toolsUsed: ["lookup", "scorer"],
          outcome: "success",
          reasoningSteps: 3,
          costUsd: 0.01,
          success: true,
        };
        drift.recordSample(sample);
      }

      // Step 2: Verify fingerprint was created
      const fingerprint = drift.getFingerprint(agentId);
      expect(fingerprint).not.toBeNull();
      expect(fingerprint!.agentId).toBe(agentId);
      expect(fingerprint!.sampleCount).toBeGreaterThanOrEqual(20);

      // Step 3: Get drift report - should be healthy
      const report = drift.getDriftReport(agentId, tenantId);
      expect(report.agentId).toBe(agentId);
      expect(report.fingerprint).not.toBeNull();
      expect(report.healthScore).toBeGreaterThanOrEqual(80);
      expect(report.status).toBe("healthy");

      // Step 4: Record an anomalous sample (very high latency)
      const anomalous: ExecutionSample = {
        agentId,
        tenantId,
        timestamp: Date.now() + 100000,
        latencyMs: 5000, // way above normal
        tokenUsage: 5000, // way above normal
        confidence: 0.2,  // way below normal
        toolsUsed: ["lookup"],
        outcome: "failure",
        reasoningSteps: 10,
        costUsd: 0.50,
        success: false,
      };
      const driftEvents = drift.recordSample(anomalous);
      expect(driftEvents.length).toBeGreaterThan(0);

      // Step 5: Verify drift events were created
      const updatedReport = drift.getDriftReport(agentId, tenantId);
      expect(updatedReport.recentDrifts.length).toBeGreaterThan(0);
    });
  });

  describe("Marketplace publish to install", () => {
    it("publishes, searches, installs, and reviews a listing", () => {
      const marketplace = new MarketplaceEngine();

      // Step 1: Publish a listing
      const listing = marketplace.publish({
        name: "E2E Fraud Detector",
        description: "End-to-end fraud detection agent",
        longDescription: "A comprehensive fraud detection agent for e2e testing.",
        category: "fraud_detection",
        tags: ["fraud", "e2e", "security"],
        tenantId: "tenant_publisher_001",
        authorName: "E2E Publisher",
        version: "1.0.0",
        pricing: { type: "free", priceUsd: 0 },
        agentConfig: {
          type: "FRAUD_MONITORING",
          systemPrompt: "Detect fraud.",
          model: "claude-3",
          provider: "anthropic",
          tools: ["lookup"],
          triggers: [],
          integrations: [],
          complianceFrameworks: [],
          requiredPermissions: [],
        },
      });

      expect(listing.id).toMatch(/^mkt_/);
      expect(listing.status).toBe("published");

      // Step 2: Search for the listing
      const searchResults = marketplace.search({ query: "E2E Fraud" });
      expect(searchResults.total).toBeGreaterThanOrEqual(1);
      const found = searchResults.results.find((r) => r.id === listing.id);
      expect(found).toBeDefined();

      // Step 3: Install the listing
      const installRecord = marketplace.install(listing.id, "tenant_consumer_001");
      expect(installRecord).not.toBeNull();
      expect(installRecord!.listingId).toBe(listing.id);
      expect(installRecord!.deployedAgentId).toMatch(/^agent_/);

      // Verify install count increased
      const updatedListing = marketplace.getListing(listing.id);
      expect(updatedListing!.stats.installs).toBe(1);

      // Step 4: Add a review
      const review = marketplace.addReview(listing.id, {
        tenantId: "tenant_consumer_001",
        reviewerName: "Happy Customer",
        rating: 5,
        title: "Excellent agent!",
        body: "Works perfectly for our fraud detection needs.",
      });

      expect(review).not.toBeNull();
      expect(review!.rating).toBe(5);

      // Verify stats updated
      const finalListing = marketplace.getListing(listing.id);
      expect(finalListing!.stats.totalReviews).toBe(1);
      expect(finalListing!.stats.avgRating).toBe(5);
    });
  });

  describe("Prompt versioning lifecycle", () => {
    it("commits, commits again, rolls back, and verifies version state", () => {
      const versioning = new PromptVersioningEngine();
      const agentId = "agent_prompt_001";
      const tenantId = "tenant_prompt_001";

      // Step 1: Initial commit
      const v1 = versioning.commit({
        agentId,
        tenantId,
        content: "You are a helpful assistant that answers questions politely.",
        message: "Initial prompt",
        author: "developer@test.com",
      });

      expect(v1.version).toBe(1);
      expect(v1.status).toBe("active");
      expect(v1.id).toMatch(/^pv_/);

      // Step 2: Second commit (refine prompt)
      const v2 = versioning.commit({
        agentId,
        tenantId,
        content: "You are an expert assistant that provides detailed, accurate answers with citations.",
        message: "Improved prompt with citation requirement",
        author: "developer@test.com",
      });

      expect(v2.version).toBe(2);
      expect(v2.status).toBe("active");
      expect(v2.diff.length).toBeGreaterThan(0);

      // Verify v1 is now superseded
      const current = versioning.getCurrentPrompt(agentId);
      expect(current!.version).toBe(2);

      // Step 3: Rollback to v1
      const rollback = versioning.rollback(agentId, 1, "developer@test.com");
      expect(rollback).not.toBeNull();
      expect(rollback!.success).toBe(true);
      expect(rollback!.previousVersion).toBe(2);
      expect(rollback!.restoredVersion).toBe(1);

      // Step 4: Verify current prompt has v1 content
      const afterRollback = versioning.getCurrentPrompt(agentId);
      expect(afterRollback!.version).toBe(3); // rollback creates a new version
      expect(afterRollback!.content).toBe(
        "You are a helpful assistant that answers questions politely."
      );
      expect(afterRollback!.message).toContain("Rollback to v1");
    });
  });

  describe("Team collaboration flow", () => {
    it("adds owner, invites member, accepts invite, and changes role", () => {
      const team = new TeamEngine();
      const tenantId = "tenant_team_001";

      // Step 1: Add the initial owner
      const owner = team.addOwner(tenantId, "owner@team.com", "Team Owner");
      expect(owner.role).toBe("owner");
      expect(owner.status).toBe("active");
      expect(owner.id).toMatch(/^member_/);

      // Step 2: Invite a new member
      const invite = team.invite({
        tenantId,
        email: "newmember@team.com",
        role: "editor",
        invitedBy: owner.id,
      });

      expect(invite.id).toMatch(/^inv_/);
      expect(invite.status).toBe("pending");
      expect(invite.email).toBe("newmember@team.com");
      expect(invite.role).toBe("editor");

      // Verify pending invites
      const pending = team.getPendingInvites(tenantId);
      expect(pending.length).toBe(1);

      // Step 3: Accept the invite
      const newMember = team.acceptInvite(invite.token, "New Member");
      expect(newMember).not.toBeNull();
      expect(newMember!.email).toBe("newmember@team.com");
      expect(newMember!.role).toBe("editor");
      expect(newMember!.status).toBe("active");

      // Verify team now has 2 members
      const members = team.getMembers(tenantId);
      expect(members.length).toBe(2);

      // Step 4: Change the new member's role
      const updated = team.changeRole(tenantId, newMember!.id, "admin", owner.id);
      expect(updated).not.toBeNull();
      expect(updated!.role).toBe("admin");

      // Step 5: Verify permissions
      expect(team.hasPermission(tenantId, owner.id, "agent:delete")).toBe(true); // owner has *
      expect(team.hasPermission(tenantId, newMember!.id, "team:manage")).toBe(true); // admin

      // Step 6: Check activity log
      const activity = team.getActivity(tenantId);
      expect(activity.length).toBeGreaterThanOrEqual(3); // invited, joined, role_changed
    });
  });

  describe("Full governance cycle", () => {
    it("creates model card, records decisions, and generates compliance report", () => {
      const governance = new GovernanceEngine();
      const tenantId = "tenant_gov_001";

      // Step 1: Create a model card
      const card = governance.generateModelCard({
        agentId: "agent_gov_001",
        agentName: "Compliance Monitor",
        tenantId,
        modelProvider: "anthropic",
        modelName: "claude-3",
        agentType: "COMPLIANCE",
        taskType: "reasoning",
        intendedUse: "Automated regulatory compliance checks",
      });

      expect(card.id).toMatch(/^mc_/);
      expect(card.agentId).toBe("agent_gov_001");
      expect(card.riskClassification.level).toBeDefined();
      expect(card.biasAssessment.status).toBe("pending");

      // Step 2: Run bias assessment
      const assessment = governance.runBiasAssessment(card.id, { accuracy: 0.95 }, 0.85);
      expect(assessment).not.toBeNull();
      expect(assessment!.status).toBe("pass");
      expect(assessment!.assessed).toBe(true);

      // Step 3: Record several decisions
      const decision1 = governance.recordDecision({
        executionId: "exec_gov_001",
        agentId: "agent_gov_001",
        tenantId,
        input: "Review document for GDPR compliance",
        output: "Document is GDPR compliant with minor recommendations",
        reasoningChain: [
          { step: 1, action: "analyze_data_handling", rationale: "Checked data processing practices" },
          { step: 2, action: "check_consent_flows", rationale: "Verified consent mechanisms" },
        ],
        modelUsed: "claude-3",
        tokensConsumed: 800,
        confidenceScore: 0.92,
      });

      expect(decision1.id).toMatch(/^dl_/);
      expect(decision1.humanReviewRequired).toBe(false);
      expect(decision1.confidenceScore).toBe(0.92);

      // Record a low-confidence decision
      const decision2 = governance.recordDecision({
        executionId: "exec_gov_002",
        agentId: "agent_gov_001",
        tenantId,
        input: "Ambiguous compliance question",
        output: "Uncertain - requires expert review",
        reasoningChain: [
          { step: 1, action: "analyze", rationale: "Insufficient context" },
        ],
        modelUsed: "claude-3",
        tokensConsumed: 300,
        confidenceScore: 0.35,
      });

      expect(decision2.humanReviewRequired).toBe(true);

      // Step 4: Get decision lineage
      const lineage = governance.getDecisionLineage(tenantId, "agent_gov_001");
      expect(lineage.length).toBe(2);

      // Step 5: Generate compliance report
      const report = governance.generateComplianceReport(tenantId, "EU_AI_ACT");
      expect(report.id).toMatch(/^cr_/);
      expect(report.framework).toBe("EU_AI_ACT");
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.controls.length).toBeGreaterThan(0);

      // Step 6: Generate GDPR report too
      const gdprReport = governance.generateComplianceReport(tenantId, "GDPR");
      expect(gdprReport.framework).toBe("GDPR");
      expect(gdprReport.controls.length).toBeGreaterThan(0);
    });
  });
});
