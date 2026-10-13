"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode, type FormEvent } from "react";
import { Menu } from "@base-ui/react/menu";
import { RiSearchLine as Search, RiUserLine as UserRound, RiSettings3Line as Settings, RiLogoutBoxRLine as LogOut, RiHomeLine as House, RiLayoutGridLine as LayoutGrid, RiExternalLinkLine as External } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { DashboardMenuPopup, menuItemClass } from "./menu-popup";
import { authClient } from "@/lib/auth/client";
import { notifyError } from "@/lib/ui/notifications";

export function DashboardHeader({ menuButton }: { menuButton: ReactNode }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/dashboard/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  }
  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      window.location.replace("/login");
    } catch {
      notifyError("Não foi possível sair", "Tente novamente.");
    }
  }
  return <header className="sticky top-0 z-30 grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b bg-sidebar px-3 py-2 text-sidebar-foreground md:h-[57px] md:grid-cols-[1fr_minmax(15rem,32rem)_1fr] md:py-0">
    <div className="flex min-w-0 items-center gap-2">{menuButton}<Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold focus-visible:outline-ring"><span className="flex size-6 items-center justify-center border border-sidebar-primary text-xs font-bold text-sidebar-primary">V</span><span className="truncate">Viniccius</span><span className="hidden border-l pl-2 text-xs font-normal text-muted-foreground lg:inline">Console</span></Link></div>
    <form role="search" onSubmit={submit} className="order-last col-span-2 flex h-8 min-w-0 items-center gap-2 border bg-background px-2.5 md:order-none md:col-span-1">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input type="search" aria-label="Busca global" placeholder="Buscar…" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
      <kbd className="hidden text-[10px] text-muted-foreground sm:block">Enter</kbd>
    </form>
    <div className="flex items-center justify-end gap-2"><Link href="/" target="_blank" className="hidden items-center gap-1 border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground sm:inline-flex"><External className="size-3.5" />Ver site</Link><Menu.Root>
      <Menu.Trigger render={<Button variant="ghost" size="icon-sm" className="border" aria-label="Menu do usuário" />}><UserRound /></Menu.Trigger>
      <DashboardMenuPopup>
        <p className="border-b px-3 py-3 text-xs text-muted-foreground">Meu painel</p>
        <Menu.Item render={<Link href="/dashboard/workspace" />} className={menuItemClass}><LayoutGrid className="size-4" />Workspace</Menu.Item>
        <Menu.Item render={<Link href="/dashboard/settings/profile" />} className={menuItemClass}><UserRound className="size-4" />Perfil</Menu.Item>
        <Menu.Item render={<Link href="/dashboard/settings/workplace" />} className={menuItemClass}><Settings className="size-4" />Workplace</Menu.Item>
        <Menu.Item render={<Link href="/" />} className={menuItemClass}><House className="size-4" />Página inicial</Menu.Item>
        <Menu.Separator className="my-1 border-t" />
        <Menu.Item onClick={() => { void signOut(); }} className={menuItemClass}><LogOut className="size-4" />Sair do painel</Menu.Item>
      </DashboardMenuPopup>
    </Menu.Root></div>
  </header>;
}
