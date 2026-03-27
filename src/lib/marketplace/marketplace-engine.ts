/**
 * Agent Marketplace
 *
 * Publish, discover, rate, and deploy agent templates.
 * Supports categories, search, reviews, and usage analytics.
 */

// ─── Types ─────────────────────────────────

export interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: MarketplaceCategory;
  tags: string[];
  author: AuthorInfo;
  version: string;
  pricing: PricingModel;
  agentConfig: AgentTemplate;
  stats: ListingStats;
  reviews: Review[];
  status: "draft" | "pending_review" | "published" | "suspended";
  createdAt: number;
  updatedAt: number;
}

export type MarketplaceCategory =
  | "fraud_detection" | "compliance" | "customer_support" | "data_analysis"
  | "document_processing" | "finance" | "hr" | "marketing" | "security" | "operations" | "custom";

export interface AuthorInfo {
  tenantId: string;
  name: string;
  verified: boolean;
  publishedCount: number;
}

export interface PricingModel {
  type: "free" | "one_time" | "subscription" | "usage_based";
  priceUsd: number;
  billingPeriod?: "monthly" | "annual";
  usageRate?: number; // per execution
}

export interface AgentTemplate {
  type: string;
  systemPrompt: string;
  model: string;
  provider: string;
  tools: string[];
  triggers: Record<string, unknown>[];
  integrations: string[];
  complianceFrameworks: string[];
  requiredPermissions: string[];
}

export interface ListingStats {
  installs: number;
  activeUsers: number;
  avgRating: number;
  totalReviews: number;
  totalExecutions: number;
  avgROI: number | null;
}

export interface Review {
  id: string;
  tenantId: string;
  reviewerName: string;
  rating: number;       // 1-5
  title: string;
  body: string;
  helpful: number;
  createdAt: number;
}

export interface InstallRecord {
  id: string;
  listingId: string;
  tenantId: string;
  version: string;
  deployedAgentId: string;
  installedAt: number;
}

import { syncToDb, isPersistenceEnabled, type SyncConfig } from '@/lib/db/persistence-sync';

const LISTING_SYNC: SyncConfig = { model: 'marketplaceListing', excludeFields: ['author', 'agentConfig', 'stats', 'reviews'] };

// ─── Engine ────────────────────────────────

export class MarketplaceEngine {
  private listings = new Map<string, MarketplaceListing>();
  private installs: InstallRecord[] = [];

  /**
   * Publish an agent template to the marketplace
   */
  publish(params: {
    name: string;
    description: string;
    longDescription: string;
    category: MarketplaceCategory;
    tags: string[];
    tenantId: string;
    authorName: string;
    version: string;
    pricing: PricingModel;
    agentConfig: AgentTemplate;
  }): MarketplaceListing {
    const now = Date.now();
    const listing: MarketplaceListing = {
      id: `mkt_${now}_${Math.random().toString(36).slice(2, 6)}`,
      name: params.name,
      description: params.description,
      longDescription: params.longDescription,
      category: params.category,
      tags: params.tags,
      author: {
        tenantId: params.tenantId,
        name: params.authorName,
        verified: false,
        publishedCount: this.getAuthorListings(params.tenantId).length + 1,
      },
      version: params.version,
      pricing: params.pricing,
      agentConfig: params.agentConfig,
      stats: { installs: 0, activeUsers: 0, avgRating: 0, totalReviews: 0, totalExecutions: 0, avgROI: null },
      reviews: [],
      status: "published",
      createdAt: now,
      updatedAt: now,
    };

    this.listings.set(listing.id, listing);
    this.syncListing(listing);
    return listing;
  }

  private syncListing(listing: MarketplaceListing): void {
    if (!isPersistenceEnabled()) return;
    syncToDb(LISTING_SYNC, listing.id, {
      name: listing.name,
      description: listing.description,
      category: listing.category,
      tags: listing.tags,
      authorTenantId: listing.author.tenantId,
      version: listing.version,
      pricing: listing.pricing,
      rating: listing.stats.avgRating,
      installCount: listing.stats.installs,
      status: listing.status,
      config: listing.agentConfig,
      createdAt: new Date(listing.createdAt),
      updatedAt: new Date(listing.updatedAt),
    }).catch(() => { /* non-blocking */ });
  }

  /**
   * Search and discover marketplace listings
   */
  search(params: {
    query?: string;
    category?: MarketplaceCategory;
    tags?: string[];
    minRating?: number;
    pricingType?: PricingModel["type"];
    sortBy?: "installs" | "rating" | "newest" | "price";
    limit?: number;
    offset?: number;
  }): { results: MarketplaceListing[]; total: number } {
    let results = Array.from(this.listings.values()).filter((l) => l.status === "published");

    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (l) => l.name.toLowerCase().includes(q) ||
               l.description.toLowerCase().includes(q) ||
               l.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params.category) {
      results = results.filter((l) => l.category === params.category);
    }
    if (params.tags?.length) {
      results = results.filter((l) => params.tags!.some((t) => l.tags.includes(t)));
    }
    if (params.minRating) {
      results = results.filter((l) => l.stats.avgRating >= params.minRating!);
    }
    if (params.pricingType) {
      results = results.filter((l) => l.pricing.type === params.pricingType);
    }

