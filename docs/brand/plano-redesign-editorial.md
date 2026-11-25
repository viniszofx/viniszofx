# Plano · Redesign editorial

Branch: `design/editorial` (a partir de `main@b2d93bc`).
Referência visual: [stateofaidesign.com](https://stateofaidesign.com/) (relatório "AI in Design 2026"). Usamos a **linguagem** (papel branco, tinta preta, títulos enormes e apertados, rótulos em mono, blocos de cor chapada, cantos retos), nunca o nome, os textos, as fotos ou o logo deles.

## O que a referência faz (medido no navegador)

| Item | Valor medido |
| --- | --- |
| Fundo / texto | `#FFFFFF` / `#000000`; texto de apoio preto a 60% |
| Cores de bloco | laranja `#FE7141`, lavanda `#CDABFE`, sálvia `#D1DDD3`, ciano `#99EEFF`, lima `#F0FF1C` |
| Títulos | Beausite Classic Medium (500), 120px/114px com −0,06em; 80px/80px; 40px/44px com −0,04em |
| Texto | Beausite Classic Regular 20px/24px, −0,03em |
| Rótulos | Geist Mono 13px, caixa-alta, peso 500 |
| Raio / sombra | 0 / nenhuma |
| Botão | barra preta larga, texto branco, seta → à direita |
| Imagens | fotos granuladas e saturadas, colagem com etiquetas em mono |

## Decisões

1. **Fontes livres no lugar da Beausite** (que é paga): **Teachers** (títulos e texto, 400/500) e **Geist Mono** (rótulos). As duas vêm do Google Fonts pelo `next/font`, como hoje.
2. **Tokens, não páginas**: a troca de cor, fonte e raio acontece em `app/globals.css` e `app/layout.tsx`. O painel herda sem mudar componente por componente.
3. **Cobre sai, tinta entra**: `primary` vira preto (claro) e branco (escuro). As cinco cores de bloco entram como tokens fixos (`--orange`, `--lavender`, `--sage`, `--sky`, `--lime`).
4. **Blocos de cor sempre com tinta preta**: a classe `.paper` redefine os tokens dentro do bloco, então o texto fica legível também no tema escuro.
5. **Raio 0, sem vidro, sem luz de estúdio**: remove o `body::before` e o desfoque do cabeçalho do site.
6. **Página inicial deixa de ser sempre escura**: segue o tema (claro por padrão). O login continua escuro, de propósito.
7. **Mesmo conteúdo e mesmas seções**: só muda a apresentação. Textos, casos e dados ficam como estão.

## Etapas

| # | Etapa | Arquivos |
| --- | --- | --- |
| 1 | Manual de marca novo | `docs/brand/README.md` |
| 2 | Tokens de cor, fonte e raio | `app/globals.css`, `app/layout.tsx`, `components/ui/button.tsx` |
| 3 | Símbolo novo (V branco em quadrado preto, sem raio) | `app/icon.svg`, `app/apple-icon.tsx`, `components/site-header.tsx`, `docs/brand/assets/Marca/` |
| 4 | Página inicial no estilo editorial | `app/(public)/page.tsx` |
| 5 | Rodar local e conferir claro, escuro e celular | `bun run dev` |

## Mapa das seções da página inicial

| Seção | Antes | Depois |
| --- | --- | --- |
| Abertura | retrato com degradê preto | título gigante, linha em mono, retrato num quadro reto com etiqueta |
| Faixa de tecnologias | cobre | lima, tinta preta |
| 01 Casos | cartões com borda | lista com filetes pretos, número grande |
| 02 Situações | cartões com faixa de cobre | bloco sálvia |
| 03 Serviços | grade | grade com filetes pretos |
| 04 IA consciente | cartões | bloco lavanda |
| 05 Processo | grafite + losangos | bloco laranja, números de 80px |
| 06 Projetos | cartões | sem mudança de estrutura |
| 07 Sobre | retrato emoldurado | bloco preto à esquerda + retrato, como citação |
| 08 Perguntas | lista | lista com filetes pretos |
| Contato / rodapé | grafite + losangos | preto, título gigante, botão branco |

## Fora deste passo

- PDFs de proposta e `docs/brand/Impressos.md` ainda usam cobre: precisam de uma passada própria.
- `docs/brand/tokens.json` e os padrões de fundo em losango ficam como registro da identidade anterior até essa passada.
- Fotos no estilo granulado da referência: precisam de fotos novas; por ora usamos os retratos atuais.
