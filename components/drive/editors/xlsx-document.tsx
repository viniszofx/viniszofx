"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createUniver, LocaleType, mergeLocales, CommandType, type FUniver, type IWorkbookData } from "@univerjs/presets";
import { FontCategory, IFontService, invalidateDocumentFontMetrics, UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import sheetsPtBR from "@univerjs/preset-sheets-core/locales/pt-BR";
import { UniverSheetsFindReplacePreset } from "@univerjs/preset-sheets-find-replace";
import findReplacePtBR from "@univerjs/preset-sheets-find-replace/locales/pt-BR";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs/preset-sheets-find-replace/lib/index.css";
import { RiDownloadLine, RiSaveLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Switch } from "@/components/ui/switch";
import { LoadingBlock as LoadingSkeleton } from "@/components/ui/feedback";
import { saveBlob } from "@/lib/drive/files";
import { toExcelFormula } from "@/lib/drive/editors/excel-formulas";
import { loadSheetFonts, sheetFamilies } from "@/lib/drive/editors/sheet-fonts";
import { registerSheetShortcuts } from "@/lib/drive/editors/xlsx-shortcuts";
import { univerToXlsx, xlsxToUniver } from "@/lib/drive/editors/xlsx-univer";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const AUTO_SAVE_KEY = "nodus:xlsx-auto-save";
const AUTO_SAVE_DELAY = 1500;
// Só mutações da planilha contam como edição (valores, estilos, linhas, abas, inclusive desfazer);
// o editor interno de texto e o cálculo de fórmulas disparam outros comandos ao abrir.
const EDIT = /^sheet\.mutation\./;
const VIEW_ONLY = /activate|selection|scroll|zoom/i;
// Tempo que a abertura espera as fontes do arquivo; depois disso abre e redesenha quando elas chegarem.
const FONT_WAIT = 2500;

function savedPreference() {
  try { return localStorage.getItem(AUTO_SAVE_KEY) === "on"; } catch { return false; }
}

// Formulas de todas as abas, já com referências relativas resolvidas (fórmulas copiadas ficam só com um id no modelo).
function collectFormulas(api: FUniver) {
  const workbook = api.getActiveWorkbook();
  const result: Record<string, string[][]> = {};
  for (const sheet of workbook?.getSheets() ?? []) {
    const rows = sheet.getLastRow() + 1;
    const columns = sheet.getLastColumn() + 1;
    if (rows > 0 && columns > 0) result[sheet.getSheetId()] = sheet.getRange(0, 0, rows, columns).getFormulas();
  }
  return result;
}

// Editor de planilhas do Drive (Univer). Sem onSave, abre só para leitura.
export function XlsxDocument({ file, name, onSave, leading }: {
  leading?: React.ReactNode;
  file: Blob;
  name: string;
  onSave?: (edited: Blob, automatic: boolean) => Promise<void>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const api = useRef<FUniver | null>(null);
  const saving = useRef(false);
  const revision = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  // Estado de abertura e de alterações guardado por arquivo: trocar de arquivo já começa limpo.
  const [openedFile, setOpenedFile] = useState<Blob | null>(null);
  const [failedFile, setFailedFile] = useState<Blob | null>(null);
  const [dirtyFile, setDirtyFile] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoSave, setAutoSave] = useState(savedPreference);
  const [savedAt, setSavedAt] = useState<Date>();
  const [error, setError] = useState("");
  const loaded = openedFile === file;
  const dirty = dirtyFile === file;
  const editable = !!onSave;
  const autoSaveRef = useRef(autoSave);
  const saveRef = useRef<(automatic: boolean) => Promise<void>>(async () => {});
  const saveShortcutRef = useRef(() => {});

  useEffect(() => {
    let active = true;
    let dispose: (() => void) | undefined;
    revision.current = 0;
    void xlsxToUniver(file, name).then(async (snapshot) => {
      const families = sheetFamilies(snapshot);
      const fonts = loadSheetFonts(families);
      const fontsInTime = await Promise.race([fonts.then(() => true), new Promise<boolean>((resolve) => window.setTimeout(resolve, FONT_WAIT, false))]);
      if (!active || !container.current) return;
      const { univer, univerAPI } = createUniver({
        locale: LocaleType.PT_BR,
        locales: { [LocaleType.PT_BR]: mergeLocales(sheetsPtBR, findReplacePtBR) },
        presets: [
          UniverSheetsCorePreset({
            container: container.current,
            header: editable,
            toolbar: editable,
            contextMenu: editable,
            footer: { sheetBar: true, statisticBar: true, zoomSlider: true, menus: editable },
          }),
          UniverSheetsFindReplacePreset(),
        ],
      });
      api.current = univerAPI;
      const workbook = univerAPI.createWorkbook({ ...snapshot, locale: LocaleType.PT_BR });
      if (!editable) void workbook.getWorkbookPermission().setReadOnly();
      // Fontes do arquivo entram no seletor de fontes, junto das que o editor já lista.
      const listed = new Set(univer.__getInjector().get(IFontService).getFonts().map((font) => font.value.toLowerCase()));
      univerAPI.addFonts(families.filter((family) => !listed.has(family.toLowerCase())).map((family) => ({ value: family, label: family, category: FontCategory.SANS_SERIF })));
      if (!fontsInTime) {
        void fonts.then((changed) => {
          if (!active || !changed) return;
          invalidateDocumentFontMetrics(() => true);
          univerAPI.getActiveWorkbook()?.getActiveSheet().refreshCanvas();
        });
      }
      const subscriptions = [
        registerSheetShortcuts(univer, univerAPI, editable ? () => saveShortcutRef.current() : undefined),
        univerAPI.addEvent(univerAPI.Event.CommandExecuted, (command) => {
          if (command.type !== CommandType.MUTATION || !EDIT.test(command.id) || VIEW_ONLY.test(command.id)) return;
          revision.current++;
          setDirtyFile(file);
          if (autoSaveRef.current) {
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => void saveRef.current(true), AUTO_SAVE_DELAY);
          }
        }),
        // Fórmula digitada como no Excel em português é regravada com os nomes que o arquivo usa.
        univerAPI.addEvent(univerAPI.Event.SheetEditEnded, ({ worksheet, row, column, isConfirm }) => {
          if (!isConfirm) return;
          const range = worksheet.getRange(row, column);
          const typed = range.getFormula() || String(range.getValue() ?? "");
          const formula = toExcelFormula(typed);
          if (formula !== typed) window.setTimeout(() => range.setValue(formula));
        }),
      ];
      dispose = () => {
        subscriptions.forEach((subscription) => subscription.dispose());
        univer.dispose();
      };
      setOpenedFile(file);
    }).catch(() => { if (active) setFailedFile(file); });
    return () => {
      active = false;
      window.clearTimeout(timer.current);
      api.current = null;
      dispose?.();
    };
  }, [file, name, editable]);

  async function exportFile() {
    const univerAPI = api.current;
    const workbook = univerAPI?.getActiveWorkbook();
    if (!univerAPI || !workbook) throw new Error("O editor ainda está carregando.");
    // Termina a edição em andamento para a célula aberta entrar no arquivo.
    await workbook.endEditingAsync(true);
    const snapshot = workbook.save() as IWorkbookData;
    const bytes = await univerToXlsx(snapshot, collectFormulas(univerAPI), file);
    return new Blob([bytes], { type: XLSX_TYPE });
  }

  async function save(automatic: boolean) {
    if (!onSave || saving.current) return;
    saving.current = true;
    const savingRevision = revision.current;
    setBusy(true);
    setError("");
    try {
      await onSave(await exportFile(), automatic);
      setDirtyFile(revision.current !== savingRevision ? file : null);
      setSavedAt(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a planilha.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  // O Univer chama de fora do React; as refs sempre apontam para a versão atual.
  useEffect(() => {
    autoSaveRef.current = autoSave;
    saveRef.current = save;
    saveShortcutRef.current = () => { if (dirty) void save(false); };
  });

  function toggleAutoSave(value: boolean) {
    setAutoSave(value);
    try { localStorage.setItem(AUTO_SAVE_KEY, value ? "on" : "off"); } catch { /* Vale nesta sessão. */ }
    if (value && dirty) void save(true);
  }

  // Ctrl+S com o foco nos botões acima da planilha; dentro dela, o atalho do editor já tratou a tecla.
  function saveShortcut(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key.toLowerCase() !== "s" || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    event.preventDefault();
    if (loaded && dirty) void save(false);
  }

  async function download() {
    setError("");
    try { saveBlob(await exportFile(), name); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível baixar a planilha."); }
  }

  const status = busy ? "Salvando…" : dirty ? "Alterações não salvas" : savedAt ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "";
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card" onKeyDownCapture={onSave ? saveShortcut : undefined}>
      <div className="flex flex-wrap items-center justify-end gap-3 border-b bg-card p-2">
        <div className="mr-auto flex min-w-0 items-center gap-2">{leading}</div>
        <span role="status" className="px-1 text-xs text-muted-foreground">{status}</span>
        {onSave && <Switch checked={autoSave} onChange={toggleAutoSave} label="Salvar automaticamente" disabled={!loaded} />}
        <Button type="button" variant="outline" size="sm" disabled={!loaded || busy} onClick={() => void download()}><RiDownloadLine />Baixar</Button>
        {onSave && <Button type="button" size="sm" disabled={!loaded || !dirty || busy} onClick={() => void save(false)}><RiSaveLine />Salvar</Button>}
      </div>
      <ErrorToast message={failedFile === file ? "Não foi possível abrir esta planilha Excel." : error} />
      {/* O Univer mede o contêiner ao iniciar: ele já existe com tamanho, e o carregamento fica por cima. */}
      <div className="relative min-h-0 flex-1">
        <div ref={container} className="absolute inset-0" />
        {!loaded && failedFile !== file && <div className="absolute inset-0 bg-card"><LoadingSkeleton label="Abrindo editor de planilhas…" /></div>}
      </div>
    </div>
  );
}
