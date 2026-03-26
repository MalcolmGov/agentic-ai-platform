/**
 * LLM Response Cache — Semantic deduplication for LLM calls
 *
 * Caches LLM responses by prompt hash to avoid duplicate API calls.
 * Supports TTL-based expiry, cache warming, and hit/miss metrics.
 */

import crypto from "crypto";

// ─── Types ─────────────────────────────────

export interface CacheEntry {
  key: string;
  response: string;
  model: string;
  tokenUsage: number;
  costSaved: number;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

export interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalCostSaved: number;
  totalTokensSaved: number;
  memoryUsageBytes: number;
}

export interface CacheConfig {
  maxEntries: number;
  defaultTtlMs: number;
  enabled: boolean;
}

// ─── LLM Response Cache ────────────────────

export class LlmCache {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0, totalCostSaved: 0, totalTokensSaved: 0 };
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: config?.maxEntries ?? 10_000,
      defaultTtlMs: config?.defaultTtlMs ?? 3_600_000, // 1 hour
      enabled: config?.enabled ?? true,
    };
  }

  /**
   * Generate a cache key from prompt content and model
   */
  private makeKey(prompt: string, model: string, systemPrompt?: string): string {
    const content = `${model}::${systemPrompt || ""}::${prompt}`;
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Look up a cached response
   */
  get(prompt: string, model: string, systemPrompt?: string): CacheEntry | null {
    if (!this.config.enabled) {
      this.stats.misses++;
      return null;
    }

    const key = this.makeKey(prompt, model, systemPrompt);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Cache hit
    entry.hitCount++;
    this.stats.hits++;
    this.stats.totalCostSaved += entry.costSaved;
    this.stats.totalTokensSaved += entry.tokenUsage;

    return entry;
  }

  /**
   * Store a response in cache
   */
  set(
    prompt: string,
    model: string,
    response: string,
    options: {
      systemPrompt?: string;
      tokenUsage?: number;
      costUsd?: number;
      ttlMs?: number;
    } = {}
  ): CacheEntry {
    const key = this.makeKey(prompt, model, options.systemPrompt);
    const now = Date.now();

    // Evict if at capacity (LRU - remove oldest)
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      key,
      response,
      model,
      tokenUsage: options.tokenUsage || 0,
      costSaved: options.costUsd || 0,
      createdAt: now,
      expiresAt: now + (options.ttlMs || this.config.defaultTtlMs),
      hitCount: 0,
    };

    this.cache.set(key, entry);
    return entry;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(prompt: string, model: string, systemPrompt?: string): boolean {
    const key = this.makeKey(prompt, model, systemPrompt);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    let memoryUsageBytes = 0;

    for (const entry of this.cache.values()) {
      memoryUsageBytes += entry.response.length * 2; // approximate
    }

    return {
      totalEntries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalCostSaved: Math.round(this.stats.totalCostSaved * 10000) / 10000,
      totalTokensSaved: this.stats.totalTokensSaved,
      memoryUsageBytes,
    };
  }

  /**
   * Update config
   */
  setConfig(config: Partial<CacheConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get config
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// ─── Concurrency Controls ──────────────────

export interface ConcurrencyConfig {
  maxConcurrentPerTenant: number;
  maxConcurrentGlobal: number;
  queueTimeout: number; // ms
}

export class ConcurrencyLimiter {
  private activeCounts = new Map<string, number>();
  private globalActive = 0;
  private config: ConcurrencyConfig;

  constructor(config?: Partial<ConcurrencyConfig>) {
    this.config = {
      maxConcurrentPerTenant: config?.maxConcurrentPerTenant ?? 10,
      maxConcurrentGlobal: config?.maxConcurrentGlobal ?? 100,
      queueTimeout: config?.queueTimeout ?? 30_000,
    };
  }

  /**
   * Acquire a concurrency slot. Returns false if at capacity.
   */
  acquire(tenantId: string): boolean {
    const current = this.activeCounts.get(tenantId) || 0;

    if (current >= this.config.maxConcurrentPerTenant) return false;
    if (this.globalActive >= this.config.maxConcurrentGlobal) return false;

    this.activeCounts.set(tenantId, current + 1);
    this.globalActive++;
    return true;
  }

  /**
   * Release a concurrency slot
   */
  release(tenantId: string): void {
    const current = this.activeCounts.get(tenantId) || 0;
    if (current > 0) {
      this.activeCounts.set(tenantId, current - 1);
      this.globalActive--;
    }
  }

  /**
   * Get current concurrency for a tenant
   */
  getActive(tenantId: string): number {
    return this.activeCounts.get(tenantId) || 0;
  }

  /**
   * Get global concurrency
   */
  getGlobalActive(): number {
    return this.globalActive;
  }

  /**
   * Get config
   */
  getConfig(): ConcurrencyConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  setConfig(config: Partial<ConcurrencyConfig>): void {
    Object.assign(this.config, config);
  }
}

// ─── Singletons ─────────────────────────────

let llmCache: LlmCache | null = null;
let concurrencyLimiter: ConcurrencyLimiter | null = null;

export function getLlmCache(): LlmCache {
  if (!llmCache) {
    llmCache = new LlmCache();
  }
  return llmCache;
}

export function getConcurrencyLimiter(): ConcurrencyLimiter {
  if (!concurrencyLimiter) {
    concurrencyLimiter = new ConcurrencyLimiter();
  }
  return concurrencyLimiter;
}
