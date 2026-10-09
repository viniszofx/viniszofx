// Print an isolated document so the app navigation and editor controls never enter the PDF.
export async function printNote(title: string, editor: HTMLElement, cover?: string) {
  document.querySelector("iframe[data-note-print]")?.remove();
  const frame = document.createElement("iframe");
  frame.dataset.notePrint = "";
  frame.title = "Exportar anotação em PDF";
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;left:0;bottom:0";
  document.body.append(frame);
  const doc = frame.contentDocument, view = frame.contentWindow;
  if (!doc || !view) { frame.remove(); return; }
  doc.title = title;
  const style = doc.createElement("style");
  style.textContent = `
    @page { size: A4 portrait; margin: 25.4mm; }
    :root { --muted:#f3f3f3; --primary:#a33b00; --border:#ccc; }
    * { box-sizing:border-box; } body { margin:0; color:#111; background:white; font:11pt/1.5 Arial,sans-serif; overflow-wrap:anywhere; }
    h1 { font-size:22pt; } h2 { font-size:16pt; } h3 { font-size:13pt; } h1,h2,h3 { break-after:avoid; }
    p { orphans:3; widows:3; } img { max-width:100%; max-height:180mm; object-fit:contain; break-inside:avoid; }
    .cover { width:100%; max-height:50mm; object-fit:cover; } a { color:#174d8c; } blockquote { margin-left:0; border-left:3px solid #ccc; padding-left:12pt; }
    pre { white-space:pre-wrap; background:#f3f3f3; padding:10pt; } code { font-family:monospace; }
    table { width:100%!important; min-width:0!important; table-layout:fixed; border-collapse:collapse; font-size:10pt; }
    td,th { border:1px solid #ccc; padding:6pt; overflow-wrap:anywhere; } th { background:#f3f3f3; } tr { break-inside:avoid; } thead { display:table-header-group; }
    .tableWrapper { overflow:visible!important; } [data-note-columns] { display:flex; gap:16pt; } [data-note-column] { flex:1; min-width:0; }
    ul[data-type=taskList] { list-style:none; padding-left:0; } li[data-type=taskItem] { display:flex; gap:6pt; } li[data-type=taskItem]>div { flex:1; min-width:0; }
    [data-note-embed] { border:1px solid #ccc; padding:8pt; } button,video,audio { display:none; }
  `;
  doc.head.append(style);
  const heading = doc.createElement("h1"); heading.textContent = title;
  if (cover) { const image = doc.createElement("img"); image.src = cover; image.alt = "Capa"; image.className = "cover"; doc.body.append(image); }
  const content = doc.importNode(editor, true);
  content.removeAttribute("contenteditable"); content.removeAttribute("role");
  content.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  content.querySelectorAll("button,[data-drag-handle],.column-resize-handle").forEach((node) => node.remove());
  content.querySelectorAll("iframe").forEach((iframe) => {
    const link = doc.createElement("a"); link.href = iframe.src; link.textContent = iframe.title || iframe.src; iframe.replaceWith(link);
  });
  content.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => { const check = doc.createElement("span"); check.textContent = input.checked ? "☑" : "☐"; input.replaceWith(check); });
  content.querySelectorAll<HTMLElement>("table,col,td,th").forEach((node) => { node.style.removeProperty("width"); node.style.removeProperty("min-width"); });
  doc.body.append(heading, content);
  await Promise.race([Promise.all(Array.from(doc.images, (image) => image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3000))]);
  await doc.fonts.ready;
  view.addEventListener("afterprint", () => frame.remove(), { once: true });
  view.focus(); view.print();
  setTimeout(() => frame.remove(), 90000);
}
