/**
 * Industry Agent Packs — Pre-built, regulation-aware agent configurations
 *
 * Domain-specific agent blueprints with embedded regulatory knowledge
 * for Financial Services, Healthcare, Legal, E-Commerce, and HR.
 */

export interface IndustryPack {
  id: string;
  industry: string;
  name: string;
  description: string;
  agents: AgentBlueprint[];
  regulations: RegulationRef[];
  deploymentGuide: string[];
}

export interface AgentBlueprint {
  id: string;
  name: string;
  type: string;
  description: string;
  systemPrompt: string;
  model: string;
  tools: string[];
  requiredIntegrations: string[];
  approvalGates: Array<{ action: string; condition: string }>;
  schedule: string | null;
  complianceFrameworks: string[];
}

export interface RegulationRef {
  code: string;
  name: string;
  jurisdiction: string;
  requirements: string[];
  automatedChecks: string[];
}

// ─── Packs ─────────────────────────────────

const FINANCIAL_SERVICES: IndustryPack = {
  id: "pack_finserv", industry: "Financial Services",
  name: "Financial Services Agent Pack",
  description: "AML monitoring, trade surveillance, regulatory reporting, and risk scoring agents pre-configured for banking and fintech compliance.",
  agents: [
    {
      id: "bp_aml_monitor", name: "AML Transaction Monitor", type: "FRAUD_MONITORING",
      description: "Monitors transactions for money laundering patterns per BSA/AML requirements",
      systemPrompt: "You are an AML Monitoring Agent for a financial institution. Analyze transactions against known money laundering typologies: structuring (smurfing), layering, round-trip transactions, rapid movement of funds, and unusual geographic patterns. Flag transactions requiring SAR filing per FinCEN guidelines. Apply the $10,000 CTR threshold and $5,000 suspicious activity threshold.\n\nKey regulations: BSA, USA PATRIOT Act Section 326, FinCEN SAR requirements, OFAC sanctions screening.",
      model: "gpt-4o", tools: ["query_database", "send_alert", "recall_memory", "generate_report"],
      requiredIntegrations: ["slack", "pagerduty"],
      approvalGates: [{ action: "file_sar", condition: "SAR filing requires compliance officer review" }, { action: "freeze_account", condition: "Account freeze requires senior management approval" }],
      schedule: "realtime", complianceFrameworks: ["PCI_DSS", "SOX", "EU_AI_ACT"],
    },
    {
      id: "bp_trade_surv", name: "Trade Surveillance Agent", type: "COMPLIANCE",
      description: "Detects market manipulation patterns: spoofing, layering, wash trading, front-running",
      systemPrompt: "You are a Trade Surveillance Agent. Monitor trading activity for market manipulation per SEC Rule 10b-5 and MAR (EU). Detect patterns: spoofing (large orders cancelled before execution), layering, wash trading (no change in beneficial ownership), front-running, and insider trading signals. Calculate suspicion scores and escalate to compliance.",
      model: "gpt-4o", tools: ["query_database", "send_alert", "generate_report"],
      requiredIntegrations: ["slack", "jira"],
      approvalGates: [{ action: "regulatory_report", condition: "STR filing requires compliance approval" }],
      schedule: "realtime", complianceFrameworks: ["SOX", "EU_AI_ACT"],
    },
    {
      id: "bp_kyc_verify", name: "KYC Verification Agent", type: "COMPLIANCE",
      description: "Automates Know Your Customer checks with sanctions screening and PEP detection",
      systemPrompt: "You are a KYC Verification Agent. Perform customer due diligence: verify identity documents, screen against OFAC SDN list, EU sanctions list, and UN sanctions. Check PEP (Politically Exposed Persons) databases. Apply risk-based approach per FATF Recommendation 10. Flag high-risk customers for Enhanced Due Diligence (EDD).",
      model: "gpt-4o", tools: ["query_database", "generate_report", "recall_memory"],
      requiredIntegrations: [], approvalGates: [{ action: "approve_high_risk", condition: "High-risk customers require MLRO approval" }],
      schedule: null, complianceFrameworks: ["GDPR", "EU_AI_ACT"],
    },
  ],
  regulations: [
    { code: "BSA", name: "Bank Secrecy Act", jurisdiction: "US", requirements: ["CTR filing for transactions > $10,000", "SAR filing for suspicious activity > $5,000", "Customer identification program (CIP)"], automatedChecks: ["Transaction threshold monitoring", "Pattern detection for structuring", "Sanctions list screening"] },
    { code: "PCI-DSS", name: "Payment Card Industry Data Security Standard", jurisdiction: "Global", requirements: ["Encrypt cardholder data", "Maintain audit trails", "Regular vulnerability testing"], automatedChecks: ["Data encryption verification", "Access log monitoring", "PAN detection in logs"] },
    { code: "MiFID-II", name: "Markets in Financial Instruments Directive II", jurisdiction: "EU", requirements: ["Transaction reporting within T+1", "Best execution records", "Product governance"], automatedChecks: ["Trade reporting completeness", "Best execution analysis", "Product suitability checks"] },
  ],
  deploymentGuide: ["Connect to transaction database", "Configure OFAC/sanctions API", "Set SAR filing workflow with compliance team", "Enable PagerDuty for critical alerts", "Schedule quarterly model review"],
};

