import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowRightLine as ArrowRight, RiUserLine as User, RiLayoutGridLine as Grid } from "@remixicon/react";

export const metadata: Metadata = { title: "Configurações | Viniccius" };

const sections = [
  { href: "/dashboard/settings/profile", title: "Perfil", description: "Atualize seu nome e a senha de acesso.", icon: User },
  { href: "/dashboard/settings/workplace", title: "Workplace", description: "Defina o nome e a descrição da sua área de trabalho.", icon: Grid },
];

export default function SettingsPage() {
  return <main className="w-full px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Configurações</p><h1 className="text-2xl font-semibold">Configurações</h1><p className="mt-1 text-sm text-muted-foreground">Gerencie sua conta e o Workplace.</p></div>
    <section className="max-w-3xl pt-7"><h2 className="mb-3 text-sm font-semibold">Preferências</h2><div className="border border-b-0 bg-card">{sections.map(({ href, title, description, icon: Icon }) =>
      <Link key={href} href={href} className="group flex items-center gap-3 border-b px-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1"><h3 className="text-sm font-medium">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>)}</div></section>
  </main>;
}
