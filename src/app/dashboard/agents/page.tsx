'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface DeployedAgentInstance {
  instanceId: string
  templateId: string
  name: string
  department: string
  icon: string
  color: string
  status: 'active' | 'paused' | 'configuring'
  deployedAt: string
  deployedBy: string
  config: Record<string, string>
  runCount: number
  lastRunAt: string | null
}

interface SuggestedAgent {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

interface User {
  email: string
  department: string | null
  name: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentic_deployed_v2'

const DEPT_ICON: Record<string, string> = {
  HR: '👥', LEGAL: '⚖️', ENGINEERING: '⚙️', RISK: '⚠️', SECURITY: '🔒',
  COMPLIANCE: '📋', QA: '✅', PRODUCT: '🎯', OPERATIONS: '🏗️',
  FINANCE: '💰', EXECUTIVE: '👔', IT: '🖥️',
}

const DEPT_BADGE_STYLE: Record<string, string> = {
  HR:          'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  LEGAL:       'bg-violet-500/15 text-violet-400 border border-violet-500/20',
  ENGINEERING: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  RISK:        'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  SECURITY:    'bg-red-500/15 text-red-400 border border-red-500/20',
  COMPLIANCE:  'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  QA:          'bg-green-500/15 text-green-400 border border-green-500/20',
  PRODUCT:     'bg-pink-500/15 text-pink-400 border border-pink-500/20',
  FINANCE:     'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
}

// ─── Department suggestions ────────────────────────────────────────────────────

const DEPARTMENT_SUGGESTIONS: Record<string, SuggestedAgent[]> = {
  HR: [
    { id: 'hr-onboarding', name: 'Onboarding Guide', icon: '👋', description: 'Guide new employees through their first weeks', color: '#8b5cf6' },
    { id: 'hr-policy-qa', name: 'Policy Q&A Bot', icon: '📋', description: 'Answer employee policy questions instantly', color: '#8b5cf6' },
    { id: 'hr-job-description', name: 'Job Description Writer', icon: '✍️', description: 'Generate inclusive job descriptions in minutes', color: '#8b5cf6' },
  ],
  LEGAL: [
    { id: 'legal-contract-review', name: 'Contract Review', icon: '⚖️', description: 'Review contracts for risks and missing clauses', color: '#0891b2' },
    { id: 'legal-policy-qa', name: 'Legal Policy Q&A', icon: '🏛️', description: 'Answer legal policy questions from the team', color: '#0891b2' },
    { id: 'legal-nda-classifier', name: 'NDA Classifier', icon: '🔏', description: 'Classify and analyse NDAs in seconds', color: '#0891b2' },
  ],
  RISK: [
    { id: 'risk-assessment', name: 'Risk Assessment', icon: '⚠️', description: 'Guide structured risk assessments', color: '#dc2626' },
    { id: 'risk-incident-reporter', name: 'Incident Reporter', icon: '🚨', description: 'Capture and route risk incidents', color: '#dc2626' },
    { id: 'risk-vendor-screener', name: 'Vendor Screener', icon: '🔍', description: 'Screen vendors for risk exposure', color: '#dc2626' },
  ],
  SECURITY: [
    { id: 'security-phishing', name: 'Phishing Explainer', icon: '🔒', description: 'Analyse and explain suspicious emails', color: '#b45309' },
    { id: 'security-policy-qa', name: 'Security Policy Q&A', icon: '🛡️', description: 'Answer security policy questions', color: '#b45309' },
    { id: 'security-access-review', name: 'Access Review', icon: '🔑', description: 'Review user access and permissions', color: '#b45309' },
  ],
  COMPLIANCE: [
    { id: 'compliance-regulation-qa', name: 'Regulation Q&A', icon: '📊', description: 'Answer GDPR, POPIA, PCI-DSS questions', color: '#1d4ed8' },
    { id: 'compliance-policy-checker', name: 'Policy Checker', icon: '✔️', description: 'Check compliance of processes and documents', color: '#1d4ed8' },
    { id: 'compliance-audit-evidence', name: 'Audit Evidence', icon: '📁', description: 'Collect and structure audit evidence', color: '#1d4ed8' },
  ],
  QA: [
    { id: 'qa-test-case-generator', name: 'Test Case Generator', icon: '🧪', description: 'Generate comprehensive test cases', color: '#059669' },
    { id: 'qa-bug-triage', name: 'Bug Triage', icon: '🐛', description: 'Classify and prioritise bugs automatically', color: '#059669' },
    { id: 'qa-regression-planner', name: 'Regression Planner', icon: '🔄', description: 'Plan regression suites for releases', color: '#059669' },
  ],
  PRODUCT: [
    { id: 'product-feedback-summariser', name: 'Feedback Summariser', icon: '💡', description: 'Surface themes from customer feedback', color: '#7c3aed' },
    { id: 'product-prd-assistant', name: 'PRD Assistant', icon: '📝', description: 'Write Product Requirements Documents', color: '#7c3aed' },
    { id: 'product-roadmap-analyst', name: 'Roadmap Analyst', icon: '🗺️', description: 'Inform roadmap decisions with data', color: '#7c3aed' },
  ],
  ENGINEERING: [
    { id: 'engineering-code-review', name: 'Code Review', icon: '💻', description: 'Review code for quality and security', color: '#0d9488' },
    { id: 'engineering-incident-response', name: 'Incident Response', icon: '🚒', description: 'Guide incident triage and resolution', color: '#0d9488' },
    { id: 'engineering-runbook', name: 'Runbook Generator', icon: '📖', description: 'Generate operational runbooks', color: '#0d9488' },
  ],
  FINANCE: [
    { id: 'finance-budget-analyst', name: 'Budget Analyst', icon: '💰', description: 'Analyse budgets and identify variances', color: '#ca8a04' },
    { id: 'finance-report-summariser', name: 'Report Summariser', icon: '📈', description: 'Summarise financial reports in plain language', color: '#ca8a04' },
    { id: 'cross-doc-summariser', name: 'Document Summariser', icon: '📄', description: 'Summarise long documents and reports', color: '#6366f1' },
  ],
  MARKETING: [
    { id: 'marketing-campaign-copywriter', name: 'Campaign Copywriter', icon: '✍️', description: 'Write compelling campaign copy — ads, emails, landing pages', color: '#e11d48' },
    { id: 'marketing-social-media', name: 'Social Media Manager', icon: '📱', description: 'Draft and optimise posts for LinkedIn, Twitter/X, and Instagram', color: '#e11d48' },
    { id: 'marketing-seo-optimizer', name: 'SEO Content Optimizer', icon: '🔍', description: 'Analyse and improve content for search engine rankings', color: '#e11d48' },
  ],
  DATA_ANALYTICS: [
    { id: 'data-quality-checker', name: 'Data Quality Checker', icon: '🔬', description: 'Detect nulls, duplicates, outliers, and schema drift in datasets', color: '#0284c7' },
    { id: 'data-sql-generator', name: 'SQL Query Generator', icon: '🗄️', description: 'Generate optimised SQL queries from plain English descriptions', color: '#0284c7' },
    { id: 'data-insights-summariser', name: 'Dashboard Insights', icon: '📈', description: 'Turn raw metrics into plain-language stakeholder summaries', color: '#0284c7' },
  ],
  INFRA_OPS: [
    { id: 'infra-incident-triage', name: 'Incident Triage Bot', icon: '🚨', description: 'Triage infrastructure incidents with severity and root cause analysis', color: '#374151' },
    { id: 'infra-capacity-planning', name: 'Capacity Planner', icon: '📊', description: 'Forecast compute, storage, and bandwidth capacity needs', color: '#374151' },
    { id: 'infra-change-analyzer', name: 'Change Request Analyser', icon: '🔄', description: 'Assess risk and blast radius of infrastructure changes', color: '#374151' },
  ],
  CUSTOMER_SUPPORT: [
    { id: 'support-ticket-classifier', name: 'Ticket Classifier', icon: '🏷️', description: 'Auto-classify tickets by type, priority, and route to the right team', color: '#0d9488' },
    { id: 'support-response-drafter', name: 'Response Drafter', icon: '💬', description: 'Draft empathetic, professional customer responses instantly', color: '#0d9488' },
    { id: 'support-whatsapp-bot', name: 'WhatsApp Support Bot', icon: '📲', description: 'Handle complaints, create tickets, and send case updates via WhatsApp', color: '#0d9488' },
    { id: 'chatbot-website-builder', name: 'Website Chatbot Builder', icon: '🤖', description: 'Build and deploy a branded AI chatbot on your website for 24/7 customer engagement', color: '#0d9488' },
    { id: 'support-sentiment', name: 'Sentiment Analyser', icon: '😊', description: 'Surface customer sentiment trends and churn risk signals', color: '#0d9488' },
  ],
}

const DEFAULT_SUGGESTIONS: SuggestedAgent[] = [
  { id: 'cross-meeting-summariser', name: 'Meeting Summariser', icon: '📋', description: 'Turn meeting notes into action items', color: '#6366f1' },
  { id: 'cross-doc-summariser', name: 'Document Summariser', icon: '📄', description: 'Summarise any document instantly', color: '#6366f1' },
  { id: 'cross-email-drafter', name: 'Email Drafter', icon: '✉️', description: 'Draft professional emails for any context', color: '#6366f1' },
  { id: 'data-insights-summariser', name: 'Dashboard Insights', icon: '📈', description: 'Turn raw metrics into plain-language summaries', color: '#0284c7' },
]

// ─── Example prompts per template ─────────────────────────────────────────────

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  'hr-onboarding':          ['What should I do on my first day?', 'How do I enrol for benefits?', 'Who should I meet in my first week?'],
  'hr-policy-qa':           ['How many days of annual leave do I get?', 'What is the work-from-home policy?', 'How do I apply for family responsibility leave?'],
  'legal-contract-review':  ['Review this vendor agreement for red flags', 'Check if this NDA is missing any standard clauses', 'Summarise liability exposure in this contract'],
  'risk-assessment':        ['Run a risk assessment on our new vendor', 'Assess the risk of migrating to cloud storage', 'Identify top 5 operational risks this quarter'],
  'qa-test-case-generator': ['Generate test cases for the login flow', 'Create edge case tests for the payment module', 'Write regression tests for the API endpoints'],
  'compliance-regulation-qa': ['What does GDPR say about data breach notifications?', 'How does POPIA affect our customer data storage?', 'What are the PCI-DSS requirements for our checkout?'],
}

const DEFAULT_PROMPTS = ['Summarise the latest data for me', 'What are the key action items?', 'Generate a status report']

// ─── Mock responses ────────────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<string, string> = {
  'hr-onboarding': `**Onboarding Summary for Acme Corporation**\n\nHere's what you need to know:\n\n**Day 1 Checklist:**\n• Report to Reception at 08:30 — ask for your hiring manager\n• Collect your access badge and laptop from IT (Floor 2)\n• Complete the digital onboarding form (link in your welcome email)\n• Attend the 10:00 New Employee Orientation in the Boardroom\n\n**First Week:**\n• Benefits enrollment deadline: 5 business days from start date\n• Schedule 1:1s with your team members\n• Complete mandatory compliance training (allow 2 hours)\n\nNeed anything else? I'm here to help!`,
  'hr-policy-qa': `**Policy Reference — Acme Corporation HR Handbook**\n\nBased on Section 4.2 of the HR Policy:\n\n• **Annual Leave**: 20 days per year (pro-rated for partial years), accruing monthly\n• **Sick Leave**: 30 days per year, no carry-over\n• **Family Responsibility Leave**: 3 days per year for qualifying events\n• **Work from Home**: Up to 2 days per week with manager approval; core hours 10:00–15:00\n\n*Note: Specific entitlements may vary by employment contract. Please check your offer letter or contact HR for personal leave balances.*`,
  'legal-contract-review': `**Contract Review Summary**\n\n✅ Standard clauses present: Confidentiality, IP Assignment, Governing Law\n\n⚠️ **3 Items Requiring Attention:**\n\n1. **Liability Cap** (Clause 8.2) — Currently uncapped. Recommend limiting to 12 months contract value.\n2. **Auto-Renewal** (Clause 14) — 90-day notice required to cancel. Calendar reminder recommended.\n3. **Data Processing** — No DPA referenced despite personal data being processed. GDPR/POPIA risk.\n\n🔴 **Recommend legal review before signing.** I'll flag this for the Legal team.`,
  'risk-assessment': `**Risk Assessment Report**\n\n**Overall Risk Rating: MEDIUM** ⚠️\n\n| Risk | Likelihood | Impact | Score | Status |\n|------|-----------|--------|-------|--------|\n| Data exposure | Medium | High | 12 | Mitigate |\n| Vendor dependency | Low | High | 9 | Monitor |\n| Regulatory non-compliance | Low | Critical | 15 | Escalate |\n\n**Top Recommended Controls:**\n1. Encrypt all data in transit and at rest\n2. Implement vendor exit strategy\n3. Complete POPIA assessment within 30 days\n\n*Risk Register has been generated. Recommend review in Risk Committee.*`,
  'qa-test-case-generator': `**Test Cases Generated — 12 Total**\n\n**Happy Path (4 tests)**\n• TC-001: Valid user logs in with correct credentials → Dashboard loads\n• TC-002: User navigates to profile → Profile data displayed correctly\n• TC-003: User submits valid form → Success confirmation shown\n• TC-004: Session expires → User redirected to login\n\n**Edge Cases (5 tests)**\n• TC-005: Login with email containing special characters\n• TC-006: Password at maximum length (128 chars)\n• TC-007: Concurrent sessions from 2 devices\n• TC-008: Login immediately after password reset\n• TC-009: Browser back button after logout\n\n**Negative Tests (3 tests)**\n• TC-010: Invalid email format → Error message shown\n• TC-011: Wrong password 5 times → Account locked\n• TC-012: SQL injection in email field → Rejected safely`,
  'compliance-regulation-qa': `**Regulatory Guidance — GDPR & POPIA**\n\nBased on your query, here's the relevant regulatory context:\n\n**GDPR (Article 33)**: Data breaches likely to result in risk to individuals must be reported to the supervisory authority within **72 hours** of discovery.\n\n**POPIA (Section 22)**: The Information Regulator must be notified "as soon as reasonably possible" after becoming aware of a breach. No fixed timeframe, but best practice aligns with GDPR's 72 hours.\n\n**Your Obligations:**\n1. Document the breach immediately (what, when, who affected)\n2. Assess risk to data subjects\n3. Notify the regulator if risk threshold met\n4. Notify affected individuals if high risk\n\n*Recommend involving the Compliance team and Legal for any actual breach response.*`,

