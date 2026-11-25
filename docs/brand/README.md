# Vinicius Souza — Manual de identidade · v2 Editorial

**Processos claros. Dados confiáveis.**
Menos planilha, mais resultado: sistemas e automações sob medida que organizam o trabalho e os números da sua empresa.

Este manual descreve a identidade de **viniccius.com.br** a partir da branch `design/editorial`. A versão anterior (grafite e cobre) está no histórico do Git, em `main@b2d93bc`. O plano da mudança está em [`plano-redesign-editorial.md`](plano-redesign-editorial.md).

---

## 1. Essência

| | |
| --- | --- |
| **Assinatura** | Vinicius Souza |
| **Empresa** | Carbon Cycle LTDA · CNPJ 55.366.974/0001-85 |
| **Tagline** | Processos claros. Dados confiáveis. (apoio: "Menos planilha, mais resultado.") |
| **Foco** | **Processos** (o caminho do trabalho, do pedido à entrega) e **dados** (a informação que ele gera, pronta para decidir). São os dois capítulos principais do site. |
| **Promessa** | Sistemas e automações sob medida, com valor fechado por etapa, IA revisada por uma pessoa e tudo em nome do cliente. |
| **Para quem** | Empresas que perdem horas com planilha, retrabalho e sistemas que não conversam. Quem lê não é da área. |
| **Personalidade** | Editorial e direta. Clara como um relatório, próxima como uma conversa. |
| **Conceito visual** | **Papel e tinta**: página branca, texto preto, títulos enormes e blocos de cor chapada, como um relatório impresso. Nada de brilho, vidro ou degradê. |

Três ideias guiam tudo (não mudaram):

1. **O cliente se reconhece pelo problema, não pela tecnologia.**
2. **Prova antes de promessa.** Só fatos verificáveis.
3. **Uma pessoa responde.** A IA ajuda; uma pessoa revisa e assina.

---

## 2. Marca

### Símbolo

**"Vinicius."**: um **V cheio e reto em papel**, num **quadrado de tinta**, seguido de um **ponto laranja**. O V é a inicial; o ponto é a frase terminada, a resposta direta. Sem moldura, sem raio, sem traço.

| Arquivo | Uso |
| --- | --- |
| `assets/Marca/simbolo-v.svg` | Favicon e tamanhos pequenos (32×32). Igual a `app/icon.svg`. |
| `assets/Marca/icone-app.svg` | Ícone de tela inicial (180×180). Igual a `app/apple-icon.tsx`. |
| `assets/Marca/assinatura.svg` | Símbolo + nome, para documentos e e-mail. |

Construção (grade de 32):

- Quadrado `ink` **#000000**, 32×32, sem raio.
- V `paper` **#FFFFFF**, polígono cheio: (6,7) → (11,5 ; 7) → (16 ; 19,5) → (20,5 ; 7) → (26 ; 7) → (18,5 ; 25) → (13,5 ; 25).
- Ponto `orange` **#FE7141**, quadrado de 4×4 em (22 ; 21), alinhado à base do V.

### Assinatura

**Símbolo + "Vinicius Souza"** em Teachers Medium, tracking −0,04em, altura do nome = 60% do símbolo, espaço entre os dois = 30% do símbolo. No celular, só o símbolo.

### Uso

- O laranja do ponto é o único uso de cor de bloco fora de um bloco. Não troque por outra cor.
- Sobre fundo preto, o quadrado ganha filete de 1px em branco a 20%.
- Respiro mínimo: metade da largura do símbolo.
- Nunca girar, distorcer, arredondar, aplicar sombra ou separar o ponto do V.

---

## 3. Cores

A paleta é **tinta, papel e cinco cores de bloco**. A tinta faz quase tudo; a cor vem em **blocos inteiros**, nunca em detalhes soltos.

### Base

