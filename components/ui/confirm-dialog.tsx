"use client";
import { useRef, useState } from "react";
import { RiLoader4Line } from "@remixicon/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Button } from "./button";
import { notifyError } from "@/lib/ui/notifications";
export function ConfirmDialog({ title, description, confirmLabel = "Excluir", onConfirm, onClose }: { title: string; description: string; confirmLabel?: string; onConfirm: () => void | Promise<unknown>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await onConfirm(); onClose(); }
    catch (cause) { const message = cause instanceof Error ? cause.message : "Não foi possível concluir a ação."; setError(message); notifyError("Ação não concluída", message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}><DialogContent showCloseButton={!busy}>
    <DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><Button autoFocus type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="button" variant="destructive" disabled={busy} onClick={() => void confirm()}>{busy ? <><RiLoader4Line className="animate-spin" />Aguarde…</> : confirmLabel}</Button></div>
  </DialogContent></Dialog>;
}
