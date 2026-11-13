"use client";
import type { ReactNode } from "react";
import { RiAddLine, RiCloseLine, RiFolderUploadLine, RiUploadLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ActionButton, ActionList, type Action } from "@/components/ui/action-button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

/** Selection actions when something is selected; otherwise the "Novo" menu and upload. */
export function DriveToolbar({ actions, createActions, canAdd, selectedCount, extra, onUpload, onUploadFolder, onClear }: {
  actions: Action[]; createActions: Action[]; canAdd: boolean; selectedCount: number; extra?: ReactNode; onUpload: () => void; onUploadFolder: () => void; onClear: () => void;
}) {
  return <div className="flex min-h-12 min-w-0 flex-wrap items-center gap-1 border-b px-2 py-1.5 md:flex-nowrap" role="toolbar" aria-label="Comandos do Drive">
    {actions.length ? <div className="grid w-full min-w-0 grid-cols-4 gap-1 sm:flex sm:w-auto sm:flex-wrap"><ActionList actions={actions} />{extra}{selectedCount > 1 && <span className="col-span-full px-2 text-xs text-muted-foreground sm:col-span-1 sm:text-sm">{selectedCount} itens selecionados</span>}</div>
      : canAdd && <>
        <Dropdown trigger={<Button type="button" variant="outline" size="sm" />} label={<><RiAddLine className="size-4" />Novo</>}>
          {createActions.map(({ key, label, icon: Icon, run }) => <DropdownItem key={key} onClick={run}><Icon />{label}</DropdownItem>)}
        </Dropdown>
        <ActionButton action={{ key: "upload", label: "Enviar", icon: RiUploadLine, run: onUpload }} />
        <span className="hidden sm:contents"><ActionButton action={{ key: "upload-folder", label: "Enviar pasta", icon: RiFolderUploadLine, run: onUploadFolder }} /></span>
      </>}
    <span className="flex-1" />
    {selectedCount > 0 && <Button type="button" variant="ghost" size="sm" aria-label="Limpar seleção" title="Limpar seleção (Esc)" onClick={onClear}><RiCloseLine className="size-4" /><span className="hidden xl:inline">{selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}</span></Button>}
  </div>;
}
