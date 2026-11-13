// Posições na tela do visualizador de PDF: páginas, conteúdo rolável e faixas em frações da página.

export type Area = { left: number; top: number; right: number; bottom: number };

export const PAGE_SELECTOR = ".pdfViewer .page[data-page-number]";

export const pageElement = (root: ParentNode | null | undefined, page: number) => root?.querySelector<HTMLElement>(`.page[data-page-number="${page}"]`) ?? null;

export const pageNumberOf = (element: HTMLElement) => Number(element.dataset.pageNumber);

// Área desenhada da página, sem a borda: é a ela que as posições salvas no PDF se referem.
export function pageArea(page: HTMLElement) {
  const rect = page.getBoundingClientRect();
  return new DOMRect(rect.left + page.clientLeft, rect.top + page.clientTop, page.clientWidth, page.clientHeight);
}

// Ponto da tela onde começa o conteúdo rolável: posições relativas a ele rolam junto com a página.
export function scrollOrigin(viewport: HTMLElement) {
  const rect = viewport.getBoundingClientRect();
  return { left: rect.left + viewport.clientLeft - viewport.scrollLeft, top: rect.top + viewport.clientTop - viewport.scrollTop };
}

// Faixa em frações da página -> posição no conteúdo rolável.
export function placeOnPage(page: DOMRect, origin: { left: number; top: number }, box: Area): Area {
  return {
    left: page.left + box.left * page.width - origin.left,
    top: page.top + box.top * page.height - origin.top,
    right: page.left + box.right * page.width - origin.left,
    bottom: page.top + box.bottom * page.height - origin.top,
  };
}

export const overlaps = (first: Area, second: Area) => !(first.right < second.left || first.left > second.right || first.bottom < second.top || first.top > second.bottom);

export const containsPoint = (area: Area, x: number, y: number) => x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;

export const isNarrow = () => window.matchMedia("(max-width: 767px)").matches;
