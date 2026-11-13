import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema/app";
import { isPlatformAdmin, organizationMemberRows } from "@/lib/organizations/access";
import { OrganizationMembersManager } from "./organization-members-manager";
import { isLocalAuth } from "@/lib/db";

type Context = { params: Promise<{ organizationId: string }> };
export const metadata: Metadata = { title: "Membros da organização | Administração" };

export default async function OrganizationPage({ params }: Context) {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard");
  const { organizationId } = await params;
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (!organization) notFound();
  const members = await organizationMemberRows(organizationId);
  return <main className="w-full px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><Link href="/dashboard/organizations" className="mb-2 block text-xs text-muted-foreground hover:text-primary">Administração / Organizações</Link><h1 className="text-2xl font-semibold">{organization.name}</h1><p className="mt-1 text-sm text-muted-foreground">Adicione contas existentes e gerencie função e acesso.</p></div>
    <OrganizationMembersManager organizationId={organization.id} initialMembers={members} localAuth={isLocalAuth} />
  </main>;
}