    // Sort
    switch (params.sortBy) {
      case "installs": results.sort((a, b) => b.stats.installs - a.stats.installs); break;
      case "rating": results.sort((a, b) => b.stats.avgRating - a.stats.avgRating); break;
      case "newest": results.sort((a, b) => b.createdAt - a.createdAt); break;
      case "price": results.sort((a, b) => a.pricing.priceUsd - b.pricing.priceUsd); break;
      default: results.sort((a, b) => b.stats.installs - a.stats.installs);
    }

    const total = results.length;
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    results = results.slice(offset, offset + limit);

    return { results, total };
  }

  /**
   * Get a single listing
   */
  getListing(listingId: string): MarketplaceListing | null {
    return this.listings.get(listingId) || null;
  }

  /**
   * Install a marketplace listing (deploy as agent)
   */
  install(listingId: string, tenantId: string): InstallRecord | null {
    const listing = this.listings.get(listingId);
    if (!listing || listing.status !== "published") return null;

    const record: InstallRecord = {
      id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      listingId,
      tenantId,
      version: listing.version,
      deployedAgentId: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      installedAt: Date.now(),
    };

    this.installs.push(record);
    listing.stats.installs++;
    listing.stats.activeUsers++;
    return record;
  }

  /**
   * Add a review to a listing
   */
  addReview(listingId: string, params: {
    tenantId: string;
    reviewerName: string;
    rating: number;
    title: string;
    body: string;
  }): Review | null {
    const listing = this.listings.get(listingId);
    if (!listing) return null;
    if (params.rating < 1 || params.rating > 5) return null;

    // One review per tenant
    if (listing.reviews.some((r) => r.tenantId === params.tenantId)) return null;

    const review: Review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId: params.tenantId,
      reviewerName: params.reviewerName,
      rating: params.rating,
      title: params.title,
      body: params.body,
      helpful: 0,
      createdAt: Date.now(),
    };

    listing.reviews.push(review);
    listing.stats.totalReviews = listing.reviews.length;
    listing.stats.avgRating = listing.reviews.reduce((s, r) => s + r.rating, 0) / listing.reviews.length;
    listing.stats.avgRating = Math.round(listing.stats.avgRating * 10) / 10;
    listing.updatedAt = Date.now();

    return review;
  }

  /**
   * Get installs for a tenant
   */
  getInstalls(tenantId: string): InstallRecord[] {
    return this.installs.filter((i) => i.tenantId === tenantId);
  }

  /**
   * Get author's published listings
   */
  getAuthorListings(tenantId: string): MarketplaceListing[] {
    return Array.from(this.listings.values()).filter((l) => l.author.tenantId === tenantId);
  }

  /**
   * Get featured/top listings
   */
  getFeatured(limit = 10): MarketplaceListing[] {
    return Array.from(this.listings.values())
      .filter((l) => l.status === "published")
      .sort((a, b) => (b.stats.avgRating * b.stats.installs) - (a.stats.avgRating * a.stats.installs))
      .slice(0, limit);
  }

  /**
   * Get marketplace analytics
   */
  getAnalytics(): {
    totalListings: number;
    totalInstalls: number;
    categories: Record<string, number>;
    topAuthors: { tenantId: string; name: string; listings: number }[];
  } {
    const published = Array.from(this.listings.values()).filter((l) => l.status === "published");
    const categories: Record<string, number> = {};
    for (const l of published) {
      categories[l.category] = (categories[l.category] || 0) + 1;
    }

    const authorMap = new Map<string, { name: string; count: number }>();
    for (const l of published) {
      const existing = authorMap.get(l.author.tenantId);
      if (existing) { existing.count++; }
      else { authorMap.set(l.author.tenantId, { name: l.author.name, count: 1 }); }
    }

    const topAuthors = Array.from(authorMap.entries())
      .map(([tenantId, info]) => ({ tenantId, name: info.name, listings: info.count }))
      .sort((a, b) => b.listings - a.listings)
      .slice(0, 10);

    return {
      totalListings: published.length,
      totalInstalls: this.installs.length,
      categories,
      topAuthors,
    };
  }
}

// ─── Singleton ─────────────────────────────

let marketplace: MarketplaceEngine | null = null;
export function getMarketplaceEngine(): MarketplaceEngine {
  if (!marketplace) marketplace = new MarketplaceEngine();
  return marketplace;
}
