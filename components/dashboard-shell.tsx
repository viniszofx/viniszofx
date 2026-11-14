"use client";

import { surfaceVariants } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { disabledModuleFor, hiddenHref } from "@/lib/modules";
import { ModulesProvider } from "@/lib/modules-context";
import { useMenuShortcuts } from "@/lib/nodus/shortcuts";
import { ShortcutsEditor } from "@/components/dashboard/shortcuts-editor";
import { Dialog } from "@base-ui/react/dialog";
import {
  RiAdvertisementLine as Advertisement,
  RiArticleLine as Article,
  RiCarLine as Car,
  RiBuilding2Line as Building,
  RiFileTextLine as FileText,
  RiHomeLine as Home,
  RiHotelLine as Hotel,
  RiLayoutGridLine as LayoutGrid,
  RiSidebarFoldLine as PanelLeftClose,
  RiSidebarUnfoldLine as PanelLeftOpen,
  RiSettings3Line as Settings,
  RiSuitcaseLine as Suitcase,
  RiGroupLine as Users,
  RiCloseLine as X,
  RiArchiveLine as Archive,
  RiBankCardLine as BankCard,
  RiBarChartBoxLine as Chart,
  RiCalendarLine as Calendar,
  RiCheckboxLine as Checkbox,
  RiListCheck3 as TodoList,
  RiChat3Line as Chat,
  RiPencilRuler2Line as Whiteboard,
  RiClipboardLine as Clipboard,
  RiDashboard3Line as Dashboard,
  RiExchangeDollarLine as Exchange,
  RiFlowChart as Flow,
  RiHardDrive2Line as HardDrive,
  RiInboxLine as Inbox,
  RiLockLine as Lock,
  RiMapPinLine as MapPin,
  RiMegaphoneLine as Megaphone,
  RiReceiptLine as Receipt,
  RiTimeLine as Time,
  RiGlobalLine as Globe,
  RiLink as LinkIcon,
  RiWhatsappLine as WhatsApp,
  RiUserStarLine as Clients,
  RiLayoutColumnLine as Kanban,
  RiToggleLine as Modules,
  RiApps2Line as Apps,
  RiSearchLine as Search,
  RiUserVoiceLine as Leads,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

const MIN_WIDTH = 204;
const MAX_WIDTH = 320;
const CLOSE_THRESHOLD = 96;
type NavLink = { label: string; href: string; icon: typeof Home; exact?: boolean; adminOnly?: boolean };
type NavGroup = { title: string; links: NavLink[]; collapsed?: boolean };

// Organização do Nodus: o pessoal no topo, depois operação, frota, financeiro,
// cadastros, comunicação, workspace e ferramentas. Grupos recolhíveis.
const navigation: NavGroup[] = [
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
const settingsLink: NavLink = { label: "Ajustes", href: "/dashboard/settings", icon: Settings };
const settingsPaths = ["/dashboard/settings", "/dashboard/organizations", "/dashboard/system"];

const isActive = (pathname: string, link: NavLink) => link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
function visibleApps(isPlatformAdmin: boolean, disabledModules: string[]) {
  return [...navigation, { title: "Conta", links: [settingsLink] }]
    .map(group => ({ ...group, links: group.links.filter(link => (!link.adminOnly || isPlatformAdmin) && !hiddenHref(link.href, disabledModules)) }))
    .filter(group => group.links.length);
}

function DashboardNavigation({ onNavigate, onHide, onOpenApps, isPlatformAdmin, disabledModules }: { onNavigate?: () => void; onHide?: () => void; onOpenApps: () => void; isPlatformAdmin: boolean; disabledModules: string[] }) {
  const pathname = usePathname();
  const [editingShortcuts, setEditingShortcuts] = useState(false);
  const { hrefs } = useMenuShortcuts();
  const primaryHrefs = new Set(["/dashboard", "/dashboard/messages"]);
  const catalog = visibleApps(isPlatformAdmin, disabledModules).flatMap(group => group.links).filter(link => link.href !== settingsLink.href && !primaryHrefs.has(link.href));
  const apps = visibleApps(isPlatformAdmin, disabledModules).flatMap(group => group.links);
  const primary = ["/dashboard", "/dashboard/messages"].map(href => apps.find(link => link.href === href)).filter((link): link is NavLink => !!link);
  const shortcuts = hrefs.filter(href => !primaryHrefs.has(href)).map(href => catalog.find(link => link.href === href)).filter((link): link is NavLink => !!link);
  return <nav aria-label="Navegação do dashboard" className="flex min-h-0 flex-1 flex-col gap-3">
    <div className="flex items-center justify-between gap-2 px-1"><h2 className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Aplicativos</h2>
      {onHide && <Button variant="ghost" size="icon-sm" aria-label="Ocultar menu lateral" aria-controls="dashboard-sidebar" onClick={onHide}><PanelLeftClose aria-hidden="true" /></Button>}
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Principal</p>
      {primary.map(link => { const Icon = link.icon; const active = isActive(pathname, link);
        return <Link key={link.href} href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
          className={cn("flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-foreground/5 hover:text-sidebar-foreground")}>
          <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} aria-hidden="true" /><span className="truncate">{link.label}</span>
        </Link>;
      })}
      <div className="mt-3 flex items-center justify-between px-3 pb-1 pt-2"><h3 className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Favoritos</h3><Button type="button" variant="ghost" size="xs" className="h-7 px-2 text-muted-foreground" onClick={() => setEditingShortcuts(true)}>Editar</Button></div>
      {shortcuts.map(link => { const Icon = link.icon; const active = isActive(pathname, link);
        return <Link key={link.href} href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
          className={cn("flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-foreground/5 hover:text-sidebar-foreground")}>
          <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} aria-hidden="true" /><span className="truncate">{link.label}</span>
        </Link>;
      })}
      {!shortcuts.length && <p className="px-3 py-3 text-xs text-muted-foreground">Adicione apps aos favoritos.</p>}
    </div>
    <div className="grid gap-1 border-t pt-2">
      <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={onOpenApps}><Apps aria-hidden="true" />Todos os apps</Button>
    </div>
    <Link href={settingsLink.href} onClick={onNavigate} aria-current={settingsPaths.some(prefix => pathname.startsWith(prefix)) ? "page" : undefined}
      className="flex shrink-0 items-center gap-2.5 border-t px-3 pt-3 pb-1 text-[13px] text-muted-foreground outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:font-medium aria-[current=page]:text-sidebar-foreground">
      <Settings className="size-4 shrink-0" aria-hidden="true" />Ajustes
    </Link>
    {editingShortcuts && <ShortcutsEditor catalog={catalog} chosen={hrefs} onClose={() => setEditingShortcuts(false)} />}
  </nav>;
}


