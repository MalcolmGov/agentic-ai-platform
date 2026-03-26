/**
 * Human-in-the-Loop Approval Gates
 *
 * Configurable checkpoints where agents pause execution
 * and request human approval before high-stakes actions.
 */

// ═══ Types ═══

export interface ApprovalGate {
  id: string;
  agentId: string;
  agentName: string;
  executionId: string;
  stepIndex: number;
  action: string;
  context: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "expired" | "escalated";
  requestedAt: number;
  respondedAt: number | null;
  respondedBy: string | null;
  expiresAt: number;
  escalationChain: string[];
  currentEscalationLevel: number;
  tenantId: string;
  priority: "low" | "medium" | "high" | "critical";
  reason: string;
}

export interface ApprovalPolicy {
  id: string;
  agentId: string;
  tenantId: string;
  rules: ApprovalRule[];
  escalationChain: string[];
  timeoutMs: number;
  defaultAction: "approve" | "reject" | "escalate";
  enabled: boolean;
}

export interface ApprovalRule {
  field: string;
  operator: "gt" | "lt" | "eq" | "contains" | "matches";
  value: string | number;
  description: string;
}

export interface ApprovalResponse {
  gateId: string;
  decision: "approved" | "rejected";
  respondedBy: string;
  comment?: string;
  timestamp: number;
}

// ═══ Approval Gate Manager ═══

export class ApprovalGateManager {
  private gates: Map<string, ApprovalGate> = new Map();
  private policies: Map<string, ApprovalPolicy> = new Map();
  private responses: ApprovalResponse[] = [];

