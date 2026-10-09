"use client";
import { useRef, useState } from "react";
import { RiImageAddLine as ImagePlus, RiLoader4Line as LoaderCircle, RiDeleteBinLine as Trash2, RiExpandUpDownLine as MoveVertical } from "@remixicon/react";
import { notifyError } from "@/lib/ui/notifications";
import { Button } from "@/components/ui/button";
import { newId, type CardAttachment } from "@/lib/boards/store";
export function ImageCoverControls({ cover, onChange, label = "Upload de cover", onReposition }: { cover?: CardAttachment; onChange: (cover?: CardAttachment) => void; label?: string; onReposition?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || !file.size || file.size > 20 * 1024 * 1024) { setError("Escolha uma imagem PNG, JPG, WebP ou GIF de até 20 MB."); notifyError("Imagem inválida", "Escolha uma imagem PNG, JPG, WebP ou GIF de até 20 MB."); return; }
    setBusy(true); setError("");
    const url = URL.createObjectURL(file);
    try { const image = new Image(); image.src = url; await image.decode(); onChange({ id: newId(), name: file.name, type: file.type, size: file.size, blob: file }); }
    catch { setError("Não foi possível abrir esta imagem. Escolha outro arquivo."); notifyError("Falha ao abrir imagem", "Escolha outro arquivo."); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  }
  return <div className="mt-3 space-y-2 border-t pt-3">
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" aria-label={label} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    <Button type="button" variant="outline" size="sm" className="w-full" disabled={busy} onClick={() => input.current?.click()}>{busy ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}Cover</Button>
    {cover && onReposition && <Button type="button" variant="ghost" size="sm" className="w-full" disabled={busy} onClick={onReposition}><MoveVertical />Reposicionar</Button>}
    {cover && <Button type="button" variant="ghost" size="sm" className="w-full" disabled={busy} onClick={() => onChange(undefined)}><Trash2 />Remover cover</Button>}
    <p className="text-xs text-muted-foreground">PNG, JPG, WebP ou GIF · Até 20 MB</p>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
