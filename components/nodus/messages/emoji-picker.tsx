"use client";
// Copiado do Nodus.
import { EmojiPicker as Frimousse } from "frimousse";

// Seletor de emojis com a biblioteca frimousse (sem estilo próprio): busca pelos nomes e palavras em
// português do Emojibase, categorias e tom de pele. Os dados vêm da CDN do Emojibase na primeira vez e
// ficam guardados no navegador.
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return <Frimousse.Root locale="pt" columns={8} onEmojiSelect={({ emoji }) => onPick(emoji)} className="flex h-80 w-full flex-col">
    <div className="flex items-center gap-1.5 pb-2">
      <Frimousse.Search autoFocus placeholder="Buscar emoji..." aria-label="Buscar emoji"
        className="h-8 min-w-0 flex-1 rounded-full border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 [&::-webkit-search-cancel-button]:hidden" />
      <Frimousse.SkinToneSelector aria-label="Mudar tom de pele" title="Tom de pele"
        className="grid size-8 shrink-0 place-items-center rounded-full text-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
    <Frimousse.Viewport className="relative flex-1 outline-none">
      <Frimousse.Loading className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">Carregando…</Frimousse.Loading>
      <Frimousse.Empty className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">Nenhum emoji encontrado.</Frimousse.Empty>
      <Frimousse.List className="select-none pb-1" components={{
        CategoryHeader: ({ category, ...props }) => <div {...props} className="glass-bar px-1 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground">{category.label}</div>,
        Row: ({ children, ...props }) => <div {...props} className="scroll-my-1">{children}</div>,
        Emoji: ({ emoji, ...props }) => <button {...props} className="grid size-8 flex-1 place-items-center rounded-lg text-xl data-active:bg-muted">{emoji.emoji}</button>,
      }} />
    </Frimousse.Viewport>
  </Frimousse.Root>;
}
