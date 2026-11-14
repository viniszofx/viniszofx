import type { Metadata } from "next";
import Link from "next/link";
import { SettingsLayout } from "@/components/settings/settings-layout";
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
  return <SettingsLayout title={organization.name} description="Adicione contas existentes e gerencie função e acesso de cada membro." actions={<Link href="/dashboard/organizations" className="text-sm text-primary hover:underline">Todas as organizações</Link>}>
    <OrganizationMembersManager organizationId={organization.id} initialMembers={members} localAuth={isLocalAuth} />
  </SettingsLayout>;
}
