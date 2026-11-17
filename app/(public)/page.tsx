import type { Metadata } from "next";
import {
  RiArrowRightUpLine as ArrowUpRight, RiArrowRightLine as ArrowRight, RiChat3Line as Chat, RiCheckLine as Check, RiCloseLine as Close,
  RiCodeBoxLine as Code, RiFlowChart as Flow, RiPlugLine as Plug, RiSparkling2Line as Sparkle, RiSmartphoneLine as Phone, RiToolsLine as Tools,
  RiShieldCheckLine as Shield, RiUserFollowLine as Human, RiEyeLine as Eye, RiFocus3Line as Focus, RiMailLine as Mail, RiMapPinLine as MapPin,
  RiAddLine as Plus,
} from "@remixicon/react";
import { RiGithubLine as Github, RiLinkedinBoxLine as Linkedin } from "@remixicon/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { surfaceVariants } from "@/components/ui/card";
import { LeadWidget, OpenLeadButton } from "@/components/marketing/lead-widget";
import { ProjectCard } from "@/components/portfolio/project-card";
import { profile, projects, technologies } from "@/lib/portfolio/content";
import { aiPrinciples, aiUses, faq, processSteps, services, situations } from "@/lib/portfolio/services";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";
import { disabledModules } from "@/lib/modules-server";

export const metadata: Metadata = {
  title: "Vinicius Souza | Desenvolvimento de software com IA consciente",
  description: "Sistemas e automações sob medida para empresas que perdem tempo com planilhas, retrabalho e informação espalhada. IA usada com revisão humana e dados protegidos.",
  alternates: { canonical: "/" },
};

const serviceIcons = { sistemas: Code, automacao: Flow, integracoes: Plug, ia: Sparkle, mobile: Phone, evolucao: Tools } as const;
const principleIcons = [Human, Shield, Eye, Focus];
// Mesma linguagem do painel: superfícies de vidro do app (surfaceVariants), títulos sóbrios,
// rótulo em caixa alta no cobre e botões normais. Sem manchas de cor, gradientes ou elevação no hover.
const card = surfaceVariants();
const cardHover = "transition-colors hover:border-primary/40";
const action = "normal-case tracking-normal";
const chip = "rounded-md bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground";
const eyebrowClass = "text-xs uppercase tracking-widest text-primary";

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <Reveal className="max-w-2xl">
    <p className={eyebrowClass}>{eyebrow}</p>
    <h2 className="mt-2 font-heading text-2xl font-semibold text-balance sm:text-3xl">{title}</h2>
    {children && <p className="mt-3 leading-7 text-pretty text-muted-foreground">{children}</p>}
  </Reveal>;
}

