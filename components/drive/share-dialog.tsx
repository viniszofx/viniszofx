"use client";
import { RiFileCopyLine, RiLink, RiLinkUnlink } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { setShareLink, shareUrl } from "@/lib/drive/client";
import { ShortLinkButton } from "@/components/ui/public-link";
import type { DriveItem } from "@/lib/nodus/stores";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";

export function ShareDialog({ item, onClose }: { item: DriveItem; onClose: () => void }) {
  const url = item.shareToken ? shareUrl(item.shareToken) : "";
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); notifySuccess("Link copiado"); }
    catch { notifyError("Não foi possível copiar", "Selecione o link e copie manualmente."); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-lg">
    <DialogTitle>Compartilhar {item.kind === "folder" ? "pasta" : "arquivo"}</DialogTitle>
    <DialogDescription className="break-words">{item.name}</DialogDescription>
    {url ? <div className="space-y-3">
      <p className="text-sm">Qualquer pessoa com este link pode abrir {item.kind === "folder" ? "a pasta e os arquivos dentro dela" : "e baixar o arquivo"}, sem login. A edição continua só com você.</p>
      <div className="flex gap-2"><Input readOnly aria-label="Link compartilhado" value={url} onFocus={event => event.target.select()} /><Button type="button" onClick={() => void copy(url)}><RiFileCopyLine />Copiar</Button></div>
      <div className="flex flex-wrap gap-2"><ShortLinkButton path={`/arquivo/${item.shareToken}`} /><Button type="button" variant="destructive" size="sm" onClick={() => setShareLink(item, false)}><RiLinkUnlink />Remover link</Button></div>
    </div> : <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{item.kind === "folder" ? "A pasta é privada. O link também dá acesso ao conteúdo atual dela." : "O arquivo é privado."} Crie um link para permitir o acesso sem login.</p>
      <Button type="button" onClick={() => { const token = setShareLink(item, true); if (token) void copy(shareUrl(token)); }}><RiLink />Criar e copiar link</Button>
    </div>}
    <div className="flex justify-end"><Button type="button" variant="outline" onClick={onClose}>Fechar</Button></div>
  </DialogContent></Dialog>;
}
