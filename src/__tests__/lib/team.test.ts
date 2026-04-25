import { describe, it, expect, beforeEach } from "vitest";
import { TeamEngine } from "@/lib/team/team-engine";

describe("TeamEngine", () => {
  let engine: TeamEngine;

  beforeEach(() => {
    engine = new TeamEngine();
  });

  describe("addOwner", () => {
    it("creates the initial owner", () => {
      const owner = engine.addOwner("t1", "admin@acme.com", "Admin");
      expect(owner.id).toMatch(/^member_/);
      expect(owner.role).toBe("owner");
      expect(owner.status).toBe("active");
    });
  });

  describe("invite & accept", () => {
    it("invites a new member", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      const invite = engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "editor", invitedBy: "admin" });
      expect(invite.id).toMatch(/^inv_/);
      expect(invite.status).toBe("pending");
      expect(invite.token).toMatch(/^tok_/);
    });

    it("accepts an invite and creates member", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      const invite = engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "editor", invitedBy: "admin" });
      const member = engine.acceptInvite(invite.token, "Dev User");
      expect(member).not.toBeNull();
      expect(member!.role).toBe("editor");
      expect(engine.getMembers("t1").length).toBe(2);
    });

    it("rejects duplicate invites", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "editor", invitedBy: "admin" });
      expect(() => engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "viewer", invitedBy: "admin" })).toThrow("already pending");
    });

    it("rejects invites for existing members", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      expect(() => engine.invite({ tenantId: "t1", email: "admin@acme.com", role: "editor", invitedBy: "admin" })).toThrow("already a team member");
    });
  });

  describe("changeRole", () => {
    it("changes a member's role", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      const invite = engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "viewer", invitedBy: "admin" });
      const member = engine.acceptInvite(invite.token, "Dev");
      const updated = engine.changeRole("t1", member!.id, "admin", "admin");
      expect(updated!.role).toBe("admin");
    });

    it("prevents removing the last owner", () => {
      const owner = engine.addOwner("t1", "admin@acme.com", "Admin");
      expect(() => engine.changeRole("t1", owner.id, "admin", "admin")).toThrow("last owner");
    });
  });

  describe("removeMember", () => {
    it("removes a non-owner member", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      const invite = engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "editor", invitedBy: "admin" });
      const member = engine.acceptInvite(invite.token, "Dev");
      expect(engine.removeMember("t1", member!.id, "admin")).toBe(true);
      expect(engine.getMembers("t1").length).toBe(1);
    });

    it("prevents removing an owner", () => {
      const owner = engine.addOwner("t1", "admin@acme.com", "Admin");
      expect(() => engine.removeMember("t1", owner.id, "admin")).toThrow("Cannot remove an owner");
    });
  });

  describe("hasPermission", () => {
    it("owner has all permissions", () => {
      const owner = engine.addOwner("t1", "admin@acme.com", "Admin");
      expect(engine.hasPermission("t1", owner.id, "anything")).toBe(true);
    });

    it("viewer has limited permissions", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      const invite = engine.invite({ tenantId: "t1", email: "view@acme.com", role: "viewer", invitedBy: "admin" });
      const viewer = engine.acceptInvite(invite.token, "Viewer");
      expect(engine.hasPermission("t1", viewer!.id, "agent:read")).toBe(true);
      expect(engine.hasPermission("t1", viewer!.id, "agent:write")).toBe(false);
    });
  });

  describe("activity log", () => {
    it("tracks team activities", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "editor", invitedBy: "admin" });
      const activity = engine.getActivity("t1");
      expect(activity.length).toBeGreaterThan(0);
      expect(activity[0].action).toBe("invited");
    });
  });

  describe("revokeInvite", () => {
    it("revokes a pending invite", () => {
      engine.addOwner("t1", "admin@acme.com", "Admin");
      const invite = engine.invite({ tenantId: "t1", email: "dev@acme.com", role: "editor", invitedBy: "admin" });
      expect(engine.revokeInvite(invite.id)).toBe(true);
      expect(engine.getPendingInvites("t1").length).toBe(0);
    });
  });
});
