/**
 * OpenAPI Specification Generator
 *
 * Auto-generates Swagger/OpenAPI 3.1 docs from registered API routes.
 * Supports live "Try It" endpoints, code samples, and SDK generation.
 */

// ─── Types ─────────────────────────────────

export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  summary: string;
  description: string;
  tags: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: Record<string, ApiResponseDef>;
  security: string[];
  rateLimit?: { requests: number; windowSeconds: number };
}

export interface ApiParameter {
  name: string;
  in: "query" | "path" | "header";
  required: boolean;
  description: string;
  schema: SchemaObject;
}

export interface ApiRequestBody {
  required: boolean;
  content: Record<string, { schema: SchemaObject }>;
}

export interface ApiResponseDef {
  description: string;
  content?: Record<string, { schema: SchemaObject }>;
}

export interface SchemaObject {
  type: string;
  properties?: Record<string, SchemaObject & { description?: string }>;
  required?: string[];
  items?: SchemaObject;
  enum?: string[];
  example?: unknown;
  description?: string;
}

export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description: string; contact: { email: string }; license: { name: string } };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: { securitySchemes: Record<string, unknown>; schemas: Record<string, SchemaObject> };
}

export interface CodeSample {
  language: string;
  label: string;
  code: string;
}

// ─── Engine ────────────────────────────────

export class OpenApiEngine {
  private endpoints: ApiEndpoint[] = [];
  private schemas = new Map<string, SchemaObject>();

  constructor() {
    this.registerPlatformEndpoints();
  }

  /**
   * Get the full OpenAPI 3.1 spec
   */
  getSpec(baseUrl = "https://api.agentplatform.com"): OpenApiSpec {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const ep of this.endpoints) {
      if (!paths[ep.path]) paths[ep.path] = {};

      const operation: Record<string, unknown> = {
        summary: ep.summary,
        description: ep.description,
        tags: ep.tags,
        security: ep.security.map((s) => ({ [s]: [] })),
        responses: {},
      };

      if (ep.parameters?.length) operation.parameters = ep.parameters;
      if (ep.requestBody) operation.requestBody = ep.requestBody;

      for (const [code, resp] of Object.entries(ep.responses)) {
        (operation.responses as Record<string, unknown>)[code] = resp;
      }

      paths[ep.path][ep.method.toLowerCase()] = operation;
    }

