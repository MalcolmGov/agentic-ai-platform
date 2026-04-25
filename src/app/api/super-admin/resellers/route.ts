import { NextRequest, NextResponse } from "next/server";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

const MOCK_RESELLERS = [
  {
    id: "r1",
    name: "Accenture Africa",
    slug: "accenture-africa",
    contactEmail: "partners@accenture.com",
    contactName: "John Smith",
    status: "ACTIVE",
    tier: "GOLD",
    commissionRate: 0.25,
    clientLimit: 50,
    totalMRR: 47500,
    totalClients: 19,
    contractStart: "2026-01-01",
    contractEnd: "2026-12-31",
    clients: [],
    commissions: [],
  },
  {
    id: "r2",
    name: "Deloitte Digital",
    slug: "deloitte-digital",
    contactEmail: "digital@deloitte.co.za",
    contactName: "Sarah Johnson",
    status: "ACTIVE",
    tier: "PLATINUM",
    commissionRate: 0.30,
    clientLimit: 100,
    totalMRR: 125000,
    totalClients: 42,
    contractStart: "2025-07-01",
    contractEnd: "2027-06-30",
    clients: [],
    commissions: [],
  },
  {
    id: "r3",
    name: "iOCO Digital",
    slug: "ioco-digital",
    contactEmail: "ai@ioco.tech",
    contactName: "Mike van der Merwe",
    status: "ACTIVE",
    tier: "SILVER",
    commissionRate: 0.20,
    clientLimit: 25,
    totalMRR: 18200,
    totalClients: 8,
    contractStart: "2026-02-01",
    contractEnd: "2027-01-31",
    clients: [],
    commissions: [],
  },
  {
    id: "r4",
    name: "PwC Advisory",
    slug: "pwc-advisory",
    contactEmail: "africa.digital@pwc.com",
    contactName: "Amara Diallo",
    status: "PENDING",
    tier: "STANDARD",
    commissionRate: 0.20,
    clientLimit: 20,
    totalMRR: 0,
    totalClients: 0,
    clients: [],
    commissions: [],
  },
];

function isSuperAdmin(req: NextRequest): boolean {
  try {
    const cookie = req.cookies.get("auth_token")?.value;
    const header = req.headers.get("authorization")?.replace("Bearer ", "");
    const token = cookie || header;
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    const email: string = payload.email ?? "";
    const role: string = payload.role ?? "";

    return (
      email.endsWith("@swifterai.io") ||
      email === "admin@agentic.ai" ||
      role === "OWNER"
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return apiError("Forbidden — super admin access required", 403);
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const resellers = await prisma.reseller.findMany({
      include: {
        clients: true,
        commissions: { orderBy: { month: "desc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
    });
    return apiResponse(resellers);
  } catch {
    return apiResponse(MOCK_RESELLERS);
  }
}

export async function POST(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return apiError("Forbidden — super admin access required", 403);
  }

  try {
    const body = await req.json();
    const { name, slug, contactEmail, contactName, tier, commissionRate, clientLimit, contractStart, contractEnd } = body;

    if (!name || !slug || !contactEmail || !contactName) {
      return apiError("name, slug, contactEmail, and contactName are required");
    }

    try {
      const { prisma } = await import("@/lib/db/prisma");
      const reseller = await prisma.reseller.create({
        data: {
          name,
          slug,
          contactEmail,
          contactName,
          tier: tier ?? "STANDARD",
          commissionRate: commissionRate ?? 0.20,
          clientLimit: clientLimit ?? 10,
          contractStart: contractStart ? new Date(contractStart) : null,
          contractEnd: contractEnd ? new Date(contractEnd) : null,
        },
      });
      return apiResponse(reseller, 201);
    } catch {
      const mock = {
        id: `r${Date.now()}`,
        name,
        slug,
        contactEmail,
        contactName,
        tier: tier ?? "STANDARD",
        commissionRate: commissionRate ?? 0.20,
        clientLimit: clientLimit ?? 10,
        totalMRR: 0,
        totalClients: 0,
        status: "PENDING",
        contractStart: contractStart ?? null,
        contractEnd: contractEnd ?? null,
        createdAt: new Date().toISOString(),
      };
      return apiResponse(mock, 201);
    }
  } catch {
    return apiError("Invalid request body");
  }
}

export async function PATCH(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return apiError("Forbidden — super admin access required", 403);
  }

  try {
    const body = await req.json();
    const { id, status, tier, commissionRate, clientLimit, notes } = body;

    if (!id) {
      return apiError("id is required");
    }

    try {
      const { prisma } = await import("@/lib/db/prisma");
      const reseller = await prisma.reseller.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(tier !== undefined && { tier }),
          ...(commissionRate !== undefined && { commissionRate }),
          ...(clientLimit !== undefined && { clientLimit }),
          ...(notes !== undefined && { notes }),
        },
      });
      return apiResponse(reseller);
    } catch {
      const mock = MOCK_RESELLERS.find((r) => r.id === id);
      if (!mock) return apiError("Reseller not found", 404);
      return apiResponse({ ...mock, status, tier, commissionRate, clientLimit, notes });
    }
  } catch {
    return apiError("Invalid request body");
  }
}
