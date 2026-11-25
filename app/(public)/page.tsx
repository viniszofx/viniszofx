import type { Metadata } from "next";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ServerImage as Image } from "@/components/server-image";
import {
  RiArrowRightUpLine as ArrowUpRight, RiArrowRightLine as ArrowRight, RiArrowDownLine as ArrowDown, RiCheckLine as Check, RiCloseLine as Close,
  RiCodeBoxLine as Code, RiFlowChart as Flow, RiPlugLine as Plug, RiSparkling2Line as Sparkle, RiSmartphoneLine as Phone, RiToolsLine as Tools,
  RiShieldCheckLine as Shield, RiUserFollowLine as Human, RiEyeLine as Eye, RiFocus3Line as Focus, RiMailLine as Mail, RiMapPinLine as MapPin,
  RiAddLine as Plus,
} from "@remixicon/react";
import { RiLinkedinBoxLine as Linkedin } from "@remixicon/react";
import {
  RiHeart3Fill, RiDatabase2Line, RiBarChartBoxLine, RiDashboard3Line, RiCodeSSlashLine, RiFileExcel2Line, RiFileChartLine,
  RiCheckDoubleLine, RiFileTextLine, RiPulseLine, RiNodeTree, RiFocus2Line,
} from "@remixicon/react";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadWidget, OpenLeadButton } from "@/components/marketing/lead-widget";
import { ProjectCard } from "@/components/portfolio/project-card";
import { profile, projects, technologies } from "@/lib/portfolio/content";
import { aiPrinciples, aiUses, dataStack, faq, pillars, processSteps, services, situations } from "@/lib/portfolio/services";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";
import { PixelField, StepRail } from "@/components/marketing/art";
import { asciiPortrait } from "@/lib/portfolio/ascii-portrait";
import { disabledModules } from "@/lib/modules-server";

export const metadata: Metadata = {
  title: "Vinicius Souza | Sistemas e automações sob medida para a sua empresa",
  description: "Pare de perder horas com planilha e retrabalho. Sistemas e automações sob medida, com valor fechado por etapa, IA revisada por uma pessoa e tudo em seu nome.",
  alternates: { canonical: "/" },
};

const serviceIcons = { sistemas: Code, automacao: Flow, integracoes: Plug, ia: Sparkle, mobile: Phone, evolucao: Tools } as const;
const principleIcons = [Human, Shield, Eye, Focus];
// Ícone de cada item da faixa de dados e análise (lib/portfolio/services.ts › dataStack).
const dataIcons = {
  chart: RiBarChartBoxLine, dashboard: RiDashboard3Line, database: RiDatabase2Line, sql: RiCodeSSlashLine, sheet: RiFileExcel2Line, report: RiFileChartLine,
  check: RiCheckDoubleLine, file: RiFileTextLine, pulse: RiPulseLine, plug: Plug, tree: RiNodeTree, target: RiFocus2Line,
} as const;
// Fatos verificáveis (LinkedIn, currículo e anais do Evinci 2024), logo abaixo da abertura.
const paperUrl = "https://www.alice.cnptia.embrapa.br/alice/handle/doc/1172127";
const credentials = [
  { title: "3+ anos", text: "na Embrapa Pantanal, com sistemas de pesquisa", href: "#casos", cta: "Ver casos" },
  { title: "Trabalho publicado", text: "nos anais do Evinci 2024, pela Embrapa", href: paperUrl, cta: "Ler o trabalho" },
  { title: "Site no ar", text: "para cliente, do primeiro pedido à publicação", href: "https://cartorioaltolonga.com.br/", cta: "Ver o site" },
] as const;
const proceedingsUrl = "https://ainfo.cnptia.embrapa.br/digital/bitstream/item/278419/1/EVENTO-DE-INICIACAO-CIENTIFICA-DO-PANTANAL-11.-2024-Corumba-final.pdf";
// Casos reais: problema, o que foi feito e o resultado. Só o que está no currículo e na publicação.
const cases = [
  { problem: "Sistema interno de inventário fora do ar.", action: "Encontrei a causa (uma versão incompatível do PHP derrubava a conexão com o banco de dados) e corrigi com o sistema em uso.", result: "Correção urgente na Embrapa Pantanal" },
  { problem: "Dados de pesquisa presos dentro da plataforma.", action: "Ajudei a definir o que a Plataforma Alelo Animal precisava fazer e contribuí para a exportação dos dados em planilha (CSV).", result: "Recurso em uso até hoje" },
  { problem: "Coleta e validação de dados feitas à mão.", action: "Mapeei o caminho dos dados, do campo ao sistema, e propus automatizar a coleta e a conferência, em tempo real e com várias pessoas ao mesmo tempo.", result: "Trabalho publicado pela Embrapa", href: paperUrl },
  { problem: "Decisões tomadas sem os números em mãos.", action: "Montei painéis e relatórios em Excel e Power BI para apoiar as decisões da pesquisa científica.", result: "Informação pronta para decidir" },
] as const;
const portrait = "/profile.png";

