"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, Check } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { Button } from "@/components/ui/button";
import { DashboardMenuPopup, menuItemClass } from "./menu-popup";

type Theme = "light" | "dark" | "system";
const key = "viniszofx:theme";
function readTheme(): Theme {
  try { const value = localStorage.getItem(key); return value === "light" || value === "dark" ? value : "system"; }
  catch { return "system"; }
}
function applyTheme() {
  const theme = readTheme();
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
function subscribe(listener: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const update = () => { applyTheme(); listener(); };
  window.addEventListener("storage", update);
  window.addEventListener("viniszofx:theme-changed", update);
  media.addEventListener("change", update);
  applyTheme();
  return () => { window.removeEventListener("storage", update); window.removeEventListener("viniszofx:theme-changed", update); media.removeEventListener("change", update); };
}
const options = [{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Monitor }] as const;
export function ThemeSelector() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  return <Menu.Root>
    <Menu.Trigger render={<Button variant="ghost" className="w-full justify-start" aria-label="Selecionar tema" />}><Monitor />Tema<span className="ml-auto text-xs text-muted-foreground">{options.find(option => option.value === theme)?.label}</span></Menu.Trigger>
    <DashboardMenuPopup side="top">
      {options.map(({ value, label, icon: Icon }) => <Menu.Item key={value} className={menuItemClass} onClick={() => {
        try { localStorage.setItem(key, value); } catch { return; }
        window.dispatchEvent(new Event("viniszofx:theme-changed"));
      }}><Icon className="size-4" />{label}{theme === value && <Check className="ml-auto size-4" aria-label="Selecionado" />}</Menu.Item>)}
    </DashboardMenuPopup>
  </Menu.Root>;
}
