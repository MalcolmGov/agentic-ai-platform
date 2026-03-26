/**
 * Multi-Agent Orchestration Engine
 *
 * DAG-based workflows: chain agents together with conditional routing,
 * parallel fan-out, error handling, and result aggregation.
 */

// ─── Types ─────────────────────────────────

export type NodeStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type WorkflowStatus = "draft" | "running" | "completed" | "failed" | "paused" | "cancelled";

export interface WorkflowNode {
  id: string;
  agentId: string;
  name: string;
  dependsOn: string[];               // node IDs this depends on
  condition?: ConditionConfig;        // optional: skip if condition not met
  inputMapping?: Record<string, string>; // map upstream outputs → this node's inputs
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  status: NodeStatus;
  result?: NodeResult;
  startedAt?: number;
  completedAt?: number;
}

export interface ConditionConfig {
  sourceNodeId: string;
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "exists";
  value: unknown;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface NodeResult {
  output: Record<string, unknown>;
  tokensUsed: number;
  latencyMs: number;
  costUsd: number;
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  nodes: WorkflowNode[];
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  globalTimeout: number;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  totalCostUsd: number;
  totalTokensUsed: number;
  executionLog: ExecutionLogEntry[];
}

export interface WorkflowTrigger {
  type: "manual" | "schedule" | "webhook" | "event" | "agent_output";
  config: Record<string, unknown>;
}

export interface ExecutionLogEntry {
  timestamp: number;
  nodeId: string;
  event: string;
  details?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Omit<WorkflowNode, "status" | "result" | "startedAt" | "completedAt">[];
  trigger: WorkflowTrigger;
}

// ─── Built-in Templates ────────────────────

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tpl_fraud_pipeline",
    name: "Fraud Detection Pipeline",
    description: "Transaction screening → risk scoring → compliance check → alert/block",
    category: "financial_services",
    nodes: [
      {
        id: "screen", agentId: "", name: "Transaction Screening",
        dependsOn: [], timeoutMs: 30000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
      },
      {
        id: "risk_score", agentId: "", name: "Risk Scoring",
        dependsOn: ["screen"],
        inputMapping: { transaction: "screen.output.transaction", flags: "screen.output.flags" },
        timeoutMs: 15000,
        retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 },
      },
      {
        id: "compliance", agentId: "", name: "Compliance Check",
        dependsOn: ["risk_score"],
        condition: { sourceNodeId: "risk_score", field: "riskScore", operator: "gte", value: 70 },
        timeoutMs: 20000,
        retryPolicy: { maxRetries: 1, backoffMs: 1000, backoffMultiplier: 2 },
      },
      {
        id: "alert", agentId: "", name: "Alert & Action",
        dependsOn: ["compliance"],
        timeoutMs: 10000,
        retryPolicy: { maxRetries: 3, backoffMs: 500, backoffMultiplier: 2 },
      },
    ],
    trigger: { type: "event", config: { event: "transaction.created" } },
  },
  {
    id: "tpl_doc_processing",
    name: "Document Processing Pipeline",
    description: "Intake → classify → extract → validate → store",
    category: "operations",
    nodes: [
      {
        id: "intake", agentId: "", name: "Document Intake",
        dependsOn: [], timeoutMs: 30000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
      },
      {
        id: "classify", agentId: "", name: "Document Classification",
        dependsOn: ["intake"], timeoutMs: 15000,
        retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 },
      },
      {
        id: "extract", agentId: "", name: "Data Extraction",
        dependsOn: ["classify"], timeoutMs: 30000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
      },
      {
        id: "validate", agentId: "", name: "Validation & QA",
        dependsOn: ["extract"], timeoutMs: 20000,
        retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 },
      },
    ],
    trigger: { type: "webhook", config: { path: "/ingest" } },
  },
  {
    id: "tpl_customer_escalation",
    name: "Customer Escalation Flow",
    description: "Triage → respond OR escalate → follow-up",
    category: "customer_support",
    nodes: [
      {
        id: "triage", agentId: "", name: "Ticket Triage",
        dependsOn: [], timeoutMs: 10000,
        retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 },
      },
      {
        id: "auto_respond", agentId: "", name: "Auto Response",
        dependsOn: ["triage"],
        condition: { sourceNodeId: "triage", field: "severity", operator: "lt", value: 3 },
        timeoutMs: 15000,
        retryPolicy: { maxRetries: 2, backoffMs: 500, backoffMultiplier: 2 },
      },
      {
        id: "escalate", agentId: "", name: "Escalation Handler",
        dependsOn: ["triage"],
        condition: { sourceNodeId: "triage", field: "severity", operator: "gte", value: 3 },
        timeoutMs: 15000,
        retryPolicy: { maxRetries: 1, backoffMs: 1000, backoffMultiplier: 2 },
      },
      {
        id: "followup", agentId: "", name: "Follow-up Scheduler",
        dependsOn: ["auto_respond", "escalate"], timeoutMs: 10000,
        retryPolicy: { maxRetries: 1, backoffMs: 500, backoffMultiplier: 2 },
      },
    ],
    trigger: { type: "event", config: { event: "ticket.created" } },
  },
];

