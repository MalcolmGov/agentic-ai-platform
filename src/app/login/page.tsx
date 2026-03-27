"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const successMessage = searchParams.get("registered") === "true"
    ? "Account created successfully. Please sign in."
    : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Cookie is set by the server (httpOnly), also store for client-side API calls
      localStorage.setItem("auth_token", data.data.token);

      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function handleDemo() {
    setDemoLoading(true);
    // The demo endpoint is a GET that sets cookies and redirects
    window.location.href = "/api/demo";
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg gradient-mesh">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-electric-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Animated floating orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-electric-500/8 via-violet-500/6 to-cyan-500/4 blur-3xl animate-float-slow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              {/* Neural network / sparkle icon */}
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.9" />
              <circle cx="5" cy="6" r="1.2" fill="currentColor" opacity="0.6" />
              <circle cx="19" cy="6" r="1.2" fill="currentColor" opacity="0.6" />
              <circle cx="5" cy="18" r="1.2" fill="currentColor" opacity="0.6" />
              <circle cx="19" cy="18" r="1.2" fill="currentColor" opacity="0.6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L5 6M12 12L19 6M12 12L5 18M12 12L19 18" strokeOpacity="0.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Welcome Back</h1>
          <p className="text-text-secondary mt-1 text-sm">Sign in to your Agentic AI Platform</p>
        </div>

        {/* Success message (from registration) */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            {successMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="glass-card glow-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-text-secondary block mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@acme.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-text-secondary">Password</label>
              <span className="text-xs text-electric-400 hover:text-electric-300 cursor-pointer transition-colors">
                Forgot password?
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted whitespace-nowrap">or explore the platform</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={demoLoading}
            className="btn-secondary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {demoLoading ? "Loading demo..." : "Try Demo"}
          </button>

          <div className="text-center text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-electric-400 hover:text-electric-300 font-medium">
              Create one
            </Link>
          </div>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 glass-card p-4 flex items-center gap-3 justify-center">
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <div className="text-center">
            <div className="text-xs text-text-muted mb-0.5">Demo Credentials</div>
            <div className="text-sm text-text-secondary font-mono">admin@acme.com / admin123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}
