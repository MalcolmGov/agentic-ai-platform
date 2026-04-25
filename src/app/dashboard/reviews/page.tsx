"use client";

import { useState, useEffect, useRef } from "react";

// ─── Mock Review Data ──────────────────────

interface Review {
  id: string;
  platform: "google_play" | "app_store";
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  version: string;
  sentiment: "positive" | "neutral" | "negative" | "critical";
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  escalated: boolean;
  status: "new" | "processing" | "responded" | "escalated" | "resolved";
  response?: string;
  agentThinking?: string[];
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "REV-001", platform: "google_play", author: "Sarah Mitchell", rating: 1,
    title: "App crashed and I lost all my data!!!",
    content: "The app crashed during a transaction and now all my data is gone. I had important financial records and they've completely disappeared. This is unacceptable for a financial app. I want a refund and I'm considering contacting my attorney.",
    date: "2h ago", version: "3.2.1", sentiment: "critical", category: "Data/Privacy", priority: "urgent", escalated: true, status: "new",
  },
  {
    id: "REV-002", platform: "app_store", author: "James Rodriguez", rating: 2,
    title: "Very slow and buggy since last update",
    content: "Since the latest update, the app takes forever to load. Every screen has a 3-5 second delay and the transaction history page just shows a blank screen. Running iPhone 15 Pro with latest iOS. Please fix this ASAP.",
    date: "3h ago", version: "3.2.1", sentiment: "negative", category: "Performance", priority: "high", escalated: false, status: "new",
  },
  {
    id: "REV-003", platform: "google_play", author: "Priya Sharma", rating: 5,
    title: "Best financial app I've ever used! ❤️",
    content: "I've been using this app for 6 months and it has completely transformed how I manage my money. The AI insights are incredibly helpful and the interface is beautiful. Keep up the great work, team!",
    date: "4h ago", version: "3.2.0", sentiment: "positive", category: "Praise", priority: "low", escalated: false, status: "new",
  },
  {
    id: "REV-004", platform: "app_store", author: "Marcus Chen", rating: 3,
    title: "Good app but needs dark mode",
    content: "The app works well overall but I really wish you'd add a dark mode. Using it at night is painful because the white background is so bright. Also, it would be nice to have biometric login instead of just PIN.",
    date: "5h ago", version: "3.2.0", sentiment: "neutral", category: "Feature Request", priority: "medium", escalated: false, status: "new",
  },
  {
    id: "REV-005", platform: "google_play", author: "Emily Watson", rating: 1,
    title: "Can't login — locked out of my account",
    content: "I've been locked out of my account for 3 days now. The password reset doesn't work — it says 'email not found' but I've been using this email for 2 years. I have money in there and I can't access it. This is really stressful.",
    date: "6h ago", version: "3.2.1", sentiment: "critical", category: "Authentication", priority: "urgent", escalated: true, status: "new",
  },
  {
    id: "REV-006", platform: "app_store", author: "David Okafor", rating: 4,
    title: "Great app, minor billing question",
    content: "Love the app overall — been using it for my small business. One issue: I was charged twice for the Pro subscription this month ($19.99 each). Can someone look into this? Not urgent but would appreciate a fix.",
    date: "7h ago", version: "3.2.0", sentiment: "neutral", category: "Billing", priority: "medium", escalated: false, status: "new",
  },
  {
    id: "REV-007", platform: "google_play", author: "Lisa Kim", rating: 5,
    title: "The AI assistant is amazing 🤖",
    content: "Just discovered the AI spending assistant feature and WOW. It predicted that I was overpaying for subscriptions and saved me $47/month. The budget recommendations are spot-on. This is the future of personal finance.",
    date: "8h ago", version: "3.2.1", sentiment: "positive", category: "Praise", priority: "low", escalated: false, status: "new",
  },
  {
    id: "REV-008", platform: "app_store", author: "Tom Anderson", rating: 2,
    title: "Security concern — suspicious activity",
    content: "I noticed transactions in my statement that I didn't make. Someone might have accessed my account. I've changed my password but I'm worried about my data. Please investigate this immediately. I need to know my money is safe.",
    date: "9h ago", version: "3.2.0", sentiment: "critical", category: "Data/Privacy", priority: "urgent", escalated: true, status: "new",
  },
];

