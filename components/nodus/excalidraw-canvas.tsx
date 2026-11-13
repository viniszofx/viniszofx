"use client";
import { useMemo, useRef } from "react";
import { Excalidraw, exportToBlob, exportToSvg, getSceneVersion, restore, serializeAsJSON } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export type WhiteboardHandle = {
  image: (format: "png" | "svg", scale: number) => Promise<Blob | null>;
  content: () => string;
};
type Api = Parameters<NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>>[0];

function load(content: string) {
  try { return restore(content ? JSON.parse(content) : null, null, null); }
  catch { return restore(null, null, null); }
}

// Carregado sob demanda (next/dynamic, sem SSR): o Excalidraw só baixa quando alguém abre um quadro.
export default function ExcalidrawCanvas({ content, dark, onReady, onChange }: {
  content: string; dark: boolean;
  onReady: (handle: WhiteboardHandle) => void;
  onChange: (content: string) => void;
}) {
  const scene = useMemo(() => load(content), [content]);
  const version = useRef<string | null>(null);
  function ready(api: Api) {
    const state = () => ({ elements: api.getSceneElements(), appState: api.getAppState(), files: api.getFiles() });
    onReady({
      content: () => { const { elements, appState, files } = state(); return serializeAsJSON(elements, appState, files, "local"); },
      image: async (format, scale) => {
        const { elements, appState, files } = state();
        if (!elements.length) return null;
        const data = { elements, files, exportPadding: 16, appState: { ...appState, exportBackground: true, exportScale: scale } };
        if (format === "png") return exportToBlob({ ...data, mimeType: "image/png" });
        const svg = await exportToSvg(data);
        return new Blob([svg.outerHTML], { type: "image/svg+xml" });
      },
    });
  }
  return <div className="absolute inset-0">
    <Excalidraw initialData={{ ...scene, scrollToContent: true }} excalidrawAPI={ready} theme={dark ? "dark" : "light"} langCode="pt-BR"
      UIOptions={{ canvasActions: { export: false, saveAsImage: false, saveToActiveFile: false, loadScene: false, toggleTheme: false } }}
      onChange={(elements, appState, files) => {
        // O Excalidraw avisa também de seleção e câmera: só interessa quando o desenho ou as imagens mudam.
        const current = `${getSceneVersion(elements)}:${Object.keys(files).length}`;
        const first = version.current === null;
        if (version.current === current) return;
        version.current = current;
        if (!first) onChange(serializeAsJSON(elements, appState, files, "local"));
      }} />
  </div>;
}
