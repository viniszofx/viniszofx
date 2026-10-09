import { FilePreview } from "./file-preview";
import { useRef, useState } from "react";
import { RiAttachment2, RiDeleteBinLine, RiDownloadLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LocalImage as MediaImage } from "./local-image";
import { AttachmentDownload as OfflineDownload } from "./attachment-download";
import { NotesSkeleton as LoadingSkeleton } from "./notes-skeleton";
import type { NoteAttachment, useNoteAttachments } from "./use-note-attachments";

type Attachments = ReturnType<typeof useNoteAttachments>;
export function NoteAttachments({ files, disabled, onEmbed }: { files: Attachments; disabled: boolean; onEmbed: (markdown: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<NoteAttachment | null>(null);
  const [deleting, setDeleting] = useState<NoteAttachment | null>(null);
  const link = (file: NoteAttachment) => `${file.contentType.startsWith("image/") ? "!" : ""}[${file.name.replace(/([\\[\]])/g, "\\$1")}](${files.url(file, true)})`;
  return <section className="grid gap-4 border-t border-border pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-sm font-semibold">Anexos</h2><p className="mt-1 text-xs text-muted-foreground">Até 20 MB por arquivo. Cole imagens com Ctrl+V.</p></div>
      <Button variant="outline" size="sm" disabled={disabled || files.busy} onClick={() => input.current?.click()}><RiAttachment2 />{files.busy ? "Enviando…" : "Anexar arquivos"}</Button>
      <input ref={input} type="file" multiple className="hidden" aria-label="Arquivos da anotação" onChange={(event) => { void files.upload(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    </div>
    {files.loading && <LoadingSkeleton label="Carregando anexos…" />}
    {files.error && <p role="alert" className="text-sm text-destructive">{files.error}</p>}
    {files.attachments.map((file) => <article key={file.id} className="flex min-w-0 flex-wrap items-center gap-3 border border-border p-3">
      {file.contentType.startsWith("image/") && <button aria-label={`Prévia de ${file.name}`} onClick={() => setPreview(file)}><MediaImage src={files.url(file, true)} alt="" className="h-14 w-20 object-cover" /></button>}
      <div className="min-w-0 flex-1"><p className="break-words text-sm">{file.name}</p><p className="mt-1 text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setPreview(file)}>Prévia</Button>
        <Button variant="ghost" size="sm" disabled={disabled || files.busy} onClick={() => onEmbed(link(file))}>Incorporar</Button>
        <OfflineDownload href={files.url(file)} name={file.name} aria-label={`Baixar ${file.name}`} className="p-2 text-muted-foreground hover:text-foreground"><RiDownloadLine className="size-4" /></OfflineDownload>
        <Button variant="ghost" size="icon-sm" disabled={disabled || files.busy} aria-label={`Excluir anexo ${file.name}`} onClick={() => setDeleting(file)}><RiDeleteBinLine /></Button>
      </div>
    </article>)}
    <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}><DialogContent className="sm:max-w-3xl">
      <DialogTitle className="break-words pr-8">{preview?.name}</DialogTitle>
      {preview && <FilePreview file={preview} url={files.url(preview, true)} />}
    </DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={(open) => { if (!open && !files.busy) setDeleting(null); }}><DialogContent>
      <DialogTitle>Excluir anexo?</DialogTitle><p className="break-words text-sm">{deleting?.name}. Links e imagens incorporadas deixarão de funcionar.</p>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={files.busy} onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="destructive" disabled={files.busy} onClick={async () => { if (deleting) { await files.remove(deleting); setDeleting(null); } }}>Excluir</Button></div>
    </DialogContent></Dialog>
  </section>;
}
