import { describe, it, expect, beforeEach } from "vitest";
import { IndustryPackManager, INDUSTRY_PACKS } from "@/lib/industry-packs/industry-packs";

describe("IndustryPackManager", () => {
  let manager: IndustryPackManager;

  beforeEach(() => {
    manager = new IndustryPackManager();
  });

  describe("getPacks", () => {
    it("returns all industry packs", () => {
      const packs = manager.getPacks();
      expect(packs.length).toBe(5);
      expect(packs.map((p) => p.industry)).toContain("Financial Services");
      expect(packs.map((p) => p.industry)).toContain("Healthcare");
    });
  });

  describe("getPack", () => {
    it("finds a pack by industry name", () => {
      const pack = manager.getPack("Financial Services");
      expect(pack).not.toBeNull();
      expect(pack!.agents.length).toBe(3);
    });

    it("is case-insensitive", () => {
      const pack = manager.getPack("healthcare");
      expect(pack).not.toBeNull();
    });

    it("returns null for unknown industry", () => {
      expect(manager.getPack("Aerospace")).toBeNull();
    });
  });

  describe("getBlueprint", () => {
    it("finds a blueprint by id", () => {
      const result = manager.getBlueprint("bp_aml_monitor");
      expect(result).not.toBeNull();
      expect(result!.blueprint.name).toBe("AML Transaction Monitor");
      expect(result!.pack.industry).toBe("Financial Services");
    });

    it("returns null for unknown blueprint", () => {
      expect(manager.getBlueprint("bp_unknown")).toBeNull();
    });
  });

  describe("deployBlueprint", () => {
    it("deploys a blueprint with tenant context", () => {
      const deployed = manager.deployBlueprint("bp_aml_monitor", "t1");
      expect(deployed).not.toBeNull();
      expect(deployed!.deployedId).toMatch(/^agent_/);
      expect(deployed!.tenantId).toBe("t1");
      expect(deployed!.systemPrompt).toBeTruthy();
    });

    it("returns null for invalid blueprint", () => {
      expect(manager.deployBlueprint("invalid", "t1")).toBeNull();
    });
  });

  describe("searchBlueprints", () => {
    it("searches by name keyword", () => {
      const results = manager.searchBlueprints("fraud");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name.toLowerCase().includes("fraud"))).toBe(true);
    });

    it("searches by description content", () => {
      const results = manager.searchBlueprints("transaction");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty for no match", () => {
      const results = manager.searchBlueprints("xyznonexistent");
      expect(results.length).toBe(0);
    });
  });

  describe("industry packs content", () => {
    it("all packs have regulation references", () => {
      for (const pack of INDUSTRY_PACKS) {
        expect(pack.regulations.length).toBeGreaterThan(0);
        for (const reg of pack.regulations) {
          expect(reg.code).toBeTruthy();
          expect(reg.requirements.length).toBeGreaterThan(0);
        }
      }
    });

    it("all blueprints have compliance frameworks", () => {
      for (const pack of INDUSTRY_PACKS) {
        for (const bp of pack.agents) {
          expect(bp.complianceFrameworks.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
