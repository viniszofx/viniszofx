import type ExcelJS from "exceljs";
import type { IBorderData, IBorderStyleData, ICellData, IColorStyle, IStyleData, IWorkbookData, IWorksheetData, Nullable } from "@univerjs/presets";

// Ponte entre o arquivo XLSX (lido e gravado com ExcelJS) e o modelo do Univer.
// Ao salvar, o arquivo original é atualizado no lugar: imagens, validações e formatação condicional,
// que o editor não mexe, continuam no arquivo.

type Workbook = ExcelJS.Workbook;
type Worksheet = ExcelJS.Worksheet;
type Snapshot = Partial<IWorkbookData> & { sheets: Record<string, Partial<IWorksheetData>>; sheetOrder: string[] };

const loadExcel = () => import("exceljs").then((module) => module.default);

// Larguras do Excel são em caracteres e alturas em pontos; o Univer trabalha em pixels.
const widthToPx = (width: number) => Math.round(width * 7 + 5);
const pxToWidth = (px: number) => Math.max(0, Math.round(((px - 5) / 7) * 100) / 100);
const pointsToPx = (points: number) => Math.round((points * 4) / 3);
const pxToPoints = (px: number) => Math.round(px * 0.75 * 100) / 100;

const DAY = 86_400_000;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const dateToSerial = (date: Date) => (date.getTime() - EXCEL_EPOCH) / DAY;

// Cores do tema padrão do Office, na ordem dos índices que o Excel grava.
const THEME = ["FFFFFF", "000000", "E7E6E6", "44546A", "4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"];

function tinted(hex: string, tint = 0) {
  if (!tint) return `#${hex}`;
  const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16))
    .map((value) => Math.round(tint > 0 ? value + (255 - value) * tint : value * (1 + tint)));
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function colorFrom(color: Partial<ExcelJS.Color> | undefined): IColorStyle | undefined {
  if (!color) return undefined;
  const { argb, theme, tint } = color as { argb?: string; theme?: number; tint?: number };
  if (argb && /^[0-9a-f]{6,8}$/i.test(argb)) return { rgb: `#${argb.slice(-6)}` };
  if (theme != null && THEME[theme]) return { rgb: tinted(THEME[theme], tint) };
  return undefined;
}

const colorTo = (color: Nullable<IColorStyle>) =>
  color?.rgb && /^#?[0-9a-f]{6}$/i.test(color.rgb) ? { argb: `FF${color.rgb.replace("#", "").toUpperCase()}` } : undefined;

const BORDER_IN: Record<string, number> = {
  thin: 1, hair: 2, dotted: 3, dashed: 4, dashDot: 5, dashDotDot: 6, double: 7, medium: 8,
  mediumDashed: 9, mediumDashDot: 10, mediumDashDotDot: 11, slantDashDot: 12, thick: 13,
};
const BORDER_OUT = Object.fromEntries(Object.entries(BORDER_IN).map(([name, value]) => [value, name])) as Record<number, ExcelJS.BorderStyle>;
const HORIZONTAL_IN: Record<string, number> = { left: 1, center: 2, right: 3, justify: 4, distributed: 6, centerContinuous: 2, fill: 1 };
const HORIZONTAL_OUT: Record<number, ExcelJS.Alignment["horizontal"]> = { 1: "left", 2: "center", 3: "right", 4: "justify", 5: "justify", 6: "distributed" };
const VERTICAL_IN: Record<string, number> = { top: 1, middle: 2, bottom: 3, justify: 2, distributed: 2 };
const VERTICAL_OUT: Record<number, ExcelJS.Alignment["vertical"]> = { 1: "top", 2: "middle", 3: "bottom" };

function styleFrom(cell: ExcelJS.Cell): IStyleData | undefined {
  const style: IStyleData = {};
  const { font, fill, alignment, border, numFmt } = cell;
  if (font) {
    if (font.name) style.ff = font.name;
    if (font.size) style.fs = font.size;
    if (font.bold) style.bl = 1;
    if (font.italic) style.it = 1;
    if (font.underline) style.ul = { s: 1 };
    if (font.strike) style.st = { s: 1 };
    const color = colorFrom(font.color);
    if (color) style.cl = color;
  }
  if (fill?.type === "pattern" && fill.pattern === "solid") {
    const color = colorFrom(fill.fgColor);
    if (color) style.bg = color;
  }
  if (alignment) {
    if (alignment.horizontal && HORIZONTAL_IN[alignment.horizontal]) style.ht = HORIZONTAL_IN[alignment.horizontal];
    if (alignment.vertical && VERTICAL_IN[alignment.vertical]) style.vt = VERTICAL_IN[alignment.vertical];
    if (alignment.wrapText) style.tb = 3;
    if (typeof alignment.textRotation === "number" && alignment.textRotation) style.tr = { a: alignment.textRotation, v: 0 };
  }
  if (border) {
    const sides: IBorderData = {};
    for (const [from, to] of [["top", "t"], ["right", "r"], ["bottom", "b"], ["left", "l"]] as const) {
      const side = border[from];
      if (side?.style && BORDER_IN[side.style]) sides[to] = { s: BORDER_IN[side.style], cl: colorFrom(side.color) ?? { rgb: "#000000" } };
    }
    if (Object.keys(sides).length) style.bd = sides;
  }
  if (numFmt && numFmt !== "General") style.n = { pattern: numFmt };
  return Object.keys(style).length ? style : undefined;
}

