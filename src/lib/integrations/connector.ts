/**
 * Integration Connectors — Framework for third-party service integrations
 *
 * Provides a unified interface for connecting external services
 * (Slack, Teams, Salesforce, webhooks, etc.) with secure credential
 * storage and health checking.
 */

// ─── Types ─────────────────────────────────

export type IntegrationProvider =
  | "slack"
  | "teams"
  | "salesforce"
  | "hubspot"
  | "pagerduty"
  | "github"
  | "jira"
  | "twilio"
  | "sendgrid"
  | "datadog"
  | "aws_s3"
  | "webhook";

export type AuthType = "oauth2" | "api_key" | "webhook_url" | "connection_string";

export interface IntegrationConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  authType: AuthType;
  category: "messaging" | "crm" | "monitoring" | "storage" | "devtools" | "communication";
  requiredFields: string[];
  optionalFields: string[];
  webhookEvents?: string[];
}

export interface ConnectedIntegration {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  name: string;
  status: "connected" | "disconnected" | "error" | "pending";
  credentials: Record<string, string>; // encrypted in production
  config: Record<string, unknown>;
  lastHealthCheck: number | null;
  lastSyncAt: number | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  tenantId: string;
  provider: IntegrationProvider;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  createdAt: number;
}

export interface IntegrationHealthCheck {
  provider: IntegrationProvider;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  checkedAt: number;
  details?: string;
}

// ─── Provider Catalog ──────────────────────

export const INTEGRATION_CATALOG: IntegrationConfig[] = [
  {
    provider: "slack",
    name: "Slack",
    description: "Send agent alerts, receive commands via Slack channels",
    authType: "oauth2",
    category: "messaging",
    requiredFields: ["workspace", "channel", "bot_token"],
    optionalFields: ["signing_secret"],
    webhookEvents: ["agent.completed", "agent.failed", "alert.triggered", "approval.required"],
  },
  {
    provider: "teams",
    name: "Microsoft Teams",
    description: "Agent notifications and commands in Teams channels",
    authType: "oauth2",
    category: "messaging",
    requiredFields: ["tenant_id", "client_id", "client_secret"],
    optionalFields: ["channel_id"],
    webhookEvents: ["agent.completed", "agent.failed", "alert.triggered"],
  },
  {
    provider: "salesforce",
    name: "Salesforce",
    description: "Sync CRM data for agent analysis and automation",
    authType: "oauth2",
    category: "crm",
    requiredFields: ["instance_url", "client_id", "client_secret", "refresh_token"],
    optionalFields: ["api_version"],
  },
  {
    provider: "hubspot",
    name: "HubSpot",
    description: "Marketing automation and contact management",
    authType: "api_key",
    category: "crm",
    requiredFields: ["api_key"],
    optionalFields: ["portal_id"],
  },
  {
    provider: "pagerduty",
    name: "PagerDuty",
    description: "Incident escalation for critical agent alerts",
    authType: "api_key",
    category: "monitoring",
    requiredFields: ["api_key", "service_id"],
    optionalFields: ["escalation_policy_id"],
    webhookEvents: ["alert.critical", "agent.failed"],
  },
  {
    provider: "datadog",
    name: "Datadog",
    description: "Agent metrics, APM traces, and log forwarding",
    authType: "api_key",
    category: "monitoring",
    requiredFields: ["api_key", "app_key", "site"],
    optionalFields: ["environment", "service_name"],
  },
  {
    provider: "github",
    name: "GitHub",
    description: "Trigger agents from GitHub events, create issues from findings",
    authType: "oauth2",
    category: "devtools",
    requiredFields: ["token", "owner", "repo"],
    optionalFields: ["webhook_secret"],
    webhookEvents: ["push", "pull_request", "issue"],
  },
  {
    provider: "jira",
    name: "Jira",
    description: "Create tickets from agent findings and alerts",
    authType: "api_key",
    category: "devtools",
    requiredFields: ["host", "email", "api_token", "project_key"],
    optionalFields: ["issue_type"],
  },
  {
    provider: "aws_s3",
    name: "AWS S3",
    description: "Store agent reports, logs, and exports",
    authType: "api_key",
    category: "storage",
    requiredFields: ["access_key_id", "secret_access_key", "bucket", "region"],
    optionalFields: ["prefix", "encryption"],
  },
  {
    provider: "twilio",
    name: "Twilio",
    description: "SMS/voice alerts for critical agent events",
    authType: "api_key",
    category: "communication",
    requiredFields: ["account_sid", "auth_token", "from_number"],
    optionalFields: ["to_numbers"],
  },
  {
    provider: "sendgrid",
    name: "SendGrid",
    description: "Email notifications and report delivery",
    authType: "api_key",
    category: "communication",
    requiredFields: ["api_key", "from_email"],
    optionalFields: ["from_name", "template_ids"],
  },
  {
    provider: "webhook",
    name: "Custom Webhook",
    description: "Send events to any HTTP endpoint",
    authType: "webhook_url",
    category: "devtools",
    requiredFields: ["url"],
    optionalFields: ["secret", "headers"],
    webhookEvents: ["*"],
  },
];

// ─── Integration Manager ───────────────────

export class IntegrationManager {
  private connections = new Map<string, ConnectedIntegration>();
  private webhookLog: WebhookEvent[] = [];

