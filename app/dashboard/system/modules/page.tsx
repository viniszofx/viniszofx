import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ModulesPage } from "@/components/settings/modules-page";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { auth } from "@/lib/auth/server";
import { disabledModules } from "@/lib/modules-server";
import { isPlatformAdmin } from "@/lib/organizations/access";

export const metadata: Metadata = { title: "Módulos | Ajustes" };

export default async function SystemModulesRoute() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard");
  return <SettingsLayout title="Módulos" description="Ligue e desligue recursos para todas as organizações. Os dados de módulos desligados são preservados.">
    <ModulesPage initial={await disabledModules()} />
  </SettingsLayout>;
}
