/**
 * Marketplace API — Agent template marketplace
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getMarketplaceEngine, MarketplaceCategory, PricingModel } from "@/lib/marketplace/marketplace-engine";
import { z, ZodError } from "zod";
import { validationError } from "@/lib/validation/schemas";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}
function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

const PostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("publish"),
    name: z.string(),
    description: z.string(),
    longDescription: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    authorName: z.string(),
    version: z.string().default("1.0.0"),
    pricing: z.object({
      type: z.enum(["free", "one_time", "subscription", "usage_based"]),
      priceUsd: z.number().default(0),
      billingPeriod: z.enum(["monthly", "annual"]).optional(),
      usageRate: z.number().optional(),
    }),
    agentConfig: z.object({
      type: z.string(),
      systemPrompt: z.string(),
      model: z.string(),
      provider: z.string(),
      tools: z.array(z.string()).default([]),
      triggers: z.array(z.record(z.unknown())).default([]),
      integrations: z.array(z.string()).default([]),
      complianceFrameworks: z.array(z.string()).default([]),
      requiredPermissions: z.array(z.string()).default([]),
    }),
  }),
  z.object({
    action: z.literal("install"),
    listingId: z.string(),
  }),
  z.object({
    action: z.literal("review"),
    listingId: z.string(),
    reviewerName: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string(),
    body: z.string(),
  }),
  z.object({
    action: z.literal("search"),
    query: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    minRating: z.number().optional(),
    pricingType: z.enum(["free", "one_time", "subscription", "usage_based"]).optional(),
    sortBy: z.enum(["installs", "rating", "newest", "price"]).optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "featured";
    const engine = getMarketplaceEngine();

    if (view === "featured") {
      return apiResponse({ listings: engine.getFeatured() });
    }
    if (view === "listing") {
      const id = url.searchParams.get("id");
      if (!id) return apiError("id required", 400);
      const listing = engine.getListing(id);
      return listing ? apiResponse({ listing }) : apiError("Not found", 404);
    }
    if (view === "my_listings") {
      return apiResponse({ listings: engine.getAuthorListings(tenantId) });
    }
    if (view === "my_installs") {
      return apiResponse({ installs: engine.getInstalls(tenantId) });
    }
    if (view === "analytics") {
      return apiResponse({ analytics: engine.getAnalytics() });
    }
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getMarketplaceEngine();

    if (body.action === "publish") {
      const listing = engine.publish({ ...body, tenantId, category: body.category as MarketplaceCategory, pricing: body.pricing as PricingModel });
      return apiResponse({ listing }, 201);
    }
    if (body.action === "install") {
      const record = engine.install(body.listingId, tenantId);
      return record ? apiResponse({ install: record }, 201) : apiError("Listing not found", 404);
    }
    if (body.action === "review") {
      const review = engine.addReview(body.listingId, { ...body, tenantId });
      return review ? apiResponse({ review }, 201) : apiError("Cannot add review", 400);
    }
    if (body.action === "search") {
      const results = engine.search({ ...body, category: body.category as MarketplaceCategory | undefined, pricingType: body.pricingType as PricingModel["type"] | undefined });
      return apiResponse(results);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
