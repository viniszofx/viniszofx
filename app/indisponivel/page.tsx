import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Indisponível", robots: { index: false, follow: false } };

/** Página pública de um módulo desligado em Sistema › Módulos. */
export default async function UnavailablePage({ searchParams }: { searchParams: Promise<{ modulo?: string | string[] }> }) {
  const { modulo } = await searchParams;
  return <main className="flex min-h-svh items-center justify-center px-5 py-12">
    <section className="w-full max-w-md text-center">
      <p className="text-sm font-medium text-primary">Indisponível</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold">Este conteúdo não está disponível</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{typeof modulo === "string" ? `${modulo} foi desativado pela administração do site.` : "Este recurso foi desativado pela administração do site."}</p>
      <Link href="/" className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline">Voltar ao início</Link>
    </section>
  </main>;
}
