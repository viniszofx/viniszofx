"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiFileTextLine as FileText, RiLoader4Line as LoaderCircle, RiAddLine as Plus, RiPencilLine as Pencil, RiDeleteBinLine as Trash2 } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { CatalogLayout, CatalogSearch, CatalogTile, CatalogPreview, CatalogFooter, CatalogCreate, CatalogSkeleton, catalogGrid } from "@/components/listing/catalog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createNote, deleteNote, listNotes } from "@/lib/notes/storage";
import { attachmentUrl, type Note } from "@/lib/notes/types";
import { LocalImage } from "./local-image";
import { NoteEditor } from "./note-editor";

export function NotesPage({ initialSearch = "", initialNoteId = "" }: { initialSearch?: string; initialNoteId?: string }) {
  const router = useRouter();
  const requestedNote = useRef(initialNoteId);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(() => {
    void listNotes().then((items) => { setNotes(items); setError(""); if (requestedNote.current) { const note = items.find(item => item.id === requestedNote.current); if (note) setEditing(note); requestedNote.current = ""; } })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as anotações."));
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("viniszofx:notes-changed", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-notes") : undefined;
    if (channel) channel.onmessage = refresh;
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("viniszofx:notes-changed", refresh); channel?.close(); };
  }, [refresh]);
  async function create() {
    if (busy) return;
    setBusy(true); setError("");
    try { const note = await createNote(); setEditing(note); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a nota."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true); setError("");
    try { await deleteNote(deleting.id); setNotes((previous) => previous?.filter((note) => note.id !== deleting.id) ?? []); setDeleting(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir."); }
    finally { setBusy(false); }
  }
  if (editing) return <NoteEditor key={editing.id} initial={editing} onBack={() => { setEditing(null); if (initialNoteId) router.replace("/dashboard/notes"); refresh(); }} />;
  const needle = search.trim().toLocaleLowerCase("pt-BR");
  const visible = (notes ?? []).filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase("pt-BR").includes(needle));
  return <CatalogLayout title="Notes" description="Suas ideias, documentos e arquivos em um só lugar." action={<Button disabled={busy || !notes} onClick={() => void create()}>{busy ? <LoaderCircle className="animate-spin" /> : <Plus />}Nova anotação</Button>}>
    <CatalogSearch label="Buscar notes" value={search} onChange={setSearch} />
    {error && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">{error}<Button variant="outline" size="sm" onClick={refresh}>Tentar novamente</Button></div>}
    {!notes && !error ? <CatalogSkeleton label="Carregando notes" /> : <div className={catalogGrid}>
      {visible.map((note) => <CatalogTile key={note.id}>
        <button onClick={() => setEditing(note)} className="flex min-w-0 flex-1 flex-col text-left outline-none hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring">
          <CatalogPreview>
            {note.coverAttachmentId ? <LocalImage src={attachmentUrl(note.coverAttachmentId)} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: `center ${note.coverPosition}%` }} /> : <FileText className="size-8 text-primary" />}
          </CatalogPreview>
          <span className="w-full break-words px-4 py-3 font-semibold">{note.title || "Sem título"}</span>
        </button>
        <CatalogFooter>
          <time dateTime={note.updatedAt} className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString("pt-BR")}</time>
          <div className="flex"><Button variant="ghost" size="icon-sm" disabled={busy} aria-label={`Editar ${note.title || "Sem título"}`} onClick={() => setEditing(note)}><Pencil /></Button>
          <Button variant="ghost" size="icon-sm" disabled={busy} aria-label={`Excluir ${note.title || "Sem título"}`} onClick={() => { setError(""); setDeleting(note); }}><Trash2 /></Button>
          </div>
        </CatalogFooter>
      </CatalogTile>)}
      {notes && <CatalogCreate label="Criar anotação" disabled={busy} onClick={() => void create()} />}
    </div>}
    {notes && !visible.length && <p className="text-sm text-muted-foreground">{needle ? "Nenhuma anotação encontrada." : "Crie sua primeira anotação para começar."}</p>}
    <p className="text-xs text-muted-foreground">As anotações ficam salvas neste navegador. Use Exportar para guardar uma cópia.</p>
    <Dialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}>
      <DialogContent><DialogTitle>Excluir anotação?</DialogTitle><DialogDescription>“{deleting?.title || "Sem título"}” e seus anexos serão removidos deste navegador.</DialogDescription>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? "Excluindo…" : "Excluir"}</Button></div>
      </DialogContent>
    </Dialog>
  </CatalogLayout>;
}
