import type { ChainedCommands, Editor, Range } from "@tiptap/react";
import { deleteBlock, duplicateBlock } from "./block-actions";
export type AttachmentKind = "image" | "file";
export type BlockCommand = {
  id: string; label: string; description: string; aliases: string; icon: string;
  apply?: (chain: ChainedCommands) => ChainedCommands;
  attach?: AttachmentKind; action?: "delete" | "duplicate";
  embed?: boolean;
};
export const blockCommands: BlockCommand[] = [
  { id: "text", label: "Texto", description: "Parágrafo de texto", aliases: "text paragraph paragrafo", icon: "T", apply: (chain) => chain.clearNodes().setParagraph() },
  ...([1, 2, 3] as const).map((level) => ({ id: `h${level}`, label: `Título ${level}`, description: `Cabeçalho de nível ${level}`, aliases: `heading h${level} titulo${level}`, icon: `H${level}`, apply: (chain: ChainedCommands) => chain.clearNodes().setHeading({ level }) })),
  { id: "bullet", label: "Lista com marcadores", description: "Organize itens em uma lista", aliases: "bullet list lista marcadores", icon: "•", apply: (chain) => chain.clearNodes().toggleBulletList() },
  { id: "number", label: "Lista numerada", description: "Itens em ordem", aliases: "number ordered list numbered numerada", icon: "1.", apply: (chain) => chain.clearNodes().toggleOrderedList() },
  { id: "todo", label: "Lista de tarefas", description: "Itens com caixas de seleção", aliases: "todo task checklist tarefas checkbox", icon: "☑", apply: (chain) => chain.clearNodes().toggleTaskList() },
  { id: "quote", label: "Citação", description: "Destaque uma citação", aliases: "quote blockquote citacao", icon: "❞", apply: (chain) => chain.clearNodes().setBlockquote() },
  { id: "code", label: "Código", description: "Bloco de código", aliases: "code codigo", icon: "</>", apply: (chain) => chain.clearNodes().setCodeBlock() },
  { id: "table", label: "Tabela", description: "Linhas e colunas editáveis", aliases: "table tabela", icon: "▦", apply: (chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: "divider", label: "Divisor", description: "Separe seções da página", aliases: "divider hr divisor linha", icon: "—", apply: (chain) => chain.setHorizontalRule() },
  { id: "image", label: "Imagem", description: "Envie uma imagem no corpo da nota", aliases: "image imagem foto picture", icon: "▧", attach: "image" },
  { id: "file", label: "Arquivo", description: "Anexe ou incorpore um arquivo", aliases: "file arquivo anexo pdf audio video", icon: "↥", attach: "file" },
  { id: "embed", label: "Incorporar", description: "Insira um widget ou página por link", aliases: "embed incorporar incorporacao widget iframe", icon: "↗", embed: true },
  { id: "duplicate", label: "Duplicar bloco", description: "Crie uma cópia deste bloco", aliases: "duplicate duplicar copiar", icon: "⧉", action: "duplicate" },
  { id: "delete", label: "Excluir bloco", description: "Remova este bloco da nota", aliases: "delete excluir apagar remover", icon: "×", action: "delete" },
];
export function filteredCommands(query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const search = normalize(query).trim().split(/\s+/);
  return blockCommands.filter((command) => search.every((word) => normalize(`${command.label} ${command.aliases}`).includes(word)));
}
export function runBlockCommand(editor: Editor, command: BlockCommand, range?: Range, onAttach?: (kind: AttachmentKind) => void) {
  let chain = editor.chain().focus();
  if (range) chain = chain.deleteRange(range);
  if (command.apply) return command.apply(chain).run();
  chain.run();
  if (command.embed) { editor.view.dom.dispatchEvent(new CustomEvent("viniszofx:insert-embed")); return true; }
  if (command.attach) { onAttach?.(command.attach); return true; }
  return command.action === "duplicate" ? duplicateBlock(editor) : deleteBlock(editor);
}
