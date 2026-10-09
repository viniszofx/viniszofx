"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode, type FormEvent } from "react";
import { Menu } from "@base-ui/react/menu";
import { Search, UserRound, Settings, LogOut, House, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMenuPopup, menuItemClass } from "./menu-popup";

export function DashboardHeader({ menuButton }: { menuButton: ReactNode }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/dashboard/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  }
  return <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto] items-center gap-3 border-b bg-sidebar px-4 py-3 text-sidebar-foreground md:grid-cols-[1fr_minmax(0,36rem)_1fr] md:px-6">
    <div className="flex min-w-0 items-center gap-2">{menuButton}<Link href="/dashboard" className="truncate font-heading text-lg font-semibold focus-visible:outline-ring">Viniccius</Link></div>
    <form role="search" onSubmit={submit} className="order-last col-span-2 flex h-10 min-w-0 items-center gap-2 rounded-none border bg-background/50 px-3 md:order-none md:col-span-1">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input type="search" aria-label="Busca global" placeholder="Buscar em tudo…" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      <Button type="submit" variant="ghost" size="icon-sm" aria-label="Buscar"><Search /></Button>
    </form>
    <div className="flex justify-end"><Menu.Root>
      <Menu.Trigger render={<Button variant="ghost" size="icon" className="rounded-full bg-primary/10" aria-label="Menu do usuário" />}><UserRound /></Menu.Trigger>
      <DashboardMenuPopup>
        <p className="border-b px-3 py-3 text-xs text-muted-foreground">Meu painel</p>
        <Menu.Item render={<Link href="/dashboard/workspace" />} className={menuItemClass}><LayoutGrid className="size-4" />Workspace</Menu.Item>
        <Menu.Item render={<Link href="/dashboard/settings" />} className={menuItemClass}><Settings className="size-4" />Configurações</Menu.Item>
        <Menu.Item render={<Link href="/" />} className={menuItemClass}><House className="size-4" />Página inicial</Menu.Item>
        <Menu.Separator className="my-1 border-t" />
        <Menu.Item render={<Link href="/login" />} className={menuItemClass}><LogOut className="size-4" />Sair do painel</Menu.Item>
      </DashboardMenuPopup>
    </Menu.Root></div>
  </header>;
}
