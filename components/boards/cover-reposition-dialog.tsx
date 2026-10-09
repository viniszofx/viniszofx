"use client";
import { useObjectUrl } from "@/lib/browser/use-object-url";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CardAttachment, CoverPosition } from "@/lib/boards/store";
export function CoverRepositionDialog({ cover, initial, onSave, onClose }: { cover: CardAttachment; initial?: CoverPosition; onSave: (position: CoverPosition) => void; onClose: () => void }) {
  const [position, setPosition] = useState(initial ?? { x: 50, y: 50 });
  const url = useObjectUrl(cover.blob);
  const drag = useRef<{ x: number; y: number; position: CoverPosition } | null>(null);
  const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-xl"><DialogTitle>Reposicionar capa</DialogTitle><DialogDescription>Arraste a imagem ou ajuste as posições. Conclua para salvar.</DialogDescription>
    <div className="relative aspect-[2/1] w-full touch-none cursor-move overflow-hidden bg-muted" data-cover-reposition onPointerDown={event => { if (event.button !== 0) return; event.preventDefault();drag.current = { x: event.clientX, y: event.clientY, position };event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => {
      if (!drag.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition({ x: clamp(drag.current.position.x - (event.clientX - drag.current.x) / rect.width * 100), y: clamp(drag.current.position.y - (event.clientY - drag.current.y) / rect.height * 100) });
    }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      {/* Local image blobs cannot use Next's optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Prévia da posição da capa" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover" style={{ objectPosition: `${position.x}% ${position.y}%` }} />
    </div>
    <label className="grid gap-2 text-sm">Horizontal ({position.x}%)<input aria-label="Posição horizontal da capa" type="range" min="0" max="100" value={position.x} onChange={event => setPosition(previous => ({ ...previous, x: Number(event.target.value) }))} /></label>
    <label className="grid gap-2 text-sm">Vertical ({position.y}%)<input aria-label="Posição vertical da capa" type="range" min="0" max="100" value={position.y} onChange={event => setPosition(previous => ({ ...previous, y: Number(event.target.value) }))} /></label>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => { onSave(position); onClose(); }}>Concluir ajuste</Button></div>
  </DialogContent></Dialog>;
}
