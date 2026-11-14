import type { ComponentType } from "react";
import { RiCursorLine, RiEditLine, RiMarkPenLine, RiPencilLine, RiText } from "@remixicon/react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { CommentDraft } from "./pdf-model";
import type { Area } from "./pdf-geometry";
import { pdfjs } from "./pdf-engine";

// Ferramentas, parâmetros do pdf.js e utilitários do editor de PDF (separados do componente).
export const { AnnotationEditorParamsType: Param, AnnotationEditorType: Editor } = pdfjs;
export type Tool = "select" | "edittext" | "ink" | "highlight" | "text" | "image" | "comment";
export type ColorTool = "ink" | "highlight" | "text";
export type SizeTool = "ink" | "text";
export type SelectionState = CommentDraft & { left: number; top: number; barLeft: number; barTop: number };
export type CommentMarker = { id: string; left: number; top: number; index: number };
export type PaintedBox = Area & { id: string; color?: string; paint: boolean };
export type TextContent = Awaited<ReturnType<PDFPageProxy["getTextContent"]>>;
export type Viewer = {
  annotationEditorMode: { mode: number; editId?: string };
  currentScale: number;
  currentScaleValue: string;
  currentPageNumber: number;
  pagesRotation: number;
  spreadMode: number;
  refresh: () => void;
  setDocument: (pdf: PDFDocumentProxy) => void;
};
export type Bus = { dispatch: (name: string, data: Record<string, unknown>) => void };

export const MODES: Record<Tool, number> = { select: Editor.NONE, edittext: Editor.NONE, ink: Editor.INK, highlight: Editor.HIGHLIGHT, text: Editor.FREETEXT, image: Editor.STAMP, comment: Editor.NONE };
export const TOOLS: { tool: Tool; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { tool: "select", label: "Selecionar", icon: RiCursorLine },
  { tool: "ink", label: "Desenhar", icon: RiPencilLine },
  { tool: "highlight", label: "Realçar", icon: RiMarkPenLine },
  { tool: "edittext", label: "Editar texto", icon: RiEditLine },
  { tool: "text", label: "Texto", icon: RiText },
];
// Cores do marca-texto: as mesmas da paleta do pdf.js.
export const HIGHLIGHT_COLORS = ["#ffff98", "#53ffbc", "#80ebff", "#ffcbe6", "#ff4f5f"];
export const COLOR_PARAM: Record<ColorTool, number> = { ink: Param.INK_COLOR, highlight: Param.HIGHLIGHT_COLOR, text: Param.FREETEXT_COLOR };
export const SIZE_PARAM: Record<SizeTool, { param: number; min: number; max: number }> = {
  ink: { param: Param.INK_THICKNESS, min: 1, max: 20 },
  text: { param: Param.FREETEXT_SIZE, min: 6, max: 72 },
};
export const isColorTool = (tool: Tool): tool is ColorTool => tool in COLOR_PARAM;
export const isSizeTool = (tool: Tool): tool is SizeTool => tool in SIZE_PARAM;
// Itens que a ferramenta Selecionar abre na ferramenta deles: imagem, desenho e caixa de texto, em edição ou já no arquivo.
export const OBJECT_KINDS: [string, Tool][] = [["stamp", "image"], ["ink", "ink"], ["freeText", "text"]];
export const EDITORS = ".annotationEditorLayer :is(.stampEditor,.inkEditor,.freeTextEditor)";
export const OBJECTS = `${EDITORS}, .annotationLayer :is(.stampAnnotation,.inkAnnotation,.freeTextAnnotation)`;

export const LOCKED_MESSAGE = "Este PDF é protegido contra edição. Realces e comentários não podem ser gravados nele.";
export const unit = (value: number) => Math.min(1, Math.max(0, value));
export const clampScale = (value: number) => Math.min(4, Math.max(0.25, value));
export const pdfBlob = (bytes: Uint8Array) => new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
// Atualiza a lista só quando ela mudou, para a medição a cada desenho da página não redesenhar a tela à toa.
export const unlessSame = <T,>(next: T) => (current: T) => JSON.stringify(current) === JSON.stringify(next) ? current : next;
