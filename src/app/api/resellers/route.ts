import { NextRequest, NextResponse } from "next/server";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

const DEMO_RESELLER = {
  id: "r-demo",
  name: "Demo Partner Agency",
  slug: "demo-partner",
  tier: "GOLD",
  commissionRate: 0.25,
  clientLimit: 100,
  totalClients: 12,
  totalMRR: 38400,
  estimatedCommission: 9600,
  status: "ACTIVE",
  contractEnd: "2027-06-30",
  clients: [
    { id: "c1", name: "Acme Corp", plan: "ENTERPRISE", mrr: 8500, agents: 23, markets: 5, status: "active", joined: "2026-01-15" },
    { id: "c2", name: "TechStart SA", plan: "PROFESSIONAL", mrr: 3200, agents: 11, markets: 3, status: "active", joined: "2026-02-20" },
    { id: "c3", name: "MegaRetail Ltd", plan: "ENTERPRISE", mrr: 9200, agents: 31, markets: 7, status: "active", joined: "2025-12-01" },
    { id: "c4", name: "FinServ Group", plan: "ENTERPRISE", mrr: 7800, agents: 18, markets: 4, status: "active", joined: "2026-03-10" },
    { id: "c5", name: "LogiCo Africa", plan: "PROFESSIONAL", mrr: 2800, agents: 9, markets: 2, status: "active", joined: "2026-04-01" },
    { id: "c6", name: "HealthCare ZA", plan: "STARTER", mrr: 1200, agents: 4, markets: 1, status: "trial", joined: "2026-04-15" },
  ],
  commissions: [
    { month: "2026-04", revenue: 32700, commission: 8175, status: "pending" },
    { month: "2026-03", revenue: 31200, commission: 7800, status: "paid", paidAt: "2026-04-05" },
    { month: "2026-02", revenue: 28900, commission: 7225, status: "paid", paidAt: "2026-03-05" },
    { month: "2026-01", revenue: 24000, commission: 6000, status: "paid", paidAt: "2026-02-05" },
  ],
};

const RESELLER_BY_DOMAIN: Record<string, typeof DEMO_RESELLER> = {
  "accenture.com": { ...DEMO_RESELLER, id: "r-accenture", name: "Accenture Africa", slug: "accenture-africa", tier: "PLATINUM" } as typeof DEMO_RESELLER,
  "deloitte.com": { ...DEMO_RESELLER, id: "r-deloitte", name: "Deloitte Digital", slug: "deloitte-digital", tier: "PLATINUM" } as typeof DEMO_RESELLER,
  "ioco.tech": { ...DEMO_RESELLER, id: "r-ioco", name: "iOCO Digital", slug: "ioco-digital", tier: "GOLD" } as typeof DEMO_RESELLER,
};

function getResellerByEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  for (const [key, reseller] of Object.entries(RESELLER_BY_DOMAIN)) {
    if (domain === key || domain.endsWith(`.${key}`)) return reseller;
  }
  return DEMO_RESELLER;
}

export async function GET(req: NextRequest) {
  try {
    let email = "demo@demo-partner.com";

    try {
      const { authenticateRequest } = await import("@/lib/auth/jwt");
      const auth = authenticateRequest(req);
      email = auth.email;
    } catch {
      // unauthenticated — return demo
    }

    const reseller = getResellerByEmail(email);
    return apiResponse(reseller);
  } catch (error) {
    console.error("[Resellers GET]", error);
    return apiError("Failed to fetch reseller data", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, companyName, contactEmail, plan, industry } = body;

    if (action === "provision-client") {
      if (!companyName || !contactEmail || !plan) {
        return apiError("companyName, contactEmail, and plan are required", 400);
      }

      const tenantSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const temporaryPassword = `Ag${Math.random().toString(36).slice(2, 8).toUpperCase()}#2026`;
      const loginUrl = `https://app.{{YOUR_DOMAIN}}/login?tenant=${tenantSlug}`;

      return apiResponse({
        tenantSlug,
        temporaryPassword,
        loginUrl,
        plan,
        industry: industry ?? "Other",
        provisionedAt: new Date().toISOString(),
        message: `Client tenant "${companyName}" has been provisioned successfully.`,
      }, 201);
    }

    return apiError("Unknown action. Use action: 'provision-client'", 400);
  } catch (error) {
    console.error("[Resellers POST]", error);
    return apiError("Failed to process request", 500);
  }
}
