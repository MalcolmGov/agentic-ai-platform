/**
 * Scoped API Keys — Per-tenant key management
 * 
 * Tenants can generate API keys with specific scopes.
 * Keys are hashed at rest (only prefix shown).
 */

import crypto from "crypto";
import { env } from "@/lib/config/env";

// ─── Types ─────────────────────────────────

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;        // First 8 chars (shown to user)
  keyHash: string;       // SHA-256 hash (stored)
  scopes: ApiScope[];
  tenantId: string;
  createdBy: string;
  status: "active" | "revoked" | "expired";
  lastUsedAt?: number;
  expiresAt?: number;
  createdAt: number;
}

export type ApiScope =
  | "agents:read" | "agents:write" | "agents:execute"
  | "workflows:read" | "workflows:write"
  | "analytics:read"
  | "logs:read"
  | "files:read" | "files:write"
  | "webhooks:write"
  | "full_access";

const ALL_SCOPES: ApiScope[] = [
  "agents:read", "agents:write", "agents:execute",
  "workflows:read", "workflows:write",
  "analytics:read", "logs:read",
  "files:read", "files:write",
  "webhooks:write", "full_access",
];

// ─── In-Memory Store ──────────────────────

const keyStore = new Map<string, ApiKeyRecord>();

// ─── Key Generation ───────────────────────

/**
 * Generate a new API key
 * Returns the raw key (only shown once) and the record
 */
export function generateApiKey(
  name: string,
  scopes: ApiScope[],
  tenantId: string,
  createdBy: string,
  expiresInDays?: number
): { rawKey: string; record: ApiKeyRecord } {
  // Generate raw key: aai_<32 random hex chars>
  const randomPart = crypto.randomBytes(24).toString("hex");
  const rawKey = `aai_${randomPart}`;
  const prefix = rawKey.slice(0, 8);
  const keyHash = hashKey(rawKey);

  // Validate scopes
  const validScopes = scopes.filter((s) => ALL_SCOPES.includes(s));
  if (validScopes.length === 0) {
    throw new Error("At least one valid scope is required");
  }

  const record: ApiKeyRecord = {
    id: `apikey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    prefix,
    keyHash,
    scopes: validScopes,
    tenantId,
    createdBy,
    status: "active",
    expiresAt: expiresInDays ? Date.now() + expiresInDays * 86400000 : undefined,
    createdAt: Date.now(),
  };

  keyStore.set(record.id, record);

  return { rawKey, record };
}

/**
 * Validate an API key and return its record
 */
export function validateApiKey(rawKey: string): ApiKeyRecord | null {
  const hash = hashKey(rawKey);

  for (const record of keyStore.values()) {
    if (record.keyHash === hash) {
      // Check status
      if (record.status !== "active") return null;

      // Check expiry
      if (record.expiresAt && Date.now() > record.expiresAt) {
        record.status = "expired";
        return null;
      }

      // Update last used
      record.lastUsedAt = Date.now();
      return record;
    }
  }

  return null;
}

/**
 * Check if a key has a specific scope
 */
export function hasScope(record: ApiKeyRecord, scope: ApiScope): boolean {
  return record.scopes.includes("full_access") || record.scopes.includes(scope);
}

/**
 * Revoke an API key
 */
export function revokeApiKey(keyId: string, tenantId: string): boolean {
  const record = keyStore.get(keyId);
  if (!record || record.tenantId !== tenantId) return false;
  record.status = "revoked";
  return true;
}

/**
 * List API keys for a tenant (without hashes)
 */
export function listApiKeys(tenantId: string): Array<Omit<ApiKeyRecord, "keyHash">> {
  return Array.from(keyStore.values())
    .filter((k) => k.tenantId === tenantId)
    .map(({ keyHash: _, ...rest }) => rest);
}

// ─── Helpers ──────────────────────────────

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

// ─── Encryption Utilities ─────────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data at rest
 */
export function encrypt(plaintext: string): string {
  const key = Buffer.from(env.ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt data
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = Buffer.from(env.ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
