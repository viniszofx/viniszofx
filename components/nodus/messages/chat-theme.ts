"use client";
import type { CSSProperties } from "react";

// Temas de conversa: fundo em gradiente com um padrão desenhado por cima e balões enviados em gradiente.
// Ficam guardados neste aparelho, por conversa (é uma preferência visual de quem está vendo).

export const chatThemes = [
  { name: "classic", label: "Clássico", background: "", pattern: "none", sent: "" },
  { name: "ocean", label: "Oceano", background: "linear-gradient(160deg, rgb(14 165 233 / .22), rgb(99 102 241 / .16) 55%, rgb(34 211 238 / .14))", pattern: "waves", sent: "linear-gradient(135deg, #0284c7, #4f46e5)" },
  { name: "forest", label: "Floresta", background: "linear-gradient(160deg, rgb(22 163 74 / .2), rgb(132 204 22 / .12) 60%, rgb(20 184 166 / .14))", pattern: "dots", sent: "linear-gradient(135deg, #15803d, #0f766e)" },
  { name: "sunset", label: "Pôr do sol", background: "linear-gradient(160deg, rgb(249 115 22 / .22), rgb(236 72 153 / .16) 55%, rgb(234 179 8 / .14))", pattern: "diamonds", sent: "linear-gradient(135deg, #ea580c, #db2777)" },
  { name: "lavender", label: "Lavanda", background: "linear-gradient(160deg, rgb(168 85 247 / .2), rgb(99 102 241 / .14) 60%, rgb(236 72 153 / .1))", pattern: "dots", sent: "linear-gradient(135deg, #9333ea, #4f46e5)" },
  { name: "graphite", label: "Grafite", background: "linear-gradient(160deg, rgb(100 116 139 / .24), rgb(15 23 42 / .12))", pattern: "diamonds", sent: "linear-gradient(135deg, #475569, #1e293b)" },
] as const;
export type ChatTheme = (typeof chatThemes)[number]["name"];

const patterns: Record<string, string> = {
  none: "",
  dots: "radial-gradient(rgb(127 127 127 / .2) 1px, transparent 1.4px)",
  waves: "repeating-radial-gradient(circle at 0 0, transparent 0 14px, rgb(127 127 127 / .1) 14px 15px)",
  diamonds: "linear-gradient(45deg, rgb(127 127 127 / .08) 25%, transparent 25% 75%, rgb(127 127 127 / .08) 75%), linear-gradient(45deg, rgb(127 127 127 / .08) 25%, transparent 25% 75%, rgb(127 127 127 / .08) 75%)",
};
const sizes: Record<string, string> = { dots: "18px 18px", waves: "30px 30px", diamonds: "22px 22px, 22px 22px" };

const themeOf = (name: string) => chatThemes.find(theme => theme.name === name) ?? chatThemes[0];

/** Fundo da área de mensagens. */
export function themeBackground(name: string): CSSProperties {
  const theme = themeOf(name);
  if (!theme.background) return {};
  const pattern = patterns[theme.pattern];
  return {
    backgroundImage: [pattern, theme.background].filter(Boolean).join(", "),
    backgroundSize: pattern ? `${sizes[theme.pattern]}, auto` : undefined,
    backgroundPosition: theme.pattern === "diamonds" ? "0 0, 11px 11px, 0 0" : undefined,
  };
}

/** Balão enviado (texto branco sobre o gradiente do tema). */
export function sentBubble(name: string): CSSProperties | undefined {
  const theme = themeOf(name);
  return theme.sent ? { backgroundImage: theme.sent, color: "#fff" } : undefined;
}

const key = (peerId: string) => `viniszofx:dm-theme:${peerId}`;
export function readTheme(peerId: string): ChatTheme {
  try { const value = localStorage.getItem(key(peerId)); return chatThemes.some(theme => theme.name === value) ? value as ChatTheme : "classic"; } catch { return "classic"; }
}
export function saveTheme(peerId: string, name: ChatTheme) {
  try { if (name === "classic") localStorage.removeItem(key(peerId)); else localStorage.setItem(key(peerId), name); } catch { /* sem armazenamento: vale só nesta visita */ }
}
