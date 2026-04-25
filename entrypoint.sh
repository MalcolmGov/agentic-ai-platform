#!/bin/sh
# ═══════════════════════════════════════════════
# Agentic AI Platform — Container Entrypoint
# ═══════════════════════════════════════════════
# 1. Run Prisma migrations
# 2. Seed database (first run only)
# 3. Start Next.js server
# ═══════════════════════════════════════════════

set -e

echo "🚀 Agentic AI Platform — Starting..."
echo "   Environment: ${NODE_ENV:-development}"
echo "   Port: ${PORT:-3000}"
echo ""

# ── Step 1: Database Migrations ────────────────
echo "📦 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "✅ Migrations complete."
echo ""

# ── Step 2: Start Server ───────────────────────
echo "🌐 Starting Next.js server..."
exec node server.js