function AppTile({ link, active, onNavigate }: { link: NavLink; active: boolean; onNavigate: () => void }) {
  const Icon = link.icon;
  // Galeria de apps (Nodus): ícone grande com o nome embaixo.
  return <Link href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
    className="group flex min-w-0 flex-col items-center gap-1.5 px-1 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span className="grid size-12 place-items-center rounded-2xl glass-card border text-sidebar-primary transition-transform group-active:scale-95 group-aria-[current=page]:border-sidebar-primary group-aria-[current=page]:bg-sidebar-primary group-aria-[current=page]:text-primary-foreground motion-reduce:transition-none">
      <Icon className="size-6" aria-hidden="true" />
    </span>
    <span className="line-clamp-2 w-full text-[11px] leading-tight font-medium group-aria-[current=page]:text-sidebar-primary">{link.label}</span>
  </Link>;
}

function DesktopAppsGallery({ open, onOpenChange, isPlatformAdmin, disabledModules }: { open: boolean; onOpenChange: (open: boolean) => void; isPlatformAdmin: boolean; disabledModules: string[] }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState("");
  const query = normalize(filter.trim());
  const groups = visibleApps(isPlatformAdmin, disabledModules)
    .map(group => ({ ...group, links: group.links.filter(link => !query || normalize(`${link.label} ${group.title}`).includes(query)) }))
    .filter(group => group.links.length);
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(44rem,calc(100dvh-2rem))] w-[min(52rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border glass-surface text-sidebar-foreground shadow-xl outline-none">
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div><Dialog.Title className="text-lg font-semibold">Galeria de apps</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Pesquise e abra as áreas disponíveis. Edite os favoritos pelo menu lateral.</Dialog.Description></div>
          <Dialog.Close render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar galeria" />}><X aria-hidden="true" /></Dialog.Close>
        </header>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <label className="flex h-10 items-center gap-2 border bg-background px-3 rounded-lg">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input autoFocus type="search" aria-label="Buscar apps" placeholder="Buscar app..." value={filter} onChange={event => setFilter(event.target.value)} onKeyDown={event => { if (event.key === "Escape") setFilter(""); }} className="min-w-0 flex-1 bg-transparent text-base sm:text-sm outline-none placeholder:text-muted-foreground" />
          </label>
          {groups.map(group => <section key={group.title} aria-label={group.title}>
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{group.title}</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{group.links.map(link => <AppTile key={link.href} link={link} active={isActive(pathname, link)} onNavigate={() => onOpenChange(false)} />)}</div>
          </section>)}
          {!groups.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum app encontrado.</p>}
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

/** Menu do celular: folha que sobe de baixo com atalhos e apps em ícones (Nodus). Arrastar a alça para baixo fecha. */
function MobileMenuSheet({ isPlatformAdmin, disabledModules, onClose }: { isPlatformAdmin: boolean; disabledModules: string[]; onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [editingShortcuts, setEditingShortcuts] = useState(false);
  const { hrefs: shortcutHrefs } = useMenuShortcuts();
  const start = useRef<number | null>(null);
  const query = normalize(filter.trim());
  const all = [...navigation, { title: "Ajustes", links: [settingsLink] }].map(group => ({ ...group, links: group.links.filter(link => (!link.adminOnly || isPlatformAdmin) && !hiddenHref(link.href, disabledModules)) }));
  const isDrive = pathname.startsWith("/dashboard/drive");
  const driveLinks: NavLink[] = [
    { label: "Recentes", href: "/dashboard/drive?view=recent", icon: Time },
    { label: "Meu Drive", href: "/dashboard/drive", icon: HardDrive },
    { label: "Compartilhados", href: "/dashboard/drive?view=shared", icon: Users },
    { label: "Público", href: "/dashboard/drive?view=public", icon: Globe },
    { label: "Com link", href: "/dashboard/drive?view=links", icon: LinkIcon },
  ];
  // Início e Mensagens já estão na barra inferior.
  const sections = all.map(group => ({ ...group, links: group.links.filter(link => link.href !== "/dashboard" && link.href !== "/dashboard/messages" && (query || !shortcutHrefs.includes(link.href)) && (!query || normalize(`${link.label} ${group.title}`).includes(query))) })).filter(group => group.links.length);
  const catalog = all.flatMap(group => group.links).filter(link => link.href !== "/dashboard" && link.href !== "/dashboard/messages");
  const shortcuts = shortcutHrefs.map(href => catalog.find(link => link.href === href)).filter((link): link is NavLink => !!link);
  return <Dialog.Popup id="dashboard-mobile-menu" style={offset ? { transform: `translateY(${offset}px)` } : undefined}
    className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl border-t glass-surface text-sidebar-foreground shadow-xl transition-transform duration-200 data-ending-style:translate-y-full data-starting-style:translate-y-full motion-reduce:transition-none md:hidden">
    <div className="shrink-0 touch-none px-4 pt-2 pb-3"
      onPointerDown={event => { start.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { if (start.current !== null) setOffset(Math.max(0, event.clientY - start.current)); }}
      onPointerUp={() => { if (offset > 90) onClose(); start.current = null; setOffset(0); }}
      onPointerCancel={() => { start.current = null; setOffset(0); }}>
      <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-10 rounded-full bg-sidebar-foreground/25" />
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title className="text-sm font-semibold">Menu</Dialog.Title>
        <Dialog.Close render={<Button variant="ghost" size="icon-sm" aria-label="Fechar menu" />}><X aria-hidden="true" /></Dialog.Close>
      </div>
    </div>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <label className="flex h-9 items-center gap-2 border bg-background px-3 rounded-lg">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input type="search" aria-label="Buscar no menu" placeholder="Buscar app…" value={filter} onChange={event => setFilter(event.target.value)} className="min-w-0 flex-1 bg-transparent text-base sm:text-sm outline-none placeholder:text-muted-foreground" />
      </label>
      {isDrive && <section aria-label="Seções do Drive">
        <h3 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Drive</h3>
        <div className="grid grid-cols-4 gap-1">{driveLinks.map(link => {
          const view = new URLSearchParams(link.href.split("?")[1] ?? "").get("view");
          const active = pathname === "/dashboard/drive" && (view ? searchParams.get("view") === view : !searchParams.has("view"));
          return <AppTile key={link.href} link={link} active={active} onNavigate={onClose} />;
        })}</div>
      </section>}
      {!query && <section aria-label="Atalhos">
        <div className="mb-2 flex items-center justify-between px-1"><h3 className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Atalhos</h3><Button type="button" variant="ghost" size="xs" className="text-sidebar-primary" onClick={() => setEditingShortcuts(true)}>Editar</Button></div>
        <div className="grid grid-cols-4 gap-1">{shortcuts.map(link => <AppTile key={link.href} link={link} active={isActive(pathname, link)} onNavigate={onClose} />)}{!shortcuts.length && <p className="col-span-4 px-1 py-3 text-sm text-muted-foreground">Nenhum atalho. Toque em Editar para escolher.</p>}</div>
      </section>}
      {sections.map(group => <section key={group.title} aria-label={group.title}>
        <h3 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{group.title}</h3>
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">{group.links.map(link => <AppTile key={link.href} link={link} active={isActive(pathname, link)} onNavigate={onClose} />)}</div>
      </section>)}
      {!sections.length && <p className="px-1 text-sm text-muted-foreground">Nenhum app encontrado.</p>}
      {editingShortcuts && <ShortcutsEditor catalog={catalog} chosen={shortcutHrefs} onClose={() => setEditingShortcuts(false)} />}
    </div>
  </Dialog.Popup>;
}

/** Aviso no lugar da página quando o módulo dela está desligado (Nodus: módulo indisponível). */
function ModuleGate({ disabledModules, children }: { disabledModules: string[]; children: ReactNode }) {
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
function useUnreadMessages(enabled: boolean) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () => fetch("/api/org/messages", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(body => { if (alive && body) setUnread(body.unread ?? 0); }).catch(() => undefined);
    const first = setTimeout(load, 1500);
    const timer = setInterval(load, 30_000);
    return () => { alive = false; clearTimeout(first); clearInterval(timer); };
  }, [enabled]);
  return enabled ? unread : 0;
}

/** Barra fixa no rodapé, só no celular: Início, Mensagens e Menu (Nodus: MobileTabBar). */
function MobileTabBar({ menuOpen, messages }: { menuOpen: boolean; messages: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const unread = useUnreadMessages(messages);
  const tab = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:text-sidebar-primary";
  const driveTabs = pathname.startsWith("/dashboard/drive") ? [
    { label: "Recentes", href: "/dashboard/drive?view=recent", icon: Time, active: searchParams.get("view") === "recent" },
    { label: "Meu Drive", href: "/dashboard/drive", icon: HardDrive, active: !searchParams.has("view") || searchParams.has("folder") },
    { label: "Compartilhados", href: "/dashboard/drive?view=shared", icon: Users, active: searchParams.get("view") === "shared" },
    { label: "Público", href: "/dashboard/drive?view=public", icon: Globe, active: searchParams.get("view") === "public" },
    { label: "Com link", href: "/dashboard/drive?view=links", icon: LinkIcon, active: searchParams.get("view") === "links" },
  ] : [];
  const tabs = [
    { label: "Início", href: "/dashboard", icon: Home, active: pathname === "/dashboard" },
    { label: "Mensagens", href: "/dashboard/messages", icon: Chat, active: pathname.startsWith("/dashboard/messages"), badge: unread },
  ].filter(tab => messages || tab.href !== "/dashboard/messages");
  return <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t glass-bar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden print:hidden">
    {driveTabs.length > 0 && <div className="mx-auto grid h-12 max-w-lg grid-cols-5 items-stretch border-b border-sidebar-border/60 px-2">
      {driveTabs.map(({ label, href, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[9px] font-medium leading-tight text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:text-sidebar-primary">
        <Icon className="size-4" aria-hidden="true" /><span className="w-full truncate text-center">{label}</span>
      </Link>)}
    </div>}
    <div className="mx-auto flex h-14 max-w-lg items-stretch gap-1 px-2">
      {tabs.map(({ label, href, icon: Icon, active, badge }) => <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-label={badge ? `${label}, ${badge} não lida(s)` : undefined} className={tab}>
        <span className="relative"><Icon className="size-5" aria-hidden="true" />{!!badge && <span aria-hidden="true" className="absolute -top-1.5 left-3 grid h-4 min-w-4 place-items-center bg-destructive px-1 text-[10px] leading-none font-semibold text-white tabular-nums">{badge > 99 ? "99+" : badge}</span>}</span>
        <span className="max-w-full truncate">{label}</span>
      </Link>)}
      <Dialog.Trigger render={<button type="button" aria-label="Abrir menu" className={cn(tab, menuOpen && "text-sidebar-primary")} />}>
        <Apps className="size-5" aria-hidden="true" /><span>Menu</span>
      </Dialog.Trigger>
    </div>
  </nav>;
}

export function DashboardShell({ children, isPlatformAdmin = false, disabledModules = [] }: { children: ReactNode; isPlatformAdmin?: boolean; disabledModules?: string[] }) {
  const pathname = usePathname();
  const [width, setWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const drag = useRef<{ x: number; width: number } | null>(null);

  function resize(value: number) {
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value)));
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width };
    setIsResizing(true);
  }

  function stopResize() {
    drag.current = null;
    setIsResizing(false);
  }

  return (
    <div
      style={{ "--sidebar-width": `${width}px` } as CSSProperties}
      className={cn(
        // Sem fundo próprio: a luz ambiente do body (globals.css) aparece por trás do vidro.
        "dashboard-shell flex min-h-svh flex-col",
        isResizing && "cursor-col-resize select-none",
      )}
    >
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DashboardHeader
          menuButton={
            <>

              {!desktopOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex"
                  aria-label="Mostrar menu lateral"
                  aria-expanded={false}
                  aria-controls="dashboard-sidebar"
                  onClick={() => setDesktopOpen(true)}
                >
                  <PanelLeftOpen aria-hidden="true" />
                </Button>
              )}
            </>
          }
        />
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <MobileMenuSheet isPlatformAdmin={isPlatformAdmin} disabledModules={disabledModules} onClose={() => setMobileOpen(false)} />
        </Dialog.Portal>
        <MobileTabBar menuOpen={mobileOpen} messages={!disabledModules.includes("messages")} />
      </Dialog.Root>
      <DesktopAppsGallery open={appsOpen} onOpenChange={setAppsOpen} isPlatformAdmin={isPlatformAdmin} disabledModules={disabledModules} />
      <div className="flex min-w-0 flex-1">
        <aside
          id="dashboard-sidebar"
          aria-label="Menu do dashboard"
          className={cn(
            "relative hidden shrink-0 border-r glass-bar text-sidebar-foreground md:sticky md:top-[57px] md:h-[calc(100svh-57px)] md:w-(--sidebar-width)",
            desktopOpen ? "md:block" : "md:hidden",
          )}
        >
          <div className="flex h-full flex-col gap-4 p-3">
            <DashboardNavigation onHide={() => setDesktopOpen(false)} onOpenApps={() => setAppsOpen(true)} isPlatformAdmin={isPlatformAdmin} disabledModules={disabledModules} />
          </div>
          <div
            role="separator"
            tabIndex={0}
            aria-label="Redimensionar menu lateral"
            aria-controls="dashboard-sidebar"
            aria-orientation="vertical"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={width}
            onPointerDown={startResize}
            onPointerMove={(event) => {
              if (!drag.current) return;
              const nextWidth =
                drag.current.width + event.clientX - drag.current.x;
              if (nextWidth <= CLOSE_THRESHOLD) {
                stopResize();
                setDesktopOpen(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
                return;
              }
              resize(nextWidth);
            }}
            onPointerUp={(event) => {
              stopResize();
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={stopResize}
            onLostPointerCapture={stopResize}
            onDoubleClick={() => {
              stopResize();
              setDesktopOpen(false);
            }}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              if (event.key === "Home") resize(MIN_WIDTH);
              else if (event.key === "End") resize(MAX_WIDTH);
              else resize(width + (event.key === "ArrowRight" ? 16 : -16));
            }}
            className="absolute inset-y-0 -right-1 z-10 hidden w-2 touch-none cursor-col-resize items-center justify-center outline-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring md:flex"
          >
            <span
              aria-hidden="true"
              className="h-10 w-1 rounded-full bg-sidebar-foreground/15"
            />
          </div>
        </aside>
        <div className={cn("min-w-0 flex-1 md:pb-0", pathname.startsWith("/dashboard/drive") ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(3.5rem+env(safe-area-inset-bottom))]")}><ModulesProvider disabled={disabledModules}><ModuleGate disabledModules={disabledModules}>{children}</ModuleGate></ModulesProvider></div>
      </div>
    </div>
  );
}
