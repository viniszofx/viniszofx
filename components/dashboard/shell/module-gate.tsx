"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { disabledModuleFor } from "@/lib/modules";
import { RiToggleLine as Modules } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function ModuleGate({ disabledModules, children }: { disabledModules: string[]; children: ReactNode }) {
  const pathname = usePathname();
  const blocked = disabledModuleFor(pathname, disabledModules);
  if (!blocked) return <>{children}</>;
  return <main className="flex min-h-[60svh] items-center justify-center px-5 py-12"><section className={cn(surfaceVariants(), "max-w-md p-8 text-center")}>
    <span className="mx-auto grid size-12 place-items-center bg-muted text-muted-foreground"><Modules className="size-6" aria-hidden="true" /></span>
    <h1 className="mt-4 text-lg font-semibold">{blocked.name} está desativado</h1>
    <p className="mt-2 text-sm text-muted-foreground">A administração desligou este módulo em Sistema › Módulos. Os dados continuam guardados e voltam quando ele for reativado.</p>
    <Link href="/dashboard" className="mt-5 inline-block text-sm text-primary underline-offset-4 hover:underline">Voltar ao início</Link>
  </section></main>;
}

/** Mensagens não lidas, para o selo da barra inferior. */
