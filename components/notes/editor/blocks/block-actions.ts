import { NodeSelection, Selection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import type { Transaction } from "@tiptap/pm/state";

export function topBlock(editor: Editor, position = editor.state.selection.from) {
  const doc = editor.state.doc;
  if (position < 0 || position >= doc.content.size) return undefined;
  const resolved = doc.resolve(position);
  let depth = 0;
  for (let index = 1; index <= resolved.depth; index++) if (resolved.node(index).type.name === "noteColumn") depth = index;
  const parent = resolved.node(depth), index = resolved.index(depth);
  const node = parent.maybeChild(index);
  if (!node) return undefined;
  let pos = resolved.start(depth);
  for (let n = 0; n < index; n++) pos += parent.child(n).nodeSize;
  return { pos, index, node, parent };
}
function normalizeColumns(tr: Transaction) {
  const positions: number[] = [];
  tr.doc.descendants((node, pos) => { if (node.type.name === "noteColumns") positions.push(pos); });
  for (const pos of positions.reverse()) {
    const group = tr.doc.nodeAt(pos);
    if (group?.type.name !== "noteColumns") continue;
    const columns: typeof group[] = [];
    group.forEach((column) => {
      if (!(column.childCount === 1 && column.firstChild?.type.name === "paragraph" && !column.firstChild.content.size)) columns.push(column);
    });
    if (columns.length === group.childCount) continue;
    const replacement = columns.length > 1 ? group.type.create(group.attrs, columns) : columns[0]?.content ?? tr.doc.type.schema.nodes.paragraph.create();
    tr.replaceWith(pos, pos + group.nodeSize, replacement);
  }
  return tr;
}
function selectMoved(editor: Editor, tr: Transaction, node: typeof editor.state.doc) {
  let pos: number | undefined;
  tr.doc.descendants((child, offset) => { if (child === node) pos = offset; });
  editor.view.dispatch(tr.setSelection(pos !== undefined ? NodeSelection.create(tr.doc, pos) : Selection.near(tr.doc.resolve(0))).scrollIntoView());
}
export function duplicateBlock(editor: Editor, pos?: number) {
  const block = topBlock(editor, pos);
  if (!block) return false;
  const target = block.pos + block.node.nodeSize;
  const tr = editor.state.tr.insert(target, block.node);
  editor.view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(target + 1))).scrollIntoView());
  return true;
}
export function deleteBlock(editor: Editor, pos?: number) {
  const block = topBlock(editor, pos);
  if (!block) return false;
  const tr = normalizeColumns(editor.state.tr.delete(block.pos, block.pos + block.node.nodeSize));
  editor.view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(Math.min(block.pos, tr.doc.content.size)))).scrollIntoView());
  return true;
}
export function moveBlock(editor: Editor, from: number, to: number) {
  const block = topBlock(editor, from);
  if (!block || to < 0 || to > editor.state.doc.content.size || (to >= block.pos && to <= block.pos + block.node.nodeSize)) return false;
  const tr = editor.state.tr.delete(block.pos, block.pos + block.node.nodeSize);
  const destination = tr.mapping.map(to, to > block.pos ? -1 : 1);
  tr.insert(destination, block.node);
  selectMoved(editor, normalizeColumns(tr), block.node);
  return true;
}
export function moveBlockBy(editor: Editor, pos: number, direction: -1 | 1) {
  const block = topBlock(editor, pos);
  if (!block || block.index + direction < 0 || block.index + direction >= block.parent.childCount) return false;
  const neighbor = block.parent.child(block.index + direction);
  return moveBlock(editor, block.pos, direction < 0 ? block.pos - neighbor.nodeSize : block.pos + block.node.nodeSize + neighbor.nodeSize);
}
export function placeBlockBeside(editor: Editor, from: number, target: number, side: "left" | "right") {
  const source = topBlock(editor, from), destination = topBlock(editor, target);
  if (!source || !destination || source.pos === destination.pos || (destination.pos >= source.pos && destination.pos < source.pos + source.node.nodeSize)) return false;
  const tr = editor.state.tr.delete(source.pos, source.pos + source.node.nodeSize);
  const pos = tr.mapping.map(destination.pos), node = tr.doc.nodeAt(pos);
  if (!node) return false;
  const resolved = tr.doc.resolve(pos + 1);
  let columnDepth = 0;
  for (let depth = 1; depth <= resolved.depth; depth++) if (resolved.node(depth).type.name === "noteColumn") columnDepth = depth;
  const column = editor.schema.nodes.noteColumn.create(null, source.node);
  if (columnDepth) {
    const edge = resolved.before(columnDepth);
    tr.insert(side === "left" ? edge : edge + resolved.node(columnDepth).nodeSize, column);
  } else {
    const other = editor.schema.nodes.noteColumn.create(null, node);
    tr.replaceWith(pos, pos + node.nodeSize, editor.schema.nodes.noteColumns.create(null, side === "left" ? [column, other] : [other, column]));
  }
  selectMoved(editor, normalizeColumns(tr), source.node);
  return true;
}
export function addBlockAfter(editor: Editor, pos: number) {
  const block = topBlock(editor, pos);
  if (!block) return;
  if (block.node.type.name === "paragraph" && !block.node.content.size) {
    editor.chain().focus().setTextSelection(pos + 1).insertContent("/").run();
  } else {
    const target = block.pos + block.node.nodeSize;
    editor.chain().focus().insertContentAt(target, { type: "paragraph", content: [{ type: "text", text: "/" }] }).setTextSelection(target + 2).run();
  }
}
