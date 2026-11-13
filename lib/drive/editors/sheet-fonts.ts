import type { ICellData, IStyleData, IWorkbookData, IWorksheetData, Nullable } from "@univerjs/presets";

// A planilha desenha o texto com o nome de fonte gravado em cada célula; sem a fonte no aparelho, cairia numa padrão.
// Cada fonte usada no arquivo é registrada com esse mesmo nome: primeiro a instalada no aparelho, depois a do Google Fonts
// (a equivalente livre, no caso das fontes do Office). Só muda a tela: o arquivo mantém o nome original.
const GOOGLE_FONTS = "https://fonts.googleapis.com/css2";
const EQUIVALENTS: Record<string, string> = {
  "calibri": "Carlito",
  "calibri light": "Carlito",
  "cambria": "Caladea",
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
const MAX_FAMILIES = 12;
// Texto de amostra: o navegador baixa só as partes da fonte com estes caracteres (latim com acentos).
const SAMPLE = "AaÇçÃãÉéÕõ0123";
const registered = new Map<string, Promise<boolean>>();

type Snapshot = Partial<IWorkbookData> & { sheets: Record<string, Partial<IWorksheetData>> };

export function sheetFamilies(snapshot: Snapshot) {
  const families = new Set<string>();
  const add = (style: Nullable<IStyleData> | string | undefined) => {
    const resolved = typeof style === "string" ? snapshot.styles?.[style] : style;
    if (resolved?.ff) families.add(resolved.ff.trim());
  };
  Object.values(snapshot.styles ?? {}).forEach(add);
  for (const sheet of Object.values(snapshot.sheets)) {
    for (const row of Object.values(sheet.cellData ?? {})) {
      for (const cell of Object.values(row ?? {}) as Nullable<ICellData>[]) add(cell?.s ?? undefined);
    }
  }
  return [...families].filter((family) => family && !/^(symbol|wingdings|webdings|marlett)/i.test(family)).slice(0, MAX_FAMILIES);
}

const quote = (family: string) => `"${family.replace(/["\\]/g, "")}"`;

async function register(family: string) {
  const google = EQUIVALENTS[family.toLowerCase()] ?? family;
  // O nome vem do arquivo: só letras, números, espaço e hífen chegam à API.
  if (!/^[\p{L}\p{N} -]+$/u.test(google)) return false;
  const name = encodeURIComponent(google).replace(/%20/g, "+");
  let css = "";
  // Pede as quatro variantes; família que não tem nenhuma delas responde 400 e vai sem eixos.
  for (const query of [`family=${name}:ital,wght@0,400;0,700;1,400;1,700`, `family=${name}`]) {
    const response = await fetch(`${GOOGLE_FONTS}?${query}`);
    if (response.ok) { css = await response.text(); break; }
  }
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].flatMap(([, block]) => {
    const url = block.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url?.startsWith("https://fonts.gstatic.com/")) return [];
    return [new FontFace(family, `local(${quote(family)}), url(${url})`, {
      style: block.match(/font-style:\s*(\w+)/)?.[1] ?? "normal",
      weight: block.match(/font-weight:\s*(\d+)/)?.[1] ?? "400",
      unicodeRange: block.match(/unicode-range:\s*([^;]+)/)?.[1]?.trim() ?? "U+0-10FFFF",
    })];
  });
  if (!faces.length) return false;
  faces.forEach((face) => document.fonts.add(face));
  await Promise.all(["400 normal", "700 normal", "400 italic", "700 italic"].map((variant) => {
    const [weight, style] = variant.split(" ");
    return document.fonts.load(`${style} ${weight} 16px ${quote(family)}`, SAMPLE).catch(() => []);
  }));
  return true;
}

// Carrega as fontes do arquivo; responde se alguma fonte nova entrou (aí a planilha precisa redesenhar o texto).
export async function loadSheetFonts(families: string[]) {
  const results = await Promise.all(families.map((family) => {
    const key = family.toLowerCase();
    let pending = registered.get(key);
    if (!pending) {
      pending = register(family).catch(() => false);
      registered.set(key, pending);
      // Falha de rede não fica guardada: a próxima abertura tenta de novo.
      pending.then((ok) => { if (!ok) registered.delete(key); });
    }
    return pending;
  }));
  return results.some(Boolean);
}
