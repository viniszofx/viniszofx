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
import { LeadWidget, OpenLeadButton } from "@/components/marketing/lead-widget";
import { PortfolioBackground } from "@/components/portfolio/portfolio-background";
import { ProjectCard } from "@/components/portfolio/project-card";
import { profile, projects, technologies } from "@/lib/portfolio/content";
import { aiPrinciples, aiUses, faq, processSteps, services } from "@/lib/portfolio/services";
import { cn } from "@/lib/utils";
import { disabledModules } from "@/lib/modules-server";

export const metadata: Metadata = {
  title: "Vinicius Souza | Desenvolvimento de software com IA consciente",
  description: "Sistemas web, automações, APIs e apps sob medida. Desenvolvimento com IA usada como ferramenta: revisão humana, dados protegidos e transparência.",
  alternates: { canonical: "/" },
};

const serviceIcons = { sistemas: Code, automacao: Flow, integracoes: Plug, ia: Sparkle, mobile: Phone, evolucao: Tools } as const;
const principleIcons = [Human, Shield, Eye, Focus];
// Linguagem visual da página de vendas: pílulas, cartões arredondados e muito respiro (estilo Apple),
// mantendo a cor primária, as fontes e o fundo do site.
const pill = "h-12 rounded-full px-7 text-sm font-medium normal-case tracking-normal";
const card = "rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm";

function Heading({ eyebrow, title, children, align = "center" }: { eyebrow: string; title: string; children?: React.ReactNode; align?: "center" | "left" }) {
  return <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
    <p className="mb-4 text-sm font-medium text-primary dark:text-cyan-300">{eyebrow}</p>
    <h2 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h2>
    {children && <p className="mt-5 text-lg leading-8 text-pretty text-muted-foreground">{children}</p>}
  </div>;
}

