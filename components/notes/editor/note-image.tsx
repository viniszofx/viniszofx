import Image from "@tiptap/extension-image";
import { mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { attachmentId } from "@/lib/notes/types";
import { LocalImage } from "../local-image";

function ImageBlock({ node, selected }: NodeViewProps) {
  return <NodeViewWrapper className={`my-4 ${selected ? "outline outline-2 outline-primary" : ""}`}>
    <LocalImage src={node.attrs.src} alt={node.attrs.alt ?? ""} title={node.attrs.title ?? undefined}
      className="max-h-[70dvh] max-w-full object-contain" />
  </NodeViewWrapper>;
}
export const NoteImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), src: { default: null,
      parseHTML: (element: HTMLElement) => element.getAttribute("data-local-src") ?? element.getAttribute("src") } };
  },
  parseHTML() { return [...(this.parent?.() ?? []), { tag: "img[data-local-src]" }]; },
  renderHTML({ HTMLAttributes }) {
    const id = attachmentId(HTMLAttributes.src);
    if (!id) return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    // Tiptap restores plain DOM during teardown. Keep the durable reference in
    // data attributes so the browser never tries to fetch a virtual local URL.
    const { src, ...attributes } = HTMLAttributes;
    return ["img", mergeAttributes(this.options.HTMLAttributes, attributes, { "data-local-src": src, "data-local-attachment": id })];
  },
  addNodeView() { return ReactNodeViewRenderer(ImageBlock); },
});
