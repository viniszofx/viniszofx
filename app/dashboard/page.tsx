import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowRightSLine as ArrowRight, RiArticleLine as Article, RiAdvertisementLine as Advertisement, RiCarLine as Car, RiFileTextLine as FileText, RiGroupLine as Users, RiHotelLine as Hotel, RiLayoutGridLine as Grid, RiSettings3Line as Settings, RiSuitcaseLine as Suitcase, RiArchiveLine as Archive, RiCalendarLine as Calendar, RiCheckboxLine as Checkbox, RiClipboardLine as Clipboard, RiDashboard3Line as Dashboard, RiFlowChart as Flow, RiHardDrive2Line as HardDrive, RiInboxLine as Inbox, RiMapPinLine as MapPin, RiMegaphoneLine as Megaphone, RiWhatsappLine as WhatsApp, RiListCheck3 as TodoList, RiPencilRuler2Line as Whiteboard, RiBuilding2Line as Company, RiLifebuoyLine as Support } from "@remixicon/react";
import { HomeToday } from "@/components/nodus/home-today";
import { SetupGuide } from "@/components/nodus/setup-guide";
import { hiddenHref } from "@/lib/modules";
import { disabledModules } from "@/lib/modules-server";
import { OrganizationPrompt } from "@/components/nodus/no-organization";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Dashboard | Viniccius" };

const groups = [
  { title: "Operação", items: [
    { label: "Ordens de serviço", description: "Cliente, equipe e materiais", href: "/dashboard/orders", icon: Clipboard },
    { label: "Viagens", description: "Planejamento e registros", href: "/dashboard/trip", icon: Suitcase },
    { label: "Jornadas", description: "Registro de campo com localização", href: "/dashboard/journeys", icon: MapPin },
    { label: "Tarefas", description: "Prazos e responsáveis", href: "/dashboard/tasks", icon: Checkbox },
    { label: "Calendário", description: "Eventos, viagens e ordens", href: "/dashboard/calendar", icon: Calendar },
  ] },
  { title: "Frota e cadastros", items: [
    { label: "Frota", description: "Veículos e disponibilidade", href: "/dashboard/fleet", icon: Car },
    { label: "Lançamentos de KM", description: "Quilometragem e custos", href: "/dashboard/mileage", icon: Dashboard },
    { label: "Clientes", description: "Cadastro e informações", href: "/dashboard/clients", icon: Users },
    { label: "Hotéis e hospedagens", description: "Reservas e diárias", href: "/dashboard/reservations", icon: Hotel },
    { label: "Inventário", description: "Itens, locais e movimentações", href: "/dashboard/inventory", icon: Archive },
  ] },
  { title: "Comunicação e workspace", items: [
    { label: "Mural", description: "Avisos programados", href: "/dashboard/announcements", icon: Megaphone },
    { label: "Agenda WhatsApp", description: "Mensagem do dia para a equipe", href: "/dashboard/agenda", icon: WhatsApp },
    { label: "To-dos", description: "Tarefas pessoais em listas", href: "/dashboard/todos", icon: TodoList },
    { label: "Notas", description: "Documentos e arquivos", href: "/dashboard/notes", icon: FileText },
    { label: "Quadros", description: "Listas e tarefas", href: "/dashboard/boards", icon: Grid },
    { label: "Solicitações", description: "Pedidos com to-dos e anexos", href: "/dashboard/requests", icon: Inbox },
  ] },
  { title: "Ferramentas e conta", items: [
    { label: "Drive", description: "Pastas e arquivos", href: "/dashboard/drive", icon: HardDrive },
    { label: "Diagramas", description: "draw.io com salvamento automático", href: "/dashboard/diagrams", icon: Flow },
    { label: "Quadro branco", description: "Esboços livres no Excalidraw", href: "/dashboard/whiteboards", icon: Whiteboard },
    { label: "Blog", description: "Posts e mídias", href: "/dashboard/blog", icon: Article },
    { label: "Publicidade", description: "Campanhas nos artigos", href: "/dashboard/ads", icon: Advertisement },
    { label: "Empresa", description: "Origem das viagens e cores dos serviços", href: "/dashboard/settings/company", icon: Company },
    { label: "Suporte", description: "Diagnóstico do aparelho e do servidor", href: "/dashboard/settings/support", icon: Support },
    { label: "Configurações", description: "Perfil e Workplace", href: "/dashboard/settings", icon: Settings },
  ] },
] as const;

export default async function DashboardPage() {
  const [disabled, { data }] = await Promise.all([disabledModules(), auth.getRawSession()]);
  const visibleGroups = groups.map(group => ({ ...group, items: group.items.filter(item => !hiddenHref(item.href, disabled)) })).filter(group => group.items.length);
  return <main className="w-full px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Visão geral</p><h1 className="text-2xl font-semibold">Visão geral</h1><p className="mt-1 text-sm text-muted-foreground">Acesse as áreas do seu painel.</p></div>
    {!(disabled.includes("mural") && disabled.includes("messages")) && <OrganizationPrompt />}
    <SetupGuide />
    <HomeToday name={data?.user?.name ?? ""} />
    <div className="grid gap-x-12 gap-y-9 pt-7 xl:grid-cols-2">{visibleGroups.map((group, index) => <section key={group.title} aria-labelledby={`section-${index}`} className="min-w-0">
      <h2 id={`section-${index}`} className="mb-3 text-sm font-semibold">{group.title}</h2>
      <div className="border border-b-0 bg-card">{group.items.map(({ label, description, href, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 border-b px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><strong className="block text-sm font-medium">{label}</strong><span className="block text-xs text-muted-foreground">{description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>)}</div>
    </section>)}</div>
  </main>;
}
