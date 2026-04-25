/**
 * Team Management API — Invites, roles, permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import { getTeamEngine, TeamRole } from "@/lib/team/team-engine";
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
    action: z.literal("add_owner"),
    email: z.string().email(),
    name: z.string(),
  }),
  z.object({
    action: z.literal("invite"),
    email: z.string().email(),
    role: z.enum(["admin", "editor", "viewer"]),
    invitedBy: z.string(),
  }),
  z.object({
    action: z.literal("accept_invite"),
    token: z.string(),
    name: z.string(),
  }),
  z.object({
    action: z.literal("change_role"),
    memberId: z.string(),
    newRole: z.enum(["owner", "admin", "editor", "viewer"]),
    changedBy: z.string(),
  }),
  z.object({
    action: z.literal("remove"),
    memberId: z.string(),
    removedBy: z.string(),
  }),
  z.object({
    action: z.literal("revoke_invite"),
    inviteId: z.string(),
  }),
]);

export const GET = withAuth("agent:read")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "members";
    const engine = getTeamEngine();

    if (view === "members") return apiResponse({ members: engine.getMembers(tenantId) });
    if (view === "invites") return apiResponse({ invites: engine.getPendingInvites(tenantId) });
    if (view === "activity") return apiResponse({ activity: engine.getActivity(tenantId) });
    return apiError("Invalid view", 400);
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

export const POST = withAuth("agent:write")(async (req: NextRequest) => {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const body = PostSchema.parse(await req.json());
    const engine = getTeamEngine();

    if (body.action === "add_owner") {
      return apiResponse({ member: engine.addOwner(tenantId, body.email, body.name) }, 201);
    }
    if (body.action === "invite") {
      const invite = engine.invite({ tenantId, email: body.email, role: body.role as TeamRole, invitedBy: body.invitedBy });
      return apiResponse({ invite }, 201);
    }
    if (body.action === "accept_invite") {
      const member = engine.acceptInvite(body.token, body.name);
      return member ? apiResponse({ member }, 201) : apiError("Invalid or expired invite", 400);
    }
    if (body.action === "change_role") {
      const member = engine.changeRole(tenantId, body.memberId, body.newRole as TeamRole, body.changedBy);
      return member ? apiResponse({ member }) : apiError("Member not found", 404);
    }
    if (body.action === "remove") {
      return engine.removeMember(tenantId, body.memberId, body.removedBy) ? apiResponse({ removed: true }) : apiError("Member not found", 404);
    }
    if (body.action === "revoke_invite") {
      return engine.revokeInvite(body.inviteId) ? apiResponse({ revoked: true }) : apiError("Invite not found", 404);
    }
    return apiError("Unknown action", 400);
  } catch (err: unknown) {
    if (err instanceof ZodError) return validationError(err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500);
  }
});
