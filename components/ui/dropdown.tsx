"use client";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { menuItemClass, menuSurfaceClass } from "./menu-styles";
import { cn } from "@/lib/utils";

/** Button-triggered menu. `trigger` is the element to render (e.g. <Button />) and `label` its content. */
export function Dropdown({ trigger, label, children, align = "start", className }: { trigger: ReactElement; label: ReactNode; children: ReactNode; align?: "start" | "center" | "end"; className?: string }) {
  return <Menu.Root>
    <Menu.Trigger render={trigger}>{label}</Menu.Trigger>
    <Menu.Portal><Menu.Positioner sideOffset={6} align={align} className="z-[60]">
      <Menu.Popup className={cn("min-w-44 p-1", menuSurfaceClass, className)}>{children}</Menu.Popup>
    </Menu.Positioner></Menu.Portal>
  </Menu.Root>;
}

export function DropdownItem({ className, ...props }: ComponentProps<typeof Menu.Item> & { className?: string }) {
  return <Menu.Item className={cn(menuItemClass, className)} {...props} />;
}
