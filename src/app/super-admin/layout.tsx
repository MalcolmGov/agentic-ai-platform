"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const NAV_ITEMS = [
  { href: "/super-admin", label: "Platform Overview", icon: "📊", exact: true },
  { href: "/super-admin/resellers", label: "Resellers", icon: "🤝" },
  { href: "/super-admin/clients", label: "All Clients", icon: "🏢" },
  { href: "/super-admin/revenue", label: "Revenue", icon: "💰" },
  { href: "/super-admin/health", label: "System Health", icon: "🩺" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed left-0 h-screen z-40 top-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              A
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Swifter AI</div>
              <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + back link */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {!loading && user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-slate-200 truncate">{user.name || user.email}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        {/* Warning banner */}
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-8 py-2 text-xs text-rose-400 text-center">
          ⚠️ Super Admin Mode — Restricted to platform administrators only
        </div>

        {/* Top bar */}
        <header className="sticky z-30 h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl flex items-center justify-between px-8 top-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Super Admin Mode
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Platform operational
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
