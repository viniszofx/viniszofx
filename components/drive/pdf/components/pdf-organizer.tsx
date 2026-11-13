import { type ChangeEvent, type DragEvent, type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import {
  RiAnticlockwiseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiClockwiseLine,
  RiDeleteBinLine,
  RiFileAddLine,
  RiFileDownloadLine,
  RiPagesLine,
} from "@remixicon/react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { saveBlob } from "../compat";
import { openPdf } from "../pdf-engine";
import { buildPdf, type Entry, normalize, type Source } from "../pdf-pages";

function PageImage({ source, entry }: { source?: Source; entry: Entry }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvas.current;
    if (!target || !source) return;
    let task: { cancel: () => void } | undefined;
    // Só desenha quando a miniatura entra na tela, para documentos longos abrirem rápido.
    const observer = new IntersectionObserver(async ([visible]) => {
      if (!visible?.isIntersecting) return;
      observer.disconnect();
      const proxy = await source.pdf.getPage(entry.index + 1);
      const rotation = normalize(proxy.rotate + entry.rotation);
      const base = proxy.getViewport({ scale: 1, rotation });
      const viewport = proxy.getViewport({ scale: Math.min(150 / base.width, 190 / base.height) * 2, rotation });
      target.width = viewport.width;
      target.height = viewport.height;
      const render = proxy.render({ canvas: target, viewport });
      task = render;
      await render.promise.catch(() => {});
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      task?.cancel();
    };
  }, [source, entry.index, entry.rotation]);
  if (entry.source < 0) {
    const [width, height] = entry.size ?? [595, 842];
    const [shownWidth, shownHeight] = normalize(entry.rotation) % 180 ? [height, width] : [width, height];
    return <div className="max-h-full max-w-full bg-white shadow-sm" style={{ aspectRatio: `${shownWidth} / ${shownHeight}`, ...(shownHeight > shownWidth ? { height: "100%" } : { width: "100%" }) }} />;
  }
  return <canvas ref={canvas} width={150} height={190} className="max-h-full max-w-full bg-white object-contain shadow-sm" />;
}

