import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO (tech-debt): ~15 legacy API route handlers use the pre-Next.js-15 signature
  // (exported Promise<NextResponse> directly instead of (req) => Promise<Response>).
  // These are all in the original cloned repo. Suppress until they are migrated.
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/client", "bcrypt"],
};

export default nextConfig;
