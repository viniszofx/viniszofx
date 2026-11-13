"use client";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

/** Single text field dialog for creating or renaming things. Selects the name without its extension. */
export function NameDialog({ title, description, initial = "", submitLabel = "Salvar", keepExtension, onSubmit, onClose }: {
  title: string; description?: string; initial?: string; submitLabel?: string; keepExtension?: boolean;
  onSubmit: (name: string) => void | Promise<void>; onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try { await onSubmit(value.trim()); onClose(); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogTitle>{title}</DialogTitle>{description && <DialogDescription className="break-words">{description}</DialogDescription>}
    <form className="space-y-4" onSubmit={event => void submit(event)}>
      <Input autoFocus aria-label="Nome" value={value} maxLength={200} onChange={event => setValue(event.target.value)}
        onFocus={event => { const dot = event.target.value.lastIndexOf("."); if (keepExtension && dot > 0) event.target.setSelectionRange(0, dot); }} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy || !value.trim()}>{submitLabel}</Button></div>
    </form>
  </DialogContent></Dialog>;
}
