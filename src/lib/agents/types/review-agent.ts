/**
 * App Store Review Management Agent
 * 
 * Autonomous agent that:
 * - Reads and categorizes app store reviews (Google Play, Apple App Store)
 * - Analyzes sentiment (positive, neutral, negative, critical)
 * - Generates professional, empathetic responses
 * - Holds conversation threads with reviewers
 * - Routes critical/escalation reviews to human support
 * - Tracks review trends and generates insights
 */

import { IntelligentAgent, type AgentConfig, type AgentContext, type AgentResult } from "../intelligent-agent";

interface Review {
  id: string;
  platform: "google_play" | "app_store";
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  version: string;
  language: string;
  replied: boolean;
  sentiment?: "positive" | "neutral" | "negative" | "critical";
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  escalated?: boolean;
  response?: string;
  responseDate?: string;
  conversationThread?: { role: "user" | "agent" | "human"; content: string; date: string }[];
}

// Sentiment analysis rules (used when LLM unavailable)
function analyzeSentiment(rating: number, content: string): Review["sentiment"] {
  const lowerContent = content.toLowerCase();
  const criticalKeywords = ["crash", "lost data", "fraud", "scam", "stolen", "security breach", "lawsuit", "worst app", "uninstall", "refund"];
  const negativeKeywords = ["bug", "slow", "error", "broken", "terrible", "horrible", "useless", "waste", "disappointed", "frustrating"];
  const positiveKeywords = ["love", "great", "amazing", "excellent", "perfect", "best", "awesome", "fantastic", "helpful", "recommend"];

  if (criticalKeywords.some(k => lowerContent.includes(k)) || rating === 1) return "critical";
  if (negativeKeywords.some(k => lowerContent.includes(k)) || rating <= 2) return "negative";
  if (positiveKeywords.some(k => lowerContent.includes(k)) || rating >= 4) return "positive";
  return "neutral";
}

// Categorize review topic
function categorizeReview(content: string): string {
  const lowerContent = content.toLowerCase();
  const categories: Record<string, string[]> = {
    "Performance": ["slow", "lag", "freeze", "crash", "memory", "battery", "loading"],
    "UX/UI": ["design", "ui", "ux", "interface", "confusing", "hard to use", "navigation", "layout"],
    "Feature Request": ["wish", "would be nice", "please add", "missing feature", "need", "should have"],
    "Authentication": ["login", "password", "sign in", "account", "locked out", "2fa", "biometric"],
    "Billing": ["charge", "subscription", "payment", "refund", "price", "expensive", "billing"],
    "Data/Privacy": ["data", "privacy", "security", "breach", "personal information", "gdpr"],
    "Bug Report": ["bug", "error", "glitch", "broken", "not working", "issue", "problem"],
    "Praise": ["love", "great", "amazing", "excellent", "best", "awesome", "thank"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => lowerContent.includes(k))) return category;
  }
  return "General";
}

// Determine priority based on sentiment and rating
function determinePriority(sentiment: Review["sentiment"], rating: number): Review["priority"] {
  if (sentiment === "critical") return "urgent";
  if (sentiment === "negative" && rating <= 2) return "high";
  if (sentiment === "negative" || rating === 3) return "medium";
  return "low";
}

// Should this review be escalated to human support?
function shouldEscalate(review: Review): boolean {
  const escalationTriggers = [
    "legal", "lawsuit", "attorney", "fraud", "scam", "stolen money",
    "security breach", "data leak", "discrimination", "threat",
    "suicide", "harm", "abuse", "police", "refund demand",
  ];
  const lowerContent = review.content.toLowerCase();
  return (
    review.priority === "urgent" ||
    escalationTriggers.some(t => lowerContent.includes(t)) ||
    (review.rating === 1 && review.content.length > 200) // Detailed 1-star = angry customer
  );
}

