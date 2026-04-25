/**
 * Agent Execution API — Execute agents with real OpenAI LLM calls
 *
 * POST /api/agents/execute
 *
 * Body: { agentId, agentName, department, userMessage, systemPrompt? }
 * Returns: { success, response, tokens, model }
 *
 * Falls back to realistic department-specific mock responses when
 * OPENAI_API_KEY is not configured or is a placeholder value.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import OpenAI from "openai";
import { env } from "@/lib/config/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isApiKeyValid(key: string): boolean {
  return !!(key && !key.startsWith("sk-placeholder") && key.length > 20);
}

// ─── Department System Prompts ─────────────────────────────────────────────────

const DEPT_PROMPTS: Record<string, string> = {
  HR: "You are an HR assistant for an enterprise platform. Help employees with HR policies, leave management, onboarding, payroll queries, benefits, and workplace matters. Be empathetic, clear, and cite specific policies when possible. Keep responses practical and actionable.",
  LEGAL: "You are a legal assistant for an enterprise platform. Help with contract review, compliance questions, NDA analysis, regulatory matters, and legal policy queries. Be thorough, highlight risks clearly, and always recommend formal legal review for binding decisions.",
  CUSTOMER_SUPPORT: "You are a customer support assistant for an enterprise platform. Help resolve customer issues quickly and professionally. Be empathetic, solution-focused, acknowledge frustrations, and provide clear next steps. Escalate complex issues appropriately.",
  ENGINEERING: "You are an engineering assistant for an enterprise platform. Help with code review, incident response, runbook generation, architecture decisions, and technical problem-solving. Be precise, technical, follow best practices, and provide concrete examples.",
  RISK: "You are a risk assessment assistant for an enterprise platform. Help identify, assess, and mitigate business risks across operational, financial, cyber, and strategic domains. Be systematic, data-driven, and provide clear risk ratings with recommended controls.",
  SECURITY: "You are a cybersecurity assistant for an enterprise platform. Help with threat analysis, security policy questions, vulnerability assessment, and access review. Be precise about vulnerabilities, follow CVSS scoring, and prioritise remediation by severity.",
  COMPLIANCE: "You are a compliance assistant for an enterprise platform. Help with GDPR, POPIA, PCI-DSS, ISO 27001, and other regulatory requirements. Be accurate, cite specific regulations and sections, and provide actionable remediation steps with timelines.",
  QA: "You are a QA assistant for an enterprise platform. Help generate comprehensive test cases, triage bugs, plan regression suites, and define acceptance criteria. Cover happy paths, edge cases, and negative scenarios. Follow BDD/TDD best practices.",
  PRODUCT: "You are a product management assistant for an enterprise platform. Help with user feedback analysis, PRD writing, roadmap prioritisation, and product decisions. Be strategic, user-centric, and ground recommendations in data.",
  FINANCE: "You are a financial assistant for an enterprise platform. Help with budget analysis, financial report summarisation, forecasting, and transaction reconciliation. Be accurate, use proper financial terminology, and highlight key variances and trends.",
  MARKETING: "You are a marketing assistant for an enterprise platform. Help with campaign copywriting, social media content, SEO optimisation, and brand messaging. Be creative, persuasive, and ensure content aligns with brand guidelines.",
  DATA_ANALYTICS: "You are a data analytics assistant for an enterprise platform. Help with data quality checks, SQL query generation, dashboard insights, and statistical analysis. Be precise, technical, and translate complex data into clear business insights.",
  INFRA_OPS: "You are an infrastructure operations assistant for an enterprise platform. Help with incident triage, capacity planning, change request analysis, and runbook creation. Be methodical, use ITIL best practices, and prioritise by business impact.",
  OPERATIONS: "You are an operations assistant for an enterprise platform. Help streamline processes, track performance metrics, identify inefficiencies, and improve operational workflows. Be practical and focused on measurable, actionable outcomes.",
  EXECUTIVE: "You are an executive assistant for an enterprise platform. Help prepare board reports, analyse competitive intelligence, and support strategic decision-making. Be concise, high-level, and focus on key metrics, risks, and strategic implications.",
  IT: "You are an IT helpdesk assistant for an enterprise platform. Help users troubleshoot technical issues, manage access requests, resolve common IT problems, and follow security protocols. Be clear, step-by-step, and patient with non-technical users.",
};

const DEFAULT_DEPT_PROMPT =
  "You are a helpful AI assistant for an enterprise platform. Analyse the input and provide clear, professional, and actionable responses tailored to the business context.";

// ─── Mock Fallback Responses ───────────────────────────────────────────────────

function getMockResponse(department: string, agentName: string, userMessage: string): string {
  const dept = (department ?? "").toUpperCase();
  const query = userMessage.slice(0, 100);

  const templates: Record<string, string> = {
    HR: `**${agentName} — HR Assistant**\n\nThanks for your question: *"${query}"*\n\n**HR Guidance:**\n\n• Based on standard HR policies, here is the relevant information for your query.\n• Annual leave entitlements are governed by the Basic Conditions of Employment Act and your employment contract.\n• For specific leave balances, please check the HR portal or contact your HR Business Partner directly.\n• Onboarding and benefits enrollment have a 5-business-day window from your start date.\n• Mandatory compliance training should be completed in your first week.\n\n**Next Steps:**\n1. Check the HR portal for self-service options\n2. Contact your HR Business Partner for personalised guidance\n3. Review the Employee Handbook (Section 4) for detailed policy information\n\n*Note: Configure a valid \`OPENAI_API_KEY\` in \`.env\` for real AI-powered responses.*`,

    LEGAL: `**${agentName} — Legal Assistant**\n\nRegarding: *"${query}"*\n\n**Legal Analysis (Preliminary):**\n\n⚠️ **Key Risk Areas to Assess:**\n• Liability clauses and caps — ensure limits are reasonable relative to contract value\n• Termination provisions — check notice periods and material breach definitions\n• IP ownership — confirm all deliverables and pre-existing IP are clearly scoped\n• Data processing obligations — verify GDPR/POPIA compliance requirements\n• Auto-renewal clauses — calendar reminders for notice deadlines are essential\n\n**Recommended Actions:**\n1. Schedule a legal review before executing any binding documents\n2. Cross-reference against your standard contract playbook\n3. Flag any deviations from standard terms for negotiation\n\n⚠️ *This is a preliminary analysis only. Always obtain formal legal advice for binding decisions. Configure \`OPENAI_API_KEY\` for AI-powered legal analysis.*`,

    CUSTOMER_SUPPORT: `**${agentName} — Customer Support**\n\nRegarding: *"${query}"*\n\n**Support Response:**\n\nThank you for reaching out — I completely understand how important this is to you, and I'm here to help resolve it quickly.\n\n**What I've done:**\n✅ Reviewed your account history and identified the relevant context\n✅ Checked our system for any known issues affecting your experience\n✅ Identified the most appropriate resolution path\n\n**Resolution:**\nBased on your query, the recommended next step is to [specific action will be tailored to your actual question with a real API key]. Our standard SLA for this type of request is 4 business hours.\n\n**If this doesn't resolve your issue:**\nReply to this message and I'll escalate to a Senior Support Engineer with full context.\n\n*Configure \`OPENAI_API_KEY\` for personalised, AI-powered customer support responses.*`,

    ENGINEERING: `**${agentName} — Engineering Assistant**\n\nFor: *"${query}"*\n\n**Technical Guidance:**\n\n**Code Quality Checklist:**\n• Follow SOLID principles — single responsibility, open/closed, Liskov substitution\n• Ensure adequate test coverage (unit + integration + E2E where applicable)\n• Security: sanitise all inputs, validate outputs, never trust client data\n• Performance: consider caching strategies, database indexing, and pagination\n• Documentation: inline comments for non-obvious logic, README updates if needed\n\n**Review Focus Areas:**\n1. Error handling — are all failure modes covered?\n2. Edge cases — null checks, empty arrays, type coercions\n3. Security — injection risks, auth checks, data exposure\n4. Observability — logging, tracing, alerting configured\n\n*Configure \`OPENAI_API_KEY\` for AI-powered code review and technical analysis.*`,

    RISK: `**${agentName} — Risk Assessment**\n\nFor: *"${query}"*\n\n**Risk Assessment Framework:**\n\n| Risk Dimension | Likelihood | Impact | Score | Recommendation |\n|---------------|------------|--------|-------|----------------|\n| Operational | Medium | High | 12 | Mitigate |\n| Financial | Low | High | 9 | Monitor |\n| Regulatory | Low | Critical | 15 | Escalate |\n| Reputational | Medium | Medium | 9 | Monitor |\n\n**Top Recommended Controls:**\n1. Implement preventative controls for identified critical risks\n2. Establish monitoring and early-warning indicators\n3. Document risk treatment decisions in the risk register\n4. Schedule quarterly risk review with the Risk Committee\n\n*Risk Register entry has been prepared. Configure \`OPENAI_API_KEY\` for AI-powered risk analysis.*`,

    COMPLIANCE: `**${agentName} — Compliance Assistant**\n\nRegarding: *"${query}"*\n\n**Regulatory Guidance:**\n\n**Applicable Frameworks:**\n• **GDPR (Article 33)**: Data breaches must be reported to the supervisory authority within **72 hours** of discovery.\n• **POPIA (Section 22)**: Notify the Information Regulator "as soon as reasonably possible" — align with GDPR's 72-hour window as best practice.\n• **PCI-DSS**: Maintain audit trails, encrypt cardholder data at rest and in transit.\n\n**Compliance Action Plan:**\n1. Document the compliance gap immediately\n2. Assess risk exposure and affected data subjects\n3. Notify relevant regulators if thresholds are met\n4. Implement remediation within agreed timelines\n5. Update policies to prevent recurrence\n\n*Configure \`OPENAI_API_KEY\` for AI-powered regulatory analysis and compliance guidance.*`,

    SECURITY: `**${agentName} — Security Assistant**\n\nFor: *"${query}"*\n\n**Security Assessment:**\n\n**Priority Actions (CVSS-scored):**\n\n🔴 **Critical — Act Immediately:**\n• Patch all systems with known CVEs rated 9.0+ within 24 hours\n• Revoke and rotate any exposed credentials immediately\n• Isolate affected systems if active exploitation is suspected\n\n🟡 **Medium — Action Within 7 Days:**\n• Review and tighten access controls using least-privilege principles\n• Enable MFA for all privileged accounts\n• Ensure security logging and alerting is active on all critical systems\n\n**Security Posture Checklist:**\n✅ Patch management up to date\n✅ Access reviews completed quarterly\n⚠️ MFA enforcement — verify coverage\n⚠️ Incident response plan — confirm last tested date\n\n*Configure \`OPENAI_API_KEY\` for AI-powered threat analysis and security guidance.*`,

    FINANCE: `**${agentName} — Finance Assistant**\n\nFor: *"${query}"*\n\n**Financial Analysis:**\n\n**Budget Overview:**\n\n| Category | Budgeted | Actual | Variance | Status |\n|----------|----------|--------|----------|--------|\n| Operating Costs | R500,000 | R487,200 | +R12,800 | 🟢 Under |\n| Revenue | R1,200,000 | R1,343,100 | +R143,100 | 🟢 Over |\n| EBITDA | R220,000 | R271,400 | +R51,400 | 🟢 Over |\n\n**Key Observations:**\n• Revenue is tracking 11.9% ahead of budget — driven by enterprise deal closure\n• Operating costs well managed — 2.6% under budget\n• EBITDA margin improving: 20.2% vs 18.3% budgeted\n\n**Recommendations:**\n1. Maintain cost discipline through Q2\n2. Reinvest revenue outperformance into growth initiatives\n3. Review cash flow projections for H2\n\n*Configure \`OPENAI_API_KEY\` for AI-powered financial analysis and reporting.*`,
  };

  return (
    templates[dept] ??
    `**${agentName} Response**\n\nProcessing: *"${query}"*\n\n**Analysis Complete:**\n\n• Your query has been received and processed by the **${agentName}** agent.\n• Department context: **${department || "General"}**\n• Relevant information has been retrieved and structured for your review.\n• Recommended next steps have been identified based on best practices.\n\n**Next Steps:**\n1. Review the findings above\n2. Take any recommended actions\n3. Run the agent again with a follow-up question if needed\n\n*This is a demo response. Add your \`OPENAI_API_KEY\` to \`.env\` for real AI-powered responses from GPT-4o mini.*`
  );
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export const POST = withAuth("agents:execute", async (req: NextRequest, { user: _user }) => {
  try {
    const body = await req.json();
    const { agentId, agentName, department, userMessage, systemPrompt } = body as {
      agentId?: string;
      agentName?: string;
      department?: string;
      userMessage?: string;
      systemPrompt?: string;
    };

    if (!agentId) return apiError("agentId is required");

    const message = (userMessage ?? "").trim() || "What can you help me with?";
    const apiKey = env.OPENAI_API_KEY;

    // ── Fallback: no real API key ───────────────────────────────────────────
    if (!isApiKeyValid(apiKey)) {
      return apiResponse({
        success: true,
        response: getMockResponse(department ?? "", agentName ?? "AI Agent", message),
        tokens: 0,
        model: "mock (no API key)",
      });
    }

    // ── Real OpenAI call ────────────────────────────────────────────────────
    const deptKey = (department ?? "").toUpperCase();
    const resolvedSystemPrompt =
      systemPrompt || DEPT_PROMPTS[deptKey] || DEFAULT_DEPT_PROMPT;

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: resolvedSystemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const choice = completion.choices[0];
    const responseText = choice.message.content ?? "No response generated.";
    const tokens = completion.usage?.total_tokens ?? 0;

    return apiResponse({
      success: true,
      response: responseText,
      tokens,
      model: "gpt-4o-mini",
    });
  } catch (error) {
    console.error("[Agent Execute]", error);
    return apiError("Agent execution failed: " + (error as Error).message, 500);
  }
});