/*
 * Identidade editorial (docs/brand/README.md): papel branco, tinta preta, títulos enormes e apertados,
 * rótulos em mono e um bloco de cor chapada por seção (.paper deixa o texto preto também no tema escuro).
 * O site é organizado como um relatório: Processos e Dados são os dois capítulos principais.
 */
const button = "h-12 px-6 text-base";
const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";
const block = "paper border-t border-black text-black";
const label = "font-mono text-xs font-medium uppercase";
const h2 = "text-[2.5rem] leading-none font-medium tracking-[-0.055em] text-balance sm:text-6xl lg:text-[5rem]";
const lead = "text-xl leading-tight tracking-[-0.03em] text-pretty";

function Eyebrow({ index, children, className }: { index?: string; children: ReactNode; className?: string }) {
  return <p className={cn("flex items-center gap-3", label, className)}>{index && <span className="tabular-nums">{index}</span>}{index && <span aria-hidden="true" className="h-px w-8 bg-current" />}{children}</p>;
}

function Heading({ index, eyebrow, title, children, id }: { index: string; eyebrow: string; title: string; children?: ReactNode; id: string }) {
  return <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
    <div><Eyebrow index={index}>{eyebrow}</Eyebrow><h2 id={id} className={cn("mt-6", h2)}>{title}</h2></div>
    {children && <p className={cn("self-end text-muted-foreground", lead)}>{children}</p>}
  </Reveal>;
}

