import { describe, it, expect, beforeEach } from "vitest";
import { SSOEngine } from "@/lib/sso/sso-engine";

describe("SSOEngine", () => {
  let engine: SSOEngine;

  beforeEach(() => {
    engine = new SSOEngine();
  });

  describe("configure", () => {
    it("configures SAML SSO", () => {
      const config = engine.configure({
        tenantId: "t1", protocol: "saml", displayName: "Okta",
        saml: { entityId: "https://okta.com/abc", ssoUrl: "https://okta.com/sso", sloUrl: "https://okta.com/slo", certificate: "CERT_DATA", nameIdFormat: "email" },
        allowedDomains: ["acme.com"],
      });
      expect(config.id).toMatch(/^sso_/);
      expect(config.status).toBe("testing");
      expect(config.protocol).toBe("saml");
    });

    it("configures OIDC SSO", () => {
      const config = engine.configure({
        tenantId: "t1", protocol: "oidc", displayName: "Azure AD",
        oidc: { issuer: "https://login.microsoft.com/tenant", clientId: "client_123", clientSecret: "secret", authorizationUrl: "https://login.microsoft.com/authorize", tokenUrl: "https://login.microsoft.com/token", userInfoUrl: "https://login.microsoft.com/userinfo", scopes: ["openid", "profile", "email"] },
      });
      expect(config.protocol).toBe("oidc");
      expect(config.oidc!.clientId).toBe("client_123");
    });
  });

  describe("activate / deactivate", () => {
    it("activates SSO config", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "Okta", saml: { entityId: "e", ssoUrl: "s", sloUrl: "l", certificate: "c", nameIdFormat: "email" } });
      expect(engine.activate("t1")).toBe(true);
      expect(engine.getConfig("t1")!.status).toBe("active");
    });

    it("deactivates SSO config", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "Okta", saml: { entityId: "e", ssoUrl: "s", sloUrl: "l", certificate: "c", nameIdFormat: "email" } });
      engine.activate("t1");
      expect(engine.deactivate("t1")).toBe(true);
      expect(engine.getConfig("t1")!.status).toBe("inactive");
    });
  });

  describe("initiateLogin", () => {
    it("returns SAML redirect URL", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "Okta", saml: { entityId: "e", ssoUrl: "https://okta.com/sso", sloUrl: "l", certificate: "c", nameIdFormat: "email" } });
      engine.activate("t1");
      const result = engine.initiateLogin("t1");
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain("okta.com/sso");
    });

    it("returns OIDC redirect URL", () => {
      engine.configure({ tenantId: "t1", protocol: "oidc", displayName: "Azure", oidc: { issuer: "i", clientId: "c", clientSecret: "s", authorizationUrl: "https://azure.com/auth", tokenUrl: "t", userInfoUrl: "u", scopes: ["openid"] } });
      engine.activate("t1");
      const result = engine.initiateLogin("t1");
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain("azure.com/auth");
    });

    it("fails for inactive SSO", () => {
      const result = engine.initiateLogin("t1");
      expect(result.success).toBe(false);
    });
  });

  describe("processCallback", () => {
    it("creates a session from SSO callback", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "Okta", saml: { entityId: "e", ssoUrl: "s", sloUrl: "l", certificate: "c", nameIdFormat: "email" }, roleMapping: { admin: "admin" }, allowedDomains: ["acme.com"] });
      engine.activate("t1");
      const result = engine.processCallback("t1", { email: "user@acme.com", name: "John", groups: ["admin"], attributes: {} });
      expect(result.success).toBe(true);
      expect(result.session!.email).toBe("user@acme.com");
      expect(result.session!.roles).toContain("admin");
    });

    it("rejects unauthorized domains", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "Okta", saml: { entityId: "e", ssoUrl: "s", sloUrl: "l", certificate: "c", nameIdFormat: "email" }, allowedDomains: ["acme.com"] });
      engine.activate("t1");
      const result = engine.processCallback("t1", { email: "user@evil.com", name: "Hacker", groups: [], attributes: {} });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not allowed");
    });
  });

  describe("session management", () => {
    it("validates active sessions", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "O", saml: { entityId: "e", ssoUrl: "s", sloUrl: "l", certificate: "c", nameIdFormat: "email" } });
      engine.activate("t1");
      const { session } = engine.processCallback("t1", { email: "u@t.com", name: "U", groups: [], attributes: {} });
      expect(engine.validateSession(session!.id)).not.toBeNull();
    });

    it("logs out and destroys session", () => {
      engine.configure({ tenantId: "t1", protocol: "saml", displayName: "O", saml: { entityId: "e", ssoUrl: "s", sloUrl: "l", certificate: "c", nameIdFormat: "email" } });
      engine.activate("t1");
      const { session } = engine.processCallback("t1", { email: "u@t.com", name: "U", groups: [], attributes: {} });
      expect(engine.logout(session!.id)).toBe(true);
      expect(engine.validateSession(session!.id)).toBeNull();
    });
  });
});
