"use client";
import { menuSurfaceClass } from "@/components/ui/menu-styles";

import { useState, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { RiCheckLine, RiPaletteLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

const colors = [
  ["Laranja", "#d95b16"],
  ["Azul", "#2878bd"],
  ["Verde", "#36854a"],
  ["Roxo", "#8862b5"],
  ["Vermelho", "#c94343"],
  ["Amarelo", "#c49b25"],
  ["Rosa", "#c85591"],
  ["Turquesa", "#258c91"],
] as const;

export function ColorPicker(
  { label, value, onChange, compact = false, compactSize = "icon-xs", disabled = false, children }: {
    label: string;
    value?: string | null;
    onChange: (value: string | null) => void;
    compact?: boolean;
    compactSize?: "icon-xs" | "icon-sm";
    disabled?: boolean;
    children?: ReactNode;
  },
) {
  const [open, setOpen] = useState(false);
  function choose(color: string | null) {
    onChange(color);
    setOpen(false);
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant={compact ? "ghost" : "outline"}
            size={compact ? compactSize : "sm"}
            disabled={disabled}
            aria-label={label}
          />
        }
      >
        <RiPaletteLine />
        {!compact && "Cor"}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="z-100">
          <Popover.Popup className={`w-56 max-w-[calc(100vw-2rem)] border border-border p-3 ${menuSurfaceClass}`}>
            <Popover.Title className="mb-3 text-sm font-semibold">
              {label}
            </Popover.Title>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(([name, color]) => (
                <button
                  key={color}
                  type="button"
                  className="grid h-9 place-items-center border border-border focus-visible:outline-2 focus-visible:outline-ring"
                  style={{ backgroundColor: color }}
                  aria-label={name}
                  aria-pressed={value?.toLowerCase() === color}
                  onClick={() => choose(color)}
                >
                  {value?.toLowerCase() === color && (
                    <RiCheckLine className="size-4 text-white" />
                  )}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center justify-between text-xs">
              Cor personalizada<input
                type="color"
                aria-label="Cor personalizada"
                value={value || "#d95b16"}
                onChange={(event) => choose(event.target.value)}
                className="h-8 w-12 cursor-pointer border-0 bg-transparent"
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => choose(null)}
            >
              Restaurar padrão
            </Button>
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