  'marketing-campaign-copywriter': `**Campaign Copy — Generated**\n\n**Option A (Direct Response):**\n> "Stop juggling tools. Start shipping faster. Join 50,000+ teams who chose Acme Platform."\n\n**Option B (Problem/Solution):**\n> "Your pipeline is leaking revenue. Acme AI fixes it — automatically. Start free today."\n\n**Option C (Social Proof):**\n> "Teams at Deloitte, Standard Bank, and Nedbank run on Acme. Now it's your turn."\n\n*Recommendation: Option A has the highest CTR potential for paid search. Option C works best for LinkedIn.* \n\nWant me to write more variants or adapt for a specific channel?`,

  'marketing-social-media': `**LinkedIn Post — Draft Ready**\n\n---\n🚀 Exciting news from Acme Corporation!\n\nWe've just launched [Feature Name] — and early results are remarkable:\n\n✅ 40% reduction in manual processing time\n✅ 98% accuracy on automated workflows  \n✅ 60% faster onboarding for new team members\n\nThis didn't happen overnight. It took months of listening to our customers and building what actually matters.\n\nIf you're still doing [pain point] manually, let's talk. 👇\n\n#Innovation #AI #EnterpriseAI #FutureOfWork\n---\n\n*Estimated reach: 2,400 | Best posting time: Tuesday 08:00–09:00 SAST*\n\nWant Twitter/X and Instagram variants too?`,

