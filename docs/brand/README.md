# Vinicius Souza — Manual de identidade

**Menos planilha. Mais resultado.**
Sistemas e automações sob medida para a sua empresa.

Este manual descreve a identidade de **viniccius.com.br**, o site de Vinicius Souza, analista de sistemas da Carbon Cycle LTDA. Tudo aqui foi tirado do código do próprio site (repositório `viniszofx/viniszofx`, commit `6cb1d49`): cores, fontes, símbolo, grafismos, fotos e textos. Nada foi inventado; onde o manual dá uma regra, ela descreve o que o site já faz.

---

## 1. Essência

| | |
| --- | --- |
| **Assinatura** | Vinicius Souza |
| **Empresa** | Carbon Cycle LTDA · CNPJ 55.366.974/0001-85 |
| **Tagline** | Menos planilha. Mais resultado. |
| **Promessa** | Sistemas e automações sob medida, com valor fechado por etapa, IA revisada por uma pessoa e tudo em nome do cliente. |
| **Para quem** | Empresas que perdem horas com planilha, retrabalho e sistemas que não conversam. Quem lê não é da área. |
| **Personalidade** | Institucional e moderna. Sóbria, precisa, próxima. |
| **Conceito visual** | **Grafite e cobre**: fundo ardósia frio, destaque em cobre polido e, no claro, branco-mármore. Luz de estúdio vinda de cima. |

Três ideias guiam tudo:

1. **O cliente se reconhece pelo problema, não pela tecnologia.** Fale da dor ("a equipe passa horas copiando dados"), não da ferramenta.
2. **Prova antes de promessa.** Só fatos verificáveis: casos reais, trabalho publicado, site no ar. Sem números, clientes ou depoimentos inventados.
3. **Uma pessoa responde.** "Quem responde é quem vai construir." A IA ajuda; uma pessoa revisa e assina.

---

## 2. Marca

### Símbolo

Um **V em cobre dentro de uma moldura de cobre, sobre grafite**. É o mesmo desenho no favicon, no ícone do celular e no cabeçalho do site e do painel.

| Arquivo | Uso |
| --- | --- |
| `assets/Marca/simbolo-v.svg` | Favicon e uso em tamanhos pequenos (32×32, raio 7). |
| `assets/Marca/icone-app.svg` | Ícone de tela inicial (180×180, sem cantos: o sistema recorta). |

Construção (grade de 32):

- Fundo `mark-graphite` **#1b1e22**, raio 7.
- Moldura `mark-copper` **#d39a6c**, traço 2, recuada 3 unidades da borda, raio 5.
- V `mark-copper-light` **#e7b48a**, traço 3, pontas e junção arredondadas, de (10,5 ; 10,5) a (16 ; 21,5) a (21,5 ; 10,5).

### Assinatura (logo horizontal)

No cabeçalho: **símbolo + "Vinicius Souza"**, lado a lado, com `space-2` (8px) entre eles.

- Na interface, o símbolo vira um quadrado de 24px com borda de 1px em `primary`, raio `radius-md` e um "V" em Oxanium Bold 12px em `primary`. O nome vem em Oxanium Semibold 14px em `foreground`.
- No celular só o símbolo aparece; o nome surge a partir de 640px.

### Uso correto

- Mantenha as três cores do símbolo; não troque o cobre por outra cor.
- Respiro mínimo: a própria distância entre moldura e borda (3/32 da largura) em volta de todo o símbolo.
- Sobre fundos claros, use o símbolo inteiro (com o quadrado grafite); sobre grafite, ele funciona igual.
- Não distorça, não gire, não aplique sombra, gradiente ou contorno extra.

---

## 3. Cores

A paleta é **grafite e cobre**. O cobre fica **só onde pede atenção**: ação principal, seleção, foco, numeração e filetes. O resto é ardósia e mármore.

### Cores de marca

