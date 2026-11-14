"use client";

// Temas de conversa no modelo do Telegram (copiado do Nodus): fundo em gradiente livre (até 4 cores que se
// movem a cada mensagem enviada), padrão desenhado por cima com intensidade ajustável, balões enviados em
// gradiente e versão clara/escura. As cores dos temas prontos ficam no CSS (globals.css); aqui ficam o
// padrão e a intensidade de cada um. Tudo fica neste aparelho, por conversa.

export const chatPatterns = [
  { name: "none", label: "Nenhum" },
  { name: "dots", label: "Pontos" },
  { name: "waves", label: "Ondas" },
  { name: "diamonds", label: "Losangos" },
  { name: "doodles", label: "Rabiscos" },
] as const;
export type ChatPattern = (typeof chatPatterns)[number]["name"];

export const chatPresets = [
  { name: "classic", label: "Clássico", pattern: "dots", intensity: 35 },
  { name: "ocean", label: "Oceano", pattern: "waves", intensity: 45 },
  { name: "forest", label: "Floresta", pattern: "doodles", intensity: 40 },
  { name: "sunset", label: "Pôr do sol", pattern: "doodles", intensity: 40 },
  { name: "lavender", label: "Lavanda", pattern: "diamonds", intensity: 40 },
  { name: "graphite", label: "Grafite", pattern: "dots", intensity: 30 },
] as const satisfies readonly { name: string; label: string; pattern: ChatPattern; intensity: number }[];
export type ChatPresetName = (typeof chatPresets)[number]["name"];
export type ChatThemeName = ChatPresetName | "custom";

export type ChatCustomTheme = {
  colors: string[];
  pattern: ChatPattern;
  intensity: number;
  sent: [string, string];
  received: string;
  /** Há uma imagem de fundo guardada no IndexedDB (grande demais para o localStorage). */
  image: boolean;
  blur: boolean;
};
export type ChatTheme = { name: ChatThemeName; custom: ChatCustomTheme };

export const defaultChatTheme: ChatTheme = {
  name: "classic",
  custom: { colors: ["#dbe8fb", "#eef3fb"], pattern: "dots", intensity: 35, sent: ["#287cf0", "#3d9bf2"], received: "#ffffff", image: false, blur: false },
};

const hex = /^#[0-9a-f]{6}$/i;
const isHex = (value: unknown): value is string => typeof value === "string" && hex.test(value);
const key = (userId: string, peerId: string) => `viniszofx:dm-theme:${userId}:${peerId}`;

export function preset(name: ChatThemeName) {
  return chatPresets.find(item => item.name === name);
}

export function loadChatTheme(userId: string, peerId: string): ChatTheme {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key(userId, peerId)); } catch { /* sem armazenamento */ }
  if (!raw) return structuredClone(defaultChatTheme);
  try {
    const parsed = JSON.parse(raw) as { name?: string; custom?: Record<string, unknown> };
    const name = (parsed.name === "custom" || preset(parsed.name as ChatThemeName) ? parsed.name : "classic") as ChatThemeName;
    const custom = parsed.custom ?? {};
    const base = defaultChatTheme.custom;
    const colors = Array.isArray(custom.colors) ? custom.colors.filter(isHex).slice(0, 4) : [];
    const sent = Array.isArray(custom.sent) ? custom.sent.filter(isHex) : [];
    return {
      name,
      custom: {
        colors: colors.length ? colors : base.colors,
        pattern: chatPatterns.some(item => item.name === custom.pattern) ? custom.pattern as ChatPattern : base.pattern,
        intensity: typeof custom.intensity === "number" ? Math.min(100, Math.max(0, Math.round(custom.intensity))) : base.intensity,
        sent: sent.length === 2 ? [sent[0], sent[1]] : base.sent,
        received: isHex(custom.received) ? custom.received : base.received,
        image: custom.image === true,
        blur: custom.blur === true,
      },
    };
  } catch {
    return structuredClone(defaultChatTheme);
  }
}

export function saveChatTheme(userId: string, peerId: string, theme: ChatTheme) {
  try { localStorage.setItem(key(userId, peerId), JSON.stringify(theme)); } catch { /* vale só nesta visita */ }
}

// Imagem de fundo: no IndexedDB do aparelho (o localStorage não comporta imagens).
function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("viniszofx-chat", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("wallpapers");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
const wallpaperKey = (userId: string, peerId: string) => `${userId}:${peerId}`;

export async function loadChatWallpaper(userId: string, peerId: string) {
  try {
    const db = await database();
    const blob = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction("wallpapers").objectStore("wallpapers").get(wallpaperKey(userId, peerId));
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    db.close();
    return blob instanceof Blob ? blob : null;
  } catch { return null; }
}

export async function saveChatWallpaper(userId: string, peerId: string, image: Blob | null) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const store = db.transaction("wallpapers", "readwrite").objectStore("wallpapers");
    const request = image ? store.put(image, wallpaperKey(userId, peerId)) : store.delete(wallpaperKey(userId, peerId));
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  db.close();
}

/** Apaga temas e imagens de fundo deste aparelho (ao sair da conta). */
export function clearChatThemes() {
  try { for (const name of Object.keys(localStorage)) if (name.startsWith("viniszofx:dm-theme:")) localStorage.removeItem(name); } catch { /* nada a apagar */ }
  try { indexedDB.deleteDatabase("viniszofx-chat"); } catch { /* sem IndexedDB */ }
}

/** Variáveis CSS do tema personalizado; as cores repetem até completar os 4 pontos do gradiente. */
export function customThemeVars(custom: ChatCustomTheme) {
  const colors = custom.colors.length ? custom.colors : defaultChatTheme.custom.colors;
  return {
    ...Object.fromEntries([0, 1, 2, 3].map(index => [`--chat-bg-${index + 1}`, colors[index % colors.length]])),
    "--chat-sent": custom.sent[0],
    "--chat-sent-2": custom.sent[1],
    "--chat-sent-ink": contrastText(custom.sent[0]),
    "--chat-received": custom.received,
    "--chat-received-ink": contrastText(custom.received),
  } as Record<string, string>;
}

/** Ponto de partida do personalizado: as cores do tema pronto como aparecem agora (claro ou escuro). */
export function customFromPreset(name: ChatPresetName, current: ChatCustomTheme): ChatCustomTheme {
  const probe = document.createElement("span");
  probe.className = `chat-theme-${name}`;
  probe.hidden = true;
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const toHex = (variable: string, fallback: string) => {
    const value = style.getPropertyValue(variable).trim();
    if (!context || !value) return fallback;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = fallback;
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return "#" + [r, g, b].map(part => part.toString(16).padStart(2, "0")).join("");
  };
  const base = defaultChatTheme.custom;
  const colors = [1, 2, 3, 4].map(index => toHex(`--chat-bg-${index}`, base.colors[0]));
  probe.remove();
  const source = preset(name)!;
  return { ...current, colors, pattern: source.pattern, intensity: source.intensity, sent: [toHex("--chat-sent", base.sent[0]), toHex("--chat-sent-2", base.sent[1])], received: toHex("--chat-received", base.received) };
}

export function contrastText(hex: string) {
  const values = [1, 3, 5].map(start => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  return luminance > 0.18 ? "#111827" : "#ffffff";
}
