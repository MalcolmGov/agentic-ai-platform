/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Enforces role permissions on API routes.
 * Roles hierarchy: OWNER > ADMIN > DEVELOPER > ANALYST > VIEWER
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthenticatedUser, AuthError, UserRole } from "@/lib/auth/jwt";

// ─── Role Hierarchy ───────────────────────

const ROLE_LEVELS: Record<UserRole, number> = {
  VIEWER: 0,
  ANALYST: 1,
  DEVELOPER: 2,
  ADMIN: 3,
  OWNER: 4,
};

// ─── Permission Definitions ───────────────

export const PERMISSIONS = {
  // Agent permissions
  "agents:read":    ["VIEWER", "ANALYST", "DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "agents:create":  ["DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "agents:update":  ["DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "agents:delete":  ["ADMIN", "OWNER"] as UserRole[],
  "agents:execute": ["DEVELOPER", "ADMIN", "OWNER"] as UserRole[],

  // Workflow permissions
  "workflows:read":    ["VIEWER", "ANALYST", "DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "workflows:create":  ["DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "workflows:update":  ["DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "workflows:delete":  ["ADMIN", "OWNER"] as UserRole[],

  // Integration permissions
  "integrations:read":    ["ANALYST", "DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "integrations:create":  ["ADMIN", "OWNER"] as UserRole[],
  "integrations:update":  ["ADMIN", "OWNER"] as UserRole[],
  "integrations:delete":  ["OWNER"] as UserRole[],

  // Log permissions
  "logs:read":     ["ANALYST", "DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "audit:read":    ["ADMIN", "OWNER"] as UserRole[],

  // Analytics permissions
  "analytics:read": ["ANALYST", "DEVELOPER", "ADMIN", "OWNER"] as UserRole[],

  // Settings permissions
  "settings:read":    ["ADMIN", "OWNER"] as UserRole[],
  "settings:update":  ["ADMIN", "OWNER"] as UserRole[],
  "billing:read":     ["ADMIN", "OWNER"] as UserRole[],
  "billing:update":   ["OWNER"] as UserRole[],
  "apikeys:read":     ["DEVELOPER", "ADMIN", "OWNER"] as UserRole[],
  "apikeys:create":   ["ADMIN", "OWNER"] as UserRole[],
  "apikeys:revoke":   ["ADMIN", "OWNER"] as UserRole[],

  // Team management
  "team:read":     ["ADMIN", "OWNER"] as UserRole[],
  "team:invite":   ["ADMIN", "OWNER"] as UserRole[],
  "team:remove":   ["OWNER"] as UserRole[],
  "team:roles":    ["OWNER"] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ─── Authorization Functions ──────────────

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AuthenticatedUser, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(user.role);
}

/**
 * Check if a user's role meets a minimum level
 */
export function hasMinimumRole(user: AuthenticatedUser, minimumRole: UserRole): boolean {
  return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minimumRole];
}

// ─── API Response Helpers ─────────────────

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// ─── Route Protection Wrapper ─────────────

type RouteHandler = (
  req: NextRequest,
  context: { user: AuthenticatedUser; params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Protect an API route with authentication + permission check.
 * 
 * Usage:
 * ```ts
 * export const GET = withAuth("agents:read", async (req, { user }) => {
 *   // user is guaranteed to be authenticated with the right permission
 *   return NextResponse.json({ tenantId: user.tenantId });
 * });
 * ```
 */
export function withAuth(permission: Permission, handler: RouteHandler): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      // Step 1: Authenticate
      const user = authenticateRequest(req);

      // Step 2: Authorize
      if (!hasPermission(user, permission)) {
        return jsonError(
          `Forbidden: role "${user.role}" does not have permission "${permission}"`,
          403
        );
      }

      // Step 3: Execute handler
      return await handler(req, { user });
    } catch (error) {
      if (error instanceof AuthError) {
        return jsonError(error.message, error.status);
      }
      console.error("[RBAC] Unexpected error:", error);
      return jsonError("Internal server error", 500);
    }
  };
}

/**
 * Protect a route requiring only authentication (no specific permission).
 */
export function withAuthentication(handler: RouteHandler): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      const user = authenticateRequest(req);
      return await handler(req, { user });
    } catch (error) {
      if (error instanceof AuthError) {
        return jsonError(error.message, error.status);
      }
      console.error("[Auth] Unexpected error:", error);
      return jsonError("Internal server error", 500);
    }
  };
}

/**
 * Protect a route requiring minimum role level.
 */
export function withMinRole(minimumRole: UserRole, handler: RouteHandler): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      const user = authenticateRequest(req);
      
      if (!hasMinimumRole(user, minimumRole)) {
        return jsonError(
          `Forbidden: requires at least "${minimumRole}" role, you have "${user.role}"`,
          403
        );
      }

      return await handler(req, { user });
    } catch (error) {
      if (error instanceof AuthError) {
        return jsonError(error.message, error.status);
      }
      console.error("[RBAC] Unexpected error:", error);
      return jsonError("Internal server error", 500);
    }
  };
}
