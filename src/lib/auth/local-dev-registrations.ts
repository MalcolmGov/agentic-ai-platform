/**
 * In-process registrations when PostgreSQL is not available (local dev only).
 * Same Node process must serve both register and login for this to work.
 */
import { hashPassword, verifyPassword, type UserRole } from "./jwt";
import { randomBytes } from "node:crypto";

type LocalUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  tenantName: string;
  tenantSlug: string;
  role: UserRole;
};

const byEmail = new Map<string, LocalUser>();
const tenantById = new Map<string, { name: string; slug: string }>();
const nameByUserId = new Map<string, string>();

function id(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function getLocalDevTenant(tenantId: string) {
  return tenantById.get(tenantId) ?? null;
}

export function getLocalDevUserDisplayName(userId: string) {
  return nameByUserId.get(userId) ?? null;
}

export function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV === "development";
}

export function localDevEmailTaken(email: string) {
  return byEmail.has(email.toLowerCase());
}

export async function localDevRegister(params: {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}): Promise<{ user: LocalUser; tenant: { name: string; slug: string } }> {
  const email = params.email.toLowerCase();
  if (byEmail.has(email)) {
    throw new Error("EMAIL_EXISTS");
  }
  const passwordHash = await hashPassword(params.password);
  const tenantId = id("ld_tenant");
  const userId = id("ld_user");
  const baseSlug = params.organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug || "org"}-local`;
  const user: LocalUser = {
    id: userId,
    tenantId,
    email,
    name: params.name,
    passwordHash,
    tenantName: params.organizationName,
    tenantSlug: slug,
    role: "OWNER",
  };
  byEmail.set(email, user);
  tenantById.set(tenantId, { name: user.tenantName, slug: user.tenantSlug });
  nameByUserId.set(userId, params.name);
  return { user, tenant: { name: user.tenantName, slug: user.tenantSlug } };
}

export async function localDevVerifyLogin(
  email: string,
  password: string
): Promise<LocalUser | null> {
  const u = byEmail.get(email.toLowerCase());
  if (!u) return null;
  const ok = await verifyPassword(password, u.passwordHash);
  return ok ? u : null;
}
