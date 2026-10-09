"use client";
import { useObjectUrl } from "@/lib/browser/use-object-url";

import { useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { CoverRepositionDialog } from "./cover-reposition-dialog";
import { ImageCoverControls } from "./image-cover-controls";
import { saveBoard, type Board, type CoverPosition } from "@/lib/boards/store";

export function BoardAppearance({ board }: { board: Board }) {
  const [adjusting, setAdjusting] = useState(false);
  return <><ColorPicker compact compactSize="icon-sm" label={`Cor do board ${board.title}`} value={board.color} onChange={color => saveBoard({ ...board, color: color ?? "", cover: undefined })}>
    <ImageCoverControls cover={board.cover} onReposition={() => setAdjusting(true)} onChange={cover => saveBoard({ ...board, cover, coverPosition: { x: 50, y: 50 } })} />
  </ColorPicker>
    {adjusting && board.cover && <CoverRepositionDialog cover={board.cover} initial={board.coverPosition} onClose={() => setAdjusting(false)} onSave={coverPosition => saveBoard({ ...board, coverPosition })} />}
  </>;
}

export function BoardCoverBackground({ cover, position }: { cover: NonNullable<Board["cover"]>; position?: CoverPosition }) {
  const url = useObjectUrl(cover.blob);
  return <div aria-hidden="true" data-board-cover={cover.name} className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundPosition: `${position?.x ?? 50}% ${position?.y ?? 50}%`, backgroundImage: url ? `linear-gradient(color-mix(in srgb, var(--background) 50%, transparent), color-mix(in srgb, var(--background) 50%, transparent)), url("${url}")` : undefined }} />;
}

export function BoardCoverThumbnail({ cover, position }: { cover: NonNullable<Board["cover"]>; position?: CoverPosition }) {
  const url = useObjectUrl(cover.blob);
  // Local blob covers cannot use Next's image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`Capa: ${cover.name}`} data-board-thumbnail={cover.name} className="absolute inset-0 size-full object-cover" style={{ objectPosition: `${position?.x ?? 50}% ${position?.y ?? 50}%` }} />;
}