/** Barra de ação larga, como o fim de um capítulo: texto à esquerda, seta à direita. */
function BarLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} className={cn("group flex h-14 items-center justify-between bg-black px-6 text-base font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>{children}<ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" /></a>;
}

const pillarBlocks = { processos: "bg-orange", dados: "bg-lavender" } as const;

// Peças da colagem da abertura, em % do quadro: [esquerda, topo, largura, altura]. "d" vale a partir de 640px;
// "m" é a composição do celular (null = some no celular, para as peças não virarem tiras). Nas duas, a borda
// direita e a de baixo de cada peça ficam dentro do quadro, senão a etiqueta é cortada.
type Box = [number, number, number, number];
const collage: { label: string; className: string; src?: string; pattern?: boolean; d: Box; m: Box | null; drift: [number, number]; delay: string }[] = [
  { label: "Fluxo", src: "/brand/fluxo.svg", className: "border border-black bg-sage", d: [-2, 14, 20, 74], m: [-10, 16, 36, 42], drift: [18, -12], delay: "0s" },
  { label: "Processos", src: "/brand/processos.svg", className: "border border-black", d: [16, -8, 18, 62], m: [62, 16, 36, 36], drift: [-14, 20], delay: "-3s" },
  { label: "Quem constrói", src: "/me.png", className: "bg-black", d: [36, 10, 24, 80], m: [27, 18, 38, 52], drift: [10, -18], delay: "-6s" },
  { label: "Painel", className: "bg-orange", pattern: true, d: [58, -6, 16, 48], m: null, drift: [-20, 14], delay: "-2s" },
  { label: "Dados", src: "/brand/dados.svg", className: "border border-black", d: [70, 34, 17, 64], m: [64, 60, 34, 38], drift: [16, -22], delay: "-8s" },
  { label: "Conferência", src: "/brand/conferencia.svg", className: "border border-black bg-sky", d: [84, -4, 15, 58], m: null, drift: [-12, 16], delay: "-5s" },
  { label: "Relatório", src: "/brand/relatorio.svg", className: "border border-black bg-lime", d: [8, 60, 14, 38], m: [2, 60, 34, 38], drift: [14, -10], delay: "-10s" },
];
const pct = (box: Box, prefix: string) => Object.fromEntries(["l", "t", "w", "h"].map((key, index) => [`--${prefix}${key}`, `${box[index]}%`]));

const titleWords = ["Processos", "claros.", "Dados", "confiáveis."];

const stats = [
  { value: "3+", label: "anos na Embrapa Pantanal, com sistemas de pesquisa" },
  { value: "2", label: "trabalhos publicados nos anais do Evinci 2024" },
  { value: String(technologies.flatMap(group => group.items).length), label: "tecnologias usadas no dia a dia, do banco ao celular" },
];

const footerLinks = [
  { title: "Capítulos", links: [{ href: "#processos", label: "01 Processos" }, { href: "#dados", label: "02 Dados" }, { href: "#casos", label: "03 Casos" }, { href: "#situacoes", label: "04 Situações" }, { href: "#servicos", label: "05 Serviços" }] },
  { title: "Sobre", links: [{ href: "#sobre", label: "Quem atende você" }, { href: "#perguntas", label: "Perguntas frequentes" }, { href: "/blog", label: "Blog" }, { href: "/privacidade", label: "Privacidade" }] },
  { title: "Contato", links: [{ href: `mailto:${profile.email}`, label: profile.email }, { href: profile.linkedin, label: "LinkedIn" }, { href: profile.github, label: "GitHub" }] },
];

export default async function Page() {
  // Com Leads desligado em Sistema › Módulos, os botões de conversa viram link de e-mail.
  const leads = !(await disabledModules()).includes("leads");
  const talk = (text: string, className = button) => leads
    ? <OpenLeadButton className={cn(buttonVariants(), className)}>{text}<ArrowRight data-icon="inline-end" /></OpenLeadButton>
    : <a href={`mailto:${profile.email}`} className={cn(buttonVariants(), className)}>{text}<ArrowRight data-icon="inline-end" /></a>;

  return <>
    <main id="conteudo">
      {/* Abertura: colagem de peças (cor chapada, ilustrações e retrato) com etiquetas mono, que derivam devagar;
          embaixo, o título gigante à direita e a frase, os créditos e o botão à esquerda. */}
      {/* .home-intro avisa o cabeçalho (via :has) para descer só depois da capa. */}
      <section aria-labelledby="apresentacao" className="home-intro relative [--collage-h:calc(46svh+4rem)] sm:[--collage-h:calc(52svh+4rem)]">
        {/* Entrada: a colagem começa em tela cheia e encolhe para o topo depois do cartão (animações em globals.css).
            Com "reduzir movimento", já abre no tamanho final, sem cartão. */}
        <div aria-hidden="true" className="absolute inset-x-0 -top-16 z-20 h-(--collage-h) min-h-96 animate-intro-collapse overflow-hidden bg-lavender [contain:layout_paint] motion-reduce:animate-none">
          {/* Fundo que troca de cor em cortes secos antes de assentar no lavanda. */}
          <div className="absolute inset-0 animate-intro-bg motion-reduce:hidden" />
          {collage.map((tile, index) => <div key={tile.label}
            style={{ ...pct(tile.d, "d"), ...(tile.m ? pct(tile.m, "m") : {}), "--drift-x": `${tile.drift[0]}px`, "--drift-y": `${tile.drift[1]}px`, animationDelay: `${120 + index * 110}ms` } as CSSProperties}
            className={cn("absolute animate-tile-in motion-reduce:animate-none sm:block sm:top-(--dt) sm:left-(--dl) sm:h-(--dh) sm:w-(--dw)", tile.m ? "top-(--mt) left-(--ml) h-(--mh) w-(--mw)" : "hidden")}>
            <div style={{ animationDelay: tile.delay }} className={cn("absolute inset-0 animate-drift will-change-transform motion-reduce:animate-none max-sm:animate-none max-sm:will-change-auto", tile.className)}>{/* Sem deriva no celular: as folgas são pequenas e a deriva esconderia etiquetas. */}
              {tile.src && <Image src={tile.src} alt="" fill priority={tile.src === "/me.png"} unoptimized={tile.src.endsWith(".svg")} sizes="(min-width: 640px) 25vw, 45vw" className={cn("object-cover", tile.src === "/me.png" ? "object-[72%_center]" : "object-top")} />}
              {tile.pattern && <PixelField className="absolute inset-0 size-full text-black opacity-40" />}
              <span className={cn(label, "absolute right-2 bottom-2 border border-black bg-white px-1.5 py-0.5 text-[0.6rem] text-black")}>{tile.label}</span>
            </div>
          </div>)}
          {/* Cartão de capa (centralizado pelo translate dos quadros de intro-card). O texto entra grande, a partir do seu
              canto (intro-text), e diminui junto com o cartão. */}
          <div className="ink absolute top-1/2 left-1/2 flex aspect-[4/5] w-[min(84vw,34rem)] animate-intro-card flex-col justify-between overflow-hidden bg-black p-5 text-white motion-reduce:hidden sm:p-7">
            <p className="origin-top-left animate-intro-text text-5xl leading-[0.95] font-medium tracking-[-0.05em] sm:text-7xl">{["Processos", "& dados"].map((line, index) => <span key={line} className="block overflow-hidden pb-[0.08em]"><span style={{ animationDelay: `${1150 + index * 120}ms` }} className="block animate-word-in">{line}</span></span>)}</p>
            <p className="origin-bottom-right animate-intro-text self-end overflow-hidden pb-[0.08em] text-6xl leading-none font-medium tracking-[-0.06em] sm:text-8xl"><span className="block animate-word-in [animation-delay:1400ms]">Vinicius<span className="text-orange">.</span></span></p>
          </div>
        </div>
        {/* Espaçador: reserva no fluxo a altura final da colagem (que é absoluta e fica por cima durante a entrada). */}
        <div aria-hidden="true" className="-mt-16 h-(--collage-h) min-h-96" />
        <div className={cn(container, "grid gap-10 pt-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16 lg:pt-14")}>
          <div className="order-2 flex flex-col justify-between gap-10 lg:order-1">
            <p className={cn("max-w-sm", lead)}>Menos planilha, mais resultado: sistemas e automações sob medida que organizam o trabalho e os números da sua empresa.</p>
            <div className="flex flex-wrap items-center gap-4">{talk("Quero uma proposta")}</div>
            <p className={cn(label, "text-[0.7rem]")}>Por Vinicius Souza · Carbon Cycle<br />Corumbá, MS · atendimento remoto</p>
          </div>
          <div className="order-1 lg:order-2">
            <h1 id="apresentacao" className="text-[3.5rem] leading-[0.92] font-medium tracking-[-0.06em] text-balance sm:text-8xl xl:text-[8.5rem]">
              {/* Cada palavra sobe de baixo de uma máscara, em sequência, depois que a colagem encolhe. */}
              {/* O espaço fica fora da máscara: dentro de um inline-block ele some. */}
              {titleWords.map((word, index) => <Fragment key={word}>{index > 0 && " "}<span className="inline-block overflow-hidden pb-[0.1em] align-top">
                <span style={{ animationDelay: `${3400 + index * 90}ms` }} className={cn("inline-block animate-word-in motion-reduce:animate-none", word === "confiáveis." && "bg-lime px-1 text-black")}>{word}</span>
              </span></Fragment>)}
            </h1>
            {/* Só no desktop: no celular ficaria entre o título e a frase, empurrando o botão para baixo. */}
            <a href="#processos" className="mt-10 hidden items-center justify-between lg:flex border-t border-foreground pt-4 text-lg font-medium tracking-[-0.03em]">Role para ler<ArrowDown className="size-5" /></a>
          </div>
        </div>
      </section>

      {/* Tecnologias em faixa infinita (lima). A lista aparece duas vezes (a segunda escondida de leitores de tela) e anda
          metade da largura; pausa ao passar o mouse. Com "reduzir movimento", fica parada e quebra linha. */}
      <div aria-label="Dados e análise" role="region" className={cn(block, "group/marquee relative overflow-hidden border-y bg-lime py-4")}>
        <div className="flex w-max animate-marquee will-change-transform group-hover/marquee:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none">
          {[0, 1].map(copy => <ul key={copy} aria-hidden={copy === 1 || undefined} className={cn("flex shrink-0 items-center gap-10 pr-10", copy === 1 && "motion-reduce:hidden", "motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-8 motion-reduce:gap-y-3 motion-reduce:px-5")}>
            {dataStack.map(item => { const Icon = dataIcons[item.icon]; return <li key={item.label} className={cn("flex items-center gap-2 whitespace-nowrap", label)}><Icon className="size-4 shrink-0" aria-hidden="true" />{item.label}</li>; })}
          </ul>)}
        </div>
      </div>

      {/* Credenciais: régua de três colunas com filetes. */}
      <ul aria-label="Credenciais" className={cn(container, "grid sm:grid-cols-3")}>{credentials.map(({ title, text, href, cta }) => <li key={title} className="border-b border-foreground sm:border-b-0 sm:border-l sm:first:border-l-0 sm:[&:not(:first-child)]:pl-8">
        <a href={href} {...(href.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="group block py-10 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <p className="text-4xl font-medium tracking-[-0.05em]">{title}</p><p className="mt-2 text-muted-foreground">{text}</p>
          <p className={cn(label, "mt-5 inline-flex items-center gap-1.5 group-hover:underline")}>{cta}{href.startsWith("#") ? <ArrowRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}</p>
        </a>
      </li>)}</ul>

      {/* 01 Processos e 02 Dados: os dois capítulos do site, cada um num bloco de cor. */}
      {pillars.map((pillar, index) => <section key={pillar.id} id={pillar.id} aria-labelledby={`${pillar.id}-titulo`} className={cn(block, pillarBlocks[pillar.id], "relative isolate scroll-mt-16 overflow-hidden")}>
        {pillar.id === "processos"
          ? <StepRail className="absolute inset-x-0 top-10 -z-10 h-24 w-full text-black opacity-30" />
          : <PixelField className="absolute inset-0 -z-10 size-full text-black opacity-20" fade="right" />}
        <div className={cn(container, "py-20 sm:py-28")}>
          <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <Eyebrow index={`0${index + 1}`}>Capítulo</Eyebrow>
              <h2 id={`${pillar.id}-titulo`} className="mt-6 text-7xl leading-none font-medium tracking-[-0.06em] sm:text-8xl xl:text-9xl">{pillar.title}</h2>
            </div>
            <div className="self-end"><p className="text-3xl leading-tight font-medium tracking-[-0.04em] text-balance">{pillar.lead}</p><p className={cn("mt-5 text-black/70", lead)}>{pillar.description}</p></div>
          </Reveal>
          <Reveal className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/5] max-w-md border border-black"><Image src={`/brand/${pillar.id}.svg`} alt="" fill unoptimized sizes="28rem" /></div>
            <div className="self-end">
              <p className={label}>Neste capítulo:</p>
              <ul className="mt-4 border-b border-black">{pillar.items.map(item => <li key={item} className="border-t border-black py-3.5 text-lg tracking-[-0.02em]">{item}</li>)}</ul>
              <BarLink href="#contato" className="mt-8">Quero organizar meus {pillar.title.toLowerCase()}</BarLink>
            </div>
          </Reveal>
        </div>
      </section>)}

      {/* 03 Casos reais: lista numerada com filetes. */}
      <section id="casos" aria-labelledby="casos-titulo" className={cn("lazy-section", container, "scroll-mt-16 py-20 sm:py-28")}>
        <Heading id="casos-titulo" index="03" eyebrow="O que já resolvi" title="Problemas reais, resolvidos na prática.">Mais de três anos na Embrapa Pantanal cuidando do caminho dos dados, do campo ao sistema.</Heading>
        <ol className="mt-16 border-b border-foreground">{cases.map((item, index) => <Reveal as="li" key={item.problem}
          className="grid gap-4 border-t border-foreground py-8 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
          <p className={cn(label, "tabular-nums")}>Caso 0{index + 1}</p>
          <h3 className="text-3xl leading-tight font-medium tracking-[-0.04em] text-pretty">{item.problem}</h3>
          <div className="flex flex-col gap-4">
            <p className="leading-relaxed text-muted-foreground">{item.action}</p>
            <p className="mt-auto">{"href" in item
              ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-lime px-2 py-1 font-medium text-black hover:underline"><Check className="size-4 shrink-0" />{item.result}<ArrowUpRight className="size-3.5" /></a>
              : <span className="inline-flex items-center gap-1.5 font-medium"><Check className="size-4 shrink-0" />{item.result}</span>}</p>
          </div>
        </Reveal>)}</ol>
      </section>

      {/* 04 Situações: bloco sálvia. */}
      <section id="situacoes" aria-labelledby="situacoes-titulo" className={cn("lazy-section", block, "scroll-mt-16 bg-sage")}>
        <div className={cn(container, "py-20 sm:py-28")}>
          <Heading id="situacoes-titulo" index="04" eyebrow="Reconhece alguma?" title="Quanto tempo a sua equipe perde com isso?">Cada uma dessas situações consome horas toda semana. Todas têm solução.</Heading>
          <ul className="mt-16 grid gap-px border border-black bg-black sm:grid-cols-2 lg:grid-cols-3">{situations.map(item => <Reveal as="li" key={item.problem} className="flex flex-col gap-6 bg-sage p-6 sm:p-8">
            <h3 className="flex-1 text-2xl leading-tight font-medium tracking-[-0.04em] text-pretty">{item.problem}</h3>
            <p className="flex gap-2.5 border-t border-black pt-4 leading-relaxed"><ArrowRight className="mt-1 size-4 shrink-0" aria-hidden="true" />{item.solution}</p>
          </Reveal>)}</ul>
          <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4"><p className={lead}>Não encontrou a sua? Conte como funciona aí.</p>{talk("Quero resolver a minha")}</Reveal>
        </div>
      </section>

      {/* 05 Serviços: grade com filetes. */}
      <section id="servicos" aria-labelledby="servicos-titulo" className="lazy-section scroll-mt-16 border-t border-foreground dark:bg-[#1a1a1a]">
        <div className={cn(container, "py-20 sm:py-28")}>
        <Heading id="servicos-titulo" index="05" eyebrow="Serviços" title="Tudo o que a sua operação precisa, sob medida.">Do primeiro sistema à evolução do que você já tem, sempre começando pelo jeito que a sua equipe trabalha.</Heading>
        <div className="mt-16 grid gap-px border border-foreground bg-foreground sm:grid-cols-2 lg:grid-cols-3">{services.map(service => { const Icon = serviceIcons[service.id];
          return <Reveal as="article" key={service.id} className="flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-muted sm:p-8">
            <Icon className="size-7" aria-hidden="true" />
            <h3 className="mt-4 text-3xl leading-tight font-medium tracking-[-0.04em]">{service.title}</h3>
            <p className="leading-relaxed text-muted-foreground">{service.description}</p>
            <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">{service.items.map(item => <li key={item} className={cn(label, "border border-foreground px-2 py-1 text-[0.65rem]")}>{item}</li>)}</ul>
          </Reveal>; })}</div>
      </div>
      </section>

      {/* 06 IA consciente: bloco preto. */}
      <section id="ia" aria-labelledby="ia-titulo" className="lazy-section ink scroll-mt-16 border-t border-white/15 bg-black dark:bg-[#202020]">
        <div className={cn(container, "py-20 sm:py-28")}>
          <Heading id="ia-titulo" index="06" eyebrow="IA consciente" title="A velocidade da IA, sem colocar o seu negócio em risco.">Quatro regras, e uma pessoa responde por cada entrega.</Heading>
          <div className="mt-16 grid border-t border-white/30 sm:grid-cols-2 lg:grid-cols-4">{aiPrinciples.map((principle, index) => { const Icon = principleIcons[index];
            return <Reveal as="article" key={principle.title} className="border-b border-white/30 py-8 sm:pr-8 lg:border-b-0"><Icon className="size-6" aria-hidden="true" /><h3 className="mt-6 text-2xl font-medium tracking-[-0.04em]">{principle.title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{principle.description}</p></Reveal>; })}</div>
          <div className="mt-12 grid gap-px bg-white/30 md:grid-cols-2">
            <Reveal className={cn(block, "border-t-0 bg-lavender p-8 sm:p-10")}><h3 className={cn(label, "mb-6 flex items-center gap-2")}><Check className="size-4" />Onde a IA entra</h3><ul className="space-y-3">{aiUses.yes.map(item => <li key={item} className="flex gap-3 text-lg leading-snug tracking-[-0.02em]"><Check className="mt-1 size-4 shrink-0" />{item}</li>)}</ul></Reveal>
            <Reveal className="bg-black p-8 sm:p-10"><h3 className={cn(label, "mb-6 flex items-center gap-2 text-muted-foreground")}><Close className="size-4" />Onde a IA não entra</h3><ul className="space-y-3 text-muted-foreground">{aiUses.no.map(item => <li key={item} className="flex gap-3 text-lg leading-snug tracking-[-0.02em]"><Close className="mt-1 size-4 shrink-0" />{item}</li>)}</ul></Reveal>
          </div>
        </div>
      </section>

      {/* 07 Processo de trabalho: bloco ciano, números grandes. */}
      <section id="processo" aria-labelledby="processo-titulo" className={cn("lazy-section", block, "scroll-mt-16 bg-sky")}>
        <div className={cn(container, "py-20 sm:py-28")}>
          <Reveal className="max-w-4xl"><Eyebrow index="07">Como trabalhamos</Eyebrow><h2 id="processo-titulo" className={cn("mt-6", h2)}>Do primeiro contato ao sistema no ar, em quatro passos.</h2></Reveal>
          <ol className="mt-16 grid gap-x-8 md:grid-cols-4">{processSteps.map((step, index) => <Reveal as="li" key={step.title} className="border-t border-black py-8">
            <p className="text-7xl leading-none font-medium tracking-[-0.06em] tabular-nums">0{index + 1}</p>
            <h3 className="mt-6 text-2xl font-medium tracking-[-0.04em]">{step.title}</h3>
            <p className="mt-3 leading-relaxed text-black/70">{step.description}</p>
          </Reveal>)}</ol>
        </div>
      </section>

      {/* 08 Projetos */}
      <section id="projetos" aria-labelledby="projetos-titulo" className={cn("lazy-section", container, "scroll-mt-16 py-20 sm:py-28")}>
        <Heading id="projetos-titulo" index="08" eyebrow="Projetos" title="Qualidade que você pode conferir.">Um site em uso por cliente e projetos de código aberto, que qualquer pessoa técnica da sua confiança pode avaliar.</Heading>
        <div className="mt-16 grid gap-6 md:grid-cols-2">{projects.map((project, index) => <Reveal key={project.name} className="[&>article]:h-full"><ProjectCard project={project} index={index} /></Reveal>)}</div>
        <a href={`${profile.github}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-1.5 font-medium underline underline-offset-4">Todos os repositórios<ArrowUpRight className="size-4" /></a>
      </section>

      {/* 09 Sobre: citação à esquerda (bloco preto), texto à direita. */}
      <section id="sobre" aria-labelledby="sobre-titulo" className="lazy-section scroll-mt-16 border-t border-foreground">
        <Reveal className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="ink flex flex-col justify-between gap-10 bg-black p-8 sm:p-12">
            <p aria-hidden="true" className="text-8xl leading-none font-medium">“</p>
            <div className="flex items-end gap-5">
              <div className="relative size-24 shrink-0 overflow-hidden bg-black"><Image src={portrait} alt="Vinicius Souza" fill quality={90} sizes="6rem" className="object-cover object-[50%_58%]" /></div>
              <div><p className="text-lg font-medium">{profile.name}</p><p className={cn(label, "mt-1 text-[0.65rem] text-muted-foreground")}>Analista de sistemas · Carbon Cycle</p></div>
            </div>
          </div>
          <div className={cn(block, "border-t-0 bg-sage p-8 sm:p-12")}>
            <Eyebrow index="09">Quem atende você</Eyebrow>
            <h2 id="sobre-titulo" className="mt-6 text-4xl leading-tight font-medium tracking-[-0.05em] text-balance sm:text-5xl">Quem responde é quem vai construir.</h2>
            <p className={cn(label, "mt-6 flex items-center gap-1.5")}><MapPin className="size-4" />{profile.location} · atendimento remoto</p>
            <div className={cn("mt-6 space-y-4 text-black/75", lead)}><p>Crio sistemas e automações para empresas que querem trabalhar com menos retrabalho. Na Carbon Cycle, acompanhamos cada projeto de perto, do primeiro contato à entrega.</p><p>Sou formado em Análise e Desenvolvimento de Sistemas pelo IFMS e passei mais de três anos na Embrapa Pantanal mantendo sistemas em uso e criando painéis que apoiam decisões.</p></div>
            <div className="mt-8 border-t border-black pt-6">
              <p className={label}>Publicações · Evinci 2024, Embrapa</p>
              <ul className="mt-3 space-y-2">
                <li><a href={paperUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 underline-offset-4 hover:underline">Melhorias no fluxo contínuo de dados das coleções na Embrapa Pantanal<ArrowUpRight className="mt-1 size-3.5 shrink-0" /></a></li>
                <li><a href={proceedingsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 underline-offset-4 hover:underline">Cadeia produtiva de ovinos em Corumbá e Ladário, Mato Grosso do Sul<ArrowUpRight className="mt-1 size-3.5 shrink-0" /></a></li>
              </ul>
            </div>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 font-medium underline underline-offset-4"><Linkedin className="size-4" />Trajetória no LinkedIn<ArrowUpRight className="size-4" /></a>
          </div>
        </Reveal>
      </section>

      {/* 10 Perguntas */}
      <section id="perguntas" aria-labelledby="perguntas-titulo" className="lazy-section scroll-mt-16 border-t border-foreground dark:bg-[#1a1a1a]">
        <div className={cn(container, "py-20 sm:py-28")}>
        <Heading id="perguntas-titulo" index="10" eyebrow="Perguntas frequentes" title="Tire suas dúvidas antes de começar." />
        <Reveal className="mt-16 divide-y divide-foreground border-y border-foreground">{faq.map(item => <details key={item.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-2xl font-medium tracking-[-0.04em] outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{item.question}<Plus className="size-6 shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none" /></summary><p className={cn("mt-4 max-w-3xl text-muted-foreground", lead)}>{item.answer}</p></details>)}</Reveal>
      </div>
      </section>

      {/* Em números: bloco preto com o retrato em ASCII e números gigantes em colunas com filetes. Só fatos conferíveis. */}
      <section id="numeros" aria-labelledby="numeros-titulo" className="lazy-section ink border-t border-white/15 bg-black dark:bg-[#0a0a0a]">
        <div className={cn(container, "grid gap-10 pt-20 sm:pt-28 lg:grid-cols-2")}>
          <pre aria-hidden="true" className="overflow-hidden font-mono text-[0.42rem] leading-[0.95] text-white/75 select-none sm:text-[0.55rem]">{asciiPortrait}</pre>
          <Reveal className="self-end"><Eyebrow index="11">Em números</Eyebrow><h2 id="numeros-titulo" className={cn("mt-6", h2)}>Só o que dá para conferir.</h2><p className={cn("mt-6 text-muted-foreground", lead)}>Sem clientes, depoimentos ou métricas inventadas: cada número abaixo tem fonte pública.</p></Reveal>
        </div>
        <dl className={cn(container, "mt-16 grid border-t border-white/40 sm:grid-cols-3")}>{stats.map(stat => <div key={stat.label} className="flex flex-col-reverse border-b border-white/40 py-8 sm:border-b-0 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0">
          <dt className="mt-4 max-w-56 text-muted-foreground">{stat.label}</dt>
          <dd className="text-8xl leading-none font-medium tracking-[-0.06em] tabular-nums sm:text-[7rem]">{stat.value}</dd>
        </div>)}</dl>
      </section>

      {/* Contato: bloco preto, título gigante. */}
      <section id="contato" aria-labelledby="contato-titulo" className="lazy-section ink scroll-mt-16 border-t border-white/15 bg-black">
        <Reveal className={cn(container, "grid items-end gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]")}>
          <div>
            <Eyebrow>Contato</Eyebrow>
            <h2 id="contato-titulo" className={cn("mt-6", h2)}>Vamos organizar os processos e os dados da sua empresa?</h2>
            <p className={cn("mt-8 max-w-xl text-muted-foreground", lead)}>Conte em poucas linhas como funciona hoje e o que mais incomoda. Você recebe perguntas objetivas, um caminho possível e, se fizer sentido, uma proposta com prazo e valor fechado.</p>
          </div>
          <div className="flex flex-col gap-3">
            {talk(leads ? "Quero minha proposta" : "Enviar e-mail", cn(button, "justify-between"))}
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), button, "justify-between")}>LinkedIn<ArrowUpRight data-icon="inline-end" /></a>
            <a href={`mailto:${profile.email}`} className="mt-2 inline-flex items-center gap-2 text-muted-foreground hover:text-white"><Mail className="size-4" />{profile.email}</a>
          </div>
        </Reveal>
      </section>
    </main>
    {/* Rodapé: colunas de links, a marca enorme ocupando a largura e a linha de créditos em mono. */}
    <footer className="ink border-t border-white/20 bg-black dark:bg-[#171717]">
      <div className={cn(container, "grid gap-10 pt-16 sm:grid-cols-3")}>
        {footerLinks.map(group => <div key={group.title}><p className={cn(label, "text-muted-foreground")}>{group.title}</p><ul className="mt-4 space-y-2">{group.links.map(link => <li key={link.href}><a href={link.href} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline-offset-4 hover:underline">{link.label}</a></li>)}</ul></div>)}
      </div>
      {/* A marca gigante também leva de volta ao topo da página inicial. */}
      <p className={cn(container, "mt-16")}><a href="#" aria-label="Vinicius Souza — voltar ao topo" className="block text-[18vw] leading-[0.8] font-medium tracking-[-0.07em] whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring xl:text-[16rem]">Vinicius<span className="text-orange">.</span></a></p>
      <div className={cn(container, "mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 py-6", label, "text-[0.7rem] text-muted-foreground")}><p>© {new Date().getFullYear()} Vinicius Souza · Carbon Cycle LTDA · CNPJ 55.366.974/0001-85</p><p>Feito com <RiHeart3Fill role="img" aria-label="amor" className="inline size-3.5 -translate-y-px align-middle text-orange" /> em Corumbá, MS</p></div>
    </footer>
    {leads && <LeadWidget />}
  </>;
}