// ─── Engine ────────────────────────────────

export class OrchestrationEngine {
  private workflows = new Map<string, Workflow>();
  private templates = new Map<string, WorkflowTemplate>();

  constructor() {
    for (const t of WORKFLOW_TEMPLATES) {
      this.templates.set(t.id, t);
    }
  }

  /**
   * Create a workflow from scratch
   */
  createWorkflow(params: {
    name: string;
    description: string;
    tenantId: string;
    nodes: Omit<WorkflowNode, "status" | "result" | "startedAt" | "completedAt">[];
    trigger?: WorkflowTrigger;
    globalTimeout?: number;
  }): Workflow {
    const now = Date.now();
    const workflow: Workflow = {
      id: `wf_${now}_${Math.random().toString(36).slice(2, 6)}`,
      name: params.name,
      description: params.description,
      tenantId: params.tenantId,
      nodes: params.nodes.map((n) => ({ ...n, status: "pending" as NodeStatus })),
      status: "draft",
      trigger: params.trigger || { type: "manual", config: {} },
      globalTimeout: params.globalTimeout || 300000,
      createdAt: now,
      updatedAt: now,
      totalCostUsd: 0,
      totalTokensUsed: 0,
      executionLog: [],
    };

    // Validate DAG (no cycles)
    const valid = this.validateDAG(workflow.nodes);
    if (!valid) throw new Error("Workflow contains circular dependencies");

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Create a workflow from a template
   */
  createFromTemplate(
    templateId: string,
    tenantId: string,
    agentMapping: Record<string, string>, // nodeId → agentId
    name?: string
  ): Workflow | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const nodes = template.nodes.map((n) => ({
      ...n,
      agentId: agentMapping[n.id] || n.agentId,
    }));

    return this.createWorkflow({
      name: name || template.name,
      description: template.description,
      tenantId,
      nodes,
      trigger: template.trigger,
    });
  }

  /**
   * Start workflow execution
   */
  startWorkflow(workflowId: string): Workflow | null {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.status === "running") return null;

    wf.status = "running";
    wf.startedAt = Date.now();
    wf.updatedAt = Date.now();
    wf.executionLog.push({ timestamp: Date.now(), nodeId: "*", event: "workflow_started" });

    // Start root nodes (no dependencies)
    const roots = wf.nodes.filter((n) => n.dependsOn.length === 0);
    for (const node of roots) {
      this.startNode(wf, node);
    }

