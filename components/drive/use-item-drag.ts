"use client";
import { useState, type DragEvent } from "react";
import type { DriveItem } from "@/lib/nodus/stores";

const ITEM_DRAG = "application/x-viniszofx-drive";

/** Drag items onto folders (or the root, ""), producing `onMove(ids, destination)`. */
export function useItemDrag({ enabled, parentId, selectedIds, select, onMove }: {
  enabled: boolean; parentId: string; selectedIds: string[]; select: (ids: string[]) => void; onMove: (ids: string[], destination: string) => void;
}) {
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dropId, setDropId] = useState<string | null>(null);
  const canDrop = (destination: string) => draggedIds.length > 0 && destination !== parentId && !draggedIds.includes(destination);
  const reset = () => { setDraggedIds([]); setDropId(null); };

  function dropTarget(destination: string) {
    return {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!canDrop(destination)) return;
        event.preventDefault(); event.stopPropagation();
        event.dataTransfer.dropEffect = "move"; setDropId(destination || "root");
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropId(null); },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!canDrop(destination)) return;
        event.preventDefault(); event.stopPropagation();
        onMove(draggedIds, destination); reset();
      },
    };
  }

  function draggable(item: DriveItem) {
    return {
      draggable: enabled,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        if (!enabled) { event.preventDefault(); return; }
        const ids = selectedIds.includes(item.id) ? selectedIds : [item.id];
        setDraggedIds(ids); select(ids);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(ITEM_DRAG, JSON.stringify(ids));
      },
      onDragEnd: reset,
      ...(item.kind === "folder" ? dropTarget(item.id) : {}),
    };
  }

  const isDropTarget = (id: string) => dropId === (id || "root");
  return { dragging: draggedIds.length > 0, draggable, dropTarget, isDropTarget, reset };
}
