"use client";

import { useRef, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { RiPaletteLine } from "@remixicon/react";
import { RiImageAddLine as ImagePlus, RiExpandUpDownLine as MoveVertical, RiDeleteBinLine as Trash2, RiCheckLine as Check } from "@remixicon/react";
import { DashboardMenuPopup, menuItemClass } from "@/components/dashboard/menu-popup";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LocalImage as MediaImage } from "./local-image";
import type { useNoteAttachments } from "./use-note-attachments";
export function NoteCover({ files, id, position, disabled, onSelect, onPosition, onUpload, ownerLabel = "anotação" }: {
  files: ReturnType<typeof useNoteAttachments>; id?: string | null; position: number; disabled: boolean;
  ownerLabel?: string;
  onSelect: (id: string | null) => void; onPosition: (position: number) => void; onUpload: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef<{ y: number; position: number } | null>(null);
  const images = files.attachments.filter((file) => /^image\/(png|jpeg|webp|gif|avif)$/.test(file.contentType));
  const image = images.find((file) => file.id === id);
  return <>
    {image ? <div className={`relative h-48 w-full overflow-hidden bg-muted sm:h-64 ${adjusting ? "touch-none cursor-ns-resize" : ""}`}
      tabIndex={adjusting && !disabled ? 0 : undefined} role={adjusting ? "group" : undefined} aria-label={adjusting ? "Reposicionar capa: arraste a imagem ou use as setas" : undefined}
      onKeyDown={(event) => { if (!adjusting || disabled || event.target !== event.currentTarget || !["ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); onPosition(Math.max(0, Math.min(100, position + (event.key === "ArrowUp" ? 2 : -2)))); }}
      onPointerDown={(event) => { if (!adjusting || disabled || event.button !== 0 || (event.target as HTMLElement).closest("button,input,label,[role=menu],[role=menuitem]")) return; event.preventDefault(); event.currentTarget.focus(); drag.current = { y: event.clientY, position }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (drag.current && adjusting && !disabled) onPosition(Math.max(0, Math.min(100, Math.round(drag.current.position - (event.clientY - drag.current.y) / event.currentTarget.getBoundingClientRect().height * 100)))); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      <MediaImage src={files.url(image, true)} alt={`Capa da ${ownerLabel}`} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: `center ${position}%` }} />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {adjusting && <Button type="button" size="sm" variant="secondary" onClick={() => { drag.current = null; setAdjusting(false); }}><Check />Concluir ajuste</Button>}
        <Menu.Root>
          <Menu.Trigger render={<Button size="icon-sm" variant="secondary" disabled={disabled} aria-label="Opções da capa" />}><RiPaletteLine /></Menu.Trigger>
          <DashboardMenuPopup>
            <Menu.Item disabled={disabled} className={menuItemClass} onClick={() => setOpen(true)}><ImagePlus className="size-4" />Trocar capa</Menu.Item>
            <Menu.Item disabled={disabled} className={menuItemClass} onClick={() => setAdjusting(!adjusting)}>{adjusting ? <Check className="size-4" /> : <MoveVertical className="size-4" />}{adjusting ? "Concluir ajuste" : "Reposicionar"}</Menu.Item>
            <Menu.Separator className="my-1 border-t" />
            <Menu.Item disabled={disabled} className={`${menuItemClass} text-destructive`} onClick={() => { onSelect(null); setAdjusting(false); }}><Trash2 className="size-4" />Remover capa</Menu.Item>
          </DashboardMenuPopup>
        </Menu.Root>
      </div>
      {adjusting && <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 bg-background/90 px-3 py-1 text-xs">Arraste para reposicionar</span>}
    </div> : <div className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-10"><Button size="sm" variant="ghost" disabled={disabled} onClick={() => setOpen(true)}>Adicionar capa</Button></div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[80dvh] overflow-y-auto">
      <DialogTitle>{image ? "Trocar capa" : "Adicionar capa"}</DialogTitle>
      <DialogDescription>Envie uma imagem de até 20 MB ou escolha uma imagem dos arquivos.</DialogDescription>
      <Button disabled={disabled} onClick={() => input.current?.click()}>Enviar imagem de capa</Button>
      <input ref={input} aria-label="Imagem de capa" className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={(event) => { const file = event.target.files?.[0]; if (file) { onUpload(file); setAdjusting(false); setOpen(false); } event.target.value = ""; }} />
      <div className="grid grid-cols-2 gap-3">{images.map((file) => <button key={file.id} disabled={disabled} className="overflow-hidden border border-border text-left focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { onSelect(file.id); setAdjusting(false); setOpen(false); }}>
        <MediaImage src={files.url(file, true)} alt="" className="h-24 w-full object-cover" /><span className="block truncate p-2 text-xs">{file.name}</span>
      </button>)}</div>
    </DialogContent></Dialog>
  </>;
}
