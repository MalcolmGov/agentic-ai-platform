/**
 * Notification System
 *
 * In-app notifications and email digests for platform events:
 * drift alerts, execution failures, billing, team changes.
 */

// ─── Types ─────────────────────────────────

export type NotificationChannel = "in_app" | "email" | "slack" | "webhook";
export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type NotificationCategory = "agent" | "drift" | "billing" | "team" | "compliance" | "system";

export interface Notification {
  id: string;
  tenantId: string;
  recipientId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: number | null;
  createdAt: number;
}

export interface NotificationPreference {
  tenantId: string;
  memberId: string;
  channels: Record<NotificationCategory, NotificationChannel[]>;
  digestFrequency: "realtime" | "hourly" | "daily" | "weekly";
  quietHours: { enabled: boolean; start: string; end: string; timezone: string };
}

export interface DigestSummary {
  tenantId: string;
  period: string;
  totalNotifications: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  highlights: Notification[];
  generatedAt: number;
}

// ─── Engine ────────────────────────────────

export class NotificationEngine {
  private notifications: Notification[] = [];
  private preferences = new Map<string, NotificationPreference>();

  /**
   * Send a notification
   */
  send(params: {
    tenantId: string;
    recipientId: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Notification {
    const prefs = this.getPreferences(params.tenantId, params.recipientId);
    const channels = prefs.channels[params.category] || ["in_app"];

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId: params.tenantId,
      recipientId: params.recipientId,
      channel: channels[0] || "in_app",
      category: params.category,
      priority: params.priority,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl || null,
      metadata: params.metadata || {},
      read: false,
      readAt: null,
      createdAt: Date.now(),
    };

    this.notifications.push(notification);
    return notification;
  }

  /**
   * Send notification to all members of a tenant
   */
  broadcast(params: {
    tenantId: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    message: string;
    recipientIds: string[];
    actionUrl?: string;
  }): Notification[] {
    return params.recipientIds.map((recipientId) =>
      this.send({ ...params, recipientId })
    );
  }

  /**
   * Get notifications for a user
   */
  getNotifications(tenantId: string, recipientId: string, options?: { unreadOnly?: boolean; category?: NotificationCategory; limit?: number }): Notification[] {
    let results = this.notifications.filter((n) => n.tenantId === tenantId && n.recipientId === recipientId);
    if (options?.unreadOnly) results = results.filter((n) => !n.read);
    if (options?.category) results = results.filter((n) => n.category === options.category);
    const limit = options?.limit || 50;
    return results.slice(-limit).reverse();
  }

  /**
   * Mark notification as read
   */
  markRead(notificationId: string): boolean {
    const n = this.notifications.find((n) => n.id === notificationId);
    if (!n) return false;
    n.read = true;
    n.readAt = Date.now();
    return true;
  }

  /**
   * Mark all notifications as read for a user
   */
  markAllRead(tenantId: string, recipientId: string): number {
    let count = 0;
    for (const n of this.notifications) {
      if (n.tenantId === tenantId && n.recipientId === recipientId && !n.read) {
        n.read = true;
        n.readAt = Date.now();
        count++;
      }
    }
    return count;
  }

  /**
   * Get unread count
   */
  getUnreadCount(tenantId: string, recipientId: string): number {
    return this.notifications.filter((n) => n.tenantId === tenantId && n.recipientId === recipientId && !n.read).length;
  }

  /**
   * Set notification preferences
   */
  setPreferences(prefs: NotificationPreference): NotificationPreference {
    const key = `${prefs.tenantId}:${prefs.memberId}`;
    this.preferences.set(key, prefs);
    return prefs;
  }

  /**
   * Get notification preferences
   */
  getPreferences(tenantId: string, memberId: string): NotificationPreference {
    const key = `${tenantId}:${memberId}`;
    return this.preferences.get(key) || {
      tenantId, memberId,
      channels: {
        agent: ["in_app", "email"],
        drift: ["in_app", "email"],
        billing: ["in_app", "email"],
        team: ["in_app"],
        compliance: ["in_app", "email"],
        system: ["in_app"],
      },
      digestFrequency: "daily",
      quietHours: { enabled: false, start: "22:00", end: "08:00", timezone: "UTC" },
    };
  }

  /**
   * Generate a digest summary
   */
  generateDigest(tenantId: string, recipientId: string, periodHours = 24): DigestSummary {
    const cutoff = Date.now() - periodHours * 3600_000;
    const recent = this.notifications.filter((n) => n.tenantId === tenantId && n.recipientId === recipientId && n.createdAt > cutoff);

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const n of recent) {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    }

    const highlights = recent.filter((n) => n.priority === "high" || n.priority === "critical").slice(-5);

    return {
      tenantId,
      period: `Last ${periodHours} hours`,
      totalNotifications: recent.length,
      byCategory, byPriority,
      highlights,
      generatedAt: Date.now(),
    };
  }

  /**
   * Delete old notifications
   */
  cleanup(olderThanDays = 30): number {
    const cutoff = Date.now() - olderThanDays * 86_400_000;
    const before = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.createdAt > cutoff);
    return before - this.notifications.length;
  }
}

// ─── Singleton ─────────────────────────────

let engine: NotificationEngine | null = null;
export function getNotificationEngine(): NotificationEngine {
  if (!engine) engine = new NotificationEngine();
  return engine;
}
