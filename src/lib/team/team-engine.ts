/**
 * Team Management
 *
 * Invite members, assign roles, manage permissions,
 * team activity tracking, and seat management.
 */

// ─── Types ─────────────────────────────────

export type TeamRole = "owner" | "admin" | "editor" | "viewer";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface TeamMember {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: TeamRole;
  status: "active" | "suspended";
  lastActiveAt: number | null;
  joinedAt: number;
}

export interface TeamInvite {
  id: string;
  tenantId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  status: InviteStatus;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface TeamActivity {
  id: string;
  tenantId: string;
  memberId: string;
  memberEmail: string;
  action: string;
  resource: string;
  details: string;
  timestamp: number;
}

const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ["*"],
  admin: ["agent:read", "agent:write", "agent:execute", "agent:delete", "team:manage", "billing:read", "billing:write", "settings:write"],
  editor: ["agent:read", "agent:write", "agent:execute", "billing:read"],
  viewer: ["agent:read", "billing:read"],
};

import { syncToDb, isPersistenceEnabled, type SyncConfig } from '@/lib/db/persistence-sync';

const INVITE_SYNC: SyncConfig = { model: 'teamInvite', excludeFields: [] };

// ─── Engine ────────────────────────────────

export class TeamEngine {
  private members = new Map<string, TeamMember[]>();
  private invites: TeamInvite[] = [];
  private activities: TeamActivity[] = [];

  /**
   * Add the initial owner when tenant is created
   */
  addOwner(tenantId: string, email: string, name: string): TeamMember {
    const member: TeamMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId, email, name, role: "owner", status: "active",
      lastActiveAt: Date.now(), joinedAt: Date.now(),
    };
    this.members.set(tenantId, [member]);
    return member;
  }

  /**
   * Invite a new team member
   */
  invite(params: { tenantId: string; email: string; role: TeamRole; invitedBy: string }): TeamInvite {
    const existing = this.getMembers(params.tenantId);
    if (existing.some((m) => m.email === params.email)) {
      throw new Error("User is already a team member");
    }
    if (this.invites.some((i) => i.tenantId === params.tenantId && i.email === params.email && i.status === "pending")) {
      throw new Error("Invite already pending for this email");
    }

    const invite: TeamInvite = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId: params.tenantId, email: params.email, role: params.role,
      invitedBy: params.invitedBy,
      token: `tok_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      status: "pending",
      expiresAt: Date.now() + 7 * 86_400_000, // 7 days
      createdAt: Date.now(),
    };
    this.invites.push(invite);
    this.syncInvite(invite);
    this.logActivity(params.tenantId, params.invitedBy, params.invitedBy, "invited", "team", `Invited ${params.email} as ${params.role}`);
    return invite;
  }

  /**
   * Accept an invite
   */
  acceptInvite(token: string, name: string): TeamMember | null {
    const invite = this.invites.find((i) => i.token === token && i.status === "pending");
    if (!invite) return null;
    if (invite.expiresAt < Date.now()) {
      invite.status = "expired";
      return null;
    }

    invite.status = "accepted";
    const member: TeamMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId: invite.tenantId, email: invite.email, name, role: invite.role,
      status: "active", lastActiveAt: Date.now(), joinedAt: Date.now(),
    };

    const members = this.members.get(invite.tenantId) || [];
    members.push(member);
    this.members.set(invite.tenantId, members);
    this.logActivity(invite.tenantId, member.id, member.email, "joined", "team", `${name} joined as ${invite.role}`);
    return member;
  }

  /**
   * Change a member's role
   */
  changeRole(tenantId: string, memberId: string, newRole: TeamRole, changedBy: string): TeamMember | null {
    const members = this.members.get(tenantId) || [];
    const member = members.find((m) => m.id === memberId);
    if (!member) return null;
    if (member.role === "owner" && newRole !== "owner") {
      const otherOwners = members.filter((m) => m.role === "owner" && m.id !== memberId);
      if (otherOwners.length === 0) throw new Error("Cannot remove the last owner");
    }
    const oldRole = member.role;
    member.role = newRole;
    this.logActivity(tenantId, changedBy, changedBy, "role_changed", "team", `Changed ${member.email} from ${oldRole} to ${newRole}`);
    return member;
  }

  /**
   * Remove a member
   */
  removeMember(tenantId: string, memberId: string, removedBy: string): boolean {
    const members = this.members.get(tenantId) || [];
    const member = members.find((m) => m.id === memberId);
    if (!member) return false;
    if (member.role === "owner") throw new Error("Cannot remove an owner");

    this.members.set(tenantId, members.filter((m) => m.id !== memberId));
    this.logActivity(tenantId, removedBy, removedBy, "removed", "team", `Removed ${member.email}`);
    return true;
  }

  /**
   * Get all members for a tenant
   */
  getMembers(tenantId: string): TeamMember[] {
    return this.members.get(tenantId) || [];
  }

  /**
   * Get pending invites for a tenant
   */
  getPendingInvites(tenantId: string): TeamInvite[] {
    return this.invites.filter((i) => i.tenantId === tenantId && i.status === "pending");
  }

  /**
   * Revoke a pending invite
   */
  revokeInvite(inviteId: string): boolean {
    const invite = this.invites.find((i) => i.id === inviteId && i.status === "pending");
    if (!invite) return false;
    invite.status = "revoked";
    return true;
  }

  /**
   * Check if a member has a specific permission
   */
  hasPermission(tenantId: string, memberId: string, permission: string): boolean {
    const members = this.members.get(tenantId) || [];
    const member = members.find((m) => m.id === memberId);
    if (!member || member.status !== "active") return false;
    const perms = ROLE_PERMISSIONS[member.role];
    return perms.includes("*") || perms.includes(permission);
  }

  /**
   * Get team activity log
   */
  getActivity(tenantId: string, limit = 50): TeamActivity[] {
    return this.activities.filter((a) => a.tenantId === tenantId).slice(-limit).reverse();
  }

  /**
   * Get member by ID
   */
  getMember(tenantId: string, memberId: string): TeamMember | null {
    const members = this.members.get(tenantId) || [];
    return members.find((m) => m.id === memberId) || null;
  }

  // ─── Private ─────────────────────────────

  private syncInvite(invite: TeamInvite): void {
    if (!isPersistenceEnabled()) return;
    syncToDb(INVITE_SYNC, invite.id, {
      tenantId: invite.tenantId,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      invitedBy: invite.invitedBy,
      expiresAt: new Date(invite.expiresAt),
      createdAt: new Date(invite.createdAt),
      updatedAt: new Date(invite.createdAt),
    }).catch(() => { /* non-blocking */ });
  }

  private logActivity(tenantId: string, memberId: string, memberEmail: string, action: string, resource: string, details: string): void {
    this.activities.push({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId, memberId, memberEmail, action, resource, details, timestamp: Date.now(),
    });
  }
}

// ─── Singleton ─────────────────────────────

let engine: TeamEngine | null = null;
export function getTeamEngine(): TeamEngine {
  if (!engine) engine = new TeamEngine();
  return engine;
}
