"use client";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import type { DriveItem } from "@/lib/nodus/stores";
import { cn } from "@/lib/utils";

type Drop = { dropTarget: (id: string) => object; isDropTarget: (id: string) => boolean };

/**
 * Seção e caminho das pastas; cada trecho também recebe itens arrastados. No celular fica só a pasta
 * atual, com a seta para a de cima (como no Nodus); do sm para cima, o caminho inteiro.
 */
export function DriveBreadcrumb({ root, path, droppable, drag, onOpen }: { root: string; path: DriveItem[]; droppable: boolean; drag: Drop; onOpen: (folderId: string) => void }) {
  const crumbs = [{ id: "", name: root }, ...path.map(folder => ({ id: folder.id, name: folder.name }))];
  return <nav aria-label="Caminho" className="flex min-w-0 items-center gap-0.5 text-sm font-semibold sm:text-base">
    {crumbs.length > 1 && <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 sm:hidden" aria-label="Pasta de cima" title="Pasta de cima" onClick={() => onOpen(crumbs.at(-2)!.id)}><RiArrowLeftSLine /></Button>}
    {crumbs.map((crumb, index) => <span key={crumb.id || "root"} className={cn("flex min-w-0 items-center gap-0.5", index < crumbs.length - 1 && "max-sm:hidden")}>
      {index > 0 && <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground max-sm:hidden" />}
      <button type="button" title={crumb.name} onClick={() => onOpen(crumb.id)} {...(droppable ? drag.dropTarget(crumb.id) : {})}
        className={cn("min-w-0 truncate rounded px-1 hover:bg-muted", drag.isDropTarget(crumb.id) && "bg-primary/20 text-primary ring-2 ring-primary")}>{crumb.name}</button>
    </span>)}
  </nav>;
}