// Agent thinking steps for each review type
const AGENT_THINKING: Record<string, string[]> = {
  critical: [
    "🔍 Analyzing sentiment... CRITICAL — immediate attention required",
    "📋 Categorizing issue and checking escalation triggers",
    "🚨 Escalation trigger detected — routing to human support team",
    "📝 Drafting empathetic response with direct support contact",
    "📊 Updating CRM with customer risk profile",
    "✅ Response posted, support ticket created, manager notified",
  ],
  negative: [
    "🔍 Analyzing sentiment... NEGATIVE — high priority",
    "📋 Categorizing: identifying specific pain points",
    "🧠 Retrieving similar past complaints and resolutions",
    "📝 Drafting professional response addressing each concern",
    "📊 Logging issue for product team pattern analysis",
    "✅ Response posted, issue logged for engineering team",
  ],
  neutral: [
    "🔍 Analyzing sentiment... NEUTRAL — standard priority",
    "📋 Categorizing feedback and extracting actionable items",
    "📝 Drafting helpful response with status update",
    "✅ Response posted, feedback logged for product roadmap",
  ],
  positive: [
    "🔍 Analyzing sentiment... POSITIVE — engagement opportunity",
    "📝 Drafting grateful response to build brand loyalty",
    "📊 Flagging for marketing as potential testimonial",
    "✅ Response posted, user tagged as brand advocate",
  ],
};

const RESPONSES: Record<string, Record<string, string>> = {
  "REV-001": { response: "Hi Sarah, we deeply apologize for this experience. Data loss during a transaction is completely unacceptable, and we understand how stressful this must be. We've immediately escalated your case to our senior support team (Ticket #SUP-8847). A team member will contact you within 2 hours via email to begin data recovery. Your financial records are backed up on our servers and we are confident we can restore them. If you'd prefer immediate assistance, please call our priority line at 1-800-XXX-XXXX. We take full responsibility and will make this right." },
  "REV-002": { response: "Hi James, thank you for the detailed report — we apologize for the performance issues since v3.2.1. Our engineering team has identified the root cause (a database query regression on the transaction history page) and a fix is in review now. You can expect a patch update (v3.2.2) within 48 hours. In the meantime, clearing the app cache may help: Settings → Storage → Clear Cache. We appreciate your patience and your detailed device info helps us test thoroughly." },
  "REV-003": { response: "Hi Priya, thank you so much for the wonderful review! 🎉 It makes our day to hear the AI insights are genuinely helping you manage your money better. Our team works incredibly hard on those features, and your feedback is exactly why we do what we do. If you have any ideas for what we could add next, we'd love to hear them at feedback@company.com. Thank you for being part of our community for 6 months! ⭐" },
  "REV-004": { response: "Hi Marcus, great feedback! You'll be happy to know that dark mode is our #1 requested feature and it's currently in development — we're targeting the v3.3 release in April. 🌙 As for biometric login, we're also working on Face ID/fingerprint support and it's on the roadmap for Q2. We'll make sure to notify you when these features ship. Thank you for helping us prioritize!" },
  "REV-005": { response: "Hi Emily, we completely understand how stressful this must be, and we're prioritizing your case right now. Being locked out of your account with funds inside is unacceptable. We've escalated this to our account recovery team (Ticket #SUP-8848) and they will reach out to you via the email on file within 1 hour. If that email is inaccessible, please call 1-800-XXX-XXXX with your account ID for immediate verification. Your funds are safe and your account is secure." },
  "REV-006": { response: "Hi David, thank you for the kind words about the app! 🙏 Regarding the duplicate charge — we've flagged this for our billing team and they will process a refund of $19.99 within 3-5 business days. You should receive a confirmation email shortly. We apologize for the inconvenience. If you don't see the refund within a week, please reach out to billing@company.com and reference case #BIL-2247." },
  "REV-007": { response: "Hi Lisa, we're thrilled the AI assistant is saving you real money! 🤖💰 $47/month in subscription savings is exactly the kind of impact we aim for. Fun fact: our AI has saved users a collective $2.3M this quarter. We're adding even more intelligent features in the next update — including automated bill negotiation. Stay tuned, and thank you for the amazing review! ⭐" },
  "REV-008": { response: "Hi Tom, your account security is our absolute highest priority. We've immediately flagged your account for a security review and our fraud investigation team is examining the suspicious transactions right now (Case #SEC-1142). We recommend: (1) Enable 2FA in Settings → Security, (2) Review all authorized devices in Settings → Sessions, (3) Contact your bank to flag the suspicious charges. A security specialist will contact you within 1 hour. Your funds will be protected." },
};

