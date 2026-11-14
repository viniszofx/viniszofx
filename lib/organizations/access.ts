import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, isLocalAuth } from "@/lib/db";
import { authUsers, localAuthUser } from "@/lib/db/schema/auth";
import { organizationMembers, organizations, platformAdmins } from "@/lib/db/schema/app";

/** Primeira conta cadastrada (vira a administração). Se a consulta falhar, ninguém vira admin e a página não quebra. */
async function firstAccount() {
  if (isLocalAuth) return db.select({ id: localAuthUser.id }).from(localAuthUser).orderBy(asc(localAuthUser.createdAt)).limit(1);
  try { return await db.select({ id: authUsers.id }).from(authUsers).orderBy(asc(authUsers.createdAt)).limit(1); }
  catch (error) {
    console.error("Neon Auth: não foi possível ler a primeira conta.", error);
    return [];
  }
}

export async function platformAdminId() {
  const [current] = await db.select({ userId: platformAdmins.userId }).from(platformAdmins)
    .where(eq(platformAdmins.slot, "primary")).limit(1);
  if (current) return current.userId;

  const [firstUser] = await firstAccount();
  if (!firstUser) return null;

  await db.insert(platformAdmins).values({ slot: "primary", userId: firstUser.id }).onConflictDoNothing();
  const [admin] = await db.select({ userId: platformAdmins.userId }).from(platformAdmins)
    .where(eq(platformAdmins.slot, "primary")).limit(1);
  return admin?.userId ?? null;
}

export async function isPlatformAdmin(userId: string) {
  return (await platformAdminId()) === userId;
}

export async function hasOrganizationAccess(userId: string) {
  const rows = await db.select({ id: organizationMembers.id }).from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.status, "active"),
      eq(organizations.status, "active"),
    )).limit(1);
  return rows.length > 0;
}

export async function canWriteOrganizationData(userId: string) {
  if (await isPlatformAdmin(userId)) return true;
  const rows = await db.select({ id: organizationMembers.id }).from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.role, "member"),
      eq(organizationMembers.status, "active"),
      eq(organizations.status, "active"),
    )).limit(1);
  return rows.length > 0;
}

export async function isExternalOnly(userId: string) {
  return await hasOrganizationAccess(userId) && !await canWriteOrganizationData(userId);
}

export async function organizationMemberRows(organizationId: string) {
  const members = await db.select({
    id: organizationMembers.id,
    userId: organizationMembers.userId,
    role: organizationMembers.role,
    status: organizationMembers.status,
    createdAt: organizationMembers.createdAt,
    name: isLocalAuth ? localAuthUser.name : authUsers.name,
    email: isLocalAuth ? localAuthUser.email : authUsers.email,
  }).from(organizationMembers).innerJoin(
    isLocalAuth ? localAuthUser : authUsers,
    // No Neon Auth o id é uuid e o do membro é texto: compara como texto.
    sql`${isLocalAuth ? localAuthUser.id : authUsers.id}::text = ${organizationMembers.userId}`,
  ).where(eq(organizationMembers.organizationId, organizationId)).orderBy(asc(organizationMembers.createdAt));
  return members;
}
