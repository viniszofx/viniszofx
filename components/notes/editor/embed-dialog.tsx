import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { embedUrl } from "./note-embed-extension";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmbedDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [replace, setReplace] = useState<number | undefined>();
  useEffect(() => {
    const dom = editor.view.dom;
    const insert = (event: Event) => {
      const details = (event as CustomEvent<{ src?: string; pos?: number }>).detail;
      setUrl(details?.src ?? ""); setReplace(details?.pos); setError(""); setOpen(true);
    };
    dom.addEventListener("viniszofx:insert-embed", insert);
    return () => dom.removeEventListener("viniszofx:insert-embed", insert);
  }, [editor]);
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent>
    <DialogTitle>Incorporar conteúdo</DialogTitle>
    <DialogDescription>Insira o endereço de incorporação do widget ou da página.</DialogDescription>
    <form className="grid gap-4" onSubmit={(event) => {
      event.preventDefault();
      const src = embedUrl(url);
      if (!src) { setError("Informe um link http:// ou https:// de outro site."); return; }
      let chain = editor.chain().focus();
      if (replace !== undefined) chain = chain.setNodeSelection(replace);
      chain.insertContent({ type: "noteEmbed", attrs: { src, height: 300 } }).run();
      setOpen(false);
    }}>
      <Input autoFocus aria-label="Endereço de incorporação" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} aria-invalid={!!error} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Incorporar</Button></div>
    </form>
  </DialogContent></Dialog>;
}
