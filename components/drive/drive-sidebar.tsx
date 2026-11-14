"use client";
import { RiGlobalLine, RiHardDrive2Line, RiLink, RiTeamLine, RiTimeLine } from "@remixicon/react";
import { formatBytes } from "@/lib/drive/files";
import { cn } from "@/lib/utils";

export type DriveView = "recent" | "drive" | "links" | "shared" | "public";
export const DRIVE_SECTIONS = [
  { view: "recent", label: "Recentes", icon: RiTimeLine },
  { view: "drive", label: "Meu Drive", icon: RiHardDrive2Line },
  { view: "shared", label: "Compartilhados", icon: RiTeamLine },
  { view: "public", label: "Público", icon: RiGlobalLine },
  { view: "links", label: "Com link", icon: RiLink },
] as const;

/**
 * Seções do Drive (como no Nodus): barra lateral do tablet para cima; no celular, abas com ícone
 * embaixo do quadro, que dão lugar às ações quando há itens selecionados (`hidden`).
 */
export function DriveSidebar({ view, usedBytes, files, onSelect, rootDrop, hidden = false }: {
  view: DriveView; usedBytes: number; files: number; onSelect: (view: DriveView) => void; rootDrop: { highlighted: boolean; props: object }; hidden?: boolean;
}) {
  return <aside className={cn("flex min-w-0 shrink-0 flex-col border-t bg-foreground/[0.03] px-2 py-1.5 max-md:order-last md:w-52 md:gap-0.5 md:border-t-0 md:border-r md:p-3", hidden && "max-md:hidden")}>
    <nav aria-label="Seções do Drive" className="grid grid-cols-5 gap-0.5 md:flex md:flex-col">{DRIVE_SECTIONS.map(({ view: entry, label, icon: Icon }) =>
      <button key={entry} type="button" aria-current={view === entry ? "page" : undefined} onClick={() => onSelect(entry)} {...(entry === "drive" ? rootDrop.props : {})}
        className={cn("flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[10px] tracking-tight md:flex-row md:gap-2 md:px-2.5 md:text-left md:text-sm md:tracking-normal",
          view === entry ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted md:text-foreground", entry === "drive" && rootDrop.highlighted && "ring-2 ring-primary")}>
        <Icon className="size-5 shrink-0 md:size-4" /><span className="max-w-full truncate">{label}</span>
      </button>)}</nav>
    <div className="mt-auto hidden px-2.5 pt-4 text-xs text-muted-foreground md:block"><p>{formatBytes(usedBytes)} em uso</p><p>{files} arquivos</p></div>
  </aside>;
}
