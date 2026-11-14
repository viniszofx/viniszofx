"use client";
// Copiado do Nodus.
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiImageAddLine, RiPaletteLine } from "@remixicon/react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { chatPatterns, chatPresets, customFromPreset, customThemeVars, preset, type ChatCustomTheme, type ChatTheme } from "./chat-theme";

// Posições do gradiente livre; a cada passo cada ponto anda para a próxima (como no Telegram).
const points = [[80, 10], [60, 20], [35, 25], [25, 60], [20, 90], [40, 80], [65, 75], [75, 40]];

export function chatThemeProps(theme: ChatTheme): { className: string; style?: CSSProperties } {
  return theme.name === "custom"
    ? { className: "chat-theme-custom", style: customThemeVars(theme.custom) as CSSProperties }
    : { className: `chat-theme-${theme.name}` };
}

/** Fundo da conversa: gradiente livre, imagem (opcional, com desfoque) e padrão com intensidade. */
export function ChatBackdrop({ theme, step = 0, image }: { theme: ChatTheme; step?: number; image?: string | null }) {
  const source = theme.name === "custom" ? theme.custom : preset(theme.name)!;
  const blur = theme.name === "custom" && theme.custom.blur;
  const position = Object.fromEntries([0, 1, 2, 3].flatMap((index) => {
    const [x, y] = points[(step + index * 2) % points.length];
    return [[`--chat-p${index + 1}x`, `${x}%`], [`--chat-p${index + 1}y`, `${y}%`]];
  })) as CSSProperties;
  return <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="chat-gradient absolute inset-0" style={position} />
    {image
      ? <div className={cn("absolute inset-0 bg-cover bg-center", blur && "scale-110 blur-xl")} style={{ backgroundImage: `url("${image}")` }} />
      : source.pattern !== "none" && <div className={`chat-pattern chat-pattern-${source.pattern} absolute inset-0`} style={{ opacity: source.intensity / 100 }} />}
  </div>;
}

function Swatch({ label, value, onChange, onRemove }: { label: string; value: string; onChange: (value: string) => void; onRemove?: () => void }) {
  return <span className="group relative">
    <input type="color" aria-label={label} title={label} value={value} onChange={(event) => onChange(event.target.value)}
      className="block size-8 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0 shadow-sm [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0" />
    {onRemove && <button type="button" aria-label={`Remover ${label.toLowerCase()}`} onClick={onRemove}
      className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-foreground text-background shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0"><RiCloseLine className="size-3" /></button>}
  </span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><span className="font-medium">{label}</span><div className="flex flex-wrap items-center gap-2">{children}</div></div>;
}

export function ChatThemePicker({ theme, onChange, onChooseImage, onRemoveImage }: {
  theme: ChatTheme;
  onChange: (theme: ChatTheme) => void;
  onChooseImage: (file: File) => void;
  onRemoveImage: () => void;
}) {
  const custom = theme.custom;
  const edit = (patch: Partial<ChatCustomTheme>) => onChange({ name: "custom", custom: { ...custom, ...patch } });
  const setColor = (index: number, value: string) => edit({ colors: custom.colors.map((color, item) => item === index ? value : color) });

  return <div className="grid gap-3">
    <div className="grid grid-cols-3 gap-2">
      {chatPresets.map(({ name, label }) => <button key={name} type="button" aria-pressed={theme.name === name} onClick={() => onChange({ ...theme, name })}
        className={cn("rounded-xl border p-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", theme.name === name ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/30")}>
        <span className={`chat-theme-${name} relative isolate flex h-16 flex-col justify-center gap-1 overflow-hidden rounded-lg p-1.5`}>
          <ChatBackdrop theme={{ name, custom }} />
          <span className="max-w-12 rounded-md rounded-bl-sm bg-(--chat-received) px-1.5 py-0.5 text-[9px] text-(--chat-received-ink) shadow-sm">Olá</span>
          <span className="ml-auto max-w-12 rounded-md rounded-br-sm bg-linear-to-br from-(--chat-sent) to-(--chat-sent-2) px-1.5 py-0.5 text-[9px] text-(--chat-sent-ink) shadow-sm">Oi!</span>
        </span>
        <span className="mt-1 block truncate px-0.5 text-xs font-medium">{label}</span>
      </button>)}
    </div>
    <Button type="button" variant={theme.name === "custom" ? "secondary" : "outline"} size="sm" className="w-full justify-start"
      onClick={() => { if (theme.name !== "custom") onChange({ name: "custom", custom: customFromPreset(theme.name, custom) }); }}>
      <RiPaletteLine />Personalizar
    </Button>

    {theme.name === "custom" && <div className="grid gap-3 border-t pt-3 text-xs">
      <Row label="Fundo">
        {custom.image ? <>
          <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-input px-2 font-medium hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
            <RiImageAddLine className="size-3.5" />Trocar imagem
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onChooseImage(file); event.target.value = ""; }} />
          </label>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={onRemoveImage}><RiDeleteBinLine />Usar cores</Button>
        </> : <>
          {custom.colors.map((color, index) => <Swatch key={index} label={`Cor ${index + 1} do fundo`} value={color} onChange={(value) => setColor(index, value)}
            onRemove={custom.colors.length > 1 ? () => edit({ colors: custom.colors.filter((_, item) => item !== index) }) : undefined} />)}
          {custom.colors.length < 4 && <Button type="button" variant="outline" size="icon-sm" className="rounded-full" aria-label="Adicionar cor ao fundo" title="Adicionar cor"
            onClick={() => edit({ colors: [...custom.colors, custom.colors.at(-1) ?? "#ffffff"] })}><RiAddLine /></Button>}
          <label className="ml-auto inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-input px-2 font-medium hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
            <RiImageAddLine className="size-3.5" />Imagem
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onChooseImage(file); event.target.value = ""; }} />
          </label>
        </>}
      </Row>
      {custom.image
        ? <div className="flex items-center justify-between gap-2"><span className="font-medium">Desfocar</span><Switch checked={custom.blur} onChange={(blur) => edit({ blur })} label="Desfocar imagem de fundo" /></div>
        : <>
          <Row label="Padrão">
            {chatPatterns.map(({ name, label }) => <button key={name} type="button" aria-pressed={custom.pattern === name} onClick={() => edit({ pattern: name })}
              className={cn("rounded-full border px-2.5 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", custom.pattern === name ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>{label}</button>)}
          </Row>
          {custom.pattern !== "none" && <label className="grid gap-1.5">
            <span className="flex justify-between font-medium">Intensidade<span className="font-normal text-muted-foreground tabular-nums">{custom.intensity}%</span></span>
            <input type="range" min={0} max={100} step={5} value={custom.intensity} onChange={(event) => edit({ intensity: Number(event.target.value) })} className="w-full accent-primary" />
          </label>}
        </>}
      <Row label="Suas mensagens">
        <Swatch label="Cor inicial das suas mensagens" value={custom.sent[0]} onChange={(value) => edit({ sent: [value, custom.sent[1]] })} />
        <Swatch label="Cor final das suas mensagens" value={custom.sent[1]} onChange={(value) => edit({ sent: [custom.sent[0], value] })} />
      </Row>
      <Row label="Mensagens recebidas">
        <Swatch label="Cor das mensagens recebidas" value={custom.received} onChange={(received) => edit({ received })} />
      </Row>
      <p className="border-t pt-2 text-muted-foreground">As cores começam pelas do tema escolhido antes. O fundo se move a cada mensagem enviada. Suas mensagens usam um gradiente entre as duas cores. A imagem fica guardada só neste navegador.</p>
    </div>}
  </div>;
}
