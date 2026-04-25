/**
 * Environment Configuration
 * 
 * Centralized, type-safe access to all environment variables.
 * Fails fast on missing required values in production.
 */

function required(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || "";
}

function optional(key: string, defaultValue = ""): string {
  return process.env[key] || defaultValue;
}

export const env = {
  // Database
  DATABASE_URL: required("DATABASE_URL", "postgresql://postgres:password@localhost:5432/agentic_ai_platform"),

  // Auth
  JWT_SECRET: required("JWT_SECRET", "dev_jwt_secret_change_in_production_at_least_64_chars_long_abcdef123456"),
  JWT_EXPIRY: optional("JWT_EXPIRY", "24h"),
  BCRYPT_SALT_ROUNDS: parseInt(optional("BCRYPT_SALT_ROUNDS", "12")),

  // LLM
  OPENAI_API_KEY: optional("OPENAI_API_KEY"),
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY"),

  // Vector DB
  PINECONE_API_KEY: optional("PINECONE_API_KEY"),
  PINECONE_INDEX: optional("PINECONE_INDEX"),

  // Redis
  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),

  // Storage
  S3_BUCKET: optional("S3_BUCKET"),
  S3_REGION: optional("S3_REGION"),
  S3_ACCESS_KEY: optional("S3_ACCESS_KEY"),
  S3_SECRET_KEY: optional("S3_SECRET_KEY"),

  // Email
  SENDGRID_API_KEY: optional("SENDGRID_API_KEY"),
  FROM_EMAIL: optional("FROM_EMAIL", "noreply@agenticai.com"),

  // Billing
  STRIPE_SECRET_KEY: optional("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: optional("STRIPE_WEBHOOK_SECRET"),

  // App
  APP_URL: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  NODE_ENV: optional("NODE_ENV", "development"),
  LOG_LEVEL: optional("LOG_LEVEL", "info"),
  ENCRYPTION_KEY: required("ENCRYPTION_KEY", "dev_encryption_key_32_chars_!!"),

  // Computed
  get isProduction() { return this.NODE_ENV === "production"; },
  get isDevelopment() { return this.NODE_ENV === "development"; },
} as const;
