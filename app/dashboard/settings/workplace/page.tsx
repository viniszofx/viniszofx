import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { getWorkplaceSettings } from "@/lib/workplace/settings";
import { WorkplaceForm } from "./workplace-form";

export const metadata: Metadata = { title: "Workplace | Configurações" };

export default async function WorkplaceSettingsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  const settings = await getWorkplaceSettings(data.user.id);
  return <main className="flex w-full flex-col gap-7 px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5">
      <Link href="/dashboard/settings" className="mb-2 block text-xs text-muted-foreground hover:text-primary">Console / Configurações</Link>
      <h1 className="text-2xl font-semibold">Workplace</h1>
      <p className="mt-1 text-sm text-muted-foreground">Nome, descrição e aparência da área de trabalho.</p>
    </div>
    <section className="max-w-3xl space-y-5 border bg-card p-5" aria-labelledby="workplace-info">
      <div className="space-y-1"><h2 id="workplace-info" className="text-sm font-semibold">Identidade</h2><p className="text-xs text-muted-foreground">Essas informações aparecem na visão geral do Workspace.</p></div>
      <WorkplaceForm name={settings.name} description={settings.description} />
    </section>
    <section className="flex max-w-3xl flex-wrap items-center justify-between gap-4 border bg-card p-5" aria-labelledby="workplace-appearance">
      <div className="space-y-1"><h2 id="workplace-appearance" className="text-sm font-semibold">Aparência</h2><p className="text-xs text-muted-foreground">Escolha entre tema claro, escuro ou o tema do dispositivo.</p></div>
      <ThemeSelector />
    </section>
  </main>;
}
