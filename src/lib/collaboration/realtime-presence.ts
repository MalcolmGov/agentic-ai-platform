/**
 * Real-Time Collaboration Hub
 *
 * Tracks user presence, activity feeds, and annotations
 * on agent executions for team collaboration.
 */

// ═══ Types ═══

export interface UserPresence {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  currentPage: string;
  lastActive: number;
  status: "online" | "away" | "offline";
  tenantId: string;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: number;
  details: Record<string, unknown>;
  tenantId: string;
}

export interface Annotation {
  id: string;
  userId: string;
  userName: string;
  executionId: string;
  stepIndex: number;
  comment: string;
  createdAt: number;
  tenantId: string;
}

export interface TeamStats {
  online: number;
  away: number;
  totalAnnotations: number;
  activitiesToday: number;
  mostActiveUser: { name: string; actions: number } | null;
}

// ═══ Collaboration Hub ═══

export class CollaborationHub {
  private presence: Map<string, UserPresence> = new Map();
  private activities: ActivityEvent[] = [];
  private annotations: Annotation[] = [];

  private readonly AWAY_TIMEOUT_MS = 300000; // 5 minutes
  private readonly OFFLINE_TIMEOUT_MS = 900000; // 15 minutes

  /**
   * Track or update user presence
   */
  trackPresence(userId: string, page: string, userInfo: { name: string; email: string; tenantId: string }): UserPresence {
    const existing = this.presence.get(userId);
    const presence: UserPresence = {
      userId,
      name: userInfo.name,
      email: userInfo.email,
      avatar: this.generateAvatar(userInfo.name),
      currentPage: page,
      lastActive: Date.now(),
      status: "online",
      tenantId: userInfo.tenantId,
    };
    this.presence.set(userId, presence);

    // Log page navigation as activity
    if (!existing || existing.currentPage !== page) {
      this.broadcastActivity({
        userId,
        userName: userInfo.name,
        action: "navigated",
        resource: page,
        details: { previousPage: existing?.currentPage },
        tenantId: userInfo.tenantId,
      });
    }

    return presence;
  }

  /**
   * Get all active users for a tenant
   */
  getActiveUsers(tenantId: string): UserPresence[] {
    this.updateStatuses();
    return Array.from(this.presence.values())
      .filter((p) => p.tenantId === tenantId && p.status !== "offline")
      .sort((a, b) => b.lastActive - a.lastActive);
  }

  /**
   * Add annotation to an agent execution step
   */
  addAnnotation(params: {
    userId: string;
    userName: string;
    executionId: string;
    stepIndex: number;
    comment: string;
    tenantId: string;
  }): Annotation {
    const annotation: Annotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      userName: params.userName,
      executionId: params.executionId,
      stepIndex: params.stepIndex,
      comment: params.comment,
      createdAt: Date.now(),
      tenantId: params.tenantId,
    };

    this.annotations.push(annotation);

    this.broadcastActivity({
      userId: params.userId,
      userName: params.userName,
      action: "commented",
      resource: "execution",
      resourceId: params.executionId,
      details: { stepIndex: params.stepIndex, preview: params.comment.slice(0, 100) },
      tenantId: params.tenantId,
    });

    return annotation;
  }

  /**
   * Get annotations for an execution
   */
  getAnnotations(executionId: string): Annotation[] {
    return this.annotations
      .filter((a) => a.executionId === executionId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Broadcast an activity event
   */
  broadcastActivity(params: Omit<ActivityEvent, "id" | "timestamp">): ActivityEvent {
    const event: ActivityEvent = {
      ...params,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };

    this.activities.push(event);

    // Keep buffer manageable
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(-500);
    }

    return event;
  }

  /**
   * Get recent activity feed
   */
  getActivityFeed(tenantId: string, limit = 50): ActivityEvent[] {
    return this.activities
      .filter((a) => a.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get team stats
   */
  getTeamStats(tenantId: string): TeamStats {
    this.updateStatuses();
    const users = Array.from(this.presence.values()).filter((p) => p.tenantId === tenantId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayActivities = this.activities.filter(
      (a) => a.tenantId === tenantId && a.timestamp >= todayStart.getTime()
    );

    // Find most active user
    const actionCounts: Record<string, { name: string; count: number }> = {};
    todayActivities.forEach((a) => {
      if (!actionCounts[a.userId]) actionCounts[a.userId] = { name: a.userName, count: 0 };
      actionCounts[a.userId].count++;
    });
    const mostActive = Object.values(actionCounts).sort((a, b) => b.count - a.count)[0];

    return {
      online: users.filter((u) => u.status === "online").length,
      away: users.filter((u) => u.status === "away").length,
      totalAnnotations: this.annotations.filter((a) => a.tenantId === tenantId).length,
      activitiesToday: todayActivities.length,
      mostActiveUser: mostActive ? { name: mostActive.name, actions: mostActive.count } : null,
    };
  }

  private updateStatuses(): void {
    const now = Date.now();
    this.presence.forEach((p) => {
      if (now - p.lastActive > this.OFFLINE_TIMEOUT_MS) p.status = "offline";
      else if (now - p.lastActive > this.AWAY_TIMEOUT_MS) p.status = "away";
      else p.status = "online";
    });
  }

  private generateAvatar(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
}

// ═══ Singleton ═══

let _hub: CollaborationHub | null = null;

export function getCollaborationHub(): CollaborationHub {
  if (!_hub) {
    _hub = new CollaborationHub();
    seedDemoPresence(_hub);
  }
  return _hub;
}

function seedDemoPresence(hub: CollaborationHub): void {
  const t = "tenant_acme";

  hub.trackPresence("user_owner_01", "/dashboard", { name: "Malcolm Chen", email: "malcolm@acme.com", tenantId: t });
  hub.trackPresence("user_admin_01", "/dashboard/agents", { name: "Sarah Kim", email: "sarah@acme.com", tenantId: t });
  hub.trackPresence("user_analyst_01", "/dashboard/analytics", { name: "James Rodriguez", email: "james@acme.com", tenantId: t });

  hub.broadcastActivity({ userId: "user_admin_01", userName: "Sarah Kim", action: "deployed", resource: "agent", resourceId: "agent_fraud_001", details: { agentName: "Fraud Monitoring Agent v2" }, tenantId: t });
  hub.broadcastActivity({ userId: "user_analyst_01", userName: "James Rodriguez", action: "reviewed", resource: "execution", resourceId: "exec_001", details: { verdict: "approved" }, tenantId: t });
  hub.broadcastActivity({ userId: "user_owner_01", userName: "Malcolm Chen", action: "created", resource: "workflow", resourceId: "wf_003", details: { workflowName: "Monthly Compliance Report" }, tenantId: t });

  hub.addAnnotation({ userId: "user_analyst_01", userName: "James Rodriguez", executionId: "exec_001", stepIndex: 2, comment: "Risk score seems high for this merchant category — should we adjust the threshold?", tenantId: t });
  hub.addAnnotation({ userId: "user_admin_01", userName: "Sarah Kim", executionId: "exec_001", stepIndex: 2, comment: "Agreed, let's lower to 0.65 for verified merchants.", tenantId: t });
}
