"use client";

const css = `
@page { size: A4 portrait; margin: 14mm; }
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; background: #fff; font: 10pt/1.4 Arial, Helvetica, sans-serif; }
h1 { font-size: 15pt; margin: 0 0 4mm; }
h2 { font-size: 10.5pt; margin: 5mm 0 2mm; padding-bottom: 1mm; border-bottom: 1px solid #ccc; text-transform: uppercase; letter-spacing: .03em; }
section { break-inside: avoid; }
dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2mm 5mm; margin: 0; }
dl > div { min-width: 0; }
dt { color: #555; font-size: 8pt; }
dd { margin: 0; overflow-wrap: anywhere; }
.wide { grid-column: 1 / -1; }
.text { white-space: pre-wrap; margin: 0; }
.muted { color: #555; font-size: 8pt; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { border: 1px solid #bbb; padding: 3pt 4pt; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
th { background: #f2f2f2; font-size: 8.5pt; }
thead { display: table-header-group; }
ol, ul { margin: 1mm 0; padding-left: 5mm; }
.provider { display: flex; justify-content: space-between; gap: 6mm; border-bottom: 1px solid #999; padding-bottom: 3mm; margin-bottom: 4mm; font-size: 8.5pt; }
.provider > div { display: grid; gap: .5mm; }
.provider strong { font-size: 11pt; }
.heading { display: flex; justify-content: space-between; align-items: baseline; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; margin-top: 18mm; break-inside: avoid; }
.signatures > div { display: grid; gap: 1mm; text-align: center; }
.signatures .line { border-top: 1px solid #111; margin-bottom: 1mm; }
.day { break-inside: avoid; }
.day li { display: grid; grid-template-columns: 26mm 1fr; gap: 3mm; margin-bottom: 2mm; list-style: none; }
.day ul { padding: 0; }
.tag { display: inline-block; border: 1px solid #999; padding: 0 1.5mm; font-size: 7.5pt; margin-left: 1mm; }
`;

/** Imprime (ou salva em PDF) um bloco HTML num iframe isolado da página. */
export function printHtml(title: string, html: string) {
  document.querySelector("iframe[data-print-frame]")?.remove();
  const frame = document.createElement("iframe");
  frame.dataset.printFrame = "";
  frame.title = title;
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0";
  document.body.append(frame);
  const doc = frame.contentDocument; const view = frame.contentWindow;
  if (!doc || !view) { frame.remove(); return; }
  doc.open();
  doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title></title><style>${css}</style></head><body>${html}</body></html>`);
  doc.close();
  doc.title = title;
  const cleanup = () => setTimeout(() => frame.remove(), 1000);
  view.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(() => { view.focus(); view.print(); }, 100);
}

/** Imprime o conteúdo de um elemento renderizado (escondido) pelo React. */
export function printElement(title: string, element: HTMLElement | null) {
  if (element) printHtml(title, element.innerHTML);
}

export function dateLabel(value?: string, empty = "") {
  if (!value) return empty;
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}
