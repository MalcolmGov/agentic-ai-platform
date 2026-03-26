/**
 * Authenticated API Client
 *
 * Wraps fetch with automatic auth headers and 401 handling.
 * All methods return typed JSON responses.
 */

import { getAuthHeaders } from "@/lib/auth/session";

// ─── Types ───────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
  timestamp: string;
}

// ─── Core Request ────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  // Handle 401 — redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return {
      success: false,
      error: "Authentication required",
      timestamp: new Date().toISOString(),
    };
  }

  const json: ApiResponse<T> = await response.json();
  return json;
}

// ─── Public API ──────────────────────────

export const apiClient = {
  get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: "GET" });
  },

  post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: "DELETE" });
  },
};
