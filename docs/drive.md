# Drive

Pastas e arquivos de até 10 MB por conta, com editores de DOCX, planilhas e PDF que rodam no navegador e salvam de volta no próprio arquivo. Não há serviço além do Next.js: nada de LibreOffice, conversores em servidor ou licenças comerciais.

Rotas:

| Rota | O que faz |
| --- | --- |
| `/dashboard/drive` | Meu Drive (`?folder=<id>` abre uma pasta) |
| `/dashboard/drive?view=recent` | Últimos 50 arquivos, pela data em que foram abertos |
| `/dashboard/drive?view=links` | Arquivos com link público ativo |
| `/dashboard/drive/<id>` | Abre o arquivo no editor ou na prévia |
| `/arquivo/<token>` | Página pública de um arquivo compartilhado por link, sem login |
| `GET /api/shared/drive/<token>` | Bytes do arquivo compartilhado (`?info` devolve nome e tamanho) |

## Usar

| Ação | Como |
| --- | --- |
| Selecionar | Clique. Ctrl/⌘+clique alterna, Shift+clique estende, arrastar no fundo seleciona por retângulo, Ctrl+A seleciona tudo, Esc limpa |
| Abrir | Duplo clique ou Enter. No toque, tocar de novo no item selecionado |
| Criar | Novo › Nova pasta, Novo documento (.docx) ou Nova planilha (.xlsx); também pelo botão direito no fundo |
| Enviar | Botão Enviar, botão direito › Enviar arquivos, ou arrastar arquivos do computador para a área |
| Mover | Botão Mover (escolhe a pasta numa árvore) ou arrastar itens para uma pasta, para o caminho no topo ou para "Meu Drive" na lateral |
| Renomear | Botão Renomear ou F2; o nome vem selecionado sem a extensão |
| Excluir | Botão Excluir ou Delete; pastas levam junto tudo o que têm dentro |
| Baixar | Arquivo: baixa direto. Pasta ou vários itens: um `.zip` com a estrutura de pastas |
| Cor da pasta | Botão Cor com uma pasta selecionada |
| Compartilhar | Botão Compartilhar cria um link público; Remover link revoga. Pastas não têm link |
| Detalhes | Botão (i) mostra tamanho, datas, acesso e local do item selecionado |
| Ordenar e exibir | Nome, data ou tamanho; grade ou lista. A escolha fica salva no navegador |

O botão direito sobre um item mostra as mesmas ações da barra; no fundo, as de criação e envio.

## Editores

| Formato | Editor | Salvar |
| --- | --- | --- |
| `.docx` | `@docx-editor.dev/react` (Apache-2.0): páginas, menus, tabelas, imagens, revisão | Salvar, Ctrl+S ou salvamento automático (chave na barra) |
| `.xlsx` | Univer + ExcelJS: fórmulas (aceita `=SOMA(A1;A2;1,5)`), formatação, abas, atalhos do Excel | Salvar, Ctrl+S ou salvamento automático |
| `.pdf` | `pdfjs-dist`: miniaturas, páginas, zoom e as ferramentas de anotação | Salvar |
| imagem, vídeo, áudio, texto | Prévia direta | — |

`.doc` e `.xls` (formatos antigos) não abrem: baixe e salve como `.docx`/`.xlsx`.

Salvar envia o arquivo editado ao storage e troca a referência do item (`replaceDriveFile`); o objeto antigo é apagado pela limpeza de órfãos de `PUT /api/data/[kind]`. O editor não recarrega depois de salvar, então o cursor não se perde.

Na página pública (`/arquivo/<token>`) os mesmos editores abrem só para leitura.

### Imprimir, PDF e Markdown (DOCX)

| Ação | Onde | Resultado |
| --- | --- | --- |
| **Imprimir** | Botão Imprimir na barra, **Arquivo › Imprimir** ou **Ctrl/⌘+P** | Diálogo de impressão do navegador |
| **PDF** | Botão PDF na barra ou **Arquivo › Exportar › PDF** | Baixa `<nome>.pdf` direto, sem diálogo |
| **Markdown** | **Arquivo › Exportar › Markdown** | Baixa o `.md` (conversor oficial `@docx-editor.dev/docx-to-markdown`, Apache-2.0) |

Tudo roda no navegador. O conversor de PDF oficial do editor (`@docx-editor.dev/docx-to-pdf`) não é usado: tem licença comercial de avaliação e só roda em Node. A linha **Arquivo › Imprimir** original foi trocada pela nossa (ela imprimiria um PDF convertido); **Exportar › PDF** continua, ligada ao nosso gerador.

As duas saídas partem das mesmas páginas (`lib/drive/editors/docx-frame.ts`):

1. `openFontBackedDocumentForExport` (núcleo Apache-2.0 do editor) pagina o documento com o mesmo motor e as mesmas fontes do editor (`docx-pages.ts`).
2. As fontes exatas usadas na medição (`admittedFontFace`) são registradas como `FontFace` com nomes privados, para o documento não sobrescrever fontes da página.
3. `paintSemanticLayout` desenha **todas** as páginas num iframe escondido. O editor só desenha as páginas perto da tela, por isso não dá para imprimir o editor direto.
4. O iframe recebe só o CSS do editor e um `@page` com o tamanho de papel do documento (sem ele o navegador usa o padrão, como Carta, e cada página vaza para uma segunda folha).

