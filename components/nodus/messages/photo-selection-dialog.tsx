"use client";
// Copiado do Nodus.
import { useRef, useState } from "react";
import { RiAddLine, RiCloseLine, RiImageLine, RiSendPlane2Fill } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type SelectedPhoto = { id: string; file: File; url: string };

export function PhotoSelectionDialog({ photos, caption, error, sending, onCaptionChange, onAdd, onRemove, onCancel, onSend }: {
  photos: SelectedPhoto[];
  caption: string;
  error: string;
  sending: boolean;
  onCaptionChange: (value: string) => void;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
  onSend: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = photos.find((photo) => photo.id === activeId) ?? photos[0];
  const hasPhotos = photos.length > 0;

  return <Dialog open onOpenChange={(open) => { if (!open && !sending) onCancel(); }}>
    <DialogContent showCloseButton={false} className={`flex max-w-none flex-col gap-4 overflow-hidden p-4 sm:max-w-none sm:p-5 ${hasPhotos
      ? "h-[min(90dvh,48rem)] max-h-[90dvh] w-[min(95vw,44rem)] max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:p-3"
      : "h-auto w-[min(92vw,28rem)] max-md:top-auto max-md:bottom-0 max-md:w-full max-md:translate-y-0 max-md:rounded-b-none max-md:p-5 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]"}`}>
      <div className="flex shrink-0 items-center gap-3">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancelar seleção" disabled={sending} onClick={onCancel}><RiCloseLine /></Button>
        <DialogTitle className="min-w-0 flex-1 text-base">{hasPhotos ? "Revisar fotos" : "Selecionar fotos"}</DialogTitle>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{photos.length} / 25</span>
      </div>
      {hasPhotos ? <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/90">
        <img src={active.url} alt={`Prévia de ${active.file.name}`} className="max-h-full max-w-full object-contain" />
      </div> : <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><RiImageLine className="size-6" /></span>
        <div><p className="font-semibold">Escolha fotos da galeria</p><p className="mt-1 text-sm text-muted-foreground">Revise e adicione até 25 fotos antes de enviar.</p></div>
        <Button type="button" className="mt-1 w-full" onClick={() => input.current?.click()}><RiAddLine />Escolher fotos</Button>
      </div>}
      {hasPhotos && <div className="flex shrink-0 gap-2 overflow-x-auto py-1" aria-label="Fotos escolhidas">
        {photos.map((photo, index) => <div key={photo.id} className="relative shrink-0">
          <button type="button" aria-label={`Ver foto ${index + 1}`} aria-pressed={active?.id === photo.id} onClick={() => setActiveId(photo.id)}
            className={`size-16 overflow-hidden rounded-lg border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring ${active?.id === photo.id ? "border-primary" : "border-transparent"}`}>
            <img src={photo.url} alt="" className="size-full object-cover" />
          </button>
          <button type="button" aria-label={`Remover foto ${index + 1}`} disabled={sending} onClick={() => onRemove(photo.id)}
            className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-background text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><RiCloseLine className="size-3.5" /></button>
        </div>)}
        {photos.length < 25 && <Button type="button" variant="outline" size="icon" className="size-16 shrink-0 rounded-lg" aria-label="Adicionar mais fotos" disabled={sending} onClick={() => input.current?.click()}><RiAddLine /></Button>}
      </div>}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => { const files = [...(event.target.files ?? [])]; event.target.value = ""; onAdd(files); }} />
      {hasPhotos && <textarea value={caption} maxLength={4000} rows={2} disabled={sending} placeholder="Adicionar legenda (opcional)" aria-label="Legenda das fotos" onChange={(event) => onCaptionChange(event.target.value)} className="max-h-24 min-h-14 resize-none rounded-xl border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {hasPhotos && <div className="flex items-center justify-between gap-3 max-md:pb-[env(safe-area-inset-bottom)]">
        <span className="text-xs text-muted-foreground">A legenda acompanha a primeira foto.</span>
        <Button type="button" disabled={sending} onClick={onSend}><RiSendPlane2Fill />{sending ? "Preparando…" : `Enviar ${photos.length} ${photos.length === 1 ? "foto" : "fotos"}`}</Button>
      </div>}
    </DialogContent>
  </Dialog>;
}
