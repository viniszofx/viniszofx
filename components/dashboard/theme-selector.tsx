"use client";

import { useSyncExternalStore } from "react";
import { RiComputerLine as Monitor, RiMoonLine as Moon, RiSunLine as Sun, RiCheckLine as Check } from "@remixicon/react";
import { Menu } from "@base-ui/react/menu";
import { Button } from "@/components/ui/button";
import { DashboardMenuPopup, menuItemClass } from "./menu-popup";

import { readTheme, setTheme, subscribeTheme as subscribe, type Theme } from "@/lib/theme";

const options = [{ value: "light", label: "Claro", icon: Sun }, { value: "dark", label: "Escuro", icon: Moon }, { value: "system", label: "Sistema", icon: Monitor }] as const;
export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const Icon = options.find(option => option.value === theme)?.icon ?? Monitor;
  return <Menu.Root>
    <Menu.Trigger render={<Button variant="ghost" size={compact ? "icon-sm" : "default"} className={compact ? undefined : "w-full justify-start"} aria-label="Selecionar tema" />}><Icon />{!compact && <>Tema<span className="ml-auto text-xs text-muted-foreground">{options.find(option => option.value === theme)?.label}</span></>}</Menu.Trigger>
    <DashboardMenuPopup side={compact ? "bottom" : "top"}>
      {options.map(({ value, label, icon: Icon }) => <Menu.Item key={value} className={menuItemClass} onClick={() => setTheme(value)}><Icon className="size-4" />{label}{theme === value && <Check className="ml-auto size-4" aria-label="Selecionado" />}</Menu.Item>)}
    </DashboardMenuPopup>
  </Menu.Root>;
}