**Imprimir** (`print-docx.ts`) chama a impressão do navegador sobre esse iframe.

**PDF** (`docx-pdf.ts`) percorre as páginas desenhadas e escreve o arquivo com `pdf-lib` + `@pdf-lib/fontkit` (MIT):

- texto vetorial e pesquisável, palavra por palavra na posição em que o navegador o desenhou (justificação, tabulações e espaçamento ficam iguais), com as fontes do documento embutidas em subconjunto;
- fundos, realces e bordas (contínuas, tracejadas, pontilhadas) como retângulos e linhas;
- sublinhado e tachado;
- imagens PNG/JPEG embutidas como estão; outros formatos e desenhos SVG (formas, gráficos) como imagem a ~288 dpi.

Conferido com o Edge contra a impressão: mesmas páginas e texto completo, posições com diferença máxima de 0,5 pt. Limitações: documentos com páginas de tamanhos diferentes (retrato e paisagem misturados) saem todos no tamanho da primeira; no PDF, texto girado sai sem a rotação e desenhos SVG ficam como imagem.

## Dados

Cada item é um registro da coleção `drive` (tabela `app_drive`), servida por `/api/data/drive`:

```ts
type DriveFields = {
  kind: "folder" | "file";
  name: string;
  parentId: string;           // "" = raiz
  color?: FolderColor;        // só pastas
  file?: { id; name; type; size; blob: FileReference };
  shareToken?: string;        // link público ativo
  openedAt?: string;          // alimenta "Recentes"
};
```

O store do Drive é criado com `lazyFiles: true`: a lista carrega só as referências (`{ __viniszofxFile, type }`) e cada arquivo é baixado quando aberto (`readDriveFile`). Os outros módulos continuam baixando os anexos junto com os registros.

O upload acontece antes de gravar o registro (`uploadToDrive`), então um item salvo sempre tem seu objeto no storage. O limite de 10 MB é do Drive; a API de arquivos aceita até 20 MB.

## Código

| Caminho | Responsabilidade |
| --- | --- |
| `components/drive/drive-page.tsx` | Monta a tela: estado, ações e diálogos |
| `drive-sidebar`, `drive-toolbar`, `drive-breadcrumb`, `drive-view-controls` | Lateral, barra de comandos, caminho, ordenação/visualização |
| `drive-items.tsx` | Grade e lista |
| `drive-details.tsx`, `move-dialog.tsx`, `share-dialog.tsx`, `folder-color-menu.tsx` | Painel de detalhes e diálogos |
| `use-selection.ts`, `use-item-drag.ts`, `use-preference.ts` | Seleção (clique/Ctrl/Shift/retângulo), arrastar para pastas, preferência salva |
| `file-page.tsx`, `file-content.tsx`, `shared-file-page.tsx` | Página do arquivo, escolha do editor/prévia, página pública |
| `components/drive/editors/` | Editores DOCX, XLSX e PDF; `docx-file-menu.tsx` liga Exportar (PDF e Markdown) e troca Imprimir (passado direto como filho do menu, sem componente em volta, para substituir o Arquivo original) |
| `lib/drive/client.ts` | Operações: enviar, abrir, mover, excluir, renomear, cor, criar, link, ZIP, salvar edição |
| `lib/drive/files.ts` | Tipos de arquivo, cores, formatação, DOCX/XLSX em branco |
| `lib/drive/zip.ts` | Gerador de ZIP sem dependências (pastas e pacotes Office) |
| `lib/drive/editors/` | Conversão XLSX↔Univer, fórmulas em português, atalhos, fontes, motor do PDF.js; para DOCX: páginas (`docx-pages`, `docx-frame`), impressão (`print-docx`) e PDF (`docx-pdf`) |

Componentes genéricos usados aqui e no resto do painel ficam em `components/ui/` (`Dropdown`, `ContextMenu`, `NameDialog`, `ActionButton`, `Segmented`, `Field`, `LoadingBlock`, `EmptyState`, `Badge`, `Switch`, `ErrorToast`).

## Recursos externos

- Fontes dos documentos: Fontsource e Google Fonts (CDN, sem chave), guardadas em cache no IndexedDB (`lib/browser/kv.ts`).
- Fontes padrão do PDF.js (`standard_fonts`, `cmaps`): jsDelivr.
- O worker do PDF.js, o `harfbuzz.wasm` e as fontes empacotadas do editor saem no próprio build do Next.

`@docx-editor.dev/core/export` importa `fs` só quando roda em Node; `next.config.ts` aponta `fs` e `fs/promises` para um módulo vazio no navegador (`turbopack.resolveAlias`).

## Origem

Portado do Drive do Eureka/Nodus (branch `dev`), trocando o que dependia de servidor: o PDF de DOCX (lá via LibreOffice) passou para o motor do editor, e a API própria do Drive passou para as coleções `/api/data`. Ainda não há pastas compartilhadas com pessoas nem as abas Compartilhados/Público, porque os dados são por conta.