export default async function Page() {
  // Com Leads desligado em Sistema › Módulos, os botões de conversa viram link de e-mail.
  const leads = !(await disabledModules()).includes("leads");
  return <div>
    <main id="conteudo" className="mx-auto w-full max-w-6xl px-5 sm:px-6">
      {/* Abertura */}
      <section aria-labelledby="apresentacao" className="pt-14 pb-16 sm:pt-20 sm:pb-20">
        <p className={eyebrowClass}>Sistemas e automações sob medida</p>
        <h1 id="apresentacao" className="mt-3 max-w-3xl font-heading text-4xl leading-tight font-semibold text-balance sm:text-5xl">Menos planilha e retrabalho. Mais tempo para o seu negócio.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-pretty text-muted-foreground">Você me conta como o trabalho é feito hoje. Eu mostro o que dá para simplificar e construo o sistema ou a automação que resolve, com IA onde ela ajuda e revisão humana em tudo.</p>
        <div className="mt-8 flex flex-wrap gap-2">{leads ? <OpenLeadButton className={action}><Chat />Conversar sobre seu projeto</OpenLeadButton> : <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className={action}><Mail />Conversar sobre seu projeto</Button>}<Button nativeButton={false} render={<a href="#situacoes" />} variant="outline" className={action}>Ver exemplos<ArrowRight /></Button></div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">{["Você não precisa saber o que pedir", "Proposta com valor fechado por etapa", "O sistema fica em seu nome"].map(item => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-primary" />{item}</li>)}</ul>
      </section>

      {/* Situações: o cliente se reconhece pelo problema, sem precisar saber o nome da solução. */}
      <section id="situacoes" aria-labelledby="situacoes-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <div id="situacoes-titulo"><Heading eyebrow="Reconhece alguma?" title="Situações que dá para resolver.">Se alguma dessas parece com o dia a dia da sua empresa, já temos por onde começar.</Heading></div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{situations.map((item, index) => <Reveal as="li" key={item.problem} delay={(index % 3) * 110} className={cn(card, cardHover, "flex flex-col gap-3 p-5")}>
          <p className="font-heading text-lg leading-snug font-semibold text-pretty">{item.problem}</p>
          <p className="mt-auto flex gap-2.5 border-t pt-3 text-sm leading-6 text-muted-foreground"><ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{item.solution}</p>
        </Reveal>)}</ul>
        <Reveal className="mt-6 flex flex-wrap items-center gap-3"><p className="text-sm text-muted-foreground">Não achou a sua? Conte como funciona aí.</p>{leads ? <OpenLeadButton className={action}><Chat />Contar minha situação</OpenLeadButton> : <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className={action}><Mail />Contar minha situação</Button>}</Reveal>
      </section>

      {/* Serviços (grade em mosaico) */}
      <section id="servicos" aria-labelledby="servicos-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <div id="servicos-titulo"><Heading eyebrow="Serviços" title="O que posso construir para você.">Do primeiro sistema ao cuidado com um que já existe. Cada projeto começa entendendo como a sua equipe trabalha.</Heading></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map((service, index) => { const Icon = serviceIcons[service.id];
          return <Reveal as="article" key={service.id} delay={(index % 3) * 110} className={cn(card, cardHover, "flex flex-col gap-3 p-5")}>
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
            <h3 className="font-heading text-lg font-semibold">{service.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{service.description}</p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-2">{service.items.map(item => <li key={item} className={chip}>{item}</li>)}</ul>
          </Reveal>; })}</div>
      </section>

      {/* IA consciente */}
      <section id="ia" aria-labelledby="ia-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <div id="ia-titulo"><Heading eyebrow="IA consciente" title="IA como ferramenta, não como atalho.">A inteligência artificial deixa o trabalho mais rápido e mais barato. Usada sem critério, também traz erros e riscos. Por isso o uso segue quatro regras.</Heading></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{aiPrinciples.map((principle, index) => { const Icon = principleIcons[index];
          return <Reveal as="article" key={principle.title} delay={index * 100} className={cn(card, cardHover, "p-5")}><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-4 font-semibold">{principle.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{principle.description}</p></Reveal>; })}</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Reveal delay={0} className={cn(card, "p-6")}><h3 className="mb-4 flex items-center gap-2 font-semibold"><Check className="size-5 text-primary" />Onde a IA entra</h3><ul className="space-y-3 text-sm">{aiUses.yes.map(item => <li key={item} className="flex gap-3 leading-6"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></Reveal>
          <Reveal delay={120} className={cn(card, "p-6")}><h3 className="mb-4 flex items-center gap-2 font-semibold"><Close className="size-5 text-muted-foreground" />Onde a IA não entra</h3><ul className="space-y-3 text-sm text-muted-foreground">{aiUses.no.map(item => <li key={item} className="flex gap-3 leading-6"><Close className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></Reveal>
        </div>
      </section>

      {/* Processo */}
      <section id="processo" aria-labelledby="processo-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <div id="processo-titulo"><Heading eyebrow="Como trabalho" title="Do problema ao sistema no ar." /></div>
        <Reveal as="ol" className={cn(card, "mt-8 grid overflow-hidden md:grid-cols-4")}>{processSteps.map((step, index) => <li key={step.title} className="p-5 not-last:border-b md:not-last:border-r md:not-last:border-b-0"><span className="font-mono text-xs text-primary">0{index + 1}</span><h3 className="mt-2 font-semibold">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{step.description}</p></li>)}</Reveal>
      </section>

      {/* Projetos */}
      <section id="projetos" aria-labelledby="projetos-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <div id="projetos-titulo"><Heading eyebrow="Projetos" title="Alguns projetos que construí.">São projetos públicos, com o código aberto: qualquer pessoa técnica da sua confiança pode conferir a qualidade.</Heading></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">{projects.map((project, index) => <Reveal key={project.name} delay={(index % 2) * 80} className="[&>article]:h-full"><ProjectCard project={project} index={index} /></Reveal>)}</div>
        <div className="mt-4"><a href={`${profile.github}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Todos os repositórios<ArrowUpRight className="size-4" /></a></div>
        <p className="mt-8 text-center text-sm text-muted-foreground">Para quem é da área, as tecnologias com que trabalho:</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">{technologies.map((group, index) => <Reveal key={group.title} delay={index * 100} className={cn(card, "p-5")}><p className="mb-3 text-sm font-semibold">{group.title}</p><ul className="flex flex-wrap gap-2">{group.items.map(item => <li key={item} className={chip}>{item}</li>)}</ul></Reveal>)}</div>
      </section>

      {/* Sobre */}
      <section id="sobre" aria-labelledby="sobre-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <Reveal className={cn(card, "grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr]")}>
          <Avatar className="size-24 rounded-full border sm:size-28"><AvatarImage src={profile.avatar} alt="Vinicius Souza" className="object-cover" /><AvatarFallback className="text-3xl">VS</AvatarFallback></Avatar>
          <div>
            <p className={eyebrowClass}>Quem vai construir</p>
            <h2 id="sobre-titulo" className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">{profile.name}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{profile.location} · atendimento remoto</p>
            <div className="mt-4 space-y-3 leading-7 text-muted-foreground"><p>{profile.role} formado em Análise e Desenvolvimento de Sistemas pelo IFMS. Cuido do projeto do começo ao fim: da primeira conversa ao sistema funcionando na sua empresa, sem intermediários.</p><p>Uso IA todos os dias como parte do trabalho, e justamente por isso sei onde ela ajuda e onde atrapalha. O compromisso é com o resultado: um sistema que a sua equipe entende, usa de verdade e não fica refém de ninguém.</p></div>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Linkedin className="size-4" />Trajetória no LinkedIn<ArrowUpRight className="size-4" /></a>
          </div>
        </Reveal>
      </section>

      {/* Perguntas */}
      <section id="perguntas" aria-labelledby="perguntas-titulo" className="scroll-mt-24 py-12 sm:py-16">
        <div id="perguntas-titulo"><Heading eyebrow="Perguntas" title="Antes de começar." /></div>
        <Reveal className={cn(card, "mt-8 max-w-3xl divide-y overflow-hidden")}>{faq.map(item => <details key={item.question} className="group px-5 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{item.question}<Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 motion-reduce:transition-none" /></summary><p className="mt-2 pr-8 text-sm leading-6 text-muted-foreground">{item.answer}</p></details>)}</Reveal>
      </section>

      {/* Contato */}
      <section id="contato" aria-labelledby="contato-titulo" className="scroll-mt-24 pt-8 pb-20 sm:pb-24">
        <Reveal className={cn(card, "p-6 sm:p-10")}>
          <p className={eyebrowClass}>Contato</p>
          <h2 id="contato-titulo" className="mt-2 max-w-2xl font-heading text-2xl font-semibold text-balance sm:text-3xl">Alguma tarefa toma tempo demais por aí?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-pretty text-muted-foreground">Você não precisa saber o que pedir. Conte como o trabalho é feito hoje e o que mais incomoda: eu respondo com perguntas, uma ideia de caminho e, se fizer sentido, uma proposta com prazo e valor.</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">{leads ? <OpenLeadButton className={action}><Chat />Enviar mensagem</OpenLeadButton> : <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className={action}><Mail />Enviar e-mail</Button>}<Button nativeButton={false} render={<a href={profile.linkedin} target="_blank" rel="noopener noreferrer" />} variant="outline" className={action}><Linkedin />LinkedIn</Button>
            <a href={`mailto:${profile.email}`} className="ml-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Mail className="size-4" />{profile.email}</a></div>
        </Reveal>
      </section>
    </main>
    <footer className="border-t"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-6"><p>© {new Date().getFullYear()} Vinicius Souza · Desenvolvimento de software</p><a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground"><Github className="size-4" />@viniszofx</a></div></footer>
    {leads && <LeadWidget />}
  </div>;
}
