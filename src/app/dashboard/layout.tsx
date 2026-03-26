"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

const navItems = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/dashboard/agents", label: "Agents", icon: AgentIcon },
  { href: "/dashboard/workflows", label: "Workflows", icon: WorkflowIcon },
  { href: "/dashboard/integrations", label: "Integrations", icon: IntegrationIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/dashboard/logs", label: "Logs & Audit", icon: LogIcon },
  { href: "/dashboard/reviews", label: "Reviews", icon: BellIcon },
  { href: "/dashboard/helpdesk", label: "IT Helpdesk", icon: AgentIcon },
  { href: "/dashboard/intel", label: "Intel", icon: SearchIcon },
  { href: "/dashboard/users", label: "Users", icon: UsersIcon },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_session=true"));
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Demo Banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-electric-500 to-violet-500 text-white text-center py-2 text-sm font-medium shadow-lg">
          <span className="mr-2">🚀</span>
          You&apos;re viewing a live demo — data is simulated
          <Link
            href="/register"
            className="ml-3 px-3 py-0.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold transition-colors no-underline text-white"
          >
            Create Free Account →
          </Link>
          <span className="mx-2 opacity-50">|</span>
          <Link
            href="/login"
            className="px-3 py-0.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold transition-colors no-underline text-white"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-navy-900/50 backdrop-blur-xl flex flex-col fixed left-0 h-screen z-40 ${isDemo ? "top-[36px]" : "top-0"}`}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo-3d.png" alt="Agentic AI" width={36} height={36} className="rounded-xl" />
            <div>
              <div className="text-sm font-bold text-text-primary tracking-tight">Agentic AI</div>
              <div className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                {isDemo ? "Live Demo" : "Platform"}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
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
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-border">
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Current Plan</div>
            <div className="text-sm font-semibold text-electric-400">
              {isDemo ? "Demo" : "Enterprise"}
            </div>
            <div className="text-[10px] text-text-muted mt-1">12 agents active</div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`flex-1 ml-64 ${isDemo ? "mt-[36px]" : ""}`}>
        {/* Top bar */}
        <header className={`sticky z-30 h-16 border-b border-border bg-navy-950/80 backdrop-blur-xl flex items-center justify-between px-8 ${isDemo ? "top-[36px]" : "top-0"}`}>
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
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isDemo ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" : "bg-gradient-to-br from-electric-500 to-cyan-400"}`}>
                {isDemo ? "D" : "EA"}
              </div>
              <div className="text-sm">
                <div className="font-medium text-text-primary">
                  {isDemo ? "Demo User" : "Enterprise Admin"}
                </div>
                <div className="text-xs text-text-muted">
                  {isDemo ? "demo@agentic-ai.com" : "admin@acme.com"}
                </div>
              </div>
            </div>
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
