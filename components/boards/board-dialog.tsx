"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import type { Editor } from "@tiptap/react";
import { RiCheckLine as Check, RiAttachmentLine as Paperclip } from "@remixicon/react";
import { attachmentId, attachmentUrl } from "@/lib/notes/types";
import { newId, type CoverPosition, type CardAttachment } from "@/lib/boards/store";
import { CardCover, CardAppearance } from "./card-appearance";
import { CardAttachments } from "./card-attachments";
import { CardDescriptionEditor } from "./card-description-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export type BoardFields = { createdAt?: string; updatedAt?: string; title: string; description?: string; descriptionDocument?: Record<string, unknown> | null; color: string; attachments?: CardAttachment[]; coverAttachmentId?: string | null; coverPosition?: CoverPosition };
function formatTimestamp(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
export function BoardDialog({ title, initial, description = false, onSave, onClose }: { title: string; initial: BoardFields; description?: boolean; onSave: (value: BoardFields) => void; onClose: () => void }) {
  const [value, setValue] = useState(initial);
  const [adjustingCoverId, setAdjustingCoverId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const cover = value.attachments?.find(file => file.id === value.coverAttachmentId);
  const input = useRef<HTMLInputElement>(null);
  const editor = useRef<Editor | null>(null);
  const embedUpload = useRef(false);
  const onReady = useCallback((instance: Editor | null) => { editor.current = instance; }, []);
  function attach(files: File[], embed = false) {
    if (files.some(file => !file.size || file.size > 20 * 1024 * 1024)) { setError("Cada arquivo deve ter até 20 MB e não pode estar vazio."); return; }
    setError("");
    const added = files.map(file => ({ id: newId(), name: file.name, type: file.type || "application/octet-stream", size: file.size, blob: file }));
    setValue(previous => ({ ...previous, attachments: [...(previous.attachments ?? []), ...added] }));
    if (embed && added.length) editor.current?.chain().focus().insertContent(added.map(file => file.type.startsWith("image/") ? { type: "image", attrs: { src: attachmentUrl(file.id), alt: file.name } } : { type: "noteFile", attrs: { href: attachmentUrl(file.id), name: file.name } })).run();
  }
  function remove(id: string) {
    const ranges: { from: number; to: number }[] = [];
    editor.current?.state.doc.descendants((node, position) => { if (attachmentId(node.attrs.src ?? node.attrs.href) === id) ranges.push({ from: position, to: position + node.nodeSize }); });
    if (ranges.length && editor.current) { const chain = editor.current.chain();ranges.reverse().forEach(range => chain.deleteRange(range));chain.run(); }
    setValue(previous => ({ ...previous, attachments: previous.attachments?.filter(file => file.id !== id), coverAttachmentId: previous.coverAttachmentId === id ? null : previous.coverAttachmentId }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();if (!value.title.trim()) return;
    const content = description && editor.current ? { description: editor.current.isEmpty ? "" : editor.current.getMarkdown(), descriptionDocument: editor.current.getJSON() } : {};
    onSave({ ...value, ...content, title: value.title.trim() });onClose();
  }
  return <><Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className={`max-h-[90dvh] overflow-y-auto ${description ? "sm:max-w-5xl" : ""}`}><DialogTitle>{title}</DialogTitle>{!description && <DialogDescription>Organize seu trabalho. As alterações ficam salvas neste navegador.</DialogDescription>}
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-5" onPasteCapture={event => {
      if (!description) return;
      const images = Array.from(event.clipboardData.files).filter(file => file.type.startsWith("image/"));
      if (images.length) { event.preventDefault();event.stopPropagation();attach(images, !!(event.target as HTMLElement).closest(".tiptap")); }
    }}>
      {description && cover && <div className="relative">
        <CardCover key={cover.id} file={cover} position={value.coverPosition} expanded onPositionChange={adjustingCoverId === cover.id ? coverPosition => setValue(previous => ({ ...previous, coverPosition })) : undefined} />
        {adjustingCoverId === cover.id && <Button type="button" size="sm" variant="secondary" className="absolute right-3 top-3" onClick={() => setAdjustingCoverId(null)}><Check />Concluir ajuste</Button>}
      </div>}
      <div className={description ? "grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_20rem]" : ""}>
        <div className="min-w-0 space-y-5">
          <label className="block space-y-2 text-sm">Título<Input autoFocus required maxLength={200} aria-label="Título" value={value.title} onChange={event => setValue(previous => ({ ...previous, title: event.target.value }))} /></label>
          {description && <section className="min-w-0 space-y-2"><h3 className="text-sm font-semibold">Descrição</h3>
            <CardDescriptionEditor value={value.description ?? ""} document={value.descriptionDocument} attachments={value.attachments ?? []} onReady={onReady}
              onChange={content => setValue(previous => ({ ...previous, description: content }))} onDocumentChange={document => setValue(previous => ({ ...previous, descriptionDocument: document }))}
              onInsertFile={kind => { embedUpload.current = true;if (input.current) { input.current.accept = kind === "image" ? "image/*" : "";input.current.click(); } }} />
          </section>}
        </div>
        {description && <aside aria-label="Anexos do card" className="min-w-0 space-y-4 border-t bg-muted/30 p-4 md:border-l md:border-t-0">
          <input ref={input} type="file" multiple className="hidden" aria-label="Anexar arquivos" onChange={event => { attach(Array.from(event.target.files ?? []), embedUpload.current);embedUpload.current = false;event.target.value = ""; }} />
          <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" className="min-w-0 flex-1" onClick={() => { embedUpload.current = false;if (input.current) { input.current.accept = "";input.current.click(); } }}><Paperclip />Anexo</Button><CardAppearance inlineReposition onReposition={() => setAdjustingCoverId(cover?.id ?? null)} card={{ ...value, id: "draft", description: value.description ?? "", completed: false }} onChange={patch => { if ("coverAttachmentId" in patch) setAdjustingCoverId(null); setValue(previous => ({ ...previous, ...patch })); }} /></div>
          <p className="text-xs text-muted-foreground">Até 20 MB por arquivo · Cole imagens com Ctrl+V</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <CardAttachments files={value.attachments ?? []} coverId={value.coverAttachmentId} onCover={id => setValue(previous => ({ ...previous, coverAttachmentId: id, coverPosition: { x: 50, y: 50 } }))} onRemove={remove} />
          {!value.attachments?.length && <p className="text-xs text-muted-foreground">Nenhum anexo neste card.</p>}
        </aside>}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">{description && <div className="mr-auto basis-full space-y-1 text-xs sm:basis-auto">
        <DialogDescription className="text-xs">Organize seu trabalho. As alterações ficam salvas neste navegador.</DialogDescription>
        {("id" in initial || value.createdAt || value.updatedAt) && <p className="text-muted-foreground">Criado em <time dateTime={value.createdAt}>{formatTimestamp(value.createdAt)}</time> · Atualizado em <time dateTime={value.updatedAt}>{formatTimestamp(value.updatedAt)}</time></p>}
      </div>}<Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar</Button></div>
    </form>
  </DialogContent></Dialog>
  </>;
}
export function DeleteDialog({ title, onDelete, onClose }: { title: string; onDelete: () => void; onClose: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogTitle>Excluir {title}?</DialogTitle><DialogDescription>Este conteúdo será removido do navegador. Essa ação não pode ser desfeita.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="destructive" onClick={() => { onDelete(); onClose(); }}>Excluir</Button></div></DialogContent></Dialog>;
}
