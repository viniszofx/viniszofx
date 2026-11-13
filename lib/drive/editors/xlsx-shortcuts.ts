import { BorderStyleTypes, BorderType, CommandType, Dimension, FOCUSING_SHEET, HorizontalAlign, ICommandService, RANGE_TYPE, RedoCommand, type FUniver, type IContextService, type IDisposable, type Univer } from "@univerjs/presets";
import { IShortcutService, KeyCode, MetaKeys, whenSheetEditorFocused, type IShortcutItem } from "@univerjs/preset-sheets-core";

// Atalhos do Excel e do Google Planilhas que o Univer não traz, ou traz em outra tecla.
// Valem com a planilha em foco e fora da edição da célula; os do próprio Univer (Ctrl+B, Ctrl+D, F2, F4, Alt+=...) continuam.
const CTRL = MetaKeys.CTRL_COMMAND;
const SHIFT = MetaKeys.SHIFT;
const ALT = MetaKeys.ALT;
// Teclas que o Univer não nomeia.
const PAGE_UP = 33;
const PAGE_DOWN = 34;
const NUMPAD_ADD = 107;
const NUMPAD_SUBTRACT = 109;
const SEMICOLON_US = 186;
const SEMICOLON_ABNT = 191;
const BACK_QUOTE = 192;
// Acima dos atalhos do Univer na mesma tecla (Ctrl+0, Ctrl+=, Ctrl+- e Ctrl+Shift+0 são zoom e ocultar no Univer).
const PRIORITY = 100;

const NUMBER_FORMATS: [number, string][] = [
  [KeyCode.Digit1, "#,##0.00"],
  [KeyCode.Digit2, "hh:mm:ss"],
  [KeyCode.Digit3, "dd/mm/yyyy"],
  [KeyCode.Digit4, "\"R$\" #,##0.00"],
  [KeyCode.Digit5, "0%"],
  [KeyCode.Digit6, "0.00E+00"],
  [BACK_QUOTE, "General"],
];

const inSheet = (context: IContextService) => !!context.getContextValue(FOCUSING_SHEET);
// Número de série do Excel: dias desde 30/12/1899, com a hora como fração do dia.
const serialOf = (date: Date) => (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1899, 11, 30)) / 86_400_000;

