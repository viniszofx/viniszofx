import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema/app";
import { isPlatformAdmin } from "@/lib/organizations/access";
import { OrganizationsManager } from "./organizations-manager";
import { PasswordRequests } from "@/components/auth/password-reset";

export const metadata: Metadata = { title: "Organizações | Administração" };

export default async function OrganizationsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard");
  const rows = await db.select({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status, createdAt: organizations.createdAt, memberCount: count(organizationMembers.id) })
    .from(organizations).leftJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
    .groupBy(organizations.id).orderBy(desc(organizations.createdAt));
  return <main className="w-full px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Administração</p><h1 className="text-2xl font-semibold">Organizações</h1><p className="mt-1 text-sm text-muted-foreground">Crie organizações e gerencie o acesso de seus membros.</p></div>
    <PasswordRequests />
    <OrganizationsManager initialOrganizations={rows} />
  </main>;
}
