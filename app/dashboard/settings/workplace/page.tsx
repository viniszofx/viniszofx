import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { auth } from "@/lib/auth/server";
import { getWorkplaceSettings } from "@/lib/workplace/settings";
import { WorkplaceForm } from "./workplace-form";

export const metadata: Metadata = { title: "Aparência | Ajustes" };

export default async function WorkplaceSettingsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  const settings = await getWorkplaceSettings(data.user.id);
  return <SettingsLayout title="Aparência e Workplace" description="O tema vale para este aparelho; o nome e a descrição aparecem na visão geral do Workspace.">
    <div className="grid max-w-3xl gap-4">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 md:rounded-xl" aria-labelledby="workplace-appearance">
        <div className="space-y-1"><h3 id="workplace-appearance" className="text-sm font-semibold">Tema</h3><p className="text-xs text-muted-foreground">Claro, escuro ou o do aparelho.</p></div>
        <ThemeSelector />
      </section>
      <section className="space-y-4 rounded-2xl border bg-card p-5 md:rounded-xl" aria-labelledby="workplace-info">
        <div className="space-y-1"><h3 id="workplace-info" className="text-sm font-semibold">Workplace</h3><p className="text-xs text-muted-foreground">Nome e descrição da sua área de trabalho.</p></div>
        <WorkplaceForm name={settings.name} description={settings.description} />
      </section>
    </div>
  </SettingsLayout>;
}
