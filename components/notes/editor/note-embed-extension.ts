import { Node, mergeAttributes } from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";

export function embedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && url.origin !== window.location.origin ? url.href : undefined;
  } catch { return undefined; }
}
export function widgetUrl(value: string) {
  const href = embedUrl(value);
  return href && ["embeds.widgetsfornotion.com", "indify.co", "embednotion.com", "apption.co"].includes(new URL(href).hostname) ? href : undefined;
}

export const NoteEmbed = Node.create({
  name: "noteEmbed", group: "block", atom: true, draggable: true, priority: 1101,
  addAttributes() { return { src: { isRequired: true }, height: { default: 300 } }; },
  parseHTML() { return [{ tag: "div[data-note-embed]", getAttrs: (element) => { const src = embedUrl(element.getAttribute("src") ?? ""); return src ? { src, height: 300 } : false; } }]; },
  renderHTML({ HTMLAttributes }) {
    const src = embedUrl(String(HTMLAttributes.src ?? ""));
    if (!src) return ["div", { "data-note-embed": "" }, "Endereço de incorporação inválido."];
    const height = Math.min(800, Math.max(120, Number(HTMLAttributes.height) || 300));
    return ["div", mergeAttributes(HTMLAttributes, { "data-note-embed": "", contenteditable: "false", class: "my-4 overflow-hidden border border-border bg-muted/20" }),
      ["iframe", { src, title: `Incorporação: ${new URL(src).hostname}`, height, class: "block w-full border-0", sandbox: "allow-scripts allow-same-origin allow-presentation", referrerpolicy: "strict-origin-when-cross-origin", allowfullscreen: "true" }],
      ["a", { href: src, target: "_blank", rel: "noopener noreferrer", class: "block truncate px-3 py-2 text-xs" }, "Abrir incorporação ↗"],
    ];
  },
  markdownTokenName: "noteEmbed",
  markdownTokenizer: {
    name: "noteEmbed", level: "block",
    start: (src) => {
      const match = /\n(?:\[Incorporação\]\(https?:\/\/[^\s]+\)|https?:\/\/(?:embeds\.widgetsfornotion\.com|indify\.co|embednotion\.com|apption\.co)\/[^\s]+)(?=\n|$)/.exec(src);
      return match ? match.index + 1 : -1;
    },
    tokenize(src) {
      const line = /^([^\n]+)(?:\n|$)/.exec(src);
      if (!line) return undefined;
      const link = /^\[Incorporação\]\((https?:\/\/[^\s]+)\)$/.exec(line[1]);
      const href = link ? embedUrl(link[1]) : widgetUrl(line[1]);
      return href ? { type: "noteEmbed", raw: line[0], href } : undefined;
    },
  },
  parseMarkdown(token, helpers) {
    const src = embedUrl(token.href ?? "");
    return src ? helpers.createNode("noteEmbed", { src, height: 300 }) : [];
  },
  renderMarkdown(node) { return `[Incorporação](${node.attrs?.src})`; },
  addProseMirrorPlugins() {
    return [new Plugin({ props: { handlePaste: (_view, event) => {
      if (!this.editor.isEditable || this.editor.isActive("codeBlock") || event.clipboardData?.files.length) return false;
      const src = widgetUrl(event.clipboardData?.getData("text/plain") ?? "");
      if (!src) return false;
      this.editor.commands.insertContent({ type: "noteEmbed", attrs: { src, height: 300 } });
      return true;
    } } })];
  },
});
