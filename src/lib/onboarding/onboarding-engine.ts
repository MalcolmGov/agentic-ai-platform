/**
 * Self-Service Onboarding & Tenant Provisioning
 *
 * Signup flow, API key generation, quickstart wizard,
 * plan-based limits, and guided setup checklists.
 */

import { syncToDb, hydrateFromDb, isPersistenceEnabled, type SyncConfig } from '@/lib/db/persistence-sync';

// ─── Types ─────────────────────────────────

export type PlanTier = "starter" | "professional" | "enterprise";
export type OnboardingStep = "account_created" | "api_key_generated" | "first_agent_created" | "first_execution" | "integration_connected" | "team_invited" | "billing_configured";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: PlanTier;
  status: "active" | "suspended" | "trial";
  trialEndsAt: number | null;
  limits: PlanLimits;
  apiKeys: ApiKey[];
  onboarding: OnboardingProgress;
  settings: TenantSettings;
  createdAt: number;
  updatedAt: number;
}

export interface PlanLimits {
  maxAgents: number;
  maxExecutionsPerMonth: number;
  maxTeamMembers: number;
  maxWorkflows: number;
  maxIntegrations: number;
  maxStorageMb: number;
  features: string[];
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: string[];
  lastUsedAt: number | null;
  expiresAt: number | null;
  createdAt: number;
  revoked: boolean;
}

export interface OnboardingProgress {
  completedSteps: OnboardingStep[];
  currentStep: OnboardingStep;
  percentComplete: number;
  startedAt: number;
  completedAt: number | null;
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  notificationEmail: string;
  webhookUrl: string | null;
}

export interface SignupRequest {
  companyName: string;
  ownerEmail: string;
  plan: PlanTier;
  password: string;
}

export interface QuickstartGuide {
  steps: QuickstartStep[];
  estimatedMinutes: number;
  planTier: PlanTier;
}

export interface QuickstartStep {
  id: string;
  title: string;
  description: string;
  action: string;
  apiEndpoint: string;
  samplePayload: Record<string, unknown>;
  completed: boolean;
}

// ─── Plan Definitions ──────────────────────

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    maxAgents: 3, maxExecutionsPerMonth: 1000, maxTeamMembers: 2,
    maxWorkflows: 1, maxIntegrations: 2, maxStorageMb: 100,
    features: ["basic_agents", "api_access", "community_support"],
  },
  professional: {
    maxAgents: 25, maxExecutionsPerMonth: 50000, maxTeamMembers: 10,
    maxWorkflows: 10, maxIntegrations: 10, maxStorageMb: 5000,
    features: ["basic_agents", "api_access", "orchestration", "marketplace", "drift_detection", "priority_support", "prompt_versioning"],
  },
  enterprise: {
    maxAgents: -1, maxExecutionsPerMonth: -1, maxTeamMembers: -1,
    maxWorkflows: -1, maxIntegrations: -1, maxStorageMb: -1,
    features: ["basic_agents", "api_access", "orchestration", "marketplace", "drift_detection", "priority_support", "prompt_versioning", "sso", "white_label", "governance", "custom_sla", "dedicated_support", "industry_packs"],
  },
};

// ─── Engine ────────────────────────────────

export class OnboardingEngine {
  private tenants = new Map<string, Tenant>();
  private emailIndex = new Map<string, string>(); // email → tenantId

