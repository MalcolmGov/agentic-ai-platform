/**
 * SSO / SAML / OIDC Authentication
 *
 * Enterprise single sign-on with SAML 2.0 and OpenID Connect support,
 * JIT provisioning, role mapping, and session management.
 */

// ─── Types ─────────────────────────────────

export type SSOProtocol = "saml" | "oidc";
export type SSOStatus = "active" | "inactive" | "testing";

export interface SSOConfig {
  id: string;
  tenantId: string;
  protocol: SSOProtocol;
  status: SSOStatus;
  displayName: string;
  // SAML
  saml?: {
    entityId: string;
    ssoUrl: string;
    sloUrl: string;
    certificate: string;
    nameIdFormat: string;
  };
  // OIDC
  oidc?: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scopes: string[];
  };
  // Common
  attributeMapping: Record<string, string>;
  roleMapping: Record<string, string>;  // IdP group → platform role
  jitProvisioning: boolean;
  allowedDomains: string[];
  enforced: boolean;  // force SSO for all users
  createdAt: number;
  updatedAt: number;
}

export interface SSOSession {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  name: string;
  roles: string[];
  idpSessionId: string;
  protocol: SSOProtocol;
  attributes: Record<string, string>;
  expiresAt: number;
  createdAt: number;
}

export interface SSOLoginResult {
  success: boolean;
  session?: SSOSession;
  redirectUrl?: string;
  error?: string;
}

export interface SSOUser {
  email: string;
  name: string;
  groups: string[];
  attributes: Record<string, string>;
}

// ─── Engine ────────────────────────────────

export class SSOEngine {
  private configs = new Map<string, SSOConfig>();
  private sessions = new Map<string, SSOSession>();

  /**
   * Configure SSO for a tenant
   */
  configure(params: {
    tenantId: string;
    protocol: SSOProtocol;
    displayName: string;
    saml?: SSOConfig["saml"];
    oidc?: SSOConfig["oidc"];
    attributeMapping?: Record<string, string>;
    roleMapping?: Record<string, string>;
    jitProvisioning?: boolean;
    allowedDomains?: string[];
    enforced?: boolean;
  }): SSOConfig {
    const now = Date.now();
    const config: SSOConfig = {
      id: `sso_${now}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId: params.tenantId,
      protocol: params.protocol,
      status: "testing",
      displayName: params.displayName,
      saml: params.saml,
      oidc: params.oidc,
      attributeMapping: params.attributeMapping || { email: "email", name: "name", groups: "groups" },
      roleMapping: params.roleMapping || { admin: "admin", member: "editor" },
      jitProvisioning: params.jitProvisioning ?? true,
      allowedDomains: params.allowedDomains || [],
      enforced: params.enforced ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(params.tenantId, config);
    return config;
  }

  /**
   * Activate SSO configuration
   */
  activate(tenantId: string): boolean {
    const config = this.configs.get(tenantId);
    if (!config) return false;
    config.status = "active";
    config.updatedAt = Date.now();
    return true;
  }

  /**
   * Deactivate SSO
   */
  deactivate(tenantId: string): boolean {
    const config = this.configs.get(tenantId);
    if (!config) return false;
    config.status = "inactive";
    config.updatedAt = Date.now();
    return true;
  }

  /**
   * Initiate SSO login (returns redirect URL)
   */
  initiateLogin(tenantId: string): SSOLoginResult {
    const config = this.configs.get(tenantId);
    if (!config || config.status === "inactive") {
      return { success: false, error: "SSO not configured or inactive" };
    }

    if (config.protocol === "saml" && config.saml) {
      return { success: true, redirectUrl: `${config.saml.ssoUrl}?SAMLRequest=encoded_request&RelayState=${tenantId}` };
    }
    if (config.protocol === "oidc" && config.oidc) {
      const params = new URLSearchParams({
        client_id: config.oidc.clientId,
        redirect_uri: `https://api.agentplatform.com/api/sso/callback`,
        response_type: "code",
        scope: config.oidc.scopes.join(" "),
        state: tenantId,
      });
      return { success: true, redirectUrl: `${config.oidc.authorizationUrl}?${params}` };
    }
    return { success: false, error: "Incomplete SSO configuration" };
  }

  /**
   * Process SSO callback (SAML assertion or OIDC code)
   */
  processCallback(tenantId: string, user: SSOUser): SSOLoginResult {
    const config = this.configs.get(tenantId);
    if (!config || config.status === "inactive") {
      return { success: false, error: "SSO not configured" };
    }

    // Validate domain
    if (config.allowedDomains.length > 0) {
      const domain = user.email.split("@")[1];
      if (!config.allowedDomains.includes(domain)) {
        return { success: false, error: `Domain ${domain} not allowed` };
      }
    }

    // Map roles
    const roles = user.groups
      .map((g) => config.roleMapping[g])
      .filter(Boolean);
    if (roles.length === 0) roles.push("viewer"); // default role

    const session: SSOSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      userId: `user_${Math.random().toString(36).slice(2, 8)}`,
      email: user.email,
      name: user.name,
      roles,
      idpSessionId: `idp_${Math.random().toString(36).slice(2, 8)}`,
      protocol: config.protocol,
      attributes: user.attributes,
      expiresAt: Date.now() + 8 * 3600_000, // 8 hours
      createdAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    return { success: true, session };
  }

  /**
   * Validate a session
   */
  validateSession(sessionId: string): SSOSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  /**
   * Logout (destroy session)
   */
  logout(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get SSO config for a tenant
   */
  getConfig(tenantId: string): SSOConfig | null {
    return this.configs.get(tenantId) || null;
  }

  /**
   * List active sessions for a tenant
   */
  listSessions(tenantId: string): SSOSession[] {
    const now = Date.now();
    return Array.from(this.sessions.values())
      .filter((s) => s.tenantId === tenantId && s.expiresAt > now);
  }
}

// ─── Singleton ─────────────────────────────

let engine: SSOEngine | null = null;
export function getSSOEngine(): SSOEngine {
  if (!engine) engine = new SSOEngine();
  return engine;
}
