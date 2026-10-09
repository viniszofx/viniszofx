import { Node, mergeAttributes } from "@tiptap/react";

export const NoteColumns = Node.create({
  name: "noteColumns", group: "block", content: "noteColumn{2,}", defining: true, priority: 90,
  parseHTML() { return [{ tag: "div[data-note-columns]" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { "data-note-columns": "", class: "flex flex-col gap-12 sm:flex-row" }), 0]; },
  renderMarkdown(node, helpers) { return helpers.renderChildren(node.content ?? [], "\n\n"); },
});
export const NoteColumn = Node.create({
  name: "noteColumn", content: "block+", defining: true,
  parseHTML() { return [{ tag: "div[data-note-column]" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { "data-note-column": "", class: "min-w-0 flex-1 space-y-3" }), 0]; },
  renderMarkdown(node, helpers) { return helpers.renderChildren(node.content ?? [], "\n\n"); },
});
