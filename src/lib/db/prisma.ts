/**
 * Prisma Client Singleton
 *
 * Prevents multiple Prisma instances during Next.js hot reload.
 * Gracefully handles missing DATABASE_URL for memory-mode deployments.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Whether a real database connection is configured */
export const hasPrisma: boolean = (() => {
  const url = process.env.DATABASE_URL;
  return !!url && url.startsWith('postgresql') && !url.includes('password@localhost');
})();

function createPrismaClient(): PrismaClient | null {
  if (!hasPrisma) return null;

  try {
    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch {
    console.warn('[prisma] Failed to initialize PrismaClient — running in memory mode');
    return null;
  }
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

/** Get prisma client or throw if not available */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error(
      'Database not configured. Set DATABASE_URL environment variable to enable persistence.'
    );
  }
  return prisma;
}

export default prisma;
