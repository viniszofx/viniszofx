"use client";
import type { HTMLAttributes } from "react";
import { RiLink, RiLockLine } from "@remixicon/react";
import { ItemIcon } from "./item-icon";
import { folderSize } from "@/lib/drive/client";
import { formatBytes } from "@/lib/drive/files";
import type { DriveItem } from "@/lib/nodus/stores";
import { cn } from "@/lib/utils";

export type ItemViewProps = {
  items: DriveItem[]; all: DriveItem[]; selectedIds: string[];
  isDropTarget: (id: string) => boolean;
  itemProps: (item: DriveItem) => HTMLAttributes<HTMLElement> & { draggable?: boolean };
};
const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export function DriveGrid({ items, selectedIds, isDropTarget, itemProps }: ItemViewProps) {
  return <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(6.5rem,100%),1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] sm:gap-3">{items.map(item => {
    const selected = selectedIds.includes(item.id);
    return <li key={item.id} data-drive-item={item.id}>
      <button type="button" aria-pressed={selected} {...itemProps(item)} className="group grid w-full justify-items-center gap-1 p-1.5 text-center outline-none transition-[background-color,transform] duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 sm:p-2">
        <span className={cn("grid size-16 place-items-center transition-colors duration-150 sm:size-22", isDropTarget(item.id) ? "bg-primary/20 ring-2 ring-primary" : selected ? "bg-primary/10" : "group-hover:bg-muted/70")}><ItemIcon item={item} className="size-14 transition-transform duration-150 group-hover:scale-105 sm:size-18" /></span>
        <span className={cn("line-clamp-2 max-w-full break-words px-1.5 text-xs", selected && "bg-primary text-primary-foreground")}>{item.name}</span>
        <span className="text-[0.7rem] text-muted-foreground">{item.kind === "file" ? formatBytes(item.file?.size ?? 0) : date(item.updatedAt)}{item.shareToken && <RiLink className="ml-1 inline size-3" aria-label="Com link" />}</span>
      </button>
    </li>;
  })}</ul>;
}

export function DriveList({ items, all, selectedIds, isDropTarget, itemProps }: ItemViewProps) {
  return <table className="w-full table-fixed text-sm">
    <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-2 font-medium">Nome</th><th className="hidden p-2 font-medium sm:table-cell">Alterado</th><th className="hidden p-2 font-medium sm:table-cell">Tamanho</th><th className="hidden p-2 font-medium md:table-cell">Acesso</th></tr></thead>
    <tbody>{items.map(item => <tr key={item.id} data-drive-item={item.id} tabIndex={0} {...itemProps(item)}
      className={cn("cursor-default outline-none focus-visible:ring-2 focus-visible:ring-ring", isDropTarget(item.id) ? "bg-primary/20 ring-2 ring-primary" : selectedIds.includes(item.id) ? "bg-primary text-primary-foreground" : "hover:bg-muted/60")}>
      <td className="w-full overflow-hidden p-2"><span className="flex min-w-0 items-center gap-2"><ItemIcon item={item} className="size-6 shrink-0" /><span className="min-w-0 break-all sm:break-words">{item.name}</span></span></td>
      <td className="hidden p-2 sm:table-cell">{date(item.updatedAt)}</td>
      <td className="hidden p-2 sm:table-cell">{formatBytes(folderSize(all, item))}</td>
      <td className="hidden p-2 md:table-cell"><span className="flex items-center gap-1.5">{item.shareToken ? <><RiLink className="size-4" />Link público</> : <><RiLockLine className="size-4" />Privado</>}</span></td>
    </tr>)}</tbody>
  </table>;
}