  'data-quality-checker': `**Data Quality Report — Customer Dataset**\n\n**Overall Quality Score: 76/100** ⚠️\n\n| Issue | Count | Severity | Action |\n|-------|-------|----------|--------|\n| Null email addresses | 1,247 | HIGH | Remediate before campaign |\n| Duplicate customer IDs | 89 | HIGH | Deduplicate — keep most recent |\n| Invalid phone formats | 3,412 | MEDIUM | Standardise to E.164 format |\n| Missing postal codes | 8,903 | LOW | Enrich from address data |\n| Outlier transaction values | 12 | MEDIUM | Manual review recommended |\n\n**Recommended Actions (Priority Order):**\n1. Resolve duplicate IDs before any merge operations\n2. Remediate null emails before next email campaign\n3. Run phone standardisation script (estimated 2hrs)\n\n*Full remediation script available on request.*`,

  'data-sql-generator': `**SQL Query Generated**\n\n\`\`\`sql\n-- Top 10 customers by revenue (last 90 days)\nSELECT \n  c.customer_id,\n  c.company_name,\n  c.account_manager,\n  COUNT(o.order_id) AS order_count,\n  SUM(o.total_amount) AS total_revenue,\n  MAX(o.created_at) AS last_order_date,\n  RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS revenue_rank\nFROM customers c\nINNER JOIN orders o ON c.customer_id = o.customer_id\nWHERE \n  o.created_at >= CURRENT_DATE - INTERVAL '90 days'\n  AND o.status = 'completed'\nGROUP BY c.customer_id, c.company_name, c.account_manager\nORDER BY total_revenue DESC\nLIMIT 10;\n\`\`\`\n\n*Estimated execution time: ~120ms on indexed columns. Index on \`orders.created_at\` and \`orders.customer_id\` recommended for performance.*`,

  'infra-incident-triage': `**Incident Triage Report — P1 CRITICAL**\n\n**Severity: P1 — Customer-Impacting** 🔴\n**Estimated Affected Users: ~4,200**\n\n**Probable Root Cause:** Memory pressure on payment-service-pod-3 triggering OOMKill, causing cascading 503s on the payment gateway.\n\n**Immediate Actions (do in order):**\n1. ✅ \`kubectl rollout restart deployment/payment-service -n production\`\n2. ✅ Scale payment-service to 6 replicas: \`kubectl scale deployment/payment-service --replicas=6\`\n3. 🔄 Check Redis connection pool: \`redis-cli -h redis-prod info clients\`\n4. 📢 Post status update to status.acme.com (draft below)\n\n**Customer Status Update Draft:**\n> "We are investigating elevated error rates affecting payment processing. Our team is actively working on a fix. Updates every 15 minutes."\n\n**Escalation:** Page @on-call-infra and @payment-team-lead immediately.\n\n*Incident ID: INC-20240425-001 | Started: 14:32 UTC*`,

  'support-ticket-classifier': `**Ticket Classification Complete**\n\n| Field | Value |\n|-------|-------|\n| **Category** | Billing & Payments |\n| **Sub-category** | Charge Dispute |\n| **Priority** | HIGH |\n| **SLA** | 4-hour response required |\n| **Assigned Team** | Billing Support Tier 2 |\n| **Sentiment** | Frustrated 😤 |\n| **VIP Customer** | Yes — Enterprise plan, $48k ARR |\n\n**Suggested Response Time:** Within 1 hour (VIP flag active)\n\n**Context Notes:**\n- Customer has been with us 3 years — low churn risk if resolved quickly\n- Similar issue logged 2 months ago (Ticket #TK-8821) — resolved in 2hrs\n- Recommend waiving any fees as goodwill gesture given account value\n\n**Routing:** Escalated to Senior Billing Agent + Account Manager notified.`,

