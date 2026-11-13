"use client";
import { useState, type ReactNode } from "react";
import { RiFolderTransferLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/field";
import { withDescendants } from "@/lib/drive/client";
import type { DriveItem } from "@/lib/nodus/stores";

/** Folder picker as an indented tree, hiding the moved folders and their contents. */
export function MoveDialog({ items, all, initial, onMove, onClose }: { items: DriveItem[]; all: DriveItem[]; initial: string; onMove: (destination: string) => void; onClose: () => void }) {
  const [target, setTarget] = useState(initial);
  const blocked = withDescendants(all, items);
  const tree = (parent: string, depth: number): ReactNode[] => all
    .filter(entry => entry.kind === "folder" && entry.parentId === parent && !blocked.has(entry.id))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .flatMap(entry => [<option key={entry.id} value={entry.id}>{"  ".repeat(depth)}{entry.name}</option>, ...tree(entry.id, depth + 1)]);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent>
    <DialogTitle>Mover</DialogTitle>
    <DialogDescription className="break-words">{items.length === 1 ? items[0].name : `${items.length} itens selecionados`}</DialogDescription>
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); onMove(target); }}>
      <Field label="Destino"><select className={selectClass} value={target} onChange={event => setTarget(event.target.value)}><option value="">Meu Drive</option>{tree("", 1)}</select></Field>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit"><RiFolderTransferLine />Mover</Button></div>
    </form>
  </DialogContent></Dialog>;
}
