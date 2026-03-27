/**
 * Persistence Sync Layer
 *
 * Bridges in-memory engines with PostgreSQL via Prisma.
 * Engines remain in-memory-first for speed and test compatibility.
 * When DATABASE_URL is configured, mutations sync to the database.
 * On startup, engines hydrate from the database if available.
 */

import { prisma, hasPrisma } from './prisma';

// ─── Types ───────────────────────────────────

export interface SyncConfig {
  /** Prisma model name (e.g., 'tenant', 'agent') */
  model: string;
  /** Map in-memory field names to Prisma field names if they differ */
  fieldMapping?: Record<string, string>;
  /** Fields to exclude from DB sync (computed, transient, etc.) */
  excludeFields?: string[];
}

type PrismaModel = {
  findMany: (args?: any) => Promise<any[]>;
  upsert: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
};

// ─── Sync Helper ─────────────────────────────

function getModel(modelName: string): PrismaModel | null {
  if (!hasPrisma || !prisma) return null;
  const model = (prisma as any)[modelName];
  if (!model) {
    console.warn(`[persistence-sync] Model "${modelName}" not found on Prisma client`);
    return null;
  }
  return model as PrismaModel;
}

function mapFields(
  data: Record<string, any>,
  mapping?: Record<string, string>,
  exclude?: string[]
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (exclude?.includes(key)) continue;
    const mappedKey = mapping?.[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

// ─── Public API ──────────────────────────────

/**
 * Sync a single record to the database (upsert).
 * No-op if database is not configured.
 */
export async function syncToDb(config: SyncConfig, id: string, data: Record<string, any>): Promise<void> {
  const model = getModel(config.model);
  if (!model) return;

  const mapped = mapFields(data, config.fieldMapping, config.excludeFields);

  try {
    await model.upsert({
      where: { id },
      create: { id, ...mapped },
      update: mapped,
    });
  } catch (err) {
    console.warn(`[persistence-sync] Failed to sync ${config.model}#${id}:`, err);
  }
}

/**
 * Remove a record from the database.
 * No-op if database is not configured.
 */
export async function removeFromDb(config: SyncConfig, id: string): Promise<void> {
  const model = getModel(config.model);
  if (!model) return;

  try {
    await model.delete({ where: { id } });
  } catch (err) {
    // Record may not exist in DB — that's fine
  }
}

/**
 * Hydrate: load all records from the database.
 * Returns empty array if database is not configured.
 */
export async function hydrateFromDb<T>(
  config: SyncConfig,
  filter?: Record<string, any>
): Promise<T[]> {
  const model = getModel(config.model);
  if (!model) return [];

  try {
    const records = await model.findMany(filter ? { where: filter } : undefined);
    return records as T[];
  } catch (err) {
    console.warn(`[persistence-sync] Failed to hydrate ${config.model}:`, err);
    return [];
  }
}

/**
 * Batch sync multiple records to the database.
 * No-op if database is not configured.
 */
export async function batchSyncToDb(
  config: SyncConfig,
  items: Array<{ id: string } & Record<string, any>>
): Promise<void> {
  const model = getModel(config.model);
  if (!model) return;

  const promises = items.map((item) => {
    const { id, ...rest } = item;
    const mapped = mapFields(rest, config.fieldMapping, config.excludeFields);
    return model.upsert({
      where: { id },
      create: { id, ...mapped },
      update: mapped,
    }).catch((err: any) => {
      console.warn(`[persistence-sync] Failed to batch sync ${config.model}#${id}:`, err);
    });
  });

  await Promise.allSettled(promises);
}

/**
 * Check if database persistence is available
 */
export function isPersistenceEnabled(): boolean {
  return hasPrisma && prisma !== null;
}

/**
 * Get the current storage mode description
 */
export function getStorageInfo(): { mode: 'database' | 'memory'; details: string } {
  if (isPersistenceEnabled()) {
    return { mode: 'database', details: 'PostgreSQL via Prisma — data persists across restarts' };
  }
  return { mode: 'memory', details: 'In-memory storage — data resets on restart (set DATABASE_URL to enable persistence)' };
}
