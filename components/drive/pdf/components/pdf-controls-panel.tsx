import type { ComponentType, ReactNode } from "react";
import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiChat1Line,
  RiClockwiseLine,
  RiCursorLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiImageAddLine,
  RiLayoutGridLine,
  RiLayoutTopLine,
  RiMarkPenLine,
  RiPencilLine,
  RiPrinterLine,
  RiSearchLine,
  RiText,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";

export type PanelTool = "select" | "edittext" | "ink" | "highlight" | "text" | "image" | "comment";

const TOOLS: { tool: PanelTool; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { tool: "select", label: "Selecionar", icon: RiCursorLine },
  { tool: "edittext", label: "Editar texto", icon: RiEditLine },
  { tool: "ink", label: "Desenhar", icon: RiPencilLine },
  { tool: "highlight", label: "Realçar", icon: RiMarkPenLine },
  { tool: "text", label: "Texto", icon: RiText },
  { tool: "comment", label: "Comentário", icon: RiChat1Line },
  { tool: "image", label: "Imagem", icon: RiImageAddLine },
];
// Cores rápidas: as do marca-texto são as mesmas da paleta do pdf.js.
const SWATCHES: Record<"ink" | "text" | "highlight", string[]> = {
  ink: ["#111111", "#6b7280", "#e11d48", "#f97316", "#eab308", "#16a34a", "#2563eb", "#7c3aed"],
  text: ["#111111", "#6b7280", "#e11d48", "#f97316", "#eab308", "#16a34a", "#2563eb", "#7c3aed"],
  highlight: ["#ffff98", "#53ffbc", "#80ebff", "#ffcbe6", "#ff4f5f"],
};
const HINTS: Record<PanelTool, string> = {
  select: "Clique numa imagem, desenho ou caixa de texto para editar. Arraste num ponto vazio para selecionar vários itens ou o texto da área.",
  edittext: "Clique numa linha do PDF para mudar o texto dela. Enter confirma, Esc cancela. Apagar tudo remove a linha; digitar o texto original desfaz a edição.",
  ink: "Desenhe sobre a página. Cor, espessura e opacidade valem para o próximo traço e para o traço selecionado.",
  highlight: "Passe sobre o texto para realçar. A cor vale para o próximo realce e para o selecionado.",
  text: "Clique na página para criar uma caixa de texto. Cor e tamanho valem para a próxima caixa e para a selecionada.",
  image: "Arraste a imagem para mover e use os cantos para redimensionar. Clique fora dela para voltar a Selecionar.",
  comment: "Clique num ponto da página ou selecione um trecho para comentar.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="grid gap-2 border-b p-3"><h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>{children}</section>;
}