const HEALTHCARE: IndustryPack = {
  id: "pack_healthcare", industry: "Healthcare",
  name: "Healthcare Agent Pack",
  description: "HIPAA-compliant agents for claims processing, prior authorization, patient scheduling, and compliance monitoring.",
  agents: [
    {
      id: "bp_claims", name: "Claims Processing Agent", type: "DOCUMENT_PROCESSING",
      description: "Automates medical claims adjudication with CPT/ICD-10 validation",
      systemPrompt: "You are a Claims Processing Agent for a healthcare organization. Review medical claims for accuracy: validate CPT codes against ICD-10 diagnoses, check medical necessity, verify patient eligibility, detect duplicate claims, and flag potential fraud (upcoding, unbundling, phantom billing). Apply CMS guidelines and payer-specific rules. All PHI must be handled per HIPAA minimum necessary standard.",
      model: "gpt-4o", tools: ["query_database", "generate_report"],
      requiredIntegrations: [], approvalGates: [{ action: "deny_claim", condition: "Claim denials > $10,000 require medical director review" }],
      schedule: null, complianceFrameworks: ["HIPAA", "EU_AI_ACT"],
    },
    {
      id: "bp_prior_auth", name: "Prior Authorization Agent", type: "COMPLIANCE",
      description: "Handles prior authorization requests against payer clinical criteria",
      systemPrompt: "You are a Prior Authorization Agent. Evaluate prior auth requests against clinical criteria (InterQual, MCG guidelines). Verify medical necessity, check formulary compliance for medications, validate provider credentials, and ensure timely processing per CMS 2-day urgency standard. Document all decisions for appeal support. Handle PHI per HIPAA Privacy Rule.",
      model: "gpt-4o", tools: ["query_database", "generate_report", "recall_memory"],
      requiredIntegrations: ["sendgrid"], approvalGates: [{ action: "deny_auth", condition: "All denials require physician reviewer sign-off" }],
      schedule: null, complianceFrameworks: ["HIPAA", "EU_AI_ACT"],
    },
  ],
  regulations: [
    { code: "HIPAA", name: "Health Insurance Portability and Accountability Act", jurisdiction: "US", requirements: ["Minimum necessary PHI access", "Business Associate Agreements", "Breach notification within 60 days", "Patient right of access"], automatedChecks: ["PHI access logging", "Encryption verification", "Access pattern anomaly detection"] },
    { code: "HITECH", name: "Health Information Technology for Economic and Clinical Health Act", jurisdiction: "US", requirements: ["EHR meaningful use", "Breach notification requirements", "Increased penalties for non-compliance"], automatedChecks: ["Breach detection monitoring", "Audit trail completeness"] },
  ],
  deploymentGuide: ["Enable HIPAA-compliant data encryption", "Configure PHI access logging", "Set up BAA with LLM provider", "Connect to claims management system", "Train staff on AI-assisted workflows"],
};

