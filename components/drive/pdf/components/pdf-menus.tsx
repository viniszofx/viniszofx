import type { ReactNode, RefObject } from "react";
import { RiArrowDownSLine, RiArrowUpSLine, RiChat1Line, RiCheckLine, RiDeleteBinLine, RiFileCopyLine, RiMarkPenLine, RiMoreLine, RiSearchLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PopoverClose } from "@/components/ui/popover";
import type { CommentDraft } from "../pdf-model";
import { defaultZoom, SPREADS, type ZoomPreset } from "./pdf-viewer-hooks";

export function MenuItem({ icon, disabled, onClick, children }: { icon?: ReactNode; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <PopoverClose className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted" disabled={disabled} onClick={onClick}>{icon ?? <span className="size-4" />}{children}</PopoverClose>;
}

export const MenuSeparator = () => <div className="my-1 border-t" />;

// Ajuste do zoom e exibição de páginas, no menu da barra e no menu "Mais".
export function ViewMenuItems({ spread, onZoom, onSpread }: { spread: number; onZoom: (preset: ZoomPreset) => void; onSpread: (value: number) => void }) {
  return <>
    <MenuItem onClick={() => onZoom("page-width")}>Ajustar à largura</MenuItem>
    <MenuItem onClick={() => onZoom("page-fit")}>Página inteira</MenuItem>
    <MenuSeparator />
    {SPREADS.map(([value, label]) => <MenuItem key={value} icon={<RiCheckLine className={`size-4 ${spread === value ? "" : "invisible"}`} />} onClick={() => onSpread(value)}>{label}</MenuItem>)}
  </>;
}

// Zoom digitado: número, "auto" (ou "página", "inteira") para a página inteira, "largura" (ou "ajustar") para a largura.
// Enter ou sair do campo aplica; Esc volta ao valor atual.
export function PdfZoomInput({ zoom, disabled, className, onScale, onZoom }: { zoom: number; disabled: boolean; className: string; onScale: (scale: number) => void; onZoom: (preset: ZoomPreset) => void }) {
  const shown = `${zoom}%`;
  return <Input key={zoom} aria-label="Zoom" title="Zoom: digite a porcentagem, auto (página inteira) ou largura, e tecle Enter" defaultValue={shown} disabled={disabled} inputMode="numeric"
    onFocus={(event) => event.currentTarget.select()}
    onKeyDown={(event) => {
      if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
      else if (event.key === "Escape") { event.currentTarget.value = shown; event.currentTarget.blur(); }
    }}
    onBlur={(event) => {
      const field = event.currentTarget;
      const word = field.value.trim().toLowerCase();
      const preset = /^(auto|p[aá]gina|inteira)/.test(word) ? defaultZoom() : /^(ajustar|largura)/.test(word) ? "page-width" : null;
      const typed = Number.parseFloat(field.value.replace(",", ".").replace(/[^\d.]/g, ""));
      if (preset) onZoom(preset);
      else if (Number.isFinite(typed) && typed > 0 && Math.round(typed) !== zoom) { onScale(typed / 100); return; }
      field.value = shown;
    }}
    className={`h-7 w-14 px-1 text-center text-xs tabular-nums ${className}`} />;
}

export function PdfSearchBar({ query, matches, inputRef, onChange, onFind, onClose }: {
  query: string;
  matches: { current: number; total: number };
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (query: string) => void;
  onFind: (previous: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b p-1.5">
      <Input ref={inputRef} aria-label="Localizar no documento" placeholder="Localizar no documento" value={query} className="h-7 max-w-64 text-xs"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onFind(event.shiftKey);
          if (event.key === "Escape") onClose();
        }} />
      <span className="px-1 text-xs tabular-nums text-muted-foreground">{query ? `${matches.current} de ${matches.total}` : ""}</span>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Anterior" onClick={() => onFind(true)}><RiArrowUpSLine /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Próxima" onClick={() => onFind(false)}><RiArrowDownSLine /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
    </div>
  );
}