| Token | Hex aprox. | Papel |
| --- | --- | --- |
| `primary` (claro) | #a56038 | Cobre: botão principal, eyebrows, números, links ativos. |
| `primary` (escuro) | #da9b6a | Cobre claro no tema escuro. |
| `copper-bright` | #e1a170 | Cobre polido nos blocos escuros: botão "Quero uma proposta", números do processo, filetes em losango. |
| `graphite-block` | #111418 | Blocos escuros institucionais (processo, contato, rodapé). |
| `mark-graphite` | #1b1e22 | Fundo do símbolo. |
| `mark-copper` | #d39a6c | Moldura do símbolo. |
| `mark-copper-light` | #e7b48a | V do símbolo. |

### Neutros

| Token | Claro | Escuro | Papel |
| --- | --- | --- | --- |
| `background` | #f3f5f6 | #0f1215 | Fundo da página. |
| `card` | #fdfdfe | #191c20 | Cartões. |
| `foreground` | #13161b | #f0f2f4 | Texto principal. |
| `muted-foreground` | #5f646a | #9da2a9 | Texto de apoio. |
| `border` | #dbdee1 | branco 9% | Filetes de 1px. |
| `accent` | #f1e9e3 | #382b22 | Realce quente discreto. |

Os valores oficiais estão em OKLCH em `tokens.json` (é o que o site usa); os hex acima são a conversão para uso em ferramentas que não leem OKLCH.

### Proporção

Cerca de **90% neutros, 10% cobre**. Na página inicial (sempre escura), o cobre aparece em uma faixa de tecnologias em `primary`, nos números e no botão principal; nunca como fundo de seção inteira fora dessa faixa.

### Contraste

| Par | Claro | Escuro |
| --- | --- | --- |
| `foreground` / `background` | 16,5:1 | 16,7:1 |
| `muted-foreground` / `background` | 5,5:1 | 7,3:1 |
| `primary-foreground` / `primary` | 4,7:1 | 7,7:1 |
| `primary` / `background` | **4,41:1 ⚠** | 7,95:1 |

⚠ No tema claro, cobre (`primary`) como texto pequeno sobre `background` fica um pouco abaixo de 4,5:1. Use-o em texto a partir de 18px negrito ou 24px, ou sobre `card` / `accent`.

---

## 4. Tipografia

Três famílias do Google Fonts, cada uma com um papel:

| Família | Token | Papel |
| --- | --- | --- |
| **Raleway** | `heading` | Títulos. Leve e elegante: Light (300) na abertura, Regular (400) nas seções, Medium (500) em cartões. Sempre com `tracking-tight` (−0,025em). |
| **Oxanium** | `sans` | Texto, interface, botões. A família padrão do site: técnica, geométrica, com cara de sistema. |
| **JetBrains Mono** | `mono` | Código, respostas de API, mockups técnicos. |

### Escala

| Estilo | Tamanho / altura | Peso | Uso |
| --- | --- | --- | --- |
| `display` | 72 / 1,05 | 300 (+600) | "Menos planilha. **Mais resultado.**" |
| `h2` | 48 / 1,1 | 400 | Título de seção |
| `numeral` | 36 | 300 | 01–04 do processo |
| `destaque` | 24 | 400 | "3+ anos" |
| `h3` | 20 / 1,375 | 500 | Título de cartão |
| `lead` | 18 / 32 | 400 | Parágrafo de apoio |
| `body` | 16 / 28 | 400 | Texto corrido |
| `small` | 14 / 24 | 400 | Cartões, navegação |
| `eyebrow` | 12, caixa-alta, +0,2em | 500 | "01 — O QUE JÁ RESOLVI" |
| `label` | 11,2, caixa-alta, +0,2em | 500 | "COMO RESOLVEMOS" |
| `button` | 12, caixa-alta, +0,1em | 600 | "QUERO UMA PROPOSTA" |

Regras:

- **Contraste de peso no título de abertura**: a primeira frase leve, a segunda em semibold.
- Títulos com `text-balance`; parágrafos com `text-pretty`.
- Números sempre com **algarismos tabulares**.
- Caixa-alta só em eyebrows, rótulos e botões, sempre com espaçamento largo.

---

## 5. Grafismos

### Filetes em losango