const LEGAL: IndustryPack = {
  id: "pack_legal", industry: "Legal",
  name: "Legal Agent Pack",
  description: "Contract review, due diligence, regulatory tracking, and billing compliance agents.",
  agents: [
    {
      id: "bp_contract_review", name: "Contract Review Agent", type: "DOCUMENT_PROCESSING",
      description: "Analyzes contracts for risk clauses, missing terms, and compliance issues",
      systemPrompt: "You are a Contract Review Agent for a law firm. Analyze contracts for: unfavorable indemnification clauses, liability caps, IP assignment issues, non-compete scope, termination provisions, data processing terms (DPA compliance), force majeure gaps, and missing standard clauses. Flag deviations from approved templates. Rate risk as low/medium/high per clause. Note: outputs are not legal advice — flag for attorney review.",
      model: "gpt-4o", tools: ["query_database", "generate_report", "recall_memory"],
      requiredIntegrations: ["jira"], approvalGates: [{ action: "approve_contract", condition: "All contract approvals require partner sign-off" }],
      schedule: null, complianceFrameworks: ["GDPR", "SOC2"],
    },
  ],
  regulations: [
    { code: "ABA-Ethics", name: "ABA Model Rules of Professional Conduct", jurisdiction: "US", requirements: ["Duty of competence with technology (Rule 1.1)", "Confidentiality of client information (Rule 1.6)", "Supervisory duties over AI tools (Rule 5.3)"], automatedChecks: ["Client data isolation verification", "Privilege tag detection", "Conflict of interest screening"] },
  ],
  deploymentGuide: ["Configure matter-based access controls", "Set up privilege detection rules", "Connect to document management system", "Enable attorney review workflow"],
};

const ECOMMERCE: IndustryPack = {
  id: "pack_ecommerce", industry: "E-Commerce",
  name: "E-Commerce Agent Pack",
  description: "Inventory optimization, dynamic pricing, review management, and fraud prevention.",
  agents: [
    {
      id: "bp_pricing", name: "Dynamic Pricing Agent", type: "DATA_ANALYST",
      description: "Optimizes product pricing based on demand, competition, and inventory levels",
      systemPrompt: "You are a Dynamic Pricing Agent. Analyze real-time market data, competitor pricing, inventory velocity, demand elasticity, and seasonal trends to recommend optimal pricing. Apply pricing rules: never below cost+margin floor, respect MAP (Minimum Advertised Price) agreements, flag potential Robinson-Patman Act violations for quantity discounts. Generate daily pricing recommendations.",
      model: "gpt-4o", tools: ["query_database", "generate_report"],
      requiredIntegrations: ["webhook"], approvalGates: [{ action: "price_change_bulk", condition: "Bulk price changes > 100 SKUs require merchandising approval" }],
      schedule: "0 6 * * *", complianceFrameworks: ["CCPA"],
    },
    {
      id: "bp_fraud_ecom", name: "E-Commerce Fraud Agent", type: "FRAUD_MONITORING",
      description: "Detects payment fraud, account takeover, and promo abuse",
      systemPrompt: "You are an E-Commerce Fraud Detection Agent. Monitor orders for: stolen credit cards (velocity checks, AVS mismatch, high-risk BINs), account takeover (password change + immediate high-value order), promo abuse (multiple accounts, coupon stacking), return fraud patterns, and shipping address anomalies. Apply 3D Secure recommendations for flagged transactions.",
      model: "gpt-4o", tools: ["query_database", "send_alert", "recall_memory"],
      requiredIntegrations: ["slack", "pagerduty"], approvalGates: [{ action: "block_order", condition: "Order blocks > $500 require manual review" }],
      schedule: "realtime", complianceFrameworks: ["PCI_DSS", "GDPR"],
    },
  ],
  regulations: [
    { code: "PCI-DSS", name: "Payment Card Industry DSS", jurisdiction: "Global", requirements: ["Encrypt payment data", "No storage of CVV/CVC", "Quarterly vulnerability scans"], automatedChecks: ["PAN detection in logs", "Payment data encryption audit"] },
    { code: "CCPA", name: "California Consumer Privacy Act", jurisdiction: "US-CA", requirements: ["Right to know data collected", "Right to delete", "Do-not-sell opt-out"], automatedChecks: ["Data inventory tracking", "Deletion request processing"] },
  ],
  deploymentGuide: ["Connect to order management system", "Configure payment gateway webhook", "Set up PagerDuty for critical fraud alerts", "Enable dynamic pricing rules engine"],
};

