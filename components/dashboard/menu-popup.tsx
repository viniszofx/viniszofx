"use client";

import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { menuSurfaceClass } from "@/components/ui/menu-styles";
export { menuItemClass } from "@/components/ui/menu-styles";

export function DashboardMenuPopup({ children, side = "bottom" }: { children: ReactNode; side?: "top" | "bottom" }) {
  return <Menu.Portal><Menu.Positioner side={side} align="end" sideOffset={8} className="z-[60]"><Menu.Popup className={`min-w-52 max-h-(--available-height) overflow-y-auto rounded-none p-1.5 ${menuSurfaceClass}`}>{children}</Menu.Popup></Menu.Positioner></Menu.Portal>;
}