// Generate professional response based on sentiment and category
function generateResponse(review: Review): string {
  const name = review.author.split(" ")[0] || "there";

  if (review.sentiment === "positive") {
    const positiveResponses = [
      `Hi ${name}, thank you so much for the wonderful review! 🎉 We're thrilled to hear you're enjoying the app. Your support means the world to our team. If you ever have suggestions for how we can make it even better, we'd love to hear from you!`,
      `Thank you for the kind words, ${name}! ⭐ We're committed to delivering the best experience possible. If there's anything you'd like to see in future updates, don't hesitate to reach out to our team at support@company.com.`,
    ];
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }

  if (review.sentiment === "critical" || review.sentiment === "negative") {
    const category = review.category || "General";
    const categoryResponses: Record<string, string> = {
      "Performance": `Hi ${name}, we sincerely apologize for the performance issues you've experienced. Our engineering team has been notified and is actively investigating. Could you please share your device model and OS version at support@company.com? This will help us resolve this faster. We're committed to fixing this in our next update.`,
      "Bug Report": `Hi ${name}, thank you for reporting this issue — we take every bug seriously. Our QA team is looking into this right now. We'd appreciate it if you could provide more details at support@company.com so we can reproduce and fix this as quickly as possible. We apologize for the inconvenience.`,
      "Authentication": `Hi ${name}, we're sorry you're having trouble accessing your account. Please contact our support team directly at support@company.com or use the in-app "Help" button — we can typically resolve login issues within minutes. Your account security is our top priority.`,
      "Billing": `Hi ${name}, we understand billing concerns are stressful and we want to resolve this immediately. Please reach out to billing@company.com with your account details, and our billing team will review your case within 24 hours. We apologize for any inconvenience.`,
      "Data/Privacy": `Hi ${name}, your privacy and data security are our highest priority. We'd like to understand your concern better — please contact our privacy team directly at privacy@company.com. We take every data-related concern extremely seriously and will respond within 24 hours.`,
    };
    return categoryResponses[category] ||
      `Hi ${name}, we're sorry to hear about your experience and we want to make this right. Could you please reach out to our support team at support@company.com with more details? We're committed to resolving this as quickly as possible. Thank you for your patience.`;
  }

  // Neutral
  return `Hi ${name}, thank you for your feedback! We appreciate you taking the time to share your thoughts. We're always working to improve, and your input helps us prioritize what matters most to our users. If you have any specific suggestions, we'd love to hear them at feedback@company.com.`;
}

// ─── Review Agent Config ──────────────────

export const REVIEW_AGENT_CONFIG: AgentConfig = {
  id: "review-management-agent",
  name: "App Store Review Agent",
  description: "Manages app store reviews: sentiment analysis, professional responses, conversation threading, and human escalation",
  systemPrompt: `You are a professional App Store Review Management Agent. Your responsibilities:
1. Analyze sentiment of every review (positive, neutral, negative, critical)
2. Categorize reviews by topic (Performance, Bug Report, Feature Request, Billing, etc.)
3. Generate empathetic, professional responses that acknowledge the user's experience
4. Route critical reviews to human support immediately
5. Track patterns and generate insights for the product team
6. Never be defensive. Always be empathetic. Always offer a resolution path.`,
  tools: [
    { name: "fetch_reviews", description: "Fetch new reviews from app stores" },
    { name: "analyze_sentiment", description: "Analyze review sentiment and categorize" },
    { name: "generate_response", description: "Generate professional response for a review" },
    { name: "post_response", description: "Post response to app store" },
    { name: "escalate_to_human", description: "Route critical review to human support" },
    { name: "update_crm", description: "Update CRM with review data and conversation" },
    { name: "generate_insights", description: "Generate review trend insights report" },
  ],
  maxIterations: 10,
  memoryEnabled: true,
};

// Process a batch of reviews
export function processReviews(reviews: Review[]): {
  processed: Review[];
  escalated: Review[];
  insights: {
    total: number;
    avgRating: number;
    sentimentBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    escalatedCount: number;
    responseRate: number;
  };
} {
  const processed: Review[] = [];
  const escalated: Review[] = [];

  for (const review of reviews) {
    // Analyze
    review.sentiment = analyzeSentiment(review.rating, review.content);
    review.category = categorizeReview(review.content);
    review.priority = determinePriority(review.sentiment, review.rating);
    review.escalated = shouldEscalate(review);

    // Generate response
    if (!review.replied) {
      review.response = generateResponse(review);
      review.responseDate = new Date().toISOString();
      review.replied = true;
    }

    if (review.escalated) {
      escalated.push(review);
    }
    processed.push(review);
  }

  // Calculate insights
  const sentimentBreakdown: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};

  for (const r of processed) {
    sentimentBreakdown[r.sentiment!] = (sentimentBreakdown[r.sentiment!] || 0) + 1;
    categoryBreakdown[r.category!] = (categoryBreakdown[r.category!] || 0) + 1;
  }

  const avgRating = processed.reduce((sum, r) => sum + r.rating, 0) / processed.length;

  return {
    processed,
    escalated,
    insights: {
      total: processed.length,
      avgRating: Math.round(avgRating * 10) / 10,
      sentimentBreakdown,
      categoryBreakdown,
      escalatedCount: escalated.length,
      responseRate: 100,
    },
  };
}

export type { Review };
