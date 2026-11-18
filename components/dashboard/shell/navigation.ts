import { hiddenHref } from "@/lib/modules";
import { RiFileList3Line as Proposal, RiAdvertisementLine as Advertisement, RiArticleLine as Article, RiCarLine as Car, RiBuilding2Line as Building, RiFileTextLine as FileText, RiHomeLine as Home, RiHotelLine as Hotel, RiLayoutGridLine as LayoutGrid, RiSettings3Line as Settings, RiSuitcaseLine as Suitcase, RiGroupLine as Users, RiArchiveLine as Archive, RiBankCardLine as BankCard, RiBarChartBoxLine as Chart, RiCalendarLine as Calendar, RiCheckboxLine as Checkbox, RiListCheck3 as TodoList, RiChat3Line as Chat, RiPencilRuler2Line as Whiteboard, RiClipboardLine as Clipboard, RiDashboard3Line as Dashboard, RiExchangeDollarLine as Exchange, RiFlowChart as Flow, RiHardDrive2Line as HardDrive, RiInboxLine as Inbox, RiLockLine as Lock, RiMapPinLine as MapPin, RiMegaphoneLine as Megaphone, RiReceiptLine as Receipt, RiTimeLine as Time, RiWhatsappLine as WhatsApp, RiUserStarLine as Clients, RiLayoutColumnLine as Kanban, RiUserVoiceLine as Leads } from "@remixicon/react";

export type NavLink = { label: string; href: string; icon: typeof Home; exact?: boolean; adminOnly?: boolean };
export type NavGroup = { title: string; links: NavLink[]; collapsed?: boolean };

// Organização do Nodus: o pessoal no topo, depois operação, frota, financeiro,
// cadastros, comunicação, workspace e ferramentas. Grupos recolhíveis.
export const navigation: NavGroup[] = [
  {
    title: "Pessoal",
    links: [
      { label: "Início", href: "/dashboard", icon: Home, exact: true },
      { label: "Calendário", href: "/dashboard/calendar", icon: Calendar },
      { label: "To-dos", href: "/dashboard/todos", icon: TodoList },
      { label: "Mensagens", href: "/dashboard/messages", icon: Chat },
    ],
  },
  {
    title: "Operação",
    links: [
      { label: "Ordens de serviço", href: "/dashboard/orders", icon: Clipboard },
      { label: "Viagens", href: "/dashboard/trip", icon: Suitcase },
      { label: "Hospedagens", href: "/dashboard/reservations", icon: Hotel },
      { label: "Jornadas", href: "/dashboard/journeys", icon: MapPin },
      { label: "Tarefas", href: "/dashboard/tasks", icon: Checkbox },
    ],
  },
  {
    title: "Frota",
    links: [
      { label: "Veículos", href: "/dashboard/fleet", icon: Car },
      { label: "Lançamentos de KM", href: "/dashboard/mileage", icon: Dashboard },
    ],
  },
  {
    title: "Financeiro",
    collapsed: true,
    links: [
      { label: "Apontamento", href: "/dashboard/finance/timesheets", icon: Time },
      { label: "Despesas", href: "/dashboard/finance/expenses", icon: Receipt },
      { label: "Cartões", href: "/dashboard/finance/cards", icon: BankCard },
      { label: "Conciliação", href: "/dashboard/finance/reconciliation", icon: Exchange },
      { label: "Indicadores", href: "/dashboard/finance/indicators", icon: Chart },
      { label: "Fechamento", href: "/dashboard/finance/closing", icon: Lock },
    ],
  },
  {
    title: "Cadastros",
    links: [
      { label: "Clientes", href: "/dashboard/clients", icon: Clients },
      { label: "Colaboradores", href: "/dashboard/employees", icon: Users },
      { label: "Hotéis", href: "/dashboard/hotels", icon: Building },
      { label: "Inventário", href: "/dashboard/inventory", icon: Archive },
    ],
  },
  {
    title: "Comunicação",
    links: [
      { label: "Mural", href: "/dashboard/announcements", icon: Megaphone },
      { label: "Agenda WhatsApp", href: "/dashboard/agenda", icon: WhatsApp },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Visão geral", href: "/dashboard/workspace", icon: LayoutGrid, exact: true },
      { label: "Notas", href: "/dashboard/notes", icon: FileText },
      { label: "Quadros", href: "/dashboard/boards", icon: Kanban },
      { label: "Solicitações", href: "/dashboard/requests", icon: Inbox },
    ],
  },
  {
    title: "Ferramentas",
    links: [
      { label: "Drive", href: "/dashboard/drive", icon: HardDrive },
      { label: "Diagramas", href: "/dashboard/diagrams", icon: Flow },
      { label: "Quadro branco", href: "/dashboard/whiteboards", icon: Whiteboard },
      { label: "Propostas", href: "/dashboard/proposals", icon: Proposal },
    ],
  },
  {
    title: "Marketing",
    collapsed: true,
    links: [
      { label: "Leads", href: "/dashboard/leads", icon: Leads, adminOnly: true },
      { label: "Blog", href: "/dashboard/blog", icon: Article },
      { label: "Publicidade", href: "/dashboard/ads", icon: Advertisement },
    ],
  },
];
// Configurações e Administração ficam num só lugar: Ajustes, no rodapé do menu (Nodus).
export const settingsLink: NavLink = { label: "Ajustes", href: "/dashboard/settings", icon: Settings };
export const settingsPaths = ["/dashboard/settings", "/dashboard/organizations", "/dashboard/system"];

export const isActive = (pathname: string, link: NavLink) => link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
export const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
export function visibleApps(isPlatformAdmin: boolean, disabledModules: string[]) {
  return [...navigation, { title: "Conta", links: [settingsLink] }]
    .map(group => ({ ...group, links: group.links.filter(link => (!link.adminOnly || isPlatformAdmin) && !hiddenHref(link.href, disabledModules)) }))
    .filter(group => group.links.length);
}