  /**
   * Register a new tenant
   */
  signup(req: SignupRequest): { tenant: Tenant; apiKey: string } {
    if (this.emailIndex.has(req.ownerEmail)) {
      throw new Error("Email already registered");
    }

    const now = Date.now();
    const slug = req.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const tenantId = `tenant_${now}_${Math.random().toString(36).slice(2, 6)}`;

    // Generate first API key
    const rawKey = `ak_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const apiKey: ApiKey = {
      id: `key_${now}`,
      name: "Default API Key",
      keyPrefix: rawKey.slice(0, 8),
      keyHash: this.hashKey(rawKey),
      permissions: ["agent:read", "agent:write", "agent:execute"],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: now,
      revoked: false,
    };

    const tenant: Tenant = {
      id: tenantId,
      name: req.companyName,
      slug,
      ownerEmail: req.ownerEmail,
      plan: req.plan,
      status: req.plan === "starter" ? "active" : "trial",
      trialEndsAt: req.plan !== "starter" ? now + 14 * 86_400_000 : null,
      limits: PLAN_LIMITS[req.plan],
      apiKeys: [apiKey],
      onboarding: {
        completedSteps: ["account_created"],
        currentStep: "api_key_generated",
        percentComplete: 14,
        startedAt: now,
        completedAt: null,
      },
      settings: {
        timezone: "UTC",
        locale: "en-US",
        notificationEmail: req.ownerEmail,
        webhookUrl: null,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.tenants.set(tenantId, tenant);
    this.emailIndex.set(req.ownerEmail, tenantId);
    this.syncTenantToDb(tenant);

    return { tenant, apiKey: rawKey };
  }

  /**
   * Generate a new API key for a tenant
   */
  generateApiKey(tenantId: string, name: string, permissions: string[]): { key: ApiKey; rawKey: string } | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    const rawKey = `ak_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const key: ApiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      keyPrefix: rawKey.slice(0, 8),
      keyHash: this.hashKey(rawKey),
      permissions,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: Date.now(),
      revoked: false,
    };

