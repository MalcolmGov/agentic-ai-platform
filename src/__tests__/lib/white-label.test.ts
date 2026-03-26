import { describe, it, expect, beforeEach } from "vitest";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";

describe("WhiteLabelEngine", () => {
  let engine: WhiteLabelEngine;

  beforeEach(() => {
    engine = new WhiteLabelEngine();
  });

  describe("configure", () => {
    it("sets up branding with defaults", () => {
      const config = engine.configure({ tenantId: "t1", companyName: "Acme Corp" });
      expect(config.id).toMatch(/^brand_/);
      expect(config.companyName).toBe("Acme Corp");
      expect(config.theme.primaryColor).toBe("#2563eb");
      expect(config.loginPage.title).toContain("Acme Corp");
    });

    it("applies custom theme", () => {
      const config = engine.configure({ tenantId: "t1", companyName: "Test", theme: { primaryColor: "#ff0000", darkMode: true } });
      expect(config.theme.primaryColor).toBe("#ff0000");
      expect(config.theme.darkMode).toBe(true);
      expect(config.theme.fontFamily).toBeTruthy(); // defaults preserved
    });

    it("updates existing config", () => {
      engine.configure({ tenantId: "t1", companyName: "Old Name" });
      const updated = engine.configure({ tenantId: "t1", companyName: "New Name", logoUrl: "https://logo.png" });
      expect(updated.companyName).toBe("New Name");
      expect(updated.logoUrl).toBe("https://logo.png");
    });
  });

  describe("custom domains", () => {
    it("sets up a custom domain with verification", () => {
      engine.configure({ tenantId: "t1", companyName: "Acme" });
      const domain = engine.setupCustomDomain("t1", "agents.acme.com");
      expect(domain).not.toBeNull();
      expect(domain!.status).toBe("pending_verification");
      expect(domain!.verificationRecord.type).toBe("CNAME");
    });

    it("verifies a custom domain", () => {
      engine.configure({ tenantId: "t1", companyName: "Acme" });
      engine.setupCustomDomain("t1", "agents.acme.com");
      const verified = engine.verifyDomain("t1");
      expect(verified!.status).toBe("verified");
      expect(verified!.sslStatus).toBe("active");
    });

    it("looks up tenant by domain", () => {
      engine.configure({ tenantId: "t1", companyName: "Acme" });
      engine.setupCustomDomain("t1", "agents.acme.com");
      expect(engine.getTenantByDomain("agents.acme.com")).toBe("t1");
      expect(engine.getTenantByDomain("unknown.com")).toBeNull();
    });

    it("removes custom domain", () => {
      engine.configure({ tenantId: "t1", companyName: "Acme" });
      engine.setupCustomDomain("t1", "agents.acme.com");
      expect(engine.removeDomain("t1")).toBe(true);
      expect(engine.getConfig("t1")!.customDomain).toBeNull();
    });
  });

  describe("generateCssVariables", () => {
    it("generates CSS custom properties", () => {
      engine.configure({ tenantId: "t1", companyName: "Test", theme: { primaryColor: "#3b82f6" } });
      const css = engine.generateCssVariables("t1");
      expect(css).toContain("--color-primary: #3b82f6");
      expect(css).toContain("--font-family:");
      expect(css).toContain(":root");
    });
  });

  describe("resetTheme", () => {
    it("resets to default theme", () => {
      engine.configure({ tenantId: "t1", companyName: "Test", theme: { primaryColor: "#ff0000" } });
      const theme = engine.resetTheme("t1");
      expect(theme!.primaryColor).toBe("#2563eb");
    });
  });

  describe("email branding", () => {
    it("auto-generates email branding from company name", () => {
      const config = engine.configure({ tenantId: "t1", companyName: "Acme Corp" });
      expect(config.emailBranding.fromName).toBe("Acme Corp");
      expect(config.emailBranding.footerHtml).toContain("Acme Corp");
    });
  });

  describe("report branding", () => {
    it("sets report header and footer", () => {
      const config = engine.configure({ tenantId: "t1", companyName: "Acme", reportBranding: { tagline: "AI-Powered", footerText: "Confidential" } });
      expect(config.reportBranding.tagline).toBe("AI-Powered");
      expect(config.reportBranding.footerText).toBe("Confidential");
    });
  });
});
