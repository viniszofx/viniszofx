@AGENTS.md

## Identidade visual

Antes de criar ou mudar qualquer tela, página, e-mail, PDF ou impresso, leia `docs/brand/README.md`
(manual da marca: cores, tipografia, grafismos, tom de voz). Para impressos e PDFs, leia também
`docs/brand/Impressos.md`. Valores exatos de cor e tipo estão em `docs/brand/tokens.json`
(espelham `app/globals.css`, que é a fonte de verdade no código).

- Padrões de fundo: `docs/brand/assets/Fundos/` (versão `-escuro` para site/capas, `-claro` para impressos).
- Modelo de proposta comercial: `docs/brand/templates/proposta/proposta.html` (campos a preencher entre colchetes).
- Sem degradês transparentes em PDFs: alguns leitores desenham manchas rosadas.

## Leveza do site público

O site público (`app/(public)`) deve mandar o mínimo de JavaScript. Antes de mexer nele:

- Ícones em **componentes de cliente** vêm de `@/components/icons` (gerado por `scripts/gen-icons.mjs`), nunca de `@remixicon/react`: esse pacote é um arquivo único de ~160 KB e vai inteiro para o navegador. Componentes de servidor podem usar o pacote.
- Botões e links do site usam `buttonVariants` de `@/components/ui/button-variants` num `<a>`/`<button>` comum; o `Button` (Base UI) fica para o painel.
- Imagens em páginas de servidor usam `ServerImage` (`@/components/server-image`), não `next/image`.
- Animação de entrada de seção é a classe `.reveal` (CSS ligado à rolagem), sem JavaScript. Seções abaixo da dobra levam `lazy-section`.
- Anime só `transform`, `opacity` e `clip-path`. Nada de animar `height`/`width`/`top` em elementos no fluxo da página (recalcula o layout inteiro a cada quadro).