// Sem save, a planilha é só para leitura: ficam apenas os atalhos de navegação.
export function registerSheetShortcuts(univer: Univer, univerAPI: FUniver, save?: () => void): IDisposable {
  const injector = univer.__getInjector();
  const commands = injector.get(ICommandService);
  const shortcuts = injector.get(IShortcutService);
  const disposables: IDisposable[] = [];

  const active = () => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook?.getActiveSheet();
    const selection = sheet?.getSelection();
    const cell = selection?.getCurrentCell();
    return workbook && sheet ? { workbook, sheet, selection, row: cell?.actualRow ?? 0, column: cell?.actualColumn ?? 0, range: selection?.getActiveRange() ?? null } : null;
  };
  const goTo = (row: number, column: number) => {
    const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!sheet) return;
    sheet.getRange(Math.max(0, row), Math.max(0, column)).activate();
    sheet.scrollToCell(Math.max(0, row), Math.max(0, column));
  };

  const command = (id: string, handler: () => unknown) => {
    disposables.push(commands.registerCommand({ id: `nodus.sheet.${id}`, type: CommandType.COMMAND, handler: () => { handler(); return true; } }));
  };
  const bind = (id: string, binding: number | number[], options: Partial<IShortcutItem> = {}) => {
    for (const key of Array.isArray(binding) ? binding : [binding]) {
      disposables.push(shortcuts.registerShortcut({ id, binding: key, priority: PRIORITY, preconditions: whenSheetEditorFocused, ...options }));
    }
  };
  const shortcut = (id: string, binding: number | number[], handler: () => unknown, options: Partial<IShortcutItem> = {}) => {
    command(id, handler);
    bind(`nodus.sheet.${id}`, binding, options);
  };

  // Navegação: vale também para quem só pode ler.
  shortcut("go-start", KeyCode.HOME | CTRL, () => goTo(0, 0));
  shortcut("go-end", KeyCode.END | CTRL, () => {
    const sheet = active()?.sheet;
    if (sheet) goTo(sheet.getLastRow(), sheet.getLastColumn());
  });
  shortcut("go-row-start", KeyCode.HOME, () => { const at = active(); if (at) goTo(at.row, 0); });
  const page = (direction: 1 | -1) => {
    const at = active();
    const visible = at?.sheet.getVisibleRange();
    if (!at || !visible) return;
    goTo(Math.min(at.sheet.getMaxRows() - 1, at.row + direction * Math.max(1, visible.endRow - visible.startRow)), at.column);
  };
  shortcut("page-down", PAGE_DOWN, () => page(1));
  shortcut("page-up", PAGE_UP, () => page(-1));
  const wholeLine = (type: RANGE_TYPE.ROW | RANGE_TYPE.COLUMN) => {
    const at = active();
    const range = at?.range?.getRange();
    if (!at || !range) return;
    const rows = type === RANGE_TYPE.ROW;
    at.sheet.getRange({
      startRow: rows ? range.startRow : 0,
      endRow: rows ? range.endRow : at.sheet.getMaxRows() - 1,
      startColumn: rows ? 0 : range.startColumn,
      endColumn: rows ? at.sheet.getMaxColumns() - 1 : range.endColumn,
      rangeType: type,
    }).activate();
  };
  shortcut("select-column", KeyCode.SPACE | CTRL, () => wholeLine(RANGE_TYPE.COLUMN));
  shortcut("select-row", KeyCode.SPACE | SHIFT, () => wholeLine(RANGE_TYPE.ROW));
  // Ctrl+PgDn/PgUp (Excel), Ctrl+Shift+PgDn/PgUp e Alt+↓/↑ (Planilhas): próxima aba e aba anterior.
  const switchSheet = (direction: 1 | -1) => {
    const at = active();
    if (!at) return;
    const sheets = at.workbook.getSheets().filter((sheet) => !sheet.isSheetHidden());
    const index = sheets.findIndex((sheet) => sheet.getSheetId() === at.sheet.getSheetId());
    sheets[index + direction]?.activate();
  };
  shortcut("next-sheet", [PAGE_DOWN | CTRL, PAGE_DOWN | CTRL | SHIFT, KeyCode.ARROW_DOWN | ALT], () => switchSheet(1));
  shortcut("previous-sheet", [PAGE_UP | CTRL, PAGE_UP | CTRL | SHIFT, KeyCode.ARROW_UP | ALT], () => switchSheet(-1));
  // O zoom do Univer fica em Ctrl+Alt+= e Ctrl+Alt+-, como no Excel; Ctrl+= e Ctrl+- inserem e excluem.
  const zoom = (delta: number) => {
    const sheet = active()?.sheet;
    if (sheet) sheet.zoom(Math.min(4, Math.max(0.1, Math.round((sheet.getZoom() + delta) * 10) / 10)));
  };
  shortcut("zoom-in", KeyCode.EQUAL | CTRL | ALT, () => zoom(0.1));
  shortcut("zoom-out", KeyCode.MINUS | CTRL | ALT, () => zoom(-0.1));
  if (!save) return { dispose: () => disposables.forEach((item) => item.dispose()) };

  // Ctrl+S salva, inclusive no meio da edição de uma célula (o salvar termina a edição antes).
  shortcut("save", KeyCode.S | CTRL, save, { preconditions: undefined });

  // Data e hora atuais na célula ativa (Ctrl+; e Ctrl+Shift+;). No teclado ABNT2 o ";" tem outro código de tecla.
  const stamp = (time: boolean) => {
    const at = active();
    if (!at) return;
    const now = new Date();
    const cell = at.sheet.getRange(at.row, at.column);
    cell.setValue(time ? (now.getHours() * 3600 + now.getMinutes() * 60) / 86_400 : serialOf(now));
    cell.setNumberFormat(time ? "hh:mm" : "dd/mm/yyyy");
  };
  shortcut("insert-date", [SEMICOLON_US | CTRL, SEMICOLON_ABNT | CTRL], () => stamp(false), { eventPreconditions: (event) => event.key === ";" });
  shortcut("insert-time", [SEMICOLON_US | CTRL | SHIFT, SEMICOLON_ABNT | CTRL | SHIFT], () => stamp(true), { eventPreconditions: (event) => event.key === ":" });

  // Formatos de número do Excel e do Planilhas: Ctrl+Shift+1 número, 2 hora, 3 data, 4 moeda, 5 porcentagem, 6 científico, ~ geral.
  for (const [key, pattern] of NUMBER_FORMATS) {
    shortcut(`number-format-${key}`, key | CTRL | SHIFT, () => {
      for (const range of active()?.selection?.getActiveRangeList() ?? []) range.setNumberFormat(pattern);
    });
  }

  // Inserir e excluir (Ctrl++ e Ctrl+-, também no teclado numérico e com Alt, como no Planilhas).
  // Linhas ou colunas inteiras selecionadas entram e saem inteiras; células deslocam para baixo ou para cima, o padrão do Excel.
  const insertOrDelete = (insert: boolean) => {
    const at = active();
    const range = at?.range?.getRange();
    if (!at?.range || !range) return;
    const rows = range.endRow - range.startRow + 1;
    const columns = range.endColumn - range.startColumn + 1;
    if (range.rangeType === RANGE_TYPE.ROW) {
      if (insert) at.sheet.insertRowsBefore(range.startRow, rows); else at.sheet.deleteRows(range.startRow, rows);
    } else if (range.rangeType === RANGE_TYPE.COLUMN) {
      if (insert) at.sheet.insertColumnsBefore(range.startColumn, columns); else at.sheet.deleteColumns(range.startColumn, columns);
    } else if (range.rangeType !== RANGE_TYPE.ALL) {
      if (insert) at.range.insertCells(Dimension.ROWS); else at.range.deleteCells(Dimension.ROWS);
    }
  };
  shortcut("insert", [KeyCode.EQUAL | CTRL, KeyCode.EQUAL | CTRL | SHIFT, NUMPAD_ADD | CTRL, KeyCode.EQUAL | CTRL | ALT | SHIFT], () => insertOrDelete(true));
  shortcut("delete", [KeyCode.MINUS | CTRL, NUMPAD_SUBTRACT | CTRL], () => insertOrDelete(false));

  // Nova aba (Shift+F11).
  shortcut("insert-sheet", KeyCode.F11 | SHIFT, () => active()?.workbook.insertSheet().activate());

  // Bordas: contorno com Ctrl+Shift+7 (Excel) ou Alt+Shift+7 (Planilhas); sem bordas com Ctrl+Shift+- ou Alt+Shift+6.
  const border = (type: BorderType) => {
    const at = active();
    if (!at) return;
    void commands.executeCommand("sheet.command.set-border-basic", {
      unitId: at.workbook.getId(),
      subUnitId: at.sheet.getSheetId(),
      ranges: (at.selection?.getActiveRangeList() ?? []).map((range) => range.getRange()),
      value: { type, color: "#000000", style: BorderStyleTypes.THIN },
    });
  };
  shortcut("border-outside", [KeyCode.Digit7 | CTRL | SHIFT, KeyCode.Digit7 | ALT | SHIFT], () => border(BorderType.OUTSIDE));
  shortcut("border-none", [KeyCode.MINUS | CTRL | SHIFT, KeyCode.Digit6 | ALT | SHIFT], () => border(BorderType.NONE));

  // Comandos do próprio Univer em outras teclas.
  bind("sheet.command.set-range-stroke", [KeyCode.Digit5 | CTRL, KeyCode.Digit5 | ALT | SHIFT], { preconditions: inSheet }); // tachado
  bind(RedoCommand.id, KeyCode.Z | CTRL | SHIFT, { preconditions: undefined }); // refazer, como no Planilhas
  bind("sheet.command.set-col-hidden", KeyCode.Digit0 | CTRL); // ocultar colunas
  bind("sheet.command.set-selected-rows-visible", KeyCode.Digit9 | CTRL | SHIFT); // reexibir linhas
  bind("sheet.command.set-selected-cols-visible", KeyCode.Digit0 | CTRL | SHIFT); // reexibir colunas
  bind("sheet.command.paste-value", KeyCode.V | CTRL | SHIFT); // colar só valores
  bind("sheet.command.clear-selection-format", KeyCode.BACK_SLASH | CTRL); // limpar formatação
  for (const [key, value] of [[KeyCode.L, HorizontalAlign.LEFT], [KeyCode.E, HorizontalAlign.CENTER], [KeyCode.R, HorizontalAlign.RIGHT]] as const) {
    bind("sheet.command.set-horizontal-text-align", key | CTRL | SHIFT, { staticParameters: { value } });
  }

  return { dispose: () => disposables.forEach((item) => item.dispose()) };
}
