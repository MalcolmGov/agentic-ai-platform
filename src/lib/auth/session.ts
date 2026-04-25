/**
 * Client-Side Session Utilities
 *
 * Reads auth_token cookie, decodes JWT payload (without verification),
 * and provides helpers for authentication state management.
 */

export interface SessionData {
  userId: string;
  tenantId: string;
  email: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "ANALYST" | "VIEWER";
  iat?: number;
  exp?: number;
}

// ─── Cookie Helpers ──────────────────────

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── JWT Decode (no verification) ────────

function decodeJwtPayload(token: string): SessionData | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────

/**
 * Read the auth_token cookie and decode the JWT payload.
 * Returns null if no token is present or decoding fails.
 */
export function getSession(): SessionData | null {
  const token = getCookie("auth_token");
  if (!token) return null;

  // Demo tokens use a "demo.<base64>" format, not a real JWT
  if (token.startsWith("demo.")) {
    try {
      const base64 = token.slice(5);
      const decoded = atob(base64);
      const data = JSON.parse(decoded);
      return {
        userId: data.userId,
        tenantId: data.tenantId,
        email: data.email,
        role: data.role,
        exp: data.exp,
      } as SessionData;
    } catch {
      return null;
    }
  }

  return decodeJwtPayload(token);
}

/**
 * Check whether a valid (non-expired) session exists.
 */
export function isAuthenticated(): boolean {
  const session = getSession();
  if (!session) return false;
  if (session.exp && session.exp * 1000 < Date.now()) return false;
  return true;
}

/**
 * Clear the auth_token and demo_session cookies and redirect to /login.
 */
export function logout(): void {
  deleteCookie("auth_token");
  deleteCookie("demo_session");
  window.location.href = "/login";
}

/**
 * Return an Authorization header object for authenticated API calls.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getCookie("auth_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Returns the current session data (convenience wrapper around getSession).
 * This is a plain function, not a React hook.
 */
export function useSession(): SessionData | null {
  return getSession();
}