`assets/Grafismos/filetes-losango.svg`. Cinco quadrados concêntricos girados 45°, em `copper-bright`, com opacidade decrescente (45% → 17%), traço de 1px (1,5px no menor). Ficam à direita dos **blocos escuros** (processo e contato), a 50–60% de opacidade, sem nunca cruzar o texto.

O losango é o motivo da marca: aparece nos filetes, na moldura do símbolo e ecoa o V.

### Outros padrões de fundo

Grupo **Fundos**: oito variações na mesma linguagem, em versão escura (site e capas) e clara (impressos): losangos concêntricos, treliça, V em cascata, molduras, losangos em fila, hachura, pontos e monograma. Todas têm foco à direita e o lado esquerdo livre para o texto. Use um por peça, nunca dois juntos.

### Eyebrow numerado

Toda seção abre com **número + filete + nome**, em `primary`, caixa-alta: `01 ——— O QUE JÁ RESOLVI`. O filete tem 32px e 60% de opacidade. As seções são numeradas de 01 a 08.

### Luz de estúdio

O fundo nunca é chapado: um foco frio vem de cima, um reflexo de cobre bem fraco aparece embaixo e as bordas escurecem (vinheta no escuro). É sutil: dá profundidade sem chamar atenção.

### Vidro

Cabeçalho, cartões flutuantes e menus usam vidro translúcido com desfoque (`shadow-card`, `shadow-float`, `shadow-surface`). Com "reduzir transparência" ativo, viram superfícies opacas.

---

## 6. Fotografia

| Arquivo | Uso |
| --- | --- |
| `assets/Fotografia/retrato-abertura.png` | Abertura do site: retrato à direita, fundo preto à esquerda, onde fica o texto. |
| `assets/Fotografia/retrato-sobre.png` | Seção "Quem atende você", em formato 4:5. |

Estilo: **retrato de estúdio em fundo preto**, luz lateral suave, roupa escura, olhar para a câmera. Sério e próximo.

- Na abertura, um gradiente preto da esquerda para a direita protege o texto e some antes do rosto; embaixo, a foto se dissolve na cor da página.
- Na seção Sobre, a foto ganha uma **moldura deslocada** de 1px em `primary` a 50%, 12px para fora (eco da moldura do símbolo).
- Não use fotos de banco de imagens, ilustrações genéricas ou pessoas que não sejam o Vinicius.

---

## 7. Layout e componentes

- **Uma coluna, seções ancoradas**, container de no máximo `container` (1152px), margens de `space-5` / `space-6`.
- **Título de seção em duas colunas** a partir de telas grandes: eyebrow + título à esquerda, parágrafo de apoio à direita, alinhado à base.
- **Ritmo**: seções comuns com 40–48px de respiro; seções de destaque com 56–80px e fundo `foreground` a 2%.
- **Blocos escuros** (`graphite-block`) para processo, contato e rodapé, com filetes em losango.

### Cartões

Retos (`radius-none`), borda de 1px em `border`, fundo `card` a 40%. No hover, a borda vai para `primary` a 40%. Dentro: etiqueta em caixa-alta, título `h3`, texto `small`, e o resultado numa **etiqueta de cobre** (`primary` a 12% de fundo, texto `primary`, ícone de check).

Variação "situação": o problema em cima e a resposta numa faixa embaixo com fundo `primary` a 6% e filete `primary` a 15%.

### Botões

| Tipo | Aparência |
| --- | --- |
| Principal | Fundo `primary` (ou `copper-bright` nos blocos escuros), texto `primary-foreground`, 44px de altura, `radius-sm`, caixa-alta semibold. |
| Contorno | Borda `border`, fundo transparente; nos blocos escuros, borda branca a 25%. |
| Link | Texto `primary` com seta ↗ para links externos e → para âncoras internas. |

### Chips

Borda de 1px, sem raio, texto 12px em `muted-foreground`: "Controle de pedidos", "Avisos automáticos".

### Faixa de tecnologias

Faixa em `primary` com texto `primary-foreground`, rolando sem fim (45s), pausa ao passar o mouse e para quando a pessoa pede menos movimento.

