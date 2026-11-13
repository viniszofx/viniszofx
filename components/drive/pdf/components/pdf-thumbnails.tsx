import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

function PdfThumbnail({ pdf, page, rotation, current, onSelect }: { pdf: PDFDocumentProxy; page: number; rotation: number; current: boolean; onSelect: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    let task: { cancel: () => void } | undefined;
    let active = true;
    // Só desenha a miniatura quando ela entra na tela, para documentos longos não travarem a abertura.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      void (async () => {
        try {
          // O PDF pode ser destruído enquanto getPage aguarda resposta do worker (ex.: ao
          // reorganizar páginas ou trocar de arquivo). Nunca deixe essa corrida virar erro React.
          const proxy = await pdf.getPage(page);
          if (!active) return;
          const base = proxy.getViewport({ scale: 1, rotation: proxy.rotate + rotation });
          const viewport = proxy.getViewport({ scale: 140 / base.width, rotation: proxy.rotate + rotation });
          target.width = viewport.width;
          target.height = viewport.height;
          const render = proxy.render({ canvas: target, viewport });
          task = render;
          await render.promise.catch(() => {});
        } catch {
          // Documento fechado antes da miniatura terminar: a próxima abertura renderiza de novo.
        }
      })();
    });
    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
      task?.cancel();
    };
  }, [pdf, page, rotation]);
  return (
    <button type="button" aria-label={`Página ${page}`} aria-current={current ? "page" : undefined} onClick={onSelect} className="grid justify-items-center gap-1 rounded-lg p-1.5 text-xs hover:bg-muted aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium">
      <canvas ref={canvas} width={140} height={190} className="max-w-full border bg-white shadow-sm" />
      {page}
    </button>
  );
}

export function PdfThumbnails({ pdf, rotation, page, onSelect }: { pdf: PDFDocumentProxy; rotation: number; page: number; onSelect: (page: number) => void }) {
  return (
    <nav aria-label="Páginas" className="hidden w-44 shrink-0 overflow-y-auto border-r bg-muted/40 p-2 md:grid md:content-start md:gap-1">
      {Array.from({ length: pdf.numPages }, (_, index) => (
        <PdfThumbnail key={index} pdf={pdf} page={index + 1} rotation={rotation} current={page === index + 1} onSelect={() => onSelect(index + 1)} />
      ))}
    </nav>
  );
}
