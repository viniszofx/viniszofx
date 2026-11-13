"use client";
import { RiPaletteLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { FOLDER_COLORS, type FolderColor } from "@/lib/drive/files";
import { cn } from "@/lib/utils";

export function FolderColorMenu({ value = "blue", onChange }: { value?: FolderColor; onChange: (color: FolderColor) => void }) {
  return <Dropdown className="grid min-w-0 grid-cols-4 gap-2 p-3" trigger={<Button type="button" variant="ghost" size="sm" aria-label="Cor da pasta" title="Cor da pasta" />}
    label={<><RiPaletteLine className="size-4" style={{ color: FOLDER_COLORS[value].shades[1] }} /><span className="hidden xl:inline">Cor</span></>}>
    {(Object.keys(FOLDER_COLORS) as FolderColor[]).map(color => <DropdownItem key={color} aria-label={FOLDER_COLORS[color].label} title={FOLDER_COLORS[color].label} onClick={() => onChange(color)}
      className={cn("size-6 rounded-full p-0", value === color && "ring-2 ring-foreground ring-offset-2 ring-offset-popover")} style={{ background: FOLDER_COLORS[color].shades[0] }} />)}
  </Dropdown>;
}
