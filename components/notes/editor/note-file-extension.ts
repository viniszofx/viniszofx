import { Node, mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import { FileBlock } from "./note-file-block";
import { noteFileResource as resource } from "./note-file-resource";
export const NoteFileBlock = Node.create({
  name: "noteFile", group: "block", atom: true, draggable: true, priority: 1100,
  addAttributes() { return { href: { isRequired: true }, name: { default: "Arquivo" } }; },
  parseHTML() { return [{ tag: "div[data-note-attachment]", getAttrs: (element) => { const href = element.getAttribute("href") ?? ""; return resource(href) ? { href, name: element.getAttribute("name") ?? "Arquivo" } : false; } }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { "data-note-attachment": "" }), ["a", { href: HTMLAttributes.href }, HTMLAttributes.name]]; },
  markdownTokenName: "noteFile",
  markdownTokenizer: {
    name: "noteFile", level: "block",
    start: (src) => {
      for (const match of src.matchAll(/\n\[((?:\\.|[^\]\\\n])*)\]\((https?:\/\/[^\s]+)\)(?=\n|$)/g)) {
        if (resource(match[2])) return match.index + 1;
      }
      return -1;
    },
    tokenize(src) {
      const match = /^\[((?:\\.|[^\]\\\n])*)\]\((https?:\/\/[^\s]+)\)(?:\n|$)/.exec(src);
      return match && resource(match[2]) ? { type: "noteFile", raw: match[0], href: match[2], text: match[1].replace(/\\([\\[\]])/g, "$1") } : undefined;
    },
  },
  parseMarkdown(token, helpers) {
    if (!resource(token.href ?? "")) return [];
    return helpers.createNode("noteFile", { href: token.href, name: token.text });
  },
  renderMarkdown(node) { return `[${String(node.attrs?.name ?? "Arquivo").replace(/([\\[\]])/g, "\\$1")}](${node.attrs?.href})`; },
  addNodeView() { return ReactNodeViewRenderer(FileBlock); },
});
