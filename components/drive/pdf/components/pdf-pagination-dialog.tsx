import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { RiCloseLine, RiImageAddLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { type Family, fillTokens, type Logo, type Slots, type StampOptions, type Typography } from "../pdf-stamp";

type Field = `${"header" | "footer"}.${keyof Slots}` | "watermark";
const EMPTY: Slots = { left: "", center: "", right: "" };
const TOKENS = [["{p}", "nº da página"], ["{t}", "total"], ["{data}", "data"], ["{arquivo}", "nome"]] as const;
const PRESETS: { label: string; header?: Slots; footer: Slots }[] = [
  { label: "Número no centro", footer: { left: "", center: "{p}", right: "" } },
  { label: "Página X de Y", footer: { left: "", center: "", right: "Página {p} de {t}" } },
  { label: "Nome e número", header: { left: "{arquivo}", center: "", right: "{data}" }, footer: { left: "", center: "", right: "{p}" } },
];
const ALIGNS: [keyof Slots, string][] = [["left", "Esquerda"], ["center", "Centro"], ["right", "Direita"]];
const FAMILIES: [Family, string, string][] = [["helvetica", "Sem serifa", "Helvetica, Arial, sans-serif"], ["times", "Com serifa", "'Times New Roman', Times, serif"], ["courier", "Monoespaçada", "'Courier New', Courier, monospace"], ["custom", "Fonte própria…", "inherit"]];

// Cabeçalho e rodapé no estilo do Acrobat/Word: textos, logo, número de página, linhas e marca-d'água em todas as páginas.
export function PdfPaginationDialog({ open, name, pageCount, busy, onOpenChange, onApply }: {
  open: boolean;
  name: string;
  pageCount: number;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (options: StampOptions) => void;
}) {
  const [options, setOptions] = useState<StampOptions>({ typography: { family: "helvetica", bold: false, italic: false, custom: null, color: "#404040" }, lineColor: "#999999", watermarkColor: "#808080", watermarkOpacity: 0.18, header: EMPTY, logo: null, lines: false, footer: { ...EMPTY, center: "{p}" }, watermark: "", size: 10, marginMm: 12, firstNumber: 1, fromPage: 1, name });
  const [logoUrl, setLogoUrl] = useState("");
  const focused = useRef<{ field: Field; input: HTMLInputElement } | null>(null);
  const logoPicker = useRef<HTMLInputElement>(null);
  const fontPicker = useRef<HTMLInputElement>(null);
  const [fontFace, setFontFace] = useState("");

  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const type = file.type === "image/png" ? "png" : "jpg";
    const bytes = new Uint8Array(await file.arrayBuffer());
    setLogoUrl(URL.createObjectURL(file));
    setOptions((current) => ({ ...current, logo: { bytes, type, align: current.logo?.align ?? "left", heightMm: current.logo?.heightMm ?? 12 } }));
  }
  function setType(change: Partial<Typography>) {
    setOptions((current) => ({ ...current, typography: { ...current.typography, ...change } }));
  }
  async function chooseFont(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Carrega a fonte também na página, para a prévia mostrar como vai ficar.
    const face = `pdf-preview-${crypto.randomUUID()}`;
    try {
      const loaded = await new FontFace(face, bytes.slice().buffer).load();
      document.fonts.add(loaded);
      setFontFace(face);
    } catch {
      setFontFace("");
    }
    setType({ family: "custom", custom: { bytes, name: file.name.replace(/\.(ttf|otf)$/i, "") } });
  }
  function setLogo(change: Partial<Logo>) {
    setOptions((current) => current.logo ? { ...current, logo: { ...current.logo, ...change } } : current);
  }

  const valueOf = (field: Field) => {
    if (field === "watermark") return options.watermark;
    const [part, align] = field.split(".") as ["header" | "footer", keyof Slots];
    return options[part][align];
  };
  function setField(field: Field, value: string) {
    if (field === "watermark") { setOptions((current) => ({ ...current, watermark: value })); return; }
    const [part, align] = field.split(".") as ["header" | "footer", keyof Slots];
    setOptions((current) => ({ ...current, [part]: { ...current[part], [align]: value } }));
  }
  function insertToken(token: string) {
    const target = focused.current ?? { field: "footer.center" as Field, input: null };
    const value = valueOf(target.field);
    const start = target.input?.selectionStart ?? value.length;
    const end = target.input?.selectionEnd ?? value.length;
    setField(target.field, value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => { target.input?.focus(); target.input?.setSelectionRange(start + token.length, start + token.length); });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    onApply({ ...options, name });
  }

  const field = (key: Field, label: string) => (
    <Label key={key} className="min-w-0 text-xs font-normal text-muted-foreground">{label}
      <Input value={valueOf(key)} onChange={(event) => setField(key, event.target.value)} onFocus={(event) => { focused.current = { field: key, input: event.currentTarget }; }} className="h-8 text-sm text-foreground" />
    </Label>
  );
  const number = (label: string, value: number, min: number, max: number, change: (value: number) => void) => (
    <Label className="text-xs font-normal text-muted-foreground">{label}
      <Input type="number" min={min} max={max} value={value} onChange={(event) => change(Math.min(max, Math.max(min, Number(event.target.value) || min)))} className="h-8 text-sm text-foreground" />
    </Label>
  );
  const sample = { page: options.firstNumber, total: options.firstNumber + Math.max(0, pageCount - options.fromPage), name };
  const preview = (text: string) => fillTokens(text, sample);
  const { typography } = options;
  const previewFont = typography.family === "custom" ? (fontFace ? `'${fontFace}'` : "inherit") : FAMILIES.find(([family]) => family === typography.family)![2];
  const previewStyle = { fontFamily: previewFont, fontWeight: typography.bold && typography.family !== "custom" ? 700 : 400, fontStyle: typography.italic && typography.family !== "custom" ? "italic" : "normal", color: typography.color };
  const hasContent = !!options.logo || [...Object.values(options.header), ...Object.values(options.footer), options.watermark].some((text) => text.trim());

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cabeçalho e rodapé</DialogTitle>
          <DialogDescription>Textos, logo e número de página em todas as páginas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => <Button key={preset.label} type="button" variant="outline" size="sm" onClick={() => setOptions((current) => ({ ...current, header: preset.header ?? EMPTY, footer: preset.footer }))}>{preset.label}</Button>)}
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_9rem]">
            <div className="grid content-start gap-3">
              <fieldset className="grid gap-1.5"><legend className="mb-1 text-sm font-medium">Cabeçalho</legend><div className="grid grid-cols-3 gap-2">{ALIGNS.map(([align, label]) => field(`header.${align}`, label))}</div></fieldset>
              <div className="flex flex-wrap items-end gap-2">
                <input ref={logoPicker} type="file" hidden accept="image/png,image/jpeg" onChange={(event) => void chooseLogo(event)} />
                {options.logo ? <>
                  <img src={logoUrl} alt="Logo" className="h-8 max-w-24 rounded border object-contain" />
                  <Label className="text-xs font-normal text-muted-foreground">Logo
                    <NativeSelect aria-label="Posição da logo" value={options.logo.align} onChange={(event) => setLogo({ align: event.target.value as keyof Slots })} className="h-8 text-sm text-foreground">
                      {ALIGNS.map(([align, label]) => <option key={align} value={align}>{label}</option>)}
                    </NativeSelect>
                  </Label>
                  {number("Altura (mm)", options.logo.heightMm, 4, 40, (heightMm) => setLogo({ heightMm }))}
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Tirar logo" title="Tirar logo" onClick={() => { setOptions((current) => ({ ...current, logo: null })); setLogoUrl(""); }}><RiCloseLine /></Button>
                </> : <Button type="button" variant="outline" size="sm" onClick={() => logoPicker.current?.click()}><RiImageAddLine className="size-4" />Logo no cabeçalho</Button>}
              </div>
              <fieldset className="grid gap-1.5"><legend className="mb-1 text-sm font-medium">Rodapé</legend><div className="grid grid-cols-3 gap-2">{ALIGNS.map(([align, label]) => field(`footer.${align}`, label))}</div></fieldset>
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                {field("watermark", "Marca-d'água")}
                <label className="flex h-8 items-center gap-2 text-sm"><input type="checkbox" checked={options.lines} onChange={(event) => setOptions((current) => ({ ...current, lines: event.target.checked }))} className="size-4" />Linhas</label>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <input ref={fontPicker} type="file" hidden accept=".ttf,.otf,font/ttf,font/otf" onChange={(event) => void chooseFont(event)} />
                <Label className="text-xs font-normal text-muted-foreground">Fonte
                  <NativeSelect aria-label="Fonte" value={typography.family} onChange={(event) => { const family = event.target.value as Family; if (family === "custom" && !typography.custom) fontPicker.current?.click(); else setType({ family }); }} className="h-8 text-sm text-foreground">
                    {FAMILIES.map(([family, label]) => <option key={family} value={family}>{family === "custom" && typography.custom ? typography.custom.name : label}</option>)}
                  </NativeSelect>
                </Label>
                {typography.family !== "custom" ? <>
                  <Button type="button" variant={typography.bold ? "secondary" : "outline"} size="icon-sm" aria-label="Negrito" title="Negrito" aria-pressed={typography.bold} onClick={() => setType({ bold: !typography.bold })} className="font-bold">N</Button>
                  <Button type="button" variant={typography.italic ? "secondary" : "outline"} size="icon-sm" aria-label="Itálico" title="Itálico" aria-pressed={typography.italic} onClick={() => setType({ italic: !typography.italic })} className="italic">I</Button>
                </> : <Button type="button" variant="outline" size="sm" onClick={() => fontPicker.current?.click()}>Trocar arquivo</Button>}
                <Label className="text-xs font-normal text-muted-foreground">Texto<input type="color" aria-label="Cor do texto" value={typography.color} onChange={(event) => setType({ color: event.target.value })} className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5" /></Label>
                {options.lines && <Label className="text-xs font-normal text-muted-foreground">Linhas<input type="color" aria-label="Cor das linhas" value={options.lineColor} onChange={(event) => setOptions((current) => ({ ...current, lineColor: event.target.value }))} className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5" /></Label>}
                {options.watermark.trim() && <>
                  <Label className="text-xs font-normal text-muted-foreground">Marca<input type="color" aria-label="Cor da marca-d'água" value={options.watermarkColor} onChange={(event) => setOptions((current) => ({ ...current, watermarkColor: event.target.value }))} className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5" /></Label>
                  {number("Opacidade (%)", Math.round(options.watermarkOpacity * 100), 5, 100, (value) => setOptions((current) => ({ ...current, watermarkOpacity: value / 100 })))}
                </>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Inserir:</span>
                {TOKENS.map(([token, label]) => <button key={token} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertToken(token)} className="rounded-md border px-1.5 py-0.5 text-xs hover:bg-muted" title={`Inserir ${label}`}>{label}</button>)}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {number("Tamanho (pt)", options.size, 6, 36, (size) => setOptions((current) => ({ ...current, size })))}
                {number("Margem (mm)", options.marginMm, 3, 40, (marginMm) => setOptions((current) => ({ ...current, marginMm })))}
                {number("Primeiro nº", options.firstNumber, 0, 9999, (firstNumber) => setOptions((current) => ({ ...current, firstNumber })))}
                {number("Da página", options.fromPage, 1, Math.max(1, pageCount), (fromPage) => setOptions((current) => ({ ...current, fromPage })))}
              </div>
            </div>
            <div aria-label="Prévia" style={previewStyle} className="relative mx-auto aspect-[210/297] w-36 overflow-hidden rounded-sm border bg-white text-[6px] leading-none shadow-sm max-md:hidden">
              {options.logo && logoUrl && <img src={logoUrl} alt="" className={`absolute top-2 h-3 object-contain ${options.logo.align === "left" ? "left-2" : options.logo.align === "right" ? "right-2" : "inset-x-0 mx-auto"}`} />}
              {options.lines && <><span className="absolute inset-x-2 top-[1.15rem] h-px" style={{ background: options.lineColor }} /><span className="absolute inset-x-2 bottom-[0.9rem] h-px" style={{ background: options.lineColor }} /></>}
              {(["header", "footer"] as const).map((part) => ALIGNS.map(([align]) => {
                if (part === "header" && options.logo?.align === align) return null;
                const text = preview(options[part][align]);
                return text && <span key={`${part}-${align}`} className={`absolute truncate ${align === "left" ? "left-2 text-left" : align === "right" ? "right-2 text-right" : "inset-x-2 text-center"} ${part === "header" ? "top-2" : "bottom-2"}`} style={{ maxWidth: align === "center" ? undefined : "60%" }}>{text}</span>;
              }))}
              {options.watermark && <span className="absolute inset-0 grid place-items-center text-sm font-medium" style={{ transform: "rotate(-54deg)", color: options.watermarkColor, opacity: options.watermarkOpacity }}>{preview(options.watermark)}</span>}
              <span className="absolute inset-x-4 top-6 grid gap-1">{Array.from({ length: 9 }, (_, index) => <span key={index} className="h-0.5 rounded bg-neutral-200" />)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Os textos entram em todas as páginas a partir de “Da página”, que recebe o primeiro número. “total” é o último número. A logo (PNG ou JPG) ocupa a posição escolhida no cabeçalho; os outros textos ficam na altura dela. “Linhas” põe um traço sob o cabeçalho e sobre o rodapé. As três fontes padrão abrem em qualquer leitor de PDF; “Fonte própria” usa um arquivo TTF ou OTF (como a fonte da empresa), que vai junto no PDF com os caracteres usados. Nada muda no arquivo até Salvar.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy || !hasContent}>{busy ? "Aplicando…" : "Aplicar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