  /**
   * Connect a new integration
   */
  connect(
    tenantId: string,
    provider: IntegrationProvider,
    credentials: Record<string, string>,
    config: Record<string, unknown> = {}
  ): ConnectedIntegration {
    // Validate required fields
    const catalog = INTEGRATION_CATALOG.find((c) => c.provider === provider);
    if (!catalog) throw new Error(`Unknown provider: ${provider}`);

    const missing = catalog.requiredFields.filter((f) => !credentials[f]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    const connection: ConnectedIntegration = {
      id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      provider,
      name: catalog.name,
      status: "connected",
      credentials, // In production: encrypt with AES-256-GCM before storing
      config,
      lastHealthCheck: Date.now(),
      lastSyncAt: null,
      errorMessage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  /**
   * Disconnect an integration
   */
  disconnect(integrationId: string, tenantId: string): boolean {
    const conn = this.connections.get(integrationId);
    if (!conn || conn.tenantId !== tenantId) return false;

    conn.status = "disconnected";
    conn.credentials = {}; // Wipe credentials on disconnect
    conn.updatedAt = Date.now();
    return true;
  }

  /**
   * List all integrations for a tenant
   */
  listConnections(tenantId: string): ConnectedIntegration[] {
    return Array.from(this.connections.values())
      .filter((c) => c.tenantId === tenantId);
  }

  /**
   * Get integration by ID
   */
  getConnection(integrationId: string, tenantId: string): ConnectedIntegration | null {
    const conn = this.connections.get(integrationId);
    if (!conn || conn.tenantId !== tenantId) return null;
    return conn;
  }

  /**
   * Update integration config
   */
  updateConfig(
    integrationId: string,
    tenantId: string,
    config: Record<string, unknown>
  ): ConnectedIntegration | null {
    const conn = this.connections.get(integrationId);
    if (!conn || conn.tenantId !== tenantId) return null;

    conn.config = { ...conn.config, ...config };
    conn.updatedAt = Date.now();
    return conn;
  }

  /**
   * Health check an integration
   */
  healthCheck(integrationId: string, tenantId: string): IntegrationHealthCheck | null {
    const conn = this.connections.get(integrationId);
    if (!conn || conn.tenantId !== tenantId) return null;

    // Simulate health check (in production: actually ping the service)
    const latencyMs = 50 + Math.random() * 200;
    const isHealthy = conn.status === "connected" && Math.random() > 0.05;

    conn.lastHealthCheck = Date.now();
    conn.updatedAt = Date.now();

    if (!isHealthy) {
      conn.status = "error";
      conn.errorMessage = "Health check failed — connection timed out";
    }

    return {
      provider: conn.provider,
      status: isHealthy ? "healthy" : "down",
      latencyMs: Math.round(latencyMs),
      checkedAt: Date.now(),
      details: isHealthy ? "All systems operational" : conn.errorMessage || undefined,
    };
  }

  /**
   * Send a webhook event to connected integrations
   */
  async dispatchEvent(
    tenantId: string,
    event: string,
    payload: Record<string, unknown>
  ): Promise<WebhookEvent[]> {
    const connections = this.listConnections(tenantId)
      .filter((c) => c.status === "connected");

    const dispatched: WebhookEvent[] = [];

    for (const conn of connections) {
      const catalog = INTEGRATION_CATALOG.find((c) => c.provider === conn.provider);
      const subscribedEvents = catalog?.webhookEvents || [];

      // Check if this integration subscribes to this event
      if (!subscribedEvents.includes("*") && !subscribedEvents.includes(event)) {
        continue;
      }

      const webhookEvent: WebhookEvent = {
        id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        integrationId: conn.id,
        tenantId,
        provider: conn.provider,
        event,
        payload,
        status: "delivered", // Simulated — in production would actually POST
        attempts: 1,
        createdAt: Date.now(),
      };

      this.webhookLog.push(webhookEvent);
      dispatched.push(webhookEvent);

      // In production: POST to the integration endpoint
      // await this.sendToProvider(conn, event, payload);
    }

    return dispatched;
  }

  /**
   * Send a message via a messaging integration (Slack/Teams)
   */
  async sendMessage(
    integrationId: string,
    tenantId: string,
    message: { text: string; channel?: string; severity?: "info" | "warning" | "critical" }
  ): Promise<{ sent: boolean; messageId: string }> {
    const conn = this.connections.get(integrationId);
    if (!conn || conn.tenantId !== tenantId || conn.status !== "connected") {
      return { sent: false, messageId: "" };
    }

    // In production: call Slack/Teams API
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[Integration] ${conn.provider}: ${message.text}`);

    return { sent: true, messageId };
  }

  /**
   * Get webhook event log for a tenant
   */
  getWebhookLog(tenantId: string, limit = 50): WebhookEvent[] {
    return this.webhookLog
      .filter((e) => e.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get integration catalog
   */
  getCatalog(): IntegrationConfig[] {
    return INTEGRATION_CATALOG;
  }
}

// ─── Singleton ──────────────────────────────

let integrationManager: IntegrationManager | null = null;

export function getIntegrationManager(): IntegrationManager {
  if (!integrationManager) {
    integrationManager = new IntegrationManager();
  }
  return integrationManager;
}
