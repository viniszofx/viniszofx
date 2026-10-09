import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
const backgrounds: Record<string, string> = { muted: "var(--muted)", primary: "color-mix(in oklab, var(--primary) 18%, transparent)", green: "color-mix(in oklab, #22c55e 18%, transparent)", blue: "color-mix(in oklab, #3b82f6 18%, transparent)", yellow: "color-mix(in oklab, #eab308 18%, transparent)", red: "color-mix(in oklab, #ef4444 18%, transparent)" };
export function tableColorValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  return ({ muted: "#52525b", primary: "#d95b16", green: "#36854a", blue: "#2878bd", yellow: "#c49b25", red: "#c94343" } as Record<string, string>)[value] ?? null;
}
const backgroundAttribute = {
  default: null,
  parseHTML: (element: HTMLElement) => { const color = element.getAttribute("data-background"); return color && tableColorValue(color) ? color : null; },
  renderHTML: (attrs: Record<string, unknown>) => { const color = String(attrs.background ?? ""); const background = backgrounds[color] ?? (tableColorValue(color) ? `color-mix(in srgb, ${color} 18%, var(--muted))` : null); return background ? { "data-background": color, style: `background-color: ${background}` } : {}; },
};
export function tableExtensions(editable: boolean) {
  return [Table.configure({ resizable: editable, renderWrapper: true }), TableRow,
    TableCell.extend({ addAttributes() { return { ...this.parent?.(), background: backgroundAttribute }; } }),
    TableHeader.extend({ addAttributes() { return { ...this.parent?.(), background: backgroundAttribute }; } }),
  ];
}