    tenant.apiKeys.push(key);
    this.advanceOnboarding(tenant, "api_key_generated");
    return { key, rawKey };
  }

  /**
   * Revoke an API key
   */
  revokeApiKey(tenantId: string, keyId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    const key = tenant.apiKeys.find((k) => k.id === keyId);
    if (!key) return false;
    key.revoked = true;
    return true;
  }

  /**
   * Advance onboarding progress
   */
  completeOnboardingStep(tenantId: string, step: OnboardingStep): OnboardingProgress | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;
    return this.advanceOnboarding(tenant, step);
  }

  /**
   * Get quickstart guide based on plan
   */
  getQuickstart(tenantId: string): QuickstartGuide | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    const steps: QuickstartStep[] = [
      {
        id: "create_agent", title: "Create Your First Agent",
        description: "Deploy an AI agent using the API or natural language pipeline",
        action: "POST", apiEndpoint: "/api/nl-pipeline",
        samplePayload: { action: "generate", description: "Monitor transactions over $10,000 for fraud and alert on Slack" },
        completed: tenant.onboarding.completedSteps.includes("first_agent_created"),
      },
      {
        id: "run_agent", title: "Run Your First Execution",
        description: "Execute your agent and see results in real-time",
        action: "POST", apiEndpoint: "/api/agents/execute",
        samplePayload: { agentId: "your_agent_id", input: { message: "Review this transaction" } },
        completed: tenant.onboarding.completedSteps.includes("first_execution"),
      },
      {
        id: "connect_integration", title: "Connect an Integration",
        description: "Connect Slack, Teams, or another tool for agent notifications",
        action: "POST", apiEndpoint: "/api/integrations",
        samplePayload: { action: "connect", provider: "slack", credentials: { webhookUrl: "https://hooks.slack.com/..." } },
        completed: tenant.onboarding.completedSteps.includes("integration_connected"),
      },
    ];

    if (tenant.plan !== "starter") {
      steps.push({
        id: "invite_team", title: "Invite Your Team",
        description: "Add team members to collaborate on agents",
        action: "POST", apiEndpoint: "/api/team/invite",
        samplePayload: { email: "colleague@company.com", role: "editor" },
        completed: tenant.onboarding.completedSteps.includes("team_invited"),
      });
    }

    return { steps, estimatedMinutes: steps.length * 3, planTier: tenant.plan };
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | null {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get tenant by email
   */
  getTenantByEmail(email: string): Tenant | null {
    const id = this.emailIndex.get(email);
    return id ? this.tenants.get(id) || null : null;
  }

  /**
   * Upgrade/downgrade plan
   */
  changePlan(tenantId: string, newPlan: PlanTier): Tenant | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;
    tenant.plan = newPlan;
    tenant.limits = PLAN_LIMITS[newPlan];
    tenant.updatedAt = Date.now();
    this.syncTenantToDb(tenant);
    if (newPlan === "enterprise") {
      tenant.status = "active";
      tenant.trialEndsAt = null;
    }
    return tenant;
  }

  /**
   * Check if tenant is within plan limits
   */
  checkLimits(tenantId: string, resource: keyof PlanLimits, currentUsage: number): { allowed: boolean; limit: number; usage: number; remaining: number } {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return { allowed: false, limit: 0, usage: currentUsage, remaining: 0 };
    const limit = tenant.limits[resource] as number;
    if (limit === -1) return { allowed: true, limit: -1, usage: currentUsage, remaining: -1 }; // unlimited
    return { allowed: currentUsage < limit, limit, usage: currentUsage, remaining: Math.max(0, limit - currentUsage) };
  }

  /**
   * List all tenants (admin)
   */
  listTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Hydrate tenants from database on startup
   */
  async hydrate(): Promise<number> {
    if (!isPersistenceEnabled()) return 0;
    const records = await hydrateFromDb<any>({ model: 'tenant' });
    for (const record of records) {
      if (this.tenants.has(record.id)) continue;
      const tenant: Tenant = {
        id: record.id,
        name: record.name,
        slug: record.slug,
        ownerEmail: '', // Not stored in DB
        plan: record.plan.toLowerCase() as PlanTier,
        status: record.status.toLowerCase() as any,
        trialEndsAt: null,
        limits: PLAN_LIMITS[record.plan.toLowerCase() as PlanTier] || PLAN_LIMITS.starter,
        apiKeys: [],
        onboarding: {
          completedSteps: ['account_created'],
          currentStep: 'api_key_generated',
          percentComplete: 14,
          startedAt: record.createdAt.getTime(),
          completedAt: null,
        },
        settings: {
          timezone: 'UTC',
          locale: 'en-US',
          notificationEmail: '',
          webhookUrl: null,
        },
        createdAt: record.createdAt.getTime(),
        updatedAt: record.updatedAt.getTime(),
      };
      this.tenants.set(tenant.id, tenant);
    }
    return records.length;
  }

  // ─── Private ─────────────────────────────

  private async syncTenantToDb(tenant: Tenant): Promise<void> {
    if (!isPersistenceEnabled()) return;
    try {
      await syncToDb(
        { model: 'tenant', excludeFields: [] },
        tenant.id,
        {
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan.toUpperCase(),
          status: tenant.status.toUpperCase(),
          createdAt: new Date(tenant.createdAt),
          updatedAt: new Date(tenant.updatedAt),
        }
      );
    } catch {
      // Non-blocking — in-memory is source of truth
    }
  }

  private advanceOnboarding(tenant: Tenant, step: OnboardingStep): OnboardingProgress {
    if (!tenant.onboarding.completedSteps.includes(step)) {
      tenant.onboarding.completedSteps.push(step);
    }
    const allSteps: OnboardingStep[] = ["account_created", "api_key_generated", "first_agent_created", "first_execution", "integration_connected", "team_invited", "billing_configured"];
    tenant.onboarding.percentComplete = Math.round((tenant.onboarding.completedSteps.length / allSteps.length) * 100);
    const nextIdx = allSteps.findIndex((s) => !tenant.onboarding.completedSteps.includes(s));
    tenant.onboarding.currentStep = nextIdx >= 0 ? allSteps[nextIdx] : allSteps[allSteps.length - 1];
    if (tenant.onboarding.percentComplete === 100) {
      tenant.onboarding.completedAt = Date.now();
    }
    tenant.updatedAt = Date.now();
    return tenant.onboarding;
  }

  private hashKey(key: string): string {
    // Simple hash for demo — production would use bcrypt/argon2
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }
}

// ─── Singleton ─────────────────────────────

let engine: OnboardingEngine | null = null;
export function getOnboardingEngine(): OnboardingEngine {
  if (!engine) engine = new OnboardingEngine();
  return engine;
}
