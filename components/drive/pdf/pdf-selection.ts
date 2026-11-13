import { type Area, pageArea } from "./pdf-geometry";
import type { HighlightBox } from "./pdf-model";

// Seleção de texto do navegador sobre a camada de texto do pdf.js, convertida em faixas de realce.

// O navegador só inclui a letra se o clique cair na metade esquerda dela; leitores de PDF incluem a letra sob o ponteiro.
export function includeLettersUnderPointer(selected: Selection, range: Range, points: { x: number; y: number }[]) {
  const under = (node: Node, offset: number) => {
    const letter = document.createRange();
    letter.setStart(node, offset);
    letter.setEnd(node, offset + 1);
    const box = letter.getBoundingClientRect();
    return points.some((point) => point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom);
  };
  const forward = selected.anchorNode === range.startContainer && selected.anchorOffset === range.startOffset;
  let changed = false;
  if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0 && under(range.startContainer, range.startOffset - 1)) {
    range.setStart(range.startContainer, range.startOffset - 1);
    changed = true;
  }
  if (range.endContainer.nodeType === Node.TEXT_NODE && range.endOffset < (range.endContainer.textContent?.length ?? 0) && under(range.endContainer, range.endOffset)) {
    range.setEnd(range.endContainer, range.endOffset + 1);
    changed = true;
  }
  if (!changed) return;
  if (forward) selected.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
  else selected.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);
}

// Faixas (uma por linha, em frações da página) do trecho selecionado na página, e o último retângulo, onde fica a barra de ações.
export function selectionBoxes(range: Range, page: HTMLElement) {
  const pageRect = pageArea(page);
  // Com a página girada 90° ou 270°, as linhas de texto ficam na vertical da tela.
  const horizontal = Number(page.querySelector(".textLayer")?.getAttribute("data-main-rotation") ?? 0) % 180 === 0;
  const lines: Area[] = [];
  let lastRect: DOMRect | null = null;
  // Percorre só os textos da camada de texto, para não pegar quebras de linha nem o fim do conteúdo.
  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
  for (let node = walker.currentNode.nodeType === Node.TEXT_NODE ? walker.currentNode : walker.nextNode(); node; node = walker.nextNode()) {
    if (!range.intersectsNode(node) || !node.parentElement?.closest(".textLayer") || !page.contains(node)) continue;
    const part = document.createRange();
    part.selectNodeContents(node);
    if (node === range.startContainer) part.setStart(node, range.startOffset);
    if (node === range.endContainer) part.setEnd(node, range.endOffset);
    // A altura vem do trecho do pdf.js, que acompanha o texto do PDF; a do intervalo usa a fonte do navegador e sai deslocada.
    const span = node.parentElement.closest<HTMLElement>("span:not(.highlight)")?.getBoundingClientRect();
    for (const rect of part.getClientRects()) {
      if (rect.width <= 1 || rect.height <= 1) continue;
      lastRect = rect;
      const box = horizontal
        ? { left: rect.left, right: rect.right, top: span?.top ?? rect.top, bottom: span?.bottom ?? rect.bottom }
        : { left: span?.left ?? rect.left, right: span?.right ?? rect.right, top: rect.top, bottom: rect.bottom };
      // Junta as palavras da mesma linha numa faixa só, preenchendo os espaços do texto justificado.
      const line = lines.find((entry) => {
        const [start, end, entryStart, entryEnd] = horizontal ? [box.top, box.bottom, entry.top, entry.bottom] : [box.left, box.right, entry.left, entry.right];
        const thickness = Math.min(end - start, entryEnd - entryStart);
        const gap = horizontal ? Math.max(box.left - entry.right, entry.left - box.right) : Math.max(box.top - entry.bottom, entry.top - box.bottom);
        return Math.min(end, entryEnd) - Math.max(start, entryStart) > thickness / 2 && gap < thickness * 3;
      });
      if (!line) { lines.push(box); continue; }
      line.left = Math.min(line.left, box.left);
      line.top = Math.min(line.top, box.top);
      line.right = Math.max(line.right, box.right);
      line.bottom = Math.max(line.bottom, box.bottom);
    }
  }
  const boxes: HighlightBox[] = lines.map((line) => ({
    left: Math.max(0, (line.left - pageRect.left) / pageRect.width),
    top: Math.max(0, (line.top - pageRect.top) / pageRect.height),
    right: Math.min(1, (line.right - pageRect.left) / pageRect.width),
    bottom: Math.min(1, (line.bottom - pageRect.top) / pageRect.height),
  }));
  return { boxes, lastRect };
}
