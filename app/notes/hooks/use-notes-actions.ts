"use client";

import type { Editor } from "@tiptap/react";
import { useCallback } from "react";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function useNotesActions(editor: Editor | null, title: string) {
  const copyToClipboard = useCallback(async () => {
    if (!editor) return;
    const plain = editor.getText();
    const text = `${title}\n\n${plain}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("copy failed", err);
    }
  }, [editor, title]);

  const printReceipt = useCallback(() => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const content = editor?.getHTML() || "<p></p>";
    const safeTitle = escapeHtml(title || "Untitled");

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${safeTitle}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            html, body { margin: 0; padding: 0; background: #fff; color: #000; }
            body { width: 58mm; padding: 12mm 0 0 4mm; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
            h1 { margin: 0 0 3mm; font-size: 12pt; line-height: 1.05; }
            h2 { margin: 0 0 2mm; font-size: 10.5pt; line-height: 1.08; }
            h3 { margin: 0 0 2mm; font-size: 10pt; line-height: 1.1; }
            p, li { margin: 0 0 1.5mm; font-size: 8pt; line-height: 1.28; }
            ul, ol { margin: 0 0 1.5mm; padding-left: 12px; }
            blockquote { margin: 0 0 1.5mm; padding: 1.5mm 2mm; border-left: 2px solid #999; }
            pre { margin: 0 0 1.5mm; padding: 1.5mm; background: #f4f4f4; white-space: pre-wrap; }
            code { font-family: monospace; font-size: 7.5pt; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <h1>${safeTitle}</h1>
          <div>${content}</div>
        </body>
      </html>
    `);
    doc.close();

    win.focus();
    win.addEventListener("afterprint", () => iframe.remove(), { once: true });
    window.setTimeout(() => win.print(), 0);
  }, [editor, title]);

  return {
    copyToClipboard,
    printReceipt,
  };
}