  'support-response-drafter': `**Draft Customer Response — Ready to Send**\n\n---\nSubject: Re: Issue with your recent charge\n\nHi [Customer Name],\n\nThank you for reaching out, and I sincerely apologise for the frustration this has caused. I completely understand how disruptive an unexpected charge can be.\n\nI've reviewed your account and can confirm that [specific issue]. Here's what I've done to resolve this:\n\n✅ **Refund processed:** R1,249.00 — expect to see this in 3–5 business days\n✅ **Root cause identified:** We've flagged this with our billing team to prevent recurrence\n✅ **Credit applied:** R200 account credit for the inconvenience\n\nIf you have any further questions, please don't hesitate to reply to this email. You'll have my direct attention.\n\nWarm regards,  \n[Agent Name]  \nSenior Customer Success | Acme Corporation\n---\n\n*Tone: Empathetic & Professional | Estimated read time: 45 seconds*`,

  'support-whatsapp-bot': `**WhatsApp Support Bot — Active** 📲\n\n**Channel:** WhatsApp Business (+27 11 000 0000)\n**Status:** 🟢 Live | **Today's interactions:** 147\n\n**Last 3 conversations handled:**\n\n**[09:14]** Thabo M. → *"My order hasn't arrived"*\n> 🤖 Checked order #ORD-8821 → Delayed at courier\n> Auto-reply sent: ETA updated to Thursday\n> Ticket #TK-9041 created ✅\n\n**[10:32]** Priya K. → *"I want to cancel my subscription"*\n> 🤖 Sentiment: Frustrated 😤 — escalated to retention team\n> Ticket #TK-9047 created + tagged HIGH PRIORITY\n> Human agent notified within 90 seconds ✅\n\n**[11:05]** Marcus J. → *"How do I reset my password?"*\n> 🤖 Resolved autonomously — sent password reset link\n> No ticket needed ✅\n\n**Bot Performance Today:**\n| Metric | Value |\n|--------|-------|\n| Auto-resolved | 89 (61%) |\n| Escalated to human | 31 (21%) |\n| Ticket created | 27 (18%) |\n| Avg first response | 8 seconds |\n\n*All conversations logged and available in your support dashboard.*`,

  'support-sentiment': `**Sentiment Analysis Report — This Week's Tickets**\n\n**Overall Sentiment Score: 62/100** 😐 (down from 71 last week)\n\n**Sentiment Breakdown:**\n- 😊 Positive: 34% (187 tickets)\n- 😐 Neutral: 28% (154 tickets)  \n- 😤 Negative: 38% (209 tickets) ⚠️ *up 12% week-over-week*\n\n**Top Frustration Themes:**\n1. 🔴 **Slow response times** — mentioned in 67 tickets\n2. 🟡 **Billing confusion** — 43 tickets\n3. 🟡 **Feature missing** — 38 tickets\n4. 🟢 **Onboarding complexity** — 29 tickets\n\n**⚠️ 12 At-Risk Accounts Identified (High Churn Probability):**\nFiltered by: negative sentiment + 3+ tickets in 14 days + enterprise plan\n\n*Recommend proactive outreach from Customer Success for the 12 flagged accounts.*\n\n[View Full Report →]`,

  'chatbot-website-builder': `**Website Chatbot — Deployment Ready** 🤖\n\n**Your chatbot has been configured with:**\n- ✅ Brand voice: Professional & Helpful\n- ✅ Knowledge base: 247 FAQ articles ingested\n- ✅ Lead capture: Name, email, company size\n- ✅ Handoff trigger: When confidence < 70%\n- ✅ Languages: English, Afrikaans\n\n**Suggested conversation starters:**\n> "How can I help you today?"\n> "Looking for pricing? I can guide you!"\n> "Want to book a demo with our team?"\n\n**Embed code generated:**\n\`\`\`html\n<script src="https://cdn.acme.ai/chatbot.js" data-bot-id="bot_xyz123"></script>\n\`\`\`\n\nEstimated deflection rate: **~68% of tickets** | Setup time: **10 minutes**\n\nShall I generate the full conversation flow or customise the brand colours?`,

  'chatbot-helpdesk-bot': `**Internal Helpdesk Bot — Ready for Deployment** 🛎️\n\n**Top queries this bot will handle automatically:**\n\n| Department | Query | Resolution Rate |\n|------------|-------|----------------|\n| IT | Password reset | 94% |\n| IT | VPN connection issues | 78% |\n| HR | Leave balance | 99% |\n| HR | Payroll query | 85% |\n| Finance | Expense policy | 91% |\n\n**Expected ticket deflection: 60-70%**\n\n**Integration status:**\n- 🟢 Active Directory: Connected\n- 🟢 HR System (SAP): Connected\n- 🟡 Service Desk (Jira): Pending config\n\n*Staff can access the bot via Microsoft Teams, Slack, or your intranet portal.*\n\nWant me to configure the escalation routing for unresolved queries?`,

  'chatbot-meeting-summarizer': `**Meeting Summary — Generated** 🎙️\n\n**Meeting:** Weekly Product Standup\n**Date:** ${new Date().toLocaleDateString()}\n**Duration:** 45 minutes | **Attendees:** 8\n\n**Key Decisions:**\n1. ✅ Moved payment retry feature to next sprint\n2. ✅ Approved design for new onboarding flow\n3. ✅ Escalated API latency issue to engineering lead\n\n**Action Items:**\n| Owner | Action | Due |\n|-------|--------|-----|\n| @sarah | Create Jira tickets for retry feature | Tomorrow |\n| @luca | Share design mockups with stakeholders | Friday |\n| @raj | Investigate p99 API latency spike | EOD |\n\n**Follow-up Email Draft:**\n> Hi team, thanks for today's standup. Here's a summary of what we agreed...\n\n*Full transcript available. Want me to send the follow-up email or create the Jira tickets?*`,

  'chatbot-lead-qualifier': `**Lead Qualification Complete** 🎯\n\n**Lead:** Marcus Johnson, VP Engineering @ TechCorp (500 employees)\n\n**BANT Score: 82/100** 🟢 High Priority\n\n| Dimension | Score | Detail |\n|-----------|-------|--------|\n| Budget | 90/100 | "We have budget approved for Q3" |\n| Authority | 85/100 | VP Engineering — likely decision maker |\n| Need | 95/100 | "Current tool doesn't scale past 50 users" |\n| Timeline | 65/100 | "Looking to implement in 6 months" |\n\n**Recommended Action:** Book enterprise demo with a Sales Engineer\n\n**Suggested talking points:**\n- Highlight multi-tenant architecture for team scalability\n- Showcase API integration capabilities\n- Share relevant case study (similar company size)\n\n*Calendar invite sent to marcus@techcorp.com for Thursday 2pm. CRM updated.*`,

