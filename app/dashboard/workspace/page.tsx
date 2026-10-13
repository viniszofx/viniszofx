import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RiFileTextLine as FileText, RiLayoutGridLine as LayoutGrid, RiSettings3Line as Settings, RiArrowRightSLine as ArrowRight } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { getWorkplaceSettings } from "@/lib/workplace/settings";

export const metadata: Metadata = { title: "Workspace | Viniccius" };

export default async function WorkspacePage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  const settings = await getWorkplaceSettings(data.user.id);
  return (
    <main className="w-full px-4 pb-12 pt-6 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5"><div><p className="mb-2 text-xs text-muted-foreground">Console / Workplace</p><h1 className="text-2xl font-semibold">{settings.name}</h1><p className="mt-1 text-sm text-muted-foreground">{settings.description}</p></div><Button nativeButton={false} render={<Link href="/dashboard/settings/workplace" />} variant="outline" size="sm"><Settings />Configurar</Button></div>
      <section className="max-w-3xl pt-7" aria-label="Ferramentas do Workplace"><h2 className="mb-3 text-sm font-semibold">Ferramentas</h2><div className="border border-b-0 bg-card">
        <Link href="/dashboard/notes" className="group flex items-center gap-3 border-b px-4 py-4 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><FileText aria-hidden="true" className="size-4 text-muted-foreground group-hover:text-primary" /><span className="flex-1"><strong className="block text-sm font-medium">Notas</strong><span className="text-xs text-muted-foreground">Documentos, ideias e arquivos</span></span><ArrowRight className="size-4 text-muted-foreground" /></Link>
        <Link href="/dashboard/boards" className="group flex items-center gap-3 border-b px-4 py-4 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><LayoutGrid aria-hidden="true" className="size-4 text-muted-foreground group-hover:text-primary" /><span className="flex-1"><strong className="block text-sm font-medium">Quadros</strong><span className="text-xs text-muted-foreground">Listas, cards e tarefas</span></span><ArrowRight className="size-4 text-muted-foreground" /></Link>
      </div></section>
    </main>
  );
}