function plainText(value: ExcelJS.CellValue): string {
  if (value && typeof value === "object") {
    if ("richText" in value) return value.richText.map((run) => run.text).join("");
    if ("text" in value) return typeof value.text === "string" ? value.text : plainText(value.text as ExcelJS.CellValue);
    if ("error" in value) return String(value.error);
  }
  return value == null ? "" : String(value);
}

function cellFrom(cell: ExcelJS.Cell): ICellData | undefined {
  const data: ICellData = {};
  const style = styleFrom(cell);
  if (style) data.s = style;
  const value = cell.value;
  if (cell.type === 6 /* Formula */) {
    const formula = cell.formula;
    if (formula) data.f = `=${formula}`;
    const result = (value as { result?: unknown })?.result;
    if (typeof result === "number" || typeof result === "string" || typeof result === "boolean") data.v = result;
    else if (result instanceof Date) data.v = dateToSerial(result);
  } else if (value instanceof Date) {
    data.v = dateToSerial(value);
    data.t = 2;
    // Data sem formato no arquivo apareceria como número.
    if (!style?.n) data.s = { ...style, n: { pattern: "dd/mm/yyyy" } };
  } else if (typeof value === "number") {
    data.v = value;
    data.t = 2;
  } else if (typeof value === "boolean") {
    data.v = value ? 1 : 0;
    data.t = 3;
  } else if (value != null) {
    data.v = plainText(value);
    data.t = 1;
  }
  return Object.keys(data).length ? data : undefined;
}

function decodeAddress(address: string) {
  const match = /^([A-Z]+)(\d+)$/.exec(address.replace(/\$/g, ""));
  if (!match) return null;
  const column = match[1].split("").reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  return { row: Number(match[2]) - 1, column };
}

function sheetFrom(sheet: Worksheet, id: string): Partial<IWorksheetData> {
  const cellData: Record<number, Record<number, ICellData>> = {};
  let lastRow = 0;
  let lastColumn = 0;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Células vazias com formatação (borda, cor) também contam.
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      // Células mescladas guardam o conteúdo só na primeira; as demais ficam vazias.
      if (cell.isMerged && cell.master !== cell) return;
      const data = cellFrom(cell);
      if (!data) return;
      (cellData[rowNumber - 1] ??= {})[columnNumber - 1] = data;
      lastRow = Math.max(lastRow, rowNumber);
      lastColumn = Math.max(lastColumn, columnNumber);
    });
  });
  const rowData: Record<number, { h?: number; hd?: 0 | 1; ia?: 0 | 1 }> = {};
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const entry: { h?: number; hd?: 0 | 1; ia?: 0 | 1 } = {};
    if (row.height) { entry.h = pointsToPx(row.height); entry.ia = 0; }
    if (row.hidden) entry.hd = 1;
    if (Object.keys(entry).length) rowData[rowNumber - 1] = entry;
  });
  const columnData: Record<number, { w?: number; hd?: 0 | 1 }> = {};
  (sheet.columns ?? []).forEach((column, index) => {
    const entry: { w?: number; hd?: 0 | 1 } = {};
    if (column.width) entry.w = widthToPx(column.width);
    if (column.hidden) entry.hd = 1;
    if (Object.keys(entry).length) columnData[index] = entry;
  });
  const mergeData = ((sheet.model as { merges?: string[] }).merges ?? []).flatMap((range) => {
    const [start, end] = range.split(":").map(decodeAddress);
    return start && end ? [{ startRow: start.row, startColumn: start.column, endRow: end.row, endColumn: end.column }] : [];
  });
  const view = sheet.views?.[0] as { state?: string; xSplit?: number; ySplit?: number; showGridLines?: boolean } | undefined;
  const frozen = view?.state === "frozen" ? { xSplit: view.xSplit ?? 0, ySplit: view.ySplit ?? 0 } : null;
  const tab = colorFrom(sheet.properties?.tabColor);
  return {
    id,
    name: sheet.name,
    hidden: sheet.state === "visible" || !sheet.state ? 0 : sheet.state === "veryHidden" ? 2 : 1,
    tabColor: tab?.rgb ?? "",
    rowCount: Math.max(1000, lastRow + 100),
    columnCount: Math.max(26, lastColumn + 10),
    defaultColumnWidth: widthToPx(sheet.properties?.defaultColWidth ?? 8.43),
    defaultRowHeight: pointsToPx(sheet.properties?.defaultRowHeight ?? 15),
    cellData,
    rowData,
    columnData,
    mergeData,
    showGridlines: view?.showGridLines === false ? 0 : 1,
    ...(frozen && (frozen.xSplit || frozen.ySplit)
      ? { freeze: { xSplit: frozen.xSplit, ySplit: frozen.ySplit, startRow: frozen.ySplit, startColumn: frozen.xSplit } }
      : {}),
  };
}

