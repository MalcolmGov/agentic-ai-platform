/**
 * Agent Cloning, Forking & Version Control
 *
 * Deep-copy agents, track version history, rollback,
 * and diff configurations between versions.
 */

// ═══ Types ═══

export interface AgentVersion {
  id: string;
  agentId: string;
  version: number;
  config: AgentSnapshot;
  changelog: string;
  createdAt: number;
  createdBy: string;
}

export interface AgentSnapshot {
  name: string;
  type: string;
  llmProvider: string;
  llmModel: string;
  systemPrompt: string;
  tools: string[];
  parameters: Record<string, unknown>;
  schedule?: string;
}

export interface ConfigDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "changed";
}

export interface CloneResult {
  originalAgentId: string;
  newAgentId: string;
  newName: string;
  tenantId: string;
  clonedAt: number;
}

// ═══ Agent Clone Manager ═══

export class AgentCloneManager {
  private versions: Map<string, AgentVersion[]> = new Map();
  private agentConfigs: Map<string, AgentSnapshot> = new Map();

  /**
   * Clone an agent with a new name
   */
  cloneAgent(agentId: string, newName: string, tenantId: string): CloneResult {
    const config = this.agentConfigs.get(agentId);
    if (!config) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const newAgentId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const clonedConfig: AgentSnapshot = { ...config, name: newName };
    this.agentConfigs.set(newAgentId, clonedConfig);

    // Create initial version for clone
    this.createVersion(newAgentId, clonedConfig, `Cloned from ${config.name}`, "system");

    return {
      originalAgentId: agentId,
      newAgentId,
      newName,
      tenantId,
      clonedAt: Date.now(),
    };
  }

  /**
   * Fork an agent with modifications
   */
  forkAgent(agentId: string, modifications: Partial<AgentSnapshot>, tenantId: string): CloneResult {
    const config = this.agentConfigs.get(agentId);
    if (!config) throw new Error(`Agent ${agentId} not found`);

    const newAgentId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const forkedConfig: AgentSnapshot = { ...config, ...modifications };
    this.agentConfigs.set(newAgentId, forkedConfig);

    const changes = Object.keys(modifications).join(", ");
    this.createVersion(newAgentId, forkedConfig, `Forked from ${config.name} with changes: ${changes}`, "system");

    return {
      originalAgentId: agentId,
      newAgentId,
      newName: forkedConfig.name,
      tenantId,
      clonedAt: Date.now(),
    };
  }

  /**
   * Save a version snapshot
   */
  createVersion(agentId: string, config: AgentSnapshot, changelog: string, createdBy: string): AgentVersion {
    const versions = this.versions.get(agentId) || [];
    const version: AgentVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId,
      version: versions.length + 1,
      config: { ...config },
      changelog,
      createdAt: Date.now(),
      createdBy,
    };
    versions.push(version);
    this.versions.set(agentId, versions);
    this.agentConfigs.set(agentId, { ...config });
    return version;
  }

  /**
   * List all versions for an agent
   */
  listVersions(agentId: string): AgentVersion[] {
    return (this.versions.get(agentId) || []).sort((a, b) => b.version - a.version);
  }

  /**
   * Rollback to a previous version
   */
  rollback(agentId: string, versionId: string): AgentVersion | null {
    const versions = this.versions.get(agentId) || [];
    const target = versions.find((v) => v.id === versionId);
    if (!target) return null;

    const rollbackVersion = this.createVersion(
      agentId,
      target.config,
      `Rolled back to version ${target.version}`,
      "system"
    );

    return rollbackVersion;
  }

  /**
   * Diff two versions
   */
  diffVersions(versionIdA: string, versionIdB: string): ConfigDiff[] {
    let versionA: AgentVersion | null = null;
    let versionB: AgentVersion | null = null;

    this.versions.forEach((versions) => {
      versions.forEach((v) => {
        if (v.id === versionIdA) versionA = v;
        if (v.id === versionIdB) versionB = v;
      });
    });

    if (!versionA || !versionB) return [];

    const configA = (versionA as AgentVersion).config;
    const configB = (versionB as AgentVersion).config;
    const diffs: ConfigDiff[] = [];

    const allKeys = new Set([...Object.keys(configA), ...Object.keys(configB)]);
    allKeys.forEach((key) => {
      const oldVal = (configA as unknown as Record<string, unknown>)[key];
      const newVal = (configB as unknown as Record<string, unknown>)[key];

      if (oldVal === undefined && newVal !== undefined) {
        diffs.push({ field: key, oldValue: undefined, newValue: newVal, type: "added" });
      } else if (oldVal !== undefined && newVal === undefined) {
        diffs.push({ field: key, oldValue: oldVal, newValue: undefined, type: "removed" });
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({ field: key, oldValue: oldVal, newValue: newVal, type: "changed" });
      }
    });

    return diffs;
  }

  /**
   * Get current config
   */
  getConfig(agentId: string): AgentSnapshot | undefined {
    return this.agentConfigs.get(agentId);
  }

  /**
   * Register an existing agent config
   */
  registerAgent(agentId: string, config: AgentSnapshot): void {
    this.agentConfigs.set(agentId, config);
    if (!this.versions.has(agentId)) {
      this.createVersion(agentId, config, "Initial version", "system");
    }
  }

  /**
   * Get all managed agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agentConfigs.keys());
  }
}

// ═══ Singleton ═══

let _cloneManager: AgentCloneManager | null = null;

export function getCloneManager(): AgentCloneManager {
  if (!_cloneManager) {
    _cloneManager = new AgentCloneManager();
    seedDemoVersions(_cloneManager);
  }
  return _cloneManager;
}

function seedDemoVersions(manager: AgentCloneManager): void {
  const agents = [
    { id: "agent_fraud_001", name: "Fraud Monitoring Agent", type: "FRAUD_MONITORING", model: "gpt-4o", prompt: "You are a fraud detection specialist. Analyze transactions for suspicious patterns." },
    { id: "agent_compliance_001", name: "Compliance Agent", type: "COMPLIANCE", model: "gpt-4o", prompt: "You are a compliance officer. Monitor regulatory requirements and flag violations." },
    { id: "agent_support_001", name: "Customer Support Agent", type: "CUSTOMER_SUPPORT", model: "gpt-4o-mini", prompt: "You are a helpful customer support agent. Resolve issues quickly and empathetically." },
    { id: "agent_reporting_001", name: "Reporting Agent", type: "REPORTING", model: "gpt-4o", prompt: "You generate business reports with data analysis and actionable recommendations." },
  ];

  agents.forEach((a) => {
    manager.registerAgent(a.id, {
      name: a.name,
      type: a.type,
      llmProvider: "openai",
      llmModel: a.model,
      systemPrompt: a.prompt,
      tools: ["query_database", "send_alert", "generate_report"],
      parameters: { temperature: 0.3, maxTokens: 2000 },
    });

    // Add a couple more versions for demo
    manager.createVersion(a.id, {
      name: a.name,
      type: a.type,
      llmProvider: "openai",
      llmModel: a.model,
      systemPrompt: a.prompt + " Be concise in your responses.",
      tools: ["query_database", "send_alert", "generate_report"],
      parameters: { temperature: 0.2, maxTokens: 1500 },
    }, "Reduced verbosity and temperature for more consistent output", "admin@acme.com");
  });
}