  'hr-payroll-query': `**Payroll Query Response**\n\nHi James,\n\nI can see you're asking about your March payslip. Here's a breakdown:\n\n**Net Pay Difference: -R1,240**\n\n| Item | Amount | Change |\n|------|--------|--------|\n| Basic Salary | R45,000 | No change |\n| Medical Aid Contribution | -R3,200 | ⬆️ +R800 (annual increase) |\n| UIF | -R148.72 | Statutory |\n| PAYE | -R8,940 | ⬆️ +R440 (new tax bracket) |\n| **Net Pay** | **R32,711** | -R1,240 |\n\n**Key changes this month:**\n1. 🏥 Medical aid increased effective 1 March (annual review)\n2. 📊 You moved into a higher PAYE bracket after February bonus\n\nYour IRP5 will be available on the HR portal by 31 May.\n\n*For further payroll queries, you can also reach payroll@acme.com.*`,

  'it-helpdesk-triage': `**IT Helpdesk — Issue Triaged** 🖥️\n\n**Your Issue:** Cannot connect to VPN\n**Category:** Network / Remote Access\n**Priority:** Medium\n\n**Automated Resolution Steps (try in order):**\n\n1. **Check VPN client version**\n   → Required: GlobalProtect 6.2.x | Your version: 6.1.4\n   → [Download latest version →] (IT Portal)\n\n2. **Reset network adapter:**\n   \`\`\`\n   1. Open Command Prompt as Admin\n   2. Run: netsh winsock reset\n   3. Run: netsh int ip reset\n   4. Restart your computer\n   \`\`\`\n\n3. **Check firewall exceptions** — ensure GlobalProtect is allowed\n\n**Still not working?** A ticket has been raised automatically:\n📋 **Ticket #INC-4821** | Assigned to: Network Team | ETA: 2 hours\n\n*73% of VPN issues are resolved with Step 1. Try that first!*`,

  'it-access-request': `**Access Request — Processed** 🔑\n\n**Requester:** Sarah Johnson (HR Department)\n**System:** Analytics Dashboard (Tableau)\n**Access Level Requested:** Read-Only\n**Approved By:** Mike Chen (Department Head)\n\n**Access Control Review:**\n- ✅ Manager approval: Confirmed\n- ✅ Least privilege: Read-only is appropriate for role\n- ✅ Business justification: Monthly HR reporting requirement\n- ✅ No conflicting access: No SOD conflicts detected\n\n**Provisioning:**\nAccess will be granted within 30 minutes.\nWelcome email sent to sarah.johnson@acme.com\n\n**Access Expires:** 12 months (standard review cycle)\n\n**Audit Log:**\n\`INC-ACC-2891 | 2026-04-25 04:40 UTC | Granted by: IT Access Team\`\n\n*A quarterly access review will be conducted automatically.*`,

  'exec-board-report': `**Board Report — Q1 2026 Compiled** 📊\n\n**EXECUTIVE SUMMARY**\n\nAcme Corporation delivered strong Q1 results, exceeding revenue targets by 12% while maintaining disciplined cost management. Customer acquisition accelerated, supported by our platform expansion into Data & Analytics.\n\n---\n\n**FINANCIAL HIGHLIGHTS**\n| Metric | Q1 2026 | Q1 2025 | Change |\n|--------|---------|---------|--------|\n| Revenue | R124.3M | R98.7M | **+26%** |\n| Gross Margin | 68% | 64% | **+4pp** |\n| EBITDA | R22.1M | R14.8M | **+49%** |\n| Cash Position | R87.4M | R61.2M | **+43%** |\n\n**TOP RISKS FOR BOARD ATTENTION:**\n1. 🟡 Competitive pressure from 2 new market entrants\n2. 🟡 Key talent retention risk in Engineering\n3. 🔴 Regulatory review of AI governance practices (FSCA)\n\n**STRATEGIC PRIORITIES Q2:**\n- Complete Series B raise (target: R150M)\n- Launch Customer Support AI module\n- Expand into 3 new enterprise accounts\n\n*Full annexures and management accounts attached.*`,

  'exec-competitive-intel': `**Competitive Intelligence Digest — Week of Apr 21** 🔭\n\n**Competitor Activity Summary:**\n\n**🔴 HIGH PRIORITY: CompetitorA raised $45M Series C**\n> Likely to accelerate product development and increase sales headcount. Watch for aggressive enterprise pricing.\n\n**🟡 MEDIUM: CompetitorB launched "AI Autopilot" feature**\n> New feature targets our QA customer segment. Our equivalent (SentinelQA) has 3x more capabilities but needs better marketing positioning.\n\n**🟢 OPPORTUNITY: CompetitorC lost enterprise contract with Nedbank**\n> Source: LinkedIn post from ex-Nedbank CIO. Estimated R2.4M ARR opportunity. Recommend immediate outreach from our sales team.\n\n**Pricing Intelligence:**\nCompetitorA increased enterprise tier pricing by ~15% last week. We are now more competitive on price in the R50-R250k ARR segment.\n\n**Recommended Actions:**\n1. Alert sales team to Nedbank opportunity\n2. Schedule competitive positioning review for board pack\n3. Accelerate QA module marketing collateral\n\n*Monitoring 8 competitors across 340 data sources.*`,

  'eng-pr-reviewer': `**PR Code Review — Complete** 🔍\n\n**PR #847: Add payment retry logic with exponential backoff**\n**Author:** @luca-ferrari | **Files changed:** 12 | **Lines:** +347 / -89\n\n**Overall Assessment: APPROVE with suggestions** ✅\n\n**Issues Found:**\n\n🔴 **Critical (1):**\n- \`PaymentService.ts:L142\` — Retry count not capped. Could result in infinite loop if \`maxRetries\` config is missing.\n  → Fix: Add \`const maxRetries = config.maxRetries ?? 3\`\n\n🟡 **Medium (2):**\n- \`PaymentService.ts:L87\` — Magic number \`1000\` for base delay. Extract to constant.\n- \`RetryQueue.ts:L34\` — No unit test for jitter calculation.\n\n🟢 **Suggestions (3):**\n- Consider using \`p-retry\` library to reduce boilerplate\n- Add OpenTelemetry span for retry attempts\n- Document why exponential vs. linear backoff was chosen\n\n**Security:** No vulnerabilities detected ✅\n**Performance:** No regressions vs. baseline ✅\n**Test Coverage:** 84% (was 82%) ✅\n\n*Fix the critical issue before merging. Suggestions are non-blocking.*`,

