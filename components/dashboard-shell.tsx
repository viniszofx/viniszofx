"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { usePathname } from "next/navigation";
import { useId, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { RiHotelLine as Hotel, RiCarLine as Car, RiSuitcaseLine as Suitcase, RiHomeLine as Home, RiLayoutGridLine as LayoutGrid, RiFileTextLine as FileText, RiSettings3Line as Settings, RiGroupLine as Users, RiArrowDownSLine as ChevronDown, RiSidebarFoldLine as PanelLeftClose, RiSidebarUnfoldLine as PanelLeftOpen, RiMenuLine as Menu, RiCloseLine as X } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { Button } from "@/components/ui/button";

const MIN_WIDTH = 192;
const MAX_WIDTH = 360;
const CLOSE_THRESHOLD = 96;
const navigation = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Trip", href: "/dashboard/trip", icon: Suitcase },
  { label: "Reservations", href: "/dashboard/reservations", icon: Hotel },
  { label: "Fleet", href: "/dashboard/fleet", icon: Car },
  { label: "Workspace", href: "/dashboard/workspace", icon: LayoutGrid },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function DashboardNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const workspaceId = useId();
  const workspaceActive = pathname === "/dashboard/workspace";
  function navigationLink(label: string, href: string, Icon: typeof Home) {
    const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
    return <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", href === "/dashboard/workspace" ? "text-inherit" : active ? "bg-sidebar-primary/10 text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
      <Icon className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span>
    </Link>;
  }
  return <nav aria-label="Seções do dashboard" className="flex flex-1 flex-col gap-2">
    {navigation.map(({ label, href, icon }) => <div key={href}>
      {href === "/dashboard/workspace" ? <>
        <div className={cn("flex items-center transition-colors", workspaceActive ? "bg-sidebar-primary/10 text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>{navigationLink(label, href, icon)}<Button type="button" variant="ghost" size="icon-sm" className="self-stretch h-auto bg-transparent text-inherit hover:bg-transparent aria-expanded:bg-transparent dark:hover:bg-transparent dark:aria-expanded:bg-transparent" aria-label={workspaceOpen ? "Recolher Workspace" : "Expandir Workspace"} aria-expanded={workspaceOpen} aria-controls={workspaceId} onClick={() => setWorkspaceOpen(!workspaceOpen)}><ChevronDown className={cn("transition-transform motion-reduce:transition-none", !workspaceOpen && "-rotate-90")} /></Button></div>
        <div id={workspaceId} hidden={!workspaceOpen} className="ml-5 border-l border-sidebar-border pl-2">{navigationLink("Notes", "/dashboard/notes", FileText)}{navigationLink("Boards", "/dashboard/boards", LayoutGrid)}</div>
      </> : navigationLink(label, href, icon)}
    </div>)}
  </nav>;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(240);
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
      className={cn("flex min-h-svh flex-col bg-muted/30", isResizing && "cursor-col-resize select-none")}
    >
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DashboardHeader menuButton={<>
          <Dialog.Trigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}><Menu aria-hidden="true" /></Dialog.Trigger>
          {!desktopOpen && <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Mostrar menu lateral" aria-expanded={false} aria-controls="dashboard-sidebar" onClick={() => setDesktopOpen(true)}><PanelLeftOpen aria-hidden="true" /></Button>}
        </>} />
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup id="dashboard-mobile-sidebar" className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,85vw)] flex-col gap-6 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground shadow-xl transition-transform duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none">
            <div className="flex items-center justify-between px-3">
              <Dialog.Title className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meu painel</Dialog.Title>
              <Dialog.Close render={<Button variant="ghost" size="icon" aria-label="Fechar menu" />}><X aria-hidden="true" /></Dialog.Close>
            </div>
            <DashboardNavigation onNavigate={() => setMobileOpen(false)} />
            <footer className="mt-auto border-t pt-3"><ThemeSelector /></footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="flex min-w-0 flex-1">
      <aside id="dashboard-sidebar" aria-label="Menu do dashboard" className={cn("relative hidden shrink-0 bg-sidebar text-sidebar-foreground md:sticky md:top-[65px] md:h-[calc(100svh-65px)] md:w-(--sidebar-width)", desktopOpen ? "md:block" : "md:hidden")}>
        <div className="flex h-full flex-col gap-6 p-5">
          <div className="flex items-center justify-between gap-2 pl-3"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meu painel</p><Button variant="ghost" size="icon-sm" aria-label="Ocultar menu lateral" aria-expanded={desktopOpen} aria-controls="dashboard-sidebar" onClick={() => setDesktopOpen(false)}><PanelLeftClose aria-hidden="true" /></Button></div>
          <DashboardNavigation />
          <footer className="mt-auto border-t pt-3"><ThemeSelector /></footer>
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
