import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations, settings } from "@/lib/db/schema/app";
import { isPlatformAdmin } from "./access";

/** Cadastro aberto: com ALLOW_SIGNUP=true qualquer pessoa cria conta e a própria organização. */
export const signupOpen = () => process.env.ALLOW_SIGNUP === "true";

export async function hasMembership(userId: string) {
  const rows = await db.select({ id: organizationMembers.id }).from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active"), eq(organizations.status, "active"))).limit(1);
  return rows.length > 0;
}

/**
 * Quem pode criar a própria organização: contas sem organização quando o cadastro
 * está aberto, e a administração da plataforma enquanto não for membro de nenhuma.
 */
export async function canOnboard(userId: string) {
  if (await hasMembership(userId)) return false;
  if (signupOpen()) return true;
  return isPlatformAdmin(userId);
}

export type OnboardingCompany = {
  name: string; document: string; phone: string; email: string; responsible: string;
  postalCode: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string;
};

const limits: Record<keyof OnboardingCompany, number> = { name: 80, document: 24, phone: 40, email: 254, responsible: 200, postalCode: 9, street: 300, number: 30, complement: 200, neighborhood: 150, city: 150, state: 100 };

export function parseCompany(input: unknown): { value: OnboardingCompany } | { error: string } {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const value = Object.fromEntries(Object.entries(limits).map(([key, max]) => [key, typeof source[key] === "string" ? (source[key] as string).trim().slice(0, max) : ""])) as OnboardingCompany;
  if (value.name.length < 2) return { error: "O nome da organização deve ter ao menos 2 caracteres." };
  if (value.email && !/^\S+@\S+\.\S+$/.test(value.email)) return { error: "Informe um e-mail válido." };
  return { value };
}

/** Cria a organização com a pessoa como membro e grava os dados da empresa nos ajustes da conta. */
export async function createOrganizationFor(userId: string, company: OnboardingCompany) {
  const slugBase = company.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "organizacao";
  const organizationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { name, ...rest } = company;
  const record = { ...rest, name, serviceColors: {}, id: "company", code: "COMPANY", createdAt: now, updatedAt: now };
  await db.insert(organizations).values({ id: organizationId, name, slug: `${slugBase}-${organizationId.slice(0, 8)}`, createdBy: userId });
  await db.insert(organizationMembers).values({ id: crypto.randomUUID(), organizationId, userId, role: "member" });
  // Ajustes da empresa (Configurações › Empresa): só preenche se a conta ainda não tem.
  await db.insert(settings).values({ userId, id: "company", position: 0, data: record }).onConflictDoNothing();
  return organizationId;
}
