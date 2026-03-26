/**
 * Vector Memory Store
 * 
 * Provides semantic memory for AI agents using in-process
 * vector similarity search (cosine similarity).
 * 
 * Production upgrade: Replace with pgvector or Pinecone.
 * Interface remains identical — only the storage backend changes.
 */

import { LLMMessage, complete } from "@/lib/llm/gateway";

// ─── Types ─────────────────────────────────

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  tenantId: string;
  agentId: string;
  createdAt: number;
  ttl?: number; // seconds until expiry
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

// ─── In-Memory Vector Store ───────────────

class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();

  /**
   * Store a document with its embedding
   */
  async upsert(doc: Omit<VectorDocument, "embedding">): Promise<void> {
    const embedding = await this.embed(doc.content);
    this.documents.set(doc.id, { ...doc, embedding });
    this.cleanup();
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(
    query: string,
    tenantId: string,
    agentId: string,
    topK = 5
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.embed(query);

    const results: Array<SearchResult & { _score: number }> = [];

    for (const doc of this.documents.values()) {
      // Tenant + agent isolation
      if (doc.tenantId !== tenantId || doc.agentId !== agentId) continue;

      // Check TTL
      if (doc.ttl && Date.now() > doc.createdAt + doc.ttl * 1000) {
        this.documents.delete(doc.id);
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({
        id: doc.id,
        content: doc.content,
        score,
        metadata: doc.metadata,
        _score: score,
      });
    }

    return results
      .sort((a, b) => b._score - a._score)
      .slice(0, topK)
      .map(({ _score, ...rest }) => ({ ...rest, score: _score }));
  }

  /**
   * Delete all documents for a specific agent
   */
  async clearAgent(tenantId: string, agentId: string): Promise<number> {
    let count = 0;
    for (const [id, doc] of this.documents.entries()) {
      if (doc.tenantId === tenantId && doc.agentId === agentId) {
        this.documents.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get document count for an agent
   */
  count(tenantId: string, agentId: string): number {
    let count = 0;
    for (const doc of this.documents.values()) {
      if (doc.tenantId === tenantId && doc.agentId === agentId) count++;
    }
    return count;
  }

  /**
   * Generate embedding for text
   * Uses a simple hash-based embedding for development.
   * Production: use OpenAI text-embedding-3-small or pgvector.
   */
  private async embed(text: string): Promise<number[]> {
    // Development: deterministic hash-based embedding (384 dimensions)
    const dimensions = 384;
    const embedding = new Array(dimensions).fill(0);
    const normalizedText = text.toLowerCase().trim();

    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      const idx = (charCode * (i + 1) * 31) % dimensions;
      embedding[idx] += Math.sin(charCode * (i + 1)) * 0.1;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Remove expired documents
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, doc] of this.documents.entries()) {
      if (doc.ttl && now > doc.createdAt + doc.ttl * 1000) {
        this.documents.delete(id);
      }
    }
  }
}

// ─── Cosine Similarity ────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ─── Singleton ────────────────────────────

export const vectorStore = new VectorStore();

// ─── Agent Memory Interface ───────────────

/**
 * Creates a scoped memory interface for a specific agent.
 * This is what agents use to store and retrieve memories.
 */
export function createAgentMemory(tenantId: string, agentId: string) {
  return {
    async store(content: string, metadata: Record<string, unknown> = {}, ttl?: number): Promise<string> {
      const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await vectorStore.upsert({
        id,
        content,
        metadata: { ...metadata, type: "memory" },
        tenantId,
        agentId,
        createdAt: Date.now(),
        ttl,
      });
      return id;
    },

    async recall(query: string, topK = 5): Promise<SearchResult[]> {
      return vectorStore.search(query, tenantId, agentId, topK);
    },

    async storeConversation(messages: LLMMessage[]): Promise<string> {
      const summary = messages
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      return this.store(summary, { type: "conversation", messageCount: messages.length });
    },

    async storeFact(fact: string, source: string): Promise<string> {
      return this.store(fact, { type: "fact", source });
    },

    async storeDecision(decision: string, reasoning: string): Promise<string> {
      return this.store(`Decision: ${decision}\nReasoning: ${reasoning}`, {
        type: "decision",
      });
    },

    async clear(): Promise<number> {
      return vectorStore.clearAgent(tenantId, agentId);
    },

    count(): number {
      return vectorStore.count(tenantId, agentId);
    },
  };
}

export type AgentMemoryStore = ReturnType<typeof createAgentMemory>;
