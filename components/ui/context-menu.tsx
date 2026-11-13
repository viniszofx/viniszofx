"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { menuSurfaceClass } from "./menu-styles";
import { cn } from "@/lib/utils";

/**
 * Right-click menu anchored at the cursor. Rendered in <body> so page layout
 * (overflow, positioning) never moves it, and clamped to the viewport using
 * its measured size.
 */
export function ContextMenu({ x, y, label, onClose, children }: { x: number; y: number; label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y, visible: false });

  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, y + height > window.innerHeight - 8 ? y - height : y),
      visible: true,
    });
    menu.querySelector<HTMLElement>("button")?.focus();
  }, [x, y]);

  useLayoutEffect(() => {
    const closeOutside = (event: Event) => { if (!ref.current?.contains(event.target as Node)) onClose(); };
    const closeOnKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    // Capture phase: a click elsewhere closes the menu before anything else reacts.
    window.addEventListener("pointerdown", closeOutside, true);
    window.addEventListener("contextmenu", closeOutside, true);
    window.addEventListener("keydown", closeOnKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("pointerdown", closeOutside, true);
      window.removeEventListener("contextmenu", closeOutside, true);
      window.removeEventListener("keydown", closeOnKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  return createPortal(
    <div ref={ref} role="menu" aria-label={label} onContextMenu={event => event.preventDefault()} onClick={onClose}
      style={{ left: position.left, top: position.top, visibility: position.visible ? "visible" : "hidden" }}
      className={cn(menuSurfaceClass, "fixed z-[70] grid min-w-52 gap-0.5 p-1")}>
      {children}
    </div>,
    document.body,
  );
}
