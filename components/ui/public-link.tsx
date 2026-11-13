"use client";
import { useState } from "react";
import { RiFileCopyLine, RiLink, RiLinkUnlink, RiScissorsCutLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";

async function copy(value: string) {
  try { await navigator.clipboard.writeText(value); notifySuccess("Link copiado"); }
  catch { notifyError("Não foi possível copiar", "Selecione o link e copie manualmente."); }
}

/** Gera e copia o link curto /s/<código> de um caminho público (Nodus: links curtos). */
export function ShortLinkButton({ path }: { path: string }) {
  const [short, setShort] = useState("");
  async function create() {
    try {
      const response = await fetch("/api/short-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: path }) });
      if (!response.ok) throw new Error(await response.text());
      const url = `${location.origin}/s/${(await response.json()).code}`;
      setShort(url); await copy(url);
    } catch (cause) { notifyError("Link curto não criado", cause instanceof Error ? cause.message : ""); }
  }
  return short ? <div className="flex gap-2"><Input readOnly aria-label="Link curto" value={short} onFocus={event => event.target.select()} /><Button type="button" variant="outline" onClick={() => void copy(short)}><RiFileCopyLine />Copiar</Button></div>
    : <Button type="button" variant="outline" size="sm" onClick={() => void create()}><RiScissorsCutLine />Criar link curto</Button>;
}

/** Painel de link público somente leitura: criar, copiar, encurtar e revogar. */
export function PublicLinkPanel({ path, what, onCreate, onRemove }: { path: string | null; what: string; onCreate: () => void; onRemove: () => void }) {
  const url = path && typeof window !== "undefined" ? `${location.origin}${path}` : "";
  return path ? <div className="space-y-3">
    <p className="text-sm">Qualquer pessoa com este link pode ver {what}, sem login e sem editar.</p>
    <div className="flex gap-2"><Input readOnly aria-label="Link público" value={url} onFocus={event => event.target.select()} /><Button type="button" onClick={() => void copy(url)}><RiFileCopyLine />Copiar</Button></div>
    <div className="flex flex-wrap gap-2"><ShortLinkButton path={path} /><Button type="button" variant="destructive" size="sm" onClick={onRemove}><RiLinkUnlink />Remover link</Button></div>
  </div> : <div className="space-y-3">
    <p className="text-sm text-muted-foreground">Privado. Crie um link para que outras pessoas possam ver {what} sem login.</p>
    <Button type="button" onClick={onCreate}><RiLink />Criar link público</Button>
  </div>;
}

export const newShareToken = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), byte => byte.toString(16).padStart(2, "0")).join("");

export function PublicLinkDialog({ title, name, ...panel }: Parameters<typeof PublicLinkPanel>[0] & { title: string; name: string; onClose: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open) panel.onClose(); }}><DialogContent className="sm:max-w-lg">
    <DialogTitle>{title}</DialogTitle><DialogDescription className="break-words">{name}</DialogDescription>
    <PublicLinkPanel {...panel} />
    <div className="flex justify-end"><Button type="button" variant="outline" onClick={panel.onClose}>Fechar</Button></div>
  </DialogContent></Dialog>;
}
