// Paints every page of a DOCX with the editor's own layout engine (Apache-2.0 core):
// the same pagination, fonts and line breaks the editor shows, with no page virtualization.
import { openFontBackedDocumentForExport } from "@docx-editor.dev/core/export";
import { paintSemanticLayout } from "@docx-editor.dev/core/output";

type Fonts = Parameters<typeof openFontBackedDocumentForExport>[1]["fonts"];
export type PaintedPage = { width: number; height: number };
/** A font face registered for the painted pages: `family` is the private alias used in CSS. */
export type PaintedFace = { family: string; weight: number; style: "normal" | "italic"; bytes: Uint8Array };

const SCALE = 96 / 72; // layout points → CSS pixels

/**
 * Lays out `bytes`, registers the exact font faces the layout measured with (under private
 * aliases, so a document can't shadow the host page's fonts) and paints all pages into
 * `container`. Returns each page size in CSS pixels and the registered faces.
 */
export async function paintDocxPages(bytes: Uint8Array, container: HTMLElement, fonts: Fonts) {
  const opened = await openFontBackedDocumentForExport(bytes, { fonts });
  if (!opened.ok) throw new Error(opened.reason === "aborted" ? "Exportação cancelada." : "Não foi possível ler este documento.");
  const { session } = opened;
  try {
    const layout = await session.layout();
    const aliases = new Map<string, string>();
    const faces: PaintedFace[] = [];
    session.fontResolution.families.forEach((family, index) => {
      const alias = `docx-print-${index}`;
      for (const face of family.faces) {
        const admitted = session.admittedFontFace({ family: family.family, weight: face.weight, style: face.style });
        if (!admitted) continue;
        aliases.set(family.family.toLowerCase(), alias);
        faces.push({ family: alias, weight: face.weight, style: face.style, bytes: admitted.bytes.slice() });
      }
    });
    await Promise.all(faces.map(face => {
      const fontFace = new FontFace(face.family, face.bytes.slice(), { weight: String(face.weight), style: face.style });
      container.ownerDocument.fonts.add(fontFace);
      return fontFace.load().catch(() => undefined);
    }));
    const alias = (family: string) => aliases.get(family.toLowerCase());
    paintSemanticLayout(container, layout, { scale: SCALE, ariaHidden: true, fontAlias: alias, defaultFontFamily: alias(session.fontResolution.defaultFamily) });
    const pages: PaintedPage[] = layout.pages.map(page => ({ width: page.box.width * SCALE, height: page.box.height * SCALE }));
    return { pages, faces };
  } finally {
    session.dispose();
  }
}
