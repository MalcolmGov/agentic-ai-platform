/**
 * API Keys Management API
 * 
 * POST /api/keys — Generate a new API key
 * GET  /api/keys — List API keys
 * DELETE /api/keys — Revoke a key
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { generateApiKey, listApiKeys, revokeApiKey, ApiScope } from "@/lib/security/api-keys";
import { auditFromRequest } from "@/lib/audit/logger";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

// GET — List API keys (masked)
export const GET = withAuth("apikeys:read", async (_req, { user }) => {
  const keys = listApiKeys(user.tenantId);
  return apiResponse({
    keys: keys.map((k) => ({
      ...k,
      createdAt: new Date(k.createdAt).toISOString(),
      lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
      expiresAt: k.expiresAt ? new Date(k.expiresAt).toISOString() : null,
    })),
    total: keys.length,
  });
});

// POST — Generate a new API key
export const POST = withAuth("apikeys:create", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { name, scopes, expiresInDays } = body;

    if (!name) return apiError("name is required", 400);
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return apiError("scopes array is required", 400);
    }

    const { rawKey, record } = generateApiKey(
      name,
      scopes as ApiScope[],
      user.tenantId,
      user.userId,
      expiresInDays
    );

    await auditFromRequest(req, user, "apikey.create", `apikey:${record.id}`, {
      name, scopes, expiresInDays,
    });

    return apiResponse({
      key: rawKey, // Only shown once!
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      scopes: record.scopes,
      expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
      warning: "Store this key securely — it will not be shown again.",
    }, 201);
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
});

// DELETE — Revoke an API key
export const DELETE = withAuth("apikeys:revoke", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { keyId } = body;
    if (!keyId) return apiError("keyId is required", 400);

    const revoked = revokeApiKey(keyId, user.tenantId);
    if (!revoked) return apiError("Key not found or already revoked", 404);

    await auditFromRequest(req, user, "apikey.revoke", `apikey:${keyId}`);

    return apiResponse({ keyId, status: "revoked" });
  } catch {
    return apiError("Invalid request", 400);
  }
});