const HR: IndustryPack = {
  id: "pack_hr", industry: "Human Resources",
  name: "HR Agent Pack",
  description: "Resume screening, onboarding automation, compliance training, and payroll anomaly detection.",
  agents: [
    {
      id: "bp_resume", name: "Resume Screening Agent", type: "DOCUMENT_PROCESSING",
      description: "Screens resumes against job requirements with bias-aware scoring",
      systemPrompt: "You are a Resume Screening Agent. Evaluate candidates against job requirements: skills match, experience level, education qualifications, and certifications. CRITICAL: Do NOT use protected characteristics (age, gender, race, disability, marital status, religion, national origin) in any scoring decision per Title VII and EEOC guidelines. Apply OFCCP compliance for federal contractors. Score based solely on job-relevant qualifications. Flag any potential adverse impact patterns.",
      model: "gpt-4o", tools: ["query_database", "generate_report"],
      requiredIntegrations: [], approvalGates: [{ action: "reject_candidate", condition: "All rejections require HR review to verify non-discriminatory basis" }],
      schedule: null, complianceFrameworks: ["EU_AI_ACT", "GDPR"],
    },
  ],
  regulations: [
    { code: "Title-VII", name: "Title VII of the Civil Rights Act", jurisdiction: "US", requirements: ["No discrimination based on protected characteristics", "Disparate impact analysis required", "Uniform Guidelines on Employee Selection"], automatedChecks: ["Protected attribute exclusion verification", "Adverse impact ratio monitoring", "Four-fifths rule compliance check"] },
    { code: "EU-AI-Act-HR", name: "EU AI Act — Employment AI Systems", jurisdiction: "EU", requirements: ["High-risk classification for recruitment AI", "Fundamental rights impact assessment", "Human oversight for hiring decisions"], automatedChecks: ["Bias assessment scoring", "Transparency documentation", "Human review enforcement"] },
  ],
  deploymentGuide: ["Configure job requirements database", "Enable bias monitoring dashboard", "Set up adverse impact reporting", "Connect to ATS (Applicant Tracking System)", "Schedule quarterly bias audits"],
};

export const INDUSTRY_PACKS: IndustryPack[] = [FINANCIAL_SERVICES, HEALTHCARE, LEGAL, ECOMMERCE, HR];

export class IndustryPackManager {
  getPacks(): IndustryPack[] { return INDUSTRY_PACKS; }

  getPack(industry: string): IndustryPack | null {
    return INDUSTRY_PACKS.find((p) => p.industry.toLowerCase() === industry.toLowerCase() || p.id === industry) || null;
  }

  getBlueprint(blueprintId: string): { pack: IndustryPack; blueprint: AgentBlueprint } | null {
    for (const pack of INDUSTRY_PACKS) {
      const bp = pack.agents.find((a) => a.id === blueprintId);
      if (bp) return { pack, blueprint: bp };
    }
    return null;
  }

  deployBlueprint(blueprintId: string, tenantId: string, overrides?: Partial<AgentBlueprint>): AgentBlueprint & { deployedId: string; tenantId: string; deployedAt: number } | null {
    const found = this.getBlueprint(blueprintId);
    if (!found) return null;
    return {
      ...found.blueprint,
      ...overrides,
      id: found.blueprint.id,
      deployedId: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      deployedAt: Date.now(),
    };
  }

  searchBlueprints(query: string): AgentBlueprint[] {
    const lower = query.toLowerCase();
    const results: AgentBlueprint[] = [];
    for (const pack of INDUSTRY_PACKS) {
      for (const bp of pack.agents) {
        if (bp.name.toLowerCase().includes(lower) || bp.description.toLowerCase().includes(lower) || bp.systemPrompt.toLowerCase().includes(lower)) {
          results.push(bp);
        }
      }
    }
    return results;
  }
}

let manager: IndustryPackManager | null = null;
export function getIndustryPackManager(): IndustryPackManager {
  if (!manager) manager = new IndustryPackManager();
  return manager;
}
