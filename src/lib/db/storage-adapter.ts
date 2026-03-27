/**
 * Storage Adapter — Unified persistence layer
 *
 * Engines use this adapter to store data. It auto-selects between:
 * - InMemoryAdapter: Fast, ephemeral (default when no DATABASE_URL)
 * - PrismaAdapter: Durable PostgreSQL persistence (when DATABASE_URL is set)
 *
 * This allows the platform to run fully functional without a database
 * (demo mode, Vercel preview) while persisting data when configured.
 */

// ─── Types ───────────────────────────────────

export type StorageMode = 'memory' | 'database';

export interface QueryFilter {
  [key: string]: unknown;
}

export interface QueryOptions {
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

export interface StorageAdapter<T extends { id: string }> {
  mode: StorageMode;
  get(id: string): Promise<T | null>;
  getMany(filter?: QueryFilter, options?: QueryOptions): Promise<T[]>;
  set(item: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
  count(filter?: QueryFilter): Promise<number>;
  clear(): Promise<void>;
}

// ─── In-Memory Adapter ───────────────────────

export class InMemoryAdapter<T extends { id: string }> implements StorageAdapter<T> {
  readonly mode: StorageMode = 'memory';
  private store = new Map<string, T>();

  async get(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async getMany(filter?: QueryFilter, options?: QueryOptions): Promise<T[]> {
    let items = Array.from(this.store.values());

    if (filter) {
      items = items.filter((item) => {
        return Object.entries(filter).every(([key, value]) => {
          const itemValue = (item as Record<string, unknown>)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      });
    }

    if (options?.orderBy) {
      const [field, direction] = Object.entries(options.orderBy)[0];
      items.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];
        if (aVal === bVal) return 0;
        const cmp = (aVal as number) > (bVal as number) ? 1 : -1;
        return direction === 'desc' ? -cmp : cmp;
      });
    }

    if (options?.offset) {
      items = items.slice(options.offset);
    }

    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  async set(item: T): Promise<T> {
    this.store.set(item.id, { ...item });
    return item;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id } as T;
    this.store.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async count(filter?: QueryFilter): Promise<number> {
    if (!filter) return this.store.size;
    const items = await this.getMany(filter);
    return items.length;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// ─── Prisma Adapter ──────────────────────────

export class PrismaAdapter<T extends { id: string }> implements StorageAdapter<T> {
  readonly mode: StorageMode = 'database';

  constructor(private modelName: string) {}

  private get model() {
    // Dynamic import to avoid loading prisma when not needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('./prisma');
    if (!prisma) throw new Error('Prisma client not available');
    return (prisma as Record<string, any>)[this.modelName];
  }

  async get(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } }) as Promise<T | null>;
  }

  async getMany(filter?: QueryFilter, options?: QueryOptions): Promise<T[]> {
    const args: Record<string, unknown> = {};

    if (filter) {
      args.where = filter;
    }

    if (options?.orderBy) {
      args.orderBy = options.orderBy;
    }

    if (options?.limit) {
      args.take = options.limit;
    }

    if (options?.offset) {
      args.skip = options.offset;
    }

    return this.model.findMany(args) as Promise<T[]>;
  }

  async set(item: T): Promise<T> {
    return this.model.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    }) as Promise<T>;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      return await this.model.update({ where: { id }, data }) as T;
    } catch {
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.model.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async count(filter?: QueryFilter): Promise<number> {
    return this.model.count({ where: filter }) as Promise<number>;
  }

  async clear(): Promise<void> {
    await this.model.deleteMany({});
  }
}

// ─── Factory ─────────────────────────────────

/** Detect current storage mode */
export function getStorageMode(): StorageMode {
  if (process.env.FORCE_MEMORY_MODE === 'true') return 'memory';
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('postgresql') && !url.includes('password@localhost')) {
    return 'database';
  }
  return 'memory';
}

/**
 * Create a storage adapter for the given Prisma model name.
 * Returns InMemoryAdapter when no database is configured,
 * PrismaAdapter when DATABASE_URL points to a real PostgreSQL instance.
 *
 * @param modelName - The Prisma model name (e.g., 'agent', 'tenant')
 */
export function createAdapter<T extends { id: string }>(modelName: string): StorageAdapter<T> {
  const mode = getStorageMode();
  if (mode === 'database') {
    return new PrismaAdapter<T>(modelName);
  }
  return new InMemoryAdapter<T>();
}
