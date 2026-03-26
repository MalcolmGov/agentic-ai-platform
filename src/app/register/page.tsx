"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    industry: "Financial Services",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.data.token);
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-electric-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
          <p className="text-text-secondary mt-1 text-sm">Start deploying AI agents for your organization</p>
        </div>

        <form onSubmit={handleRegister} className="glass-card p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-text-secondary block mb-2">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" placeholder="John Anderson" required />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Work Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" placeholder="john@acme.com" required />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Password</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" placeholder="Min 8 characters" required minLength={8} />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Organization Name</label>
            <input type="text" value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} className="input-field" placeholder="Acme Corporation" required />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Industry</label>
            <select value={form.industry} onChange={(e) => update("industry", e.target.value)} className="input-field">
              <option>Financial Services</option>
              <option>Fintech</option>
              <option>Retail</option>
              <option>Telecommunications</option>
              <option>Logistics</option>
              <option>Healthcare</option>
              <option>Insurance</option>
              <option>Other</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center text-sm text-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-electric-400 hover:text-electric-300 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
