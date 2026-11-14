"use client";
import type { ChangeEvent, Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import { RiAddLine, RiArrowGoBackLine, RiArrowGoForwardLine, RiBookOpenLine, RiChat1Line, RiCheckLine, RiClockwiseLine, RiDeleteBinLine, RiDownloadLine, RiEditLine, RiEqualizerLine, RiExpandWidthLine, RiFileLine, RiImageAddLine, RiLayoutGridLine, RiLayoutTopLine, RiMoreLine, RiPrinterLine, RiSaveLine, RiSearchLine, RiSidebarFoldLine, RiSubtractLine } from "@remixicon/react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TOOLS, type Tool } from "../pdf-tools";
import { MenuItem, MenuSeparator, PdfZoomInput, ViewMenuItems } from "./pdf-menus";
import { defaultZoom, type ZoomPreset } from "./pdf-viewer-hooks";

export type PdfToolbarProps = {
  action: (name: "undo" | "redo" | "delete") => void;
  addImage: (event: ChangeEvent<HTMLInputElement>) => void;
  autoZoom: boolean;
  busy: boolean;
  changeColor: (value: string) => void;
  changeSize: (value: number) => void;
  changeSpread: (next: number) => void;
  choose: (next: Tool, editId?: string) => void;
  collapse: string;
  color: string | null;
  commentPanel: boolean;
  controlsOpen: boolean;
  download: () => Promise<void>;
  editMode: boolean;
  enterEditMode: () => void;
  goTo: (next: number) => void;
  hasChanges: boolean;
  leading: ReactNode;
  leaveEditMode: () => void;
  moreOnly: string;
  onSave: ((edited: Blob) => Promise<void>) | undefined;
  openPagination: () => void;
  openSearch: () => void;
  organize: () => Promise<void>;
  organizing: Uint8Array | null;
  page: number;
  pdf: PDFDocumentProxy | undefined;
  picker: RefObject<HTMLInputElement | null>;
  print: () => Promise<void>;
  rightPanel: "controls" | "comments" | null;
  rotate: () => void;
  save: () => Promise<void>;
  setRightPanel: Dispatch<SetStateAction<"controls" | "comments" | null>>;
  setScale: (next: number) => void;
  setSidebar: Dispatch<SetStateAction<boolean>>;
  sidebar: boolean;
  size: { value: number; param: number; min: number; max: number } | null;
  sizeLabel: string;
  spread: number;
  status: string;
  tool: Tool;
  toolLabel: string;
  zoom: number;
  zoomTo: (preset: ZoomPreset) => void;
};

/**
 * Barra de ferramentas do PDF: ferramentas de leitura e edição, zoom e páginas, localizar, imprimir,
 * baixar, painéis, Editar/Concluir e Salvar. O que não cabe recolhe no menu "⋯".
 */
export function PdfToolbar({ action, addImage, autoZoom, busy, changeColor, changeSize, changeSpread, choose, collapse, color, commentPanel, controlsOpen, download, editMode, enterEditMode, goTo, hasChanges, leading, leaveEditMode, moreOnly, onSave, openPagination, openSearch, organize, organizing, page, pdf, picker, print, rightPanel, rotate, save, setRightPanel, setScale, setSidebar, sidebar, size, sizeLabel, spread, status, tool, toolLabel, zoom, zoomTo }: PdfToolbarProps) {
  return (
      <div role="toolbar" aria-label="Ferramentas do PDF" className={`flex flex-wrap items-center gap-1 border-b p-1.5 md:flex-nowrap ${organizing ? "hidden" : ""}`}>
        {/* Voltar e o nome do arquivo; no celular ficam numa linha própria, acima das ferramentas. Do tablet para cima tudo
            fica numa linha só: o nome encolhe (com reticências) antes de algum botão descer. */}
        {leading && <div className="flex min-w-0 items-center gap-2 max-md:basis-full md:flex-initial @6xl/pdf:max-w-md">{leading}<span className="mx-1 h-5 w-px shrink-0 bg-border max-md:hidden" /></div>}
        {/* Em tela estreita (celular), tudo numa linha: ferramentas, página, Mais (⋯), Editar e Salvar. */}
        <div className="flex min-w-0 flex-wrap items-center gap-1 md:shrink-0 md:flex-nowrap">
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 max-md:hidden" aria-label="Miniaturas" title="Miniaturas" aria-pressed={sidebar} onClick={() => setSidebar((value) => !value)}><RiSidebarFoldLine /></Button>
          <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
          {/* Na leitura ficam Selecionar, Realçar e Comentário, como no Word; o resto aparece ao editar. */}
          {TOOLS.filter(({ tool: entry }) => editMode || entry === "select" || entry === "highlight").map(({ tool: entry, label, icon: Icon }) => (
            <Button key={entry} type="button" variant={tool === entry ? "secondary" : "ghost"} size="sm" aria-label={label} aria-pressed={tool === entry} title={label} disabled={!pdf} onClick={() => choose(entry)}>
              <Icon className="size-4" /><span className={toolLabel}>{label}</span>
            </Button>
          ))}
          <Button type="button" variant={tool === "comment" ? "secondary" : "ghost"} size="sm" className="hidden md:inline-flex" aria-label="Adicionar comentário" title="Adicionar comentário" aria-pressed={tool === "comment"} disabled={!pdf} onClick={() => choose("comment")}><RiChat1Line className="size-4" /><span className={toolLabel}>Comentário</span></Button>
          {editMode && <>
            <Button type="button" variant={tool === "image" ? "secondary" : "ghost"} size="sm" title="Imagem ou assinatura" disabled={!pdf} onClick={() => picker.current?.click()}>
              <RiImageAddLine className="size-4" /><span className={toolLabel}>Imagem</span>
            </Button>
            <input ref={picker} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={addImage} />
            <Button type="button" variant="ghost" size="sm" className={collapse} title="Organizar páginas: ordem, girar, excluir, inserir e extrair" disabled={!pdf || busy} onClick={() => void organize()}><RiLayoutGridLine className="size-4" /><span className={toolLabel}>Organizar</span></Button>
            <Button type="button" variant="ghost" size="sm" className={collapse} title="Cabeçalho e rodapé: textos, logo, número de página e marca-d'água" disabled={!pdf || busy} onClick={openPagination}><RiLayoutTopLine className="size-4" /><span className={toolLabel}>Cabeçalho e rodapé</span></Button>
          </>}
          {color && !controlsOpen && <input type="color" aria-label="Cor" title="Cor" value={color} onChange={(event) => changeColor(event.target.value)} className="size-7 shrink-0 cursor-pointer rounded border bg-transparent p-0.5" />}
          {size && !controlsOpen && <input type="range" aria-label={sizeLabel} title={sizeLabel} min={size.min} max={size.max} value={size.value} onChange={(event) => changeSize(Number(event.target.value))} className="w-20 accent-primary" />}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editMode && !controlsOpen && <>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!pdf} onClick={() => action("undo")}><RiArrowGoBackLine /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Refazer" title="Refazer (Ctrl+Y)" disabled={!pdf} onClick={() => action("redo")}><RiArrowGoForwardLine /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Excluir anotação" title="Excluir anotação selecionada (Del)" disabled={!pdf} onClick={() => action("delete")}><RiDeleteBinLine /></Button>
            <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
          </>}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Reduzir" title="Reduzir" className="@max-4xl/pdf:hidden" disabled={!pdf} onClick={() => setScale(zoom / 100 - 0.1)}><RiSubtractLine /></Button>
          <PdfZoomInput zoom={zoom} disabled={!pdf} className={collapse} onScale={setScale} onZoom={zoomTo} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Ampliar" title="Ampliar" className="@max-4xl/pdf:hidden" disabled={!pdf} onClick={() => setScale(zoom / 100 + 0.1)}><RiAddLine /></Button>
          {!autoZoom && <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Voltar ao zoom automático" title="Voltar ao zoom automático (página inteira)" disabled={!pdf} onClick={() => zoomTo(defaultZoom())}><RiExpandWidthLine /></Button>}
          <Popover>
            <PopoverTrigger render={<Button type="button" variant={spread ? "secondary" : "ghost"} size="icon-sm" className={collapse} aria-label="Exibição de páginas" title="Exibição de páginas" disabled={!pdf} />}>{spread ? <RiBookOpenLine /> : <RiFileLine />}</PopoverTrigger>
            <PopoverContent className="w-60 p-1">
              <ViewMenuItems spread={spread} onZoom={zoomTo} onSpread={changeSpread} />
            </PopoverContent>
          </Popover>
          <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Girar páginas" title="Girar páginas" disabled={!pdf} onClick={rotate}><RiClockwiseLine /></Button>
          <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
          <span className="flex items-center gap-1 text-xs tabular-nums">
            <Input aria-label="Página" key={page} defaultValue={page} className="h-7 w-11 px-1 text-center text-xs" onKeyDown={(event) => { if (event.key === "Enter") goTo(Number(event.currentTarget.value)); }} />
            / {pdf?.numPages ?? "–"}
          </span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {status && <span role="status" className={`px-1 text-xs text-muted-foreground ${collapse}`}>{status}</span>}
          <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Localizar" title="Localizar (Ctrl+F)" disabled={!pdf} onClick={openSearch}><RiSearchLine /></Button>
          <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Imprimir" title="Imprimir (Ctrl+P)" disabled={!pdf} onClick={() => void print()}><RiPrinterLine /></Button>
          <Button type="button" variant="ghost" size="sm" className={collapse} disabled={!pdf} onClick={() => void download()}><RiDownloadLine className="size-4" /><span className="hidden @7xl/pdf:inline">Baixar</span></Button>
          <Button type="button" variant={commentPanel ? "secondary" : "ghost"} size="icon-sm" className="hidden md:inline-flex" aria-label="Mostrar comentários" title="Mostrar comentários" aria-pressed={commentPanel} onClick={() => setRightPanel((value) => value === "comments" ? null : "comments")}><RiChat1Line /></Button>
          {editMode && <Button type="button" variant={rightPanel === "controls" ? "secondary" : "ghost"} size="icon-sm" className="hidden md:inline-flex" aria-label="Painel de controles" title="Painel de controles" aria-pressed={rightPanel === "controls"} onClick={() => setRightPanel((value) => value === "controls" ? null : "controls")}><RiEqualizerLine /></Button>}
          <Popover>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-sm" className={moreOnly} aria-label="Mais opções" title="Mais opções" disabled={!pdf} />}><RiMoreLine /></PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="text-sm">Zoom</span>
                <span className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Reduzir" onClick={() => setScale(zoom / 100 - 0.1)}><RiSubtractLine /></Button>
                  <span className="w-11 text-center text-xs tabular-nums">{zoom}%</span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Ampliar" onClick={() => setScale(zoom / 100 + 0.1)}><RiAddLine /></Button>
                </span>
              </div>
              <ViewMenuItems spread={spread} onZoom={zoomTo} onSpread={changeSpread} />
              <MenuItem icon={<RiClockwiseLine className="size-4" />} onClick={rotate}>Girar páginas</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<RiSearchLine className="size-4" />} onClick={openSearch}>Localizar</MenuItem>
              <MenuItem icon={<RiPrinterLine className="size-4" />} onClick={() => void print()}>Imprimir</MenuItem>
              <MenuItem icon={<RiDownloadLine className="size-4" />} onClick={() => void download()}>Baixar</MenuItem>
              {editMode && <>
                <MenuSeparator />
                <MenuItem icon={<RiLayoutGridLine className="size-4" />} disabled={busy} onClick={() => void organize()}>Organizar páginas</MenuItem>
                <MenuItem icon={<RiLayoutTopLine className="size-4" />} disabled={busy} onClick={openPagination}>Cabeçalho e rodapé</MenuItem>
              </>}
            </PopoverContent>
          </Popover>
          {editMode
            ? <Button type="button" variant="secondary" size="sm" title="Voltar à leitura" disabled={!pdf} onClick={leaveEditMode}><RiCheckLine className="size-4" />Concluir</Button>
            : <Button type="button" variant="outline" size="sm" title="Editar o PDF: texto, desenho, realce, imagens, páginas, cabeçalho e rodapé" disabled={!pdf} onClick={enterEditMode}><RiEditLine className="size-4" />Editar</Button>}
          {onSave && <Button type="button" size="sm" aria-label="Salvar" title={status || "Salvar"} disabled={!pdf || busy || !hasChanges} onClick={() => void save()}><RiSaveLine className="size-4" /><span className={collapse}>Salvar</span></Button>}
        </span>
      </div>
  );
}