    return {
      openapi: "3.1.0",
      info: {
        title: "Swifter AI Platform API",
        version: "1.0.0",
        description: "Multi-tenant AI agent platform with orchestration, marketplace, governance, and enterprise features.",
        contact: { email: "support@agentplatform.com" },
        license: { name: "Proprietary" },
      },
      servers: [
        { url: baseUrl, description: "Production" },
        { url: "https://sandbox.agentplatform.com", description: "Sandbox" },
      ],
      tags: this.getTags(),
      paths,
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key", description: "API key from your dashboard" },
          BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT access token" },
        },
        schemas: Object.fromEntries(this.schemas),
      },
    };
  }

  /**
   * Generate code samples for an endpoint
   */
  getCodeSamples(path: string, method: string): CodeSample[] {
    const ep = this.endpoints.find((e) => e.path === path && e.method === method.toUpperCase());
    if (!ep) return [];

    const bodyStr = ep.requestBody ? JSON.stringify(this.getExampleBody(ep), null, 2) : "";
    const samples: CodeSample[] = [];

    // cURL
    let curl = `curl -X ${ep.method} "https://api.agentplatform.com${ep.path}"`;
    curl += ` \\\n  -H "X-API-Key: YOUR_API_KEY"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    if (bodyStr) curl += ` \\\n  -d '${bodyStr}'`;
    samples.push({ language: "bash", label: "cURL", code: curl });

    // Python
    let python = `import requests\n\nresponse = requests.${ep.method.toLowerCase()}(\n    "https://api.agentplatform.com${ep.path}",\n    headers={"X-API-Key": "YOUR_API_KEY"},`;
    if (bodyStr) python += `\n    json=${bodyStr},`;
    python += `\n)\nprint(response.json())`;
    samples.push({ language: "python", label: "Python", code: python });

    // TypeScript
    let ts = `const response = await fetch("https://api.agentplatform.com${ep.path}", {\n  method: "${ep.method}",\n  headers: {\n    "X-API-Key": "YOUR_API_KEY",\n    "Content-Type": "application/json",\n  },`;
    if (bodyStr) ts += `\n  body: JSON.stringify(${bodyStr}),`;
    ts += `\n});\nconst data = await response.json();`;
    samples.push({ language: "typescript", label: "TypeScript", code: ts });

    return samples;
  }

  /**
   * List all endpoint summaries (for docs sidebar)
   */
  listEndpoints(): { path: string; method: string; summary: string; tags: string[] }[] {
    return this.endpoints.map((e) => ({ path: e.path, method: e.method, summary: e.summary, tags: e.tags }));
  }

  /**
   * Get endpoints by tag
   */
  getEndpointsByTag(tag: string): ApiEndpoint[] {
    return this.endpoints.filter((e) => e.tags.includes(tag));
  }

  /**
   * Register a custom endpoint
   */
  registerEndpoint(ep: ApiEndpoint): void {
    this.endpoints.push(ep);
  }

  // ─── Private ─────────────────────────────

  private getTags(): { name: string; description: string }[] {
    return [
      { name: "Agents", description: "Create, configure, and manage AI agents" },
      { name: "Orchestration", description: "Multi-agent DAG workflows" },
      { name: "Marketplace", description: "Discover and deploy agent templates" },
      { name: "Governance", description: "AI compliance, model cards, and risk assessment" },
      { name: "Drift Detection", description: "Behavioral fingerprinting and anomaly detection" },
      { name: "Economics", description: "ROI calculation and cost analysis" },
      { name: "Prompt Versioning", description: "Version control for system prompts" },
      { name: "Integrations", description: "Third-party service connections" },
      { name: "Billing", description: "Subscriptions and usage tracking" },
      { name: "Onboarding", description: "Tenant provisioning and setup" },
      { name: "Webhooks", description: "Event-driven notifications" },
    ];
  }

  private getExampleBody(ep: ApiEndpoint): Record<string, unknown> {
    if (!ep.requestBody) return {};
    const schema = Object.values(ep.requestBody.content)[0]?.schema;
    if (!schema?.properties) return {};
    const example: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      example[key] = prop.example ?? (prop.type === "string" ? "" : prop.type === "number" ? 0 : null);
    }
    return example;
  }

  private registerPlatformEndpoints(): void {
    const successResponse = { "200": { description: "Success", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" }, timestamp: { type: "string" } } } } } } };

    this.endpoints = [
      // Agents
      { path: "/api/agents", method: "GET", summary: "List agents", description: "Get all agents for the authenticated tenant", tags: ["Agents"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/agents", method: "POST", summary: "Create agent", description: "Create a new AI agent with configuration", tags: ["Agents"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string", example: "Fraud Monitor" }, type: { type: "string", example: "FRAUD_MONITORING" }, systemPrompt: { type: "string", example: "You monitor transactions for fraud." } }, required: ["name", "type"] } } } }, responses: { "201": { description: "Agent created" } } },

      // NL Pipeline
      { path: "/api/nl-pipeline", method: "POST", summary: "Generate agent from natural language", description: "Convert a plain-text description into a fully configured agent", tags: ["Agents"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", example: "generate" }, description: { type: "string", example: "Monitor transactions over $10,000 for fraud and alert on Slack" } } } } } }, responses: { "201": { description: "Agent config generated" } } },

      // Orchestration
      { path: "/api/orchestration", method: "GET", summary: "List workflows", description: "Get all multi-agent workflows", tags: ["Orchestration"], security: ["ApiKeyAuth"], parameters: [{ name: "view", in: "query", required: false, description: "View type: workflows, templates, topology", schema: { type: "string", enum: ["workflows", "templates", "topology"] } }], responses: successResponse },
      { path: "/api/orchestration", method: "POST", summary: "Manage workflows", description: "Create, start, pause, or cancel workflows", tags: ["Orchestration"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["create", "create_from_template", "start", "pause", "cancel"], example: "create_from_template" } } } } } }, responses: { "201": { description: "Workflow created" } } },

      // Marketplace
      { path: "/api/marketplace", method: "GET", summary: "Browse marketplace", description: "Discover agent templates", tags: ["Marketplace"], security: ["ApiKeyAuth"], parameters: [{ name: "view", in: "query", required: false, description: "View type", schema: { type: "string", enum: ["featured", "listing", "my_listings", "my_installs"] } }], responses: successResponse },
      { path: "/api/marketplace", method: "POST", summary: "Marketplace actions", description: "Publish, install, review, or search agent templates", tags: ["Marketplace"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["publish", "install", "review", "search"] } } } } } }, responses: { "201": { description: "Action completed" } } },

      // Governance
      { path: "/api/governance", method: "GET", summary: "Get compliance data", description: "Model cards, decision lineage, compliance reports", tags: ["Governance"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/governance", method: "POST", summary: "Governance actions", description: "Generate model cards, record decisions, create compliance reports", tags: ["Governance"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["generate_model_card", "record_decision", "compliance_report"] } } } } } }, responses: { "201": { description: "Created" } } },

      // Drift
      { path: "/api/drift", method: "GET", summary: "Get drift reports", description: "Behavioral fingerprints and drift events", tags: ["Drift Detection"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/drift", method: "POST", summary: "Record & manage drift", description: "Record execution samples, acknowledge drift, reset baselines", tags: ["Drift Detection"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["record_sample", "acknowledge_drift", "reset_baseline"] } } } } } }, responses: { "201": { description: "Recorded" } } },

      // Economics
      { path: "/api/economics", method: "GET", summary: "Get ROI reports", description: "Past ROI reports for tenant", tags: ["Economics"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/economics", method: "POST", summary: "Calculate ROI", description: "Generate ROI report or get benchmarks", tags: ["Economics"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["calculate_roi", "benchmarks"] } } } } } }, responses: { "201": { description: "Report generated" } } },

      // Prompt Versioning
      { path: "/api/prompt-versioning", method: "GET", summary: "Get prompt history", description: "Version history, diffs, and branches", tags: ["Prompt Versioning"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/prompt-versioning", method: "POST", summary: "Manage prompt versions", description: "Commit, rollback, tag, branch, or compare prompts", tags: ["Prompt Versioning"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["commit", "rollback", "tag", "create_branch", "compare"] } } } } } }, responses: { "201": { description: "Version created" } } },

      // Billing
      { path: "/api/billing", method: "GET", summary: "Get billing info", description: "Subscription, usage, and invoices", tags: ["Billing"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/billing", method: "POST", summary: "Billing actions", description: "Subscribe, change plan, cancel, track usage", tags: ["Billing"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["subscribe", "change_plan", "cancel", "track_usage"] } } } } } }, responses: successResponse },

      // Integrations
      { path: "/api/integrations", method: "GET", summary: "List integrations", description: "Connected services and available providers", tags: ["Integrations"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/integrations", method: "POST", summary: "Manage integrations", description: "Connect, disconnect, health check, send messages", tags: ["Integrations"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["connect", "disconnect", "health_check", "send_message"] } } } } } }, responses: successResponse },

      // Onboarding
      { path: "/api/onboarding", method: "POST", summary: "Tenant onboarding", description: "Signup, generate API keys, get quickstart guide", tags: ["Onboarding"], security: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["signup", "generate_api_key", "quickstart", "change_plan"] } } } } } }, responses: { "201": { description: "Tenant created" } } },

      // Webhooks
      { path: "/api/webhooks", method: "GET", summary: "List webhooks", description: "Get webhook subscriptions and delivery logs", tags: ["Webhooks"], security: ["ApiKeyAuth"], responses: successResponse },
      { path: "/api/webhooks", method: "POST", summary: "Manage webhooks", description: "Subscribe, unsubscribe, test, replay webhooks", tags: ["Webhooks"], security: ["ApiKeyAuth"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["subscribe", "unsubscribe", "test", "replay"] } } } } } }, responses: { "201": { description: "Webhook created" } } },
    ];
  }
}

// ─── Singleton ─────────────────────────────

let engine: OpenApiEngine | null = null;
export function getOpenApiEngine(): OpenApiEngine {
  if (!engine) engine = new OpenApiEngine();
  return engine;
}
