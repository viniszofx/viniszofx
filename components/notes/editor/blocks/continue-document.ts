import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";

// Blank space belongs to the document (or its column), rather than the last table cell.
export function continueDocument(view: EditorView, event: MouseEvent) {
  if (event.button !== 0 || !(event.target instanceof HTMLElement)) return false;
  const column = event.target.closest<HTMLElement>("[data-note-column]");
  const container = column ?? view.dom;
  if (event.target !== container) return false;
  const last = container.lastElementChild;
  if (last && event.clientY < last.getBoundingClientRect().bottom) return false;
  const end = view.posAtDOM(container, container.childNodes.length);
  const parent = view.state.doc.resolve(end).parent;
  const paragraph = view.state.schema.nodes.paragraph;
  if (!paragraph || !parent.canReplaceWith(parent.childCount, parent.childCount, paragraph)) return false;
  const tr = view.state.tr;
  const existing = parent.lastChild?.type === paragraph && !parent.lastChild.content.size;
  if (!existing) tr.insert(end, paragraph.create());
  const caret = existing ? end - 1 : end + 1;
  tr.setSelection(TextSelection.create(tr.doc, caret));
  event.preventDefault();
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}
