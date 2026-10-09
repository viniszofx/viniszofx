import { menuSurfaceClass } from "@/components/ui/menu-styles";
import type { Editor } from "@tiptap/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { BlockCommand } from "./commands";
export type SlashMenuHandle = { onKeyDown: (event: KeyboardEvent) => boolean };
type SlashMenuProps = { items: BlockCommand[]; command: (command: BlockCommand) => void; menuId: string; editor: Editor };
export const SlashMenuRenderer = forwardRef<SlashMenuHandle, SlashMenuProps & { query: string }>(function SlashMenuRenderer({ query, ...props }, ref) {
  return <SlashMenu key={query} {...props} ref={ref} />;
});
export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu({ items, command, menuId, editor }, ref) {
  const [selected, setSelected] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const select = (index: number) => {
    setSelected(index);
    list.current?.children[index]?.scrollIntoView({ block: "nearest" });
  };
  useEffect(() => {
    const dom = editor.view.dom;
    if (items.length) dom.setAttribute("aria-activedescendant", `${menuId}-${selected}`);
    else dom.removeAttribute("aria-activedescendant");
    return () => dom.removeAttribute("aria-activedescendant");
  }, [editor, menuId, selected, items.length]);
  useImperativeHandle(ref, () => ({ onKeyDown: (event) => {
    if (!items.length) return false;
    if (event.key === "ArrowDown") { select((selected + 1) % items.length); return true; }
    if (event.key === "ArrowUp") { select((selected + items.length - 1) % items.length); return true; }
    if (event.key === "Enter" || event.key === "Tab") { command(items[selected] ?? items[0]); return true; }
    return false;
  } }));
  return <div className={`overflow-hidden border border-border ${menuSurfaceClass}`}>
    <p className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">Blocos e ações</p>
    <div ref={list} id={menuId} role="listbox" aria-label="Comandos de bloco" className="max-h-[min(18rem,40dvh)] overflow-y-auto overscroll-contain p-1">
      {items.length ? items.map((item, index) => <button key={item.id} id={`${menuId}-${index}`} type="button" role="option" aria-selected={index === selected} tabIndex={-1} className={`flex w-full items-center gap-3 p-2 text-left ${index === selected ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setSelected(index)} onClick={() => command(item)}>
        <span className="grid size-8 shrink-0 place-items-center border border-border text-sm">{item.icon}</span><span className="min-w-0"><span className="block text-sm font-medium">{item.label}</span><span className="block text-xs text-muted-foreground">{item.description}</span></span>
      </button>) : <p className="p-3 text-sm text-muted-foreground">Nenhum comando encontrado.</p>}
    </div>
  </div>;
});
