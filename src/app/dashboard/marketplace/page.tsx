'use client'

import { useState, useEffect, useCallback } from 'react'
import { MARKETS, STATUS_COLOR, STATUS_LABEL, getMarketsByRegion, type Market } from '@/lib/markets'
import {
  APP_REGISTRY,
  APP_TYPE_ICON,
  APP_TYPE_LABEL,
  INTEGRATION_LABEL,
  STATUS_COLOR as APP_STATUS_COLOR,
  STATUS_LABEL as APP_STATUS_LABEL,
  getCompatibleApps,
  type AppProperty,
} from '@/lib/apps'

// ═══ Types ═══

interface AgentTemplate {
  id: string
  name: string
  department: string
  icon: string
  color: string
  description: string
  capabilities: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedSetupMinutes: number
  tags: string[]
  featured: boolean
  crossFunctional: boolean
  requiresApproval: boolean
  exampleInputs: string[]
}

interface User {
  email: string
  department: string | null
  name: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

// ═══ Template Data ═══

const ALL_TEMPLATES: AgentTemplate[] = [
  // HR
  { id: 'hr-onboarding', name: 'Onboarding Guide', department: 'HR', icon: '👋', color: '#8b5cf6', description: 'Guides new employees through onboarding — policies, IT setup, benefits, and first-week FAQs.', capabilities: ['Answer policy questions', 'Benefits enrollment guidance', 'IT setup checklist', 'First-day FAQ handling', 'Welcome messaging'], difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['onboarding', 'new hire', 'policies'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['What do I need to do on my first day?', 'How do I enroll in medical aid?', 'Where do I find the IT request form?'] },
  { id: 'hr-policy-qa', name: 'Policy Q&A Bot', department: 'HR', icon: '📋', color: '#8b5cf6', description: 'Answers employee questions about leave, benefits, performance, and workplace conduct policies.', capabilities: ['Leave policy lookup', 'Benefits explanation', 'Conduct guidelines', 'Performance process Q&A', 'Policy document search'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['policy', 'leave', 'benefits'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['How many days annual leave do I get?', 'What is the work from home policy?', 'How does the performance review process work?'] },
  { id: 'hr-job-description', name: 'Job Description Writer', department: 'HR', icon: '✍️', color: '#8b5cf6', description: 'Generates professional, inclusive job descriptions from role requirements in minutes.', capabilities: ['Role overview generation', 'Inclusive language checks', 'Requirements structuring', 'Culture section writing', 'Multi-format export'], difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['recruiting', 'job descriptions', 'hiring'], featured: false, crossFunctional: false, requiresApproval: true, exampleInputs: ['Write a JD for a Senior Data Engineer', 'Create a job post for HR Business Partner', 'Draft a posting for Marketing Manager'] },
  { id: 'hr-leave-handler', name: 'Leave Request Handler', department: 'HR', icon: '📅', color: '#8b5cf6', description: 'Processes leave requests, checks balances, routes for approval, and sends confirmations.', capabilities: ['Leave balance checking', 'Request processing', 'Approval routing', 'Conflict detection', 'Confirmation notifications'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['leave', 'requests', 'approvals'], featured: false, crossFunctional: false, requiresApproval: true, exampleInputs: ['I need 3 days sick leave next week', 'Apply for annual leave 15-19 December', 'Check my leave balance'] },
  { id: 'hr-performance-review', name: 'Performance Review Assistant', department: 'HR', icon: '⭐', color: '#8b5cf6', description: 'Helps managers write structured, fair, and constructive performance reviews.', capabilities: ['Review template generation', 'Constructive feedback framing', 'Goal alignment checking', 'Competency assessment guidance', 'Development plan suggestions'], difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['performance', 'reviews', 'feedback'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Help me write a review for a high performer', 'Generate mid-year review template', 'How do I give constructive feedback?'] },

  // LEGAL
  { id: 'legal-contract-review', name: 'Contract Review Assistant', department: 'LEGAL', icon: '⚖️', color: '#0891b2', description: 'Reviews contracts and highlights risks, missing clauses, and unusual terms for legal scrutiny.', capabilities: ['Risk clause identification', 'Missing standard terms', 'Payment terms analysis', 'Liability review', 'Red flag alerts'], difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['contracts', 'risk', 'review'], featured: true, crossFunctional: false, requiresApproval: true, exampleInputs: ['Review this NDA', 'Check this vendor contract for risks', 'What are the risks in this SLA?'] },
  { id: 'legal-policy-qa', name: 'Legal Policy Q&A', department: 'LEGAL', icon: '🏛️', color: '#0891b2', description: 'Answers questions about GDPR, data protection, IP, confidentiality, and company legal policies.', capabilities: ['GDPR guidance', 'Data protection Q&A', 'IP policy clarification', 'Confidentiality guidelines', 'Regulatory Q&A'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['legal', 'GDPR', 'policy'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Can I share client data with a third party?', 'What does our NDA cover?', 'What is our data retention policy?'] },
  { id: 'legal-nda-classifier', name: 'NDA Classifier', department: 'LEGAL', icon: '🔏', color: '#0891b2', description: 'Classifies NDAs by type, jurisdiction, duration, and flags non-standard clauses.', capabilities: ['NDA type classification', 'Jurisdiction identification', 'Duration extraction', 'Non-standard clause flagging', 'Summary generation'], difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['NDA', 'contracts', 'classification'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Classify this NDA', 'Is this a mutual or one-way NDA?', 'What is unusual about this agreement?'] },
  { id: 'legal-compliance-checker', name: 'Legal Compliance Checker', department: 'LEGAL', icon: '✅', color: '#0891b2', description: 'Checks documents, processes, and decisions against legal requirements and company policy.', capabilities: ['Document compliance review', 'Process gap analysis', 'Regulatory alignment check', 'Remediation suggestions', 'Compliance report generation'], difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['compliance', 'legal', 'review'], featured: false, crossFunctional: false, requiresApproval: true, exampleInputs: ['Is this marketing campaign GDPR compliant?', 'Review this data processing agreement', 'Check if this process meets POPIA requirements'] },

  // RISK
  { id: 'risk-assessment', name: 'Risk Assessment Assistant', department: 'RISK', icon: '⚠️', color: '#dc2626', description: 'Guides through structured risk assessments using likelihood × impact framework, generates risk registers.', capabilities: ['Risk identification', 'Likelihood scoring', 'Impact analysis', 'Control mapping', 'Risk register generation'], difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['risk', 'assessment', 'governance'], featured: true, crossFunctional: false, requiresApproval: true, exampleInputs: ['Assess risk for new payment feature', 'Create risk register for cloud migration', 'What are the risks of this new vendor?'] },
  { id: 'risk-incident-reporter', name: 'Incident Reporter', department: 'RISK', icon: '🚨', color: '#dc2626', description: 'Captures, structures, and routes risk incidents with automatic severity classification.', capabilities: ['Incident capture', 'Severity classification', 'Routing & escalation', 'Impact assessment', 'Regulatory notification check'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['incidents', 'reporting', 'escalation'], featured: true, crossFunctional: false, requiresApproval: true, exampleInputs: ['Report a data breach incident', 'Log a near-miss in the warehouse', 'Record a compliance incident'] },
  { id: 'risk-vendor-screener', name: 'Vendor Risk Screener', department: 'RISK', icon: '🔍', color: '#dc2626', description: 'Screens new vendors for financial, operational, reputational, and cybersecurity risk.', capabilities: ['Financial stability check', 'Operational risk assessment', 'Reputational screening', 'Cyber risk assessment', 'Due diligence report'], difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['vendor', 'due diligence', 'risk'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Screen vendor Acme Solutions', 'Assess risk of using this SaaS provider', 'What is the risk profile of this supplier?'] },

  // SECURITY
  { id: 'security-phishing', name: 'Phishing Alert Explainer', department: 'SECURITY', icon: '🔒', color: '#b45309', description: 'Explains suspicious emails in plain language and guides staff through safe response steps.', capabilities: ['Email analysis', 'Threat level assessment', 'Plain-language explanation', 'Response guidance', 'Reporting assistance'], difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['phishing', 'security', 'email'], featured: true, crossFunctional: true, requiresApproval: false, exampleInputs: ['Is this email legit?', 'I got a strange email from IT support', 'Analyse this suspicious link'] },
  { id: 'security-policy-qa', name: 'Security Policy Q&A', department: 'SECURITY', icon: '🛡️', color: '#b45309', description: 'Answers questions about security policies, acceptable use, and security incident reporting.', capabilities: ['Password policy guidance', 'Acceptable use clarification', 'Incident reporting steps', 'Device policy Q&A', 'Security training guidance'], difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['security', 'policy', 'acceptable use'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['What is our password policy?', 'Can I use a personal device for work?', 'How do I report a security incident?'] },
  { id: 'security-access-review', name: 'Access Review Assistant', department: 'SECURITY', icon: '🔑', color: '#b45309', description: 'Assists with periodic access reviews, flags excessive permissions, and generates remediation plans.', capabilities: ['Access mapping', 'Excessive permissions flagging', 'Separation of duties check', 'Remediation planning', 'Review documentation'], difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['access', 'permissions', 'review'], featured: false, crossFunctional: false, requiresApproval: true, exampleInputs: ['Review access for departing employee John Smith', 'Check who has admin access to Salesforce', 'Generate access review checklist'] },

  // COMPLIANCE
  { id: 'compliance-regulation-qa', name: 'Regulation Q&A', department: 'COMPLIANCE', icon: '📊', color: '#1d4ed8', description: 'Answers questions about GDPR, POPIA, CCPA, SOX, PCI-DSS, and other applicable regulations.', capabilities: ['GDPR Q&A', 'POPIA guidance', 'PCI-DSS clarification', 'SOX requirements', 'Regulatory update summaries'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['compliance', 'regulation', 'GDPR'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['What does POPIA require for data subject requests?', 'When do we report a data breach under GDPR?', 'What are PCI-DSS requirements for card data?'] },
  { id: 'compliance-policy-checker', name: 'Policy Compliance Checker', department: 'COMPLIANCE', icon: '✔️', color: '#1d4ed8', description: 'Checks processes, documents, and decisions for compliance gaps and provides remediation guidance.', capabilities: ['Gap analysis', 'Control effectiveness review', 'Remediation suggestions', 'Compliance scoring', 'Evidence requirements'], difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['policy', 'compliance', 'gap analysis'], featured: true, crossFunctional: false, requiresApproval: true, exampleInputs: ['Is our data collection process GDPR compliant?', 'Check if this process meets SOC 2 requirements', 'Review marketing email for CAN-SPAM compliance'] },
  { id: 'compliance-audit-evidence', name: 'Audit Evidence Collector', department: 'COMPLIANCE', icon: '📁', color: '#1d4ed8', description: 'Helps collect, structure, and document evidence for compliance audits — SOC 2, ISO 27001, POPIA.', capabilities: ['Evidence checklist generation', 'Control documentation', 'Audit package structuring', 'Gap identification', 'Auditor Q&A preparation'], difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['audit', 'evidence', 'SOC2'], featured: false, crossFunctional: false, requiresApproval: true, exampleInputs: ['Prepare evidence for SOC 2 audit', 'What evidence do I need for ISO 27001?', 'Generate audit checklist for POPIA'] },

  // QA
  { id: 'qa-test-case-generator', name: 'Test Case Generator', department: 'QA', icon: '🧪', color: '#059669', description: 'Generates comprehensive test cases from user stories, requirements, or feature descriptions.', capabilities: ['Happy path generation', 'Edge case identification', 'Negative test cases', 'Boundary condition tests', 'Accessibility test cases'], difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['testing', 'test cases', 'QA'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Generate test cases for login feature', 'Create test cases for payment flow', 'Write edge case tests for user registration'] },
  { id: 'qa-bug-triage', name: 'Bug Triage Assistant', department: 'QA', icon: '🐛', color: '#059669', description: 'Classifies bugs by severity, assigns priority, suggests assignees, and identifies potential duplicates.', capabilities: ['Severity classification', 'Priority assignment', 'Duplicate detection', 'Assignee suggestion', 'Reproduction steps refinement'], difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['bugs', 'triage', 'defects'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Triage: users cannot log in on mobile', 'Classify severity of this payment error', 'Is this bug a duplicate of #1234?'] },
  { id: 'qa-regression-planner', name: 'Regression Test Planner', department: 'QA', icon: '🔄', color: '#059669', description: 'Plans regression test suites for releases based on changed components and risk areas.', capabilities: ['Impact analysis', 'Test suite scoping', 'Risk-based prioritisation', 'Smoke test generation', 'Coverage mapping'], difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['regression', 'release', 'planning'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Plan regression tests for v2.3 release', 'What should we test after the auth service update?', 'Create smoke test checklist for deployment'] },

  // PRODUCT
  { id: 'product-feedback-summariser', name: 'Customer Feedback Summariser', department: 'PRODUCT', icon: '💡', color: '#7c3aed', description: 'Analyses customer feedback, reviews, and support tickets to surface key themes and actionable insights.', capabilities: ['Theme identification', 'Sentiment analysis', 'Feature request ranking', 'Pain point surfacing', 'Executive summary generation'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['feedback', 'customer insights', 'analytics'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Summarise last month customer feedback', 'What are top complaints about checkout?', 'Analyse NPS survey responses'] },
  { id: 'product-prd-assistant', name: 'PRD Writing Assistant', department: 'PRODUCT', icon: '📝', color: '#7c3aed', description: 'Helps write structured Product Requirements Documents with all standard sections.', capabilities: ['PRD template generation', 'User story writing', 'Acceptance criteria definition', 'Edge case identification', 'Stakeholder review prep'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['PRD', 'requirements', 'product'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Help me write a PRD for dark mode', 'Draft requirements for SSO feature', 'Create PRD template for API integrations'] },
  { id: 'product-roadmap-analyst', name: 'Roadmap Analyst', department: 'PRODUCT', icon: '🗺️', color: '#7c3aed', description: 'Analyses feature requests and priorities to inform data-driven roadmap decisions.', capabilities: ['Feature request scoring', 'Effort vs impact analysis', 'Competitor gap analysis', 'Prioritisation frameworks', 'Roadmap narrative generation'], difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['roadmap', 'prioritisation', 'strategy'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Which features should we prioritise for Q3?', 'Analyse competitor features we are missing', 'Rank these feature requests by impact'] },

  // ENGINEERING
  { id: 'engineering-code-review', name: 'Code Review Assistant', department: 'ENGINEERING', icon: '💻', color: '#0d9488', description: 'Reviews code for quality, security vulnerabilities, performance, and best practices.', capabilities: ['Security vulnerability detection', 'Performance bottleneck identification', 'Code quality scoring', 'Best practice suggestions', 'Documentation review'], difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['code review', 'security', 'quality'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Review this Python function', 'Check this SQL query for SQL injection', 'Review this React component for performance'] },
  { id: 'engineering-incident-response', name: 'Incident Response Assistant', department: 'ENGINEERING', icon: '🚒', color: '#0d9488', description: 'Guides teams through incident triage, communication, and resolution with structured runbooks.', capabilities: ['Incident severity triage', 'Communication templates', 'Escalation guidance', 'Resolution tracking', 'Post-mortem generation'], difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['incidents', 'on-call', 'SRE'], featured: true, crossFunctional: false, requiresApproval: true, exampleInputs: ['Production is down, help me triage', 'Guide incident response for DB failure', 'Create incident report for yesterday outage'] },
  { id: 'engineering-runbook', name: 'Runbook Generator', department: 'ENGINEERING', icon: '📖', color: '#0d9488', description: 'Generates operational runbooks from system descriptions, making on-call easier.', capabilities: ['Runbook template generation', 'Step-by-step procedure writing', 'Decision tree creation', 'Contact escalation paths', 'Rollback procedures'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['runbooks', 'operations', 'documentation'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Create runbook for database failover', 'Write deployment runbook for microservice', 'Generate on-call runbook for payment service'] },

  // FINANCE
  { id: 'finance-budget-analyst', name: 'Budget Analyst', department: 'FINANCE', icon: '💰', color: '#ca8a04', description: 'Analyses budget data, identifies variances, and provides insights for financial decisions.', capabilities: ['Budget vs actuals analysis', 'Variance explanation', 'Cost driver identification', 'Trend analysis', 'Executive summary generation'], difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['budget', 'finance', 'analysis'], featured: true, crossFunctional: false, requiresApproval: false, exampleInputs: ['Analyse Q3 budget vs actuals', 'What are our top cost drivers?', 'Identify budget overruns by department'] },
  { id: 'finance-report-summariser', name: 'Financial Report Summariser', department: 'FINANCE', icon: '📈', color: '#ca8a04', description: 'Summarises financial reports in plain language for non-finance stakeholders.', capabilities: ['Plain-language translation', 'Key metric extraction', 'Trend commentary', 'Risk highlights', 'Executive summary writing'], difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['reporting', 'finance', 'summaries'], featured: false, crossFunctional: false, requiresApproval: false, exampleInputs: ['Summarise this quarterly financial report', 'Explain this P&L to non-finance team', 'Create executive summary of annual report'] },

  // CROSS_FUNCTIONAL
  { id: 'cross-meeting-summariser', name: 'Meeting Notes Summariser', department: 'CROSS_FUNCTIONAL', icon: '📋', color: '#6366f1', description: 'Summarises meeting transcripts and notes into action items, decisions, and key points.', capabilities: ['Action item extraction', 'Decision documentation', 'Key point summary', 'Owner assignment', 'Follow-up tracking'], difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['meetings', 'notes', 'productivity'], featured: true, crossFunctional: true, requiresApproval: false, exampleInputs: ['Summarise these meeting notes', 'Extract action items from this transcript', 'Create meeting minutes from this recording'] },
  { id: 'cross-doc-summariser', name: 'Document Summariser', department: 'CROSS_FUNCTIONAL', icon: '📄', color: '#6366f1', description: 'Summarises long documents into concise, structured summaries — reports, whitepapers, policies.', capabilities: ['Executive summary generation', 'Key section extraction', 'Structured formatting', 'Multi-document comparison', 'Reading time estimate'], difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['documents', 'summarisation', 'productivity'], featured: true, crossFunctional: true, requiresApproval: false, exampleInputs: ['Summarise this 40-page report', 'Create executive summary of this whitepaper', 'Condense this policy document'] },
  { id: 'cross-email-drafter', name: 'Professional Email Drafter', department: 'CROSS_FUNCTIONAL', icon: '✉️', color: '#6366f1', description: 'Drafts professional emails for any business context — follow-ups, declines, announcements, escalations.', capabilities: ['Tone adjustment', 'Multi-context templates', 'Subject line generation', 'Follow-up sequences', 'Escalation framing'], difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['email', 'communication', 'productivity'], featured: false, crossFunctional: true, requiresApproval: false, exampleInputs: ['Draft a follow-up email to client', 'Write a decline email for vendor proposal', 'Draft announcement for system maintenance'] },

  // ─── MARKETING ───────────────────────────────────────────────────────
  { id: 'marketing-campaign-copywriter', name: 'Campaign Copywriter', department: 'MARKETING', icon: '✍️', color: '#e11d48',
    description: 'Writes compelling campaign copy for ads, landing pages, email campaigns, and social posts tailored to your brand voice.',
    capabilities: ['Ad copy generation', 'Landing page headlines', 'Email subject lines', 'Social media captions', 'A/B variant creation'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['copywriting', 'campaigns', 'content'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Write Google ad copy for our new product launch', 'Create 3 email subject line variants for our sale campaign', 'Write a landing page headline for our enterprise plan'] },

  { id: 'marketing-social-media', name: 'Social Media Manager', department: 'MARKETING', icon: '📱', color: '#e11d48',
    description: 'Drafts and schedules social media posts across LinkedIn, Twitter/X, and Instagram — consistent tone, relevant hashtags.',
    capabilities: ['Platform-specific post writing', 'Hashtag research', 'Posting schedule suggestions', 'Engagement copy', 'Brand voice consistency'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['social media', 'content', 'brand'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Write a LinkedIn post about our new feature', 'Create a Twitter thread on industry trends', 'Draft an Instagram caption for our team event'] },

  { id: 'marketing-seo-optimizer', name: 'SEO Content Optimizer', department: 'MARKETING', icon: '🔍', color: '#e11d48',
    description: 'Analyses content for SEO gaps, suggests keyword improvements, and rewrites meta descriptions and titles.',
    capabilities: ['Keyword gap analysis', 'Meta description writing', 'Title tag optimization', 'Content structure review', 'Internal linking suggestions'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['SEO', 'content', 'search'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Optimise this blog post for SEO', 'Write meta description for our pricing page', 'Suggest keywords for our product category'] },

  { id: 'marketing-email-analyzer', name: 'Email Campaign Analyzer', department: 'MARKETING', icon: '📧', color: '#e11d48',
    description: 'Analyses email campaign performance, identifies improvement opportunities, and suggests content optimisations.',
    capabilities: ['Subject line analysis', 'Open rate recommendations', 'Content effectiveness review', 'CTA optimisation', 'Segment suggestions'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['email', 'analytics', 'campaigns'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Why is our email open rate dropping?', 'Analyse this email campaign for improvements', 'Suggest better CTAs for our nurture sequence'] },

  { id: 'marketing-brand-voice', name: 'Brand Voice Checker', department: 'MARKETING', icon: '🎨', color: '#e11d48',
    description: 'Reviews content for brand voice consistency and rewrites off-brand copy to match your tone guidelines.',
    capabilities: ['Brand voice analysis', 'Tone consistency checking', 'Rewrite suggestions', 'Style guide enforcement', 'Terminology consistency'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['brand', 'tone of voice', 'content'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Check if this copy matches our brand voice', 'Rewrite this email to be more conversational', 'Is this press release on-brand?'] },

  // ─── DATA & ANALYTICS ─────────────────────────────────────────────────
  { id: 'data-quality-checker', name: 'Data Quality Checker', department: 'DATA_ANALYTICS', icon: '🔬', color: '#0284c7',
    description: 'Analyses datasets for quality issues — nulls, duplicates, outliers, schema drift — and generates remediation reports.',
    capabilities: ['Null value detection', 'Duplicate record identification', 'Outlier analysis', 'Schema drift detection', 'Quality score generation'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['data quality', 'analytics', 'validation'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Check quality of our customer dataset', 'Find duplicates in this transaction table', 'Assess data completeness for our reporting database'] },

  { id: 'data-sql-generator', name: 'SQL Query Generator', department: 'DATA_ANALYTICS', icon: '🗄️', color: '#0284c7',
    description: 'Generates optimised SQL queries from plain English descriptions — SELECT, JOINs, aggregations, window functions.',
    capabilities: ['Plain English to SQL', 'Query optimisation', 'JOIN logic generation', 'Aggregation queries', 'Window function creation'],
    difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['SQL', 'queries', 'database'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Write SQL to find top 10 customers by revenue', 'Generate a query for monthly sales by region', "Create a query to find customers who haven't ordered in 90 days"] },

  { id: 'data-insights-summariser', name: 'Dashboard Insights Summariser', department: 'DATA_ANALYTICS', icon: '📈', color: '#0284c7',
    description: 'Turns raw dashboard data and metrics into plain-language narrative summaries for stakeholders.',
    capabilities: ['Metric narrative generation', 'Trend interpretation', 'Anomaly highlighting', 'Executive summary writing', 'Comparison context'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['reporting', 'insights', 'summaries'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ["Summarise this week's KPI dashboard", 'Write a narrative for our monthly analytics report', 'Explain this data trend to a non-technical audience'] },

  { id: 'data-anomaly-detector', name: 'Anomaly Detector', department: 'DATA_ANALYTICS', icon: '⚡', color: '#0284c7',
    description: 'Monitors metrics for anomalies and unexpected patterns, generates alerts with context and probable causes.',
    capabilities: ['Statistical anomaly detection', 'Trend deviation alerts', 'Root cause hypotheses', 'Severity classification', 'Alert narrative generation'],
    difficulty: 'advanced', estimatedSetupMinutes: 15, tags: ['anomaly detection', 'monitoring', 'alerts'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ["Are there anomalies in today's sales data?", 'Detect unusual patterns in our API call volume', 'Why did our conversion rate drop yesterday?'] },

  { id: 'data-report-narrator', name: 'Report Narrator', department: 'DATA_ANALYTICS', icon: '📝', color: '#0284c7',
    description: 'Converts data tables and charts into compelling written reports suitable for board-level and stakeholder presentations.',
    capabilities: ['Data-to-narrative conversion', 'Board report writing', 'Key finding extraction', 'Visualisation recommendations', 'Executive language'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['reporting', 'board', 'narrative'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Write a board report from this data', 'Narrate our quarterly results for the exec team', 'Convert this spreadsheet into a readable report'] },

  // ─── INFRASTRUCTURE & OPS ──────────────────────────────────────────────
  { id: 'infra-incident-triage', name: 'Incident Triage Bot', department: 'INFRA_OPS', icon: '🚨', color: '#374151',
    description: 'Triages infrastructure incidents by severity, identifies probable root causes, and suggests immediate response actions.',
    capabilities: ['Severity classification', 'Root cause hypothesis', 'Immediate action checklist', 'Escalation routing', 'Status page drafting'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['incidents', 'triage', 'SRE'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Our payment service is returning 503s', 'Database CPU is at 95% — what do I do?', 'Triage this PagerDuty alert: high memory on prod cluster'] },

  { id: 'infra-capacity-planning', name: 'Capacity Planning Assistant', department: 'INFRA_OPS', icon: '📊', color: '#374151',
    description: 'Analyses resource usage trends and forecasts capacity needs — compute, storage, bandwidth, and licensing.',
    capabilities: ['Usage trend analysis', 'Growth forecasting', 'Resource bottleneck identification', 'Cost projection', 'Scaling recommendations'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['capacity', 'planning', 'infrastructure'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Forecast our compute needs for Q4', 'When will our storage run out at current growth?', 'What infrastructure do we need for 2x user growth?'] },

  { id: 'infra-change-analyzer', name: 'Change Request Analyser', department: 'INFRA_OPS', icon: '🔄', color: '#374151',
    description: 'Analyses change requests for risk, blast radius, rollback complexity, and recommended approval tier.',
    capabilities: ['Change risk scoring', 'Blast radius assessment', 'Rollback plan review', 'Approval tier recommendation', 'Change window suggestion'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['change management', 'risk', 'ITIL'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Review this database schema change', 'Assess risk of upgrading our Kubernetes cluster', 'Analyse this network configuration change'] },

  { id: 'infra-sla-monitor', name: 'SLA Compliance Monitor', department: 'INFRA_OPS', icon: '⏱️', color: '#374151',
    description: 'Monitors SLA compliance across services, calculates error budgets, and generates breach risk alerts.',
    capabilities: ['SLA compliance calculation', 'Error budget tracking', 'Breach risk alerting', 'Service performance summary', 'Customer impact assessment'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['SLA', 'monitoring', 'reliability'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What is our SLA compliance this month?', 'How much error budget do we have left?', 'Which services are at risk of breaching SLA?'] },

  { id: 'infra-runbook-generator', name: 'Runbook Generator', department: 'INFRA_OPS', icon: '📖', color: '#374151',
    description: 'Generates step-by-step operational runbooks for infrastructure procedures, failovers, and on-call scenarios.',
    capabilities: ['Step-by-step procedure writing', 'Failover documentation', 'On-call guide generation', 'Decision tree creation', 'Contact escalation mapping'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['runbooks', 'documentation', 'operations'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Create runbook for Postgres failover', 'Write on-call runbook for API gateway issues', 'Generate disaster recovery checklist for our cloud environment'] },

  // ─── CUSTOMER SUPPORT ─────────────────────────────────────────────────
  { id: 'support-ticket-classifier', name: 'Ticket Classifier', department: 'CUSTOMER_SUPPORT', icon: '🏷️', color: '#0d9488',
    description: 'Automatically classifies incoming support tickets by type, priority, product area, and suggested team assignment.',
    capabilities: ['Category classification', 'Priority scoring', 'Product area tagging', 'Team routing', 'SLA flag assignment'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['tickets', 'classification', 'routing'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Classify this ticket: "Cannot log into my account"', 'What priority is this billing complaint?', 'Route this feature request to the right team'] },

  { id: 'support-response-drafter', name: 'Response Drafter', department: 'CUSTOMER_SUPPORT', icon: '💬', color: '#0d9488',
    description: 'Drafts professional, empathetic customer responses for common support scenarios — billing, technical, and general enquiries.',
    capabilities: ['Empathetic response writing', 'Technical explanation simplification', 'Apology and resolution framing', 'Multi-language support', 'Tone adjustment'],
    difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['responses', 'customer service', 'communication'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Draft a response to this billing dispute', 'Write a reply to an angry customer about downtime', 'Respond to a feature request politely declining it'] },

  { id: 'support-escalation', name: 'Escalation Assistant', department: 'CUSTOMER_SUPPORT', icon: '📞', color: '#0d9488',
    description: 'Identifies tickets requiring escalation, prepares context summaries, and routes to the right team with full history.',
    capabilities: ['Escalation trigger detection', 'Context summary generation', 'VIP customer flagging', 'Escalation path routing', 'Internal handoff notes'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['escalation', 'routing', 'VIP'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Should I escalate this ticket?', 'Prepare escalation notes for this enterprise customer', "Identify VIP customers in today's ticket queue"] },

  { id: 'support-kb-search', name: 'Knowledge Base Search', department: 'CUSTOMER_SUPPORT', icon: '🔍', color: '#0d9488',
    description: 'Searches the knowledge base and internal documentation to find answers to customer questions instantly.',
    capabilities: ['Knowledge base search', 'Answer synthesis', 'Related article suggestions', 'Gap identification', 'Article draft generation'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['knowledge base', 'search', 'FAQ'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Find KB article about password reset', 'What does our KB say about refund policy?', 'Is there documentation on how to set up SSO?'] },

  { id: 'support-sentiment', name: 'Customer Sentiment Analyser', department: 'CUSTOMER_SUPPORT', icon: '😊', color: '#0d9488',
    description: 'Analyses customer sentiment across tickets, chats, and reviews — surfaces trends, at-risk customers, and CSAT insights.',
    capabilities: ['Sentiment scoring', 'Churn risk identification', 'CSAT trend analysis', 'Emotion detection', 'Theme clustering'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['sentiment', 'CSAT', 'analytics'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ["Analyse sentiment in this week's tickets", 'Which customers are at churn risk?', 'What are customers most frustrated about?'] },

  // ─── CHATBOT & VOICE ──────────────────────────────────────────────────
  { id: 'chatbot-website-builder', name: 'Website Chatbot Builder', department: 'CUSTOMER_SUPPORT', icon: '🤖', color: '#7c3aed',
    description: 'Build and deploy a branded AI chatbot on your website — handles FAQs, lead capture, and product queries 24/7.',
    capabilities: ['FAQ automation', 'Lead capture forms', 'Product query handling', 'Handoff to human agent', 'Multi-language support'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['chatbot', 'website', 'lead capture'], featured: true, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Build a chatbot for our SaaS product website', 'Create a lead qualification bot for our pricing page', 'Set up a chatbot that handles "how do I reset my password?" questions'] },

  { id: 'chatbot-helpdesk-bot', name: 'Internal Helpdesk Bot', department: 'CUSTOMER_SUPPORT', icon: '🛎️', color: '#7c3aed',
    description: 'Self-service AI assistant for internal staff — answers IT, HR, and Finance queries instantly without raising tickets.',
    capabilities: ['IT self-service', 'HR policy Q&A', 'Finance query handling', 'Ticket deflection', 'Escalation routing'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['helpdesk', 'internal', 'self-service'], featured: true, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['What is our parental leave policy?', 'How do I request a new laptop?', 'What is the expense submission deadline?'] },

  { id: 'chatbot-whatsapp-bot', name: 'WhatsApp Business Bot', department: 'CUSTOMER_SUPPORT', icon: '💬', color: '#7c3aed',
    description: 'Deploys an AI agent on WhatsApp Business — handles customer queries, order status, and appointment booking.',
    capabilities: ['WhatsApp Business API integration', 'Order status queries', 'Appointment booking', 'Product recommendations', 'Human handoff'],
    difficulty: 'advanced', estimatedSetupMinutes: 20, tags: ['WhatsApp', 'messaging', 'customer service'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Set up WhatsApp bot to handle order tracking', 'Build WhatsApp agent for appointment booking', 'Create WhatsApp FAQ bot for our product'] },

  { id: 'chatbot-voice-ivr', name: 'Voice IVR Designer', department: 'CUSTOMER_SUPPORT', icon: '📞', color: '#7c3aed',
    description: 'Designs natural language IVR call flows — replace DTMF press-1/press-2 menus with intelligent voice understanding.',
    capabilities: ['Call flow design', 'Intent recognition', 'Natural language understanding', 'Call routing logic', 'Fallback handling'],
    difficulty: 'advanced', estimatedSetupMinutes: 25, tags: ['IVR', 'voice', 'telephony'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Design IVR for our customer support line', 'Build voice flow for appointment confirmation calls', 'Create natural language IVR that replaces press-1-for-sales menus'] },

  { id: 'chatbot-meeting-summarizer', name: 'Meeting Voice Summarizer', department: 'CUSTOMER_SUPPORT', icon: '🎙️', color: '#7c3aed',
    description: 'Transcribes and summarises voice meetings — generates action items, decisions, and follow-up emails automatically.',
    capabilities: ['Meeting transcription', 'Action item extraction', 'Decision logging', 'Follow-up email drafting', 'Speaker identification'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['meetings', 'transcription', 'summaries'], featured: true, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Summarise our weekly standup meeting', 'Extract action items from this board meeting transcript', "Generate follow-up email from today's client call"] },

  { id: 'chatbot-lead-qualifier', name: 'Lead Qualification Bot', department: 'CUSTOMER_SUPPORT', icon: '🎯', color: '#7c3aed',
    description: 'Qualifies inbound website leads via conversational AI — scores by budget, authority, need, and timeline before routing.',
    capabilities: ['BANT qualification', 'Lead scoring', 'CRM routing', 'Meeting booking', 'Disqualification handling'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['leads', 'sales', 'qualification'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Qualify leads from our enterprise pricing page', 'Build lead bot that books demos for qualified prospects', 'Score inbound leads by company size and budget'] },

  { id: 'chatbot-faq-builder', name: 'Conversational FAQ Builder', department: 'CUSTOMER_SUPPORT', icon: '❓', color: '#7c3aed',
    description: 'Builds an AI-powered FAQ chatbot from your documentation, knowledge base, or uploaded PDFs — instant answers, zero dev work.',
    capabilities: ['Document ingestion', 'Semantic search answers', 'Confidence scoring', 'Escalation for unknowns', 'Continuous learning from feedback'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['FAQ', 'knowledge base', 'documents'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Build FAQ bot from our product documentation PDF', 'Create a bot that answers questions from our knowledge base', 'Set up FAQ agent for our onboarding guide'] },

  { id: 'chatbot-sentiment-bot', name: 'Sentiment-Aware Support Bot', department: 'CUSTOMER_SUPPORT', icon: '😊', color: '#7c3aed',
    description: 'Handles customer chat with emotional intelligence — detects frustration, urgency, or delight and adapts its tone and escalation path.',
    capabilities: ['Real-time sentiment detection', 'Tone adaptation', 'Urgency escalation', 'Empathy-first scripting', 'VIP detection'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['sentiment', 'empathy', 'support bot'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Deploy an emotionally intelligent support chatbot', 'Build a bot that escalates when customers are frustrated', 'Create support bot that detects VIP customers and changes tone'] },

  // ─── HR EXPANDED ─────────────────────────────────────────────────────
  { id: 'hr-interview-scheduler', name: 'Interview Scheduling Agent', department: 'HR', icon: '📅', color: '#8b5cf6',
    description: 'Coordinates interview scheduling across candidates and hiring managers — checks calendars, sends invites, and handles rescheduling.',
    capabilities: ['Calendar integration', 'Candidate communication', 'Panel coordination', 'Reminder sending', 'Reschedule handling'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['recruiting', 'scheduling', 'interviews'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Schedule interviews for 5 candidates this week', 'Coordinate panel interview with 3 interviewers', 'Send interview confirmation and prep email to candidate'] },

  { id: 'hr-payroll-query', name: 'Payroll Query Assistant', department: 'HR', icon: '💰', color: '#8b5cf6',
    description: 'Answers employee payroll questions — payslip queries, deductions, tax certificates, and payment dates — without HR intervention.',
    capabilities: ['Payslip explanation', 'Deduction breakdown', 'Payment date queries', 'Tax certificate guidance', 'Self-service escalation'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['payroll', 'self-service', 'finance'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Why is my net pay lower this month?', 'When is salary paid this month?', 'How do I get my tax certificate?'] },

  { id: 'hr-benefits-advisor', name: 'Benefits & Wellness Advisor', department: 'HR', icon: '🏥', color: '#8b5cf6',
    description: 'Guides employees through medical aid, retirement, and wellness benefits — comparisons, enrolments, and claim guidance.',
    capabilities: ['Benefits comparison', 'Enrolment guidance', 'Claim process explanation', 'Wellness programme info', 'Dependent changes'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['benefits', 'medical aid', 'wellness'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What medical aid plans are available to me?', 'How do I add my spouse to my medical aid?', 'What gym benefits do I get?'] },

  { id: 'hr-exit-interview', name: 'Exit Interview Analyser', department: 'HR', icon: '🚪', color: '#8b5cf6',
    description: 'Conducts AI-assisted exit interviews, synthesises themes across leavers, and surfaces retention risk insights.',
    capabilities: ['Exit interview conducting', 'Theme extraction', 'Sentiment analysis', 'Retention risk signals', 'Trend reporting across cohorts'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['exit interviews', 'retention', 'attrition'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Conduct exit interview for departing employee', 'What are the top reasons employees are leaving this quarter?', 'Analyse exit themes from the last 20 leavers'] },

  // ─── LEGAL EXPANDED ────────────────────────────────────────────────────
  { id: 'legal-gdpr-handler', name: 'GDPR / POPIA Request Handler', department: 'LEGAL', icon: '🔒', color: '#0891b2',
    description: 'Manages data subject access requests, right-to-erasure, and POPIA/GDPR compliance workflows automatically.',
    capabilities: ['DSAR processing', 'Erasure requests', 'Consent record management', 'Response letter drafting', 'Regulatory deadline tracking'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['GDPR', 'POPIA', 'data privacy'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Process this data access request from a customer', 'Draft response to right-to-erasure request', 'Check if we are compliant with this DSAR within 30-day deadline'] },

  { id: 'legal-contract-generator', name: 'Employment Contract Generator', department: 'LEGAL', icon: '📄', color: '#0891b2',
    description: 'Generates legally-sound employment contracts, NDAs, and consultancy agreements from templates with smart variable filling.',
    capabilities: ['Contract template generation', 'Variable auto-filling', 'Clause library', 'Jurisdiction-specific versions', 'Change tracking'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['contracts', 'employment', 'NDA'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Generate employment contract for new Senior Engineer starting 1 May', 'Create NDA for contractor engagement', 'Draft consultancy agreement for 6-month project'] },

  { id: 'legal-regulatory-monitor', name: 'Regulatory Change Monitor', department: 'LEGAL', icon: '📡', color: '#0891b2',
    description: 'Monitors regulatory publications and legislative changes in your jurisdictions — summarises impact and flags action items.',
    capabilities: ['Regulatory feed monitoring', 'Change impact assessment', 'Action item generation', 'Jurisdiction filtering', 'Executive summary'],
    difficulty: 'advanced', estimatedSetupMinutes: 15, tags: ['regulatory', 'compliance', 'monitoring'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What new regulations affect fintech in South Africa this quarter?', 'Summarise recent FSCA changes relevant to our business', 'Alert me to any new POPIA guidance published this month'] },

  { id: 'legal-litigation-risk', name: 'Litigation Risk Analyser', department: 'LEGAL', icon: '⚖️', color: '#0891b2',
    description: 'Analyses disputes, complaints, and contracts to score litigation probability and suggest risk mitigation strategies.',
    capabilities: ['Risk scoring', 'Dispute pattern analysis', 'Settlement vs. litigation recommendation', 'Precedent search', 'Exposure quantification'],
    difficulty: 'advanced', estimatedSetupMinutes: 10, tags: ['litigation', 'risk', 'disputes'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['What is our litigation risk on this supplier dispute?', 'Assess the probability of this employment claim escalating', 'Should we settle or defend this contract dispute?'] },

  // ─── FINANCE EXPANDED ──────────────────────────────────────────────────
  { id: 'finance-invoice-processor', name: 'Invoice Processing Agent', department: 'FINANCE', icon: '🧾', color: '#059669',
    description: 'Extracts and validates invoice data, matches to POs, flags exceptions, and routes for approval — zero manual data entry.',
    capabilities: ['Invoice data extraction', 'PO matching', 'Exception flagging', 'Approval routing', 'Payment scheduling'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['invoices', 'AP', 'automation'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Process this batch of supplier invoices', "Flag any invoices that don't match a PO", 'Which invoices are due for payment this week?'] },

  { id: 'finance-expense-reviewer', name: 'Expense Claim Reviewer', department: 'FINANCE', icon: '💳', color: '#059669',
    description: 'Reviews employee expense claims for policy compliance, duplicate submissions, and suspicious patterns before approval.',
    capabilities: ['Policy compliance check', 'Duplicate detection', 'Receipt validation', 'Category classification', 'Approval recommendation'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['expenses', 'compliance', 'AP'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ["Review this month's expense claims for policy violations", 'Flag any duplicate submissions in this batch', 'Check if these travel expenses are within policy limits'] },

  { id: 'finance-cashflow-forecaster', name: 'Cash Flow Forecaster', department: 'FINANCE', icon: '📈', color: '#059669',
    description: 'Forecasts 13-week and 12-month cash flow from AR/AP data, flags liquidity risks, and models scenarios.',
    capabilities: ['13-week forecast', 'AR/AP integration', 'Scenario modelling', 'Liquidity risk alerts', 'Variance analysis'],
    difficulty: 'advanced', estimatedSetupMinutes: 15, tags: ['cash flow', 'forecasting', 'treasury'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Forecast our cash flow for the next 13 weeks', 'Model cash impact of 30-day payment term extension', 'What is our cash runway at current burn rate?'] },

  { id: 'finance-month-end', name: 'Month-End Close Assistant', department: 'FINANCE', icon: '📅', color: '#059669',
    description: 'Coordinates the month-end close checklist — tracks journal entries, reconciliations, and sign-offs across the finance team.',
    capabilities: ['Close checklist management', 'Journal entry tracking', 'Reconciliation status', 'Deadline alerting', 'Completion reporting'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['month-end', 'close', 'accounting'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What is our month-end close status?', 'Which reconciliations are still outstanding?', 'Generate month-end close progress report'] },

  { id: 'finance-tax-compliance', name: 'Tax Compliance Checker', department: 'FINANCE', icon: '📋', color: '#059669',
    description: 'Reviews transactions, returns, and documentation for tax compliance gaps — VAT, PAYE, corporate tax, and withholding tax.',
    capabilities: ['VAT compliance review', 'PAYE reconciliation', 'Corporate tax checklist', 'Withholding tax checks', 'SARS deadline tracking'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['tax', 'compliance', 'SARS'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Check our VAT return for this period', 'Are we up to date with PAYE submissions?', 'Review this transaction for withholding tax implications'] },

  // ─── IT DEPARTMENT ─────────────────────────────────────────────────────
  { id: 'it-helpdesk-triage', name: 'IT Helpdesk Triage Bot', department: 'IT', icon: '🖥️', color: '#6366f1',
    description: 'Triages and resolves common IT support requests automatically — password resets, VPN issues, software installs — before escalating.',
    capabilities: ['Issue classification', 'Self-service resolution steps', 'Escalation routing', 'Ticket creation', 'Resolution confirmation'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['IT helpdesk', 'self-service', 'triage'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ["My laptop won't connect to VPN", 'I need Microsoft Teams installed', 'My email account is locked out'] },

  { id: 'it-access-request', name: 'Access Request Processor', department: 'IT', icon: '🔑', color: '#6366f1',
    description: 'Processes system access requests — validates approvals, checks least-privilege policies, and provisions or escalates.',
    capabilities: ['Approval workflow validation', 'Least-privilege check', 'Role-based access review', 'Provisioning instructions', 'Audit trail logging'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['access', 'IAM', 'security'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Grant read access to our analytics dashboard for the new hire', 'Review this access request for the finance system', 'Remove access for the employee who left last week'] },

  { id: 'it-asset-manager', name: 'IT Asset Inventory Manager', department: 'IT', icon: '📦', color: '#6366f1',
    description: 'Tracks, audits, and reconciles hardware and software assets — flags missing devices, expiring licences, and under-used assets.',
    capabilities: ['Asset discovery', 'Licence expiry tracking', 'Under-utilisation flagging', 'Reconciliation reports', 'Disposal recommendations'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['assets', 'ITAM', 'licences'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Which software licences expire in the next 30 days?', 'How many unassigned laptops do we have?', 'Generate an IT asset report for the auditors'] },

  { id: 'it-patch-advisor', name: 'Patch Management Advisor', department: 'IT', icon: '🛡️', color: '#6366f1',
    description: 'Prioritises security patches by CVSS score and business impact — generates patching schedule and rollback plans.',
    capabilities: ['CVSS-based prioritisation', 'Patch schedule generation', 'Impact assessment', 'Rollback planning', 'Compliance reporting'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['patching', 'security', 'CVSS'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Which patches need to be applied urgently?', "Build this month's patching schedule", 'What is the business impact of patching our production SQL servers?'] },

  { id: 'it-password-reset', name: 'Self-Service Password Reset', department: 'IT', icon: '🔐', color: '#6366f1',
    description: 'Automates identity verification and password reset for staff — integrates with Active Directory and identity providers.',
    capabilities: ['Identity verification', 'AD password reset', 'MFA bypass guidance', 'Account unlock', 'Audit logging'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['password', 'Active Directory', 'self-service'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ["I've been locked out of my account", 'Reset my VPN password', 'I forgot my Office 365 password'] },

  // ─── EXECUTIVE DEPARTMENT ──────────────────────────────────────────────
  { id: 'exec-board-report', name: 'Board Report Generator', department: 'EXECUTIVE', icon: '📊', color: '#dc2626',
    description: 'Compiles board packs from department inputs — financial summaries, strategic milestones, risk updates, and KPI dashboards.',
    capabilities: ['Board pack assembly', 'Executive narrative writing', 'Risk summary', 'Financial highlights', 'Strategic milestone tracking'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['board', 'reporting', 'executive'], featured: true, crossFunctional: true, requiresApproval: true,
    exampleInputs: ['Compile the board report for this quarter', 'Write the CEO section for our board pack', "Summarise this quarter's performance vs. strategic targets"] },

  { id: 'exec-kpi-narrator', name: 'KPI Dashboard Narrator', department: 'EXECUTIVE', icon: '📈', color: '#dc2626',
    description: "Turns raw KPI data into executive-ready narrative — highlights what's green, red, and trending, with recommended actions.",
    capabilities: ['KPI interpretation', 'Trend narration', 'Red flag highlighting', 'Recommended action generation', 'Multi-department rollup'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['KPIs', 'executive', 'narrative'], featured: true, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Narrate our KPI dashboard for the exec team', 'What is underperforming this month and why?', 'Write an executive summary of our quarterly metrics'] },

  { id: 'exec-competitive-intel', name: 'Competitive Intelligence Monitor', department: 'EXECUTIVE', icon: '🔭', color: '#dc2626',
    description: 'Monitors competitor activity — product launches, pricing changes, funding rounds, and executive moves — and summarises weekly.',
    capabilities: ['Competitor news monitoring', 'Product launch tracking', 'Pricing intelligence', 'Funding alert', 'Weekly digest generation'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['competitive intelligence', 'strategy', 'monitoring'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What did our top 3 competitors announce this week?', 'Did any of our competitors change pricing recently?', 'Summarise the competitive landscape for our board presentation'] },

  { id: 'exec-meeting-prep', name: 'Strategic Meeting Prep Agent', department: 'EXECUTIVE', icon: '📝', color: '#dc2626',
    description: 'Prepares comprehensive meeting briefs — stakeholder backgrounds, agenda alignment, key questions, and recommended positions.',
    capabilities: ['Stakeholder research', 'Agenda preparation', 'Key question generation', 'Background briefing', 'Post-meeting follow-up'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['meetings', 'executive', 'preparation'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ["Prepare brief for tomorrow's investor meeting", 'Research the board member I\'m meeting next week', 'Generate agenda and key questions for our strategy offsite'] },

  { id: 'exec-investor-update', name: 'Investor Update Drafter', department: 'EXECUTIVE', icon: '✉️', color: '#dc2626',
    description: 'Drafts monthly or quarterly investor update emails — highlights, metrics, challenges, and asks — in clear, concise language.',
    capabilities: ['Investor narrative writing', 'Metric highlight selection', 'Ask formulation', 'Risk transparency framing', 'Multi-stakeholder variants'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['investors', 'reporting', 'communication'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Draft our monthly investor update email', 'Write a quarterly update for our board and investors', 'Create investor email highlighting our growth metrics this quarter'] },

  // ─── OPERATIONS EXPANDED ──────────────────────────────────────────────
  { id: 'ops-procurement-agent', name: 'Procurement Request Agent', department: 'OPERATIONS', icon: '🛒', color: '#92400e',
    description: 'Raises and tracks procurement requests — validates budget, finds approved vendors, and routes for sign-off.',
    capabilities: ['Budget validation', 'Vendor matching', 'RFQ generation', 'Approval routing', 'PO status tracking'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['procurement', 'purchasing', 'vendor'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Raise a procurement request for 50 laptops', 'Which vendors are approved for cloud services?', 'What is the status of my pending purchase order?'] },

  { id: 'ops-vendor-monitor', name: 'Vendor Performance Monitor', department: 'OPERATIONS', icon: '📊', color: '#92400e',
    description: 'Tracks vendor SLA performance, contract milestones, and relationship health — flags underperformers and renewal risks.',
    capabilities: ['SLA tracking', 'Milestone monitoring', 'Performance scoring', 'Renewal alerting', 'Escalation recommendations'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['vendor management', 'SLA', 'procurement'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['How is our top 5 vendors performing against SLAs?', 'Which vendor contracts are up for renewal in 90 days?', 'Flag any vendors who have missed SLA milestones this month'] },

  { id: 'ops-process-docs', name: 'Process Documentation Agent', department: 'OPERATIONS', icon: '📖', color: '#92400e',
    description: 'Converts process notes, interviews, and workflows into structured SOPs with diagrams, decision trees, and role assignments.',
    capabilities: ['SOP generation', 'Process diagram creation', 'Decision tree building', 'Role assignment mapping', 'Version control'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['SOPs', 'documentation', 'processes'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Document our customer onboarding process', 'Create an SOP for the month-end reconciliation process', 'Convert these process notes into a structured workflow document'] },

  { id: 'ops-supply-chain-monitor', name: 'Supply Chain Risk Monitor', department: 'OPERATIONS', icon: '🚢', color: '#92400e',
    description: 'Monitors supply chain disruptions — supplier delays, geopolitical risks, logistics issues — and surfaces mitigation options.',
    capabilities: ['Supplier risk scoring', 'Disruption alerting', 'Alternative supplier suggestions', 'Lead time tracking', 'Risk dashboard generation'],
    difficulty: 'advanced', estimatedSetupMinutes: 15, tags: ['supply chain', 'risk', 'logistics'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Are there any supply chain risks I should know about?', 'Flag suppliers with delivery delays this week', 'What is our risk exposure to South-East Asian logistics disruptions?'] },

  // ─── PRODUCT EXPANDED ─────────────────────────────────────────────────
  { id: 'product-user-story', name: 'User Story Generator', department: 'PRODUCT', icon: '📝', color: '#7c3aed',
    description: 'Generates well-structured user stories with acceptance criteria from feature requests, interviews, or customer feedback.',
    capabilities: ['User story writing', 'Acceptance criteria generation', 'BDD scenario creation', 'Priority suggestion', 'Epic decomposition'],
    difficulty: 'beginner', estimatedSetupMinutes: 2, tags: ['user stories', 'agile', 'product'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Write user stories for our new notifications feature', 'Break this epic into user stories', 'Generate acceptance criteria for the payment retry flow'] },

  { id: 'product-sprint-planner', name: 'Sprint Planning Assistant', department: 'PRODUCT', icon: '🏃', color: '#7c3aed',
    description: 'Assists sprint planning — estimates capacity, recommends backlog prioritisation, and generates sprint goal statements.',
    capabilities: ['Capacity planning', 'Backlog prioritisation', 'Sprint goal generation', 'Story point estimation', 'Velocity analysis'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['sprint', 'agile', 'planning'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Plan our next two-week sprint with 60 story points capacity', 'What should we prioritise for our Q2 sprint?', 'Write the sprint goal for our payment reliability sprint'] },

  { id: 'product-feature-prioritizer', name: 'Feature Prioritisation Advisor', department: 'PRODUCT', icon: '🎯', color: '#7c3aed',
    description: 'Scores and ranks features using RICE, MoSCoW, or weighted criteria — surfaces the highest-impact, lowest-effort items.',
    capabilities: ['RICE scoring', 'MoSCoW analysis', 'Impact/effort matrix', 'Customer signal weighting', 'Roadmap conflict detection'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['prioritisation', 'roadmap', 'product strategy'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Prioritise our feature backlog using RICE scoring', 'What should we build next quarter?', 'Score these 10 features by customer impact vs. engineering effort'] },

  { id: 'product-release-notes', name: 'Release Notes Generator', department: 'PRODUCT', icon: '📢', color: '#7c3aed',
    description: 'Generates clear, customer-friendly release notes from Jira tickets, PRs, or commit logs — categorised and formatted for your audience.',
    capabilities: ['Changelog generation', 'Customer-friendly language', 'Audience segmentation', 'Bug vs. feature categorisation', 'Multi-format output'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['release notes', 'changelog', 'communication'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Generate release notes from these Jira tickets', 'Write customer-facing changelog for v2.4', "Create internal release notes from this sprint's PRs"] },

  // ─── QA EXPANDED ─────────────────────────────────────────────────────
  { id: 'qa-api-test-generator', name: 'API Test Case Generator', department: 'QA', icon: '🔌', color: '#0891b2',
    description: 'Generates comprehensive API test cases from OpenAPI/Swagger specs — happy paths, edge cases, auth tests, and error scenarios.',
    capabilities: ['OpenAPI spec parsing', 'Happy path generation', 'Error scenario testing', 'Auth/security tests', 'Postman collection export'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['API testing', 'Postman', 'OpenAPI'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Generate API tests from our payment service OpenAPI spec', 'Create security test cases for our authentication endpoints', 'Write error handling tests for our REST API'] },

  { id: 'qa-accessibility-checker', name: 'Accessibility Compliance Checker', department: 'QA', icon: '♿', color: '#0891b2',
    description: 'Reviews UI code and designs for WCAG 2.2 accessibility compliance — flags violations, severity, and remediation steps.',
    capabilities: ['WCAG 2.2 audit', 'Colour contrast checking', 'Keyboard navigation review', 'Screen reader compatibility', 'ARIA label validation'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['accessibility', 'WCAG', 'compliance'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Check this page for WCAG 2.2 violations', 'Does our colour scheme meet AA contrast requirements?', 'Audit our form inputs for screen reader compatibility'] },

  { id: 'qa-performance-analyzer', name: 'Performance Test Analyser', department: 'QA', icon: '⚡', color: '#0891b2',
    description: 'Analyses performance test results — identifies bottlenecks, p95/p99 outliers, and regression vs. baseline — with fix recommendations.',
    capabilities: ['Load test result analysis', 'Bottleneck identification', 'p95/p99 analysis', 'Baseline regression detection', 'Remediation suggestions'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['performance testing', 'load testing', 'k6'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Analyse these k6 performance test results', 'Why is our API p99 latency 3x higher than last week?', 'Identify bottlenecks in this load test run'] },

  { id: 'qa-release-signoff', name: 'Release Sign-off Agent', department: 'QA', icon: '✅', color: '#0891b2',
    description: 'Compiles release readiness reports from test results, open bugs, and risk assessments — issues a go/no-go recommendation.',
    capabilities: ['Test coverage summary', 'Open bug risk scoring', 'Go/no-go recommendation', 'Stakeholder sign-off coordination', 'Release risk report'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['release', 'sign-off', 'readiness'], featured: true, crossFunctional: true, requiresApproval: true,
    exampleInputs: ['Is this release ready to go to production?', 'Compile release readiness report for v3.2', 'Generate go/no-go recommendation based on these test results'] },

  // ─── ENGINEERING EXPANDED ─────────────────────────────────────────────
  { id: 'eng-pr-reviewer', name: 'PR Code Review Agent', department: 'ENGINEERING', icon: '🔍', color: '#1d4ed8',
    description: 'Reviews pull requests for code quality, security vulnerabilities, performance issues, and adherence to engineering standards.',
    capabilities: ['Code quality analysis', 'Security vulnerability detection', 'Performance anti-pattern flagging', 'Standards compliance', 'Reviewer suggestions'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['code review', 'PR', 'security'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Review this pull request for security issues', 'Check this PR for performance anti-patterns', 'Does this code meet our engineering standards?'] },

  { id: 'eng-arch-decision', name: 'Architecture Decision Recorder', department: 'ENGINEERING', icon: '🏗️', color: '#1d4ed8',
    description: 'Documents and maintains Architecture Decision Records (ADRs) — captures context, alternatives considered, and consequences.',
    capabilities: ['ADR template generation', 'Trade-off documentation', 'Alternative comparison', 'Decision indexing', 'Impact analysis'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['architecture', 'ADR', 'documentation'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Document our decision to use PostgreSQL over MongoDB', 'Create ADR for adopting a microservices architecture', 'Record our choice of Next.js for the frontend framework'] },

  { id: 'eng-dependency-scanner', name: 'Dependency Security Scanner', department: 'ENGINEERING', icon: '🛡️', color: '#1d4ed8',
    description: 'Scans package dependencies for known CVEs, deprecated packages, and licensing conflicts — generates remediation PRs.',
    capabilities: ['CVE scanning', 'Deprecated package detection', 'Licence conflict flagging', 'Upgrade path recommendations', 'SBOM generation'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['security', 'CVE', 'dependencies'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Scan our package.json for security vulnerabilities', 'Which npm packages have critical CVEs?', 'Check our dependencies for GPL licence conflicts'] },

  { id: 'eng-tech-docs', name: 'Technical Documentation Generator', department: 'ENGINEERING', icon: '📚', color: '#1d4ed8',
    description: 'Generates API docs, README files, architecture guides, and onboarding documentation from code, comments, and schemas.',
    capabilities: ['API doc generation', 'README creation', 'Architecture guide writing', 'Code comment parsing', 'Onboarding guide generation'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['documentation', 'README', 'API docs'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Generate README for this repository', 'Create API documentation from our OpenAPI spec', 'Write an onboarding guide for new engineers joining the team'] },

  // ─── RISK EXPANDED ─────────────────────────────────────────────────────
  { id: 'risk-vendor-assessor', name: 'Vendor Risk Assessor', department: 'RISK', icon: '🔎', color: '#b45309',
    description: 'Assesses third-party vendor risk across financial, operational, cyber, and reputational dimensions — generates risk rating.',
    capabilities: ['Financial health check', 'Cyber risk assessment', 'Operational resilience review', 'Reputational risk scoring', 'Due diligence report'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['vendor risk', 'third-party', 'due diligence'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Assess the risk of onboarding this new cloud provider', 'Rate our top 10 vendors by risk tier', 'Conduct due diligence on this potential acquisition target'] },

  { id: 'risk-bcp-planner', name: 'Business Continuity Planner', department: 'RISK', icon: '🏥', color: '#b45309',
    description: 'Generates and maintains business continuity plans — identifies critical processes, RTOs, RPOs, and recovery procedures.',
    capabilities: ['BIA facilitation', 'RTO/RPO definition', 'Recovery procedure writing', 'Crisis communication templates', 'BCP testing schedules'],
    difficulty: 'advanced', estimatedSetupMinutes: 20, tags: ['BCP', 'business continuity', 'resilience'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Create a BCP for our payments processing function', 'What are our critical processes and their RTOs?', 'Generate a crisis communication template for a system outage'] },

  { id: 'risk-regulatory-monitor', name: 'Regulatory Risk Monitor', department: 'RISK', icon: '📡', color: '#b45309',
    description: 'Monitors the regulatory landscape for changes that could impact your risk profile — generates impact assessments and action plans.',
    capabilities: ['Regulatory change detection', 'Risk impact assessment', 'Action plan generation', 'Horizon scanning', 'Board risk reporting'],
    difficulty: 'advanced', estimatedSetupMinutes: 15, tags: ['regulatory risk', 'horizon scanning', 'board reporting'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What regulatory changes could affect our risk profile this quarter?', 'Assess the risk impact of the new FSCA requirements', 'Generate a regulatory risk summary for the board'] },

  { id: 'risk-third-party-scorer', name: 'Third-Party Risk Scorer', department: 'RISK', icon: '⭐', color: '#b45309',
    description: 'Scores and ranks third-party relationships by inherent and residual risk — automates periodic risk review cycles.',
    capabilities: ['Inherent risk calculation', 'Residual risk scoring', 'Review cycle automation', 'Risk appetite alignment', 'Remediation tracking'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['third-party risk', 'scoring', 'TPRM'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Score all our third-party relationships by risk tier', 'Which vendors are due for their annual risk review?', 'Has our residual risk changed for any critical vendors?'] },

  // ─── SECURITY EXPANDED ────────────────────────────────────────────────
  { id: 'security-vuln-assessor', name: 'Vulnerability Assessment Agent', department: 'SECURITY', icon: '🔓', color: '#dc2626',
    description: 'Analyses vulnerability scan reports, prioritises by exploitability and business impact, and generates remediation roadmaps.',
    capabilities: ['Scan report parsing', 'CVSS + business context scoring', 'Patch prioritisation', 'Remediation roadmap', 'Executive risk summary'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['vulnerability', 'CVE', 'penetration testing'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Analyse this Nessus vulnerability report', 'Which vulnerabilities should we patch first?', 'Create a remediation roadmap for our Q2 pen test findings'] },

  { id: 'security-awareness-trainer', name: 'Security Awareness Trainer', department: 'SECURITY', icon: '🎓', color: '#dc2626',
    description: 'Creates tailored security awareness content — phishing simulations, policy quizzes, and monthly security bulletins for staff.',
    capabilities: ['Phishing simulation design', 'Policy quiz generation', 'Security bulletin writing', 'Role-specific training content', 'Awareness metrics tracking'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['awareness', 'training', 'phishing'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Create a phishing awareness quiz for Finance staff', "Write this month's security bulletin", 'Generate role-specific security training for our HR team'] },

  { id: 'security-data-classifier', name: 'Data Classification Agent', department: 'SECURITY', icon: '🏷️', color: '#dc2626',
    description: 'Classifies data assets by sensitivity level (Public, Internal, Confidential, Restricted) and recommends handling controls.',
    capabilities: ['Data sensitivity scanning', 'Classification labelling', 'Handling control recommendations', 'DLP policy alignment', 'Classification audit trail'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['data classification', 'DLP', 'sensitivity'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Classify the data in our CRM as Public/Internal/Confidential/Restricted', 'What handling controls apply to our customer PII?', 'Review our data classification policy for gaps'] },

  { id: 'security-ir-playbook', name: 'Incident Response Playbook Generator', department: 'SECURITY', icon: '🚨', color: '#dc2626',
    description: 'Creates incident response playbooks for common threat scenarios — ransomware, data breach, insider threat, and phishing.',
    capabilities: ['Playbook generation', 'Stakeholder role mapping', 'Communication templates', 'Containment procedures', 'Evidence collection guidance'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['incident response', 'playbook', 'cybersecurity'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Create a ransomware incident response playbook', 'Build a data breach response procedure', 'Write an insider threat investigation guide'] },

  // ─── COMPLIANCE EXPANDED ──────────────────────────────────────────────
  { id: 'compliance-gdpr-monitor', name: 'GDPR / POPIA Compliance Monitor', department: 'COMPLIANCE', icon: '🛡️', color: '#1d4ed8',
    description: 'Continuously monitors processes, systems, and documentation for GDPR and POPIA compliance gaps — generates remediation plans.',
    capabilities: ['Compliance gap detection', 'DPIA facilitation', 'Records of processing review', 'Breach notification drafting', 'Controller/processor mapping'],
    difficulty: 'advanced', estimatedSetupMinutes: 15, tags: ['GDPR', 'POPIA', 'data protection'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Are we POPIA compliant in our customer data handling?', 'Review our privacy notices for GDPR gaps', 'Generate a DPIA for our new customer analytics system'] },

  { id: 'compliance-soc2-collector', name: 'SOC 2 Evidence Collector', department: 'COMPLIANCE', icon: '📋', color: '#1d4ed8',
    description: 'Automates evidence collection for SOC 2 Type II audits — maps controls, collects screenshots, logs, and policy documents.',
    capabilities: ['Control mapping', 'Evidence collection guidance', 'Policy document review', 'Audit timeline management', 'Auditor response drafting'],
    difficulty: 'advanced', estimatedSetupMinutes: 20, tags: ['SOC 2', 'audit', 'evidence'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['What evidence do I need for our SOC 2 audit?', 'Help me collect evidence for the CC6 access controls', 'Prepare our SOC 2 evidence pack for the auditors'] },

  { id: 'compliance-training-tracker', name: 'Training Compliance Tracker', department: 'COMPLIANCE', icon: '🎓', color: '#1d4ed8',
    description: 'Tracks mandatory training completion across the organisation — sends reminders, flags non-completion, and generates compliance reports.',
    capabilities: ['Completion tracking', 'Automated reminders', 'Non-completion escalation', 'Compliance reporting', 'Certificate expiry alerts'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['training', 'compliance', 'mandatory'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Who has not completed mandatory AML training?', 'Send reminders to staff with overdue compliance training', 'Generate training compliance report for the compliance committee'] },

  { id: 'compliance-policy-notifier', name: 'Policy Update Notifier', department: 'COMPLIANCE', icon: '📢', color: '#1d4ed8',
    description: 'Monitors policy changes, drafts update communications, and tracks staff acknowledgement across the organisation.',
    capabilities: ['Policy change drafting', 'Staff notification distribution', 'Acknowledgement tracking', 'Read & sign workflow', 'Compliance gap reporting'],
    difficulty: 'beginner', estimatedSetupMinutes: 5, tags: ['policy', 'notifications', 'acknowledgement'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Notify all staff of the updated data protection policy', "Which employees haven't acknowledged the new security policy?", 'Draft policy update communication for the POPIA amendment'] },

  // ─── MARKETING EXPANDED ────────────────────────────────────────────────
  { id: 'marketing-content-calendar', name: 'Content Calendar Planner', department: 'MARKETING', icon: '🗓️', color: '#e11d48',
    description: 'Builds data-driven content calendars — aligns topics to audience segments, campaign goals, and SEO opportunities.',
    capabilities: ['Topic ideation', 'Calendar structuring', 'SEO keyword alignment', 'Campaign tie-in', 'Channel distribution planning'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['content', 'calendar', 'planning'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Build Q2 content calendar for our enterprise blog', 'Plan social content for our product launch month', 'Create 4-week LinkedIn content plan aligned to our campaign'] },

  { id: 'marketing-competitor-monitor', name: 'Competitor Intelligence Monitor', department: 'MARKETING', icon: '🔭', color: '#e11d48',
    description: 'Monitors competitor marketing — messaging changes, campaigns, pricing, and content strategy — and surfaces weekly insights.',
    capabilities: ['Competitor ad monitoring', 'Messaging analysis', 'Campaign detection', 'Positioning gap analysis', 'Weekly competitive digest'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['competitive intelligence', 'market research', 'strategy'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['What marketing campaigns are our competitors running?', "How has our competitor's messaging changed this month?", 'Build a competitive positioning comparison matrix'] },

  { id: 'marketing-press-release', name: 'Press Release Writer', department: 'MARKETING', icon: '📰', color: '#e11d48',
    description: 'Writes press releases, media pitches, and executive quotes in AP style — tailored for different journalist beats.',
    capabilities: ['Press release drafting', 'Media pitch writing', 'Executive quote generation', 'Journalist targeting', 'Distribution list suggestions'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['PR', 'press release', 'media'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Write a press release for our Series A funding announcement', 'Draft a media pitch for TechCrunch about our AI product launch', 'Create executive quote from our CEO for the acquisition announcement'] },

  // ─── DATA & ANALYTICS EXPANDED ────────────────────────────────────────
  { id: 'data-pipeline-monitor', name: 'Data Pipeline Monitor', department: 'DATA_ANALYTICS', icon: '🔄', color: '#0284c7',
    description: 'Monitors data pipeline health — detects failures, freshness issues, schema drift, and volume anomalies in real time.',
    capabilities: ['Pipeline failure detection', 'Data freshness monitoring', 'Schema drift alerting', 'Volume anomaly detection', 'Root cause analysis'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['data pipelines', 'monitoring', 'dbt'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Are any of our data pipelines failing?', "Which datasets haven't been refreshed in over 24 hours?", 'Detect schema changes in our production data warehouse'] },

  { id: 'data-segmentation', name: 'Customer Segmentation Agent', department: 'DATA_ANALYTICS', icon: '🎯', color: '#0284c7',
    description: 'Segments customers by behaviour, value, and lifecycle stage — generates actionable cohort definitions for marketing and product.',
    capabilities: ['Behavioural segmentation', 'RFM analysis', 'Lifecycle stage mapping', 'Cohort definition generation', 'Segment performance reporting'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['segmentation', 'RFM', 'customer analytics'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Segment our customers by purchase frequency and value', 'Create an RFM analysis of our customer base', 'Which customer segments are at highest churn risk?'] },

  { id: 'data-ab-test-analyzer', name: 'A/B Test Results Analyser', department: 'DATA_ANALYTICS', icon: '🔬', color: '#0284c7',
    description: 'Analyses A/B test results for statistical significance, novelty effects, and segment-level interactions — gives clear ship/kill recommendations.',
    capabilities: ['Statistical significance testing', 'Novelty effect detection', 'Segment analysis', 'Ship/kill recommendation', 'Sample size calculation'],
    difficulty: 'intermediate', estimatedSetupMinutes: 5, tags: ['A/B testing', 'experimentation', 'statistics'], featured: false, crossFunctional: true, requiresApproval: false,
    exampleInputs: ['Analyse these A/B test results — should we ship?', 'Is this experiment reaching statistical significance?', 'Are there any subgroups where the test performs differently?'] },

  // ─── INFRA & OPS EXPANDED ─────────────────────────────────────────────
  { id: 'infra-cost-optimizer', name: 'Cloud Cost Optimiser', department: 'INFRA_OPS', icon: '💰', color: '#374151',
    description: 'Identifies cloud cost savings — idle resources, right-sizing opportunities, reserved instance recommendations, and tag hygiene.',
    capabilities: ['Idle resource detection', 'Right-sizing recommendations', 'Reserved instance analysis', 'Tag hygiene review', 'Savings projection'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['cloud costs', 'FinOps', 'AWS', 'GCP', 'Azure'], featured: true, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Where can we reduce our AWS spend this month?', 'Which EC2 instances are oversized?', 'How much could we save by switching to reserved instances?'] },

  { id: 'infra-dr-planner', name: 'Disaster Recovery Planner', department: 'INFRA_OPS', icon: '🔄', color: '#374151',
    description: 'Designs and documents disaster recovery procedures — RTO/RPO mapping, failover steps, data backup verification, and DR test scheduling.',
    capabilities: ['RTO/RPO mapping', 'Failover procedure writing', 'Backup verification guidance', 'DR test planning', 'Recovery time documentation'],
    difficulty: 'advanced', estimatedSetupMinutes: 20, tags: ['disaster recovery', 'RTO', 'RPO', 'backup'], featured: false, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Create a DR plan for our payment processing service', 'What is our RTO for a total data centre failure?', 'Schedule and design a DR failover test for Q3'] },

  { id: 'infra-compliance-checker', name: 'Infrastructure Compliance Checker', department: 'INFRA_OPS', icon: '✅', color: '#374151',
    description: 'Checks cloud infrastructure against CIS benchmarks, security baselines, and regulatory requirements — generates compliance reports.',
    capabilities: ['CIS benchmark checks', 'Security baseline assessment', 'Misconfiguration detection', 'Compliance gap reporting', 'Remediation scripts'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['compliance', 'CIS', 'cloud security', 'Terraform'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Check our AWS infrastructure against CIS benchmarks', 'Find security misconfigurations in our cloud environment', 'Generate infrastructure compliance report for our ISO 27001 audit'] },

  // ─── CUSTOMER SUPPORT EXPANDED ────────────────────────────────────────
  { id: 'support-live-chat-handoff', name: 'Live Chat Handoff Agent', department: 'CUSTOMER_SUPPORT', icon: '🔀', color: '#0d9488',
    description: 'Manages seamless handoffs from AI chatbot to human agents — packages conversation history, customer context, and suggested next steps.',
    capabilities: ['Conversation summarisation', 'Context packaging', 'Agent skill matching', 'Priority routing', 'Handoff note generation'],
    difficulty: 'intermediate', estimatedSetupMinutes: 8, tags: ['live chat', 'handoff', 'human escalation'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Prepare handoff package for this escalated chat', 'Route this VIP customer to a senior agent', 'Summarise this conversation for the human agent taking over'] },

  { id: 'support-csat-survey', name: 'CSAT Survey Generator', department: 'CUSTOMER_SUPPORT', icon: '⭐', color: '#0d9488',
    description: 'Generates, distributes, and analyses CSAT and NPS surveys — identifies improvement themes and tracks score trends.',
    capabilities: ['Survey question generation', 'Distribution timing optimisation', 'Response analysis', 'Theme extraction', 'NPS/CSAT trend tracking'],
    difficulty: 'beginner', estimatedSetupMinutes: 3, tags: ['CSAT', 'NPS', 'surveys'], featured: false, crossFunctional: false, requiresApproval: false,
    exampleInputs: ['Create a post-interaction CSAT survey', "Analyse this month's CSAT responses for themes", 'Why is our NPS declining in the enterprise segment?'] },

  { id: 'support-churn-intervention', name: 'Churn Risk Intervention Agent', department: 'CUSTOMER_SUPPORT', icon: '🛟', color: '#0d9488',
    description: 'Identifies at-risk customers from support signals and proactively engages with personalised retention offers and outreach.',
    capabilities: ['Churn signal detection', 'Risk scoring', 'Personalised outreach drafting', 'Retention offer recommendations', 'Success manager alerting'],
    difficulty: 'intermediate', estimatedSetupMinutes: 10, tags: ['churn prevention', 'retention', 'customer success'], featured: false, crossFunctional: true, requiresApproval: true,
    exampleInputs: ['Which customers are at risk of churning this month?', 'Draft a retention email for this at-risk enterprise customer', 'What signals indicate this customer is about to cancel?'] },

  { id: 'support-whatsapp-bot', name: 'WhatsApp Support Bot', department: 'CUSTOMER_SUPPORT', icon: '📲', color: '#0d9488',
    description: 'Dedicated WhatsApp support agent — handles incoming complaints, creates and updates support tickets, sends case status updates, and escalates to human agents, all via WhatsApp.',
    capabilities: ['Complaint intake via WhatsApp', 'Automatic ticket creation', 'Case status updates', 'Human escalation with context', 'Multi-language messaging', 'After-hours auto-reply'],
    difficulty: 'intermediate', estimatedSetupMinutes: 12, tags: ['WhatsApp', 'support', 'ticketing', 'messaging'], featured: true, crossFunctional: false, requiresApproval: true,
    exampleInputs: ['Set up WhatsApp bot that creates a support ticket from every incoming complaint', 'Send automated WhatsApp update when ticket status changes', 'Build a WhatsApp bot that escalates to a human agent when the customer is frustrated'] },
]

// ═══ Department config ═══

const DEPT_CONFIG: Record<string, { icon: string; gradient: string; label: string }> = {
  HR:               { icon: '👥', gradient: 'from-violet-600 to-purple-700', label: 'Human Resources' },
  LEGAL:            { icon: '⚖️', gradient: 'from-cyan-600 to-blue-700', label: 'Legal' },
  RISK:             { icon: '⚠️', gradient: 'from-red-600 to-rose-700', label: 'Risk' },
  SECURITY:         { icon: '🔒', gradient: 'from-amber-600 to-orange-700', label: 'Security' },
  COMPLIANCE:       { icon: '📋', gradient: 'from-blue-600 to-indigo-700', label: 'Compliance' },
  QA:               { icon: '✅', gradient: 'from-emerald-600 to-green-700', label: 'Quality Assurance' },
  PRODUCT:          { icon: '🎯', gradient: 'from-purple-600 to-violet-700', label: 'Product' },
  ENGINEERING:      { icon: '⚙️', gradient: 'from-teal-600 to-cyan-700', label: 'Engineering' },
  FINANCE:          { icon: '💰', gradient: 'from-yellow-600 to-amber-700', label: 'Finance' },
  CROSS_FUNCTIONAL:  { icon: '🌐', gradient: 'from-indigo-600 to-blue-700', label: 'All Teams' },
  MARKETING:         { icon: '📣', gradient: 'from-rose-600 to-pink-700', label: 'Marketing' },
  DATA_ANALYTICS:    { icon: '📊', gradient: 'from-sky-600 to-blue-700', label: 'Data & Analytics' },
  INFRA_OPS:         { icon: '🖥️', gradient: 'from-gray-600 to-slate-700', label: 'Infrastructure & Ops' },
  CUSTOMER_SUPPORT:  { icon: '🎧', gradient: 'from-teal-600 to-cyan-700', label: 'Customer Support' },
  CHATBOT_VOICE:     { icon: '🤖', gradient: 'from-violet-600 to-indigo-700', label: 'Chatbot & Voice' },
  IT:                { icon: '🖥️', gradient: 'from-indigo-600 to-violet-700', label: 'IT' },
  EXECUTIVE:         { icon: '👔', gradient: 'from-red-600 to-rose-700', label: 'Executive' },
}

const DEPT_BADGE_STYLE: Record<string, string> = {
  HR:               'bg-violet-500/15 text-violet-400 border border-violet-500/25',
  LEGAL:            'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
  RISK:             'bg-red-500/15 text-red-400 border border-red-500/25',
  SECURITY:         'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  COMPLIANCE:       'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  QA:               'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  PRODUCT:          'bg-purple-500/15 text-purple-400 border border-purple-500/25',
  ENGINEERING:      'bg-teal-500/15 text-teal-400 border border-teal-500/25',
  FINANCE:          'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  CROSS_FUNCTIONAL:  'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
  MARKETING:         'bg-rose-500/15 text-rose-400 border border-rose-500/25',
  DATA_ANALYTICS:    'bg-sky-500/15 text-sky-400 border border-sky-500/25',
  INFRA_OPS:         'bg-slate-500/15 text-slate-400 border border-slate-500/25',
  CUSTOMER_SUPPORT:  'bg-teal-500/15 text-teal-400 border border-teal-500/25',
  CHATBOT_VOICE:     'bg-violet-500/15 text-violet-400 border border-violet-500/25',
  IT:                'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
  EXECUTIVE:         'bg-red-500/15 text-red-400 border border-red-500/25',
}

const DIFFICULTY_STYLE: Record<string, string> = {
  beginner:     'bg-emerald-500/15 text-emerald-400',
  intermediate: 'bg-amber-500/15 text-amber-400',
  advanced:     'bg-rose-500/15 text-rose-400',
}

// ═══ Toast component ═══

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-slide-up"
          style={{
            background: t.type === 'success'
              ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))'
              : 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(225,29,72,0.1))',
            border: t.type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <span className="text-lg">{t.type === 'success' ? '✅' : '❌'}</span>
          <span className="text-sm font-medium text-text-primary">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-text-muted hover:text-text-primary text-xs">✕</button>
        </div>
      ))}
    </div>
  )
}

// ═══ Agent Card ═══

function AgentCard({
  template,
  isDeployed,
  onDeploy,
}: {
  template: AgentTemplate
  isDeployed: boolean
  onDeploy: (t: AgentTemplate) => void
}) {
  const dept = DEPT_CONFIG[template.department]
  const badgeStyle = DEPT_BADGE_STYLE[template.department] ?? 'bg-navy-700 text-text-muted border border-border'
  const diffStyle = DIFFICULTY_STYLE[template.difficulty]
  const shownCaps = template.capabilities.slice(0, 3)
  const extraCaps = template.capabilities.length - 3

  return (
    <div
      className="glass-card flex flex-col hover:border-electric-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-slide-up"
      style={{ borderLeft: `3px solid ${template.color}` }}
    >
      {/* Card Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
            style={{ background: `${template.color}22`, border: `1px solid ${template.color}44` }}
          >
            {template.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-text-primary text-sm leading-tight">{template.name}</h3>
              {template.featured && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-electric-500/15 text-electric-400 font-bold uppercase tracking-wide">
                  Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                {dept?.icon} {template.department === 'CROSS_FUNCTIONAL' ? 'All Teams' : template.department}
              </span>
              {template.crossFunctional && template.department !== 'CROSS_FUNCTIONAL' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium">
                  🌐 Cross-team
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-text-muted leading-relaxed mb-3 line-clamp-2">{template.description}</p>

        {/* Capabilities */}
        <div className="space-y-1">
          {shownCaps.map(cap => (
            <div key={cap} className="flex items-center gap-2 text-xs text-text-secondary">
              <span style={{ color: template.color }} className="text-[10px]">▸</span>
              {cap}
            </div>
          ))}
          {extraCaps > 0 && (
            <div className="text-[10px] text-text-muted pl-4">+{extraCaps} more</div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <span>⏱</span> {template.estimatedSetupMinutes} min
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${diffStyle}`}>
            {template.difficulty}
          </span>
          {template.requiresApproval && (
            <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
              ⚠ Approval
            </span>
          )}
        </div>

        {isDeployed ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              ✓ Deployed
            </span>
            <a
              href="/dashboard/agents"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-electric-500/15 text-electric-400 border border-electric-500/20 hover:bg-electric-500/25 transition-colors"
            >
              Open →
            </a>
          </div>
        ) : (
          <button
            onClick={() => onDeploy(template)}
            className="text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${template.color}dd, ${template.color}99)`,
              color: '#fff',
              boxShadow: `0 2px 8px ${template.color}33`,
            }}
          >
            Deploy →
          </button>
        )}
      </div>
    </div>
  )
}

// ═══ Deploy Wizard Modal (3-step) ═══

type ConnectConfig = Record<string, string>

type ConnectField = {
  key: string
  label: string
  placeholder: string
  type?: string
  hint?: string
  required?: boolean
  readOnly?: boolean
  value?: string
}

type ConnectSetup = {
  title: string
  description: string
  icon: string
  fields: ConnectField[]
}

// ── Step 1 extra behaviour fields per department ──────────────────────────────
function getStep1BehaviourFields(template: AgentTemplate): ConnectField[] {
  const base: ConnectField[] = [
    { key: 'notifyEmail', label: 'Alert & Approval Notifications', placeholder: 'you@company.com', hint: 'Receives alerts, approval requests, and error notifications' },
    { key: 'responseLanguage', label: 'Output Language', placeholder: 'English', hint: 'Language for all agent responses and reports' },
    { key: 'schedule', label: 'Run Schedule', placeholder: 'On demand (manual)', hint: 'On demand / Daily at 08:00 / Hourly / Real-time' },
  ]

  const dept = template.department

  if (dept === 'HR') return [...base,
    { key: 'hrRegion', label: 'Region / Country', placeholder: 'South Africa', hint: 'Ensures compliance with local labour law' },
    { key: 'escalationPath', label: 'HR Escalation Contact', placeholder: 'hr-manager@company.com' },
  ]
  if (dept === 'LEGAL') return [...base,
    { key: 'jurisdiction', label: 'Primary Jurisdiction(s)', placeholder: 'South Africa, UK', hint: 'Regulations and law the agent must apply' },
    { key: 'legalEscalation', label: 'Legal Counsel Escalation Email', placeholder: 'general-counsel@company.com', required: true },
  ]
  if (dept === 'FINANCE') return [...base,
    { key: 'financialYear', label: 'Financial Year End (month)', placeholder: 'February', hint: 'Used for period-end reporting alignment' },
    { key: 'currency', label: 'Primary Currency', placeholder: 'ZAR', hint: 'ISO 4217 code, e.g. ZAR, USD, GBP' },
  ]
  if (dept === 'RISK') return [...base,
    { key: 'riskAppetite', label: 'Risk Appetite Level', placeholder: 'Medium', hint: 'Low / Medium / High — sets thresholds for alerts' },
    { key: 'riskOwner', label: 'Risk Owner / CRO Email', placeholder: 'cro@company.com', required: true },
  ]
  if (dept === 'SECURITY') return [...base,
    { key: 'alertThreshold', label: 'Alert Severity Threshold', placeholder: 'High (recommended)', hint: 'LOW / MEDIUM / HIGH / CRITICAL — minimum level to escalate' },
    { key: 'securityContact', label: 'Security Incident Contact', placeholder: 'security@company.com', required: true },
  ]
  if (dept === 'COMPLIANCE') return [...base,
    { key: 'frameworks', label: 'Applicable Frameworks', placeholder: 'POPIA, SOC 2 Type II, ISO 27001', hint: 'Comma-separated list of frameworks this agent enforces' },
    { key: 'cco', label: 'Chief Compliance Officer Email', placeholder: 'cco@company.com', required: true },
  ]
  if (dept === 'PRODUCT') return [...base,
    { key: 'productArea', label: 'Product Area / Squad', placeholder: 'Payments Platform, Mobile App', hint: 'Scopes the agent to the right backlog and codebase' },
    { key: 'pmContact', label: 'Product Manager Email', placeholder: 'pm@company.com' },
  ]
  if (dept === 'ENGINEERING') return [...base,
    { key: 'techStack', label: 'Primary Tech Stack', placeholder: 'Node.js, React, PostgreSQL', hint: 'Helps the agent apply the right code standards' },
    { key: 'engLead', label: 'Engineering Lead Email', placeholder: 'techlead@company.com' },
  ]
  if (dept === 'QA') return [...base,
    { key: 'testFramework', label: 'Primary Test Framework', placeholder: 'Playwright / Cypress / Pytest / Jest', hint: 'Agent will generate tests in this framework' },
    { key: 'qaLead', label: 'QA Lead Email', placeholder: 'qa-lead@company.com' },
  ]
  if (dept === 'MARKETING') return [...base,
    { key: 'brandVoice', label: 'Brand Voice / Tone', placeholder: 'Professional, warm, and human', hint: 'The agent will apply this tone to all content it produces' },
    { key: 'targetAudience', label: 'Target Audience', placeholder: 'Enterprise CTOs and IT Directors', hint: 'Primary audience for generated content' },
  ]
  if (dept === 'DATA_ANALYTICS') return [...base,
    { key: 'dataClassification', label: 'Data Classification Level', placeholder: 'Confidential', hint: 'PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED — sets access guardrails' },
    { key: 'dataOwner', label: 'Data Owner / Head of Data Email', placeholder: 'data-owner@company.com' },
  ]
  if (dept === 'INFRA_OPS') return [...base,
    { key: 'environment', label: 'Target Environment(s)', placeholder: 'Production, Staging', hint: 'Environments this agent is authorised to act on' },
    { key: 'changeWindow', label: 'Preferred Change Window', placeholder: 'Sundays 01:00–04:00 SAST', hint: 'When the agent may perform automated changes' },
  ]
  if (dept === 'IT') return [...base,
    { key: 'itDomain', label: 'Company Domain', placeholder: 'acme.com', required: true, hint: 'Used for user lookup and access provisioning' },
    { key: 'itAdmin', label: 'IT Admin / Helpdesk Email', placeholder: 'it-admin@company.com', required: true },
  ]
  if (dept === 'EXECUTIVE') return [...base,
    { key: 'reportRecipients', label: 'Report Recipients', placeholder: 'ceo@company.com, board@company.com', hint: 'Comma-separated list of executive report recipients' },
    { key: 'reportFormat', label: 'Preferred Report Format', placeholder: 'PDF Summary', hint: 'PDF Summary / Slide Deck / Email Digest / Dashboard' },
  ]
  if (dept === 'OPERATIONS') return [...base,
    { key: 'approvalThreshold', label: 'Approval Threshold (ZAR)', placeholder: '50000', hint: 'Purchase orders above this value require human sign-off' },
    { key: 'opsManager', label: 'Operations Manager Email', placeholder: 'ops@company.com', required: true },
  ]
  if (dept === 'CUSTOMER_SUPPORT') return [...base,
    { key: 'supportHours', label: 'Support Hours', placeholder: 'Mon–Fri 08:00–18:00 SAST', hint: 'Outside these hours the agent handles queries autonomously' },
    { key: 'escalationEmail', label: 'Human Escalation Email / Queue', placeholder: 'support-team@company.com', required: true },
  ]

  return base
}

// ── Step 2 integration connect config per agent/department ─────────────────────
function getConnectConfig(template: AgentTemplate): ConnectSetup {
  const id = template.id
  const tags = template.tags.map(t => t.toLowerCase())
  const dept = template.department

  // ── Channel-specific (trumps department) ───────────────────────────────────
  if (tags.includes('whatsapp') || id.includes('whatsapp')) {
    return {
      title: 'Connect WhatsApp Business',
      description: 'Link your WhatsApp Business account so this agent can send and receive messages on your behalf.',
      icon: '💬',
      fields: [
        { key: 'phone', label: 'WhatsApp Business Phone Number', placeholder: '+27 11 000 0000', hint: 'Must be registered with Meta Business Manager', required: true },
        { key: 'metaBusinessId', label: 'Meta Business Account ID', placeholder: '1234567890123456', hint: 'Found in Meta Business Suite → Settings → Business Info', required: true },
        { key: 'accessToken', label: 'WhatsApp Cloud API Access Token', placeholder: 'EAAxxxxxxx…', type: 'password', hint: 'Generate in Meta Developers → WhatsApp → API Setup → Permanent Token', required: true },
        { key: 'webhookUrl', label: 'Webhook URL (copy & paste into Meta)', placeholder: 'Generated after deployment', readOnly: true, value: 'https://acme.agenticai.com/webhooks/whatsapp/bot_wa_connect', hint: 'Paste this URL into Meta Developers → Webhooks → Callback URL' },
      ],
    }
  }

  if (id.includes('chatbot-website') || (id.includes('website') && dept === 'CUSTOMER_SUPPORT')) {
    return {
      title: 'Connect Your Website',
      description: 'Add the chatbot to your website with a single embed snippet. No developer needed — just copy and paste.',
      icon: '🌐',
      fields: [
        { key: 'websiteUrl', label: 'Website URL', placeholder: 'https://yoursite.com', hint: 'Domain where the chatbot widget will appear', required: true },
        { key: 'brandColor', label: 'Brand Colour (hex)', placeholder: '#0d9488', hint: 'Chat bubble and header colour to match your site' },
        { key: 'greeting', label: 'Welcome Message', placeholder: 'Hi! 👋 How can I help you today?', hint: 'First message shown to every visitor' },
        { key: 'fallbackEmail', label: 'Human Escalation Email', placeholder: 'support@yourcompany.com', hint: 'Where the bot routes queries it cannot resolve', required: true },
      ],
    }
  }

  if (id.includes('helpdesk')) {
    return {
      title: 'Connect Service Desk',
      description: 'Link your ticketing system so the bot can create, update, and close tickets automatically on behalf of staff.',
      icon: '🎫',
      fields: [
        { key: 'ticketingSystem', label: 'Ticketing System', placeholder: 'Jira / Zendesk / ServiceNow / Freshdesk', hint: 'The platform your team uses to manage IT or HR tickets' },
        { key: 'apiUrl', label: 'API Base URL', placeholder: 'https://yourorg.atlassian.net/rest/api/3', required: true },
        { key: 'apiKey', label: 'API Key / Bearer Token', placeholder: 'ATATT3xFfGF0…', type: 'password', required: true },
        { key: 'defaultQueue', label: 'Default Ticket Queue / Project Key', placeholder: 'IT or HELPDESK', hint: 'Where new tickets are created by default' },
      ],
    }
  }

  if (tags.includes('ivr') || id.includes('ivr') || tags.includes('telephony')) {
    return {
      title: 'Connect Telephony Platform',
      description: 'Link your voice/telephony account so the IVR agent can handle inbound calls on your phone line.',
      icon: '📞',
      fields: [
        { key: 'twilioSid', label: 'Twilio Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true, hint: 'Found in Twilio Console → Account Info' },
        { key: 'twilioToken', label: 'Twilio Auth Token', placeholder: 'your_auth_token', type: 'password', required: true },
        { key: 'phoneNumber', label: 'Inbound Phone Number', placeholder: '+27 10 000 0000', hint: 'The number customers call — must be a Twilio number', required: true },
        { key: 'fallbackNumber', label: 'Human Fallback Number', placeholder: '+27 11 000 0001', hint: 'Where the IVR routes callers it cannot resolve' },
      ],
    }
  }

  if (tags.includes('crm') || tags.includes('salesforce') || id.includes('lead-qualifier')) {
    return {
      title: 'Connect CRM',
      description: 'Link your CRM so the agent can create leads, update contacts, and route qualified prospects to your sales team.',
      icon: '🤝',
      fields: [
        { key: 'crmPlatform', label: 'CRM Platform', placeholder: 'Salesforce / HubSpot / Pipedrive / Zoho CRM' },
        { key: 'crmApiUrl', label: 'CRM API URL / Instance', placeholder: 'https://yourorg.salesforce.com or https://api.hubapi.com', required: true },
        { key: 'crmToken', label: 'API Key / OAuth Token', placeholder: 'your_oauth_token', type: 'password', required: true },
        { key: 'leadOwner', label: 'Default Lead Owner Email', placeholder: 'sales@company.com', hint: 'New qualified leads will be assigned to this user' },
      ],
    }
  }

  // Generative, paste-based agents — no external system required to try in My Agents
  if (dept === 'CROSS_FUNCTIONAL') {
    return {
      title: 'Connect your workspace (optional)',
      description:
        'Optional: where your team keeps notes or docs, for future sync. You can test immediately by pasting text in My Agents — only your platform OpenAI key in .env is required.',
      icon: '🔌',
      fields: [
        { key: 'dataSourceUrl', label: 'Notes or docs (optional)', placeholder: 'e.g. Notion / Google Drive / SharePoint, or leave blank' },
        { key: 'contextNotes', label: 'Extra instructions (optional)', placeholder: 'e.g. Formal tone, South African English' },
      ],
    }
  }

  // ── Department-specific ────────────────────────────────────────────────────
  if (dept === 'HR') {
    return {
      title: 'Connect HR Information System',
      description: 'Link your HRIS so the agent can access employee records, policies, leave balances, and payroll data securely.',
      icon: '👥',
      fields: [
        { key: 'hrisProvider', label: 'HRIS Provider', placeholder: 'SAP SuccessFactors / Workday / BambooHR / Sage People', hint: 'Your core HR platform' },
        { key: 'hrisApiUrl', label: 'HRIS API Endpoint', placeholder: 'https://api.successfactors.com/odata/v2/', required: true },
        { key: 'hrisToken', label: 'API Token / OAuth Key', placeholder: 'Bearer ey…', type: 'password', required: true },
        { key: 'hrEmailDomain', label: 'Company Email Domain', placeholder: '@acme.com', hint: 'Used to verify employee identity during interactions' },
      ],
    }
  }

  if (dept === 'LEGAL') {
    return {
      title: 'Connect Document Management',
      description: 'Link your document management system and contract repository so the agent can access, review, and draft legal documents.',
      icon: '⚖️',
      fields: [
        { key: 'dmsProvider', label: 'Document Management System', placeholder: 'SharePoint / NetDocuments / iManage / Google Drive', hint: 'Where legal documents and contracts are stored' },
        { key: 'dmsApiUrl', label: 'DMS / SharePoint Site URL', placeholder: 'https://acme.sharepoint.com/sites/legal', required: true },
        { key: 'dmsToken', label: 'Access Token / Service Account Key', placeholder: 'Bearer ey… or service account JSON', type: 'password', required: true },
        { key: 'contractFolder', label: 'Contract Repository Path', placeholder: '/Legal/Contracts/Active', hint: 'Folder path where active contracts are stored' },
      ],
    }
  }

  if (dept === 'FINANCE') {
    return {
      title: 'Connect Accounting & ERP',
      description: 'Securely connect your ERP or accounting system so the agent can access financial data, invoices, and reports.',
      icon: '💰',
      fields: [
        { key: 'erpProvider', label: 'ERP / Accounting System', placeholder: 'Sage / Xero / SAP / Oracle / QuickBooks', hint: 'Your primary financial management platform' },
        { key: 'erpApiUrl', label: 'API Endpoint', placeholder: 'https://api.xero.com/api.xro/2.0/', required: true },
        { key: 'erpClientId', label: 'Client ID / API Key', placeholder: 'your_client_id', required: true },
        { key: 'erpClientSecret', label: 'Client Secret', placeholder: 'your_client_secret', type: 'password', required: true },
      ],
    }
  }

  if (dept === 'RISK') {
    return {
      title: 'Connect Risk Management System',
      description: 'Integrate with your GRC platform so the agent can access risk registers, incidents, controls, and assessment data.',
      icon: '⚠️',
      fields: [
        { key: 'grcPlatform', label: 'GRC / Risk Platform', placeholder: 'ServiceNow GRC / Archer / MetricStream / Riskonnect', hint: 'Your Governance, Risk & Compliance platform' },
        { key: 'grcApiUrl', label: 'Platform API Endpoint', placeholder: 'https://acme.service-now.com/api/now/', required: true },
        { key: 'grcToken', label: 'API Token / OAuth Key', placeholder: 'your_api_token', type: 'password', required: true },
        { key: 'riskRegisterPath', label: 'Risk Register Identifier', placeholder: 'RISK_TABLE or risk_register_v2', hint: 'The table/dataset name that holds your risk register' },
      ],
    }
  }

  if (dept === 'SECURITY') {
    return {
      title: 'Connect Security Stack',
      description: 'Link your SIEM, EDR, or vulnerability scanner so the agent can ingest and respond to security events.',
      icon: '🔐',
      fields: [
        { key: 'siemPlatform', label: 'SIEM / Security Platform', placeholder: 'Splunk / Microsoft Sentinel / CrowdStrike / Tenable / SentinelOne', hint: 'Primary security monitoring platform' },
        { key: 'siemApiUrl', label: 'Platform API URL', placeholder: 'https://api.crowdstrike.com or https://acme.splunkcloud.com:8089', required: true },
        { key: 'siemApiKey', label: 'API Key / Bearer Token', placeholder: 'your_api_key', type: 'password', required: true },
        { key: 'siemQuery', label: 'Default Alert Query / Index', placeholder: 'index=security_alerts severity>=high', hint: 'SPL / KQL query or alert index the agent will monitor' },
      ],
    }
  }

  if (dept === 'COMPLIANCE') {
    return {
      title: 'Connect Compliance Platform',
      description: 'Link your compliance management system to access controls, evidence requirements, audit trails, and policy documents.',
      icon: '✅',
      fields: [
        { key: 'compliancePlatform', label: 'Compliance Platform', placeholder: 'Vanta / Drata / Hyperproof / Tugboat Logic / ServiceNow GRC', hint: 'Your compliance automation or GRC platform' },
        { key: 'complianceApiUrl', label: 'Platform API URL', placeholder: 'https://api.vanta.com/v1/', required: true },
        { key: 'complianceToken', label: 'API Key', placeholder: 'vanta_token_…', type: 'password', required: true },
        { key: 'policyRepoUrl', label: 'Policy Document Repository URL', placeholder: 'https://acme.sharepoint.com/sites/compliance/policies', hint: 'Where policy documents are stored — agent reads these for checks' },
      ],
    }
  }

  if (dept === 'PRODUCT') {
    return {
      title: 'Connect Product & Project Tools',
      description: 'Link your backlog, product analytics, and user feedback tools so the agent can access roadmap data, user stories, and insights.',
      icon: '🗺️',
      fields: [
        { key: 'pmTool', label: 'Product Management Tool', placeholder: 'Jira / Linear / ProductBoard / Notion / ClickUp', hint: 'Your primary backlog and roadmap tool' },
        { key: 'pmApiUrl', label: 'API URL / Workspace', placeholder: 'https://acme.atlassian.net or https://api.linear.app', required: true },
        { key: 'pmToken', label: 'API Token', placeholder: 'your_api_token', type: 'password', required: true },
        { key: 'analyticsSource', label: 'Product Analytics Tool (optional)', placeholder: 'Mixpanel / Amplitude / PostHog / GA4', hint: 'Connects user behaviour data to inform product decisions' },
      ],
    }
  }

  if (dept === 'MARKETING') {
    return {
      title: 'Connect Marketing Stack',
      description:
        'Optional: link CRM, email, and analytics for live data and attribution. The copywriter still works without these — you can add or change them later in agent settings.',
      icon: '📣',
      fields: [
        {
          key: 'crmPlatform',
          label: 'CRM / Marketing Automation',
          placeholder: 'Not connected yet / HubSpot / ActiveCampaign / Mailchimp',
          hint: 'Leave blank or note your tool; connect APIs when you are ready',
        },
        {
          key: 'crmApiUrl',
          label: 'Platform API URL',
          placeholder: 'https://api.hubapi.com (optional for now)',
          hint: 'Only needed when the agent should read or write your live marketing data',
        },
        {
          key: 'crmToken',
          label: 'API Key / OAuth Token',
          placeholder: 'Optional — add in Settings later',
          type: 'password',
          hint: 'Stays on this device until you save; configure when your IT team shares a key',
        },
        {
          key: 'analyticsId',
          label: 'Analytics Property ID (optional)',
          placeholder: 'G-XXXXXXXXXX (GA4) or 1234567 (Mixpanel)',
          hint: 'For campaign performance data and attribution — not required to draft copy',
        },
      ],
    }
  }

  if (dept === 'DATA_ANALYTICS') {
    return {
      title: 'Connect Data Warehouse',
      description: 'Connect your data warehouse or BI platform so the agent can query, analyse, and report on your data.',
      icon: '📊',
      fields: [
        { key: 'dataProvider', label: 'Data Platform', placeholder: 'BigQuery / Snowflake / Redshift / Databricks / dbt Cloud', hint: 'Your primary data warehouse or analytics platform' },
        { key: 'connectionString', label: 'Connection String / Project ID', placeholder: 'myproject.mydataset or snowflake://account/db', required: true },
        { key: 'serviceAccountKey', label: 'Service Account / API Key', placeholder: '{ "type": "service_account", … }', type: 'password', required: true, hint: 'Service account with read access to the required datasets' },
        { key: 'defaultDataset', label: 'Default Dataset / Schema', placeholder: 'analytics_prod', hint: 'The primary dataset this agent will query' },
      ],
    }
  }

  if (dept === 'ENGINEERING') {
    return {
      title: 'Connect Code Repository & CI/CD',
      description: 'Link your Git platform so the agent can review PRs, scan dependencies, and generate documentation from your codebase.',
      icon: '💻',
      fields: [
        { key: 'gitProvider', label: 'Git Platform', placeholder: 'GitHub / GitLab / Azure DevOps / Bitbucket', hint: 'Your source control platform' },
        { key: 'repoUrl', label: 'Repository URL', placeholder: 'https://github.com/your-org/your-repo', required: true },
        { key: 'gitToken', label: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxx', type: 'password', required: true, hint: 'Needs repo:read, PR:write permissions minimum' },
        { key: 'cicdTool', label: 'CI/CD Platform (optional)', placeholder: 'GitHub Actions / GitLab CI / Jenkins / CircleCI', hint: 'The agent can trigger and analyse pipeline runs' },
      ],
    }
  }

  if (dept === 'QA') {
    return {
      title: 'Connect Testing & Repository',
      description: 'Link your test management and code repository so the agent can generate tests, analyse results, and track quality metrics.',
      icon: '🧪',
      fields: [
        { key: 'testManagement', label: 'Test Management Tool', placeholder: 'Jira Xray / TestRail / Zephyr / qTest / Notion', hint: 'Where test cases and results are tracked' },
        { key: 'testApiUrl', label: 'Test Management API URL', placeholder: 'https://yourorg.atlassian.net/rest/raven/1.0/', required: true },
        { key: 'testToken', label: 'API Token', placeholder: 'your_api_token', type: 'password', required: true },
        { key: 'repoUrl', label: 'Code Repository URL', placeholder: 'https://github.com/your-org/your-repo', hint: 'For test generation from source code and PR coverage' },
      ],
    }
  }

  if (dept === 'INFRA_OPS') {
    return {
      title: 'Connect Cloud & Monitoring',
      description: 'Link your cloud provider and monitoring stack so the agent can access infrastructure metrics, alerts, and resource data.',
      icon: '☁️',
      fields: [
        { key: 'cloudProvider', label: 'Cloud Provider', placeholder: 'AWS / Azure / GCP / On-premise', hint: 'Primary infrastructure platform' },
        { key: 'cloudCredentials', label: 'Cloud Access Key / Service Account', placeholder: 'AKIAXXX… or service account JSON key', type: 'password', required: true, hint: 'Read access to compute, storage, and monitoring APIs' },
        { key: 'monitoringTool', label: 'Monitoring / Observability Platform', placeholder: 'Datadog / Grafana Cloud / Prometheus / CloudWatch / New Relic' },
        { key: 'monitoringApiKey', label: 'Monitoring API Key', placeholder: 'your_datadog_api_key', type: 'password', hint: 'Needed to read alerts, metrics, and dashboards' },
      ],
    }
  }

  if (dept === 'IT') {
    return {
      title: 'Connect Identity & Directory',
      description: 'Link your identity provider and ITSM so the agent can manage access requests, account provisioning, and helpdesk tickets.',
      icon: '🔑',
      fields: [
        { key: 'idpProvider', label: 'Identity Provider', placeholder: 'Microsoft Entra ID / Okta / Google Workspace / JumpCloud', hint: 'Your primary identity and directory platform' },
        { key: 'tenantId', label: 'Tenant ID / Domain', placeholder: 'acme.onmicrosoft.com or your_okta_domain', required: true },
        { key: 'clientId', label: 'App Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
        { key: 'clientSecret', label: 'Client Secret', placeholder: 'your_client_secret', type: 'password', required: true, hint: 'Needs User.ReadWrite and GroupMember.ReadWrite.All permissions' },
      ],
    }
  }

  if (dept === 'EXECUTIVE') {
    return {
      title: 'Connect BI & Business Data',
      description: 'Link your BI platform and data sources so the agent can pull live metrics for board reports and executive dashboards.',
      icon: '📈',
      fields: [
        { key: 'biPlatform', label: 'BI / Reporting Platform', placeholder: 'Power BI / Tableau / Looker / Qlik / Google Looker Studio', hint: 'Your primary executive reporting tool' },
        { key: 'biWorkspaceUrl', label: 'Workspace / Server URL', placeholder: 'https://app.powerbi.com/groups/your-workspace or https://acme.tableau.com', required: true },
        { key: 'biToken', label: 'API Token / Service Account', placeholder: 'your_service_account_token', type: 'password', required: true },
        { key: 'kpiSource', label: 'KPI Data Source (optional)', placeholder: 'BigQuery project ID or Snowflake schema', hint: 'Additional data source for raw KPI data beyond the BI tool' },
      ],
    }
  }

  if (dept === 'OPERATIONS') {
    return {
      title: 'Connect ERP & Procurement',
      description: 'Link your ERP and procurement platform so the agent can manage purchase orders, vendors, and approval workflows.',
      icon: '⚙️',
      fields: [
        { key: 'erpSystem', label: 'ERP / Procurement System', placeholder: 'SAP / Oracle / Microsoft Dynamics / Coupa / SAP Ariba', hint: 'Your operations and supply chain management platform' },
        { key: 'erpApiUrl', label: 'ERP API Endpoint', placeholder: 'https://acme.api.s4hana.cloud/sap/opu/odata/', required: true },
        { key: 'erpClientId', label: 'Service Account / Client ID', placeholder: 'your_client_id', required: true },
        { key: 'erpClientSecret', label: 'Client Secret / Password', placeholder: 'your_password', type: 'password', required: true },
      ],
    }
  }

  if (dept === 'CUSTOMER_SUPPORT') {
    return {
      title: 'Connect CRM & Support Platform',
      description: 'Link your CRM and support platform so the agent can access customer records, tickets, and conversation history.',
      icon: '🎧',
      fields: [
        { key: 'supportPlatform', label: 'CRM / Support Platform', placeholder: 'Salesforce / Zendesk / Freshdesk / Intercom / HubSpot', hint: 'Primary customer support and CRM platform' },
        { key: 'supportApiUrl', label: 'Platform API URL', placeholder: 'https://yoursubdomain.zendesk.com/api/v2/ or https://yourinstance.salesforce.com', required: true },
        { key: 'supportToken', label: 'API Key / OAuth Token', placeholder: 'your_api_token', type: 'password', required: true },
        { key: 'escalationQueue', label: 'Human Escalation Queue / Team ID', placeholder: 'Tier 2 Support or team_id_123', hint: 'Where the agent routes tickets it cannot resolve' },
      ],
    }
  }

  // ── Default fallback ───────────────────────────────────────────────────────
  return {
    title: 'Configure Integration',
    description: 'Connect this agent to the data sources it needs to operate.',
    icon: '🔌',
    fields: [
      { key: 'dataSourceUrl', label: 'Primary Data Source URL', placeholder: 'https://your-system.com/api', hint: 'The main system this agent will read from or write to' },
      { key: 'apiKey', label: 'API Key / Token', placeholder: 'your_api_key', type: 'password', required: true },
      { key: 'llmModel', label: 'AI Model Override (optional)', placeholder: 'GPT-4o (default)', hint: 'gpt-4o / claude-3-5-sonnet / gemini-1.5-pro' },
      { key: 'contextNotes', label: 'Custom Instructions (optional)', placeholder: 'e.g. Always respond in formal English. Use our company name Acme Corp.' },
    ],
  }
}

function DeployModal({
  template,
  customName,
  onCustomName,
  deploying,
  onCancel,
  onDeploy,
}: {
  template: AgentTemplate
  customName: string
  onCustomName: (v: string) => void
  deploying: boolean
  onCancel: () => void
  onDeploy: (markets: string[], apps: string[]) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [connectConfig, setConnectConfig] = useState<ConnectConfig>({})
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set(['za']))
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set(['za']))
  const dept = DEPT_CONFIG[template.department]
  const connectSetup = getConnectConfig(template)
  const behaviourFields = getStep1BehaviourFields(template)
  const marketsByRegion = getMarketsByRegion()
  const compatibleApps = getCompatibleApps(template.department)

  const setField = (key: string, value: string) =>
    setConnectConfig(prev => ({ ...prev, [key]: value }))

  const toggleMarket = (id: string) => {
    setSelectedMarkets(prev => {
      const next = new Set(prev)
      if (next.has(id)) { if (next.size > 1) next.delete(id) }
      else next.add(id)
      return next
    })
    // Auto-expand when selecting a market
    setExpandedMarkets(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const toggleMarketExpand = (id: string) =>
    setExpandedMarkets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const toggleApp = (appId: string) =>
    setSelectedApps(prev => {
      const next = new Set(prev)
      if (next.has(appId)) next.delete(appId); else next.add(appId)
      return next
    })

  const appsForMarket = (marketId: string) =>
    compatibleApps.filter(a => a.market === marketId)

  const STEPS = ['Configure', 'Connect', 'Markets', 'Review & Deploy']

  const headerGradient = `linear-gradient(135deg, ${template.color}18 0%, transparent 60%)`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,10,20,0.90)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="relative w-full max-w-xl animate-scale-in flex flex-col"
        style={{
          background: 'rgba(13,19,36,0.99)',
          border: `1px solid ${template.color}40`,
          borderRadius: '24px',
          boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 60px ${template.color}18`,
          maxHeight: '92vh',
        }}
      >
        {/* ── Header ── */}
        <div className="p-6 border-b border-white/[0.06] flex-shrink-0" style={{ background: headerGradient }}>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
              style={{ background: `${template.color}20`, border: `1px solid ${template.color}40` }}
            >
              {template.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-text-primary truncate">{template.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DEPT_BADGE_STYLE[template.department] ?? ''}`}>
                  {dept?.icon} {template.department === 'CROSS_FUNCTIONAL' ? 'All Teams' : template.department.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_STYLE[template.difficulty]}`}>
                  {template.difficulty}
                </span>
                {template.estimatedSetupMinutes && (
                  <span className="text-[10px] text-text-muted">⏱ {template.estimatedSetupMinutes} min setup</span>
                )}
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Step progress bar */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const stepNum = (i + 1) as 1 | 2 | 3 | 4
              const isActive = step === stepNum
              const isDone = step > stepNum
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200"
                      style={{
                        background: isDone ? template.color : isActive ? `${template.color}30` : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${isDone || isActive ? template.color : 'rgba(255,255,255,0.12)'}`,
                        color: isDone ? '#fff' : isActive ? template.color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {isDone ? '✓' : stepNum}
                    </div>
                    <span className={`text-[11px] font-medium hidden sm:block ${isActive ? 'text-text-primary' : isDone ? 'text-text-secondary' : 'text-text-muted'}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1" style={{ background: step > stepNum ? template.color : 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── STEP 1: Configure ── */}
          {step === 1 && (
            <>
              {/* Capabilities summary */}
              <div className="p-4 rounded-xl" style={{ background: `${template.color}0c`, border: `1px solid ${template.color}22` }}>
                <p className="text-xs text-text-muted leading-relaxed mb-3">{template.description}</p>
                <div className="grid grid-cols-1 gap-1">
                  {template.capabilities.map(cap => (
                    <div key={cap} className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                        style={{ background: `${template.color}25`, color: template.color }}>✓</span>
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent name */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Agent Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">Agent Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => onCustomName(e.target.value)}
                      placeholder={template.name}
                      className="input-field text-sm"
                    />
                    <p className="text-[11px] text-text-muted mt-1">Leave blank to use the default template name.</p>
                  </div>
                </div>
              </div>

              {/* Department-specific behaviour fields */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Behaviour Settings</h3>
                <div className="space-y-3">
                  {behaviourFields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-text-secondary flex items-center gap-1 mb-1.5">
                        {field.label}
                        {field.required && <span style={{ color: template.color }}>*</span>}
                      </label>
                      <input
                        type={field.type ?? 'text'}
                        value={connectConfig[field.key] ?? ''}
                        onChange={e => setField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="input-field text-sm w-full"
                      />
                      {field.hint && <p className="text-[11px] text-text-muted mt-1">💡 {field.hint}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Example prompts */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Try asking it...</h3>
                <div className="space-y-2">
                  {template.exampleInputs.slice(0, 2).map((ex, i) => (
                    <div key={i} className="text-xs text-text-muted px-3 py-2 rounded-lg italic"
                      style={{ background: `${template.color}0d`, border: `1px solid ${template.color}1e` }}>
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>

              {template.requiresApproval && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-400/90 leading-relaxed">
                    This agent requires admin approval before going fully live. It will appear in My Agents with a <strong>Pending</strong> status until approved.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Connect ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl mb-1" style={{ background: `${template.color}0f`, border: `1px solid ${template.color}25` }}>
                <span className="text-2xl">{connectSetup.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{connectSetup.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{connectSetup.description}</p>
                </div>
              </div>

              {!connectSetup.fields.some(f => f.required) && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                  <span className="text-emerald-400 text-sm mt-0.5">✓</span>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    None of these are required. Leave them empty to continue — you can add CRM or analytics in agent settings when you have the details.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {connectSetup.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-text-secondary flex items-center gap-1 mb-1.5">
                      {field.label}
                      {field.required && <span style={{ color: template.color }}>*</span>}
                    </label>
                    <input
                      type={field.type ?? 'text'}
                      value={field.readOnly ? (field.value ?? '') : (connectConfig[field.key] ?? '')}
                      onChange={e => !field.readOnly && setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      className={`input-field text-sm w-full ${field.readOnly ? 'opacity-60 cursor-default select-all' : ''}`}
                      style={field.readOnly ? { fontFamily: 'monospace', fontSize: '11px' } : undefined}
                    />
                    {field.hint && (
                      <p className="text-[11px] text-text-muted mt-1">💡 {field.hint}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/20 mt-2">
                <span className="text-blue-400 text-sm mt-0.5">🔒</span>
                <p className="text-xs text-blue-400/80 leading-relaxed">
                  All credentials are encrypted at rest using AES-256 and are never stored in plain text. You can update or revoke them at any time from the agent settings.
                </p>
              </div>
            </>
          )}

          {/* ── STEP 3: Markets & Apps ── */}
          {step === 3 && (
            <>
              {/* Header explanation */}
              <div className="flex items-start gap-3 p-4 rounded-xl mb-1" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-2xl flex-shrink-0">🌍</span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Select Market & Apps</h3>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    Pick which market to activate this agent in, then choose the specific apps or channels where it will appear. South Africa is your live pilot market.
                  </p>
                </div>
              </div>

              {/* 2-col layout: markets left, apps right */}
              <div className="flex gap-3" style={{ minHeight: '320px' }}>

                {/* ── Left: Markets column ── */}
                <div className="w-44 flex-shrink-0 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Markets</p>
                  {MARKETS.map(market => {
                    const isSelected = selectedMarkets.has(market.id)
                    const isExpanded = expandedMarkets.has(market.id)
                    const appsInMarket = appsForMarket(market.id)
                    const selectedAppCount = appsInMarket.filter(a => selectedApps.has(a.id)).length
                    const isComing = market.status === 'coming_soon'
                    return (
                      <button
                        key={market.id}
                        disabled={isComing}
                        onClick={() => { toggleMarket(market.id); toggleMarketExpand(market.id) }}
                        className="w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150 border"
                        style={{
                          background: isExpanded ? `${STATUS_COLOR[market.status]}12` : 'rgba(255,255,255,0.02)',
                          borderColor: isExpanded ? STATUS_COLOR[market.status] : 'rgba(255,255,255,0.07)',
                          opacity: isComing ? 0.45 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base flex-shrink-0">{market.flag}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-text-primary truncate leading-tight">{market.name}</div>
                              <div className="text-[9px] font-bold mt-0.5" style={{ color: STATUS_COLOR[market.status] }}>
                                {market.status === 'pilot' ? '● Pilot' : market.status === 'available' ? '● Available' : '○ Soon'}
                              </div>
                            </div>
                          </div>
                          {selectedAppCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1"
                              style={{ background: `${STATUS_COLOR[market.status]}20`, color: STATUS_COLOR[market.status] }}>
                              {selectedAppCount}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* ── Right: Apps column ── */}
                <div className="flex-1 min-w-0">
                  {Array.from(expandedMarkets).map(marketId => {
                    const market = MARKETS.find(m => m.id === marketId)
                    if (!market) return null
                    const apps = appsForMarket(marketId)
                    return (
                      <div key={marketId}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">{market.flag}</span>
                          <span className="text-xs font-bold text-text-primary">{market.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: `${STATUS_COLOR[market.status]}18`, color: STATUS_COLOR[market.status] }}>
                            {apps.length} app{apps.length !== 1 ? 's' : ''} available
                          </span>
                        </div>

                        {apps.length === 0 ? (
                          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs text-text-muted">No compatible apps registered for this market yet.</p>
                            <button className="mt-2 text-xs font-medium" style={{ color: template.color }}>+ Register an app</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {apps.map((app: AppProperty) => {
                              const isAppSelected = selectedApps.has(app.id)
                              const isOwner = app.ownerDivision === template.department
                              return (
                                <button
                                  key={app.id}
                                  onClick={() => toggleApp(app.id)}
                                  className="w-full text-left rounded-xl px-3 py-3 transition-all duration-150 border"
                                  style={{
                                    background: isAppSelected ? `${app.color}10` : 'rgba(255,255,255,0.02)',
                                    borderColor: isAppSelected ? app.color : 'rgba(255,255,255,0.07)',
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* App icon + checkbox */}
                                    <div className="relative flex-shrink-0 mt-0.5">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                                        style={{ background: `${app.color}18`, border: `1px solid ${app.color}30` }}>
                                        {APP_TYPE_ICON[app.type]}
                                      </div>
                                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border flex items-center justify-center"
                                        style={{
                                          borderColor: isAppSelected ? app.color : 'rgba(255,255,255,0.2)',
                                          background: isAppSelected ? app.color : 'rgba(13,19,36,0.9)',
                                        }}>
                                        {isAppSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                                      </div>
                                    </div>

                                    {/* App info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-semibold text-text-primary">{app.name}</span>
                                        {isOwner && (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                            style={{ background: `${app.color}20`, color: app.color }}>
                                            Your app
                                          </span>
                                        )}
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                          style={{ background: `${APP_STATUS_COLOR[app.status]}15`, color: APP_STATUS_COLOR[app.status] }}>
                                          {APP_STATUS_LABEL[app.status]}
                                        </span>
                                      </div>

                                      <div className="text-[10px] text-text-muted mt-0.5 truncate">
                                        {app.url ?? app.identifier ?? APP_TYPE_LABEL[app.type]}
                                      </div>

                                      {/* Integration methods */}
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {app.integrationMethods.map(m => (
                                          <span key={m} className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-white/[0.05] text-text-muted">
                                            {INTEGRATION_LABEL[m]}
                                          </span>
                                        ))}
                                      </div>

                                      {/* Integration instructions when selected */}
                                      {isAppSelected && (
                                        <div className="mt-2 pt-2 border-t border-white/[0.06]">
                                          {app.integrationMethods.includes('js-snippet') && (
                                            <div>
                                              <p className="text-[10px] font-semibold mb-1" style={{ color: app.color }}>
                                                🔖 Paste into your site's &lt;head&gt;:
                                              </p>
                                              <div className="font-mono text-[9px] p-2 rounded-lg text-text-muted leading-relaxed select-all"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                {'<script src="https://agents.mycompany.co.za/widget.js"'}<br />
                                                {'  data-agent-id="[generated-on-deploy]"'}<br />
                                                {'  data-market="' + marketId + '"><\/script>'}
                                              </div>
                                            </div>
                                          )}
                                          {app.integrationMethods.includes('mobile-sdk') && (
                                            <p className="text-[10px]" style={{ color: app.color }}>
                                              📦 SDK integration guide will be emailed after deployment.
                                            </p>
                                          )}
                                          {app.integrationMethods.includes('whatsapp-cloud') && (
                                            <p className="text-[10px]" style={{ color: app.color }}>
                                              💬 WhatsApp webhook will be auto-registered on deployment.
                                            </p>
                                          )}
                                          {app.integrationMethods.includes('ussd-gateway') && (
                                            <p className="text-[10px]" style={{ color: app.color }}>
                                              📟 USSD flow will be linked to shortcode {app.identifier}.
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Users stat */}
                                    {(app.monthlyUsers ?? 0) > 0 && (
                                      <div className="text-right flex-shrink-0">
                                        <div className="text-xs font-bold text-text-primary">{(app.monthlyUsers ?? 0).toLocaleString()}</div>
                                        <div className="text-[9px] text-text-muted">users/mo</div>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {expandedMarkets.size === 0 && (
                    <div className="h-full flex items-center justify-center rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                      <p className="text-xs text-text-muted text-center px-4">
                        ← Select a market to see<br />its available apps & channels
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary footer */}
              {selectedApps.size > 0 && (
                <div className="px-4 py-3 rounded-xl" style={{ background: `${template.color}0a`, border: `1px solid ${template.color}25` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: template.color }}>
                    ✓ Deploying to {selectedApps.size} app{selectedApps.size !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedApps).map(appId => {
                      const a = APP_REGISTRY.find(x => x.id === appId)
                      return a ? (
                        <span key={appId} className="text-[11px] px-2 py-0.5 rounded-lg text-text-secondary"
                          style={{ background: `${a.color}15` }}>
                          {APP_TYPE_ICON[a.type]} {a.shortName}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {selectedApps.size === 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    Select at least one app or channel above. You can also deploy to multiple apps — for example, both the website and WhatsApp line.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── STEP 4: Review & Deploy ── */}
          {step === 4 && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Deployment Summary</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Agent Name', value: customName || template.name },
                    { label: 'Department', value: template.department.replace(/_/g, ' ') },
                    { label: 'Markets', value: MARKETS.filter(m => selectedMarkets.has(m.id)).map(m => `${m.flag} ${m.name}`).join(', ') || '🇿🇦 South Africa' },
                    { label: 'Apps / Channels', value: selectedApps.size > 0 ? Array.from(selectedApps).map(id => APP_REGISTRY.find(a => a.id === id)?.shortName ?? id).join(', ') : 'All compatible' },
                    { label: 'Difficulty', value: template.difficulty },
                    { label: 'Setup Time', value: `~${template.estimatedSetupMinutes} min` },
                    { label: 'Approval Required', value: template.requiresApproval ? 'Yes — pending admin sign-off' : 'No — goes live immediately' },
                    ...behaviourFields.filter(f => connectConfig[f.key]).slice(0, 3).map(f => ({
                      label: f.label,
                      value: f.type === 'password' ? '••••••••••' : (connectConfig[f.key] || '—'),
                    })),
                    ...connectSetup.fields.filter(f => !f.readOnly && connectConfig[f.key]).slice(0, 3).map(f => ({
                      label: f.label,
                      value: f.type === 'password' ? '••••••••••' : (connectConfig[f.key] || '—'),
                    })),
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-xs text-text-muted">{row.label}</span>
                      <span className="text-xs font-medium text-text-primary capitalize max-w-[60%] text-right truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: `${template.color}0d`, border: `1px solid ${template.color}25` }}>
                <h4 className="text-xs font-semibold mb-2" style={{ color: template.color }}>What happens next</h4>
                <ol className="space-y-1.5">
                  {[
                    template.requiresApproval ? 'Your admin will be notified to review and approve this agent.' : 'Agent will go live immediately after deployment.',
                    'The agent appears in your My Agents dashboard.',
                    'You can run, pause, or adjust settings at any time.',
                    'Activity logs and usage stats are available in Analytics.',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="text-[10px] font-bold mt-0.5 flex-shrink-0" style={{ color: template.color }}>{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-4 border-t border-white/[0.06] flex gap-3 flex-shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => (s - 1) as 1 | 2 | 3 | 4)}
              className="btn-secondary px-5 text-sm py-2.5"
              disabled={deploying}
            >
              ← Back
            </button>
          ) : (
            <button onClick={onCancel} className="btn-secondary flex-1 text-sm py-2.5" disabled={deploying}>
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(s => (s + 1) as 2 | 3 | 4)}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all duration-150"
              style={{
                background: `linear-gradient(135deg, ${template.color}, ${template.color}bb)`,
                color: '#fff',
                boxShadow: `0 4px 16px ${template.color}44`,
              }}
            >
              {step === 1 ? 'Next: Connect →' : step === 2 ? 'Next: Markets →' : 'Next: Review →'}
            </button>
          ) : (
            <button
              onClick={() => onDeploy(Array.from(selectedMarkets), Array.from(selectedApps))}
              disabled={deploying}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all duration-150"
              style={{
                background: deploying
                  ? 'rgba(59,130,246,0.3)'
                  : `linear-gradient(135deg, ${template.color}, ${template.color}bb)`,
                color: '#fff',
                boxShadow: deploying ? 'none' : `0 4px 16px ${template.color}44`,
              }}
            >
              {deploying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying…
                </>
              ) : (
                <>🚀 Deploy Agent</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}



// ═══ Page ═══

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [activeTab, setActiveTab] = useState<'for-you' | 'all' | 'deployed'>('for-you')
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [approvalFilter, setApprovalFilter] = useState(false)
  const [deployingTemplate, setDeployingTemplate] = useState<AgentTemplate | null>(null)
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set())
  const [customName, setCustomName] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const loadDeployedIds = useCallback(() => {
    try {
      const raw = localStorage.getItem('agentic_deployed_v2')
      if (!raw) return
      const agents = JSON.parse(raw) as { templateId?: string }[]
      setDeployedIds(new Set(agents.map(a => a.templateId ?? '').filter(Boolean)))
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data.user) })
      .catch(() => {})
      .finally(() => setLoadingUser(false))
    loadDeployedIds()
  }, [loadDeployedIds])

  // ─── Filtering ───────────────────────────────────

  const visibleTemplates = ALL_TEMPLATES.filter(t => {
    if (activeTab === 'for-you') {
      const userDept = user?.department ?? ''
      return t.crossFunctional || t.department === userDept || t.department === 'CROSS_FUNCTIONAL'
    }
    if (activeTab === 'deployed') return deployedIds.has(t.id)
    return true
  }).filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }).filter(t => difficultyFilter === 'all' || t.difficulty === difficultyFilter)
    .filter(t => !approvalFilter || !t.requiresApproval)

  // Sort: featured first
  const sortedTemplates = [...visibleTemplates].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return 0
  })

  // ─── Deploy handler ───────────────────────────────

  async function handleDeploy(markets: string[] = ['za'], apps: string[] = []) {
    if (!deployingTemplate || !user) return
    setDeploying(true)
    await new Promise(r => setTimeout(r, 900))
    try {
      const existing = JSON.parse(localStorage.getItem('agentic_deployed_v2') || '[]')
      existing.push({
        instanceId: `inst_${Date.now()}`,
        templateId: deployingTemplate.id,
        name: customName.trim() || deployingTemplate.name,
        department: deployingTemplate.department,
        icon: deployingTemplate.icon,
        color: deployingTemplate.color,
        status: deployingTemplate.requiresApproval ? 'pending' : 'active',
        deployedAt: new Date().toISOString(),
        deployedBy: user.email,
        markets,
        apps,
        config: {},
        runCount: 0,
        lastRunAt: null,
      })
      localStorage.setItem('agentic_deployed_v2', JSON.stringify(existing))
      loadDeployedIds()

      // Also persist to DB (best-effort — localStorage is the primary fallback)
      try {
        await fetch('/api/agents/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: deployingTemplate.id,
            name: customName.trim() || deployingTemplate.name,
            department: deployingTemplate.department,
            icon: deployingTemplate.icon,
            color: deployingTemplate.color,
            status: deployingTemplate.requiresApproval ? 'pending' : 'active',
            markets,
            apps,
            config: {},
          }),
        })
      } catch {
        // localStorage already saved — silent fallback
      }

      addToast(`${deployingTemplate.icon} ${customName.trim() || deployingTemplate.name} deployed successfully!`)
    } catch {
      addToast('Failed to deploy agent. Please try again.', 'error')
    }
    setDeploying(false)
    setDeployingTemplate(null)
    setCustomName('')
  }

  // ─── Department hero data ──────────────────────────

  const deptKey = user?.department ?? ''
  const deptConf = DEPT_CONFIG[deptKey]
  const deptAgentCount = ALL_TEMPLATES.filter(t =>
    t.crossFunctional || t.department === deptKey || t.department === 'CROSS_FUNCTIONAL'
  ).length

  const heroBanner = deptConf
    ? { gradient: deptConf.gradient, icon: deptConf.icon, label: deptConf.label, count: deptAgentCount }
    : { gradient: 'from-navy-700 to-navy-800', icon: '🤖', label: 'All Agents', count: ALL_TEMPLATES.length }

  // ─── Tab counts ────────────────────────────────────

  const forYouCount = ALL_TEMPLATES.filter(t => {
    const d = user?.department ?? ''
    return t.crossFunctional || t.department === d || t.department === 'CROSS_FUNCTIONAL'
  }).length
  const deployedCount = deployedIds.size

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {deployingTemplate && (
        <DeployModal
          template={deployingTemplate}
          customName={customName}
          onCustomName={setCustomName}
          deploying={deploying}
          onCancel={() => { setDeployingTemplate(null); setCustomName('') }}
          onDeploy={handleDeploy}
        />
      )}

      <div className="space-y-6 animate-fade-in">

        {/* ── Department Hero Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-7"
          style={{
            background: `linear-gradient(135deg, ${deptConf ? deptConf.gradient.replace('from-', '').replace(' to-', ', ') : '#1a2744, #141d35'})`,
          }}
        >
          {/* Decorative background circle */}
          <div
            className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
          />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

          <div className="relative z-10">
            {loadingUser ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-52 rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-4xl shadow-xl">
                    {heroBanner.icon}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {deptConf ? `Agents for ${heroBanner.label}` : 'Agent Library'}
                    </h1>
                    <p className="text-white/70 text-sm mt-0.5">
                      {heroBanner.count} agents available{deptConf ? ' for your role' : ''} · Deploy in minutes, no code required
                    </p>
                  </div>
                </div>
                {user && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/20">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">
                      {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="text-white text-xs font-semibold">{user.name || user.email}</div>
                      <div className="text-white/60 text-[10px]">{user.department ?? 'No department set'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs + Search Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tab Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-navy-800 border border-border w-fit">
            {([
              { key: 'for-you', label: 'For You', count: forYouCount },
              { key: 'all', label: 'All Agents', count: ALL_TEMPLATES.length },
              { key: 'deployed', label: 'Deployed', count: deployedCount },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.key
                    ? 'bg-electric-500 text-white shadow-lg'
                    : 'text-text-muted hover:text-text-secondary hover:bg-navy-700'
                }`}
              >
                {tab.label}
                <span suppressHydrationWarning className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-navy-700 text-text-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search agents…"
                className="input-field text-sm pl-9"
              />
            </div>

            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              className="input-field text-sm w-auto"
              style={{ width: 'auto', minWidth: '130px' }}
            >
              <option value="all">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button
              onClick={() => setApprovalFilter(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 whitespace-nowrap ${
                approvalFilter
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'text-text-muted border-border hover:text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              <span>⚠</span> No approval needed
            </button>
          </div>
        </div>

        {/* ── Results count ── */}
        {(search || difficultyFilter !== 'all' || approvalFilter) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">
              {sortedTemplates.length} result{sortedTemplates.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setSearch(''); setDifficultyFilter('all'); setApprovalFilter(false) }}
              className="text-xs text-electric-400 hover:text-electric-300 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Agent Grid ── */}
        {sortedTemplates.length === 0 ? (
          <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">
              {activeTab === 'deployed' ? '📭' : '🔍'}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {activeTab === 'deployed' ? 'No agents deployed yet' : 'No agents found'}
            </h3>
            <p className="text-sm text-text-muted max-w-xs">
              {activeTab === 'deployed'
                ? 'Browse the "For You" or "All Agents" tab and deploy your first agent.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'}
            </p>
            {activeTab === 'deployed' && (
              <button
                onClick={() => setActiveTab('for-you')}
                className="btn-primary mt-5 text-sm px-6 py-2.5"
              >
                Browse Agents →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTemplates.map((template, i) => (
              <div key={template.id} style={{ animationDelay: `${i * 35}ms` }}>
                <AgentCard
                  template={template}
                  isDeployed={deployedIds.has(template.id)}
                  onDeploy={setDeployingTemplate}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Footer hint ── */}
        {sortedTemplates.length > 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-text-muted">
              Don&apos;t see what you need?{' '}
              <a href="/dashboard/studio" className="text-electric-400 hover:text-electric-300 underline underline-offset-2">
                Build a custom agent in Studio →
              </a>
            </p>
          </div>
        )}

      </div>
    </>
  )
}