// ─── Page Component ────────────────────────

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const thinkingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thinkingRef.current) thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
  }, [thinkingSteps]);

  // Process a single review with agent animation
  async function processReview(review: Review) {
    setProcessingId(review.id);
    setIsProcessing(true);
    setSelectedReview(review);
    setThinkingSteps([]);

    // Update status
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: "processing" as const } : r));

    // Simulate agent thinking steps
    const steps = AGENT_THINKING[review.sentiment] || AGENT_THINKING.neutral;
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 600));
      setThinkingSteps(prev => [...prev, step]);
    }

    // Apply response
    await new Promise(r => setTimeout(r, 400));
    const responseData = RESPONSES[review.id];
    const newStatus = review.escalated ? "escalated" : "responded";

    setReviews(prev => prev.map(r =>
      r.id === review.id
        ? { ...r, status: newStatus as Review["status"], response: responseData?.response || "Thank you for your feedback. We appreciate you taking the time to share your experience." }
        : r
    ));
    setSelectedReview(prev => prev && prev.id === review.id
      ? { ...prev, status: newStatus as Review["status"], response: responseData?.response || "Thank you for your feedback." }
      : prev
    );
    setIsProcessing(false);
    setProcessingId(null);
  }

  // Auto-process all unhandled reviews
  async function autoProcessAll() {
    setIsAutoRunning(true);
    const unprocessed = reviews.filter(r => r.status === "new");
    for (const review of unprocessed) {
      await processReview(review);
      await new Promise(r => setTimeout(r, 500));
    }
    setIsAutoRunning(false);
  }

  // Filter reviews
  const filteredReviews = filter === "all" ? reviews : reviews.filter(r => {
    if (filter === "new") return r.status === "new";
    if (filter === "responded") return r.status === "responded";
    if (filter === "escalated") return r.status === "escalated";
    if (filter === "critical") return r.sentiment === "critical";
    return true;
  });

  // Stats
  const stats = {
    total: reviews.length,
    unhandled: reviews.filter(r => r.status === "new").length,
    responded: reviews.filter(r => r.status === "responded").length,
    escalated: reviews.filter(r => r.status === "escalated" || r.escalated).length,
    avgRating: Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10,
  };

  const ratingColor = (r: number) =>
    r >= 4 ? "text-emerald-400" : r >= 3 ? "text-amber-400" : "text-rose-400";

  const sentimentBadge = (s: string) => {
    const map: Record<string, string> = {
      positive: "badge-active", negative: "badge-error", critical: "badge-error", neutral: "badge-neutral",
    };
    return map[s] || "badge-neutral";
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { class: string; label: string }> = {
      new: { class: "badge-info", label: "New" },
      processing: { class: "badge-info", label: "Processing..." },
      responded: { class: "badge-active", label: "Responded" },
      escalated: { class: "badge-warning", label: "Escalated" },
      resolved: { class: "badge-active", label: "Resolved" },
    };
    return map[s] || { class: "badge-neutral", label: s };
  };

  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">App Store Reviews</h1>
          <p className="text-text-secondary mt-1">AI-powered review management across Google Play & App Store</p>
        </div>
        <button
          onClick={autoProcessAll}
          disabled={isAutoRunning || stats.unhandled === 0}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAutoRunning ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
          ) : (
            <>🤖 Auto-Process All ({stats.unhandled} new)</>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Reviews", value: stats.total, icon: "📱", color: "from-electric-500 to-cyan-500" },
          { label: "Unhandled", value: stats.unhandled, icon: "⏳", color: "from-amber-500 to-yellow-500" },
          { label: "Responded", value: stats.responded, icon: "✅", color: "from-emerald-500 to-teal-500" },
          { label: "Escalated", value: stats.escalated, icon: "🚨", color: "from-rose-500 to-orange-500" },
          { label: "Avg Rating", value: stats.avgRating, icon: "⭐", color: "from-violet-500 to-fuchsia-500" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{s.value}</div>
                <div className="text-xs text-text-muted">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "new", "responded", "escalated", "critical"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              filter === f ? "bg-electric-500/15 text-electric-400" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Review List */}
        <div className="lg:col-span-2 space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {filteredReviews.map(review => (
            <button
              key={review.id}
              onClick={() => { setSelectedReview(review); setThinkingSteps([]); }}
              className={`w-full text-left glass-card p-4 transition-all hover:border-electric-500/30 cursor-pointer ${
                selectedReview?.id === review.id ? "border-electric-500/40 ring-1 ring-electric-500/10" : ""
              } ${processingId === review.id ? "animate-pulse" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono ${ratingColor(review.rating)}`}>{stars(review.rating)}</span>
                  <span className="text-[10px] text-text-muted">
                    {review.platform === "google_play" ? "🟢 Play" : "🍎 iOS"}
                  </span>
                </div>
                <span className={`badge ${statusBadge(review.status).class} text-[10px]`}>
                  {statusBadge(review.status).label}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1 line-clamp-1">{review.title}</h4>
              <p className="text-xs text-text-secondary line-clamp-2 mb-2">{review.content}</p>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>{review.author}</span>
                <span>·</span>
                <span>{review.date}</span>
                <span>·</span>
                <span className={`badge ${sentimentBadge(review.sentiment)} text-[9px] py-0`}>{review.sentiment}</span>
                {review.escalated && <span className="text-rose-400">🚨</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Review Detail + Agent Response */}
        <div className="lg:col-span-3 space-y-4">
          {selectedReview ? (
            <>
              {/* Full Review */}
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                        {selectedReview.author.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{selectedReview.author}</div>
                        <div className="text-xs text-text-muted">{selectedReview.date} · v{selectedReview.version}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-mono ${ratingColor(selectedReview.rating)}`}>{stars(selectedReview.rating)}</div>
                    <div className="text-[10px] text-text-muted">
                      {selectedReview.platform === "google_play" ? "Google Play" : "App Store"}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{selectedReview.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{selectedReview.content}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`badge ${sentimentBadge(selectedReview.sentiment)}`}>{selectedReview.sentiment}</span>
                  <span className="badge badge-neutral">{selectedReview.category}</span>
                  <span className={`badge ${selectedReview.priority === "urgent" ? "badge-error" : selectedReview.priority === "high" ? "badge-warning" : "badge-neutral"}`}>
                    {selectedReview.priority} priority
                  </span>
                  {selectedReview.escalated && <span className="badge badge-error">🚨 Escalation Required</span>}
                </div>
              </div>

              {/* Agent Processing / Response */}
              {selectedReview.status === "new" ? (
                <button
                  onClick={() => processReview(selectedReview)}
                  disabled={isProcessing}
                  className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  🤖 Let AI Agent Handle This Review
                </button>
              ) : null}

              {/* Agent Thinking */}
              {thinkingSteps.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-text-muted ml-1">review-agent reasoning</span>
                  </div>
                  <div ref={thinkingRef} className="p-4 space-y-2 max-h-48 overflow-y-auto bg-navy-950/50" style={{ fontFamily: "var(--font-mono)" }}>
                    {thinkingSteps.map((step, i) => (
                      <div key={i} className="text-xs text-text-secondary animate-fade-in">{step}</div>
                    ))}
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-xs text-text-muted animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Response */}
              {selectedReview.response || reviews.find(r => r.id === selectedReview.id)?.response ? (
                <div className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.03), rgba(59,130,246,0.03))" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">Agent Response</div>
                      <div className="text-[10px] text-text-muted">Posted to {selectedReview.platform === "google_play" ? "Google Play" : "App Store"}</div>
                    </div>
                    {selectedReview.escalated && (
                      <span className="ml-auto badge badge-warning text-[10px]">
                        🔔 Also sent to human support
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {selectedReview.response || reviews.find(r => r.id === selectedReview.id)?.response}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Select a review</h3>
              <p className="text-sm text-text-secondary">Click a review from the list to view details and let the AI agent respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
