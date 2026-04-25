import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation which dashboard pages may use
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch for any API calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, data: {} }),
});

describe("Dashboard Page Smoke Tests", () => {
  it("renders the main dashboard page", async () => {
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    const { container } = render(<DashboardPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the approvals page", async () => {
    const { default: ApprovalsPage } = await import("@/app/dashboard/approvals/page");
    const { container } = render(<ApprovalsPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the agents page", async () => {
    const { default: AgentsPage } = await import("@/app/dashboard/agents/page");
    const { container } = render(<AgentsPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the workflows page", async () => {
    const { default: WorkflowsPage } = await import("@/app/dashboard/workflows/page");
    const { container } = render(<WorkflowsPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the analytics page", async () => {
    const { default: AnalyticsPage } = await import("@/app/dashboard/analytics/page");
    const { container } = render(<AnalyticsPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the settings page", async () => {
    const { default: SettingsPage } = await import("@/app/dashboard/settings/page");
    const { container } = render(<SettingsPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the knowledge page", async () => {
    const { default: KnowledgePage } = await import("@/app/dashboard/knowledge/page");
    const { container } = render(<KnowledgePage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the insights page", async () => {
    const { default: InsightsPage } = await import("@/app/dashboard/insights/page");
    const { container } = render(<InsightsPage />);
    expect(container.firstChild).toBeTruthy();
  });
});
