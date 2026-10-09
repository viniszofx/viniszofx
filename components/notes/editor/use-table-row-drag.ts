import { useEffect, useRef, useState, type PointerEvent, type MouseEvent, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { Fragment } from "@tiptap/pm/model";
import { closeHistory } from "@tiptap/pm/history";
import { CellSelection, moveTableRow, TableMap } from "@tiptap/pm/tables";

type Drag = { pointer: number; x: number; y: number; from: number; to?: number; pos: number; table: HTMLTableElement; handle: HTMLButtonElement; moving: boolean };

export function useTableRowDrag({ editor, container, onStart }: { editor: Editor; container: RefObject<HTMLDivElement | null>; onStart: () => void }) {
  const holding = useRef(false);
  const current = useRef<Drag | undefined>(undefined);
  const suppressClick = useRef(false);
  const [guide, setGuide] = useState<{ top: number; left: number; width: number }>();
  const cancel = () => {
    const drag = current.current;
    current.current = undefined; holding.current = false; setGuide(undefined);
    if (drag?.handle.hasPointerCapture(drag.pointer)) drag.handle.releasePointerCapture(drag.pointer);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !current.current) return;
      event.preventDefault(); suppressClick.current = true; cancel();
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); current.current = undefined; holding.current = false; };
  }, []);
  const start = (event: PointerEvent<HTMLButtonElement>, pos: number) => {
    if (event.button !== 0) return;
    const cell = editor.view.nodeDOM(pos);
    const table = cell instanceof HTMLElement ? cell.closest("table") : null;
    if (!table) return;
    const resolved = editor.state.doc.resolve(pos + 1);
    let depth = resolved.depth;
    while (depth > 0 && resolved.node(depth).type.name !== "table") depth--;
    if (!depth) return;
    const from = TableMap.get(resolved.node(depth)).findCell(pos - resolved.start(depth)).top;
    editor.commands.setTextSelection(pos + 1);
    suppressClick.current = false; holding.current = true;
    current.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, from, pos, table, handle: event.currentTarget, moving: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = current.current, root = container.current;
    if (!drag || drag.pointer !== event.pointerId || !root) return;
    if (!drag.moving) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
      drag.moving = true; suppressClick.current = true; onStart();
    }
    event.preventDefault();
    const table = drag.table.getBoundingClientRect(), parent = root.getBoundingClientRect();
    const rows = Array.from(drag.table.rows);
    if (!rows.length || event.clientX < table.left - 48 || event.clientX > table.right + 24 || event.clientY < table.top - 24 || event.clientY > table.bottom + 24) {
      drag.to = undefined; setGuide(undefined); return;
    }
    let boundary = rows.findIndex((row) => { const rect = row.getBoundingClientRect(); return event.clientY < (rect.top + rect.bottom) / 2; });
    if (boundary < 0) boundary = rows.length;
    drag.to = boundary > drag.from ? boundary - 1 : boundary;
    const top = boundary === rows.length ? table.bottom : rows[boundary].getBoundingClientRect().top;
    const clip = (drag.table.closest(".tableWrapper") ?? drag.table).getBoundingClientRect();
    const left = Math.max(table.left, clip.left, parent.left), right = Math.min(table.right, clip.right, parent.right);
    setGuide(drag.to === drag.from ? undefined : { top: top - parent.top, left: left - parent.left, width: Math.max(0, right - left) });
  };
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = current.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    if (drag.moving && drag.to !== undefined && drag.to !== drag.from) {
      event.preventDefault();
      const resolved = editor.state.doc.resolve(drag.pos + 1);
      let depth = resolved.depth;
      while (depth > 0 && resolved.node(depth).type.name !== "table") depth--;
      const table = depth ? resolved.node(depth) : undefined;
      let verticalMerge = false;
      table?.descendants((node) => { if (node.attrs.rowspan > 1) verticalMerge = true; });
      if (table && !verticalMerge) {
        // Move whole immutable rows, including header types, marks and attributes.
        const rows = Array.from({ length: table.childCount }, (_, index) => table.child(index));
        rows.splice(drag.to, 0, rows.splice(drag.from, 1)[0]);
        const moved = table.copy(Fragment.fromArray(rows));
        const pos = resolved.before(depth), start = resolved.start(depth), map = TableMap.get(moved);
        const tr = editor.state.tr.replaceWith(pos, pos + table.nodeSize, moved);
        tr.setSelection(CellSelection.rowSelection(tr.doc.resolve(start + map.positionAt(drag.to, 0, moved)), tr.doc.resolve(start + map.positionAt(drag.to, map.width - 1, moved))));
        editor.view.dispatch(closeHistory(tr));
      } else {
        // The table command moves groups connected by vertical merged cells safely.
        moveTableRow({ from: drag.from, to: drag.to, pos: drag.pos + 1 })(editor.state, (tr) => editor.view.dispatch(closeHistory(tr)));
      }
      editor.view.focus();
    }
    cancel();
  };
  const click = (event: MouseEvent<HTMLButtonElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
  };
  return { holding, guide, handlers: (pos: number) => ({ onPointerDown: (event: PointerEvent<HTMLButtonElement>) => start(event, pos), onPointerMove: move, onPointerUp: end, onPointerCancel: cancel, onLostPointerCapture: cancel, onClickCapture: click }) };
}
