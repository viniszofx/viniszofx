"use client";
import { useObjectUrl } from "@/lib/browser/use-object-url";
import { useRef, useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { CoverRepositionDialog } from "./cover-reposition-dialog";
import { ImageCoverControls } from "./image-cover-controls";
import type { BoardCard, CardAttachment, CoverPosition } from "@/lib/boards/store";
export function CardAppearance({ card, onChange, inlineReposition = false, onReposition }: { card: BoardCard; inlineReposition?: boolean; onReposition?: () => void; onChange: (patch: Partial<BoardCard>) => void }) {
  const [adjusting, setAdjusting] = useState(false);
  const cover = card.attachments?.find(file => file.id === card.coverAttachmentId);
  return <><ColorPicker compact label={`Cor do card ${card.title}`} value={card.color} onChange={color => onChange({ color: color ?? "" })}>
    <ImageCoverControls cover={cover} onReposition={inlineReposition ? onReposition : () => setAdjusting(true)} label="Upload de cover do card" onChange={file => onChange(file ? { attachments: [...(card.attachments ?? []), file], coverAttachmentId: file.id, coverPosition: { x: 50, y: 50 } } : { coverAttachmentId: null })} />
  </ColorPicker>
    {adjusting && cover && <CoverRepositionDialog cover={cover} initial={card.coverPosition} onClose={() => setAdjusting(false)} onSave={coverPosition => onChange({ coverPosition })} />}
  </>;
}
export function CardCover({ file, position, expanded = false, onPositionChange }: { file: CardAttachment; position?: CoverPosition; expanded?: boolean; onPositionChange?: (position: CoverPosition) => void }) {
  const url = useObjectUrl(file.blob);
  const drag = useRef<{ x: number; y: number; position: CoverPosition } | null>(null);
  const current = position ?? { x: 50, y: 50 };
  const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  const image = (
    // Local image blobs cannot use Next's optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Capa: ${file.name}`} data-card-cover={file.name} draggable={false} className={`w-full rounded-none object-cover ${expanded ? "h-48 sm:h-64" : "h-32"}`} style={{ objectPosition: `${current.x}% ${current.y}%` }} />
  );
  if (!onPositionChange) return <div className="mb-3">{image}</div>;
  return <div className="group relative mb-3 touch-none cursor-grab overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    tabIndex={0} role="group" aria-label="Reposicionar capa: arraste a imagem ou use as setas" data-inline-cover-reposition
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();event.currentTarget.focus();
      drag.current = { x: event.clientX, y: event.clientY, position: current };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      if (!drag.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      onPositionChange({ x: clamp(drag.current.position.x - (event.clientX - drag.current.x) / rect.width * 100), y: clamp(drag.current.position.y - (event.clientY - drag.current.y) / rect.height * 100) });
    }}
    onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={event => {
      const offsets: Record<string, [number, number]> = { ArrowLeft: [2, 0], ArrowRight: [-2, 0], ArrowUp: [0, 2], ArrowDown: [0, -2] };
      const offset = offsets[event.key];
      if (!offset) return;
      event.preventDefault();onPositionChange({ x: clamp(current.x + offset[0]), y: clamp(current.y + offset[1]) });
    }}>
    {image}
    <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1 text-xs text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Arraste para reposicionar</span>
  </div>;
}