    return wf;
  }

  /**
   * Complete a node (simulates agent finishing)
   */
  completeNode(workflowId: string, nodeId: string, result: NodeResult): Workflow | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;

    const node = wf.nodes.find((n) => n.id === nodeId);
    if (!node || node.status !== "running") return null;

    node.status = result.error ? "failed" : "completed";
    node.result = result;
    node.completedAt = Date.now();
    wf.totalCostUsd += result.costUsd;
    wf.totalTokensUsed += result.tokensUsed;
    wf.updatedAt = Date.now();

    wf.executionLog.push({
      timestamp: Date.now(), nodeId,
      event: node.status === "completed" ? "node_completed" : "node_failed",
      details: result.error,
    });

    if (node.status === "failed") {
      wf.status = "failed";
      wf.completedAt = Date.now();
      wf.executionLog.push({ timestamp: Date.now(), nodeId: "*", event: "workflow_failed" });
      return wf;
    }

    // Advance: start downstream nodes whose dependencies are all met
    const downstream = wf.nodes.filter(
      (n) => n.dependsOn.includes(nodeId) && n.status === "pending"
    );

    for (const next of downstream) {
      const allDepsMet = next.dependsOn.every((depId) => {
        const dep = wf.nodes.find((n) => n.id === depId);
        return dep && (dep.status === "completed" || dep.status === "skipped");
      });
      if (!allDepsMet) continue;

      // Evaluate condition
      if (next.condition && !this.evaluateCondition(wf, next.condition)) {
        next.status = "skipped";
        next.completedAt = Date.now();
        wf.executionLog.push({ timestamp: Date.now(), nodeId: next.id, event: "node_skipped" });
        // Recursively advance from skipped node
        this.completeNode(workflowId, next.id, { output: {}, tokensUsed: 0, latencyMs: 0, costUsd: 0 });
        continue;
      }

      this.startNode(wf, next);
    }

    // Check if workflow is complete
    const allDone = wf.nodes.every((n) => ["completed", "skipped", "failed"].includes(n.status));
    if (allDone) {
      wf.status = "completed";
      wf.completedAt = Date.now();
      wf.executionLog.push({ timestamp: Date.now(), nodeId: "*", event: "workflow_completed" });
    }

    return wf;
  }

  /**
   * Pause a running workflow
   */
  pauseWorkflow(workflowId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.status !== "running") return false;
    wf.status = "paused";
    wf.updatedAt = Date.now();
    wf.executionLog.push({ timestamp: Date.now(), nodeId: "*", event: "workflow_paused" });
    return true;
  }

  /**
   * Cancel a workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.status === "completed" || wf.status === "cancelled") return false;
    wf.status = "cancelled";
    wf.completedAt = Date.now();
    wf.updatedAt = Date.now();
    wf.executionLog.push({ timestamp: Date.now(), nodeId: "*", event: "workflow_cancelled" });
    return true;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * List workflows for a tenant
   */
  listWorkflows(tenantId: string): Workflow[] {
    return Array.from(this.workflows.values()).filter((w) => w.tenantId === tenantId);
  }

  /**
   * Get available templates
   */
  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get a single template
   */
  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get execution topology (for rendering the DAG visually)
   */
  getTopology(workflowId: string): { nodes: { id: string; name: string; status: NodeStatus; agentId: string }[]; edges: { from: string; to: string; conditional: boolean }[] } | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;

    const nodes = wf.nodes.map((n) => ({ id: n.id, name: n.name, status: n.status, agentId: n.agentId }));
    const edges: { from: string; to: string; conditional: boolean }[] = [];
    for (const node of wf.nodes) {
      for (const dep of node.dependsOn) {
        edges.push({ from: dep, to: node.id, conditional: !!node.condition });
      }
    }
    return { nodes, edges };
  }

  // ─── Private ─────────────────────────────

  private startNode(wf: Workflow, node: WorkflowNode): void {
    node.status = "running";
    node.startedAt = Date.now();
    wf.executionLog.push({ timestamp: Date.now(), nodeId: node.id, event: "node_started" });
  }

  private evaluateCondition(wf: Workflow, cond: ConditionConfig): boolean {
    const sourceNode = wf.nodes.find((n) => n.id === cond.sourceNodeId);
    if (!sourceNode?.result) return false;

    const value = sourceNode.result.output[cond.field];
    switch (cond.operator) {
      case "eq": return value === cond.value;
      case "neq": return value !== cond.value;
      case "gt": return (value as number) > (cond.value as number);
      case "lt": return (value as number) < (cond.value as number);
      case "gte": return (value as number) >= (cond.value as number);
      case "lte": return (value as number) <= (cond.value as number);
      case "contains": return String(value).includes(String(cond.value));
      case "exists": return value !== undefined && value !== null;
      default: return false;
    }
  }

  private validateDAG(nodes: WorkflowNode[]): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (id: string): boolean => {
      if (stack.has(id)) return false; // cycle
      if (visited.has(id)) return true;
      stack.add(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) return true;
      for (const dep of node.dependsOn) {
        if (!dfs(dep)) return false;
      }
      stack.delete(id);
      visited.add(id);
      return true;
    };

    return nodes.every((n) => dfs(n.id));
  }
}

// ─── Singleton ─────────────────────────────

let engine: OrchestrationEngine | null = null;
export function getOrchestrationEngine(): OrchestrationEngine {
  if (!engine) engine = new OrchestrationEngine();
  return engine;
}
