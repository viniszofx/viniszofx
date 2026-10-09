import type { Metadata } from "next";
import Link from "next/link";
import { RiFileTextLine as FileText, RiLayoutGridLine as LayoutGrid } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Workspace | Viniccius" };

export default function WorkspacePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Área de trabalho</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Workspace</h1>
        <p className="text-sm text-muted-foreground">Suas funcionalidades e ferramentas reunidas em um só lugar.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      <section aria-label="Notes" className="flex flex-col items-center gap-3 bg-card px-6 py-16 text-center">
        <FileText aria-hidden="true" className="mb-2 size-8 text-primary" />
        <h2 className="font-heading text-xl font-semibold">Notes</h2>
        <p className="max-w-md text-sm text-muted-foreground">Crie documentos por blocos, organize suas ideias e mantenha arquivos salvos no navegador.</p>
        <Button nativeButton={false} render={<Link href="/dashboard/notes" />} className="mt-3">Abrir Notes</Button>
      </section>
      <section aria-label="Boards" className="flex flex-col items-center gap-3 bg-card px-6 py-16 text-center">
        <LayoutGrid aria-hidden="true" className="mb-2 size-8 text-primary" />
        <h2 className="font-heading text-xl font-semibold">Boards</h2>
        <p className="max-w-md text-sm text-muted-foreground">Organize tarefas em listas e cards, com cores e movimentação por arraste.</p>
        <Button nativeButton={false} render={<Link href="/dashboard/boards" />} className="mt-3">Abrir Boards</Button>
      </section>
      </div>
    </main>
  );
}
