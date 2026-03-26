/**
 * Guided Product Tour & Quick-Start Checklist
 *
 * Defines structured walkthrough steps and onboarding checklist
 * for new users and demo sessions.
 */

// ─── Types ─────────────────────────────────

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetPage: string;
  highlightElement?: string;
  action?: string;
  order: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  targetPage: string;
  completed: boolean;
  order: number;
}

// ─── Product Tour ──────────────────────────

export function getProductTour(): TourStep[] {
  return [
    {
      id: "tour_dashboard",
      title: "Dashboard Overview",
      description: "See real-time KPIs, agent activity, cost savings, and system health at a glance. The executive dashboard aggregates performance data across all your agents.",
      targetPage: "/dashboard",
      highlightElement: "[data-tour='kpi-cards']",
      action: "Explore the KPI cards showing active agents, executions, ROI, and savings",
      order: 1,
    },
    {
      id: "tour_agents",
      title: "Agent Management",
      description: "Browse, configure, and monitor your AI agents. Each agent has its own performance metrics, execution history, and configuration panel.",
      targetPage: "/dashboard/agents",
      highlightElement: "[data-tour='agent-list']",
      action: "Click on any agent to view its detailed configuration and metrics",
      order: 2,
    },
    {
      id: "tour_studio",
      title: "Agent Studio",
      description: "Build agents visually with drag-and-drop. Define triggers, processing steps, conditions, and actions — no code required.",
      targetPage: "/dashboard/studio",
      highlightElement: "[data-tour='canvas']",
      action: "Try dragging a node onto the canvas to start building a workflow",
      order: 3,
    },
    {
      id: "tour_marketplace",
      title: "Agent Marketplace",
      description: "Discover pre-built agent templates from the community. Install, customize, and deploy agents for fraud detection, support, compliance, and more.",
      targetPage: "/dashboard/marketplace",
      highlightElement: "[data-tour='marketplace-grid']",
      action: "Browse available agents and check their ratings and pricing",
      order: 4,
    },
    {
      id: "tour_workflows",
      title: "Multi-Agent Workflows",
      description: "Chain agents together in DAG-based workflows with conditional routing, parallel execution, and error handling.",
      targetPage: "/dashboard/workflows",
      highlightElement: "[data-tour='workflow-list']",
      action: "Open the Fraud Detection Pipeline to see a multi-step workflow in action",
      order: 5,
    },
    {
      id: "tour_governance",
      title: "AI Governance",
      description: "Review model cards, bias assessments, and compliance reports. Track governance decisions with full audit lineage.",
      targetPage: "/dashboard/glass-box",
      highlightElement: "[data-tour='model-cards']",
      action: "View the FraudGuard model card to see risk classification and ethical considerations",
      order: 6,
    },
    {
      id: "tour_analytics",
      title: "Performance Analytics",
      description: "Deep-dive into agent performance, cost analysis, ROI trends, and usage patterns with filterable charts and exportable data.",
      targetPage: "/dashboard/analytics",
      highlightElement: "[data-tour='analytics-charts']",
      action: "Toggle between daily and weekly views to see performance trends",
      order: 7,
    },
    {
      id: "tour_team",
      title: "Team Management",
      description: "Invite team members with role-based access. Owners, admins, editors, and viewers each see and do exactly what they should.",
      targetPage: "/dashboard/users",
      highlightElement: "[data-tour='team-list']",
      action: "Review team members and their roles",
      order: 8,
    },
    {
      id: "tour_api",
      title: "API Integration",
      description: "Access the full OpenAPI 3.1 spec with interactive documentation. Generate API keys and see code samples in cURL, Python, and TypeScript.",
      targetPage: "/dashboard/settings/integrations",
      highlightElement: "[data-tour='api-keys']",
      action: "Generate a test API key and explore the endpoint documentation",
      order: 9,
    },
    {
      id: "tour_settings",
      title: "Customization & Settings",
      description: "Configure SSO, white-label branding, webhook integrations, notification preferences, and billing — all from one place.",
      targetPage: "/dashboard/settings/ai",
      highlightElement: "[data-tour='settings-nav']",
      action: "Explore the settings sections to see available customization options",
      order: 10,
    },
  ];
}

// ─── Quick-Start Checklist ─────────────────

export function getQuickStartChecklist(): ChecklistItem[] {
  return [
    {
      id: "qs_create_agent",
      title: "Create your first agent",
      description: "Set up an AI agent by choosing a type, configuring its model, and defining its system prompt.",
      targetPage: "/dashboard/agents",
      completed: false,
      order: 1,
    },
    {
      id: "qs_run_execution",
      title: "Run a test execution",
      description: "Execute your agent with a sample input to see it in action and verify it produces the expected output.",
      targetPage: "/dashboard/agents",
      completed: false,
      order: 2,
    },
    {
      id: "qs_integration",
      title: "Set up an integration",
      description: "Connect an external service like Slack, PostgreSQL, or Stripe to enable your agent to interact with real systems.",
      targetPage: "/dashboard/integrations",
      completed: false,
      order: 3,
    },
    {
      id: "qs_workflow",
      title: "Create a workflow",
      description: "Build a multi-step workflow that chains agents together with conditional logic and error handling.",
      targetPage: "/dashboard/workflows",
      completed: false,
      order: 4,
    },
    {
      id: "qs_invite",
      title: "Invite a team member",
      description: "Add a colleague to your workspace with an appropriate role (admin, editor, or viewer).",
      targetPage: "/dashboard/users",
      completed: false,
      order: 5,
    },
    {
      id: "qs_alerts",
      title: "Configure alerts",
      description: "Set up alert thresholds for agent performance, costs, and system health to stay informed of issues.",
      targetPage: "/dashboard/notifications",
      completed: false,
      order: 6,
    },
    {
      id: "qs_api_key",
      title: "Generate an API key",
      description: "Create an API key to integrate the platform with your applications via the REST API.",
      targetPage: "/dashboard/settings/integrations",
      completed: false,
      order: 7,
    },
  ];
}