export async function xlsxToUniver(file: Blob, name: string): Promise<Snapshot> {
  const Excel = await loadExcel();
  const book = new Excel.Workbook();
  if (file.size) await book.xlsx.load(await file.arrayBuffer());
  const sheets: Snapshot["sheets"] = {};
  const sheetOrder: string[] = [];
  for (const sheet of book.worksheets) {
    // O id liga a aba do editor à aba do arquivo na hora de salvar.
    const id = `xlsx-${sheet.id}`;
    sheets[id] = sheetFrom(sheet, id);
    sheetOrder.push(id);
  }
  if (!sheetOrder.length) {
    sheets["xlsx-new-1"] = { id: "xlsx-new-1", name: "Planilha 1", rowCount: 1000, columnCount: 26 };
    sheetOrder.push("xlsx-new-1");
  }
  return { id: crypto.randomUUID(), name, sheetOrder, sheets, styles: {} };
}

function borderTo(side: Nullable<IBorderStyleData>): Partial<ExcelJS.Border> | undefined {
  if (!side || !side.s || !BORDER_OUT[side.s]) return undefined;
  return { style: BORDER_OUT[side.s], color: colorTo(side.cl) ?? { argb: "FF000000" } };
}

function applyStyle(cell: ExcelJS.Cell, style: Nullable<IStyleData>) {
  cell.style = {};
  if (!style) return;
  const font: Partial<ExcelJS.Font> = {};
  if (style.ff) font.name = style.ff;
  if (style.fs) font.size = style.fs;
  if (style.bl) font.bold = true;
  if (style.it) font.italic = true;
  if (style.ul?.s) font.underline = true;
  if (style.st?.s) font.strike = true;
  const color = colorTo(style.cl);
  if (color) font.color = color;
  if (Object.keys(font).length) cell.font = font;
  const background = colorTo(style.bg);
  if (background) cell.fill = { type: "pattern", pattern: "solid", fgColor: background };
  const alignment: Partial<ExcelJS.Alignment> = {};
  if (style.ht && HORIZONTAL_OUT[style.ht]) alignment.horizontal = HORIZONTAL_OUT[style.ht];
  if (style.vt && VERTICAL_OUT[style.vt]) alignment.vertical = VERTICAL_OUT[style.vt];
  if (style.tb === 3) alignment.wrapText = true;
  if (style.tr?.a) alignment.textRotation = style.tr.a;
  if (Object.keys(alignment).length) cell.alignment = alignment;
  if (style.bd) {
    const border: Partial<ExcelJS.Borders> = {};
    const top = borderTo(style.bd.t), right = borderTo(style.bd.r), bottom = borderTo(style.bd.b), left = borderTo(style.bd.l);
    if (top) border.top = top;
    if (right) border.right = right;
    if (bottom) border.bottom = bottom;
    if (left) border.left = left;
    if (Object.keys(border).length) cell.border = border;
  }
  if (style.n?.pattern) cell.numFmt = style.n.pattern;
}

function cellText(cell: ICellData) {
  // Texto com formatação parcial (rich text) vira texto simples no arquivo.
  const stream = cell.p?.body?.dataStream;
  return stream ? stream.replace(/\r?\n$/, "").replace(/\r/g, "\n") : cell.v;
}

