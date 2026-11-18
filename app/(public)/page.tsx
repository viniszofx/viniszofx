import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShadcnIcon, TypescriptIcon } from "@hugeicons/core-free-icons";
import {
  RiArrowRightUpLine as ArrowUpRight, RiArrowRightLine as ArrowRight, RiChat3Line as Chat, RiCheckLine as Check, RiCloseLine as Close,
  RiCodeBoxLine as Code, RiFlowChart as Flow, RiPlugLine as Plug, RiSparkling2Line as Sparkle, RiSmartphoneLine as Phone, RiToolsLine as Tools,
  RiShieldCheckLine as Shield, RiUserFollowLine as Human, RiEyeLine as Eye, RiFocus3Line as Focus, RiMailLine as Mail, RiMapPinLine as MapPin,
  RiAddLine as Plus,
} from "@remixicon/react";
import { RiGithubLine as Github, RiLinkedinBoxLine as Linkedin } from "@remixicon/react";
import {
  RiReactjsLine, RiNextjsLine, RiTailwindCssLine, RiFigmaLine, RiNodejsLine, RiTerminalLine, RiPhpLine,
  RiHeart3Fill, RiJavaLine, RiDatabase2Line, RiBarChartBoxLine, RiBox3Line, RiVercelLine, RiCloudLine, RiGitBranchLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { LeadWidget, OpenLeadButton } from "@/components/marketing/lead-widget";
import { ProjectCard } from "@/components/portfolio/project-card";
import { DiamondChain, DiamondLines } from "@/components/marketing/art";
import { profile, projects, technologies } from "@/lib/portfolio/content";
import { aiPrinciples, aiUses, faq, processSteps, services, situations } from "@/lib/portfolio/services";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";
import { disabledModules } from "@/lib/modules-server";

export const metadata: Metadata = {
  title: "Vinicius Souza | Sistemas e automações sob medida para a sua empresa",
  description: "Pare de perder horas com planilha e retrabalho. Sistemas e automações sob medida, com valor fechado por etapa, IA revisada por uma pessoa e tudo em seu nome.",
  alternates: { canonical: "/" },
};

const serviceIcons = { sistemas: Code, automacao: Flow, integracoes: Plug, ia: Sparkle, mobile: Phone, evolucao: Tools } as const;
const principleIcons = [Human, Shield, Eye, Focus];
// Ícone de cada tecnologia: o logo quando existe no Remix Icon; senão, um símbolo neutro (banco, gráfico, contêiner, nuvem).
// Logos que o Remix Icon não tem: shadcn/ui e TypeScript vêm do Hugeicons; C# não existe em nenhum dos dois
// e vira um monograma no mesmo tamanho dos outros ícones.
type TechIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
const ShadcnLogo: TechIcon = (props) => <HugeiconsIcon icon={ShadcnIcon} strokeWidth={1.8} {...props} />;
const TypescriptLogo: TechIcon = props => <HugeiconsIcon icon={TypescriptIcon} strokeWidth={1.8} {...props} />;
const CSharpLogo: TechIcon = ({ className, ...props }) => <span {...props} className={cn("grid place-items-center rounded-[4px] border-[1.5px] border-current font-mono text-[0.5rem] leading-none font-bold", className)}>C#</span>;
const techIcons: Record<string, TechIcon> = {
  "React": RiReactjsLine, "Next.js": RiNextjsLine, "TypeScript": TypescriptLogo, "Tailwind CSS": RiTailwindCssLine, "shadcn/ui": ShadcnLogo, "Figma": RiFigmaLine,
  "Node.js / Express": RiNodejsLine, "Bun / Hono": RiTerminalLine, "PHP / Laravel": RiPhpLine, "Java / Spring Boot": RiJavaLine, "C# / ASP.NET Core": CSharpLogo,
  "PostgreSQL": RiDatabase2Line, "MySQL": RiDatabase2Line, "MongoDB": RiDatabase2Line, "Power BI": RiBarChartBoxLine, "Docker": RiBox3Line,
  "Vercel": RiVercelLine, "Magalu Cloud": RiCloudLine, "Git": RiGitBranchLine,
};
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
 * Linguagem institucional e moderna, sempre no tema escuro: títulos grandes, seções numeradas, cartões
 * retos com borda fina, destaques em dourado (--primary / --copper-bright) e blocos escuros (processo,
 * contato, rodapé). Poucos filetes: o espaço separa as seções.
 */
const button = "h-11 rounded-sm px-6";
const chip = "border px-2 py-0.5 text-xs text-muted-foreground";
const dark = "bg-[oklch(0.19_0.01_255)] text-[oklch(0.96_0.004_250)] [--copper-bright:oklch(0.76_0.1_58)] dark:bg-[oklch(0.15_0.008_255)]";
const container = "mx-auto w-full max-w-6xl px-5 sm:px-6";

function Eyebrow({ index, children, className }: { index?: string; children: ReactNode; className?: string }) {
  return <p className={cn("flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-primary", className)}>{index && <span className="tabular-nums">{index}</span>}{index && <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />}{children}</p>;
}

function Heading({ index, eyebrow, title, children, id }: { index: string; eyebrow: string; title: string; children?: ReactNode; id: string }) {
  return <Reveal className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
    <div><Eyebrow index={index}>{eyebrow}</Eyebrow><h2 id={id} className="mt-5 font-heading text-3xl leading-[1.1] font-normal tracking-tight text-balance sm:text-4xl lg:text-5xl">{title}</h2></div>
    {children && <p className="self-end text-lg leading-8 text-pretty text-muted-foreground">{children}</p>}
  </Reveal>;
}

export default async function Page() {
  // Com Leads desligado em Sistema › Módulos, os botões de conversa viram link de e-mail.
  const leads = !(await disabledModules()).includes("leads");
  const talk = (label: string, className = button) => leads
    ? <OpenLeadButton className={className}><Chat />{label}</OpenLeadButton>
    : <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className={className}><Mail />{label}</Button>;

  // .home-dark: a página inicial fica sempre no tema escuro (regras em globals.css).
  return <div className="home-dark">
    <main id="conteudo">
      {/* Abertura: me.png (retrato à direita, fundo preto à esquerda) num bloco escuro nos dois temas;
          o texto fica sobre a parte preta da foto. */}
      <section aria-labelledby="apresentacao" className="relative isolate overflow-hidden">
        <div className={cn(dark, "relative isolate overflow-hidden bg-black dark:bg-black")}>
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image src="/me.png" alt="" fill priority quality={90} sizes="100vw" className="object-cover object-[72%_center] animate-in fade-in duration-[1600ms] ease-out max-lg:opacity-60 motion-reduce:animate-none" />
            {/* Gradiente suave só do lado do texto: some antes do rosto (no celular fica mais forte, porque a foto vai atrás do texto). */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,black_0%,rgb(0_0_0/0.75)_35%,rgb(0_0_0/0.35)_70%,transparent_100%)] lg:bg-[linear-gradient(to_right,black_0%,rgb(0_0_0/0.55)_25%,rgb(0_0_0/0.15)_42%,transparent_55%)]" />
            {/* Pé da abertura: a foto se dissolve na cor da página, sem a linha reta entre o preto e o grafite. */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent" />
          </div>
          <div className={cn(container, "flex flex-col justify-center py-14 sm:py-20 lg:min-h-[calc(100svh-4rem-6rem)]")}>
            {/* Entrada mais lenta e em sequência: título, frase e botões, 150 ms um depois do outro. */}
            <div className="max-w-md lg:max-w-lg">
              <h1 id="apresentacao" className="animate-rise-in [animation-duration:900ms] motion-reduce:animate-none font-heading text-5xl leading-[1.05] font-light tracking-tight text-balance sm:text-6xl lg:text-7xl">Menos planilha. <span className="font-semibold">Mais resultado.</span></h1>
              <p className="animate-rise-in [animation-duration:900ms] motion-reduce:animate-none [animation-delay:150ms] mt-6 text-lg leading-8 text-pretty text-white/70">Sistemas e automações sob medida para a sua empresa.</p>
              <div className="animate-rise-in [animation-duration:900ms] motion-reduce:animate-none [animation-delay:300ms] mt-10 flex flex-wrap items-center gap-6">{talk("Quero uma proposta", cn(button, "bg-(--copper-bright) text-[oklch(0.2_0.02_50)] hover:bg-(--copper-bright)/90"))}<a href="#projetos" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">Ver o case Cartório LCM<ArrowRight className="size-4" /></a></div>
            </div>
          </div>
        </div>
        {/* Credenciais numa régua com filetes, logo abaixo da dobra. */}
        <ul aria-label="Credenciais" className={cn(container, "grid gap-x-10 pt-6 pb-6 sm:grid-cols-3")}>{credentials.map(({ title, text, href, cta }) => <li key={title}>
          <a href={href} {...(href.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="group block py-6 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <p className="font-heading text-2xl font-normal tracking-tight text-primary">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-foreground/70 group-hover:text-primary">{cta}{href.startsWith("#") ? <ArrowRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}</p>
          </a>
        </li>)}</ul>
        {/* Tecnologias em faixa infinita, no espaço entre as credenciais e os casos. A lista aparece duas vezes (a segunda escondida de
            leitores de tela) e anda metade da largura; pausa ao passar o mouse. Com "reduzir movimento", fica parada e quebra linha. */}
        <div aria-label="Tecnologias" role="region" className="group/marquee relative overflow-hidden bg-primary py-5 text-primary-foreground">
          <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
          <div className="flex w-max animate-marquee group-hover/marquee:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none">
            {[0, 1].map(copy => <ul key={copy} aria-hidden={copy === 1 || undefined} className={cn("flex shrink-0 items-center gap-10 pr-10", copy === 1 && "motion-reduce:hidden", "motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-8 motion-reduce:gap-y-3 motion-reduce:px-5")}>
              {technologies.flatMap(group => group.items).map(item => { const Icon = techIcons[item]; return <li key={item} className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">{Icon && <Icon className="size-5 shrink-0 opacity-75" aria-hidden="true" />}{item}</li>; })}
            </ul>)}
          </div>
          </div>
        </div>
      </section>

      {/* 01 Casos reais: logo depois das credenciais, que apontam para cá. */}
      <section id="casos" aria-labelledby="casos-titulo" className={cn(container, "scroll-mt-20 py-10 sm:py-12")}>
        <Heading id="casos-titulo" index="01" eyebrow="O que já resolvi" title="Problemas reais, resolvidos na prática.">Antes da Carbon Cycle, passei mais de três anos na Embrapa Pantanal resolvendo o mesmo tipo de problema que a sua empresa pode estar enfrentando.</Heading>
        {/* Casos como prova: etiqueta do caso, o problema, o que foi feito e o resultado em destaque. */}
        <ol className="mt-10 grid gap-4 md:grid-cols-2">{cases.map((item, index) => <Reveal as="li" key={item.problem} delay={(index % 2) * 70}
          className="flex flex-col gap-4 border bg-card/40 p-6 transition-colors hover:border-primary/40 sm:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"><span className="text-primary tabular-nums">Caso 0{index + 1}</span> · Embrapa Pantanal</p>
          <h3 className="font-heading text-xl leading-snug font-medium tracking-tight text-pretty">{item.problem}</h3>
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">O que foi feito</p>
            <p className="mt-1.5 text-sm leading-6 text-foreground/80">{item.action}</p>
          </div>
          <p className="mt-auto self-start">{"href" in item
            ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-primary/12 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"><Check className="size-4 shrink-0" />{item.result}<ArrowUpRight className="size-3.5" /></a>
            : <span className="inline-flex items-center gap-1.5 bg-primary/12 px-3 py-1.5 text-sm font-medium text-primary"><Check className="size-4 shrink-0" />{item.result}</span>}</p>
        </Reveal>)}</ol>
      </section>

      {/* 02 Situações */}
      <section id="situacoes" aria-labelledby="situacoes-titulo" className={cn(container, "scroll-mt-20 py-10 sm:py-12")}>
        <Heading id="situacoes-titulo" index="02" eyebrow="Reconhece alguma?" title="Quanto tempo a sua equipe perde com isso?">Cada uma dessas situações consome horas de trabalho toda semana. Todas têm solução, e a sua provavelmente também.</Heading>
        {/* Cada situação num cartão de mesma altura: o problema em cima e a resposta numa faixa dourada embaixo. */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{situations.map((item, index) => <Reveal as="li" key={item.problem} delay={(index % 3) * 70}
          className="group flex flex-col overflow-hidden border bg-card/40 transition-colors hover:border-primary/40">
          <h3 className="flex-1 p-6 font-heading text-lg leading-snug font-medium tracking-tight text-pretty">{item.problem}</h3>
          <div className="border-t border-primary/15 bg-primary/[0.06] px-6 py-4">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-primary">Como resolvemos</p>
            <p className="mt-1.5 flex gap-2.5 text-sm leading-6 text-foreground/85"><ArrowRight className="mt-1 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />{item.solution}</p>
          </div>
        </Reveal>)}</ul>
        <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-4"><p className="text-muted-foreground">Não encontrou a sua? Conte como funciona aí: a resposta já vem com um caminho.</p>{talk("Quero resolver a minha")}</Reveal>
      </section>

      {/* 03 Serviços */}
      <section id="servicos" aria-labelledby="servicos-titulo" className="scroll-mt-20 bg-foreground/[0.02] py-14 sm:py-20">
        <div className={container}>
          <Heading id="servicos-titulo" index="03" eyebrow="Serviços" title="Tudo o que a sua operação precisa, sob medida.">Do primeiro sistema à evolução do que você já tem, sempre começando pelo jeito que a sua equipe trabalha.</Heading>
          <div className="mt-10 grid gap-px overflow-hidden border bg-border sm:grid-cols-2 lg:grid-cols-3">{services.map((service, index) => { const Icon = serviceIcons[service.id];
            return <Reveal as="article" key={service.id} delay={(index % 3) * 70} className="group flex flex-col bg-background">
              <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                <span className="mb-2 grid size-11 place-items-center border border-primary/40 text-primary transition-colors group-hover:bg-primary/10"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="font-heading text-xl font-medium tracking-tight">{service.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{service.description}</p>
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-3">{service.items.map(item => <li key={item} className={chip}>{item}</li>)}</ul>
              </div>
            </Reveal>; })}</div>
        </div>
      </section>

      {/* 04 IA consciente */}
      <section id="ia" aria-labelledby="ia-titulo" className={cn(container, "scroll-mt-20 py-10 sm:py-12")}>
        <Heading id="ia-titulo" index="04" eyebrow="IA consciente" title="A velocidade da IA, sem colocar o seu negócio em risco.">A inteligência artificial deixa o projeto mais rápido e mais barato. Para que isso não vire risco, seguimos quatro regras, e uma pessoa responde por cada entrega.</Heading>
        <div className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">{aiPrinciples.map((principle, index) => { const Icon = principleIcons[index];
          return <Reveal as="article" key={principle.title} delay={index * 70} className="py-6"><Icon className="size-6 text-primary" aria-hidden="true" /><h3 className="mt-5 font-heading text-lg font-medium tracking-tight">{principle.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.description}</p></Reveal>; })}</div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Reveal className="border border-primary/40 p-7 sm:p-9"><h3 className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-primary"><Check className="size-4" />Onde a IA entra</h3><ul className="space-y-3">{aiUses.yes.map(item => <li key={item} className="flex gap-3 leading-6"><Check className="mt-1 size-4 shrink-0 text-primary" />{item}</li>)}</ul></Reveal>
          <Reveal delay={70} className="border p-7 sm:p-9"><h3 className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Close className="size-4" />Onde a IA não entra</h3><ul className="space-y-3 text-muted-foreground">{aiUses.no.map(item => <li key={item} className="flex gap-3 leading-6"><Close className="mt-1 size-4 shrink-0" />{item}</li>)}</ul></Reveal>
        </div>
      </section>

      {/* 05 Processo: bloco escuro nos dois temas. */}
      <section id="processo" aria-labelledby="processo-titulo" className={cn(dark, "relative isolate scroll-mt-20 overflow-hidden py-14 sm:py-20")}>
        {/* Padrão 05 da marca (losangos em fila): só na faixa de cima, ao lado do título, sem passar por cima das etapas. */}
        <DiamondChain className="absolute inset-x-0 top-0 -z-10 h-64 w-full text-(--copper-bright) opacity-70 sm:h-72" />
        <div className={container}>
          <Reveal className="max-w-2xl"><Eyebrow index="05" className="text-(--copper-bright)">Como trabalhamos</Eyebrow><h2 id="processo-titulo" className="mt-5 font-heading text-3xl leading-[1.1] font-normal tracking-tight sm:text-4xl lg:text-5xl">Do primeiro contato ao sistema no ar, em quatro passos.</h2></Reveal>
          <ol className="mt-10 grid gap-x-10 md:grid-cols-4">{processSteps.map((step, index) => <Reveal as="li" key={step.title} delay={index * 70} className="border-t border-white/20 py-8">
            <p className="font-heading text-4xl font-light text-(--copper-bright) tabular-nums">0{index + 1}</p>
            <h3 className="mt-4 font-heading text-lg font-medium tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{step.description}</p>
          </Reveal>)}</ol>
        </div>
      </section>

      {/* 06 Projetos */}
      <section id="projetos" aria-labelledby="projetos-titulo" className={cn(container, "scroll-mt-20 py-10 sm:py-12")}>
        <Heading id="projetos-titulo" index="06" eyebrow="Projetos" title="Qualidade que você pode conferir.">Um site em uso por cliente e projetos de código aberto, que qualquer pessoa técnica da sua confiança pode avaliar antes de você contratar.</Heading>
        <div className="mt-10 grid gap-4 md:grid-cols-2">{projects.map((project, index) => <Reveal key={project.name} delay={(index % 2) * 70} className="[&>article]:h-full"><ProjectCard project={project} index={index} /></Reveal>)}</div>
        <div className="mt-6"><a href={`${profile.github}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Todos os repositórios<ArrowUpRight className="size-4" /></a></div>
      </section>

      {/* 07 Sobre: retrato emoldurado */}
      <section id="sobre" aria-labelledby="sobre-titulo" className="scroll-mt-20 bg-foreground/[0.02] py-14 sm:py-20">
        <Reveal className={cn(container, "grid items-center gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16")}>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-[4/5] overflow-hidden bg-black"><Image src={portrait} alt="Vinicius Souza" fill quality={90} sizes="(min-width: 768px) 24rem, 90vw" className="object-cover object-[50%_58%]" /></div>
            <span aria-hidden="true" className="absolute -inset-3 -z-10 border border-primary/50" />
          </div>
          <div>
            <Eyebrow index="07">Quem atende você</Eyebrow>
            <h2 id="sobre-titulo" className="mt-5 font-heading text-3xl font-normal tracking-tight sm:text-5xl">{profile.name}</h2>
            <p className="mt-2 text-sm font-medium text-primary">Analista de sistemas · Carbon Cycle</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{profile.location} · atendimento remoto</p>
            <div className="mt-6 space-y-4 text-lg leading-8 text-muted-foreground"><p>Crio sistemas e automações para empresas que querem trabalhar com menos retrabalho. Na Carbon Cycle, acompanhamos cada projeto de perto, do primeiro contato à entrega.</p><p>Sou formado em Análise e Desenvolvimento de Sistemas pelo IFMS e passei mais de três anos na Embrapa Pantanal, entendendo a necessidade de pesquisadores, mantendo sistemas em uso e criando painéis que apoiam decisões. Uso inteligência artificial para entregar mais rápido, sempre com revisão humana.</p></div>
            <div className="mt-8 border-t pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Publicações · Evinci 2024, Embrapa</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href={paperUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 hover:text-primary hover:underline">Melhorias no fluxo contínuo de dados das coleções na Embrapa Pantanal<ArrowUpRight className="mt-0.5 size-3.5 shrink-0" /></a></li>
                <li><a href={proceedingsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 hover:text-primary hover:underline">Cadeia produtiva de ovinos em Corumbá e Ladário, Mato Grosso do Sul<ArrowUpRight className="mt-0.5 size-3.5 shrink-0" /></a></li>
              </ul>
            </div>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Linkedin className="size-4" />Trajetória no LinkedIn<ArrowUpRight className="size-4" /></a>
          </div>
        </Reveal>
      </section>

      {/* 08 Perguntas */}
      <section id="perguntas" aria-labelledby="perguntas-titulo" className={cn(container, "scroll-mt-20 py-10 sm:py-12")}>
        <Heading id="perguntas-titulo" index="08" eyebrow="Perguntas frequentes" title="Tire suas dúvidas antes de começar." />
        <Reveal className="mt-10 divide-y border-y">{faq.map(item => <details key={item.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-lg font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl [&::-webkit-details-marker]:hidden">{item.question}<Plus className="size-5 shrink-0 text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none" /></summary><p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{item.answer}</p></details>)}</Reveal>
      </section>

      {/* Chamada final: bloco escuro com filetes de cobre. */}
      <section id="contato" aria-labelledby="contato-titulo" className={cn(dark, "relative isolate scroll-mt-20 overflow-hidden")}>
        <DiamondLines className="absolute inset-0 -z-10 size-full text-(--copper-bright) opacity-60" />
        <Reveal className={cn(container, "grid items-end gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]")}>
          <div>
            <Eyebrow className="text-(--copper-bright)">Contato</Eyebrow>
            <h2 id="contato-titulo" className="mt-5 font-heading text-3xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">Vamos tirar o trabalho manual das costas da sua equipe?</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-pretty text-white/70">Conte em poucas linhas como funciona hoje e o que mais incomoda. Quem responde é quem vai construir: perguntas objetivas, um caminho possível e, se fizer sentido, uma proposta com prazo e valor fechado.</p>
          </div>
          <div className="flex flex-col gap-3 lg:items-stretch">
            {talk(leads ? "Quero minha proposta" : "Enviar e-mail", cn(button, "bg-(--copper-bright) text-[oklch(0.2_0.02_50)] hover:bg-(--copper-bright)/90"))}
            <Button nativeButton={false} render={<a href={profile.linkedin} target="_blank" rel="noopener noreferrer" />} variant="outline" className={cn(button, "border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white")}><Linkedin />LinkedIn</Button>
            <a href={`mailto:${profile.email}`} className="mt-2 inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><Mail className="size-4" />{profile.email}</a>
            <p className="text-xs text-white/50">Feito com <RiHeart3Fill role="img" aria-label="amor" className="inline size-3.5 -translate-y-px align-middle text-(--copper-bright)" /> por Carbon Cycle LTDA · CNPJ 55.366.974/0001-85</p>
          </div>
        </Reveal>
      </section>
    </main>
    <footer className={cn(dark, "border-t border-white/10")}><div className={cn(container, "flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-white/60")}><p>© {new Date().getFullYear()} Vinicius Souza · Carbon Cycle LTDA</p><a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Github className="size-4" />@viniszofx</a></div></footer>
    {leads && <LeadWidget />}
  </div>;
}
