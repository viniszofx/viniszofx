import { DashboardShell } from "@/components/dashboard-shell";

import { AppToasts } from "@/components/ui/app-toasts";
import { auth } from "@/lib/auth/server";
import { hasOrganizationAccess, isExternalOnly, isPlatformAdmin } from "@/lib/organizations/access";
import { redirect } from "next/navigation";
import { disabledModules } from "@/lib/modules-server";
import { canOnboard } from "@/lib/organizations/onboarding";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data } = await auth.getRawSession();
  if (!data?.user) redirect("/login");
  const admin = await isPlatformAdmin(data.user.id);
  // Sem acesso a nenhuma organização: cria a própria no onboarding (cadastro aberto) ou pede acesso.
  if (!admin && !await hasOrganizationAccess(data.user.id)) redirect(await canOnboard(data.user.id) ? "/onboarding" : "/access-required");
  const externalOnly = !admin && await isExternalOnly(data.user.id);
  return <AppToasts>{externalOnly && <p className="border-b bg-muted px-4 py-2 text-center text-xs text-muted-foreground">Acesso externo: você pode consultar os dados, mas não alterá-los.</p>}<DashboardShell isPlatformAdmin={admin} disabledModules={await disabledModules()}>{children}</DashboardShell></AppToasts>;
}
