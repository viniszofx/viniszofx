"use client";

import Link from "next/link";
import { RiArrowLeftLine, RiErrorWarningLine, RiHome4Line, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export function ErrorScreen({
  title = "Algo não saiu como esperado",
  description = "Ocorreu um problema ao abrir esta página. Tente novamente ou volte ao início.",
  reference,
  onRetry,
  homeHref = "/dashboard",
}: {
  title?: string;
  description?: string;
  reference?: string;
  onRetry?: () => void;
  homeHref?: string;
}) {
  return <main role="alert" className="grid min-h-[min(70svh,44rem)] place-items-center px-5 py-10">
    <section className="w-full max-w-lg border bg-card p-6 text-center sm:p-9">
      <span className="mx-auto grid size-14 place-items-center border border-destructive/30 bg-destructive/10 text-destructive">
        <RiErrorWarningLine className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-medium uppercase tracking-widest text-muted-foreground">A página encontrou um problema</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {reference && <p className="mt-4 text-xs text-muted-foreground">Referência: <code className="font-mono">{reference}</code></p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {onRetry && <Button type="button" onClick={onRetry}><RiRefreshLine />Tentar novamente</Button>}
        <Button type="button" variant="outline" onClick={() => window.history.back()}><RiArrowLeftLine />Voltar</Button>
        <Button type="button" variant="ghost" nativeButton={false} render={<Link href={homeHref} />}><RiHome4Line />Início</Button>
      </div>
    </section>
  </main>;
}
