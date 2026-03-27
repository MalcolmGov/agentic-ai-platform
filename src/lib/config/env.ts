/**
 * Environment Configuration
 *
 * Validates and exports typed environment variables.
 * Separates required vs optional vars for graceful degradation.
 */

// ─── Database ────────────────────────────────

/** True when a real PostgreSQL connection string is configured */
export const hasDatabaseUrl = (): boolean => {
  const url = process.env.DATABASE_URL;
  return !!url && !url.includes('password@localhost') && url.startsWith('postgresql');
};

/** Storage mode: 'database' when Prisma is connected, 'memory' for demo/dev */
export type StorageMode = 'database' | 'memory';

export const getStorageMode = (): StorageMode => {
  if (process.env.FORCE_MEMORY_MODE === 'true') return 'memory';
  return hasDatabaseUrl() ? 'database' : 'memory';
};

// ─── Auth ────────────────────────────────────

export const getJwtSecret = (): string =>
  process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';

export const getJwtExpiry = (): string =>
  process.env.JWT_EXPIRY || '24h';

export const getBcryptRounds = (): number =>
  parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

// ─── App ─────────────────────────────────────

export const getAppUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const isProduction = (): boolean =>
  process.env.NODE_ENV === 'production';

export const getEncryptionKey = (): string =>
  process.env.ENCRYPTION_KEY || 'dev-key-32-chars-do-not-use!!!!!';

// ─── External Services ───────────────────────

export const getRedisUrl = (): string | null =>
  process.env.REDIS_URL || null;

export const getOpenAiKey = (): string | null =>
  process.env.OPENAI_API_KEY || null;

export const getAnthropicKey = (): string | null =>
  process.env.ANTHROPIC_API_KEY || null;

export const getStripeSecret = (): string | null =>
  process.env.STRIPE_SECRET_KEY || null;

export const getStripeWebhookSecret = (): string | null =>
  process.env.STRIPE_WEBHOOK_SECRET || null;

// ─── Feature Flags ───────────────────────────

export const isFeatureEnabled = (feature: string): boolean => {
  const key = `FEATURE_${feature.toUpperCase()}`;
  return process.env[key] === 'true';
};

// ─── Legacy env object (consumed by existing modules) ──

export const env = {
  get DATABASE_URL() { return process.env.DATABASE_URL || ''; },
  get JWT_SECRET() { return getJwtSecret(); },
  get JWT_EXPIRY() { return getJwtExpiry(); },
  get BCRYPT_SALT_ROUNDS() { return getBcryptRounds(); },
  get ENCRYPTION_KEY() { return getEncryptionKey(); },
  get OPENAI_API_KEY() { return getOpenAiKey(); },
  get ANTHROPIC_API_KEY() { return getAnthropicKey(); },
  get STRIPE_SECRET_KEY() { return getStripeSecret(); },
  get STRIPE_WEBHOOK_SECRET() { return getStripeWebhookSecret(); },
  get REDIS_URL() { return getRedisUrl(); },
  get APP_URL() { return getAppUrl(); },
  get SENDGRID_API_KEY() { return process.env.SENDGRID_API_KEY || null; },
  get FROM_EMAIL() { return process.env.FROM_EMAIL || 'noreply@agenticai.com'; },
  get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
};
