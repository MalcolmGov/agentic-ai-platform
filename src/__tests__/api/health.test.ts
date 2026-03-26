import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the route
vi.mock("@/lib/db/prisma", () => ({
  default: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 with health status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.version).toBe("1.0.0");
    expect(body.timestamp).toBeTruthy();
    expect(body.uptime).toHaveProperty("seconds");
    expect(body.uptime).toHaveProperty("human");
    expect(body.memory).toHaveProperty("heapUsedMB");
    expect(body.node).toBeTruthy();
  });

  it("includes service statuses", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.services.database.status).toBe("operational");
    expect(body.services.agentEngine.status).toBe("operational");
    expect(body.services.auditLogger.status).toBe("operational");
  });

  it("returns 503 when database is down", async () => {
    const prisma = await import("@/lib/db/prisma");
    vi.mocked(prisma.default.$queryRaw).mockRejectedValueOnce(new Error("Connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.services.database.status).toBe("down");
    expect(body.services.database.error).toContain("Connection refused");
  });
});
