import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowRightSLine as ArrowRight, RiArticleLine as Article, RiAdvertisementLine as Advertisement, RiCarLine as Car, RiFileTextLine as FileText, RiGroupLine as Users, RiHotelLine as Hotel, RiLayoutGridLine as Grid, RiSettings3Line as Settings, RiSuitcaseLine as Suitcase } from "@remixicon/react";

export const metadata: Metadata = { title: "Dashboard | Viniccius" };

const groups = [
  { title: "Operações", items: [
    { label: "Clientes", description: "Cadastro e informações", href: "/dashboard/clients", icon: Users },
    { label: "Viagens", description: "Planejamento e registros", href: "/dashboard/trip", icon: Suitcase },
    { label: "Reservas", description: "Hospedagens e controle", href: "/dashboard/reservations", icon: Hotel },
    { label: "Frota", description: "Veículos e disponibilidade", href: "/dashboard/fleet", icon: Car },
  ] },
  { title: "Workplace", items: [
    { label: "Notas", description: "Documentos e arquivos", href: "/dashboard/notes", icon: FileText },
    { label: "Quadros", description: "Listas e tarefas", href: "/dashboard/boards", icon: Grid },
  ] },
  { title: "Publicação e conta", items: [
    { label: "Blog", description: "Posts e mídias", href: "/dashboard/blog", icon: Article },
    { label: "Publicidade", description: "Campanhas nos artigos", href: "/dashboard/ads", icon: Advertisement },
    { label: "Configurações", description: "Perfil e Workplace", href: "/dashboard/settings", icon: Settings },
  ] },
] as const;

export default function DashboardPage() {
  return <main className="w-full px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Visão geral</p><h1 className="text-2xl font-semibold">Visão geral</h1><p className="mt-1 text-sm text-muted-foreground">Acesse as áreas do seu painel.</p></div>
    <div className="grid gap-x-12 gap-y-9 pt-7 xl:grid-cols-2">{groups.map((group, index) => <section key={group.title} aria-labelledby={`section-${index}`} className="min-w-0">
      <h2 id={`section-${index}`} className="mb-3 text-sm font-semibold">{group.title}</h2>
      <div className="border border-b-0 bg-card">{group.items.map(({ label, description, href, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 border-b px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><strong className="block text-sm font-medium">{label}</strong><span className="block text-xs text-muted-foreground">{description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>)}</div>
    </section>)}</div>
  </main>;
}
