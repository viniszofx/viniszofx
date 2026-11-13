"use client";
import { RiArrowRightSLine } from "@remixicon/react";
import type { DriveItem } from "@/lib/nodus/stores";
import { cn } from "@/lib/utils";

type Drop = { dropTarget: (id: string) => object; isDropTarget: (id: string) => boolean };

/** Section name followed by the folder path; each crumb is also a drop target. */
export function DriveBreadcrumb({ root, path, droppable, drag, onOpen }: { root: string; path: DriveItem[]; droppable: boolean; drag: Drop; onOpen: (folderId: string) => void }) {
  const crumb = (id: string, label: string) => <button type="button" title={label} onClick={() => onOpen(id)} {...(droppable ? drag.dropTarget(id) : {})}
    className={cn("max-w-full truncate px-1 hover:bg-muted", drag.isDropTarget(id) && "bg-primary/20 text-primary ring-2 ring-primary")}>{label}</button>;
  return <nav aria-label="Caminho" className="flex min-w-0 flex-wrap items-center gap-0.5 overflow-hidden text-sm font-semibold sm:text-base">
    {crumb("", root)}
    {path.map(folder => <span key={folder.id} className="flex items-center gap-0.5"><RiArrowRightSLine className="size-4 text-muted-foreground" />{crumb(folder.id, folder.name)}</span>)}
  </nav>;
}
