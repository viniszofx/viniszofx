"use client";
import { cn } from "@/lib/utils";
import { Dialog } from "@base-ui/react/dialog";
import { RiHomeLine as Home, RiGroupLine as Users, RiChat3Line as Chat, RiHardDrive2Line as HardDrive, RiTimeLine as Time, RiGlobalLine as Globe, RiLink as LinkIcon, RiApps2Line as Apps } from "@remixicon/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useUnreadMessages(enabled: boolean) {
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
export function MobileTabBar({ menuOpen, messages }: { menuOpen: boolean; messages: boolean }) {
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
