"use client";
import { DocxEditor } from "@docx-editor.dev/react";
import { RiPrinterLine } from "@remixicon/react";
import { exportMarkdown } from "@docx-editor.dev/docx-to-markdown";
import { DOCUMENT_FONTS } from "@/lib/drive/editors/document-fonts";
import { docxToPdf } from "@/lib/drive/editors/docx-pdf";

/**
 * File › Export handlers, all in the browser: Markdown with the official Apache-2.0
 * converter, PDF with our engine-based writer (lib/drive/editors/docx-pdf.ts) instead of
 * the paid Node-only `docx-to-pdf`.
 */
export function createDocxExporters(name: string) {
  return {
    markdown: async (source: Uint8Array) => ({ markdown: (await exportMarkdown(source, { fonts: DOCUMENT_FONTS })).markdown }),
    pdf: async (source: Uint8Array) => ({ bytes: new Uint8Array(await (await docxToPdf(new Blob([new Uint8Array(source)]), name)).arrayBuffer()) }),
  };
}

const printIcon = <RiPrinterLine className="size-[18px]" />;

/**
 * File menu: replaces the editor's Print (which prints a converted PDF) with our print of
 * the painted pages; Export › PDF stays and uses createDocxExporters.
 * Returns the `DocxEditor.Menu.File` element itself (call it, don't render it as a component):
 * the editor only overrides a menu in place when its direct child is that part; a wrapper
 * component or fragment is appended as a second "Arquivo" menu instead.
 */
export function docxFileMenu({ onPrint, disabled }: { onPrint: () => void; disabled?: boolean }) {
  return <DocxEditor.Menu.File key="file">
    <DocxEditor.Menu.Print hidden />
    <DocxEditor.Menu.Row icon={printIcon} shortcut="Ctrl+P" disabled={disabled} onSelect={onPrint}>Imprimir</DocxEditor.Menu.Row>
  </DocxEditor.Menu.File>;
}