function writeSheet(target: Worksheet, sheet: Partial<IWorksheetData>, styles: Record<string, Nullable<IStyleData>>, formulas: string[][]) {
  const resolve = (style: ICellData["s"]) => typeof style === "string" ? styles[style] : style;
  // Limpa o conteúdo anterior da aba antes de gravar o estado do editor.
  for (const range of (target.model as { merges?: string[] }).merges ?? []) target.unMergeCells(range);
  target.eachRow({ includeEmpty: false }, (row) => row.eachCell({ includeEmpty: true }, (cell) => {
    cell.value = null;
    cell.style = {};
  }));
  target.name = sheet.name ?? target.name;
  for (const [rowKey, columns] of Object.entries(sheet.cellData ?? {}) as [string, Record<string, Nullable<ICellData>>][]) {
    const row = Number(rowKey);
    for (const [columnKey, data] of Object.entries(columns ?? {})) {
      const column = Number(columnKey);
      if (!data) continue;
      const cell = target.getCell(row + 1, column + 1);
      const formula = formulas[row]?.[column] || data.f || "";
      const value = cellText(data);
      if (formula.startsWith("=") && formula.length > 1) {
        cell.value = { formula: formula.slice(1), result: value ?? undefined } as ExcelJS.CellFormulaValue;
      } else if (data.t === 3) {
        cell.value = value === true || value === 1 || value === "TRUE";
      } else if (data.t === 2 || (typeof value === "number" && data.t !== 1 && data.t !== 4)) {
        cell.value = Number(value);
      } else if (value != null && value !== "") {
        cell.value = String(value);
      }
      applyStyle(cell, resolve(data.s));
    }
  }
  for (const merge of sheet.mergeData ?? []) {
    target.mergeCells(merge.startRow + 1, merge.startColumn + 1, merge.endRow + 1, merge.endColumn + 1);
  }
  const defaultWidth = sheet.defaultColumnWidth;
  const defaultHeight = sheet.defaultRowHeight;
  const columnCount = Math.max(target.columnCount, ...Object.keys(sheet.columnData ?? {}).map((key) => Number(key) + 1));
  for (let index = 0; index < columnCount; index++) {
    const data = sheet.columnData?.[index];
    const column = target.getColumn(index + 1);
    column.width = data?.w && data.w !== defaultWidth ? pxToWidth(data.w) : undefined;
    column.hidden = !!data?.hd;
  }
  const rowKeys = new Set([...Object.keys(sheet.rowData ?? {}).map(Number)]);
  target.eachRow({ includeEmpty: true }, (_row, rowNumber) => rowKeys.add(rowNumber - 1));
  for (const index of rowKeys) {
    const data = sheet.rowData?.[index];
    const row = target.getRow(index + 1);
    // Altura ajustada à mão (ia = 0) vai para o arquivo; a automática fica com o Excel.
    row.height = data?.h && data.ia === 0 && data.h !== defaultHeight ? pxToPoints(data.h) : undefined as unknown as number;
    row.hidden = !!data?.hd;
  }
  const freeze = sheet.freeze;
  const view = target.views?.[0] ?? {};
  target.views = [{
    ...view,
    ...(freeze && (freeze.xSplit || freeze.ySplit)
      ? { state: "frozen", xSplit: freeze.xSplit, ySplit: freeze.ySplit }
      : { state: "normal", xSplit: undefined, ySplit: undefined }),
    showGridLines: sheet.showGridlines !== 0,
  } as ExcelJS.WorksheetView];
  target.state = sheet.hidden === 2 ? "veryHidden" : sheet.hidden ? "hidden" : "visible";
  target.properties.tabColor = sheet.tabColor ? colorTo({ rgb: sheet.tabColor }) as ExcelJS.Color : undefined as unknown as ExcelJS.Color;
}

export async function univerToXlsx(snapshot: IWorkbookData, formulas: Record<string, string[][]>, original?: Blob) {
  const Excel = await loadExcel();
  const book: Workbook = new Excel.Workbook();
  if (original?.size) await book.xlsx.load(await original.arrayBuffer());
  const keep = new Set<number>();
  const styles = snapshot.styles ?? {};
  snapshot.sheetOrder.forEach((id, index) => {
    const sheet = snapshot.sheets[id];
    if (!sheet) return;
    const existing = /^xlsx-(\d+)$/.exec(id) ? book.getWorksheet(Number(id.slice(5))) : undefined;
    // Nome repetido seria recusado pelo ExcelJS; a aba nova recebe um nome provisório antes de ser renomeada.
    const target = existing ?? book.addWorksheet(`nodus-${crypto.randomUUID().slice(0, 8)}`);
    keep.add(target.id);
    writeSheet(target, sheet, styles, formulas[id] ?? []);
    // A ordem das abas no arquivo segue orderNo, que a tipagem do ExcelJS não expõe.
    (target as Worksheet & { orderNo: number }).orderNo = index;
  });
  for (const sheet of [...book.worksheets]) if (!keep.has(sheet.id)) book.removeWorksheet(sheet.id);
  // A primeira aba visível abre selecionada, como no Excel.
  book.views = [{ ...(book.views?.[0] ?? {}), activeTab: 0, firstSheet: 0 } as ExcelJS.WorkbookView];
  return new Uint8Array(await book.xlsx.writeBuffer());
}
