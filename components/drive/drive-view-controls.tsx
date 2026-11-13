"use client";
import { RiCheckLine, RiListUnordered, RiLayoutGridLine, RiLayoutRowLine, RiTimeLine, RiEqualizer2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

export const DRIVE_SORTS = { name: "Nome", date: "Alterado em", size: "Tamanho" } as const;
export type DriveSort = keyof typeof DRIVE_SORTS;
export type DrivePreset = "overview" | "recent" | "compact" | "detailed";
const PRESETS: { value: DrivePreset; label: string; icon: typeof RiLayoutGridLine }[] = [
  { value: "overview", label: "Visão geral", icon: RiLayoutGridLine },
  { value: "recent", label: "Recentes", icon: RiTimeLine },
  { value: "compact", label: "Compacta", icon: RiLayoutRowLine },
  { value: "detailed", label: "Detalhada", icon: RiListUnordered },
];

export function DriveViewControls({ sort, onSort, preset, onPreset }: {
  sort?: DriveSort; onSort: (sort: DriveSort) => void; preset: DrivePreset; onPreset: (preset: DrivePreset) => void;
}) {
  const currentPreset = PRESETS.find(option => option.value === preset)!;
  return <Dropdown align="end" trigger={<Button type="button" variant="outline" size="sm" aria-label="Opções de visualização" title="Opções de visualização" />} label={<><RiEqualizer2Line className="size-4" /><span>Visualização</span></>}>
    <div className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Predefinição</div>
    {PRESETS.map(({ value, label, icon: Icon }) => <DropdownItem key={value} className="justify-between" onClick={() => onPreset(value)}><span className="flex items-center gap-2"><Icon className="size-4" />{label}</span>{preset === value && <RiCheckLine />}</DropdownItem>)}
    {sort && <>
      <div role="separator" className="my-1 border-t" />
      <div className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ordenar por</div>
      {(Object.keys(DRIVE_SORTS) as DriveSort[]).map(option => <DropdownItem key={option} className="justify-between" onClick={() => onSort(option)}>{DRIVE_SORTS[option]}{sort === option && <RiCheckLine />}</DropdownItem>)}
    </>}
    <div className="mt-1 border-t px-2 py-1.5 text-xs text-muted-foreground">Atual: {currentPreset.label}{sort ? ` · ${DRIVE_SORTS[sort]}` : ""}</div>
  </Dropdown>;
}
