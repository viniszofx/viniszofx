import { menuSurfaceClass } from "@/components/ui/menu-styles";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Popover } from "@base-ui/react/popover";
import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { addBlockAfter, deleteBlock, duplicateBlock, moveBlock, moveBlockBy, placeBlockBeside, topBlock } from "./block-actions";
import { blockCommands, runBlockCommand } from "./commands";
import { embedUrl } from "../note-embed-extension";
const dragType = "application/x-viniszofx-note-block";
function sideAt(rect: DOMRect, event: DragEvent) {
  const inset = Math.min(8, rect.height / 4);
  if (innerWidth < 640 || event.clientY < rect.top + inset || event.clientY > rect.bottom - inset) return undefined;
  const edge = Math.min(48, rect.width * 0.2);
  return event.clientX < rect.left + edge ? "left" : event.clientX > rect.right - edge ? "right" : undefined;
}
export function BlockControls({ editor, container }: { editor: Editor; container: RefObject<HTMLDivElement | null> }) {
  const [active, setActive] = useState<{ pos: number; top: number; left: number }>();
  const [marker, setMarker] = useState<{ top: number; left: number; width: number; height: number }>();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const drag = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const cancelHide = () => { clearTimeout(hideTimer.current); hideTimer.current = undefined; };
    const hide = () => { if (!open && drag.current === null && !hideTimer.current) hideTimer.current = setTimeout(() => { hideTimer.current = undefined; setVisible(false); }, 300); };
    if (open) cancelHide();
    const dom = editor.view.dom;
    const locate = (event: PointerEvent | DragEvent) => {
      const result = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
      return result ? topBlock(editor, result.pos) : undefined;
    };
    const show = (pos: number) => {
      cancelHide();
      const block = topBlock(editor, pos), root = container.current;
      if (!block || !root) return;
      const element = editor.view.nodeDOM(block.pos);
      if (!(element instanceof HTMLElement)) return;
      const rect = element.getBoundingClientRect(), parent = root.getBoundingClientRect();
      const top = rect.top - parent.top, left = rect.left - parent.left;
      setActive((previous) => previous?.pos === block.pos && previous.top === top && previous.left === left ? previous : { pos: block.pos, top, left });
    };
    const hover = (event: PointerEvent) => { if (!open && drag.current === null) { if (event.target instanceof Element && event.target.closest("table")) { setVisible(false); return; } const block = locate(event); if (block) {
      if (block.node.type.name === "table") {
        const element = editor.view.nodeDOM(block.pos);
        const table = element instanceof HTMLElement ? element.querySelector("table") ?? element : undefined;
        const rect = table?.getBoundingClientRect();
        if (rect && (event.clientY >= rect.top - 26 || event.clientX >= rect.left + 12)) { setVisible(false); return; }
      }
      show(block.pos); setVisible(true);
    } } };
    const selection = () => { if (!open) { if (editor.isActive("table")) { setVisible(false); return; } show(editor.state.selection.from); if (dom.contains(document.activeElement)) setVisible(true); } };
    const leave = () => hide();
    const over = (event: DragEvent) => {
      if (drag.current === null || !event.dataTransfer?.types.includes(dragType)) return;
      const block = locate(event), root = container.current;
      if (!block || !root) return;
      const element = editor.view.nodeDOM(block.pos);
      if (!(element instanceof HTMLElement)) return;
      event.preventDefault(); event.dataTransfer.dropEffect = "move";
      const rect = element.getBoundingClientRect(), parent = root.getBoundingClientRect(), side = sideAt(rect, event);
      setMarker(side ? { top: rect.top - parent.top, left: (side === "left" ? rect.left : rect.right) - parent.left, width: 2, height: rect.height } : { top: (event.clientY > (rect.top + rect.bottom) / 2 ? rect.bottom : rect.top) - parent.top, left: rect.left - parent.left, width: rect.width, height: 2 });
    };
    const drop = (event: DragEvent) => {
      if (drag.current === null || !event.dataTransfer?.types.includes(dragType)) return;
      event.preventDefault(); event.stopPropagation();
      const block = locate(event);
      if (block) {
        const element = editor.view.nodeDOM(block.pos);
        if (element instanceof HTMLElement) {
          const rect = element.getBoundingClientRect();
          const side = sideAt(rect, event);
          if (side) placeBlockBeside(editor, drag.current, block.pos, side);
          else moveBlock(editor, drag.current, event.clientY > (rect.top + rect.bottom) / 2 ? block.pos + block.node.nodeSize : block.pos);
        }
      }
      drag.current = null; setMarker(undefined); selection();
    };
    dom.addEventListener("focus", selection); dom.addEventListener("pointermove", hover); dom.addEventListener("dragover", over); dom.addEventListener("drop", drop, true);
    const root = container.current; root?.addEventListener("pointerleave", leave); root?.addEventListener("pointerenter", cancelHide);
    editor.on("selectionUpdate", selection); editor.on("update", selection);
    return () => { cancelHide(); root?.removeEventListener("pointerenter", cancelHide); root?.removeEventListener("pointerleave", leave); dom.removeEventListener("focus", selection); dom.removeEventListener("pointermove", hover); dom.removeEventListener("dragover", over); dom.removeEventListener("drop", drop, true); editor.off("selectionUpdate", selection); editor.off("update", selection); };
  }, [editor, container, open]);
  const block = active ? topBlock(editor, active.pos) : undefined;
  const adjacent = block && block.parent.childCount > 1 ? block.index > 0 ? block.pos - block.parent.child(block.index - 1).nodeSize : block.pos + block.node.nodeSize : undefined;
  const act = (run: () => void) => { run(); setOpen(false); editor.commands.focus(); };
  return <>
    {marker && <div aria-hidden className="pointer-events-none absolute z-20 bg-primary" style={marker} />}
    {active && block && (visible || open) && <div className="absolute z-20 flex items-center" style={{ top: active.top, left: active.left - 40 }}>
      <Button variant="ghost" size="icon-xs" className="size-5!" aria-label="Adicionar bloco abaixo" onMouseDown={(event) => event.preventDefault()} onClick={() => addBlockAfter(editor, active.pos)}>+</Button>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger render={<Button variant="ghost" size="icon-xs" className="size-5!" aria-label="Ações do bloco" draggable onDragStart={(event) => {
          drag.current = active.pos; event.dataTransfer.setData(dragType, String(active.pos)); event.dataTransfer.effectAllowed = "move";
          editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, active.pos)));
          setOpen(false);
        }} onDragEnd={() => { drag.current = null; setMarker(undefined); }} />}>⠿</Popover.Trigger>
        <Popover.Portal><Popover.Positioner side="right" sideOffset={6} className="z-90"><Popover.Popup className={`max-h-[70dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto border border-border p-2 ${menuSurfaceClass}`}>
          <Popover.Title className="px-2 py-2 text-xs font-medium text-muted-foreground">Ações do bloco</Popover.Title>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => act(() => { duplicateBlock(editor, active.pos); })}>Duplicar bloco</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" disabled={block.index === 0} onClick={() => act(() => { moveBlockBy(editor, active.pos, -1); })}>Mover para cima</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" disabled={block.index === block.parent.childCount - 1} onClick={() => act(() => { moveBlockBy(editor, active.pos, 1); })}>Mover para baixo</Button>
          {adjacent !== undefined && <>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => act(() => { placeBlockBeside(editor, active.pos, adjacent, "left"); })}>Colocar à esquerda</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => act(() => { placeBlockBeside(editor, active.pos, adjacent, "right"); })}>Colocar à direita</Button>
          </>}
          {block.node.isTextblock && embedUrl(block.node.textContent) && <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
            setOpen(false); editor.view.dom.dispatchEvent(new CustomEvent("viniszofx:insert-embed", { detail: { src: block.node.textContent, pos: active.pos } }));
          }}>Converter em incorporação</Button>}
          {(block.node.isTextblock || ["bulletList", "orderedList", "taskList", "blockquote"].includes(block.node.type.name)) && <>
            <p className="mt-2 border-t border-border px-2 py-2 text-xs text-muted-foreground">Transformar em</p>
            {blockCommands.filter((command) => !command.attach && !command.action && !command.embed && !["table", "divider"].includes(command.id)).map((command) => <Button key={command.id} variant="ghost" size="sm" className="w-full justify-start" onClick={() => act(() => {
              editor.commands.setNodeSelection(active.pos); runBlockCommand(editor, command);
            })}>{command.label}</Button>)}
          </>}
          <Button variant="destructive" size="sm" className="mt-2 w-full justify-start" onClick={() => act(() => { deleteBlock(editor, active.pos); })}>Excluir bloco</Button>
        </Popover.Popup></Popover.Positioner></Popover.Portal>
      </Popover.Root>
    </div>}
  </>;
}
