"use client";

import { useEffect, useRef, useState } from "react";
import { notifySuccess, notifyError } from "@/lib/ui/notifications";
import { deleteAttachment, listAttachments, saveAttachment } from "@/lib/notes/storage";
import { attachmentLimit, attachmentUrl, type NoteAttachment } from "@/lib/notes/types";
export type { NoteAttachment } from "@/lib/notes/types";

export function useNoteAttachments({ noteId, onEmbed, onUploaded, onRemoved }: {
  noteId: string;
  onEmbed: (markdown: string) => void;
  onUploaded?: (file: NoteAttachment) => void;
  onRemoved?: (file: NoteAttachment) => void;
}) {
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    void listAttachments(noteId).then((files) => { if (active) { setAttachments(files); setLoading(false); } })
      .catch((cause) => { if (active) { setError(cause.message); setLoading(false); } });
    return () => { active = false; };
  }, [noteId]);
  async function upload(files: File[], embed = true) {
    if (lock.current || !files.length) return;
    if (files.some((file) => !file.size || file.size > attachmentLimit)) { setError("Selecione arquivos de até 20 MB cada."); notifyError("Arquivo inválido", "Selecione arquivos de até 20 MB cada."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      for (const file of files) {
        const saved = await saveAttachment(noteId, file);
        setAttachments((previous) => [...previous, saved]);
        onUploaded?.(saved);
        if (embed) {
          const label = file.name.replace(/[\r\n]/g, " ").replace(/([\\[\]])/g, "\\$1");
          onEmbed(`${file.type.startsWith("image/") ? "!" : ""}[${label}](${attachmentUrl(saved.id)})`);
        }
      }
      notifySuccess(files.length === 1 ? "Anexo adicionado" : "Anexos adicionados");
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Falha ao salvar o anexo."; setError(message); notifyError("Falha ao anexar arquivo", message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove(file: NoteAttachment) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError("");
    try {
      await deleteAttachment(file.id);
      onRemoved?.(file);
      setAttachments((previous) => previous.filter((item) => item.id !== file.id));
      notifySuccess("Anexo excluído");
      return true;
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Falha ao excluir o anexo."; setError(message); notifyError("Falha ao excluir anexo", message); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  return { attachments, loading, busy, error, upload, remove, url: (file: NoteAttachment, preview = false) => { void preview; return attachmentUrl(file.id); } };
}