// Barra flutuante ao lado do texto selecionado (só em telas largas).
export function PdfSelectionBar({ left, top, onCopy, onFind, onHighlight, onComment, onMore }: { left: number; top: number; onCopy: () => void; onFind: () => void; onHighlight: () => void; onComment: () => void; onMore: () => void }) {
  const actions: [string, string, ReactNode, () => void][] = [
    ["Copiar seleção", "Copiar", <RiFileCopyLine key="copy" className="size-4" />, onCopy],
    ["Localizar seleção no PDF", "Localizar no PDF", <RiSearchLine key="find" className="size-4" />, onFind],
    ["Realçar seleção", "Realçar", <RiMarkPenLine key="highlight" className="size-4" />, onHighlight],
    ["Comentar seleção", "Comentar", <RiChat1Line key="comment" className="size-4" />, onComment],
    ["Mais ações da seleção", "Mais ações", <RiMoreLine key="more" className="size-4" />, onMore],
  ];
  return <div role="toolbar" aria-label="Ações da seleção" onMouseDown={(event) => event.preventDefault()} style={{ left, top }} className="absolute z-30 hidden flex-col rounded-2xl bg-neutral-900 p-1 text-white shadow-xl md:flex">
    {actions.map(([label, title, icon, onClick]) => <button key={label} type="button" aria-label={label} title={title} onClick={onClick} className="grid size-9 place-items-center rounded-xl hover:bg-white/15">{icon}</button>)}
  </div>;
}

export type ContextMenuState = { left: number; top: number; anchor: CommentDraft; highlightId?: string; nativeHighlight?: boolean };

// Menu do botão direito sobre a página.
export function PdfContextMenu({ menu, editMode, spread, onClose, onRemoveHighlight, onHighlight, onComment, onCopy, onFind, onFitWidth, onOrganize, onPagination, onEdit, onSpread, onRotate, onPrint }: {
  menu: ContextMenuState;
  editMode: boolean;
  spread: number;
  onClose: () => void;
  onRemoveHighlight: () => void;
  onHighlight: () => void;
  onComment: () => void;
  onCopy: (text: string) => void;
  onFind: (text: string) => void;
  onFitWidth: () => void;
  onOrganize: () => void;
  onPagination: () => void;
  onEdit: () => void;
  onSpread: (value: number) => void;
  onRotate: () => void;
  onPrint: () => void;
}) {
  const quote = menu.anchor.quote;
  const item = (label: ReactNode, run: () => void, icon?: ReactNode) => (
    <button type="button" role="menuitem" onClick={() => { onClose(); run(); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted">{icon}{label}</button>
  );
  return <div role="menu" aria-label="Ações do PDF" style={{ left: menu.left, top: menu.top }} className="fixed z-50 hidden min-w-48 rounded-md border bg-card p-1 shadow-lg md:block">
    {(menu.highlightId || menu.nativeHighlight) && item("Remover realce", onRemoveHighlight, <RiDeleteBinLine className="size-4" />)}
    {!!menu.anchor.boxes?.length && item("Realçar seleção", onHighlight, <RiMarkPenLine className="size-4" />)}
    {item(quote ? "Comentar seleção" : "Adicionar comentário aqui", onComment, <RiChat1Line className="size-4" />)}
    {quote && <>
      {item("Copiar texto", () => onCopy(quote))}
      {item("Localizar no PDF", () => onFind(quote))}
    </>}
    <div className="my-1 border-t" />
    {item("Ajustar à largura", onFitWidth)}
    {editMode ? <>
      {item("Organizar páginas", onOrganize)}
      {item("Cabeçalho e rodapé", onPagination)}
    </> : item("Editar PDF", onEdit)}
    {item(spread ? "Uma página" : "Duas páginas", () => onSpread(spread ? 0 : 1))}
    {item("Girar páginas", onRotate)}
    {item("Imprimir", onPrint)}
  </div>;
}
