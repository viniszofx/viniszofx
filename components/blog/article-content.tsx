import type { ReactNode } from "react";
import Image from "next/image";
import { attachmentId } from "@/lib/notes/types";
import { blogAssetUrl } from "@/lib/blog/types";
import type { AdSlotData } from "@/lib/blog/ads";

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: Node[] };
const attr = (node: Node, key: string) => typeof node.attrs?.[key] === "string" ? node.attrs[key] as string : "";
function safeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { const url = new URL(value); return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
function assetUrl(value: string) { const id = attachmentId(value); return id ? blogAssetUrl(id) : safeUrl(value); }

function render(node: Node, key: number | string): ReactNode {
  const children = node.content?.map((child, index) => render(child, index));
  if (node.type === "text") {
    let value: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") value = <strong key={key}>{value}</strong>;
      else if (mark.type === "italic") value = <em key={key}>{value}</em>;
      else if (mark.type === "strike") value = <s key={key}>{value}</s>;
      else if (mark.type === "code") value = <code key={key} className="bg-muted px-1">{value}</code>;
      else if (mark.type === "underline") value = <u key={key}>{value}</u>;
      else if (mark.type === "subscript") value = <sub key={key}>{value}</sub>;
      else if (mark.type === "superscript") value = <sup key={key}>{value}</sup>;
      else if (mark.type === "highlight") value = <mark key={key}>{value}</mark>;
      else if (mark.type === "link") { const href = safeUrl(String(mark.attrs?.href ?? "")); if (href) value = <a key={key} href={href} rel="noopener noreferrer" className="text-primary underline">{value}</a>; }
    }
    return value;
  }
  switch (node.type) {
    case "paragraph": return <p key={key} className="my-5 leading-8">{children}</p>;
    case "heading": { const level = Math.min(6, Math.max(2, Number(node.attrs?.level) || 2)); const Tag = `h${level}` as "h2"; return <Tag key={key} className="mb-4 mt-10 font-heading text-2xl font-semibold">{children}</Tag>; }
    case "bulletList": return <ul key={key} className="my-5 list-disc space-y-2 pl-6">{children}</ul>;
    case "orderedList": return <ol key={key} className="my-5 list-decimal space-y-2 pl-6">{children}</ol>;
    case "taskList": return <ul key={key} className="my-5 space-y-2 pl-2">{children}</ul>;
    case "listItem": return <li key={key}>{children}</li>;
    case "taskItem": return <li key={key} className="flex gap-2"><input type="checkbox" checked={node.attrs?.checked === true} readOnly aria-label="Tarefa" /><div>{children}</div></li>;
    case "blockquote": return <blockquote key={key} className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground">{children}</blockquote>;
    case "codeBlock": return <pre key={key} className="my-6 overflow-x-auto bg-muted p-4 text-sm"><code>{node.content?.map((child) => child.text ?? "").join("")}</code></pre>;
    case "hardBreak": return <br key={key} />;
    case "horizontalRule": return <hr key={key} className="my-10" />;
    case "table": return <div key={key} className="my-6 overflow-x-auto"><table className="w-full border-collapse text-sm"><tbody>{children}</tbody></table></div>;
    case "tableRow": return <tr key={key}>{children}</tr>;
    case "tableHeader": return <th key={key} className="border bg-muted p-2 text-left">{children}</th>;
    case "tableCell": return <td key={key} className="border p-2">{children}</td>;
    case "image": { const src = assetUrl(attr(node, "src")); return src ? <figure key={key} className="my-8"><Image src={src} alt={attr(node, "alt")} width={1200} height={800} unoptimized className="h-auto max-w-full" /></figure> : null; }
    case "noteFile": { const href = assetUrl(attr(node, "href")); return href ? <p key={key} className="my-5"><a href={href} className="text-primary underline">{attr(node, "name") || "Baixar arquivo"}</a></p> : null; }
    case "noteEmbed": { const href = safeUrl(attr(node, "src")); return href && /^https?:/.test(href) ? <div key={key} className="my-6 overflow-hidden border"><iframe src={href} title="Conteúdo incorporado" loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" className="h-80 w-full border-0" /><a href={href} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-xs text-primary underline">Abrir incorporação ↗</a></div> : null; }
    case "noteColumns": return <div key={key} className="my-6 grid gap-6 sm:grid-cols-2">{children}</div>;
    case "noteColumn": return <div key={key} className="min-w-0">{children}</div>;
    default: return children ? <div key={key}>{children}</div> : null;
  }
}

export function ArticleContent({ content, document, adMiddle }: { content: string; document: Record<string, unknown> | null; adMiddle: AdSlotData | null }) {
  const nodes = Array.isArray(document?.content) ? document.content as Node[] : null;
  const blocks = nodes?.length ? nodes : content.split(/\n\s*\n/).filter(Boolean).map((paragraph) => ({ type: "paragraph", content: [{ type: "text", text: paragraph }] }));
  const midpoint = Math.max(1, Math.ceil(blocks.length / 2));
  return <div className="min-w-0 text-base text-foreground">
    {blocks.slice(0, midpoint).map((node, index) => render(node, index))}
    {adMiddle && blocks.length >= 4 && <AdSlot ad={adMiddle} />}
    {blocks.slice(midpoint).map((node, index) => render(node, midpoint + index))}
  </div>;
}

export function AdSlot({ ad }: { ad: AdSlotData }) {
  return <aside aria-label="Publicidade" data-ad-position={ad.position} className="my-9 border bg-card">
    <p className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Publicidade{ad.advertiser ? ` · ${ad.advertiser}` : ""}</p>
    <a href={ad.targetUrl} target="_blank" rel="sponsored noopener noreferrer" className="group flex flex-col gap-4 p-4 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:p-5">
      {ad.imageUrl && <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted/20 sm:w-40"><Image src={ad.imageUrl} alt="" fill unoptimized sizes="160px" className="object-contain" /></div>}
      <span className="min-w-0 flex-1"><strong className="block font-heading text-lg font-semibold">{ad.headline}</strong>{ad.description && <span className="mt-2 block text-sm leading-6 text-muted-foreground">{ad.description}</span>}<span className="mt-3 block text-xs font-medium text-primary">Saiba mais ↗</span></span>
    </a>
  </aside>;
}
