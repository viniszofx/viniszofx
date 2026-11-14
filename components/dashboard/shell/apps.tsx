"use client";
import { Button } from "@/components/ui/button";
import { hiddenHref } from "@/lib/modules";
import { useMenuShortcuts } from "@/lib/nodus/shortcuts";
import { ShortcutsEditor } from "@/components/dashboard/shortcuts-editor";
import { Dialog } from "@base-ui/react/dialog";
import { RiGroupLine as Users, RiCloseLine as X, RiHardDrive2Line as HardDrive, RiTimeLine as Time, RiGlobalLine as Globe, RiLink as LinkIcon, RiSearchLine as Search } from "@remixicon/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { NavLink, navigation, settingsLink, isActive, normalize, visibleApps } from "./navigation";

export function AppTile({ link, active, onNavigate }: { link: NavLink; active: boolean; onNavigate: () => void }) {
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

export function DesktopAppsGallery({ open, onOpenChange, isPlatformAdmin, disabledModules }: { open: boolean; onOpenChange: (open: boolean) => void; isPlatformAdmin: boolean; disabledModules: string[] }) {
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
export function MobileMenuSheet({ isPlatformAdmin, disabledModules, onClose }: { isPlatformAdmin: boolean; disabledModules: string[]; onClose: () => void }) {
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
