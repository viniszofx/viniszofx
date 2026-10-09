import { useEffect, useRef, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/react";

export type TableRegion = "row" | "column" | "cell" | "table" | "add-row" | "add-column";
type Context = { pos: number; top: number; left: number; width: number; height: number; cellTop: number; cellLeft: number; cellWidth: number; cellHeight: number };

export function useTableContext(editor: Editor, container: RefObject<HTMLDivElement | null>, dragging?: RefObject<boolean>) {
  const [context, setContext] = useState<Context>();
  const [region, setRegion] = useState<TableRegion | null>(null);
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const cancelHide = () => { clearTimeout(hideTimer.current); hideTimer.current = undefined; };
    const hide = () => {
      if (open || dragging?.current || hideTimer.current) return;
      hideTimer.current = setTimeout(() => { hideTimer.current = undefined; if (!dragging?.current) setRegion(null); }, 300);
    };
    if (open) cancelHide();
    const dom = editor.view.dom, root = container.current;
    if (!root) return;
    const locate = (cell: HTMLElement) => {
      const table = cell.closest("table"); if (!table) return;
      const resolved = editor.state.doc.resolve(editor.view.posAtDOM(cell, 0));
      let depth = resolved.depth;
      while (depth > 0 && !["tableCell", "tableHeader"].includes(resolved.node(depth).type.name)) depth--;
      if (!depth) return;
      const rect = table.getBoundingClientRect(), c = cell.getBoundingClientRect(), r = root.getBoundingClientRect();
      const clip = (table.closest(".tableWrapper") ?? table).getBoundingClientRect();
      const left = Math.max(rect.left, clip.left, r.left), right = Math.min(rect.right, clip.right, r.right);
      const cellLeft = Math.max(left, Math.min(c.left, right - 20));
      setContext({ pos: resolved.before(depth), top: rect.top - r.top, left: left - r.left, width: Math.max(20, right - left), height: rect.height, cellTop: c.top - r.top, cellLeft: cellLeft - r.left, cellWidth: Math.max(20, Math.min(c.right, right) - cellLeft), cellHeight: c.height });
    };
    const selectedCell = () => {
      const { $from } = editor.state.selection;
      let depth = $from.depth;
      while (depth > 0 && !["tableCell", "tableHeader"].includes($from.node(depth).type.name)) depth--;
      const cell = depth ? editor.view.nodeDOM($from.before(depth)) : undefined;
      return cell instanceof HTMLElement ? cell : undefined;
    };
    const selection = () => {
      const cell = selectedCell();
      if (cell) locate(cell);
      else { setContext(undefined); setRegion(null); setOpen(false); }
    };
    const hover = (event: PointerEvent) => {
      if (open || dragging?.current || (event.target instanceof Element && event.target.closest("[data-table-control]"))) { cancelHide(); return; }
      const x = event.clientX, y = event.clientY;
      for (const table of dom.querySelectorAll("table")) {
        const rect = table.getBoundingClientRect(), clip = (table.closest(".tableWrapper") ?? table).getBoundingClientRect();
        const left = Math.max(rect.left, clip.left), right = Math.min(rect.right, clip.right);
        if (x < left - 26 || x > right + 22 || y < rect.top - 26 || y > rect.bottom + 22) continue;
        let next: TableRegion | null = null;
        if (y >= rect.bottom - 3 && x >= left && x <= right) next = "add-row";
        else if (x >= right - 6 && y >= rect.top && y <= rect.bottom) next = "add-column";
        else if (y < rect.top + 6 && x >= left && x <= right) next = x < left + 12 ? "table" : "column";
        else if (x < left + 8 && y >= rect.top && y < rect.bottom) next = "row";
        if (!next) { hide(); return; }
        const rows = Array.from(table.rows);
        const row = next === "row" ? rows.find((row) => { const r = row.getBoundingClientRect(); return y >= r.top && y < r.bottom; }) : rows[0];
        const cells = Array.from(row?.cells ?? []);
        const cell = next === "column" ? cells.find((cell) => { const r = cell.getBoundingClientRect(); return x >= r.left && x <= r.right; }) : cells[0];
        if (cell) { cancelHide(); locate(cell); setRegion(next); return; }
      }
      hide();
    };
    const cellMenu = (cell: HTMLElement, event: Event) => { event.preventDefault(); locate(cell); setRegion("cell"); setOpen(true); };
    const contextMenu = (event: MouseEvent) => {
      const cell = event.target instanceof Element ? event.target.closest<HTMLElement>("td,th") : null;
      if (cell && dom.contains(cell)) cellMenu(cell, event);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
      const cell = selectedCell(); if (cell) cellMenu(cell, event);
    };
    const leave = () => hide();
    root.addEventListener("pointermove", hover); root.addEventListener("pointerleave", leave);
    dom.addEventListener("contextmenu", contextMenu); dom.addEventListener("keydown", keyboard);
    dom.addEventListener("scroll", selection, true); window.addEventListener("resize", selection);
    editor.on("selectionUpdate", selection); editor.on("update", selection);
    return () => {
      cancelHide();
      root.removeEventListener("pointermove", hover); root.removeEventListener("pointerleave", leave);
      dom.removeEventListener("contextmenu", contextMenu); dom.removeEventListener("keydown", keyboard);
      dom.removeEventListener("scroll", selection, true); window.removeEventListener("resize", selection);
      editor.off("selectionUpdate", selection); editor.off("update", selection);
    };
  }, [editor, container, open, dragging]);
  return { context, region, setRegion, open, setOpen };
}
