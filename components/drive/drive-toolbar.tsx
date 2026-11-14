"use client";
import type { ReactNode } from "react";
import { RiAddLine, RiCheckboxMultipleLine, RiCloseLine, RiFolderUploadLine, RiUploadLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ActionList, type Action } from "@/components/ui/action-button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

/**
 * Barra única do Drive (como no Nodus): caminho e comandos; com itens selecionados, a seleção e as ações
 * dela tomam o lugar do caminho. No celular (`narrow`), as ações vão para a barra de baixo (DriveSelectionBar).
 */
export function DriveToolbar({ actions, createActions, canAdd, selectedCount, total, extra, breadcrumb, viewControls, narrow, onUpload, onUploadFolder, onClear, onSelectAll }: {
  actions: Action[]; createActions: Action[]; canAdd: boolean; selectedCount: number; total: number; extra?: ReactNode; breadcrumb: ReactNode; viewControls: ReactNode;
  narrow: boolean; onUpload: () => void; onUploadFolder: () => void; onClear: () => void; onSelectAll: () => void;
}) {
  return <div className="flex min-h-12 min-w-0 items-center gap-0.5 border-b px-2 py-1.5 md:flex-wrap" role="toolbar" aria-label="Comandos do Drive">
    {selectedCount > 0
      ? <>
        <Button type="button" variant="ghost" size="sm" className="normal-case tracking-normal" aria-label="Limpar seleção" title="Limpar seleção (Esc)" onClick={onClear}>
          <RiCloseLine className="size-4 shrink-0" /><span className="whitespace-nowrap">{selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}</span>
        </Button>
        {!narrow && <><span className="mx-1 h-5 w-px bg-border" /><ActionList actions={actions} />{extra}</>}
        <span className="flex-1" />
      </>
      : <>
        <div className="min-w-0 flex-1">{breadcrumb}</div>
        {canAdd && <>
          <Dropdown trigger={<Button type="button" variant="ghost" size="sm" aria-label="Novo" title="Novo" />} label={<><RiAddLine className="size-4" /><span className="hidden lg:inline">Novo</span></>} align="end">
            {createActions.map(({ key, label, icon: Icon, run }) => <DropdownItem key={key} onClick={run}><Icon />{label}</DropdownItem>)}
          </Dropdown>
          <Dropdown trigger={<Button type="button" variant="ghost" size="sm" aria-label="Enviar" title="Enviar" />} label={<><RiUploadLine className="size-4" /><span className="hidden lg:inline">Enviar</span></>} align="end">
            <DropdownItem onClick={onUpload}><RiUploadLine />Enviar arquivos</DropdownItem>
            <DropdownItem onClick={onUploadFolder}><RiFolderUploadLine />Enviar pasta</DropdownItem>
          </Dropdown>
        </>}
      </>}
    {total > 1 && selectedCount < total && <Button type="button" variant="ghost" size="icon-sm" aria-label="Selecionar tudo" title="Selecionar tudo (Ctrl+A)" onClick={onSelectAll}><RiCheckboxMultipleLine /></Button>}
    {viewControls}
  </div>;
}

/** Celular: ações da seleção na barra de baixo, no lugar das seções e do rodapé. */
export function DriveSelectionBar({ actions, extra }: { actions: Action[]; extra?: ReactNode }) {
  return <div role="toolbar" aria-label="Ações da seleção" className="flex items-center justify-around gap-0.5 border-t bg-foreground/[0.03] px-2 py-1.5">
    {actions.map(({ key, label, icon: Icon, run, destructive }) => <button key={key} type="button" onClick={run} title={label}
      className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring", destructive && "text-destructive")}>
      <Icon className="size-5" /><span className="max-w-full truncate">{label}</span>
    </button>)}
    {extra}
  </div>;
}
