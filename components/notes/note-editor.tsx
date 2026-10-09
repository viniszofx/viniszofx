"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ArrowLeft, Download, LoaderCircle, Paperclip } from "lucide-react";
import type { Editor, JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { attachmentId, type Note } from "@/lib/notes/types";
import { getAttachment } from "@/lib/notes/storage";
import { exportNote } from "@/lib/notes/export";
import { printNote } from "@/lib/notes/print";
import { useNoteAutosave } from "./use-note-autosave";
import { useNoteAttachments } from "./use-note-attachments";
import { NoteAttachments } from "./note-attachments";
import { NoteCover } from "./note-cover";
import { NotesSkeleton } from "./notes-skeleton";

const RichTextEditor = dynamic(() => import("./editor/rich-text-editor").then((module) => module.RichTextEditor), {
  ssr: false,
  loading: () => <NotesSkeleton label="Carregando editor…" />,
});

export function NoteEditor({ initial, onBack }: { initial: Note; onBack: () => void }) {
  const autosave = useNoteAutosave(initial);
  const { note, update } = autosave;
  const [filesOpen, setFilesOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const editor = useRef<Editor | null>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const coverUpload = useRef(false);
  const onReady = useCallback((instance: Editor | null) => { editor.current = instance; }, []);
  function embed(markdown: string) {
    if (editor.current) {
      const localFile = /^(!?)\[([\s\S]*)\]\(([^)]+)\)$/.exec(markdown);
      if (localFile && attachmentId(localFile[3])) {
        const name = localFile[2].replace(/\\([\\[\]])/g, "$1");
        editor.current.chain().focus().insertContent([
          localFile[1] ? { type: "image", attrs: { src: localFile[3], alt: name } }
            : { type: "noteFile", attrs: { href: localFile[3], name } },
          { type: "paragraph" },
        ]).run();
      } else editor.current.chain().focus().insertContent(`\n\n${markdown}\n\n`, { contentType: "markdown" }).run();
    } else { update({ content: `${note.content}\n\n${markdown}\n`, document: null }); setRevision((previous) => previous + 1); }
  }
  const files = useNoteAttachments({ noteId: note.id, onEmbed: embed,
    onUploaded: (file) => { if (coverUpload.current) { update({ coverAttachmentId: file.id, coverPosition: 50 }); coverUpload.current = false; } },
    onRemoved: (file) => { if (note.coverAttachmentId === file.id) update({ coverAttachmentId: null }); },
  });
  async function back() {
    setLeaving(true);
    try { await autosave.flush(); onBack(); } catch { setLeaving(false); }
  }
  async function download(format: "md" | "json" | "pdf") {
    setExporting(true); setError(""); setExportOpen(false);
    try {
      await autosave.flush();
      if (format !== "pdf") await exportNote(note, format);
      else if (editor.current) {
        const cover = note.coverAttachmentId ? await getAttachment(note.coverAttachmentId) : undefined;
        const url = cover ? URL.createObjectURL(cover.blob) : undefined;
        try { await printNote(note.title || "Sem título", editor.current.view.dom, url); }
        finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 90_000); }
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível exportar."); }
    finally { setExporting(false); }
  }
  const busy = files.busy || leaving;
  return <main className="min-w-0 bg-background">
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => void back()}><ArrowLeft />Notes</Button>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={() => setFilesOpen(true)}><Paperclip />Arquivos</Button>
        <Popover.Root open={exportOpen} onOpenChange={setExportOpen}>
          <Popover.Trigger render={<Button variant="outline" size="sm" disabled={busy || exporting} />}>
            {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}Exportar
          </Popover.Trigger>
          <Popover.Portal><Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Popover.Popup className="grid w-52 gap-1 border bg-popover p-2 shadow-lg">
              <Popover.Title className="px-2 py-2 text-xs text-muted-foreground">Exportar anotação</Popover.Title>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => void download("md")}>Markdown (.md)</Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => void download("json")}>JSON (.json)</Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => void download("pdf")}>PDF (A4)</Button>
            </Popover.Popup>
          </Popover.Positioner></Popover.Portal>
        </Popover.Root>
      </div>
    </header>
    <div onPasteCapture={(event) => {
      const images = Array.from(event.clipboardData.items).filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile()).filter((file): file is File => !!file);
      if (images.length) { event.preventDefault(); event.stopPropagation(); if (!busy) void files.upload(images); }
    }}>
      <NoteCover files={files} id={note.coverAttachmentId} position={note.coverPosition} disabled={busy}
        onSelect={(id) => update({ coverAttachmentId: id, coverPosition: 50 })}
        onPosition={(position) => update({ coverPosition: position })}
        onUpload={(file) => { coverUpload.current = true; void files.upload([file], false).finally(() => { coverUpload.current = false; }); }} />
      <div className="mx-auto grid w-full max-w-4xl gap-5 py-8 pl-12 pr-5 sm:px-10 sm:py-12">
        <Input autoFocus aria-label="Título da anotação" placeholder="Sem título" value={note.title} maxLength={150}
          onChange={(event) => update({ title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); editor.current?.commands.focus("start"); }
          }} className="h-auto border-0 py-2 font-heading text-2xl! font-semibold sm:text-3xl!" />
        <p role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
          {autosave.status === "pending" || autosave.status === "saving" ? <><LoaderCircle className="size-3 animate-spin" />Salvando…</>
            : autosave.status === "error" ? "Não foi possível salvar" : "Salva neste navegador"}
        </p>
        <RichTextEditor key={revision} value={note.content} document={note.document as Record<string, unknown> | null}
          editable extendedMarkdown documentMode showActions={false} onReady={onReady}
          ariaLabel="Conteúdo da anotação" onChange={(content) => update({ content })}
          onDocumentChange={(document) => update({ document: document as JSONContent })}
          onInsertFile={(kind) => { if (uploadInput.current) { uploadInput.current.accept = kind === "image" ? "image/*" : ""; uploadInput.current.click(); } }} />
        {(error || autosave.error || files.error) && <p role="alert" className="text-sm text-destructive">{error || autosave.error || files.error}</p>}
        {autosave.status === "error" && <Button variant="outline" className="justify-self-start" onClick={() => void autosave.flush().catch(() => {})}>Tentar salvar novamente</Button>}
      </div>
    </div>
    <input ref={uploadInput} className="hidden" aria-label="Adicionar arquivo no corpo" type="file" multiple
      onChange={(event) => { if (!busy) void files.upload(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <Dialog open={filesOpen} onOpenChange={setFilesOpen}><DialogContent className="sm:max-w-3xl">
      <DialogTitle>Arquivos da anotação</DialogTitle><DialogDescription>Arquivos salvos neste navegador.</DialogDescription>
      <NoteAttachments files={files} disabled={busy} onEmbed={(markdown) => { embed(markdown); setFilesOpen(false); }} />
    </DialogContent></Dialog>
  </main>;
}
