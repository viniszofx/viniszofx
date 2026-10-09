import { menuSurfaceClass } from "@/components/ui/menu-styles";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function SelectionToolbar({ editor }: { editor: Editor }) {
  const [link, setLink] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const actions = [
    ["Negrito", "B", () => editor.chain().focus().toggleBold().run()],
    ["Itálico", "I", () => editor.chain().focus().toggleItalic().run()],
    ["Tachado", "S", () => editor.chain().focus().toggleStrike().run()],
    ["Código", "</>", () => editor.chain().focus().toggleCode().run()],
  ] as const;
  return <>
    <BubbleMenu editor={editor} options={{ placement: "top", offset: 8 }} shouldShow={({ state }) => editor.isEditable && state.selection instanceof TextSelection && !state.selection.empty && !editor.isActive("codeBlock")}>
      <div role="toolbar" aria-label="Formatação da seleção" className={`flex max-w-[calc(100vw-2rem)] flex-wrap gap-1 border border-border p-1 ${menuSurfaceClass}`}>
        {actions.map(([label, text, run]) => <Button key={label} aria-label={label} variant="ghost" size="icon-sm" onMouseDown={(event) => event.preventDefault()} onClick={run}>{text}</Button>)}
        <Button aria-label="Link" variant="ghost" size="icon-sm" onMouseDown={(event) => event.preventDefault()} onClick={() => { setUrl(editor.getAttributes("link").href ?? ""); setError(""); setLink(true); }}>↗</Button>
      </div>
    </BubbleMenu>
    <Dialog open={link} onOpenChange={setLink}><DialogContent><DialogTitle>Link</DialogTitle>
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault(); const href = url.trim();
        if (href && !/^https?:\/\//i.test(href)) { setError("Informe um endereço http:// ou https://."); return; }
        if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run(); else editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setLink(false);
      }}><Input autoFocus aria-label="Endereço do link" value={url} onChange={(event) => setUrl(event.target.value)} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit">Aplicar link</Button></form>
    </DialogContent></Dialog>
  </>;
}
