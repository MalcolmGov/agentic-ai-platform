import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";
import { NextRequest } from "next/server";

function makeRequest(view = "health") {
  return new NextRequest(`http://localhost:3000/api/health?view=${view}`);
}

describe("GET /api/health", () => {
  it("returns 200 with health status", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.version).toBe("1.0.0");
    expect(body.timestamp).toBeTruthy();
    expect(body.uptime).toHaveProperty("seconds");
    expect(body.uptime).toHaveProperty("human");
  });

  it("includes service statuses", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();
    expect(body.services.length).toBeGreaterThan(5);
    expect(body.services[0].status).toBe("operational");
  });

  it("returns liveness check", async () => {
    const response = await GET(makeRequest("liveness"));
    const body = await response.json();
    expect(body.alive).toBe(true);
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns readiness check", async () => {
    const response = await GET(makeRequest("readiness"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ready).toBe(true);
  });

  it("returns status page data", async () => {
    const response = await GET(makeRequest("status"));
    const body = await response.json();
    expect(body.data.overall).toBe("operational");
    expect(body.data.uptimeHistory.length).toBe(30);
  });
});