  'risk-vendor-assessor': `**Vendor Risk Assessment — Complete** 🔎\n\n**Vendor:** CloudHost Solutions (Pty) Ltd\n**Assessment Type:** New Vendor Onboarding — Critical Tier\n\n**Overall Risk Rating: MEDIUM** 🟡\n\n| Dimension | Score | Rating |\n|-----------|-------|--------|\n| Financial Health | 72/100 | 🟢 Low Risk |\n| Cyber Security | 58/100 | 🟡 Medium Risk |\n| Operational Resilience | 65/100 | 🟡 Medium Risk |\n| Regulatory Compliance | 80/100 | 🟢 Low Risk |\n| Reputational | 85/100 | 🟢 Low Risk |\n\n**Key Findings:**\n1. 🟡 No SOC 2 Type II report available (only Type I)\n2. 🟡 Single data centre — limited geographic redundancy\n3. 🔴 No dedicated CISO — security managed by CTO\n4. ✅ ISO 27001 certified, POPIA compliant\n\n**Recommended Conditions for Onboarding:**\n- Require SOC 2 Type II within 12 months\n- Add geographic redundancy commitment to SLA\n- Annual security questionnaire review\n\n**Decision:** Approve with enhanced monitoring 📋`,

  'compliance-gdpr-monitor': `**GDPR / POPIA Compliance Review — Complete** 🛡️\n\n**System Reviewed:** Customer Analytics Platform\n**Review Date:** ${new Date().toLocaleDateString()}\n\n**Compliance Score: 74/100** 🟡 Action Required\n\n**Gaps Identified:**\n\n🔴 **Critical (2):**\n1. **Missing DPIA** — Profiling of customer behaviour requires a Data Protection Impact Assessment under POPIA Section 33.\n   → Action: Complete DPIA template (provided below)\n2. **Unlawful retention** — Customer data held for 7 years vs. mandated 5-year limit in your privacy notice.\n   → Action: Update retention policy and implement automated deletion\n\n🟡 **Medium (3):**\n3. Consent capture not recorded with timestamp\n4. Third-party sub-processors not listed in privacy notice\n5. No data localisation controls for EU customer data\n\n**Next Steps:**\n1. Schedule DPIA workshop with Privacy Officer\n2. Update privacy notice (draft available on request)\n3. Implement automated retention enforcement\n\n**Estimated remediation time:** 3-4 weeks`,

  'security-vuln-assessor': `**Vulnerability Assessment — Priority Report** 🔓\n\n**Scan Source:** Nessus Pro | **Scan Date:** ${new Date().toLocaleDateString()}\n**Scope:** Production environment (247 assets)\n\n**Summary:**\n| Severity | Count | 7-day Change |\n|----------|-------|-------------|\n| 🔴 Critical | 3 | +1 |\n| 🟠 High | 18 | -4 |\n| 🟡 Medium | 47 | +3 |\n| 🟢 Low | 124 | Stable |\n\n**Top 3 Critical — Immediate Action Required:**\n\n1. **CVE-2025-1234** — Apache Log4j RCE (CVSS 10.0)\n   - Affected: api-gateway-prod (3 instances)\n   - Fix: Upgrade to Log4j 2.21.0\n   - **Patch by: Today**\n\n2. **CVE-2025-5678** — OpenSSL Memory Corruption (CVSS 9.1)\n   - Affected: 12 Ubuntu servers\n   - Fix: apt upgrade openssl\n   - **Patch by: Tomorrow**\n\n3. **CVE-2025-9012** — Redis Unauthenticated RCE (CVSS 9.8)\n   - Affected: redis-cache-01 (exposed to internet)\n   - Fix: Add auth + firewall rule immediately\n   - **Patch by: Within 2 hours**\n\n*Remediation roadmap and patch scripts generated. Shall I create Jira tickets?*`,

  'infra-cost-optimizer': `**Cloud Cost Optimisation Report** 💰\n\n**Cloud Provider:** AWS | **Month:** April 2026\n**Current Monthly Spend:** R284,300\n**Identified Savings: R67,400/month (24%)** 🎉\n\n**Top Savings Opportunities:**\n\n| Resource | Current Cost | Recommended Action | Saving |\n|----------|-------------|-------------------|--------|\n| 14x oversized EC2 (m5.4xl→m5.2xl) | R42,000 | Right-size instances | R21,000 |\n| 8x idle RDS instances | R28,000 | Stop or terminate | R28,000 |\n| S3 intelligent tiering | R9,400 | Enable auto-tiering | R4,700 |\n| On-demand → Reserved (1yr) | R68,000 | Convert 20 instances | R13,700 |\n\n**Tag Hygiene Issues:**\n- 47 resources have no \`Environment\` tag\n- 23 resources have no \`Owner\` tag\n- Cost allocation reports are unreliable without fixes\n\n**Immediate Actions (this week):**\n1. Stop 8 idle RDS instances (R28k/month saving)\n2. Schedule right-sizing for 14 oversized EC2 instances\n\n*Terraform scripts for right-sizing available on request.*`,

  'qa-release-signoff': `**Release Readiness Report — v3.2.0** ✅\n\n**Release Date:** Tomorrow, 09:00 SAST\n**Assessment Date:** ${new Date().toLocaleDateString()}\n\n**Overall Status: CONDITIONAL GO** 🟡\n\n**Test Coverage:**\n| Suite | Passed | Failed | Skipped | Coverage |\n|-------|--------|--------|---------|----------|\n| Unit Tests | 2,847 | 2 | 18 | 94% |\n| Integration | 384 | 1 | 5 | 89% |\n| E2E (Playwright) | 247 | 0 | 12 | 91% |\n| Performance | ✅ | — | — | p99 < 200ms |\n| Security Scan | ✅ | — | — | 0 criticals |\n\n**Open Issues:**\n🔴 **2 failing unit tests** — payment retry module (non-blocking per Engineering)\n🟡 **1 integration failure** — Xero sync edge case (fix in v3.2.1)\n\n**Go/No-Go Recommendation:**\n> **CONDITIONAL GO** — Proceed if Engineering confirms the 2 failing unit tests are non-critical edge cases and a hotfix is ready to deploy within 2 hours if needed.\n\n**Sign-offs required:** QA Lead ✅ | Engineering Lead 🔄 | Product Owner 🔄\n\n*Deploy checklist and rollback procedure attached.*`,
}

