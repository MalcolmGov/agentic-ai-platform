import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from "@/lib/knowledge/knowledge-graph";

function makeNode(overrides: Partial<KnowledgeNode> = {}): KnowledgeNode {
  return {
    id: `node_${Math.random().toString(36).slice(2, 6)}`,
    type: "entity",
    label: "Test Node",
    properties: {},
    tenantId: "tenant_1",
    sourceAgentId: "agent_1",
    sourceAgentName: "Test Agent",
    confidence: 0.9,
    accessCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("KnowledgeGraph", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  describe("addNode / getNode", () => {
    it("stores and retrieves a node", () => {
      const node = makeNode({ id: "n1", label: "Fraud Pattern" });
      graph.addNode(node);
      const retrieved = graph.getNode("n1");
      expect(retrieved).toBeDefined();
      expect(retrieved!.label).toBe("Fraud Pattern");
    });

    it("increments accessCount on getNode", () => {
      const node = makeNode({ id: "n1" });
      graph.addNode(node);
      graph.getNode("n1");
      graph.getNode("n1");
      expect(graph.getNode("n1")!.accessCount).toBe(3);
    });

    it("returns undefined for unknown node", () => {
      expect(graph.getNode("missing")).toBeUndefined();
    });
  });

  describe("addEdge", () => {
    it("creates bidirectional adjacency", () => {
      graph.addNode(makeNode({ id: "a" }));
      graph.addNode(makeNode({ id: "b" }));
      graph.addEdge({
        id: "e1", sourceId: "a", targetId: "b",
        relationship: "related_to", weight: 1, metadata: {}, createdAt: Date.now(),
      });

      const subgraph = graph.findRelated("a", 1, "tenant_1");
      expect(subgraph.nodes.map((n) => n.id)).toContain("b");
    });
  });

  describe("removeNode", () => {
    it("removes node and associated edges", () => {
      graph.addNode(makeNode({ id: "a" }));
      graph.addNode(makeNode({ id: "b" }));
      graph.addEdge({
        id: "e1", sourceId: "a", targetId: "b",
        relationship: "r", weight: 1, metadata: {}, createdAt: Date.now(),
      });

      expect(graph.removeNode("a")).toBe(true);
      expect(graph.getNode("a")).toBeUndefined();
    });

    it("returns false for missing node", () => {
      expect(graph.removeNode("missing")).toBe(false);
    });
  });

  describe("findRelated (BFS traversal)", () => {
    it("finds nodes up to given depth", () => {
      graph.addNode(makeNode({ id: "a" }));
      graph.addNode(makeNode({ id: "b" }));
      graph.addNode(makeNode({ id: "c" }));
      graph.addEdge({ id: "e1", sourceId: "a", targetId: "b", relationship: "r", weight: 1, metadata: {}, createdAt: Date.now() });
      graph.addEdge({ id: "e2", sourceId: "b", targetId: "c", relationship: "r", weight: 1, metadata: {}, createdAt: Date.now() });

      const depth1 = graph.findRelated("a", 1, "tenant_1");
      expect(depth1.nodes.map((n) => n.id)).toContain("b");
      expect(depth1.nodes.map((n) => n.id)).not.toContain("c");

      const depth2 = graph.findRelated("a", 2, "tenant_1");
      expect(depth2.nodes.map((n) => n.id)).toContain("c");
    });

    it("filters by tenant", () => {
      graph.addNode(makeNode({ id: "a", tenantId: "t1" }));
      graph.addNode(makeNode({ id: "b", tenantId: "t2" }));
      graph.addEdge({ id: "e1", sourceId: "a", targetId: "b", relationship: "r", weight: 1, metadata: {}, createdAt: Date.now() });

      const subgraph = graph.findRelated("a", 2, "t1");
      expect(subgraph.nodes.map((n) => n.id)).toContain("a");
      expect(subgraph.nodes.map((n) => n.id)).not.toContain("b");
    });
  });

  describe("search", () => {
    it("finds nodes matching label", () => {
      graph.addNode(makeNode({ id: "n1", label: "Fraud Detection Pattern" }));
      graph.addNode(makeNode({ id: "n2", label: "Compliance Rule" }));

      const results = graph.search("fraud", "tenant_1");
      expect(results).toHaveLength(1);
      expect(results[0].node.id).toBe("n1");
      expect(results[0].relevance).toBeGreaterThan(0);
    });

    it("returns empty for no matches", () => {
      graph.addNode(makeNode({ id: "n1", label: "Test" }));
      expect(graph.search("xyz", "tenant_1")).toHaveLength(0);
    });

    it("filters by tenant", () => {
      graph.addNode(makeNode({ id: "n1", label: "Fraud", tenantId: "t1" }));
      graph.addNode(makeNode({ id: "n2", label: "Fraud", tenantId: "t2" }));
      expect(graph.search("fraud", "t1")).toHaveLength(1);
    });
  });

  describe("getOrganizationKnowledge", () => {
    it("returns nodes sorted by confidence", () => {
      graph.addNode(makeNode({ id: "n1", confidence: 0.5, tenantId: "t1" }));
      graph.addNode(makeNode({ id: "n2", confidence: 0.9, tenantId: "t1" }));
      graph.addNode(makeNode({ id: "n3", confidence: 0.7, tenantId: "t2" }));

      const knowledge = graph.getOrganizationKnowledge("t1");
      expect(knowledge).toHaveLength(2);
      expect(knowledge[0].confidence).toBeGreaterThanOrEqual(knowledge[1].confidence);
    });
  });

  describe("decayOldKnowledge", () => {
    it("reduces confidence for old nodes", () => {
      const oldTime = Date.now() - 60 * 86400000; // 60 days ago
      graph.addNode(makeNode({ id: "old", updatedAt: oldTime, confidence: 0.9, tenantId: "t1" }));
      graph.addNode(makeNode({ id: "new", updatedAt: Date.now(), confidence: 0.9, tenantId: "t1" }));

      const decayed = graph.decayOldKnowledge("t1");
      expect(decayed).toBe(1);
      expect(graph.getNode("old")!.confidence).toBeLessThan(0.9);
      expect(graph.getNode("new")!.confidence).toBe(0.9);
    });
  });
});
