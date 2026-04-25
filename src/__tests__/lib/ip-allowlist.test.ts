import { describe, it, expect, beforeEach } from "vitest";
import { IpAllowlistManager } from "@/lib/security/ip-allowlist";

describe("IpAllowlistManager", () => {
  let mgr: IpAllowlistManager;

  beforeEach(() => {
    mgr = new IpAllowlistManager();
  });

  describe("isAllowed", () => {
    it("allows all IPs when not enabled", () => {
      expect(mgr.isAllowed("t1", "1.2.3.4")).toBe(true);
    });

    it("blocks all IPs when enabled with no rules", () => {
      mgr.setEnabled("t1", true);
      expect(mgr.isAllowed("t1", "1.2.3.4")).toBe(false);
    });

    it("allows matching IP", () => {
      mgr.setEnabled("t1", true);
      mgr.addRule("t1", "10.0.0.1", "Office", "user1");
      expect(mgr.isAllowed("t1", "10.0.0.1")).toBe(true);
      expect(mgr.isAllowed("t1", "10.0.0.2")).toBe(false);
    });

    it("supports CIDR ranges", () => {
      mgr.setEnabled("t1", true);
      mgr.addRule("t1", "192.168.1.0/24", "LAN", "user1");
      expect(mgr.isAllowed("t1", "192.168.1.50")).toBe(true);
      expect(mgr.isAllowed("t1", "192.168.2.1")).toBe(false);
    });

    it("supports /16 CIDR", () => {
      mgr.setEnabled("t1", true);
      mgr.addRule("t1", "10.0.0.0/16", "VPN", "user1");
      expect(mgr.isAllowed("t1", "10.0.255.255")).toBe(true);
      expect(mgr.isAllowed("t1", "10.1.0.1")).toBe(false);
    });
  });

  describe("addRule", () => {
    it("creates a rule with ID", () => {
      const rule = mgr.addRule("t1", "10.0.0.1", "Office", "user1");
      expect(rule.id).toMatch(/^ipr_/);
      expect(rule.cidr).toBe("10.0.0.1");
      expect(rule.label).toBe("Office");
    });

    it("rejects invalid CIDR", () => {
      expect(() => mgr.addRule("t1", "invalid", "Bad", "user1")).toThrow("Invalid IP/CIDR");
    });

    it("rejects invalid CIDR mask", () => {
      expect(() => mgr.addRule("t1", "10.0.0.0/33", "Bad", "user1")).toThrow("Invalid IP/CIDR");
    });
  });

  describe("removeRule", () => {
    it("removes an existing rule", () => {
      mgr.setEnabled("t1", true);
      const rule = mgr.addRule("t1", "10.0.0.1", "Office", "user1");
      expect(mgr.removeRule("t1", rule.id)).toBe(true);
      expect(mgr.listRules("t1")).toHaveLength(0);
    });

    it("returns false for unknown rule", () => {
      expect(mgr.removeRule("t1", "unknown")).toBe(false);
    });
  });

  describe("setEnabled", () => {
    it("enables and disables allowlist", () => {
      mgr.setEnabled("t1", true);
      expect(mgr.getConfig("t1")!.enabled).toBe(true);
      mgr.setEnabled("t1", false);
      expect(mgr.getConfig("t1")!.enabled).toBe(false);
    });
  });
});
