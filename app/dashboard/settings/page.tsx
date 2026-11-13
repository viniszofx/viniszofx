import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { isPlatformAdmin } from "@/lib/organizations/access";
import { RiArrowRightLine as ArrowRight, RiUserLine as User, RiLayoutGridLine as Grid, RiBuilding2Line as Company, RiLifebuoyLine as Support, RiBuilding4Line as Organizations, RiToggleLine as Modules } from "@remixicon/react";

export const metadata: Metadata = { title: "Configurações | Viniccius" };

const sections = [
  { href: "/dashboard/settings/profile", title: "Perfil", description: "Atualize seu nome e a senha de acesso.", icon: User },
  { href: "/dashboard/settings/company", title: "Empresa", description: "Identificação, endereço de origem das viagens e cores dos serviços.", icon: Company },
  { href: "/dashboard/settings/support", title: "Suporte", description: "Diagnóstico do aparelho e do servidor para abrir um chamado.", icon: Support },
  { href: "/dashboard/settings/workplace", title: "Workplace", description: "Defina o nome e a descrição da sua área de trabalho.", icon: Grid },
];

const adminSections = [
  { href: "/dashboard/organizations", title: "Organizações", description: "Crie organizações, gerencie membros e pedidos de nova senha.", icon: Organizations },
  { href: "/dashboard/system/modules", title: "Módulos", description: "Ligue e desligue funções para todas as organizações.", icon: Modules },
];

export default async function SettingsPage() {
  const { data } = await auth.getSession();
  const admin = !!data?.user && await isPlatformAdmin(data.user.id);
  return <main className="w-full px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Ajustes</p><h1 className="text-2xl font-semibold">Ajustes</h1><p className="mt-1 text-sm text-muted-foreground">Gerencie sua conta e o Workplace.</p></div>
    <section className="max-w-3xl pt-7"><h2 className="mb-3 text-sm font-semibold">Preferências</h2><div className="border border-b-0 bg-card">{sections.map(({ href, title, description, icon: Icon }) =>
      <Link key={href} href={href} className="group flex items-center gap-3 border-b px-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1"><h3 className="text-sm font-medium">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>)}</div></section>
    {admin && <section className="max-w-3xl pt-7"><h2 className="mb-3 text-sm font-semibold">Administração</h2><div className="border border-b-0 bg-card">{adminSections.map(({ href, title, description, icon: Icon }) =>
      <Link key={href} href={href} className="group flex items-center gap-3 border-b px-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1"><h3 className="text-sm font-medium">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>)}</div></section>}
  </main>;
}