const DEFAULT_MOCK_RESPONSE = `**Agent Response**\n\nI've processed your request and here are the key findings:\n\n• Analysis completed successfully across 3 data sources\n• 2 items identified requiring your attention\n• 1 recommendation has been automatically actioned (pending your approval)\n\n**Next Steps:**\n1. Review the flagged items in the report below\n2. Approve or reject the recommended action\n3. The agent will notify relevant stakeholders once confirmed\n\n*Full report available in the Logs section.*`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: string | null): string {
  if (!date) return 'Never'
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function formatRelativeDate(date: string): string {
  const ms = Date.now() - new Date(date).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30)  return `${days} days ago`
  return new Date(date).toLocaleDateString()
}

/** Render **bold** markdown-lite syntax */
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, li) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const nodes = parts.map((part, pi) =>
      pi % 2 === 1 ? <strong key={pi} className="text-text-primary font-semibold">{part}</strong> : part
    )
    return <p key={li} className={`${line.startsWith('•') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') ? 'ml-2' : ''} leading-relaxed min-h-[1em]`}>{nodes}</p>
  })
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function AgentSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-navy-800 shrink-0" />
        <div className="flex-1 pt-1">
          <div className="h-4 w-36 rounded bg-navy-800 mb-2" />
          <div className="h-3 w-20 rounded bg-navy-800" />
        </div>
        <div className="h-3 w-3 rounded-full bg-navy-800 mt-1" />
      </div>
      <div className="h-px bg-navy-800 mb-4" />
      <div className="flex gap-4 mb-4">
        <div className="h-3 w-20 rounded bg-navy-800" />
        <div className="h-3 w-24 rounded bg-navy-800" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-navy-800" />
        <div className="h-8 flex-1 rounded-lg bg-navy-800" />
        <div className="h-8 w-8 rounded-lg bg-navy-800" />
      </div>
    </div>
  )
}

