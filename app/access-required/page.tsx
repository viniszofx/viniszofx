import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RiBuilding2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export default function AccessRequiredPage() {
  return <main className="flex min-h-svh items-center justify-center px-5 py-12">
    <section className={cn(surfaceVariants(), "w-full max-w-lg p-7 sm:p-9")}>
      <div className="mb-5 flex size-12 items-center justify-center border bg-primary/10 text-primary"><RiBuilding2Line className="size-6" /></div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Acesso ao painel</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold">Sua conta ainda não está em uma organização</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Peça ao administrador da aplicação para adicionar seu e-mail a uma organização. Depois disso, você poderá entrar no painel. Se você criou a conta para uma empresa nova, peça para liberarem o cadastro de organizações.</p>
      <Button nativeButton={false} render={<Link href="/login" />} variant="outline" className="mt-6">Voltar ao acesso</Button>
    </section>
  </main>;
}