export default async function Page() {
  // Com Leads desligado em Sistema › Módulos, os botões de conversa viram link de e-mail.
  const leads = !(await disabledModules()).includes("leads");
  return <div className="relative isolate">
    <PortfolioBackground />
    <main id="conteudo" className="mx-auto w-full max-w-6xl px-5 sm:px-6">
      {/* Abertura */}
      <section aria-labelledby="apresentacao" className="flex flex-col items-center pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
        <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"><span className="size-1.5 rounded-full bg-primary" />Desenvolvimento de software sob medida</p>
        <h1 id="apresentacao" className="max-w-4xl font-heading text-5xl font-semibold leading-[1.04] tracking-tight text-balance sm:text-7xl">Software que resolve. <span className="bg-linear-to-r from-primary to-cyan-400 bg-clip-text text-transparent dark:from-cyan-300 dark:to-sky-400">IA com consciência.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-pretty text-muted-foreground sm:text-xl sm:leading-9">Sistemas web, automações e integrações para empresas que querem ganhar tempo sem perder o controle. A IA acelera o trabalho; as decisões e a revisão continuam humanas.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">{leads ? <OpenLeadButton className={pill}><Chat />Conversar sobre seu projeto</OpenLeadButton> : <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className={pill}><Mail />Conversar sobre seu projeto</Button>}<Button nativeButton={false} render={<a href="#servicos" />} variant="outline" className={cn(pill, "bg-card/60 backdrop-blur-sm")}>Ver serviços<ArrowRight /></Button></div>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground">{["Revisão humana em todo código", "Seus dados fora da IA sem autorização", "Código e acessos ficam com você"].map(item => <li key={item} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-primary/15 text-primary"><Check className="size-3.5" /></span>{item}</li>)}</ul>
      </section>

      {/* Serviços (grade em mosaico) */}
      <section id="servicos" aria-labelledby="servicos-titulo" className="scroll-mt-24 py-20 sm:py-28">
        <div id="servicos-titulo"><Heading eyebrow="Serviços" title="O que posso construir para você.">Do primeiro protótipo à manutenção de um sistema que já roda. Cada projeto começa entendendo o seu processo.</Heading></div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(service => { const Icon = serviceIcons[service.id];
          return <article key={service.id} className={cn(card, "flex flex-col gap-4 p-7 transition-transform duration-300 motion-safe:hover:-translate-y-1")}>
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
            <h3 className="font-heading text-2xl font-semibold tracking-tight">{service.title}</h3>
            <p className="leading-7 text-muted-foreground">{service.description}</p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-2">{service.items.map(item => <li key={item} className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">{item}</li>)}</ul>
          </article>; })}</div>
      </section>

      {/* IA consciente */}
      <section id="ia" aria-labelledby="ia-titulo" className="scroll-mt-24 py-20 sm:py-28">
        <div id="ia-titulo"><Heading eyebrow="IA consciente" title="IA como ferramenta, não como atalho.">A inteligência artificial deixa o desenvolvimento mais rápido. Usada sem critério, também deixa mais frágil. Por isso o uso segue quatro regras.</Heading></div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{aiPrinciples.map((principle, index) => { const Icon = principleIcons[index];
          return <article key={principle.title} className={cn(card, "p-7")}><span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 text-lg font-semibold">{principle.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{principle.description}</p></article>; })}</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={cn(card, "p-8")}><h3 className="mb-6 flex items-center gap-3 text-lg font-semibold"><span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span>Onde a IA entra</h3><ul className="space-y-4">{aiUses.yes.map(item => <li key={item} className="flex gap-3 leading-6"><Check className="mt-0.5 size-5 shrink-0 text-primary" />{item}</li>)}</ul></div>
          <div className={cn(card, "p-8")}><h3 className="mb-6 flex items-center gap-3 text-lg font-semibold"><span className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground"><Close className="size-4" /></span>Onde a IA não entra</h3><ul className="space-y-4 text-muted-foreground">{aiUses.no.map(item => <li key={item} className="flex gap-3 leading-6"><Close className="mt-0.5 size-5 shrink-0" />{item}</li>)}</ul></div>
        </div>
      </section>

      {/* Processo */}
      <section id="processo" aria-labelledby="processo-titulo" className="scroll-mt-24 py-20 sm:py-28">
        <div id="processo-titulo"><Heading eyebrow="Como trabalho" title="Do problema ao sistema no ar." /></div>
        <ol className={cn(card, "mt-14 grid overflow-hidden md:grid-cols-4")}>{processSteps.map((step, index) => <li key={step.title} className="border-border/60 p-7 not-last:border-b md:not-last:border-r md:not-last:border-b-0"><span className="grid size-9 place-items-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary">{index + 1}</span><h3 className="mt-5 font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p></li>)}</ol>
      </section>

      {/* Projetos */}
      <section id="projetos" aria-labelledby="projetos-titulo" className="scroll-mt-24 py-20 sm:py-28">
        <div id="projetos-titulo"><Heading eyebrow="Projetos" title="Código em prática.">Alguns projetos públicos, com o código aberto para quem quiser conferir.</Heading></div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">{projects.map((project, index) => <div key={project.name} className="overflow-hidden rounded-3xl border border-border/60 [&>article]:h-full [&>article]:border-0"><ProjectCard project={project} index={index} /></div>)}</div>
        <div className="mt-6 flex justify-center"><a href={`${profile.github}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline dark:text-cyan-300">Todos os repositórios<ArrowUpRight className="size-4" /></a></div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">{technologies.map(group => <div key={group.title} className={cn(card, "p-6")}><p className="mb-4 text-sm font-semibold">{group.title}</p><ul className="flex flex-wrap gap-2">{group.items.map(item => <li key={item} className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">{item}</li>)}</ul></div>)}</div>
      </section>

      {/* Sobre */}
      <section id="sobre" aria-labelledby="sobre-titulo" className="scroll-mt-24 py-20 sm:py-28">
        <div className={cn(card, "grid items-center gap-10 p-8 sm:p-12 md:grid-cols-[auto_1fr]")}>
          <Avatar className="size-32 rounded-full border sm:size-40"><AvatarImage src={profile.avatar} alt="Vinicius Souza" className="object-cover" /><AvatarFallback className="text-3xl">VS</AvatarFallback></Avatar>
          <div>
            <p className="mb-3 text-sm font-medium text-primary dark:text-cyan-300">Quem vai construir</p>
            <h2 id="sobre-titulo" className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{profile.name}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{profile.location} · atendimento remoto</p>
            <div className="mt-6 space-y-4 leading-8 text-muted-foreground"><p>{profile.role} formado em Análise e Desenvolvimento de Sistemas pelo IFMS. Desenvolvo sistemas web, APIs e automações, do levantamento de requisitos à entrega.</p><p>Uso IA todos os dias como parte do trabalho, e justamente por isso sei onde ela ajuda e onde atrapalha. O compromisso é com o resultado: software que a sua equipe entende, usa e consegue manter.</p></div>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-cyan-300"><Linkedin className="size-4" />Trajetória no LinkedIn<ArrowUpRight className="size-4" /></a>
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section id="perguntas" aria-labelledby="perguntas-titulo" className="scroll-mt-24 py-20 sm:py-28">
        <div id="perguntas-titulo"><Heading eyebrow="Perguntas" title="Antes de começar." /></div>
        <div className={cn(card, "mx-auto mt-14 max-w-3xl divide-y divide-border/60 overflow-hidden")}>{faq.map(item => <details key={item.question} className="group px-7 py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{item.question}<span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted/70 transition-transform group-open:rotate-45 motion-reduce:transition-none"><Plus className="size-4" /></span></summary><p className="mt-3 pr-10 leading-7 text-muted-foreground">{item.answer}</p></details>)}</div>
      </section>

      {/* Contato */}
      <section id="contato" aria-labelledby="contato-titulo" className="scroll-mt-24 pt-12 pb-24 sm:pb-32">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-linear-to-br from-primary/15 via-card/80 to-card/80 px-6 py-16 text-center backdrop-blur-sm sm:px-12 sm:py-24">
          <h2 id="contato-titulo" className="mx-auto max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Tem um processo que poderia ser mais simples?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-pretty text-muted-foreground">Conte o que você precisa. Respondo com perguntas, uma ideia de caminho e, se fizer sentido, uma proposta com escopo e valor.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">{leads ? <OpenLeadButton className={pill}><Chat />Enviar mensagem</OpenLeadButton> : <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className={pill}><Mail />Enviar e-mail</Button>}<Button nativeButton={false} render={<a href={profile.linkedin} target="_blank" rel="noopener noreferrer" />} variant="outline" className={cn(pill, "bg-card/60")}><Linkedin />LinkedIn</Button></div>
          <a href={`mailto:${profile.email}`} className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Mail className="size-4" />{profile.email}</a>
        </div>
      </section>
    </main>
    <footer className="border-t border-border/60"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-6"><p>© {new Date().getFullYear()} Vinicius Souza · Desenvolvimento de software</p><a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground"><Github className="size-4" />@viniszofx</a></div></footer>
    {leads && <LeadWidget />}
  </div>;
}
