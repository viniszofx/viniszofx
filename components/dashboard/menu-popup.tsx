"use client";

import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";

export const menuItemClass = "flex cursor-pointer items-center gap-3 rounded-none px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground";
export function DashboardMenuPopup({ children, side = "bottom" }: { children: ReactNode; side?: "top" | "bottom" }) {
  return <Menu.Portal><Menu.Positioner side={side} align="end" sideOffset={8} className="z-[60]"><Menu.Popup className="min-w-52 rounded-none border bg-popover p-1 text-popover-foreground shadow-lg outline-none">{children}</Menu.Popup></Menu.Positioner></Menu.Portal>;
}