// Organizar páginas, no estilo do Acrobat: reordenar arrastando, girar, excluir, inserir em branco ou de outro PDF e extrair.
export function PdfOrganizer({ bytes, name, onCancel, onApply }: { bytes: Uint8Array; name: string; onCancel: () => void; onApply: (result: Uint8Array) => void }) {
  const picker = useRef<HTMLInputElement>(null);
  const anchor = useRef<string | null>(null);
  const opened = useRef<PDFDocumentProxy[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [pages, setPages] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [drop, setDrop] = useState<{ key: string; after: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const documents = opened.current;
    const task = openPdf(bytes.slice());
    task.promise.then((pdf) => {
      if (!active) return;
      documents.push(pdf);
      setSources([{ pdf, bytes }]);
      setPages(Array.from({ length: pdf.numPages }, (_, index) => ({ key: crypto.randomUUID(), source: 0, index, rotation: 0 })));
    }).catch(() => { if (active) setError("Não foi possível abrir as páginas."); });
    return () => {
      active = false;
      void task.destroy();
      for (const pdf of documents.splice(0)) void pdf.destroy();
    };
  }, [bytes]);

  const selectedSet = new Set(selected);
  const insertAt = selected.length ? Math.max(...pages.flatMap((entry, position) => selectedSet.has(entry.key) ? [position] : [])) + 1 : pages.length;

  function choose(event: MouseEvent, key: string) {
    if (event.shiftKey && anchor.current) {
      const from = pages.findIndex((entry) => entry.key === anchor.current);
      const to = pages.findIndex((entry) => entry.key === key);
      setSelected(pages.slice(Math.min(from, to), Math.max(from, to) + 1).map((entry) => entry.key));
      return;
    }
    anchor.current = key;
    if (event.ctrlKey || event.metaKey) setSelected((current) => current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]);
    else setSelected([key]);
  }

  function rotate(delta: number) {
    setPages((current) => current.map((entry) => selectedSet.has(entry.key) ? { ...entry, rotation: entry.rotation + delta } : entry));
  }

  function remove() {
    if (!selected.length) return;
    if (selected.length >= pages.length) { setError("O PDF precisa ficar com ao menos uma página."); return; }
    setPages((current) => current.filter((entry) => !selectedSet.has(entry.key)));
    setSelected([]);
  }

  async function sizeOf(entry: Entry): Promise<[number, number]> {
    if (entry.source < 0) return normalize(entry.rotation) % 180 ? [entry.size![1], entry.size![0]] : entry.size!;
    const proxy = await sources[entry.source].pdf.getPage(entry.index + 1);
    const [left, bottom, right, top] = proxy.view;
    const turned = normalize(proxy.rotate + entry.rotation) % 180 !== 0;
    return turned ? [top - bottom, right - left] : [right - left, top - bottom];
  }

  async function addBlank() {
    const neighbor = pages[insertAt - 1] ?? pages[0];
    const size = neighbor ? await sizeOf(neighbor) : [595, 842] as [number, number];
    const entry: Entry = { key: crypto.randomUUID(), source: -1, index: 0, rotation: 0, size };
    setPages((current) => [...current.slice(0, insertAt), entry, ...current.slice(insertAt)]);
    setSelected([entry.key]);
    anchor.current = entry.key;
  }

  async function addFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await openPdf(data.slice()).promise;
      opened.current.push(pdf);
      const source = sources.length;
      const added = Array.from({ length: pdf.numPages }, (_, index) => ({ key: crypto.randomUUID(), source, index, rotation: 0 }));
      setSources((current) => [...current, { pdf, bytes: data }]);
      setPages((current) => [...current.slice(0, insertAt), ...added, ...current.slice(insertAt)]);
      setSelected(added.map((entry) => entry.key));
      anchor.current = added[0]?.key ?? null;
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "PasswordException" ? "Esse PDF é protegido por senha." : "Não foi possível abrir esse arquivo como PDF.");
    }
  }

  // Leva as páginas selecionadas para antes da página `before` (ou para o fim), mantendo a ordem entre elas.
  function moveSelected(before: string | null) {
    setPages((current) => {
      const moving = current.filter((entry) => selectedSet.has(entry.key));
      const rest = current.filter((entry) => !selectedSet.has(entry.key));
      const position = before ? rest.findIndex((entry) => entry.key === before) : rest.length;
      return position < 0 ? current : [...rest.slice(0, position), ...moving, ...rest.slice(position)];
    });
  }

  function step(direction: -1 | 1) {
    if (!selected.length) return;
    const positions = pages.flatMap((entry, position) => selectedSet.has(entry.key) ? [position] : []);
    if (direction < 0) {
      const previous = pages.slice(0, positions[0]).findLast((entry) => !selectedSet.has(entry.key));
      if (previous) moveSelected(previous.key);
    } else {
      const after = pages.slice(positions.at(-1)! + 1).filter((entry) => !selectedSet.has(entry.key));
      if (after.length) moveSelected(after[1]?.key ?? null);
    }
  }

  function dragStart(event: DragEvent, key: string) {
    if (!selectedSet.has(key)) { setSelected([key]); anchor.current = key; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function dragOver(event: DragEvent, key: string) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientX > rect.left + rect.width / 2;
    if (drop?.key !== key || drop.after !== after) setDrop({ key, after });
  }

  function dropOn(event: DragEvent) {
    event.preventDefault();
    if (!drop) return;
    const position = pages.findIndex((entry) => entry.key === drop.key);
    // Soltar depois de uma página é o mesmo que antes da próxima não selecionada (ou no fim).
    if (drop.after) moveSelected(pages.slice(position + 1).find((entry) => !selectedSet.has(entry.key))?.key ?? null);
    else if (!selectedSet.has(drop.key)) moveSelected(drop.key);
    setDrop(null);
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "EncryptedPDFError" ? "Um dos PDFs é protegido contra edição e não pode ser usado aqui." : "Não foi possível montar o PDF.");
    } finally {
      setBusy(false);
    }
  }

  function extract() {
    const chosen = pages.filter((entry) => selectedSet.has(entry.key));
    if (!chosen.length) return;
    void run(async () => {
      const result = await buildPdf(sources, chosen);
      saveBlob(new Blob([new Uint8Array(result)], { type: "application/pdf" }), `${name.replace(/\.pdf$/i, "")} (páginas).pdf`);
    });
  }

  function apply() {
    void run(async () => onApply(await buildPdf(sources, pages)));
  }

  function shortcuts(event: KeyboardEvent) {
    if ((event.key === "Delete" || event.key === "Backspace") && selected.length) { event.preventDefault(); remove(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); setSelected(pages.map((entry) => entry.key)); }
    else if (event.key === "Escape") setSelected([]);
  }

  const none = !selected.length || busy;
  return (
    <div tabIndex={-1} onKeyDown={shortcuts} className="flex min-h-0 flex-1 flex-col outline-none">
      <div role="toolbar" aria-label="Organizar páginas" className="flex flex-wrap items-center gap-1 border-b p-1.5">
        <span className="flex items-center gap-1.5 px-2 text-sm font-medium"><RiPagesLine className="size-4" />Organizar páginas</span>
        <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
        <Button type="button" variant="ghost" size="sm" title="Girar para a esquerda" disabled={none} onClick={() => rotate(-90)}><RiAnticlockwiseLine className="size-4" /><span className="hidden lg:inline">Girar</span></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Girar para a direita" title="Girar para a direita" disabled={none} onClick={() => rotate(90)}><RiClockwiseLine /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover para trás" title="Mover para trás" disabled={none} onClick={() => step(-1)}><RiArrowLeftSLine /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover para frente" title="Mover para frente" disabled={none} onClick={() => step(1)}><RiArrowRightSLine /></Button>
        <Button type="button" variant="ghost" size="sm" title="Excluir páginas (Del)" disabled={none} onClick={remove}><RiDeleteBinLine className="size-4" /><span className="hidden lg:inline">Excluir</span></Button>
        <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
        <Button type="button" variant="ghost" size="sm" title="Inserir página em branco" disabled={busy || !sources.length} onClick={() => void addBlank()}><RiFileAddLine className="size-4" /><span className="hidden lg:inline">Página em branco</span></Button>
        <Button type="button" variant="ghost" size="sm" title="Inserir páginas de outro PDF" disabled={busy || !sources.length} onClick={() => picker.current?.click()}><RiFileAddLine className="size-4" /><span className="hidden lg:inline">Inserir PDF</span></Button>
        <input ref={picker} type="file" hidden accept="application/pdf,.pdf" onChange={(event) => void addFile(event)} />
        <Button type="button" variant="ghost" size="sm" title="Baixar as páginas selecionadas como outro PDF" disabled={none} onClick={extract}><RiFileDownloadLine className="size-4" /><span className="hidden lg:inline">Extrair</span></Button>
        <span className="ml-auto flex items-center gap-1">
          {selected.length > 0 && <span className="px-1 text-xs text-muted-foreground">{selected.length} de {pages.length}</span>}
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onCancel}>Cancelar</Button>
          <Button type="button" size="sm" disabled={busy || !pages.length} onClick={apply}><RiCheckLine className="size-4" />{busy ? "Montando…" : "Aplicar"}</Button>
        </span>
      </div>
      <ErrorToast message={error} />
      <div className="min-h-0 flex-1 overflow-auto bg-muted/60 p-4" onClick={(event) => { if (event.target === event.currentTarget) setSelected([]); }} onDragLeave={(event) => { if (event.target === event.currentTarget) setDrop(null); }}>
        <ol aria-label="Páginas" className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4" onDrop={dropOn} onDragEnd={() => setDrop(null)}>
          {pages.map((entry, position) => {
            const active = selectedSet.has(entry.key);
            return (
              <li key={entry.key} draggable onDragStart={(event) => dragStart(event, entry.key)} onDragOver={(event) => dragOver(event, entry.key)}
                aria-selected={active} onClick={(event) => choose(event, entry.key)}
                className={`relative grid cursor-grab select-none justify-items-center gap-1.5 rounded-lg p-2 text-xs active:cursor-grabbing ${active ? "bg-primary/15 ring-2 ring-primary" : "hover:bg-muted"}`}>
                {drop?.key === entry.key && <span className={`absolute inset-y-2 w-1 rounded bg-primary ${drop.after ? "-right-2.5" : "-left-2.5"}`} />}
                <div className="grid h-48 w-full place-items-center"><PageImage source={entry.source >= 0 ? sources[entry.source] : undefined} entry={entry} /></div>
                <span className="tabular-nums">{position + 1}{entry.source < 0 ? " · em branco" : entry.source > 0 ? " · inserida" : ""}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
        Arraste as páginas para mudar a ordem. Clique para selecionar; Ctrl ou Shift para várias. Páginas novas entram depois da seleção. Nada muda no arquivo até Aplicar e Salvar.
      </p>
    </div>
  );
}
