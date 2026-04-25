/**
 * IP Allowlisting — Tenant-level IP access control
 *
 * Manages IP allowlists per tenant, supports CIDR notation,
 * and provides middleware for enforcement.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Types ─────────────────────────────────

export interface IpRule {
  id: string;
  tenantId: string;
  cidr: string;        // IP or CIDR (e.g., "192.168.1.0/24" or "10.0.0.1")
  label: string;
  createdBy: string;
  createdAt: number;
}

export interface IpAllowlistConfig {
  tenantId: string;
  enabled: boolean;
  rules: IpRule[];
  updatedAt: number;
}

// ─── CIDR Matching ─────────────────────────

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function cidrContains(cidr: string, ip: string): boolean {
  const [network, bits] = cidr.split("/");
  const maskBits = bits ? parseInt(bits, 10) : 32;
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;

  const networkNum = ipToNumber(network) & mask;
  const ipNum = ipToNumber(ip) & mask;

  return networkNum === ipNum;
}

// ─── IP Allowlist Manager ──────────────────

export class IpAllowlistManager {
  private configs = new Map<string, IpAllowlistConfig>();

  /**
   * Enable or disable allowlisting for a tenant
   */
  setEnabled(tenantId: string, enabled: boolean): IpAllowlistConfig {
    const config = this.getOrCreateConfig(tenantId);
    config.enabled = enabled;
    config.updatedAt = Date.now();
    return config;
  }

  /**
   * Add an IP rule
   */
  addRule(tenantId: string, cidr: string, label: string, createdBy: string): IpRule {
    const config = this.getOrCreateConfig(tenantId);

    // Validate CIDR format
    if (!this.isValidCidr(cidr)) {
      throw new Error(`Invalid IP/CIDR format: ${cidr}`);
    }

    const rule: IpRule = {
      id: `ipr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      cidr,
      label,
      createdBy,
      createdAt: Date.now(),
    };

    config.rules.push(rule);
    config.updatedAt = Date.now();
    return rule;
  }

  /**
   * Remove an IP rule
   */
  removeRule(tenantId: string, ruleId: string): boolean {
    const config = this.configs.get(tenantId);
    if (!config) return false;

    const idx = config.rules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return false;

    config.rules.splice(idx, 1);
    config.updatedAt = Date.now();
    return true;
  }

  /**
   * Check if an IP is allowed for a tenant
   */
  isAllowed(tenantId: string, ip: string): boolean {
    const config = this.configs.get(tenantId);

    // If no config or not enabled, allow all
    if (!config || !config.enabled) return true;

    // If enabled but no rules, block all (fail-closed)
    if (config.rules.length === 0) return false;

    // Check against all rules
    return config.rules.some((rule) => cidrContains(rule.cidr, ip));
  }

  /**
   * Get config for a tenant
   */
  getConfig(tenantId: string): IpAllowlistConfig | null {
    return this.configs.get(tenantId) || null;
  }

  /**
   * List rules for a tenant
   */
  listRules(tenantId: string): IpRule[] {
    return this.configs.get(tenantId)?.rules || [];
  }

  private getOrCreateConfig(tenantId: string): IpAllowlistConfig {
    let config = this.configs.get(tenantId);
    if (!config) {
      config = { tenantId, enabled: false, rules: [], updatedAt: Date.now() };
      this.configs.set(tenantId, config);
    }
    return config;
  }

  private isValidCidr(cidr: string): boolean {
    const parts = cidr.split("/");
    const ip = parts[0];
    const bits = parts[1] ? parseInt(parts[1], 10) : 32;

    if (bits < 0 || bits > 32) return false;

    const octets = ip.split(".");
    if (octets.length !== 4) return false;

    return octets.every((o) => {
      const n = parseInt(o, 10);
      return n >= 0 && n <= 255 && String(n) === o;
    });
  }
}

// ─── Singleton ──────────────────────────────

let manager: IpAllowlistManager | null = null;

export function getIpAllowlistManager(): IpAllowlistManager {
  if (!manager) {
    manager = new IpAllowlistManager();
  }
  return manager;
}

// ─── Middleware ──────────────────────────────

/**
 * Middleware to enforce IP allowlisting.
 * Must be used after authentication (needs tenantId).
 */
export function withIpAllowlist(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Extract tenantId from JWT if present
    let tenantId: string | null = null;
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.decode(authHeader.slice(7)) as { tenantId?: string } | null;
        tenantId = decoded?.tenantId || null;
      }
    } catch {
      // Continue without tenant context
    }

    if (tenantId) {
      const mgr = getIpAllowlistManager();
      if (!mgr.isAllowed(tenantId, ip)) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied: IP not in allowlist",
            ip,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
    }

    return handler(req);
  };
}
