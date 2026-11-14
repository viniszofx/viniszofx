import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db, isLocalAuth } from "@/lib/db";
import { authUsers, localAuthUser } from "@/lib/db/schema/auth";
import { organizationMembers, organizations } from "@/lib/db/schema/app";
import { isPlatformAdmin } from "./access";

export type OrganizationContext = { userId: string; userName: string; organizationId: string; organizationName: string; role: "member" | "external"; admin: boolean };

/** Organização ativa da pessoa (a primeira em que é membro ativo); o admin da plataforma usa a primeira ativa. */
export async function currentOrganization(): Promise<OrganizationContext | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;
  const userId = session.user.id;
  const admin = await isPlatformAdmin(userId);
  const [membership] = await db.select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role, name: organizations.name })
    .from(organizationMembers).innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active"), eq(organizations.status, "active")))
    .orderBy(asc(organizationMembers.createdAt)).limit(1);
  if (membership) return { userId, userName: session.user.name ?? "", organizationId: membership.organizationId, organizationName: membership.name, role: membership.role, admin };
  if (!admin) return null;
  const [first] = await db.select({ id: organizations.id, name: organizations.name }).from(organizations)
    .where(eq(organizations.status, "active")).orderBy(asc(organizations.createdAt)).limit(1);
  return first ? { userId, userName: session.user.name ?? "", organizationId: first.id, organizationName: first.name, role: "member", admin } : null;
}

export const canWrite = (context: OrganizationContext) => context.admin || context.role === "member";

export async function userNames(ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return new Map<string, string>();
  const table = isLocalAuth ? localAuthUser : authUsers;
  const rows = await db.select({ id: table.id, name: table.name, email: table.email }).from(table).where(inArray(table.id, unique));
  return new Map(rows.map(row => [row.id, row.name || row.email]));
}

/** Membros ativos da organização (para mensagens e menções). */
export async function organizationPeople(organizationId: string) {
  const table = isLocalAuth ? localAuthUser : authUsers;
  return db.select({ id: table.id, name: table.name, email: table.email, role: organizationMembers.role })
    // No Neon Auth o id é uuid e o do membro é texto: compara como texto (sem isso o Postgres falha com text = uuid).
    .from(organizationMembers).innerJoin(table, sql`${table.id}::text = ${organizationMembers.userId}`)
    .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.status, "active")))
    .orderBy(asc(table.name));
}

export const unauthorized = () => new Response("Mural e mensagens são da organização. Peça para ser incluído em uma organização ou, se você administra o sistema, crie uma em Administração › Organizações.", { status: 401 });
export const readOnly = () => new Response("Acesso externo é somente leitura.", { status: 403 });
