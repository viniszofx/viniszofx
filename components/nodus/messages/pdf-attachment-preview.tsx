"use client";
// Copiado do Nodus.
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { RiArrowLeftSLine, RiArrowRightSLine, RiDownloadLine, RiFilePdf2Line, RiSubtractLine, RiAddLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function PdfPage({ document, number, width, maxHeight, zoom = 1 }: {
  document: PDFDocumentProxy; number: number; width: number; maxHeight?: number; zoom?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    void document.getPage(number).then((page) => {
      if (cancelled || !canvas.current) return;
      const original = page.getViewport({ scale: 1 });
      // Miniatura cabe no card; leitura mantém uma largura mínima e permite rolar a página.
      const scale = (maxHeight
        ? width / original.width
        : Math.max(1.25, width / original.width)) * zoom;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale * ratio });
      const element = canvas.current;
      const context = element.getContext("2d");
      if (!context) return;
      element.width = Math.ceil(viewport.width);
      element.height = Math.ceil(viewport.height);
      element.style.width = `${Math.round(original.width * scale)}px`;
      element.style.height = `${Math.round(original.height * scale)}px`;
      renderTask = page.render({ canvas: element, canvasContext: context, viewport });
      void renderTask.promise.catch((error: unknown) => {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) console.error(error);
      });
    });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [document, number, width, maxHeight, zoom]);
  return <canvas ref={canvas} aria-label={`Página ${number} do PDF`} className="block shrink-0 bg-white shadow-sm" />;
}

// noDownload: quem enviou impediu baixar; o PDF continua visível na conversa.
export function PdfAttachmentPreview({ url, name, size, noDownload = false }: { url: string; name: string; size?: number | null; noDownload?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const viewer = useRef<HTMLDivElement>(null);

  useEffect(() => { viewer.current?.scrollTo({ top: 0, left: 0 }); }, [page]);

  useEffect(() => {
    if (!root.current) return;
    if (!('IntersectionObserver' in window)) { const timer = setTimeout(() => setVisible(true), 0); return () => clearTimeout(timer); }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "240px" });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let disposed = false;
    let task: ReturnType<typeof import("@/components/drive/pdf/pdf-engine")["openPdf"]> | undefined;
    void (async () => {
      try {
        const response = await fetch(url, { credentials: "include", signal: controller.signal });
        if (!response.ok) throw new Error("Falha ao carregar PDF.");
        const { openPdf } = await import("@/components/drive/pdf/pdf-engine");
        if (disposed) return;
        task = openPdf(new Uint8Array(await response.arrayBuffer()));
        const pdf = await task.promise;
        if (!disposed) setDocument(pdf);
      } catch (cause) {
        if (!disposed && !(cause instanceof Error && cause.name === "AbortError")) setError("Prévia indisponível.");
      }
    })();
    return () => { disposed = true; controller.abort(); void task?.destroy(); };
  }, [url, visible]);

  return <div ref={root} className="mb-1 w-64 max-w-full overflow-hidden rounded-xl border border-current/20 bg-background/10">
    <button type="button" className="flex w-full flex-col items-center overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen(true)} aria-label={`Visualizar ${name}`}>
      <div className="grid h-60 w-full items-start justify-items-center overflow-hidden bg-white/90">
        {document ? <PdfPage document={document} number={1} width={256} maxHeight={240} />
          : <span className="flex flex-col items-center gap-2 text-xs opacity-70"><RiFilePdf2Line className="size-8" />{error || "Carregando prévia…"}</span>}
      </div>
      <span className="flex w-full items-center gap-2 px-3 py-2"><RiFilePdf2Line className="size-5 shrink-0" /><span className="min-w-0"><span className="block truncate font-medium">{name}</span><span className="block text-xs opacity-75">{size ? `${(size / 1024 / 1024).toFixed(2)} MB` : "PDF"}{document ? ` · ${document.numPages} pág.` : ""} · Abrir para ler</span></span></span>
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[min(94dvh,70rem)] max-h-[94dvh] w-[min(98vw,76rem)] max-w-none flex-col gap-3 overflow-hidden p-3 sm:max-w-none sm:p-4">
        <DialogTitle className="truncate pr-10 text-base">{name}</DialogTitle>
        <div ref={viewer} className="min-h-0 flex-1 overflow-auto rounded-lg bg-muted/40 p-3">
          {document ? <div className="flex min-h-full w-max min-w-full justify-center"><PdfPage document={document} number={page} width={Math.min(window.innerWidth - 80, 960)} zoom={zoom} /></div>
            : <p className="text-sm text-muted-foreground">{error || "Carregando PDF…"}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!noDownload && <a href={url} className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted"><RiDownloadLine className="size-4" />Baixar</a>}
          {document && <div className="flex items-center gap-2"><Button type="button" size="icon-sm" variant="outline" aria-label="Reduzir zoom" disabled={zoom <= 0.75} onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}><RiSubtractLine /></Button><span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span><Button type="button" size="icon-sm" variant="outline" aria-label="Aumentar zoom" disabled={zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + 0.25))}><RiAddLine /></Button></div>}
          {document && <div className="flex items-center gap-2"><Button type="button" size="icon-sm" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><RiArrowLeftSLine /></Button><span className="text-xs">{page} de {document.numPages}</span><Button type="button" size="icon-sm" variant="outline" aria-label="Próxima página" disabled={page >= document.numPages} onClick={() => setPage((value) => value + 1)}><RiArrowRightSLine /></Button></div>}
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
