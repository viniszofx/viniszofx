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

export function DriveSidebar({ view, usedBytes, files, onSelect, rootDrop }: {
  view: DriveView; usedBytes: number; files: number; onSelect: (view: DriveView) => void; rootDrop: { highlighted: boolean; props: object };
}) {
  return <aside className="hidden min-w-0 shrink-0 bg-muted/40 md:flex md:w-52 md:flex-col md:gap-0.5 md:border-r md:p-3">
    <nav aria-label="Seções do Drive" className="hidden md:flex md:flex-col md:gap-0.5">{DRIVE_SECTIONS.map(({ view: entry, label, icon: Icon }) =>
      <button key={entry} type="button" aria-current={view === entry ? "page" : undefined} onClick={() => onSelect(entry)} {...(entry === "drive" ? rootDrop.props : {})}
        className={cn("flex min-w-0 items-center gap-2 px-2.5 py-1.5 text-left text-sm", view === entry ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted", entry === "drive" && rootDrop.highlighted && "ring-2 ring-primary")}>
        <Icon className="size-4 shrink-0" /><span className="truncate">{label}</span>
      </button>)}</nav>
    <div className="mt-auto hidden px-2.5 pt-4 text-xs text-muted-foreground md:block"><p>{formatBytes(usedBytes)} em uso</p><p>{files} arquivos</p></div>
  </aside>;
}

