"use client";
import { useSyncExternalStore } from "react";
import { RiComputerLine as Monitor, RiMoonLine as Moon, RiSunLine as Sun } from "@/components/icons";
import { readTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

// Ordem do clique: Sistema → Claro → Escuro → Sistema.
const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const labels: Record<Theme, string> = { system: "Tema do aparelho", light: "Tema claro", dark: "Tema escuro" };
const icons = { system: Monitor, light: Sun, dark: Moon };

/** Botão de tema do site público: alterna os três modos num clique, sem o menu do painel (mais leve). */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as Theme);
  const Icon = icons[theme];
  return <button type="button" onClick={() => setTheme(next[theme])} aria-label={`${labels[theme]}. Trocar tema`} title={labels[theme]}
    className="grid size-9 place-items-center outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">
    <Icon className="size-[1.1rem]" aria-hidden="true" />
  </button>;
}
