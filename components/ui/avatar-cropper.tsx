"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { RiLoader4Line } from "@remixicon/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Button } from "./button";

const VIEW = 256;
const OUTPUT = 512;

/** Recorte quadrado da foto: arrastar posiciona, o controle deslizante aproxima. Entrega um JPEG 512×512. */
export function AvatarCropper({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (blob: Blob) => Promise<void> }) {
  const [source, setSource] = useState<{ url: string; image: HTMLImageElement } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; y: number; start: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const fit = VIEW / Math.min(image.naturalWidth, image.naturalHeight);
      setOffset({ x: (VIEW - image.naturalWidth * fit) / 2, y: (VIEW - image.naturalHeight * fit) / 2 });
      setSource({ url, image });
    };
    image.onerror = () => setError("Não foi possível abrir essa imagem.");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Escala que cobre o quadrado inteiro; o zoom multiplica a partir dela.
  const base = source ? VIEW / Math.min(source.image.naturalWidth, source.image.naturalHeight) : 1;
  const scale = base * zoom;
  const width = (source?.image.naturalWidth ?? 0) * scale;
  const height = (source?.image.naturalHeight ?? 0) * scale;
  const clamp = (next: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(VIEW - width, next.x)),
    y: Math.min(0, Math.max(VIEW - height, next.y)),
  });
  const position = source ? clamp(offset) : { x: 0, y: 0 };

  function down(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, start: position };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setOffset(clamp({ x: drag.current.start.x + event.clientX - drag.current.x, y: drag.current.start.y + event.clientY - drag.current.y }));
  }
  function changeZoom(value: number) {
    if (!source) return;
    // Mantém o centro do recorte no lugar ao aproximar.
    const nextScale = base * value;
    const centerX = (VIEW / 2 - position.x) / scale;
    const centerY = (VIEW / 2 - position.y) / scale;
    const nextWidth = source.image.naturalWidth * nextScale;
    const nextHeight = source.image.naturalHeight * nextScale;
    setZoom(value);
    setOffset({
      x: Math.min(0, Math.max(VIEW - nextWidth, VIEW / 2 - centerX * nextScale)),
      y: Math.min(0, Math.max(VIEW - nextHeight, VIEW / 2 - centerY * nextScale)),
    });
  }

  async function save() {
    if (!source || busy) return;
    setBusy(true); setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT; canvas.height = OUTPUT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Seu navegador não conseguiu recortar a imagem.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, OUTPUT, OUTPUT);
      const ratio = OUTPUT / VIEW;
      context.drawImage(source.image, position.x * ratio, position.y * ratio, width * ratio, height * ratio);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Seu navegador não conseguiu recortar a imagem.");
      await onDone(blob);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar a foto."); }
    finally { setBusy(false); }
  }

  return <Dialog open onOpenChange={open => { if (!open && !busy) onCancel(); }}><DialogContent showCloseButton={!busy} className="sm:max-w-sm">
    <DialogTitle>Recortar foto</DialogTitle>
    <DialogDescription>Arraste para posicionar e use o controle para aproximar.</DialogDescription>
    <div className="mx-auto">
      <div onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        className="relative size-64 cursor-grab touch-none overflow-hidden bg-muted active:cursor-grabbing">
        {source ? <img src={source.url} alt="" draggable={false} className="pointer-events-none absolute left-0 top-0 max-w-none select-none" style={{ width, height, transform: `translate(${position.x}px, ${position.y}px)` }} />
          : !error && <RiLoader4Line className="absolute inset-0 m-auto size-6 animate-spin text-muted-foreground" />}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(0_0_0/0.45)]" aria-hidden="true" />
      </div>
      <label className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">Zoom
        <input type="range" min={1} max={3} step={0.01} value={zoom} disabled={!source} onChange={event => changeZoom(Number(event.target.value))} className="flex-1 accent-primary" />
      </label>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="button" disabled={!source || busy} onClick={() => void save()}>{busy ? <><RiLoader4Line className="animate-spin" />Salvando…</> : "Usar foto"}</Button></div>
  </DialogContent></Dialog>;
}
