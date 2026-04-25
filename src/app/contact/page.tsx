"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo-3d.png" alt="Swifter AI" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-text-primary">Swifter AI</span>
            <span className="text-text-muted text-sm">/ Contact</span>
          </Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2">Start Free →</Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">Contact</div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Let&apos;s Talk</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Whether you need enterprise pricing, technical support, or just want to learn more — we&apos;re here.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="glass-card p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Message Sent!</h3>
                <p className="text-text-secondary">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">Full Name</label>
                  <input type="text" required className="input-field w-full py-2.5" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">Work Email</label>
                  <input type="email" required className="input-field w-full py-2.5" placeholder="jane@company.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">Company</label>
                  <input type="text" className="input-field w-full py-2.5" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">Interest</label>
                  <select className="input-field w-full py-2.5 bg-navy-900">
                    <option>Enterprise Pricing</option>
                    <option>Technical Demo</option>
                    <option>Partnership</option>
                    <option>Support</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">Message</label>
                  <textarea rows={4} className="input-field w-full py-2.5 resize-none" placeholder="Tell us about your use case..." />
                </div>
                <button type="submit" className="btn-primary w-full py-3 text-sm font-semibold">Send Message →</button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: "📧", title: "Email", value: "hello@swifter-ai.com", desc: "For general inquiries and support" },
              { icon: "💼", title: "Enterprise Sales", value: "sales@swifter-ai.com", desc: "Custom pricing and dedicated accounts" },
              { icon: "🛡️", title: "Security", value: "security@swifter-ai.com", desc: "Report vulnerabilities or request our SOC 2 report" },
              { icon: "📍", title: "Location", value: "Cape Town, South Africa", desc: "Remote-first team · Africa / EU / US timezones" },
            ].map((item) => (
              <div key={item.title} className="glass-card p-6 flex items-start gap-4 hover:border-electric-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 flex items-center justify-center text-2xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-electric-400 text-sm font-medium">{item.value}</p>
                  <p className="text-text-muted text-xs mt-1">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Quick links */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-primary mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/docs" className="block text-sm text-text-secondary hover:text-electric-400 transition-colors">📖 API Documentation</Link>
                <Link href="/blog" className="block text-sm text-text-secondary hover:text-electric-400 transition-colors">📝 Blog & Updates</Link>
                <Link href="/changelog" className="block text-sm text-text-secondary hover:text-electric-400 transition-colors">🔄 Changelog</Link>
                <Link href="/demo" className="block text-sm text-text-secondary hover:text-electric-400 transition-colors">🚀 Try Live Demo</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
