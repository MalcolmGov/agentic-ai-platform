import { describe, it, expect, beforeEach } from "vitest";
import { OpenApiEngine } from "@/lib/openapi/openapi-spec";

describe("OpenApiEngine", () => {
  let engine: OpenApiEngine;

  beforeEach(() => {
    engine = new OpenApiEngine();
  });

  describe("getSpec", () => {
    it("generates valid OpenAPI 3.1 spec", () => {
      const spec = engine.getSpec();
      expect(spec.openapi).toBe("3.1.0");
      expect(spec.info.title).toBe("Agentic AI Platform API");
      expect(spec.servers.length).toBe(2);
      expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
    });

    it("includes security schemes", () => {
      const spec = engine.getSpec();
      expect(spec.components.securitySchemes.ApiKeyAuth).toBeDefined();
      expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
    });

    it("uses custom base URL", () => {
      const spec = engine.getSpec("https://custom.api.com");
      expect(spec.servers[0].url).toBe("https://custom.api.com");
    });
  });

  describe("listEndpoints", () => {
    it("returns all registered endpoints", () => {
      const endpoints = engine.listEndpoints();
      expect(endpoints.length).toBeGreaterThan(10);
      expect(endpoints.some((e) => e.path === "/api/agents")).toBe(true);
    });
  });

  describe("getEndpointsByTag", () => {
    it("filters endpoints by tag", () => {
      const agents = engine.getEndpointsByTag("Agents");
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.every((e) => e.tags.includes("Agents"))).toBe(true);
    });
  });

  describe("getCodeSamples", () => {
    it("generates code samples for an endpoint", () => {
      const samples = engine.getCodeSamples("/api/agents", "POST");
      expect(samples.length).toBe(3);
      expect(samples.map((s) => s.language)).toContain("bash");
      expect(samples.map((s) => s.language)).toContain("python");
      expect(samples.map((s) => s.language)).toContain("typescript");
    });

    it("returns empty for unknown endpoint", () => {
      expect(engine.getCodeSamples("/unknown", "GET")).toEqual([]);
    });
  });

  describe("registerEndpoint", () => {
    it("adds custom endpoints", () => {
      const before = engine.listEndpoints().length;
      engine.registerEndpoint({ path: "/api/custom", method: "GET", summary: "Custom", description: "Custom endpoint", tags: ["Custom"], security: ["ApiKeyAuth"], responses: {} });
      expect(engine.listEndpoints().length).toBe(before + 1);
    });
  });
});