// Painel da direita com os controles do PDF, no lugar do painel de propriedades do InDesign/Acrobat.
export function PdfControlsPanel(props: {
  tool: PanelTool;
  onTool: (tool: PanelTool) => void;
  color: string | null;
  onColor: (value: string) => void;
  size: { value: number; min: number; max: number; label: string; unit: string } | null;
  onSize: (value: number) => void;
  opacity: number | null;
  onOpacity: (value: number) => void;
  zoom: number;
  onZoom: (percent: number) => void;
  onFitWidth: () => void;
  onRotate: () => void;
  spread: number;
  spreads: [number, string][];
  onSpread: (value: number) => void;
  onAction: (name: "undo" | "redo" | "delete") => void;
  onOrganize: () => void;
  onHeaderFooter: () => void;
  onSearch: () => void;
  onPrint: () => void;
  onDownload: () => void;
  disabled: boolean;
}) {
  const { tool, color, size, opacity, disabled } = props;
  const swatches = tool === "ink" || tool === "text" || tool === "highlight" ? SWATCHES[tool] : [];
  return (
    <div className="grid content-start">
      <Section title="Ferramenta">
        <div className="grid grid-cols-3 gap-1">
          {TOOLS.map(({ tool: entry, label, icon: Icon }) => (
            <button key={entry} type="button" disabled={disabled} aria-pressed={tool === entry} onClick={() => props.onTool(entry)}
              className="grid justify-items-center gap-1 rounded-lg border border-transparent p-2 text-xs hover:bg-muted disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary">
              <Icon className="size-4" />{label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{HINTS[tool]}</p>
      </Section>
      {(color || size || opacity !== null) && (
        <Section title="Aparência">
          {color && <div className="grid gap-1.5">
            <span className="text-xs text-muted-foreground">Cor</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {swatches.map((swatch) => <button key={swatch} type="button" aria-label={`Cor ${swatch}`} title={swatch} onClick={() => props.onColor(swatch)} className={`size-6 rounded-full border shadow-sm ${color.toLowerCase() === swatch ? "ring-2 ring-primary ring-offset-1" : ""}`} style={{ background: swatch }} />)}
              <input type="color" aria-label="Outra cor" title="Outra cor" value={color} onChange={(event) => props.onColor(event.target.value)} className="size-7 cursor-pointer rounded border bg-transparent p-0.5" />
            </div>
          </div>}
          {size && <label className="grid gap-1 text-xs text-muted-foreground">
            <span className="flex justify-between">{size.label}<span className="tabular-nums text-foreground">{size.value} {size.unit}</span></span>
            <input type="range" min={size.min} max={size.max} value={size.value} onChange={(event) => props.onSize(Number(event.target.value))} className="accent-primary" />
          </label>}
          {opacity !== null && <label className="grid gap-1 text-xs text-muted-foreground">
            <span className="flex justify-between">Opacidade<span className="tabular-nums text-foreground">{Math.round(opacity * 100)}%</span></span>
            <input type="range" min={10} max={100} value={Math.round(opacity * 100)} onChange={(event) => props.onOpacity(Number(event.target.value) / 100)} className="accent-primary" />
          </label>}
        </Section>
      )}
      <Section title="Edição">
        <div className="grid grid-cols-3 gap-1">
          {([["undo", "Desfazer", RiArrowGoBackLine], ["redo", "Refazer", RiArrowGoForwardLine], ["delete", "Excluir", RiDeleteBinLine]] as const).map(([name, label, Icon]) => (
            <button key={name} type="button" disabled={disabled} onClick={() => props.onAction(name)} className="grid justify-items-center gap-1 rounded-lg border p-2 text-xs hover:bg-muted disabled:opacity-50">
              <Icon className="size-4" />{label}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Página">
        <label className="grid gap-1 text-xs text-muted-foreground">
          <span className="flex justify-between">Zoom<span className="tabular-nums text-foreground">{props.zoom}%</span></span>
          <input type="range" min={25} max={400} step={5} value={props.zoom} disabled={disabled} onChange={(event) => props.onZoom(Number(event.target.value))} className="accent-primary" />
        </label>
        <div className="grid grid-cols-2 gap-1">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={props.onFitWidth}>Ajustar à largura</Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={props.onRotate}><RiClockwiseLine className="size-4" />Girar</Button>
        </div>
        <div role="radiogroup" aria-label="Exibição de páginas" className="grid gap-1">
          {props.spreads.map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={props.spread === value} disabled={disabled} onClick={() => props.onSpread(value)}
            className="rounded-md border border-transparent px-2 py-1.5 text-left text-xs hover:bg-muted aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-primary">{label}</button>)}
        </div>
      </Section>
      <Section title="Documento">
        <div className="grid gap-1">
          <Button type="button" variant="ghost" size="sm" className="justify-start" disabled={disabled} onClick={props.onOrganize}><RiLayoutGridLine className="size-4" />Organizar páginas</Button>
          <Button type="button" variant="ghost" size="sm" className="justify-start" disabled={disabled} onClick={props.onHeaderFooter}><RiLayoutTopLine className="size-4" />Cabeçalho e rodapé</Button>
          <Button type="button" variant="ghost" size="sm" className="justify-start" disabled={disabled} onClick={props.onSearch}><RiSearchLine className="size-4" />Localizar</Button>
          <Button type="button" variant="ghost" size="sm" className="justify-start" disabled={disabled} onClick={props.onPrint}><RiPrinterLine className="size-4" />Imprimir</Button>
          <Button type="button" variant="ghost" size="sm" className="justify-start" disabled={disabled} onClick={props.onDownload}><RiDownloadLine className="size-4" />Baixar</Button>
        </div>
      </Section>
    </div>
  );
}
