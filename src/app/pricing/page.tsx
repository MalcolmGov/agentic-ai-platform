"use client";

import { useState } from "react";

const tiers = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    description: "Perfect for teams getting started with AI automation.",
    popular: false,
    cta: "Start Free Trial",
    color: "from-cyan-500 to-blue-500",
    borderColor: "border-white/10",
    features: [
      "5 AI agents",
      "1 market",
      "10,000 interactions / month",
      "WhatsApp + Web channels",
      "Email support",
      "Standard analytics",
      "99.5% uptime SLA",
    ],
    highlight: null,
  },
  {
    name: "Business",
    price: "$999",
    period: "/mo",
    description: "For growing businesses scaling AI across departments.",
    popular: true,
    cta: "Get Started",
    color: "from-electric-500 to-violet-500",
    borderColor: "border-electric-500/40",
    features: [
      "25 AI agents",
      "5 markets",
      "100,000 interactions / month",
      "All channels (WhatsApp, Web, Voice, SMS)",
      "SSO / SAML",
      "Priority support (4h SLA)",
      "Advanced analytics & audit logs",
      "Custom workflows",
      "99.9% uptime SLA",
    ],
    highlight: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated infrastructure for large-scale, regulated businesses.",
    popular: false,
    cta: "Contact Sales",
    color: "from-violet-500 to-fuchsia-500",
    borderColor: "border-white/10",
    features: [
      "Unlimited AI agents",
      "All 13 markets",
      "Unlimited interactions",
      "Dedicated infrastructure",
      "In-country data residency",
      "Custom SLA (up to 99.99%)",
      "Compliance pack (POPIA, GDPR, ISO 27001)",
      "Dedicated account manager",
      "On-boarding & training",
      "White-label options",
    ],
    highlight: null,
  },
];

