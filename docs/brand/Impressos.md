# Impressos

Padrão para tudo que vai para o papel ou para PDF: propostas, orçamentos, contratos, relatórios e apresentações impressas. O site é escuro; o impresso é **claro**, para economizar tinta e sair igual em qualquer impressora. A identidade continua a mesma: grafite, cobre, losango e a mesma voz.

Modelo de referência: **Proposta comercial** (A4, 6 páginas).

## Página

| | |
| --- | --- |
| Formato | A4 retrato (210 × 297 mm), sem sangria |
| Margens | 20 mm nas laterais; conteúdo de 27 mm a 22 mm da borda (topo/base) |
| Cabeçalho | a 12 mm do topo: símbolo V + "Vinicius Souza" à esquerda, tipo e número do documento à direita, filete `border` embaixo |
| Rodapé | a 10 mm da base: "Vinicius Souza · Carbon Cycle LTDA" à esquerda, número da página em `primary` à direita, filete `border` em cima |
| Fundo | papel branco (#ffffff). Painéis de apoio em `background` claro (#f3f5f6) |

## Cores no papel

| Uso | Cor | Token |
| --- | --- | --- |
| Texto | #13161b | `foreground` (claro) |
| Texto de apoio | #5f646a (6,0:1 no branco) | `muted-foreground` (claro) |
| Destaque: eyebrows, números, ícones, página | #a56038 (4,9:1 no branco) | `primary` (claro) |
| Filetes | #dbdee1; filete de fechamento de tabela em #13161b | `border`, `foreground` |
| Campo a preencher | fundo #f1e9e3, texto #3e281b, sublinhado tracejado #a56038 | `accent`, `accent-foreground`, `primary` |
| Faixa escura (só capa e contracapa) | #111418 com filetes em `copper-bright` #e1a170 | `graphite-block`, `copper-bright` |

Regras:

- **Uma só área escura por ponta**: a faixa da capa (cerca de 112 mm) e a faixa de contato da última página (cerca de 62 mm). O miolo é todo claro.
- Na faixa escura use qualquer padrão do grupo **Fundos** na versão escura; em áreas claras (capa sem faixa, divisórias de seção), a versão clara.
- `copper-bright` só aparece sobre grafite. No papel branco, o cobre é sempre `primary` claro (#a56038).
- **Cores sólidas, sem degradês nem transparências.** Degradês transparentes são gravados no PDF de um jeito que alguns leitores (como o do Edge) desenham errado, com manchas rosadas. Luz de estúdio e fotos com degradê vão como imagem já pronta.

## Tipografia no papel

| Estilo | Tamanho | Uso |
| --- | --- | --- |
| Título da capa | Raleway 300/600, 40 pt | "Menos planilha. **Mais resultado.**" |
| Nome do projeto | Raleway 400, 30 pt | Capa |
| Título de seção (h2) | Raleway 400, 26 pt, −0,025em | Uma frase, sempre com ponto final |
| Subtítulo (h3) | Raleway 500, 13,5 pt | Cartões, perguntas |
| Números | Raleway 300, 16–28 pt, em `primary`, algarismos tabulares | Etapas, passos |
| Texto | Oxanium 400, 11 pt / 1,65 | Corpo |
| Apoio (lead) | Oxanium 400, 12,5 pt, `muted-foreground` | Abaixo do título de seção |
| Eyebrow | Oxanium 500, 9,5 pt, caixa-alta, +0,2em, `primary` | "01 —— O QUE OUVIMOS" |
| Rótulo | Oxanium 500, 8,5 pt, caixa-alta, +0,2em | Cabeçalhos de tabela, campos |

## Componentes do impresso

- **Eyebrow numerado** abre toda seção: número + filete de 28 px + nome, em `primary`.
- **Tabela de etapas**: cabeçalho com rótulos e filete grafite, linhas com filete `border`, números em Raleway Light cobre, valores alinhados à direita, linha de total fechada com filete grafite.
- **Caixas "Está incluso" / "Não está incluso"**: borda `primary` com check para o que entra; borda `border` com × e texto `muted-foreground` para o que não entra. Retas, sem raio.
- **Quadro "Hoje → Depois"**: duas colunas, a coluna "Depois" com fundo `accent` no cabeçalho e seta cobre.
- **Bloco de valor**: fundo grafite, rótulo em `copper-bright`, valor em Raleway Light 32 pt.
- **Nota de apoio**: painel #f3f5f6 com seta cobre.
- **Assinaturas**: duas colunas, filete grafite em cima, nome em Oxanium Medium e empresa/CNPJ em `muted-foreground`.
- **Campo a preencher**: `[entre colchetes]`, com fundo `accent` e sublinhado tracejado cobre. Nenhum campo pode sair preenchido com valor inventado: preço, prazo e validade são sempre do caso real.

## Estrutura da proposta comercial

1. **Capa**: faixa grafite com filetes e tagline; nome do projeto; tabela com Para, De, Data, Validade, Investimento total.
2. **01 O que ouvimos** e **02 A solução**: o processo de hoje, as dores (em cartões) e o quadro Hoje → Depois.
3. **03 Escopo e etapas**: tabela de etapas com prazo e valor fechado; incluso / não incluso; regra de mudança de escopo.
4. **04 Como trabalhamos** (os quatro passos do site, com "Você está aqui" no passo 02) e **05 IA consciente** (as quatro regras e onde a IA entra ou não).
5. **06 Investimento e condições** e **07 Perguntas frequentes** (do site).
6. **08 Próximos passos**, aceite com assinaturas e faixa de contato.

Os textos fixos (processo, IA consciente, perguntas) são copiados do site, `lib/portfolio/services.ts`. Não reescreva: se o site mudar, o impresso muda junto.

## Fontes no PDF

O modelo atual foi gerado com Montserrat e Tektur no lugar de Raleway e Oxanium, porque os arquivos originais não estavam disponíveis no ambiente de geração. Ao gerar de novo, instale Raleway, Oxanium e JetBrains Mono (Google Fonts) e use as originais.