// ─── Thinking dots ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-electric-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [user, setUser]               = useState<User | null>(null)
  const [agents, setAgents]           = useState<DeployedAgentInstance[]>([])
  const [loading, setLoading]         = useState(true)
  const [runningAgent, setRunningAgent] = useState<DeployedAgentInstance | null>(null)
  const [runInput, setRunInput]       = useState('')
  const [agentResponse, setAgentResponse] = useState<string | null>(null)
  const [isThinking, setIsThinking]   = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null)

  // ── Load agents from localStorage ──────────────────────────────────────────
  const loadAgents = useCallback((email: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) { setAgents([]); return }
      const all: DeployedAgentInstance[] = JSON.parse(raw)
      setAgents(all.filter(a => a.deployedBy === email))
    } catch {
      setAgents([])
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setUser(d.data.user)
          loadAgents(d.data.user.email)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loadAgents])

  // ── Actions ─────────────────────────────────────────────────────────────────

  function toggleStatus(instanceId: string) {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || !user) return
    const all: DeployedAgentInstance[] = JSON.parse(raw)
    const agent = all.find(a => a.instanceId === instanceId)
    if (agent) {
      agent.status = agent.status === 'active' ? 'paused' : 'active'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
      loadAgents(user.email)
    }
  }

  function removeAgent(instanceId: string) {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || !user) return
    const all = (JSON.parse(raw) as DeployedAgentInstance[]).filter(a => a.instanceId !== instanceId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    loadAgents(user.email)
    setRemoveConfirm(null)
  }

  function openRunModal(agent: DeployedAgentInstance) {
    setRunningAgent(agent)
    setRunInput('')
    setAgentResponse(null)
    setIsThinking(false)
  }

  function closeRunModal() {
    setRunningAgent(null)
    setRunInput('')
    setAgentResponse(null)
    setIsThinking(false)
  }

  async function runAgent() {
    if (!runningAgent || !user) return
    setIsThinking(true)
    setAgentResponse(null)

    const message = runInput.trim() || 'What can you help me with?'

    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agentId: runningAgent.instanceId,
          agentName: runningAgent.name,
          department: runningAgent.department,
          userMessage: message,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }

      // Increment run count on success
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const all: DeployedAgentInstance[] = JSON.parse(raw)
        const a = all.find(x => x.instanceId === runningAgent.instanceId)
        if (a) {
          a.runCount += 1
          a.lastRunAt = new Date().toISOString()
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
        }
        loadAgents(user.email)
      }

      setAgentResponse(data.response)
    } catch (error) {
      setAgentResponse(
        `**Error running agent**\n\n${(error as Error).message}\n\nIf this persists, ensure you are logged in and have the required permissions.`
      )
    } finally {
      setIsThinking(false)
    }
  }

  // ── Derived stats ───────────────────────────────────────────────────────────

  const totalRuns   = agents.reduce((s, a) => s + a.runCount, 0)
  const activeCount = agents.filter(a => a.status === 'active').length

  // Department info
  const dept         = user?.department?.toUpperCase() ?? null
  const deptIcon     = dept ? (DEPT_ICON[dept] ?? '🏢') : '🏢'
  const deptLabel    = dept ? `${deptIcon} ${dept.charAt(0) + dept.slice(1).toLowerCase()}` : 'Your Organisation'
  const suggestions  = dept ? (DEPARTMENT_SUGGESTIONS[dept] ?? DEFAULT_SUGGESTIONS) : DEFAULT_SUGGESTIONS

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 rounded-lg bg-navy-800 animate-pulse mb-2" />
            <div className="h-4 w-64 rounded bg-navy-800 animate-pulse" />
          </div>
          <div className="h-9 w-40 rounded-xl bg-navy-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="glass-card p-4 h-20 animate-pulse bg-navy-800/40" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0,1,2,3].map(i => <AgentSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (agents.length === 0) {
    return (
      <div className="space-y-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Agents</h1>
            <p className="text-text-secondary mt-1">Deployed AI agents for <span className="text-text-primary font-medium">{deptLabel}</span></p>
          </div>
          <Link href="/dashboard/marketplace" className="btn-primary flex items-center gap-2 text-sm">
            <span>+</span> Deploy New Agent
          </Link>
        </div>

        {/* Empty state hero */}
        <div className="flex flex-col items-center text-center py-12 px-6">
          {/* Glow grid of agent icons */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-3xl bg-electric-500/5 blur-3xl" />
            <div className="relative grid grid-cols-3 gap-4 p-6">
              {['👋', '⚖️', '🧪', '💡', '⚠️', '🔒'].map((icon, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-2xl"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    boxShadow: '0 0 20px rgba(59,130,246,0.1)',
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-3">No agents deployed yet</h2>
          <p className="text-text-secondary max-w-md leading-relaxed mb-8">
            Deploy your first AI agent in under 5 minutes. Choose from pre-built agents tailored for{' '}
            <span className="text-text-primary font-medium">{deptLabel}</span> or explore the full library.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/marketplace" className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
              Browse {dept ? `${dept.charAt(0) + dept.slice(1).toLowerCase()} ` : ''}Agents →
            </Link>
            <Link href="/dashboard/marketplace" className="btn-secondary px-6 py-3 text-sm">
              See All Agents
            </Link>
          </div>
        </div>

        {/* Suggested for you */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            ✨ Suggested for you
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map(s => (
              <div key={s.id} className="glass-card p-5 group hover:-translate-y-0.5 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${s.color}20` }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-primary text-sm leading-tight mb-1">{s.name}</h4>
                    <p className="text-xs text-text-muted leading-relaxed">{s.description}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/marketplace"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: `${s.color}20`, color: s.color }}
                >
                  Deploy →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Main view — agents list ──────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Agents</h1>
            <p className="text-text-secondary mt-1">
              Your deployed AI agents for <span className="text-text-primary font-medium">{deptLabel}</span>
            </p>
          </div>
          <Link href="/dashboard/marketplace" className="btn-primary flex items-center gap-2 text-sm">
            <span>+</span> Deploy New Agent
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Agents', value: agents.length, icon: '🤖', color: 'from-electric-500 to-violet-500' },
            { label: 'Active', value: activeCount, icon: '✅', color: 'from-emerald-500 to-teal-500' },
            { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: '🔄', color: 'from-cyan-500 to-electric-500' },
            { label: 'Avg Success Rate', value: '98%', icon: '📈', color: 'from-amber-500 to-orange-500' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 stat-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg shrink-0`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary leading-tight">{stat.value}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent, i) => {
            const isRemoving = removeConfirm === agent.instanceId
            const deptStyle  = DEPT_BADGE_STYLE[agent.department?.toUpperCase() ?? ''] ?? 'bg-navy-700/40 text-text-muted border border-border'

            return (
              <div
                key={agent.instanceId}
                className="glass-card p-5 animate-slide-up hover:border-electric-500/20 transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Card header */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${agent.color}25`, border: `1px solid ${agent.color}40` }}
                  >
                    {agent.icon}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary leading-tight mb-1.5">{agent.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Department badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${deptStyle}`}>
                        {DEPT_ICON[agent.department?.toUpperCase() ?? ''] ?? '🏢'} {agent.department}
                      </span>
                    </div>
                  </div>

                  {/* Status dot */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    {agent.status === 'active' ? (
                      <div className="relative">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                      </div>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block" />
                    )}
                    <span className={`text-[9px] font-medium ${agent.status === 'active' ? 'text-emerald-400' : 'text-text-muted'}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-4" />

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary">
                  <span>🔄 <strong className="text-text-primary">{agent.runCount}</strong> runs</span>
                  <span className="text-text-muted">·</span>
                  <span>🕐 Last run: <strong className="text-text-primary">{formatRelativeTime(agent.lastRunAt)}</strong></span>
                </div>
                <p className="text-[10px] text-text-muted mb-4">
                  Deployed {formatRelativeDate(agent.deployedAt)}
                </p>

                {/* Remove confirmation */}
                {isRemoving ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-3">
                    <p className="text-xs text-rose-400 mb-2.5 font-medium">Remove this agent? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeAgent(agent.instanceId)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                      >
                        Yes, Remove
                      </button>
                      <button
                        onClick={() => setRemoveConfirm(null)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 text-text-secondary hover:bg-navy-700 transition-colors border border-border"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="flex gap-2">
                    {/* Run */}
                    <button
                      onClick={() => openRunModal(agent)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-px"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                    >
                      ▶ Run
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={() => toggleStatus(agent.instanceId)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px border border-border bg-navy-800/60 hover:bg-navy-700 text-text-secondary"
                    >
                      {agent.status === 'active' ? '⏸ Pause' : '▶ Resume'}
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => setRemoveConfirm(agent.instanceId)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-sm border border-border bg-navy-800/60 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-text-muted transition-all"
                      title="Remove agent"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Run Modal ───────────────────────────────────────────────────────── */}
      {runningAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeRunModal() }}
        >
          <div
            className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            style={{ border: '1px solid rgba(59,130,246,0.25)' }}
          >
            {/* Modal header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: `${runningAgent.color}25`, border: `1px solid ${runningAgent.color}40` }}
                >
                  {runningAgent.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary text-lg">{runningAgent.name}</h3>
                  <p className="text-xs text-text-muted">Ask this agent anything</p>
                </div>
                <button
                  onClick={closeRunModal}
                  className="w-8 h-8 rounded-lg bg-navy-800 border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Example prompts */}
              {!agentResponse && !isThinking && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Try asking</p>
                  <div className="flex flex-wrap gap-2">
                    {(EXAMPLE_PROMPTS[runningAgent.templateId] ?? DEFAULT_PROMPTS).map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => setRunInput(prompt)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-electric-500/20 bg-electric-500/5 text-electric-400 hover:bg-electric-500/15 transition-colors text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text input */}
              {!agentResponse && !isThinking && (
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">
                    What would you like this agent to do?
                  </label>
                  <textarea
                    className="input-field text-sm min-h-[80px] resize-none leading-relaxed"
                    placeholder="Type your question or instruction..."
                    value={runInput}
                    onChange={e => setRunInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && runInput.trim()) runAgent() }}
                  />
                  <p className="text-[10px] text-text-muted mt-1">⌘↵ to run</p>
                </div>
              )}

              {/* Thinking animation */}
              {isThinking && (
                <div className="flex items-center gap-3 py-4">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${runningAgent.color}25` }}
                  >
                    {runningAgent.icon}
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Agent is thinking…</p>
                    <ThinkingDots />
                  </div>
                </div>
              )}

              {/* Agent response */}
              {agentResponse && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${runningAgent.color}25` }}
                    >
                      {runningAgent.icon}
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">✓ Response ready</span>
                  </div>
                  <div className="bg-navy-900/60 border border-border rounded-xl p-4 text-xs text-text-secondary space-y-1 max-h-72 overflow-y-auto">
                    {renderMarkdown(agentResponse)}
                  </div>
                  <button
                    onClick={() => { setAgentResponse(null); setRunInput('') }}
                    className="text-xs text-electric-400 hover:text-electric-300 transition-colors"
                  >
                    ← Ask something else
                  </button>
                </div>
              )}

              {/* Action buttons */}
              {!agentResponse && (
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeRunModal}
                    className="btn-secondary flex-1 py-2.5 text-sm"
                    disabled={isThinking}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runAgent}
                    disabled={isThinking}
                    className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isThinking ? 'Running…' : 'Run Agent →'}
                  </button>
                </div>
              )}

              {agentResponse && (
                <button
                  onClick={closeRunModal}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
