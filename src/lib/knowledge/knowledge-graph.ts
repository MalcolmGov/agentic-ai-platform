/**
 * Cross-Agent Knowledge Graph — "Institutional Memory"
 *
 * Organization-wide knowledge base that agents share and contribute to.
 * The platform gets smarter the longer you use it.
 */

// ═══ Types ═══

export interface KnowledgeNode {
  id: string;
  type: "entity" | "concept" | "decision" | "fact" | "pattern" | "rule";
  label: string;
  properties: Record<string, unknown>;
  tenantId: string;
  sourceAgentId: string;
  sourceAgentName: string;
  confidence: number;
  accessCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  weight: number;
  metadata: Record<string, unknown>;
  createdAt: number;
}

export interface KnowledgeSearchResult {
  node: KnowledgeNode;
  relevance: number;
  connectedNodes: number;
}

export interface KnowledgeStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  topContributors: { agentId: string; agentName: string; contributions: number }[];
  avgConfidence: number;
  organizationIQ: number;
  graphDensity: number;
}

export interface KnowledgeSubgraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  centerNodeId: string;
}

// ═══ Knowledge Graph ═══

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();

  addNode(node: KnowledgeNode): KnowledgeNode {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Set());
    }
    return node;
  }

  addEdge(edge: KnowledgeEdge): KnowledgeEdge {
    this.edges.set(edge.id, edge);
    // Bidirectional adjacency
    if (!this.adjacency.has(edge.sourceId)) this.adjacency.set(edge.sourceId, new Set());
    if (!this.adjacency.has(edge.targetId)) this.adjacency.set(edge.targetId, new Set());
    this.adjacency.get(edge.sourceId)!.add(edge.targetId);
    this.adjacency.get(edge.targetId)!.add(edge.sourceId);
    return edge;
  }

  removeNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove connected edges
    this.edges.forEach((edge, edgeId) => {
      if (edge.sourceId === nodeId || edge.targetId === nodeId) {
        this.edges.delete(edgeId);
      }
    });

    this.adjacency.delete(nodeId);
    this.adjacency.forEach((neighbors) => neighbors.delete(nodeId));
    this.nodes.delete(nodeId);
    return true;
  }

  getNode(nodeId: string): KnowledgeNode | undefined {
    const node = this.nodes.get(nodeId);
    if (node) node.accessCount++;
    return node;
  }

  findRelated(nodeId: string, depth = 2, tenantId?: string): KnowledgeSubgraph {
    const visited = new Set<string>();
    const resultNodes: KnowledgeNode[] = [];
    const resultEdges: KnowledgeEdge[] = [];
    const queue: { id: string; level: number }[] = [{ id: nodeId, level: 0 }];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id) || level > depth) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node && (!tenantId || node.tenantId === tenantId)) {
        resultNodes.push(node);
      }

      const neighbors = this.adjacency.get(id) || new Set();
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, level: level + 1 });
        }
      });
    }

    // Collect edges between visited nodes
    this.edges.forEach((edge) => {
      if (visited.has(edge.sourceId) && visited.has(edge.targetId)) {
        resultEdges.push(edge);
      }
    });

    return { nodes: resultNodes, edges: resultEdges, centerNodeId: nodeId };
  }

  search(query: string, tenantId: string, limit = 20): KnowledgeSearchResult[] {
    const queryLower = query.toLowerCase();
    const results: KnowledgeSearchResult[] = [];

    this.nodes.forEach((node) => {
      if (node.tenantId !== tenantId) return;

      let relevance = 0;
      const label = node.label.toLowerCase();
      const propStr = JSON.stringify(node.properties).toLowerCase();

      if (label === queryLower) relevance = 1.0;
      else if (label.includes(queryLower)) relevance = 0.8;
      else if (propStr.includes(queryLower)) relevance = 0.5;

      if (relevance > 0) {
        relevance *= node.confidence;
        const connectedNodes = this.adjacency.get(node.id)?.size || 0;
        results.push({ node, relevance, connectedNodes });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  getOrganizationKnowledge(tenantId: string): KnowledgeNode[] {
    return Array.from(this.nodes.values())
      .filter((n) => n.tenantId === tenantId)
      .sort((a, b) => b.confidence - a.confidence);
  }

  getInsightsByAgent(agentId: string): KnowledgeNode[] {
    return Array.from(this.nodes.values())
      .filter((n) => n.sourceAgentId === agentId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  decayOldKnowledge(tenantId: string, maxAgeMs = 30 * 86400000): number {
    let decayed = 0;
    const cutoff = Date.now() - maxAgeMs;

    this.nodes.forEach((node) => {
      if (node.tenantId !== tenantId || node.updatedAt >= cutoff) return;
      const ageRatio = (Date.now() - node.updatedAt) / maxAgeMs;
      node.confidence = Math.max(0.1, node.confidence * (1 - ageRatio * 0.3));
      decayed++;
    });

    return decayed;
  }

  mergeKnowledge(sourceAgentId: string, targetAgentId: string, tenantId: string): number {
    let merged = 0;
    this.nodes.forEach((node) => {
      if (node.sourceAgentId === sourceAgentId && node.tenantId === tenantId) {
        // Create a shared edge to target agent's knowledge
        const targetNodes = this.getInsightsByAgent(targetAgentId);
        targetNodes.forEach((targetNode) => {
          if (node.type === targetNode.type) {
            this.addEdge({
              id: `edge_merge_${Date.now()}_${merged}`,
              sourceId: node.id,
              targetId: targetNode.id,
              relationship: "shared_insight",
              weight: Math.min(node.confidence, targetNode.confidence),
              metadata: { mergedAt: Date.now() },
              createdAt: Date.now(),
            });
            merged++;
          }
        });
      }
    });
    return merged;
  }

  getStats(tenantId: string): KnowledgeStats {
    const tenantNodes = Array.from(this.nodes.values()).filter((n) => n.tenantId === tenantId);
    const tenantEdges = Array.from(this.edges.values()).filter((e) => {
      const source = this.nodes.get(e.sourceId);
      return source && source.tenantId === tenantId;
    });

    const nodesByType: Record<string, number> = {};
    const contributorMap: Record<string, { agentName: string; count: number }> = {};
    let totalConfidence = 0;

    tenantNodes.forEach((node) => {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
      if (!contributorMap[node.sourceAgentId]) {
        contributorMap[node.sourceAgentId] = { agentName: node.sourceAgentName, count: 0 };
      }
      contributorMap[node.sourceAgentId].count++;
      totalConfidence += node.confidence;
    });

    const n = tenantNodes.length;
    const maxEdges = n > 1 ? (n * (n - 1)) / 2 : 1;
    const graphDensity = tenantEdges.length / maxEdges;

    // Organization IQ: composite score based on knowledge volume, diversity, and quality
    const typeCount = Object.keys(nodesByType).length;
    const avgConfidence = n > 0 ? totalConfidence / n : 0;
    const organizationIQ = Math.round(
      Math.min(200, (n * 0.5 + typeCount * 15 + avgConfidence * 50 + graphDensity * 100))
    );

    return {
      totalNodes: n,
      totalEdges: tenantEdges.length,
      nodesByType,
      topContributors: Object.entries(contributorMap)
        .map(([agentId, data]) => ({ agentId, agentName: data.agentName, contributions: data.count }))
        .sort((a, b) => b.contributions - a.contributions),
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      organizationIQ,
      graphDensity: Math.round(graphDensity * 1000) / 1000,
    };
  }
}

// ═══ Knowledge Ingester ═══

export class KnowledgeIngester {
  private graph: KnowledgeGraph;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
  }

  ingestExecutionResult(params: {
    agentId: string;
    agentName: string;
    agentType: string;
    tenantId: string;
    result: Record<string, unknown>;
    reasoning?: string;
  }): KnowledgeNode[] {
    const nodes: KnowledgeNode[] = [];
    const now = Date.now();

    // Create a decision node from the execution
    const decisionNode = this.graph.addNode({
      id: `kn_${now}_${Math.random().toString(36).slice(2, 6)}`,
      type: "decision",
      label: `${params.agentName} decision`,
      properties: { result: params.result, reasoning: params.reasoning, agentType: params.agentType },
      tenantId: params.tenantId,
      sourceAgentId: params.agentId,
      sourceAgentName: params.agentName,
      confidence: 0.85,
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    nodes.push(decisionNode);

    // Extract entities from result
    if (typeof params.result === "object" && params.result !== null) {
      for (const [key, value] of Object.entries(params.result)) {
        if (typeof value === "string" && value.length > 2 && value.length < 200) {
          const entityNode = this.graph.addNode({
            id: `kn_${now}_${Math.random().toString(36).slice(2, 8)}`,
            type: "entity",
            label: String(value),
            properties: { field: key, extractedFrom: decisionNode.id },
            tenantId: params.tenantId,
            sourceAgentId: params.agentId,
            sourceAgentName: params.agentName,
            confidence: 0.7,
            accessCount: 0,
            createdAt: now,
            updatedAt: now,
          });
          nodes.push(entityNode);

          this.graph.addEdge({
            id: `edge_${now}_${Math.random().toString(36).slice(2, 6)}`,
            sourceId: decisionNode.id,
            targetId: entityNode.id,
            relationship: "references",
            weight: 0.8,
            metadata: { field: key },
            createdAt: now,
          });
        }
      }
    }

    return nodes;
  }
}

// ═══ Singleton ═══

let _graph: KnowledgeGraph | null = null;
let _ingester: KnowledgeIngester | null = null;

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!_graph) {
    _graph = new KnowledgeGraph();
    seedDemoKnowledge(_graph);
  }
  return _graph;
}

export function getIngester(): KnowledgeIngester {
  if (!_ingester) _ingester = new KnowledgeIngester(getKnowledgeGraph());
  return _ingester;
}

function seedDemoKnowledge(graph: KnowledgeGraph): void {
  const t = "tenant_acme";
  const now = Date.now();

  const nodes = [
    { id: "kn_1", type: "pattern" as const, label: "High-risk transaction pattern: Cyprus + Round amounts + New account", sourceAgentId: "agent_fraud_001", sourceAgentName: "Fraud Monitoring Agent", confidence: 0.94 },
    { id: "kn_2", type: "fact" as const, label: "OFAC SDN list updated quarterly — last update March 2026", sourceAgentId: "agent_compliance_001", sourceAgentName: "Compliance Agent", confidence: 0.99 },
    { id: "kn_3", type: "decision" as const, label: "Blocked vendor Apex Holdings after 3 flagged transactions", sourceAgentId: "agent_fraud_001", sourceAgentName: "Fraud Monitoring Agent", confidence: 0.91 },
    { id: "kn_4", type: "entity" as const, label: "Apex Holdings Ltd", sourceAgentId: "agent_fraud_001", sourceAgentName: "Fraud Monitoring Agent", confidence: 0.88 },
    { id: "kn_5", type: "rule" as const, label: "PEP screening required for transactions > $25K to FATF grey-listed countries", sourceAgentId: "agent_compliance_001", sourceAgentName: "Compliance Agent", confidence: 0.97 },
    { id: "kn_6", type: "concept" as const, label: "Velocity anomaly detection: >5x normal transaction rate triggers review", sourceAgentId: "agent_fraud_001", sourceAgentName: "Fraud Monitoring Agent", confidence: 0.89 },
    { id: "kn_7", type: "pattern" as const, label: "Support tickets spike 40% on Mondays — pre-schedule extra agent capacity", sourceAgentId: "agent_support_001", sourceAgentName: "Customer Support Agent", confidence: 0.86 },
    { id: "kn_8", type: "fact" as const, label: "Invoice processing accuracy improved from 91% to 98.3% after template normalization", sourceAgentId: "agent_reporting_001", sourceAgentName: "Reporting Agent", confidence: 0.95 },
    { id: "kn_9", type: "decision" as const, label: "Auto-escalate billing disputes > $1000 to human review", sourceAgentId: "agent_support_001", sourceAgentName: "Customer Support Agent", confidence: 0.92 },
    { id: "kn_10", type: "entity" as const, label: "FATF Grey List Countries (2026)", sourceAgentId: "agent_compliance_001", sourceAgentName: "Compliance Agent", confidence: 0.98 },
    { id: "kn_11", type: "pattern" as const, label: "Refund fraud pattern: multiple returns from same IP within 48h", sourceAgentId: "agent_fraud_001", sourceAgentName: "Fraud Monitoring Agent", confidence: 0.87 },
    { id: "kn_12", type: "concept" as const, label: "Customer churn predictor: 3+ negative interactions within 7 days = 72% churn probability", sourceAgentId: "agent_support_001", sourceAgentName: "Customer Support Agent", confidence: 0.79 },
  ];

  nodes.forEach((n) => {
    graph.addNode({
      ...n,
      properties: {},
      tenantId: t,
      accessCount: Math.floor(Math.random() * 50),
      createdAt: now - Math.random() * 7 * 86400000,
      updatedAt: now - Math.random() * 3 * 86400000,
    });
  });

  const edges = [
    { source: "kn_1", target: "kn_4", rel: "involves" },
    { source: "kn_3", target: "kn_4", rel: "targets" },
    { source: "kn_3", target: "kn_1", rel: "based_on" },
    { source: "kn_5", target: "kn_10", rel: "references" },
    { source: "kn_2", target: "kn_5", rel: "informs" },
    { source: "kn_6", target: "kn_1", rel: "detects" },
    { source: "kn_7", target: "kn_9", rel: "influences" },
    { source: "kn_11", target: "kn_6", rel: "related_to" },
    { source: "kn_12", target: "kn_9", rel: "triggers" },
    { source: "kn_8", target: "kn_7", rel: "improves" },
  ];

  edges.forEach((e, i) => {
    graph.addEdge({
      id: `edge_demo_${i}`,
      sourceId: e.source,
      targetId: e.target,
      relationship: e.rel,
      weight: 0.7 + Math.random() * 0.3,
      metadata: {},
      createdAt: now - Math.random() * 5 * 86400000,
    });
  });
}
