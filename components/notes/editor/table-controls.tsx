import { useState, type RefObject, Children, isValidElement, type ReactNode, type ComponentProps } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { Popover } from "@base-ui/react/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { tableColorValue } from "./table-extensions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useTableRowDrag } from "./use-table-row-drag";
import { useTableContext } from "./use-table-context";
function actionText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (isValidElement<{ children?: ReactNode }>(node)) return actionText(node.props.children);
  return Children.toArray(node).map(actionText).join(" ");
}
function Menu({ label, style, children, prepare, open, onOpenChange, dragHandlers }: { label: string; style: React.CSSProperties; children: ReactNode; prepare: () => void; open: boolean; dragHandlers?: ComponentProps<"button">; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState("");
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matches = Children.toArray(children).filter((child) => normalize(actionText(child)).includes(normalize(search)));
  return <Popover.Root open={open} onOpenChange={(open) => { if (open) setSearch(""); onOpenChange(open); }}><Popover.Trigger render={<Button variant="secondary" size="icon-xs" className={`absolute z-30 size-5! tracking-normal ${dragHandlers ? "touch-none cursor-grab active:cursor-grabbing select-none" : ""}`} {...dragHandlers} style={style} data-table-control aria-label={label} onMouseDown={(event) => { event.preventDefault(); prepare(); }} onClick={prepare} />}>⋮⋮</Popover.Trigger>
    <Popover.Portal><Popover.Positioner side="bottom" sideOffset={4} className="z-90"><Popover.Popup className="grid max-h-[70dvh] w-64 max-w-[calc(100vw-2rem)] gap-1 overflow-y-auto border border-border bg-popover p-2 text-popover-foreground shadow-lg">
      <Popover.Title className="px-2 py-2 text-xs text-muted-foreground">{label}</Popover.Title>
      <Input autoFocus aria-label={`Pesquisar ${label.toLowerCase()}`} placeholder="Pesquisar ações…" value={search} onChange={(event) => setSearch(event.target.value)} className="mb-1" />
      {matches.length ? matches : <p className="px-2 py-2 text-xs text-muted-foreground">Nenhuma ação encontrada.</p>}
    </Popover.Popup></Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}

export function TableControls({ editor, container }: { editor: Editor; container: RefObject<HTMLDivElement | null> }) {
  const rowDrag = useTableRowDrag({ editor, container, onStart: () => setOpen(false) });
  const { context, region, setRegion, open, setOpen } = useTableContext(editor, container, rowDrag.holding);
  const state = useEditorState({ editor, selector: ({ editor }) => ({ merge: editor.can().mergeCells(), split: editor.can().splitCell(), background: editor.getAttributes("tableCell").background ?? editor.getAttributes("tableHeader").background ?? "", align: editor.getAttributes("tableCell").align ?? editor.getAttributes("tableHeader").align ?? "left" }) });
  if (!context || !region) return null;
  const prepare = () => {
    if (!(editor.state.selection instanceof CellSelection)) editor.commands.setTextSelection(context.pos + 1);
  };
  const action = (label: string, run: () => unknown, disabled = false) => <Button key={label} variant="ghost" size="sm" className="w-full justify-start tracking-normal normal-case" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => { prepare(); run(); }}>{label}</Button>;
  const add = (kind: "row" | "column") => {
    const cell = editor.view.nodeDOM(context.pos);
    if (!(cell instanceof HTMLElement)) return;
    const table = cell.closest("table"), last = table?.querySelector("tr:last-child td:last-child, tr:last-child th:last-child");
    if (!(last instanceof HTMLElement)) return;
    const point = editor.view.posAtDOM(last, 0);
    editor.commands.setTextSelection(point);
    if (kind === "row") editor.chain().focus().addRowAfter().run(); else editor.chain().focus().addColumnAfter().run();
  };
  const row = () => {
    const resolved = editor.state.doc.resolve(context.pos + 1);
    let depth = resolved.depth;
    while (depth > 0 && resolved.node(depth).type.name !== "tableRow") depth--;
    return depth ? { node: resolved.node(depth), pos: resolved.before(depth) } : undefined;
  };
  const colorRow = (background: string) => {
    const current = row(); if (!current) return;
    const tr = editor.state.tr;
    current.node.forEach((cell, offset) => tr.setNodeMarkup(current.pos + 1 + offset, undefined, { ...cell.attrs, background: background || null }));
    editor.view.dispatch(tr); editor.commands.focus();
  };
  const clearRow = () => {
    const current = row(); if (!current) return;
    const tr = editor.state.tr;
    const cells: { from: number; to: number }[] = [];
    current.node.forEach((cell, offset) => cells.push({ from: current.pos + offset + 2, to: current.pos + offset + cell.nodeSize }));
    for (const cell of cells.reverse()) tr.replaceWith(cell.from, cell.to, editor.schema.nodes.paragraph.create());
    editor.view.dispatch(tr); editor.commands.focus();
  };
  const column = () => {
    const resolved = editor.state.doc.resolve(context.pos + 1);
    let depth = resolved.depth;
    while (depth > 0 && resolved.node(depth).type.name !== "table") depth--;
    if (!depth) return undefined;
    const table = resolved.node(depth), start = resolved.start(depth), map = TableMap.get(table);
    const rect = map.findCell(context.pos - start);
    const cells = [...new Set(Array.from({ length: map.height }, (_, row) => map.map[row * map.width + rect.left]))];
    return { table, start, map, rect, cells };
  };
  const colorTable = (background: string | null) => {
    const current = column(); if (!current) return;
    const tr = editor.state.tr;
    current.table.descendants((node, offset) => {
      if (!["tableCell", "tableHeader"].includes(node.type.name)) return;
      tr.setNodeMarkup(current.start + offset, undefined, { ...node.attrs, background });
      return false;
    });
    editor.view.dispatch(tr); editor.commands.focus();
  };
  const editColumn = (background?: string) => {
    const current = column(); if (!current) return;
    const tr = editor.state.tr;
    for (const offset of current.cells.sort((a, b) => b - a)) {
      const cell = current.table.nodeAt(offset); if (!cell) continue;
      if (background === undefined) tr.replaceWith(current.start + offset + 1, current.start + offset + cell.nodeSize - 1, editor.schema.nodes.paragraph.create());
      else tr.setNodeMarkup(current.start + offset, undefined, { ...cell.attrs, background: background || null });
    }
    editor.view.dispatch(tr); editor.commands.focus();
  };
  const duplicateColumn = () => {
    const original = column(); if (!original) return;
    editor.commands.addColumnAfter();
    const current = column(); if (!current) return;
    const tr = editor.state.tr, copied = new Set<number>();
    for (let row = current.map.height - 1; row >= 0; row--) {
      const offset = current.map.map[row * current.map.width + original.rect.right];
      if (copied.has(offset)) continue;
      copied.add(offset);
      const target = current.table.nodeAt(offset), source = original.table.nodeAt(original.map.map[row * original.map.width + original.rect.left]);
      if (!target || !source) continue;
      const pos = current.start + offset;
      tr.setNodeMarkup(pos, undefined, { ...target.attrs, background: source.attrs.background, align: source.attrs.align });
      tr.replaceWith(pos + 1, pos + target.nodeSize - 1, source.content);
    }
    editor.view.dispatch(tr); editor.commands.focus();
  };
  return <div aria-label="Controles da tabela">
    {rowDrag.guide && <div aria-hidden data-table-row-guide className="pointer-events-none absolute z-40 h-0.5 bg-primary" style={rowDrag.guide} />}
    {open && (region === "row" || region === "column") && <div aria-hidden className="pointer-events-none absolute z-10 border-2 border-ring" style={region === "row" ? { top: context.cellTop, left: context.left, width: context.width, height: context.cellHeight } : { top: context.top, left: context.cellLeft, width: context.cellWidth, height: context.height }} /> }
    {region === "row" && <Menu dragHandlers={rowDrag.handlers(context.pos)} open={open} label="Ações da linha" prepare={prepare} onOpenChange={setOpen} style={{ top: context.cellTop + (context.cellHeight - 20) / 2, left: context.left - 22 }}>
      <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs"><span>Cor da linha</span><ColorPicker label="Cor de fundo da linha" value={tableColorValue(row()?.node.firstChild?.attrs.background)} onChange={(color) => colorRow(color ?? "")} /></div>
      {action("Inserir acima", () => editor.chain().focus().addRowBefore().run())}
      {action("Inserir abaixo", () => editor.chain().focus().addRowAfter().run())}
      {action("Cabeçalho de linha", () => editor.chain().focus().toggleHeaderRow().run())}
      {action("Duplicar linha", () => { const current = row(); if (current) editor.view.dispatch(editor.state.tr.insert(current.pos + current.node.nodeSize, current.node)); })}
      {action("Apagar conteúdo", clearRow)}
      {action("Excluir linha", () => editor.chain().focus().deleteRow().run())}
    </Menu>}
    {region === "column" && <Menu open={open} label="Ações da coluna" prepare={prepare} onOpenChange={setOpen} style={{ top: context.top - 22, left: context.cellLeft + (context.cellWidth - 20) / 2 }}>
      <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs"><span>Cor da coluna</span><ColorPicker label="Cor de fundo da coluna" value={tableColorValue(editor.state.doc.nodeAt(context.pos)?.attrs.background)} onChange={(color) => editColumn(color ?? "")} /></div>
      {action("Coluna à esquerda", () => editor.chain().focus().addColumnBefore().run())}
      {action("Coluna à direita", () => editor.chain().focus().addColumnAfter().run())}
      {action("Cabeçalho de coluna", () => editor.chain().focus().toggleHeaderColumn().run())}
      {action("Duplicar coluna", duplicateColumn)}
      {action("Apagar conteúdo da coluna", () => editColumn())}
      {action("Excluir coluna", () => editor.chain().focus().deleteColumn().run())}
    </Menu>}
    {region === "cell" && <Menu open={open} label="Ações da célula" prepare={prepare} onOpenChange={setOpen} style={{ top: context.cellTop + 2, left: context.cellLeft + context.cellWidth - 22 }}>
      <Button variant="ghost" size="sm" className="justify-start tracking-normal normal-case" onClick={() => setRegion("row")}>Ações da linha</Button>
      <Button variant="ghost" size="sm" className="justify-start tracking-normal normal-case" onClick={() => setRegion("column")}>Ações da coluna</Button>
      <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs"><span>Cor da célula</span><ColorPicker label="Cor de fundo da célula" value={tableColorValue(editor.state.doc.nodeAt(context.pos)?.attrs.background)} onChange={(color) => { prepare(); editor.chain().focus().setCellAttribute("background", color).run(); }} /></div>
      <label className="grid gap-2 px-2 py-2 text-xs">Alinhamento<select aria-label="Alinhamento da célula" value={state.align} className="border border-input bg-background p-2 text-sm" onChange={(event) => { prepare(); editor.chain().focus().setCellAttribute("align", event.target.value).run(); }}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
      {action("Mesclar células", () => editor.chain().focus().mergeCells().run(), !state.merge)}
      {action("Separar células", () => editor.chain().focus().splitCell().run(), !state.split)}
      {action("Limpar conteúdo da célula", () => {
        const cell = editor.state.doc.nodeAt(context.pos);
        if (cell) editor.chain().focus().deleteRange({ from: context.pos + 1, to: context.pos + cell.nodeSize - 1 }).run();
      })}
    </Menu>}
    {region === "table" && <Menu open={open} label="Ações da tabela" prepare={prepare} onOpenChange={setOpen} style={{ top: context.top - 22, left: context.left }}>
      <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs"><span>Cor da tabela</span><ColorPicker label="Cor de fundo da tabela" value={tableColorValue(column()?.table.firstChild?.firstChild?.attrs.background)} onChange={colorTable} /></div>
      {action("Ajustar à largura da página", () => {
        const { $from } = editor.state.selection;
        let depth = $from.depth; while (depth > 0 && $from.node(depth).type.name !== "table") depth--;
        if (!depth) return;
        const table = $from.node(depth), pos = $from.start(depth), tr = editor.state.tr;
        table.descendants((node, offset) => { if (["tableCell", "tableHeader"].includes(node.type.name)) tr.setNodeMarkup(pos + offset, undefined, { ...node.attrs, colwidth: null }); });
        editor.view.dispatch(tr); editor.commands.focus();
      })}
      {action("Excluir tabela", () => editor.chain().focus().deleteTable().run())}
    </Menu>}
    {region === "add-row" && <Button data-table-control variant="secondary" size="icon-xs" aria-label="Adicionar linha ao final" className="absolute z-20 h-5! tracking-normal" style={{ top: context.top + context.height + 2, left: context.left, width: context.width }} onMouseDown={(event) => event.preventDefault()} onClick={() => add("row")}>+</Button>}
    {region === "add-column" && <Button data-table-control variant="secondary" size="icon-xs" aria-label="Adicionar coluna ao final" className="absolute z-20 w-5! tracking-normal" style={{ top: context.top, left: context.left + context.width - 20, height: context.height }} onMouseDown={(event) => event.preventDefault()} onClick={() => add("column")}>+</Button>}
  </div>;
}