  /**
   * Create a new approval gate (pauses agent execution)
   */
  createGate(params: {
    agentId: string;
    agentName: string;
    executionId: string;
    stepIndex: number;
    action: string;
    context: Record<string, unknown>;
    tenantId: string;
    priority?: "low" | "medium" | "high" | "critical";
    reason?: string;
  }): ApprovalGate {
    const policy = this.getPolicy(params.agentId);
    const timeoutMs = policy?.timeoutMs || 3600000; // 1 hour default

    const gate: ApprovalGate = {
      id: `gate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId: params.agentId,
      agentName: params.agentName,
      executionId: params.executionId,
      stepIndex: params.stepIndex,
      action: params.action,
      context: params.context,
      status: "pending",
      requestedAt: Date.now(),
      respondedAt: null,
      respondedBy: null,
      expiresAt: Date.now() + timeoutMs,
      escalationChain: policy?.escalationChain || [],
      currentEscalationLevel: 0,
      tenantId: params.tenantId,
      priority: params.priority || "medium",
      reason: params.reason || "Action requires human approval",
    };

    this.gates.set(gate.id, gate);
    return gate;
  }

  /**
   * Respond to an approval gate
   */
  respondToGate(gateId: string, decision: "approved" | "rejected", userId: string, comment?: string): ApprovalGate | null {
    const gate = this.gates.get(gateId);
    if (!gate || gate.status !== "pending") return null;

    gate.status = decision;
    gate.respondedAt = Date.now();
    gate.respondedBy = userId;

    this.responses.push({
      gateId,
      decision,
      respondedBy: userId,
      comment,
      timestamp: Date.now(),
    });

    return gate;
  }

  /**
   * Check for expired gates and handle escalation
   */
  checkTimeouts(): ApprovalGate[] {
    const now = Date.now();
    const expired: ApprovalGate[] = [];

    this.gates.forEach((gate) => {
      if (gate.status !== "pending" || gate.expiresAt > now) return;

      if (gate.currentEscalationLevel < gate.escalationChain.length - 1) {
        gate.currentEscalationLevel++;
        gate.expiresAt = now + 3600000;
        gate.status = "escalated";
      } else {
        const policy = this.getPolicy(gate.agentId);
        gate.status = policy?.defaultAction === "approve" ? "approved" : "rejected";
        gate.respondedAt = now;
        gate.respondedBy = "system:timeout";
      }

      expired.push(gate);
    });

    return expired;
  }

  /**
   * Evaluate if an action needs approval
   */
  evaluatePolicy(agentId: string, action: string, context: Record<string, unknown>): boolean {
    const policy = this.getPolicy(agentId);
    if (!policy || !policy.enabled) return false;

    return policy.rules.some((rule) => {
      const value = context[rule.field];
      switch (rule.operator) {
        case "gt": return typeof value === "number" && value > (rule.value as number);
        case "lt": return typeof value === "number" && value < (rule.value as number);
        case "eq": return value === rule.value;
        case "contains": return typeof value === "string" && value.includes(rule.value as string);
        case "matches": return typeof value === "string" && new RegExp(rule.value as string).test(value);
        default: return false;
      }
    });
  }

  /**
   * Get gates by status for a tenant
   */
  getGatesByStatus(tenantId: string, status?: ApprovalGate["status"]): ApprovalGate[] {
    const gates = Array.from(this.gates.values()).filter(
      (g) => g.tenantId === tenantId && (!status || g.status === status)
    );
    return gates.sort((a, b) => b.requestedAt - a.requestedAt);
  }

  /**
   * Get a specific gate
   */
  getGate(gateId: string): ApprovalGate | undefined {
    return this.gates.get(gateId);
  }

  /**
   * Set approval policy for an agent
   */
  setPolicy(policy: ApprovalPolicy): void {
    this.policies.set(policy.agentId, policy);
  }

  /**
   * Get policy for an agent
   */
  getPolicy(agentId: string): ApprovalPolicy | undefined {
    return this.policies.get(agentId);
  }

  /**
   * Get all policies for a tenant
   */
  getPolicies(tenantId: string): ApprovalPolicy[] {
    return Array.from(this.policies.values()).filter((p) => p.tenantId === tenantId);
  }

  /**
   * Get approval response history
   */
  getResponseHistory(tenantId: string, limit = 50): (ApprovalResponse & { gate: ApprovalGate })[] {
    return this.responses
      .map((r) => {
        const gate = this.gates.get(r.gateId);
        return gate && gate.tenantId === tenantId ? { ...r, gate } : null;
      })
      .filter((r): r is ApprovalResponse & { gate: ApprovalGate } => r !== null)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get stats
   */
  getStats(tenantId: string): { pending: number; approved: number; rejected: number; expired: number; avgResponseTimeMs: number } {
    const gates = Array.from(this.gates.values()).filter((g) => g.tenantId === tenantId);
    const responded = gates.filter((g) => g.respondedAt !== null);
    const avgResponseTimeMs = responded.length > 0
      ? responded.reduce((s, g) => s + ((g.respondedAt || 0) - g.requestedAt), 0) / responded.length
      : 0;

    return {
      pending: gates.filter((g) => g.status === "pending").length,
      approved: gates.filter((g) => g.status === "approved").length,
      rejected: gates.filter((g) => g.status === "rejected").length,
      expired: gates.filter((g) => g.status === "expired").length,
      avgResponseTimeMs,
    };
  }
}

// ═══ Singleton ═══

let _manager: ApprovalGateManager | null = null;

export function getApprovalManager(): ApprovalGateManager {
  if (!_manager) {
    _manager = new ApprovalGateManager();
    seedDemoGates(_manager);
  }
  return _manager;
}

function seedDemoGates(manager: ApprovalGateManager): void {
  // Set up demo policies
  manager.setPolicy({
    id: "pol_fraud", agentId: "agent_fraud_001", tenantId: "tenant_acme", enabled: true,
    rules: [
      { field: "amount", operator: "gt", value: 50000, description: "Transactions over $50K" },
      { field: "risk_score", operator: "gt", value: 0.85, description: "High risk score" },
    ],
    escalationChain: ["user_analyst_01", "user_admin_01", "user_owner_01"],
    timeoutMs: 1800000,
    defaultAction: "reject",
  });

  manager.setPolicy({
    id: "pol_compliance", agentId: "agent_compliance_001", tenantId: "tenant_acme", enabled: true,
    rules: [
      { field: "action_type", operator: "eq", value: "sanctions_override", description: "Sanctions override" },
      { field: "regulatory_impact", operator: "eq", value: "high", description: "High regulatory impact" },
    ],
    escalationChain: ["user_compliance_01", "user_admin_01"],
    timeoutMs: 3600000,
    defaultAction: "reject",
  });

  // Create demo pending gates
  manager.createGate({
    agentId: "agent_fraud_001", agentName: "Fraud Monitoring Agent",
    executionId: "exec_001", stepIndex: 3,
    action: "Block transaction and freeze account",
    context: { transactionId: "txn_892341", amount: 78500, currency: "USD", risk_score: 0.92, customer: "Apex Holdings Ltd", country: "CY" },
    tenantId: "tenant_acme", priority: "critical",
    reason: "Transaction of $78,500 to Cyprus exceeds $50K threshold with risk score 0.92",
  });

  manager.createGate({
    agentId: "agent_compliance_001", agentName: "Compliance Agent",
    executionId: "exec_002", stepIndex: 2,
    action: "Override sanctions screening result",
    context: { entityName: "Global Trade Corp", matchType: "partial", matchScore: 0.67, listSource: "OFAC SDN", action_type: "sanctions_override" },
    tenantId: "tenant_acme", priority: "high",
    reason: "Partial OFAC match (67%) for Global Trade Corp — requires human verification",
  });

  manager.createGate({
    agentId: "agent_fraud_001", agentName: "Fraud Monitoring Agent",
    executionId: "exec_003", stepIndex: 1,
    action: "Send alert to payment processor",
    context: { alertType: "velocity_check", customerId: "cust_4521", transactionsInHour: 15, normalAvg: 3 },
    tenantId: "tenant_acme", priority: "medium",
    reason: "Customer cust_4521 has 15 transactions in the last hour (normal: 3)",
  });
}
