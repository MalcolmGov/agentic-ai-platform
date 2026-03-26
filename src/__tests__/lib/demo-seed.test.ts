import { describe, it, expect, beforeAll } from "vitest";
import { seedDemoEnvironment, getDemoEnvironment, isDemoInitialized } from "@/lib/demo/demo-seed";
import { getProductTour, getQuickStartChecklist } from "@/lib/demo/guided-tour";
import { getMarketplaceEngine } from "@/lib/marketplace/marketplace-engine";
import { getDashboardEngine } from "@/lib/dashboard/dashboard-engine";
import { getDriftDetector } from "@/lib/drift/drift-detector";
import { getTeamEngine } from "@/lib/team/team-engine";
import { getPromptVersioningEngine } from "@/lib/prompt-versioning/prompt-versioning-engine";
import { getNotificationEngine } from "@/lib/notifications/notification-engine";

const DEMO_TENANT = "tenant_demo_001";
const DEMO_USER = "demo_user_001";

describe("Demo Seed", () => {
  let env: ReturnType<typeof seedDemoEnvironment>;

  beforeAll(() => {
    env = seedDemoEnvironment();
  });

  it("seeds demo environment successfully", () => {
    expect(env.initialized).toBe(true);
    expect(env.tenantId).toBe(DEMO_TENANT);
    expect(env.agents.length).toBe(8);
    expect(env.seededAt).toBeGreaterThan(0);
  });

  it("returns existing environment on repeated calls", () => {
    const env2 = seedDemoEnvironment();
    expect(env2.seededAt).toBe(env.seededAt);
  });

  it("reports demo as initialized", () => {
    expect(isDemoInitialized()).toBe(true);
    expect(getDemoEnvironment()).not.toBeNull();
  });

  it("seeds marketplace with 8 listings", () => {
    const engine = getMarketplaceEngine();
    const results = engine.search({ limit: 20 });
    expect(results.results.length).toBeGreaterThanOrEqual(8);
  });

  it("seeds dashboard with agent metrics", () => {
    const engine = getDashboardEngine();
    const overview = engine.getOverview(DEMO_TENANT);
    expect(overview.agentPerformance.length).toBe(8);
    expect(overview.kpis.totalAgents).toBe(8);
    expect(overview.kpis.totalExecutions).toBeGreaterThan(0);
  });

  it("seeds drift baselines with events", () => {
    const detector = getDriftDetector();
    const report = detector.getDriftReport("agent_fraud_01", DEMO_TENANT);
    expect(report.fingerprint).not.toBeNull();
    expect(report.fingerprint!.sampleCount).toBeGreaterThanOrEqual(20);
  });

  it("seeds team with 4 members", () => {
    const engine = getTeamEngine();
    const members = engine.getMembers(DEMO_TENANT);
    expect(members.length).toBe(4);
    expect(members.some((m) => m.role === "owner")).toBe(true);
    expect(members.some((m) => m.role === "admin")).toBe(true);
    expect(members.filter((m) => m.role === "editor").length).toBe(2);
  });

  it("seeds prompt versions with history", () => {
    const engine = getPromptVersioningEngine();
    const history = engine.getHistory("agent_fraud_01");
    expect(history).not.toBeNull();
    expect(history!.totalVersions).toBeGreaterThanOrEqual(3);
    const supportHistory = engine.getHistory("agent_support_01");
    expect(supportHistory).not.toBeNull();
    expect(supportHistory!.totalVersions).toBeGreaterThanOrEqual(2);
  });

  it("seeds notifications", () => {
    const engine = getNotificationEngine();
    const notifs = engine.getNotifications(DEMO_TENANT, DEMO_USER);
    expect(notifs.length).toBeGreaterThanOrEqual(10);
    expect(notifs.some((n) => n.priority === "critical")).toBe(true);
  });
});

describe("Guided Tour", () => {
  it("returns 10 ordered tour steps", () => {
    const steps = getProductTour();
    expect(steps.length).toBe(10);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].order).toBe(i + 1);
    }
  });

  it("each step has required fields", () => {
    const steps = getProductTour();
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.targetPage).toMatch(/^\//);
    }
  });

  it("returns 7 quickstart checklist items", () => {
    const items = getQuickStartChecklist();
    expect(items.length).toBe(7);
    for (let i = 0; i < items.length; i++) {
      expect(items[i].order).toBe(i + 1);
      expect(items[i].completed).toBe(false);
    }
  });
});
