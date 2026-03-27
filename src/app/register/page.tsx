"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "$49/mo",
    description: "Up to 5 agents, 1,000 executions/mo",
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: "$199/mo",
    description: "Up to 25 agents, 10,000 executions/mo",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    description: "Unlimited agents, dedicated support",
  },
] as const;

const INDUSTRIES = [
  "Financial Services",
  "Healthcare",
  "Technology",
  "Retail",
  "Manufacturing",
  "Other",
];

function PlanIcon({ planId, selected }: { planId: string; selected: boolean }) {
  const color = selected ? "text-electric-400" : "text-text-muted";
  if (planId === "STARTER") {
    return (
      <svg className={`w-5 h-5 ${color} mb-1.5 transition-colors`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    );
  }
  if (planId === "PROFESSIONAL") {
    return (
      <svg className={`w-5 h-5 ${color} mb-1.5 transition-colors`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    );
  }
  // Enterprise - building
  return (
    <svg className={`w-5 h-5 ${color} mb-1.5 transition-colors`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    industry: "Financial Services",
    plan: "PROFESSIONAL",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          organizationName: form.organizationName,
          industry: form.industry,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Redirect to login with success message
      router.push("/login?registered=true");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg gradient-mesh">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-electric-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Animated floating orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-500/8 via-electric-500/6 to-emerald-500/4 blur-3xl animate-float-slow pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg px-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.9" />
              <circle cx="5" cy="6" r="1.2" fill="currentColor" opacity="0.6" />
              <circle cx="19" cy="6" r="1.2" fill="currentColor" opacity="0.6" />
              <circle cx="5" cy="18" r="1.2" fill="currentColor" opacity="0.6" />
              <circle cx="19" cy="18" r="1.2" fill="currentColor" opacity="0.6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L5 6M12 12L19 6M12 12L5 18M12 12L19 18" strokeOpacity="0.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Create Account</h1>
          <p className="text-text-secondary mt-1 text-sm">Start deploying AI agents for your organization</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="glass-card glow-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Organization Name */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Company Name</label>
            <input
              type="text"
              value={form.organizationName}
              onChange={(e) => update("organizationName", e.target.value)}
              className="input-field"
              placeholder="Acme Corporation"
              required
            />
          </div>

          {/* Industry */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Industry</label>
            <select
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              className="input-field appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_10px_center] bg-no-repeat pr-10"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} className="bg-navy-800 text-text-primary">
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input-field"
              placeholder="John Anderson"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Work Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input-field"
              placeholder="john@acme.com"
              required
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary block mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input-field"
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className="input-field"
                placeholder="Repeat password"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Plan Selector */}
          <div>
            <label className="text-sm text-text-secondary block mb-3">Select Plan</label>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => update("plan", plan.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all ${
                    form.plan === plan.id
                      ? "border-electric-500 bg-electric-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2),0_0_40px_rgba(59,130,246,0.06)]"
                      : "border-border bg-navy-800/50 hover:border-border-active"
                  }`}
                >
                  <PlanIcon planId={plan.id} selected={form.plan === plan.id} />
                  <div className="text-sm font-semibold text-text-primary">{plan.name}</div>
                  <div className="text-xs text-electric-400 font-mono mt-1">{plan.price}</div>
                  <div className="text-[11px] text-text-muted mt-2 leading-tight">{plan.description}</div>
                  {form.plan === plan.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-electric-500 flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-[18px] h-[18px] rounded border border-border bg-navy-800 transition-all peer-checked:bg-electric-500 peer-checked:border-electric-500 peer-focus:ring-2 peer-focus:ring-electric-500/30 group-hover:border-border-active" />
              <svg className="absolute top-[3px] left-[3px] w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <span className="text-xs text-text-muted leading-relaxed">
              I agree to the{" "}
              <span className="text-electric-400 hover:text-electric-300">Terms of Service</span>{" "}
              and{" "}
              <span className="text-electric-400 hover:text-electric-300">Privacy Policy</span>.
              You can change your plan at any time.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
