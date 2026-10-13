"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { usePathname } from "next/navigation";
import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { RiHotelLine as Hotel, RiCarLine as Car, RiSuitcaseLine as Suitcase, RiHomeLine as Home, RiLayoutGridLine as LayoutGrid, RiFileTextLine as FileText, RiSettings3Line as Settings, RiGroupLine as Users, RiUserLine as User, RiArticleLine as Article, RiAdvertisementLine as Advertisement, RiSidebarFoldLine as PanelLeftClose, RiSidebarUnfoldLine as PanelLeftOpen, RiMenuLine as Menu, RiCloseLine as X, RiArrowDownSLine as ChevronDown } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { Button } from "@/components/ui/button";

const MIN_WIDTH = 204;
const MAX_WIDTH = 320;
const CLOSE_THRESHOLD = 96;
const navigation = [
  { title: "Visão geral", links: [{ label: "Início", href: "/dashboard", icon: Home }] },
  { title: "Pessoas", links: [
    { label: "Clientes", href: "/dashboard/clients", icon: Users },
    { label: "Colaboradores", href: "/dashboard/employees", icon: Users },
  ] },
  { title: "Operações", links: [
    { label: "Viagens", href: "/dashboard/trip", icon: Suitcase },
    { label: "Reservas", href: "/dashboard/reservations", icon: Hotel },
    { label: "Frota", href: "/dashboard/fleet", icon: Car },
  ] },
  { title: "Workspace", links: [
    { label: "Visão geral", href: "/dashboard/workspace", icon: LayoutGrid },
    { label: "Notas", href: "/dashboard/notes", icon: FileText },
    { label: "Quadros", href: "/dashboard/boards", icon: LayoutGrid },
  ] },
  { title: "Conteúdo", links: [
    { label: "Blog", href: "/dashboard/blog", icon: Article },
    { label: "Publicidade", href: "/dashboard/ads", icon: Advertisement },
  ] },
  { title: "Configurações", links: [
    { label: "Visão geral", href: "/dashboard/settings", icon: Settings },
    { label: "Perfil", href: "/dashboard/settings/profile", icon: User },
    { label: "Workplace", href: "/dashboard/settings/workplace", icon: Settings },
  ] },
] as const;

function DashboardNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  function navigationLink(label: string, href: string, Icon: typeof Home) {
    const active = ["/dashboard", "/dashboard/workspace", "/dashboard/settings"].includes(href) ? pathname === href : pathname.startsWith(href);
    return <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-w-0 items-center gap-2.5 border-l-2 px-3 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", active ? "border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-foreground" : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
      <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} aria-hidden="true" /><span className="truncate">{label}</span>
    </Link>;
  }
  return <nav aria-label="Seções do dashboard" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
    {navigation.map(({ title, links }) => <section key={title} aria-label={title}>
      <h2 className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">{title}</h2>
      <div className="flex flex-col">{links.map(({ label, href, icon }) => <div key={href}>{navigationLink(label, href, icon)}</div>)}</div>
    </section>)}
  </nav>;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      className={cn("dashboard-shell flex min-h-svh flex-col bg-background", isResizing && "cursor-col-resize select-none")}
    >
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DashboardHeader menuButton={<>
          <Dialog.Trigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}><Menu aria-hidden="true" /></Dialog.Trigger>
          {!desktopOpen && <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Mostrar menu lateral" aria-expanded={false} aria-controls="dashboard-sidebar" onClick={() => setDesktopOpen(true)}><PanelLeftOpen aria-hidden="true" /></Button>}
        </>} />
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup id="dashboard-mobile-sidebar" className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto border-r bg-sidebar p-3 text-sidebar-foreground shadow-xl transition-transform duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none">
            <div className="flex items-center justify-between px-2">
              <Dialog.Title className="text-sm font-semibold">Navegação</Dialog.Title>
              <Dialog.Close render={<Button variant="ghost" size="icon" aria-label="Fechar menu" />}><X aria-hidden="true" /></Dialog.Close>
            </div>
            <Link href="/dashboard/workspace" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border bg-background px-3 py-2 text-xs"><span><span className="block text-muted-foreground">Área de trabalho</span><strong className="mt-0.5 block font-medium">Meu Workplace</strong></span><ChevronDown className="size-4 text-muted-foreground" /></Link>
            <DashboardNavigation onNavigate={() => setMobileOpen(false)} />
            <footer className="mt-auto border-t pt-2"><ThemeSelector /></footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="flex min-w-0 flex-1">
      <aside id="dashboard-sidebar" aria-label="Menu do dashboard" className={cn("relative hidden shrink-0 border-r bg-sidebar text-sidebar-foreground md:sticky md:top-[57px] md:h-[calc(100svh-57px)] md:w-(--sidebar-width)", desktopOpen ? "md:block" : "md:hidden")}>
        <div className="flex h-full flex-col gap-4 p-3">
          <div className="flex items-center gap-1"><Link href="/dashboard/workspace" className="flex min-w-0 flex-1 items-center justify-between border bg-background px-3 py-2 text-xs hover:bg-sidebar-accent"><span className="min-w-0"><span className="block text-[10px] text-muted-foreground">Área de trabalho</span><strong className="mt-0.5 block truncate font-medium">Meu Workplace</strong></span><ChevronDown className="size-4 shrink-0 text-muted-foreground" /></Link><Button variant="ghost" size="icon-sm" aria-label="Ocultar menu lateral" aria-expanded={desktopOpen} aria-controls="dashboard-sidebar" onClick={() => setDesktopOpen(false)}><PanelLeftClose aria-hidden="true" /></Button></div>
          <DashboardNavigation />
          <footer className="mt-auto border-t pt-2"><ThemeSelector /></footer>
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
            const nextWidth = drag.current.width + event.clientX - drag.current.x;
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
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            if (event.key === "Home") resize(MIN_WIDTH);
            else if (event.key === "End") resize(MAX_WIDTH);
            else resize(width + (event.key === "ArrowRight" ? 16 : -16));
          }}
          className="absolute inset-y-0 -right-1 z-10 hidden w-2 touch-none cursor-col-resize items-center justify-center outline-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring md:flex"
        >
          <span aria-hidden="true" className="h-10 w-1 rounded-full bg-sidebar-foreground/15" />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {children}
      </div>
      </div>
    </div>
  );
}
