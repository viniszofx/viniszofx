import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ModulesPage } from "@/components/settings/modules-page";
import { auth } from "@/lib/auth/server";
import { disabledModules } from "@/lib/modules-server";
import { isPlatformAdmin } from "@/lib/organizations/access";

export const metadata: Metadata = { title: "Módulos | Sistema" };

export default async function SystemModulesRoute() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard");
  return <main className="flex w-full flex-col gap-7 px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Sistema</p><h1 className="text-2xl font-semibold">Módulos</h1><p className="mt-1 text-sm text-muted-foreground">Ative ou desative recursos para todas as organizações. Os dados de módulos inativos são preservados.</p></div>
    <ModulesPage initial={await disabledModules()} />
  </main>;
}
