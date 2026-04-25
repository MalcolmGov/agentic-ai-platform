/**
 * Repository Layer
 *
 * Database-backed storage for platform engines.
 * Wraps Prisma operations with typed, domain-specific methods.
 */

import { prisma } from './prisma';

// ─── Base Repository ──────────────────────────

export class BaseRepository<T> {
  constructor(protected model: string) {}

  async findById(id: string) {
    return (prisma as any)[this.model].findUnique({ where: { id } });
  }

  async findMany(where: Record<string, any>, orderBy?: Record<string, any>) {
    return (prisma as any)[this.model].findMany({ where, orderBy });
  }

  async create(data: Record<string, any>) {
    return (prisma as any)[this.model].create({ data });
  }

  async update(id: string, data: Record<string, any>) {
    return (prisma as any)[this.model].update({ where: { id }, data });
  }

  async delete(id: string) {
    return (prisma as any)[this.model].delete({ where: { id } });
  }

  async count(where?: Record<string, any>) {
    return (prisma as any)[this.model].count({ where });
  }
}

// ─── Governance Repository ────────────────────

export class GovernanceRepository extends BaseRepository<any> {
  constructor() {
    super('governanceModelCard');
  }

  /** Find all model cards for a specific agent within a tenant */
  async findByAgent(agentId: string, tenantId: string) {
    return (prisma as any).governanceModelCard.findMany({
      where: { agentId, tenantId },
      orderBy: { version: 'desc' },
    });
  }

  /** Find decision lineage records for a tenant, optionally filtered by agent */
  async findDecisions(tenantId: string, agentId?: string) {
    const where: Record<string, any> = { tenantId };
    if (agentId) {
      where.agentId = agentId;
    }
    return (prisma as any).decisionLineage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  /** Create a compliance report for a given framework */
  async createComplianceReport(tenantId: string, framework: string, data: any) {
    return (prisma as any).complianceReport.create({
      data: {
        tenantId,
        framework,
        generatedAt: new Date(),
        overallScore: data.overallScore ?? 0,
        controls: data.controls ?? [],
        findings: data.findings ?? [],
        recommendations: data.recommendations ?? [],
        periodStart: data.periodStart ? new Date(data.periodStart) : new Date(),
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : new Date(),
        signedBy: data.signedBy ?? null,
        exportFormat: data.exportFormat ?? 'json',
      },
    });
  }

  /** List all model cards belonging to a tenant */
  async findByTenant(tenantId: string) {
    return (prisma as any).governanceModelCard.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Record a new decision lineage entry */
  async recordDecision(data: {
    executionId: string;
    agentId: string;
    tenantId: string;
    input: string;
    output: string;
    reasoningChain: any[];
    modelUsed: string;
    tokensConsumed: number;
    confidenceScore: number;
    humanReviewRequired: boolean;
    complianceTags: string[];
  }) {
    return (prisma as any).decisionLineage.create({ data });
  }

  /** Get compliance reports for a tenant, optionally filtered by framework */
  async findReports(tenantId: string, framework?: string) {
    const where: Record<string, any> = { tenantId };
    if (framework) {
      where.framework = framework;
    }
    return (prisma as any).complianceReport.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
    });
  }
}

// ─── Marketplace Repository ───────────────────

export class MarketplaceRepository extends BaseRepository<any> {
  constructor() {
    super('marketplaceListing');
  }

  /** Full-text search across marketplace listings with filters */
  async search(query: string, filters: { category?: string; minRating?: number; pricing?: string }) {
    const where: Record<string, any> = {
      status: 'published',
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.minRating) {
      where.avgRating = { gte: filters.minRating };
    }

    if (filters.pricing) {
      where.pricingType = filters.pricing;
    }

    return (prisma as any).marketplaceListing.findMany({
      where,
      orderBy: { installs: 'desc' },
      take: 50,
    });
  }

  /** Get featured/top-rated published listings */
  async featured() {
    return (prisma as any).marketplaceListing.findMany({
      where: { status: 'published' },
      orderBy: [
        { avgRating: 'desc' },
        { installs: 'desc' },
      ],
      take: 10,
    });
  }

