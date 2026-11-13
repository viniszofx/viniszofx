import { defineFontResolver } from "@docx-editor.dev/react";
import { packagedFonts } from "@docx-editor.dev/fonts";
import { googleFonts } from "@docx-editor.dev/fonts/google";
import { read, write } from "@/lib/browser/kv";

const METADATA_API = "https://api.fontsource.org/v1/fonts";
const FONT_FILES = "https://cdn.jsdelivr.net/fontsource/fonts";

// Guarda as fontes no aparelho: quem já abriu um documento com a fonte não baixa de novo, nem precisa de internet.
async function cachedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input instanceof Request ? input.url : input);
  const key = `font-cache:${url}`;
  const saved = await read<ArrayBuffer>(key).catch(() => undefined);
  if (saved) return new Response(saved);
  const response = await fetch(input, init);
  if (response.ok) await write(key, await response.clone().arrayBuffer()).catch(() => {});
  return response;
}

// Fontes comerciais que não existem no Google, exibidas pela equivalente mais próxima. Só muda a tela: o arquivo mantém o nome original.
const EQUIVALENTS: Record<string, string> = {
  "arial nova": "Arimo",
  "arial": "Arimo",
  "helvetica": "Arimo",
  "helvetica neue": "Arimo",
  "times new roman": "Tinos",
  "times": "Tinos",
  "courier new": "Cousine",
  "georgia pro": "Gelasio",
  "georgia": "Gelasio",
  "segoe ui": "Open Sans",
  "verdana": "Noto Sans",
  "tahoma": "Noto Sans",
};

const slugOf = (family: string) => family.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer as ArrayBuffer);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

type FontMetadata = { id: string; family: string; type: string; weights: number[]; styles: string[]; subsets: string[] };

// O catálogo embutido no editor tem poucas famílias; aqui vale qualquer fonte do Google, republicada em TTF pelo Fontsource.
// O nome vindo do arquivo só vira um identificador sem caracteres especiais, e família inexistente responde 404.
async function loadFamily(family: string, signal?: AbortSignal) {
  const slug = slugOf(EQUIVALENTS[family.trim().toLowerCase()] ?? family);
  if (!slug) return [];
  const response = await cachedFetch(`${METADATA_API}/${slug}`, { signal });
  if (!response.ok) return [];
  const metadata = await response.json() as FontMetadata;
  if (metadata.type !== "google" || !metadata.subsets.includes("latin")) return [];
  // Família sem itálico ou sem negrito usa a variante mais próxima; o editor só considera a fonte disponível com as quatro.
  const closestWeight = (weight: number) =>
    [...metadata.weights].sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight))[0];
  const faces = [400, 700].flatMap((weight) => (["normal", "italic"] as const).map((style) => ({
    weight,
    style,
    file: `latin-${closestWeight(weight)}-${metadata.styles.includes(style) ? style : "normal"}.ttf`,
  })));
  const sources = await Promise.all(faces.map(async ({ weight, style, file: name }) => {
    const file = await cachedFetch(`${FONT_FILES}/${metadata.id}@latest/${name}`, { signal });
    if (!file.ok) return null;
    const bytes = new Uint8Array(await file.arrayBuffer());
    return { request: { family, weight, style }, id: `${metadata.id}-${weight}-${style}`, bytes, hash: await sha256(bytes), faceIndex: 0 };
  }));
  return sources.filter((source) => source !== null);
}

async function listGoogleFamilies() {
  const response = await cachedFetch(`${METADATA_API}?type=google&subsets=latin`);
  if (!response.ok) return [];
  const list = await response.json() as { family: string }[];
  return list.map((font) => font.family).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

const anyGoogleFont = defineFontResolver(async ({ families, resolvedFaces, signal }) => {
  const served = new Set((resolvedFaces ?? []).map((face) => face.family.toLowerCase()));
  const missing = families.filter((family) => !served.has(family.toLowerCase()));
  const loaded = await Promise.allSettled(missing.map((family) => loadFamily(family, signal)));
  return {
    sources: loaded.flatMap((result) => result.status === "fulfilled" ? result.value : []),
    // Entra no seletor de fontes do editor, que já tem busca; a família escolhida é baixada na hora.
    supportedFamilies: await listGoogleFamilies().catch(() => []),
  };
});

// Ordem: fontes embutidas, equivalentes do Word (Calibri, Cambria...) e, por fim, o catálogo completo do Google.
export const DOCUMENT_FONTS = [packagedFonts(), googleFonts({ fetcher: cachedFetch as typeof fetch }), anyGoogleFont] as const;
