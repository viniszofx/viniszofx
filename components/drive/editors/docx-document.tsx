"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DocxEditor, type DocxEditorRef, useFonts } from "@docx-editor.dev/react";
import ptBR from "@docx-editor.dev/i18n/pt-BR";
import "@docx-editor.dev/core/styles/editor.css";
import { RiDownloadLine, RiFilePdf2Line, RiPrinterLine } from "@remixicon/react";
import { docxToPdf } from "@/lib/drive/editors/docx-pdf";
import { printDocx } from "@/lib/drive/editors/print-docx";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { LoadingBlock as LoadingSkeleton } from "@/components/ui/feedback";
import { DOCUMENT_FONTS } from "@/lib/drive/editors/document-fonts";
import { saveBlob } from "@/lib/drive/files";
import { AUTO_SAVE_DELAY, SaveControls, saveStatus, useAutoSavePreference } from "./editor-save";
import { DocxContextMenu, DocxImageMenu } from "./docx-image-tools";
import { createDocxExporters, docxFileMenu } from "./docx-file-menu";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const AUTO_SAVE_KEY = "nodus:docx-auto-save";

// Editor de DOCX completo: páginas, menus, barra de formatação, tabelas e impressão. Sem onSave, abre só para leitura.
export function DocxDocument({ file, name, onSave, saveLabel = "Salvar", allowAutoSave = false, leading }: {
  leading?: React.ReactNode;
  file: Blob;
  name: string;
  onSave?: (edited: Blob, automatic: boolean) => Promise<void>;
  saveLabel?: string;
  allowAutoSave?: boolean;
}) {
  const editor = useRef<DocxEditorRef>(null);
  const acted = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const saving = useRef(false);
  const [bytes, setBytes] = useState<{ file: Blob; data: Uint8Array }>();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [autoSave, setAutoSave] = useAutoSavePreference(AUTO_SAVE_KEY);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exporters = useMemo(() => createDocxExporters(name), [name]);
  const fonts = useFonts(...DOCUMENT_FONTS);

  useEffect(() => {
    let active = true;
    file.arrayBuffer().then((buffer) => { if (active) setBytes({ file, data: new Uint8Array(buffer) }); })
      .catch(() => { if (active) setError("Não foi possível ler este arquivo."); });
    return () => { active = false; };
  }, [file]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function currentFile() {
    const saved = await editor.current?.save();
    return saved ? new Blob([saved], { type: DOCX_TYPE }) : file;
  }

  async function save(automatic: boolean) {
    if (!onSave || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setDirty(false);
    try {
      await onSave(await currentFile(), automatic);
      setSavedAt(new Date());
    } catch (cause) {
      setDirty(true);
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function changed() {
    // O editor também avisa ao abrir e ao carregar fontes; só conta o que veio de teclado ou mouse.
    if (!acted.current) return;
    setDirty(true);
    if (!autoSave || !allowAutoSave) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(true), AUTO_SAVE_DELAY);
  }

  function toggleAutoSave(next: boolean) {
    setAutoSave(next);
    if (next && dirty) void save(true);
  }

  async function download() {
    try {
      saveBlob(await currentFile(), name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível baixar.");
    }
  }

  async function print() {
    try {
      setPrinting(true);
      await printDocx(await currentFile(), name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível imprimir.");
    } finally {
      setPrinting(false);
    }
  }

  async function downloadPdf() {
    try {
      setExporting(true);
      saveBlob(await docxToPdf(await currentFile(), name), name.replace(/\.docx$/i, "") + ".pdf");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PDF.");
    } finally {
      setExporting(false);
    }
  }

  const ready = bytes?.file === file;
  const status = saveStatus(busy, dirty, savedAt);
  const actions = <div className="flex flex-wrap items-center justify-end gap-2">
        <SaveControls status={status} autoSave={autoSave} onAutoSave={onSave && allowAutoSave ? toggleAutoSave : undefined} ready={ready} canSave={!busy} label={saveLabel} onSave={onSave ? () => void save(false) : undefined}>
        <Button variant="ghost" size="sm" disabled={!ready || printing} title="Imprimir (Ctrl+P)" onClick={() => void print()}>
          <RiPrinterLine className="size-4" />{printing ? "Preparando…" : "Imprimir"}
        </Button>
        <Button variant="ghost" size="sm" disabled={!ready || exporting} title="Baixar como PDF" onClick={() => void downloadPdf()}>
          <RiFilePdf2Line className="size-4" />{exporting ? "Gerando…" : "PDF"}
        </Button>
        <Button variant="ghost" size="sm" disabled={!ready} onClick={() => void download()}>
          <RiDownloadLine className="size-4" />Baixar
        </Button>
        </SaveControls>
      </div>;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!ready && <div className="flex flex-wrap items-center gap-3 border-b bg-card p-2">{leading}</div>}
      <ErrorToast message={error} />
      {!ready && !error && <LoadingSkeleton label="Abrindo documento…" />}
      {ready && (
        <div className="min-h-0 flex-1" onPointerDownCapture={() => { acted.current = true; }} onKeyDownCapture={event => {
          // Ctrl/⌘+P prints with our engine-based print instead of the editor's paid PDF handler.
          if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "p") { event.preventDefault(); event.stopPropagation(); void print(); return; }
          acted.current = true;
        }}>
          <DocxEditor
            ref={editor}
            document={bytes.data}
            title={name}
            mode={onSave ? "edit" : "view"}
            i18n={ptBR}
            fonts={fonts}
            onChange={changed}
            onSave={onSave ? () => void save(false) : undefined}
            menu={{ exporters, children: [docxFileMenu({ onPrint: () => void print(), disabled: printing }), onSave && <DocxImageMenu key="image" />] }}
            contextMenu={onSave ? false : undefined}
            renderTitleBarLeft={leading ? () => leading : undefined}
            renderTitleBarRight={() => actions}
          >
            {onSave && <DocxContextMenu />}
          </DocxEditor>
        </div>
      )}
    </div>
  );
}
