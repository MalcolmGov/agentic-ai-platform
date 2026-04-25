"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import AgenticVoiceCoPilot from "@/components/AgenticVoiceCoPilot";
import {
  DashboardIcon,
  AgentIcon,
  WorkflowIcon,
  IntegrationIcon,
  LogIcon,
  AnalyticsIcon,
  SettingsIcon,
  BellIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";
import {
  getDepartmentNav,
  getDepartmentConfig,
  type DepartmentId,
  type NavItem,
} from "@/lib/departments";

// ─── Types ───────────────────────────────────────────────────────────────────

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
};

type SessionTenant = {
  id: string;
  name?: string | null;
  slug?: string | null;
  plan?: string | null;
};

type WhiteLabelConfig = {
  theme?: {
    primaryColor?: string;
    logoUrl?: string | null;
  };
  loginPage?: {
    headline?: string;
    subheadline?: string;
  };
};

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  DashboardIcon,
  AgentIcon,
  WorkflowIcon,
  IntegrationIcon,
  LogIcon,
  AnalyticsIcon,
  SettingsIcon,
  UsersIcon,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? DashboardIcon;
  return <Icon className={className} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-white/5" />
      ))}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<SessionTenant | null>(null);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/me", { method: "POST" }); // clears httpOnly cookie
    } catch {}
    localStorage.removeItem("auth_token");
    router.push("/login");
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data.user);
          setTenant(data.data.tenant);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/white-label")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.config) {
          setWhiteLabelConfig(data.data.config);
        }
      })
      .catch(() => {});
  }, [user]);

  const navItems: NavItem[] = getDepartmentNav(
    user?.department as DepartmentId | null,
    user?.role ?? "VIEWER"
  );

  const deptConfig = getDepartmentConfig(
    user?.department as DepartmentId | null
  );

  const isAdminRole =
    user?.role === "OWNER" || user?.role === "ADMIN";

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "??";

  const displayName = user?.name || user?.email || "Loading…";
  const displayEmail = user?.email || "";

  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <aside
        className="w-64 border-r border-border bg-navy-900/50 backdrop-blur-xl flex flex-col fixed left-0 h-screen z-40 top-0"
        style={{ "--brand-primary": whiteLabelConfig?.theme?.primaryColor ?? "#6366f1" } as React.CSSProperties}
      >

        {/* Department colour accent bar */}
        {deptConfig && (
          <div
            className="h-0.5 w-full"
            style={{ backgroundColor: deptConfig.color }}
          />
        )}

        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image
              src={whiteLabelConfig?.theme?.logoUrl || "/logo-3d.png"}
              alt={whiteLabelConfig?.loginPage?.headline ?? "Swifter AI"}
              width={36}
              height={36}
              className="rounded-xl object-contain"
              unoptimized={!!whiteLabelConfig?.theme?.logoUrl}
            />
            <div>
              <div className="text-sm font-bold text-text-primary tracking-tight">
                {whiteLabelConfig?.loginPage?.headline ?? tenant?.name ?? "Swifter AI"}
              </div>
              <div className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                {whiteLabelConfig?.loginPage?.subheadline ?? "Platform"}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {loading ? (
            <SidebarSkeleton />
          ) : (
            navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <NavIcon name={item.icon} className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>

        {/* Sidebar footer — department badge or plan */}
        <div className="p-4 border-t border-border">
          <div className="glass-card p-4 text-center">
            {loading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3 rounded bg-white/10 w-2/3 mx-auto" />
                <div className="h-4 rounded bg-white/10 w-1/2 mx-auto" />
              </div>
            ) : deptConfig && !isAdminRole ? (
              <>
                <div className="text-lg mb-0.5">{deptConfig.icon}</div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: deptConfig.color }}
                >
                  {deptConfig.label}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  {deptConfig.agentCount} agent
                  {deptConfig.agentCount !== 1 ? "s" : ""} available
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-text-muted mb-1">Current Plan</div>
                <div className="text-sm font-semibold text-electric-400 capitalize">
                  {tenant?.plan ?? "Enterprise"}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  {user?.role ?? "Admin"}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 ml-64">

        {/* Top bar */}
        <header className="sticky z-30 h-16 border-b border-border bg-navy-950/80 backdrop-blur-xl flex items-center justify-between px-8 top-0">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search agents, workflows, logs..."
              className="input-field pl-10 w-80 py-2 text-sm bg-navy-900/50"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-surface-elevated transition-colors">
              <BellIcon className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="h-6 w-px bg-border" />

            {loading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="space-y-1">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="h-2.5 w-32 rounded bg-white/10" />
                </div>
              </div>
            ) : (
              <div className="relative" ref={menuRef}>
                {/* Clickable user chip */}
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-elevated transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold${deptConfig && !isAdminRole ? "" : " bg-gradient-to-br from-electric-500 to-cyan-400"}`}
                    style={deptConfig && !isAdminRole ? { backgroundColor: deptConfig.color } : undefined}
                  >
                    {userInitials}
                  </div>
                  <div className="text-sm text-left">
                    <div className="font-medium text-text-primary">{displayName}</div>
                    <div className="text-xs text-text-muted">{displayEmail}</div>
                  </div>
                  {/* Chevron */}
                  <svg className={`w-4 h-4 text-text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-navy-900 shadow-2xl z-50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border">
                      <div className="text-sm font-semibold text-text-primary">{displayName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{displayEmail}</div>
                      {deptConfig && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-sm">{deptConfig.icon}</span>
                          <span className="text-xs font-medium" style={{ color: deptConfig.color }}>{deptConfig.label}</span>
                        </div>
                      )}
                      <div className="mt-1">
                        <span className="text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-text-muted">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5">
                      <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
                        <SettingsIcon className="w-4 h-4" /> Settings
                      </Link>
                      {isAdminRole && (
                        <Link href="/dashboard/settings/white-label" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4a2 2 0 01-2 2z" /></svg>
                          White-Label Settings
                        </Link>
                      )}
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">{children}</main>
      </div>

      {/* Voice Co-Pilot (floating) */}
      <AgenticVoiceCoPilot />
    </div>
  );
}
