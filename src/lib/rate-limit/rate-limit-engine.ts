/**
 * Rate Limiting & API Throttling
 *
 * Sliding window rate limiter with per-tenant, per-endpoint,
 * and global limits. Supports burst allowance and quota headers.
 */

// ─── Types ─────────────────────────────────

export interface RateLimitConfig {
  id: string;
  tenantId: string;
  endpoint: string;      // "*" for global, or specific path
  maxRequests: number;
  windowSeconds: number;
  burstAllowance: number; // extra requests allowed in burst
  enabled: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;       // unix ms
  retryAfterSeconds: number | null;
  headers: Record<string, string>;
}

export interface RateLimitEntry {
  tenantId: string;
  endpoint: string;
  requests: number[];    // timestamps of requests in current window
}

export interface UsageStats {
  tenantId: string;
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  throttledCount: number;
  lastRequestAt: number | null;
}

// ─── Default Limits by Plan ────────────────

const PLAN_RATE_LIMITS: Record<string, { requestsPerMinute: number; requestsPerHour: number; burstAllowance: number }> = {
  starter: { requestsPerMinute: 30, requestsPerHour: 500, burstAllowance: 10 },
  professional: { requestsPerMinute: 120, requestsPerHour: 5000, burstAllowance: 30 },
  enterprise: { requestsPerMinute: 600, requestsPerHour: 50000, burstAllowance: 100 },
};

// ─── Engine ────────────────────────────────

export class RateLimitEngine {
  private configs = new Map<string, RateLimitConfig[]>();
  private entries = new Map<string, RateLimitEntry>();
  private throttledCounts = new Map<string, number>();

  /**
   * Check if a request is allowed under rate limits
   */
  checkLimit(tenantId: string, endpoint: string, plan = "professional"): RateLimitResult {
    const configs = this.getEffectiveConfigs(tenantId, endpoint, plan);
    const now = Date.now();

    // Check each applicable config, return the strictest denial
    for (const config of configs) {
      if (!config.enabled) continue;

      const key = `${tenantId}:${config.endpoint}:${config.windowSeconds}`;
      const entry = this.entries.get(key) || { tenantId, endpoint: config.endpoint, requests: [] };

      // Clean old requests outside window
      const windowStart = now - config.windowSeconds * 1000;
      entry.requests = entry.requests.filter((t) => t > windowStart);

      const effectiveLimit = config.maxRequests + config.burstAllowance;
      const remaining = Math.max(0, effectiveLimit - entry.requests.length);
      const resetAt = entry.requests.length > 0 ? entry.requests[0] + config.windowSeconds * 1000 : now + config.windowSeconds * 1000;

      if (entry.requests.length >= effectiveLimit) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        this.throttledCounts.set(tenantId, (this.throttledCounts.get(tenantId) || 0) + 1);

        return {
          allowed: false, limit: config.maxRequests, remaining: 0, resetAt,
          retryAfterSeconds: retryAfter,
          headers: {
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
            "Retry-After": String(retryAfter),
          },
        };
      }

      // Record request
      entry.requests.push(now);
      this.entries.set(key, entry);
    }

    // Find the most restrictive remaining count
    let lowestRemaining = Infinity;
    let lowestLimit = 0;
    let nearestReset = now + 60000;

    for (const config of configs) {
      if (!config.enabled) continue;
      const key = `${tenantId}:${config.endpoint}:${config.windowSeconds}`;
      const entry = this.entries.get(key);
      if (entry) {
        const effectiveLimit = config.maxRequests + config.burstAllowance;
        const rem = effectiveLimit - entry.requests.length;
        if (rem < lowestRemaining) {
          lowestRemaining = rem;
          lowestLimit = config.maxRequests;
          nearestReset = entry.requests.length > 0 ? entry.requests[0] + config.windowSeconds * 1000 : now + config.windowSeconds * 1000;
        }
      }
    }

    return {
      allowed: true, limit: lowestLimit, remaining: Math.max(0, lowestRemaining), resetAt: nearestReset,
      retryAfterSeconds: null,
      headers: {
        "X-RateLimit-Limit": String(lowestLimit),
        "X-RateLimit-Remaining": String(Math.max(0, lowestRemaining)),
        "X-RateLimit-Reset": String(Math.ceil(nearestReset / 1000)),
      },
    };
  }

  /**
   * Set custom rate limit for a tenant/endpoint
   */
  setLimit(config: Omit<RateLimitConfig, "id">): RateLimitConfig {
    const full: RateLimitConfig = { ...config, id: `rl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    const existing = this.configs.get(config.tenantId) || [];
    const idx = existing.findIndex((c) => c.endpoint === config.endpoint && c.windowSeconds === config.windowSeconds);
    if (idx >= 0) { existing[idx] = full; } else { existing.push(full); }
    this.configs.set(config.tenantId, existing);
    return full;
  }

  /**
   * Get usage stats for a tenant
   */
  getUsageStats(tenantId: string): UsageStats {
    const requestsByEndpoint: Record<string, number> = {};
    let totalRequests = 0;
    let lastRequestAt: number | null = null;

    for (const [key, entry] of this.entries) {
      if (!key.startsWith(`${tenantId}:`)) continue;
      const count = entry.requests.length;
      totalRequests += count;
      requestsByEndpoint[entry.endpoint] = (requestsByEndpoint[entry.endpoint] || 0) + count;
      const latest = entry.requests[entry.requests.length - 1];
      if (latest && (!lastRequestAt || latest > lastRequestAt)) lastRequestAt = latest;
    }

    return {
      tenantId, totalRequests, requestsByEndpoint,
      throttledCount: this.throttledCounts.get(tenantId) || 0,
      lastRequestAt,
    };
  }

  /**
   * Get limits for a tenant
   */
  getLimits(tenantId: string): RateLimitConfig[] {
    return this.configs.get(tenantId) || [];
  }

  /**
   * Reset rate limit counters for a tenant
   */
  resetCounters(tenantId: string): boolean {
    const keysToDelete: string[] = [];
    for (const key of this.entries.keys()) {
      if (key.startsWith(`${tenantId}:`)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => this.entries.delete(k));
    this.throttledCounts.delete(tenantId);
    return keysToDelete.length > 0;
  }

  // ─── Private ─────────────────────────────

  private getEffectiveConfigs(tenantId: string, endpoint: string, plan: string): RateLimitConfig[] {
    const custom = this.configs.get(tenantId) || [];
    const applicable = custom.filter((c) => c.endpoint === "*" || c.endpoint === endpoint);

    // If no custom configs, use plan defaults
    if (applicable.length === 0) {
      const planLimits = PLAN_RATE_LIMITS[plan] || PLAN_RATE_LIMITS.professional;
      return [
        { id: "default_minute", tenantId, endpoint: "*", maxRequests: planLimits.requestsPerMinute, windowSeconds: 60, burstAllowance: planLimits.burstAllowance, enabled: true },
        { id: "default_hour", tenantId, endpoint: "*", maxRequests: planLimits.requestsPerHour, windowSeconds: 3600, burstAllowance: planLimits.burstAllowance * 5, enabled: true },
      ];
    }
    return applicable;
  }
}

// ─── Singleton ─────────────────────────────

let engine: RateLimitEngine | null = null;
export function getRateLimitEngine(): RateLimitEngine {
  if (!engine) engine = new RateLimitEngine();
  return engine;
}
