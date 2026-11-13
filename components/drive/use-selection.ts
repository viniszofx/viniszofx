"use client";
import { useRef, useState, type MouseEvent, type PointerEvent } from "react";

type Rect = { left: number; top: number; width: number; height: number };

/**
 * Click / Ctrl / Shift selection plus rubber-band selection over elements
 * marked with `data-drive-item`.
 */
export function useSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchor, setAnchor] = useState("");
  const [rect, setRect] = useState<Rect | null>(null);
  const start = useRef<{ x: number; y: number; base: string[] } | null>(null);
  const moved = useRef(false);

  function pick(event: MouseEvent, id: string) {
    event.stopPropagation();
    if (event.shiftKey && anchor) {
      const [from, to] = [visibleIds.indexOf(anchor), visibleIds.indexOf(id)].sort((a, b) => a - b);
      setSelectedIds(visibleIds.slice(from, to + 1));
    } else if (event.ctrlKey || event.metaKey) {
      setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
      setAnchor(id);
    } else { setSelectedIds([id]); setAnchor(id); }
  }

  function update(event: PointerEvent<HTMLElement>) {
    const origin = start.current;
    if (!origin || (!moved.current && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 5)) return;
    moved.current = true;
    const box = event.currentTarget.getBoundingClientRect();
    const left = Math.max(box.left, Math.min(origin.x, event.clientX)), right = Math.min(box.right, Math.max(origin.x, event.clientX));
    const top = Math.max(box.top, Math.min(origin.y, event.clientY)), bottom = Math.min(box.bottom, Math.max(origin.y, event.clientY));
    setRect({ left: left - box.left + event.currentTarget.scrollLeft, top: top - box.top + event.currentTarget.scrollTop, width: right - left, height: bottom - top });
    const hits = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-drive-item]")].filter(element => {
      const item = element.getBoundingClientRect();
      return item.left < right && item.right > left && item.top < bottom && item.bottom > top;
    }).map(element => element.dataset.driveItem!);
    setSelectedIds([...new Set([...origin.base, ...hits])]);
  }

  const areaProps = {
    onClick: () => { if (moved.current) { moved.current = false; return; } setSelectedIds([]); },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || event.pointerType === "touch" || (event.target as HTMLElement).closest("[data-drive-item]")) return;
      start.current = { x: event.clientX, y: event.clientY, base: event.ctrlKey || event.metaKey || event.shiftKey ? selectedIds : [] };
      moved.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: update,
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!start.current) return;
      update(event); start.current = null; setRect(null);
      event.currentTarget.releasePointerCapture(event.pointerId);
      window.setTimeout(() => { moved.current = false; }, 0);
    },
    onPointerCancel: () => { start.current = null; moved.current = false; setRect(null); },
  };

  return { selectedIds, setSelectedIds, pick, rect, areaProps };
}
