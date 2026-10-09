import { continueDocument } from "./blocks/continue-document";
import { BlockControls } from "./blocks/block-controls";
import { EmbedDialog } from "./embed-dialog";
import { SelectionToolbar } from "./selection-toolbar";
import { SlashCommands } from "./blocks/slash-extension";
import type { AttachmentKind } from "./blocks/commands";
import { TableControls } from "./table-controls";
import { cn } from "cn";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { markdownExtensions } from "./markdown-extensions";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RichTextEditor({ value, editable = false, onSave, onCancel, onChange, showActions = true, extendedMarkdown = false, ariaLabel, documentMode = false, onReady, document, onDocumentChange, onInsertFile }: {
  onInsertFile?: (kind: AttachmentKind) => void;
  document?: Record<string, unknown> | null;
  onDocumentChange?: (document: Record<string, unknown>) => void;
  documentMode?: boolean;
  onReady?: (editor: Editor | null) => void;
  value: string;
  editable?: boolean;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  onChange?: (value: string) => void;
  showActions?: boolean;
  extendedMarkdown?: boolean;
  ariaLabel?: string;
}) {
  const contentContainer = useRef<HTMLDivElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const editor = useEditor({
    extensions: [...markdownExtensions(editable, extendedMarkdown), ...(editable && documentMode ? [SlashCommands] : [])],
    onUpdate: ({ editor }) => { onChange?.(editor.isEmpty ? "" : editor.getMarkdown()); onDocumentChange?.(editor.getJSON()); },
    content: document ? document as JSONContent : value,
    ...(document ? {} : { contentType: "markdown" as const }),
    editable,
    immediatelyRender: false,
    editorProps: {
      handleDOMEvents: { mousedown: (view, event) => editable && documentMode ? continueDocument(view, event) : false },
      attributes: {
        class: cn(
          "[overflow-wrap:anywhere] text-sm leading-[1.6] outline-none",
          "[&>*+*]:mt-[0.65rem]",
          "[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg",
          "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold",
          "[&_h1]:leading-[1.3] [&_h2]:leading-[1.3] [&_h3]:leading-[1.3]",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
          "[&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline",
          "[&_code]:bg-muted [&_code]:px-[0.3rem] [&_code]:py-[0.15rem] [&_code]:font-mono",
          "[&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:p-0",
          "[&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:my-8 [&_td]:relative [&_th]:relative [&_.column-resize-handle]:absolute [&_.column-resize-handle]:right-0 [&_.column-resize-handle]:top-0 [&_.column-resize-handle]:bottom-0 [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-primary/50 [&_.column-resize-handle]:cursor-col-resize [&_.selectedCell]:outline [&_.selectedCell]:outline-primary [&_.resize-cursor]:cursor-col-resize",
          "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_img]:max-w-full",
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 [&_li[data-type=taskItem]>label]:shrink-0 [&_li[data-type=taskItem]>div]:min-w-0 [&_li[data-type=taskItem]>div]:flex-1",
          "[&_hr]:my-4 [&_hr]:border-t [&_hr]:border-border",
          editable && (documentMode ? "min-h-[50dvh] py-4 text-base" : "min-h-52 p-4 text-base"),
        ),
        "aria-label": ariaLabel ?? (editable ? "Descrição do cartão" : "Descrição formatada"),
        ...(editable ? { role: "textbox", "aria-multiline": "true" } : {}),
      },
    },
  });
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const insert = (event: Event) => onInsertFile?.((event as CustomEvent<AttachmentKind>).detail);
    dom.addEventListener("viniszofx:insert-file", insert);
    return () => dom.removeEventListener("viniszofx:insert-file", insert);
  }, [editor, onInsertFile]);
  useEffect(() => { onReady?.(editor); return () => onReady?.(null); }, [editor, onReady]);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      strike: editor?.isActive("strike"),
      heading: editor?.isActive("heading"),
      bulletList: editor?.isActive("bulletList"),
      orderedList: editor?.isActive("orderedList"),
      blockquote: editor?.isActive("blockquote"),
      code: editor?.isActive("code"),
      link: editor?.isActive("link"),
    }),
  });
  if (!editor) {
    return <p className="text-xs text-muted-foreground">Carregando editor…</p>;
  }
  const actions = [
    {
      label: "Negrito",
      text: "B",
      active: state?.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Itálico",
      text: "I",
      active: state?.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Tachado",
      text: "S",
      active: state?.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Título",
      text: "H",
      active: state?.heading,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Lista",
      text: "•",
      active: state?.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Lista numerada",
      text: "1.",
      active: state?.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Citação",
      text: "❞",
      active: state?.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Código",
      text: "</>",
      active: state?.code,
      run: () => editor.chain().focus().toggleCode().run(),
    },
  ];
  return (
    <div className="grid gap-3">
      <div
        className={editable && !documentMode
          ? "overflow-hidden rounded-lg border border-ring bg-background ring-2 ring-ring/20"
          : ""}
      >
        {editable && !documentMode && (
          <div
            role="toolbar"
            aria-label="Formatação do texto"
            className={cn("flex flex-wrap gap-1 border-b border-border", documentMode ? "py-2" : "bg-muted/30 p-2")}
          >
            {actions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.active ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={action.label}
                aria-pressed={!!action.active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={action.run}
              >
                {action.text}
              </Button>
            ))}
            {extendedMarkdown && <Button type="button" variant="ghost" size="icon-sm" aria-label="Inserir tabela" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</Button>}
            <Button
              type="button"
              variant={state?.link ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Link"
              onClick={() => {
                setUrl(editor.getAttributes("link").href ?? "");
                setLinkOpen(!linkOpen);
                setError("");
              }}
            >
              ↗
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Desfazer"
              onClick={() => editor.chain().focus().undo().run()}
            >
              ↶
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Refazer"
              onClick={() => editor.chain().focus().redo().run()}
            >
              ↷
            </Button>
          </div>
        )}
        {editable && linkOpen && (
          <form
            className="flex flex-wrap gap-2 border-b border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const href = url.trim();
              if (href && !/^https?:\/\//i.test(href)) {
                setError(
                  "Informe um endereço começando com https:// ou http://.",
                );
                return;
              }
              if (href) {
                editor.chain().focus().extendMarkRange("link").setLink({ href })
                  .run();
              } else {editor.chain().focus().extendMarkRange("link").unsetLink()
                  .run();}
              setLinkOpen(false);
              setError("");
            }}
          >
            <Input
              aria-label="Endereço do link"
              placeholder="https://"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" size="sm">Aplicar link</Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink()
                  .run();
                setLinkOpen(false);
              }}
            >
              Remover link
            </Button>
          </form>
        )}
        <div ref={contentContainer} className="relative">
          {editable && documentMode && <BlockControls editor={editor} container={contentContainer} />}
          <EditorContent editor={editor} />
          {editable && extendedMarkdown && <TableControls editor={editor} container={contentContainer} />}
        </div>
      </div>
      {editable && showActions && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const markdown = editor.isEmpty ? "" : editor.getMarkdown();
              if (markdown.length > 20000) {
                setError("A descrição deve ter até 20000 caracteres.");
                return;
              }
              onSave?.(markdown);
            }}
          >
            Salvar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}
      </p>}
      {editable && extendedMarkdown && <EmbedDialog editor={editor} />}
      {editable && documentMode && <SelectionToolbar editor={editor} />}
    </div>
  );
}