const faqs = [
  {
    q: "What is a market?",
    a: "A market represents a geographic or regulatory region where your AI agents are deployed. Each market can have its own language, compliance rules, data-residency settings, and channel configurations. For example, you might have separate markets for South Africa, Kenya, and Nigeria — each with localised WhatsApp numbers and in-country data storage.",
  },
  {
    q: "Can we deploy to our existing apps?",
    a: "Yes. Swifter AI provides REST APIs, webhooks, and SDKs (JavaScript, Python) that integrate with any existing web or mobile application. Our Apps & Properties feature lets you register your domains and mobile apps, then attach agents to specific surfaces — chat widgets, API endpoints, or background jobs — without rebuilding your stack.",
  },
  {
    q: "How does WhatsApp integration work?",
    a: "We use the WhatsApp Business API (via official partners) to connect your agents directly to WhatsApp numbers. You can use an existing number or provision a new one through our dashboard. Agents handle inbound messages, media, and interactive buttons automatically. Business and Enterprise plans support multiple numbers across different markets.",
  },
  {
    q: "Is our data stored in-country?",
    a: "Enterprise customers can elect in-country data residency for supported regions (currently South Africa, EU, UK, UAE, and Kenya). Conversation data, embeddings, and logs are stored and processed within the chosen region and never leave that boundary. Starter and Business plans use a shared multi-region cloud with AES-256 encryption at rest and in transit.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-navy-900" style={{ background: "linear-gradient(135deg, #020917 0%, #040e20 50%, #060b1a 100%)" }}>
      {/* Nav bar */}
      <nav className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50" style={{ background: "rgba(2,9,23,0.85)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 5.323V3a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Swifter AI</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</a>
            <a href="/dashboard" className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-electric-500 to-violet-500 text-white hover:opacity-90 transition-opacity">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-electric-500/30 bg-electric-500/10 text-electric-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Scale your business with{" "}
            <span className="bg-gradient-to-r from-electric-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI agents
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Deploy intelligent agents across every department, channel, and market. Start free, scale as you grow.
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border ${tier.borderColor} transition-all duration-300 hover:-translate-y-1 ${
                tier.popular
                  ? "shadow-[0_0_60px_-15px_rgba(59,130,246,0.4)]"
                  : ""
              }`}
              style={{
                background: tier.popular
                  ? "linear-gradient(135deg, rgba(15,25,50,0.9) 0%, rgba(20,15,45,0.9) 100%)"
                  : "rgba(10,17,34,0.7)",
                backdropFilter: "blur(16px)",
              }}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-electric-500 to-violet-500 text-white shadow-lg">
                    {tier.highlight}
                  </span>
                </div>
              )}

              {/* Top gradient line */}
              <div className={`h-[2px] w-full rounded-t-2xl bg-gradient-to-r ${tier.color}`} />

              <div className="p-8 flex flex-col flex-1">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">{tier.name}</h2>
                  <p className="text-sm text-white/50 leading-relaxed">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-white">{tier.price}</span>
                    {tier.period && (
                      <span className="text-white/40 text-lg mb-1.5">{tier.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 bg-gradient-to-br ${tier.color} rounded-full p-0.5`} viewBox="0 0 12 12" fill="white">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.name === "Enterprise" ? "mailto:sales@swifterai.io" : "/dashboard"}
                  className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-center transition-all duration-200 ${
                    tier.popular
                      ? `bg-gradient-to-r ${tier.color} text-white hover:opacity-90 hover:shadow-[0_8px_24px_-8px_rgba(59,130,246,0.6)]`
                      : "border border-white/15 text-white hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Feature comparison strip */}
        <div className="rounded-2xl border border-white/8 mb-24 overflow-hidden" style={{ background: "rgba(10,17,34,0.6)", backdropFilter: "blur(12px)" }}>
          <div className="p-8 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Everything you need to deploy AI at scale</h2>
            <p className="text-sm text-white/50 mt-1">Included on all plans</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
            {[
              { icon: "🤖", label: "AI Agent Builder", desc: "Visual no-code studio" },
              { icon: "📊", label: "Real-time Analytics", desc: "Execution monitoring" },
              { icon: "🔒", label: "Enterprise Security", desc: "AES-256 + TLS 1.3" },
              { icon: "🌍", label: "Multi-market", desc: "13 supported regions" },
              { icon: "💬", label: "Omnichannel", desc: "WhatsApp, Web, Voice, SMS" },
              { icon: "⚙️", label: "Workflow Automation", desc: "Complex multi-step flows" },
              { icon: "📝", label: "Audit Logging", desc: "Full compliance trail" },
              { icon: "🔗", label: "Open API", desc: "REST, webhooks, SDKs" },
            ].map((item) => (
              <div key={item.label} className="p-6 bg-navy-900/40 hover:bg-navy-900/60 transition-colors">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Frequently asked questions</h2>
            <p className="text-white/50">Everything you need to know before getting started.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/8 overflow-hidden transition-all duration-200"
                style={{ background: "rgba(10,17,34,0.7)", backdropFilter: "blur(12px)" }}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-white/[0.02] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="relative rounded-2xl overflow-hidden text-center p-16" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(139,92,246,0.2) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-electric-500/10 via-violet-500/10 to-fuchsia-500/10" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to deploy your first agent?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Start your 14-day free trial — no credit card required. Full Business plan access for two weeks.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="/dashboard"
                className="px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-electric-500 to-violet-500 text-white hover:opacity-90 hover:shadow-[0_8px_32px_-8px_rgba(99,102,241,0.7)] transition-all duration-200"
              >
                Start Free Trial
              </a>
              <a
                href="mailto:sales@swifterai.io"
                className="px-8 py-3.5 rounded-xl text-sm font-semibold border border-white/20 text-white hover:border-white/40 hover:bg-white/5 transition-all duration-200"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-24 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 5.323V3a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="text-xs text-white/40">© 2026 Swifter AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/70 transition-colors">Security</a>
            <a href="mailto:support@swifterai.io" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
