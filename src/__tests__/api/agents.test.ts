import { describe, it, expect, beforeAll } from "vitest";
import { GET, POST } from "@/app/api/agents/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";
import { generateToken } from "@/lib/auth/jwt";

// Generate a valid JWT for testing
function makeAuthToken(role: "OWNER" | "ADMIN" | "DEVELOPER" | "ANALYST" | "VIEWER" = "OWNER") {
  return generateToken({
    userId: "user_test_001",
    tenantId: "tenant_test_001",
    email: "testuser@acme.com",
    role,
  });
}

function makeGetRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost:3000/api/agents", {
    method: "GET",
    headers,
  });
}

function makePostRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost:3000/api/agents", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

describe("Agents API", () => {
  describe("GET /api/agents", () => {
    it("returns agent types with valid auth", async () => {
      const token = makeAuthToken();
      const response = await GET(makeGetRequest(token));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.agentTypes).toBeDefined();
      expect(body.data.agentTypes.length).toBeGreaterThan(0);
      expect(body.data.total).toBe(body.data.agentTypes.length);
      expect(body.data.tenantId).toBe("tenant_test_001");
    });

    it("returns correct agent type structure", async () => {
      const token = makeAuthToken();
      const response = await GET(makeGetRequest(token));
      const body = await response.json();

      const agentType = body.data.agentTypes[0];
      expect(agentType).toHaveProperty("id");
      expect(agentType).toHaveProperty("name");
      expect(agentType).toHaveProperty("description");
      expect(agentType).toHaveProperty("category");
    });

    it("returns 401 without auth token", async () => {
      const response = await GET(makeGetRequest());
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("allows VIEWER role to read agents", async () => {
      const token = makeAuthToken("VIEWER");
      const response = await GET(makeGetRequest(token));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe("POST /api/agents", () => {
    it("creates an agent with valid data and auth", async () => {
      const token = makeAuthToken("DEVELOPER");
      const response = await POST(
        makePostRequest(
          {
            name: "Fraud Detection Agent",
            type: "FRAUD_MONITORING",
            description: "Monitors transactions for fraud",
            llmProvider: "anthropic",
            llmModel: "claude-3",
            systemPrompt: "You are a fraud detection specialist.",
          },
          token
        )
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toMatch(/^agent_/);
      expect(body.data.name).toBe("Fraud Detection Agent");
      expect(body.data.type).toBe("FRAUD_MONITORING");
      expect(body.data.tenantId).toBe("tenant_test_001");
      expect(body.data.llmProvider).toBe("anthropic");
      expect(body.data.llmModel).toBe("claude-3");
      expect(body.data.status).toBe("ACTIVE");
    });

    it("creates an agent with default llm values", async () => {
      const token = makeAuthToken();
      const response = await POST(
        makePostRequest(
          {
            name: "Support Agent",
            type: "CUSTOMER_SUPPORT",
          },
          token
        )
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.llmProvider).toBe("openai");
      expect(body.data.llmModel).toBe("gpt-4o");
    });

    it("returns validation error for missing required fields", async () => {
      const token = makeAuthToken();
      const response = await POST(
        makePostRequest(
          {
            description: "Missing name and type",
          },
          token
        )
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("returns validation error for invalid agent type", async () => {
      const token = makeAuthToken();
      const response = await POST(
        makePostRequest(
          {
            name: "Bad Type Agent",
            type: "INVALID_TYPE",
          },
          token
        )
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("returns 401 without auth token", async () => {
      const response = await POST(
        makePostRequest({
          name: "Unauthorized Agent",
          type: "COMPLIANCE",
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("returns 403 for VIEWER role trying to create", async () => {
      const token = makeAuthToken("VIEWER");
      const response = await POST(
        makePostRequest(
          {
            name: "Viewer Agent",
            type: "REPORTING",
          },
          token
        )
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });
});