---

## 8. Iconografia

- **Remix Icon, versão Line** (traço, cantos suaves) é a família principal: setas, check, chat, e-mail, mapa, ferramentas.
- **Hugeicons** só para logos que o Remix não tem (TypeScript, shadcn/ui).
- Tamanhos: 14px em links, 16px em botões e listas, 20–24px em destaques.
- Ícones de serviço vão num quadrado de 44px com borda `primary` a 40%, sem raio.
- Cor: `primary` quando marcam ação ou resultado; `muted-foreground` nos demais.
- Sem emoji. A única exceção é o coração no rodapé ("Feito com ♥"), em `copper-bright`.

---

## 9. Movimento

- **Entrada**: sobe 8px e aparece, 300ms, ease-out (`rise-in`). Na abertura, 900ms, em sequência de 150ms (título, frase, botões).
- **Hover**: só cor e um pequeno deslocamento de seta (2px).
- Sem desfoque, sem escala, sem efeitos chamativos.
- Tudo respeita **"reduzir movimento"**: animações param e a faixa vira uma lista estática.

---

## 10. Tom de voz

**Direto, simples e acolhedor.** Fala com "você", frases curtas, sem jargão. Mostra prazo, custo e resultado. Confiante sem exagero.

### Princípios

1. **Comece pela dor, em forma de pergunta.** "Digitando a mesma coisa em dois lugares?"
2. **Responda com o resultado, não com a técnica.** "Os dados entram uma vez só. O resto acontece sozinho."
3. **Seja concreto.** "Valor fechado por etapa", "proposta por escrito", "tudo em seu nome".
4. **Primeira pessoa honesta.** "O que já resolvi", "Quem atende você". Plural ("resolvemos", "trabalhamos") quando fala da Carbon Cycle.
5. **Nunca prometa o que não dá para provar.** Sem números inventados, sem "o melhor", sem "revolucionário".

### Faça / evite

| Faça | Evite |
| --- | --- |
| "Pare de perder horas com planilha e retrabalho." | "Soluções inovadoras de transformação digital." |
| "Os sistemas passam a conversar, e ninguém digita nada duas vezes." | "Integração via API REST com middleware." |
| "A IA sugere; uma pessoa revisa, testa e responde por tudo." | "Potencializado por inteligência artificial de ponta." |
| "Quero uma proposta" | "Saiba mais" / "Clique aqui" |

### Chamadas para ação usadas no site

"Quero uma proposta" · "Quero resolver a minha" · "Quero minha proposta" · "Ver o case Cartório LCM" · "Ver casos" · "Ler o trabalho".

### IA consciente (mensagem fixa)

Quatro regras que aparecem sempre que se fala de IA: **uma pessoa responsável**, **seus dados protegidos**, **transparência** e **só quando compensa**.

---

## 11. Acessibilidade

- Foco sempre visível: anel de 2px em `ring`.
- Texto de apoio nunca abaixo de `muted-foreground`.
- Respeite "reduzir movimento" e "reduzir transparência".
- Imagens decorativas com `alt` vazio; o retrato da seção Sobre tem `alt="Vinicius Souza"`.
- Ver o aviso de contraste do `primary` no tema claro (seção 3).

---

## Não sincronizado


- **Fontes**: Raleway, Oxanium e JetBrains Mono vêm do Google Fonts pelo `next/font`; não há arquivos de fonte no repositório.
- **Componentes React** (botão, cartões, cabeçalho, formulário de proposta): não foram empacotados; estão descritos na seção 7. Código em `components/ui/button.tsx`, `components/site-header.tsx` e `app/(public)/page.tsx`.
- **Cores da área de mensagens** (temas ocean, forest, sunset, lavender, graphite do chat interno) ficaram de fora: são do painel, não da marca.
- **Ícone de app** (`icone-app.svg`): redesenhado em SVG a partir do código de `app/apple-icon.tsx`, que gera o PNG na hora; o desenho e as cores são os mesmos.
- Durações de animação e desfoque do vidro estão no texto (seções 5 e 9), não em tokens.