| Token | Claro | Escuro | Papel |
| --- | --- | --- | --- |
| `background` | #FFFFFF | #111111 (grafite) | Página. No escuro não é preto puro, para os blocos pretos se destacarem. |
| `foreground` | #000000 | #F2F2F2 | Texto e filetes fortes. |
| `muted-foreground` | preto 60% (#666666) | #A3A3A3 | Texto de apoio. |
| `border` | preto 12% | branco 16% | Filetes finos. |
| `primary` | #000000 | #FFFFFF | Botão principal, links, foco. |
| `primary-foreground` | #FFFFFF | #000000 | Texto sobre `primary`. |
| `card` / `muted` | #FFFFFF / #F2F2F2 | #181818 / #222222 | Superfícies do painel. |

### Cores de bloco (iguais nos dois temas)

| Token | Hex | Papel no site |
| --- | --- | --- |
| `orange` | **#FE7141** | Processo. Também o anel de foco. |
| `lavender` | **#CDABFE** | IA consciente. |
| `sage` | **#D1DDD3** | Situações. |
| `sky` | **#99EEFF** | Reserva (destaques pontuais, gráficos). |
| `lime` | **#F0FF1C** | Faixa de tecnologias, marca-texto. |

Regras:

- **Texto sobre cor de bloco é sempre preto** (classe `.paper`), também no tema escuro.
- **Um bloco de cor por seção**, ocupando a largura toda. Quando dois blocos de cor se encontram, um filete preto de 1px os separa.
- Capítulos fixos: **Processos = laranja**, **Dados = lavanda**.
- Cor de bloco **não** vira cor de texto, ícone ou borda.
- Proporção na página: ~70% papel, ~15% tinta (blocos pretos), ~15% cor.

### Contraste

| Par | Razão |
| --- | --- |
| preto / branco | 21:1 |
| preto 60% / branco | 5,7:1 |
| preto / qualquer cor de bloco | de 7,6:1 (laranja) a 19:1 (lima) |
| branco / cor de bloco | ✗ proibido (laranja 2,7:1) |

---

## 4. Tipografia

Duas famílias livres, do Google Fonts via `next/font`:

| Família | Token | Papel |
| --- | --- | --- |
| **Teachers** | `sans` e `heading` | Tudo: títulos (500) e texto (400). Tracking negativo, sempre. |
| **Geist Mono** | `mono` | Rótulos, numeração de seção, etiquetas, legendas de foto, código. |

### Escala

| Estilo | Tamanho / altura | Peso | Tracking | Uso |
| --- | --- | --- | --- | --- |
| `display` | 56→120 / 0,95 | 500 | −0,06em | Título de abertura |
| `h2` | 40→80 / 1,0 | 500 | −0,055em | Título de seção |
| `h3` | 28→40 / 1,1 | 500 | −0,04em | Títulos de caso, números de processo |
| `lead` | 20 / 1,25 | 400 | −0,03em | Parágrafo de apoio |
| `body` | 16 / 1,5 | 400 | −0,01em | Texto corrido |
| `label` | 12–13, caixa-alta | 500 (mono) | 0 | "01 · O QUE JÁ RESOLVI" |
| `button` | 16 / 1 | 500 | −0,02em | "Quero uma proposta →" |

Regras:

- **Um peso só nos títulos (500)**. O contraste vem do tamanho, não do peso.
- Caixa-alta **só em mono**. Texto em Teachers nunca vai em caixa-alta.
- Números com algarismos tabulares.
- Títulos com `text-balance`, parágrafos com `text-pretty`.

---

## 5. Grafismos

### Rótulo de seção

Toda seção abre com um rótulo mono: `01` + filete + `O QUE JÁ RESOLVI`. Filete de 1px na cor do texto, largura 32px.

### Filetes

O filete preto de 1px é o principal elemento gráfico: separa itens de lista, casos, perguntas e etapas. Filete de seção (topo de bloco) em 1px `foreground`.

### Etiqueta

Pequena caixa branca com filete preto e texto mono 10–11px em caixa-alta, colada a uma foto ou bloco: `VINICIUS SOUZA · CORUMBÁ, MS`. É o eco das etiquetas de colagem da referência.

### Marca-texto

Fundo `lime` atrás de uma palavra-chave, sem raio. No máximo uma vez por seção.

### Padrões

Feitos de quadrados cheios na cor do texto, sem degradê (`components/marketing/art.tsx`):

| Padrão | Componente | Significado | Onde |
| --- | --- | --- | --- |
| Meio-tom de pixels | `PixelField` | Dados | Capítulo Dados, topo do blog, login |
| Trilho de etapas | `StepRail` | Processos | Capítulo Processos |

Sempre em preto (ou branco no escuro) entre 15% e 30% de opacidade, com foco à direita e o lado do texto livre.

### Peças de relatório

Tiradas da referência, revisada quadro a quadro:

| Peça | Como é | Onde |
| --- | --- | --- |
| Barra da marca | Cabeçalho com a metade esquerda em `orange`: símbolo, nome e "Ler os capítulos +". A navegação fica à direita, no papel. | Todas as páginas públicas |
| Colagem de abertura | Peças retas sobrepostas (cor chapada, ilustrações, retrato, meio-tom), cada uma com uma etiqueta mono, derivando devagar (`animate-drift`, 14s). Fundo `lavender`. O título gigante fica embaixo, à direita. | Abertura |
| Retrato em ASCII | A foto convertida em caracteres mono (` .·:=+o0@`), branca sobre preto (`lib/portfolio/ascii-portrait.ts`). | Bloco "Em números" |
| Números gigantes | 96–112px, tracking −0,06em, em colunas separadas por filetes verticais; legenda curta embaixo. Só números com fonte pública. | Bloco "Em números" |
| Marca gigante | "Vinicius." ocupando a largura do rodapé (18vw), ponto em `orange`, sobre colunas de links e linha mono de créditos. | Rodapé |

### Fora da identidade

Losangos, luz de estúdio, vidro, degradês e sombras saem da linguagem. Os arquivos em `assets/Fundos` e `assets/Grafismos` ficam como registro da v1.

---

## 6. Fotografia

- Ilustrações, uma por cor de bloco: `public/brand/processos.svg` (quadro de cartões em colunas, laranja), `dados.svg` (barras em pixels, lavanda), `fluxo.svg` (fluxograma de etapas com volta de ajuste, sálvia), `relatorio.svg` (página de relatório com gráfico, lima) e `conferencia.svg` (tabela validada linha a linha, com um erro em laranja, ciano). Ilustrações nunca mostram números que pareçam resultado real: use rótulos ("Prazo", "Custo").
- **Tema escuro em tons**, não só preto: página #111; faixas alternadas (Serviços, Perguntas) #1A1A1A; bloco IA #202020; Em números #0A0A0A; Contato #000; rodapé #171717. Blocos de cor iguais aos do claro. Vetores com grão de impressão (`feTurbulence`), proporção 4:5, sempre com filete preto de 1px.
- Retratos atuais (`/me.png`, `/profile.png`) em **quadro reto, sem moldura deslocada**, com uma etiqueta mono no canto.
- Direção para fotos novas: grão visível, cor saturada, enquadramento recortado, combinando com as cores de bloco. Colagem de fotos só em capas.
- Nada de banco de imagens ou ilustração genérica.

---

## 7. Layout e componentes

- Container de até **1280px** (`max-w-7xl`), margens de 20px (celular) e 32px (desktop).
- Seções de 80–128px de respiro vertical. Blocos de cor vão de ponta a ponta.
- **Título de seção grande à esquerda**, apoio à direita alinhado à base (desktop).

### Botões

| Tipo | Aparência |
| --- | --- |
| Principal | Fundo `primary`, texto `primary-foreground`, 48px, raio 0, Teachers 16px peso 500, sem caixa-alta, seta → à direita. |
| Contorno | Filete 1px `foreground`, fundo transparente; hover inverte (fundo tinta, texto papel). |
| Link | Texto sublinhado com seta ↗ (externo) ou → (âncora). |

### Listas e cartões

Sem caixas. Itens empilhados com filete preto em cima; número mono à esquerda, título `h3`, texto de apoio. No hover, o item ganha fundo `muted`.

### Chips

Filete 1px, raio 0, texto mono 11px em caixa-alta.

### Faixa de tecnologias

Faixa `lime`, texto preto, rolando sem fim (45s), pausa no hover e para com "reduzir movimento".

### Painel

O painel herda os tokens: raio 0, tinta preta, Teachers. Densidade e componentes não mudam.

---

## 8. Iconografia

- **Remix Icon, versão Line**; Hugeicons só para logos que faltam.
- Ícones em `foreground`, nunca coloridos.
- Seta → no fim de todo botão principal.
- Sem emoji (exceção: ♥ do rodapé).

---

## 9. Movimento

- **Entrada da página inicial** (~3,8s, só CSS, **cortes secos, nunca esmaecer**), como a referência:
  1. A colagem abre em tela cheia, sem cabeçalho; o fundo troca de cor em cortes (laranja, grafite, sálvia, lavanda: `intro-bg`) e as peças surgem em cortina (`tile-in`).
  2. Uma linha preta cresce no centro, abre na vertical e vira o cartão (`intro-card`); "Processos & dados" e "Vinicius." entram **40% maiores e vão diminuindo** (`intro-text`), e o cartão encolhe junto até 42% e fecha para cima.
  3. A colagem encolhe para o topo (`intro-collapse`), o cabeçalho desce (`header-in`) e o título entra palavra por palavra (`word-in`).
  Com "reduzir movimento", a página já abre no estado final.
- **Entrada das seções**: sobe 12px e aparece, 500ms, ease-out (`Reveal`).
- **Hover**: inversão de cor e seta andando 4px.
- Sem desfoque, escala ou parallax. Tudo respeita "reduzir movimento".

---

## 10. Tom de voz

Não mudou. **Direto, simples e acolhedor**: fala com "você", começa pela dor em forma de pergunta, responde com o resultado, é concreto e nunca promete o que não prova.

| Faça | Evite |
| --- | --- |
| "Pare de perder horas com planilha e retrabalho." | "Soluções inovadoras de transformação digital." |
| "A IA sugere; uma pessoa revisa, testa e responde por tudo." | "Potencializado por inteligência artificial de ponta." |
| "Quero uma proposta" | "Saiba mais" / "Clique aqui" |

IA consciente (mensagem fixa): **uma pessoa responsável**, **seus dados protegidos**, **transparência** e **só quando compensa**.

---

## 11. Acessibilidade

- Foco: anel de 2px em `orange` com 2px de afastamento, visível sobre papel e tinta.
- Nunca texto branco sobre cor de bloco.
- Texto de apoio no mínimo a 60% de opacidade.
- Respeite "reduzir movimento".

---

## Pendências

- `tokens.json`, `Impressos.md`, o modelo de proposta e os PDFs gerados ainda seguem a v1 (cobre).
- Fotos no novo estilo (granulado, cor saturada) ainda não existem.