  /** Add a review to a listing and recalculate the average rating */
  async addReview(listingId: string, tenantId: string, rating: number, comment: string) {
    const review = await (prisma as any).marketplaceReview.create({
      data: {
        listingId,
        tenantId,
        rating,
        comment,
        createdAt: new Date(),
      },
    });

    // Recalculate the listing's average rating
    const aggregate = await (prisma as any).marketplaceReview.aggregate({
      where: { listingId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await (prisma as any).marketplaceListing.update({
      where: { id: listingId },
      data: {
        avgRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        totalReviews: aggregate._count.rating ?? 0,
      },
    });

    return review;
  }

  /** Record an install event and increment the install counter */
  async trackInstall(listingId: string, tenantId: string) {
    const install = await (prisma as any).marketplaceInstall.create({
      data: {
        listingId,
        tenantId,
        installedAt: new Date(),
      },
    });

    await (prisma as any).marketplaceListing.update({
      where: { id: listingId },
      data: {
        installs: { increment: 1 },
      },
    });

    return install;
  }

  /** Get listings published by a specific tenant */
  async findByAuthor(tenantId: string) {
    return (prisma as any).marketplaceListing.findMany({
      where: { authorTenantId: tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get all installs for a tenant */
  async findInstalls(tenantId: string) {
    return (prisma as any).marketplaceInstall.findMany({
      where: { tenantId },
      orderBy: { installedAt: 'desc' },
      include: { listing: true },
    });
  }
}

// ─── Team Repository ──────────────────────────

export class TeamRepository extends BaseRepository<any> {
  constructor() {
    super('teamInvite');
  }

  /** Find all pending invites for a tenant */
  async findPendingInvites(tenantId: string) {
    return (prisma as any).teamInvite.findMany({
      where: {
        tenantId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Look up an invite by its unique token */
  async findByToken(token: string) {
    return (prisma as any).teamInvite.findUnique({
      where: { token },
    });
  }

  /** Accept an invite: mark it accepted and create a team member record */
  async acceptInvite(token: string) {
    const invite = await (prisma as any).teamInvite.findUnique({
      where: { token },
    });

    if (!invite || invite.status !== 'pending') {
      return null;
    }

    if (new Date(invite.expiresAt) < new Date()) {
      await (prisma as any).teamInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      return null;
    }

    const [updatedInvite] = await (prisma as any).$transaction([
      (prisma as any).teamInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      }),
      (prisma as any).teamMember.create({
        data: {
          tenantId: invite.tenantId,
          email: invite.email,
          role: invite.role,
          status: 'active',
          joinedAt: new Date(),
        },
      }),
    ]);

    return updatedInvite;
  }

  /** Revoke a pending invite */
  async revokeInvite(inviteId: string) {
    return (prisma as any).teamInvite.update({
      where: { id: inviteId },
      data: { status: 'revoked' },
    });
  }

  /** Get all members for a tenant */
  async findMembers(tenantId: string) {
    return (prisma as any).teamMember.findMany({
      where: { tenantId },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /** Log a team activity entry */
  async logActivity(tenantId: string, memberId: string, memberEmail: string, action: string, resource: string, details: string) {
    return (prisma as any).teamActivity.create({
      data: {
        tenantId,
        memberId,
        memberEmail,
        action,
        resource,
        details,
        timestamp: new Date(),
      },
    });
  }

  /** Get recent activity for a tenant */
  async findActivity(tenantId: string, limit = 50) {
    return (prisma as any).teamActivity.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

// ─── Notification Repository ──────────────────

export class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super('notification');
  }

  /** Get notifications for a user, optionally only unread ones */
  async findForUser(userId: string, tenantId: string, unreadOnly?: boolean) {
    const where: Record<string, any> = { userId, tenantId };
    if (unreadOnly) {
      where.readAt = null;
    }
    return (prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** Mark a single notification as read */
  async markRead(id: string) {
    return (prisma as any).notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  /** Mark all notifications as read for a user within a tenant */
  async markAllRead(userId: string, tenantId: string) {
    return (prisma as any).notification.updateMany({
      where: { userId, tenantId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Count unread notifications for a user */
  async unreadCount(userId: string, tenantId: string) {
    return (prisma as any).notification.count({
      where: { userId, tenantId, readAt: null },
    });
  }
}

// ─── Webhook Repository ───────────────────────

export class WebhookRepository extends BaseRepository<any> {
  constructor() {
    super('webhookSubscription');
  }

  /** Find all active webhook subscriptions for a tenant */
  async findActive(tenantId: string) {
    return (prisma as any).webhookSubscription.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Find all active subscriptions listening for a specific event */
  async findByEvent(event: string) {
    return (prisma as any).webhookSubscription.findMany({
      where: {
        active: true,
        events: { has: event },
      },
    });
  }

  /** Log a webhook delivery attempt */
  async logDelivery(subscriptionId: string, event: string, payload: any, status: string, responseCode?: number) {
    return (prisma as any).webhookDelivery.create({
      data: {
        subscriptionId,
        event,
        payload,
        status,
        responseCode: responseCode ?? null,
        attemptedAt: new Date(),
      },
    });
  }

  /** Get the delivery log for a subscription */
  async getDeliveryLog(subscriptionId: string, limit = 50) {
    return (prisma as any).webhookDelivery.findMany({
      where: { subscriptionId },
      orderBy: { attemptedAt: 'desc' },
      take: limit,
    });
  }

  /** Toggle a subscription's active state */
  async setActive(id: string, active: boolean) {
    return (prisma as any).webhookSubscription.update({
      where: { id },
      data: { active },
    });
  }
}

// ─── Drift Repository ─────────────────────────

export class DriftRepository extends BaseRepository<any> {
  constructor() {
    super('driftEvent');
  }

  /** Find drift events for a specific agent within a tenant */
  async findByAgent(agentId: string, tenantId: string) {
    return (prisma as any).driftEvent.findMany({
      where: { agentId, tenantId },
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });
  }

  /** Get the current baseline for an agent */
  async getBaseline(agentId: string, tenantId: string) {
    return (prisma as any).driftBaseline.findMany({
      where: { agentId, tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Create or update a baseline metric for an agent */
  async setBaseline(agentId: string, tenantId: string, metric: string, value: number, threshold: number) {
    return (prisma as any).driftBaseline.upsert({
      where: {
        agentId_tenantId_metric: { agentId, tenantId, metric },
      },
      create: {
        agentId,
        tenantId,
        metric,
        value,
        threshold,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        value,
        threshold,
        updatedAt: new Date(),
      },
    });
  }

  /** Acknowledge a drift event */
  async acknowledge(eventId: string) {
    return (prisma as any).driftEvent.update({
      where: { id: eventId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }

  /** Find unacknowledged drift events for a tenant */
  async findUnacknowledged(tenantId: string) {
    return (prisma as any).driftEvent.findMany({
      where: { tenantId, acknowledged: false },
      orderBy: { detectedAt: 'desc' },
    });
  }
}

// ─── Prompt Version Repository ────────────────

export class PromptVersionRepository extends BaseRepository<any> {
  constructor() {
    super('promptVersion');
  }

  /** Get full version history for an agent's prompts */
  async getHistory(agentId: string, tenantId: string, branch?: string) {
    const where: Record<string, any> = { agentId, tenantId };
    if (branch) {
      where.branch = branch;
    }
    return (prisma as any).promptVersion.findMany({
      where,
      orderBy: { version: 'desc' },
    });
  }

  /** Get the latest prompt version for an agent */
  async getLatest(agentId: string, tenantId: string, branch?: string) {
    const where: Record<string, any> = { agentId, tenantId };
    if (branch) {
      where.branch = branch;
    }
    return (prisma as any).promptVersion.findFirst({
      where,
      orderBy: { version: 'desc' },
    });
  }

  /** Get a specific version of a prompt */
  async getByVersion(agentId: string, tenantId: string, version: number) {
    return (prisma as any).promptVersion.findFirst({
      where: { agentId, tenantId, version },
    });
  }

  /** Create a new prompt version, auto-incrementing the version number */
  async createVersion(agentId: string, tenantId: string, data: {
    content: string;
    branch?: string;
    changeMessage?: string;
    createdBy?: string;
  }) {
    const latest = await this.getLatest(agentId, tenantId, data.branch);
    const nextVersion = latest ? latest.version + 1 : 1;

    return (prisma as any).promptVersion.create({
      data: {
        agentId,
        tenantId,
        version: nextVersion,
        content: data.content,
        branch: data.branch ?? 'main',
        changeMessage: data.changeMessage ?? null,
        createdBy: data.createdBy ?? null,
        createdAt: new Date(),
      },
    });
  }

  /** Compare two prompt versions by version number */
  async diff(agentId: string, tenantId: string, versionA: number, versionB: number) {
    const [a, b] = await Promise.all([
      this.getByVersion(agentId, tenantId, versionA),
      this.getByVersion(agentId, tenantId, versionB),
    ]);
    return { versionA: a, versionB: b };
  }
}

// ─── Singleton Getters ────────────────────────

export const getGovernanceRepo = () => new GovernanceRepository();
export const getMarketplaceRepo = () => new MarketplaceRepository();
export const getTeamRepo = () => new TeamRepository();
export const getNotificationRepo = () => new NotificationRepository();
export const getWebhookRepo = () => new WebhookRepository();
export const getDriftRepo = () => new DriftRepository();
export const getPromptVersionRepo = () => new PromptVersionRepository();
