"use client";
// Bibliotecas do draw.io (ids do parâmetro "libs"), portadas do Nodus. O draw.io embutido não lembra a
// escolha sozinho (o armazenamento dele fica isolado no iframe), então guardamos e reaplicamos ao abrir.
export const nativeLibraries: { group: string; items: [string, string][] }[] = [
  { group: "Essenciais", items: [["general", "Geral"], ["basic", "Básico"], ["arrows2", "Setas"], ["flowchart", "Fluxograma"]] },
  { group: "Instalações", items: [["network", "Rede"], ["rack", "Rack"], ["cisco19", "Cisco"], ["floorplan", "Planta baixa"], ["electrical", "Elétrica"], ["cabinets", "Gabinetes"], ["signs", "Sinalização"]] },
  { group: "Nuvem e software", items: [["aws4", "AWS"], ["azure2", "Azure"], ["gcp2", "Google Cloud"], ["kubernetes", "Kubernetes"], ["c4", "C4"], ["uml", "UML"], ["er", "Entidade-relação"]] },
  { group: "Outros", items: [["mockups", "Mockups de tela"], ["sitemap", "Mapa de site"], ["office", "Office"], ["pid", "P&ID (processos)"]] },
];
export const defaultLibraries = ["general", "basic", "arrows2", "flowchart", "network", "rack", "floorplan", "electrical"];

/** Bibliotecas nativas ligadas e bibliotecas próprias desligadas (as próprias vêm ligadas). */
export type LibraryChoice = { native: string[]; hidden: string[] };
const nativeKey = "viniszofx:drawio-libraries";
const hiddenKey = "viniszofx:drawio-libraries-hidden";

function readList(key: string) {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : null;
  } catch { return null; }
}
export function readLibraryChoice(): LibraryChoice {
  const native = (readList(nativeKey) ?? []).filter(id => nativeLibraries.some(group => group.items.some(([item]) => item === id)));
  return { native: native.length ? native : defaultLibraries, hidden: readList(hiddenKey) ?? [] };
}
export function storeLibraryChoice(choice: LibraryChoice) {
  try { localStorage.setItem(nativeKey, JSON.stringify(choice.native)); localStorage.setItem(hiddenKey, JSON.stringify(choice.hidden)); }
  catch { /* Sem armazenamento local: vale só nesta sessão. */ }
}
export const editorLibraryId = (id: string) => `own-${id}`;

/** Lê o arquivo exportado pelo draw.io (Arquivo › Exportar biblioteca): <mxlibrary>[formas em JSON]</mxlibrary>. */
export function parseLibraryFile(text: string) {
  const root = new DOMParser().parseFromString(text, "application/xml").documentElement;
  if (root.nodeName !== "mxlibrary") throw new Error("O arquivo não é uma biblioteca do draw.io (Arquivo › Exportar biblioteca).");
  let shapes: unknown;
  try { shapes = JSON.parse(root.textContent ?? ""); } catch { throw new Error("A biblioteca está corrompida."); }
  if (!Array.isArray(shapes) || !shapes.length) throw new Error("A biblioteca está vazia.");
  return { content: JSON.stringify(shapes), shapes: shapes.length };
}

/** Resposta ao evento "configure" do draw.io com as bibliotecas próprias ligadas. */
export function drawioConfig(libraries: { id: string; title: string; content: string }[]) {
  const entries = libraries.flatMap(({ id, title, content }) => {
    try { return [{ id: editorLibraryId(id), title: { main: title }, libs: [{ title: { main: title }, data: JSON.parse(content) as unknown[], expand: true }] }]; }
    catch { return []; }
  });
  return entries.length ? { libraries: [{ title: { main: "Minhas bibliotecas" }, entries }] } : {};
}
