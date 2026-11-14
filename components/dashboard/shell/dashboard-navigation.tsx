"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMenuShortcuts } from "@/lib/nodus/shortcuts";
import { ShortcutsEditor } from "@/components/dashboard/shortcuts-editor";
import { RiSidebarFoldLine as PanelLeftClose, RiSettings3Line as Settings, RiApps2Line as Apps } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavLink, settingsLink, settingsPaths, isActive, visibleApps } from "./navigation";

export function DashboardNavigation({ onNavigate, onHide, onOpenApps, isPlatformAdmin, disabledModules }: { onNavigate?: () => void; onHide?: () => void; onOpenApps: () => void; isPlatformAdmin: boolean; disabledModules: string[] }) {
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
