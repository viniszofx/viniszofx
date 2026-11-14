import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema/app";
import { isPlatformAdmin } from "@/lib/organizations/access";
import { OrganizationsManager } from "./organizations-manager";
import { PasswordRequests } from "@/components/auth/password-reset";

export const metadata: Metadata = { title: "Organizações | Ajustes" };

export default async function OrganizationsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard");
  const rows = await db.select({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status, createdAt: organizations.createdAt, memberCount: count(organizationMembers.id) })
    .from(organizations).leftJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
    .groupBy(organizations.id).orderBy(desc(organizations.createdAt));
  return <SettingsLayout title="Organizações" description="Crie organizações, gerencie o acesso dos membros e atenda os pedidos de nova senha.">
    <PasswordRequests />
    <OrganizationsManager initialOrganizations={rows} />
  </SettingsLayout>;
}
