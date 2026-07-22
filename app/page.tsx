"use client";
import { useEffect, useState } from "react";

const navLinks = [
  { id: "sobre", label: "sobre" },
  { id: "stack", label: "stack" },
  { id: "log", label: "log" },
  { id: "projetos", label: "projetos" },
];

const stackCards = [
  {
    title: "Frontend performance & SEO",
    accent: "bg-[#e8a857]",
    items: [
      "React",
      "Next.js SSR/SSG",
      "Vue / Nuxt",
      "TypeScript",
      "Tailwind",
      "shadcn/ui",
      "HTML5",
    ],
  },
  {
    title: "Backend",
    accent: "bg-[#6fe0d0]",
    items: [
      "Node.js",
      "Java / Spring Boot",
      "PHP / Laravel",
      "C# / .NET",
      "REST",
    ],
  },
  {
    title: "Mobile",
    accent: "bg-[#e8a857]",
    items: ["React Native", "Expo"],
  },
  {
    title: "Cloud & Infra",
    accent: "bg-[#a2adb9]",
    items: [
      "Docker",
      "GCP",
      "Magalu Cloud",
      "Cloud Run",
      "Vercel",
      "Terraform · aprendendo",
      "Grafana",
    ],
  },
  {
    title: "Dados",
    accent: "bg-[#6fe0d0]",
    items: [
      "PostgreSQL",
      "MySQL / MariaDB",
      "Supabase",
      "Prisma",
      "Hibernate ORM",
      "SQL avançado",
    ],
  },
  {
    title: "Design Mídia & Processo",
    accent: "bg-[#e8a857]",
    items: [
      "Figma",
      "Adobe PS / AI / PR / LR",
      "Affinity",
      "OBS Studio · lives",
      "Premiere",
      "Scrum / Kanban",
      "Levantamento req.",
    ],
  },
];

const commits = [
  {
    hash: "7fb3a10",
    date: "jan–fev/2026",
    title: "MIGRAÇÃO · EM PRODUÇÃO",
    project: "Cartório LCM Alto Longá PI",
    meta: "remote · cartorioaltolonga.com.br",
    desc: "Migração Vite → Next.js com SSR/SSG, next/image, SEO técnico completo. Lighthouse de 62 para 98. Deploy otimizado na Vercel com cache edge.",
    tags: ["Next.js", "Vercel", "SEO", "SSR"],
    link: "https://cartorioaltolonga.com.br",
  },
  {
    hash: "a1f3c9e",
    date: "recorrente",
    title: "Operador Live",
    project: "JIFS 2025",
    meta: "freela · multi-câmeras",
    desc: "Operação de lives oficiais com OBS Studio, corte ao vivo, gerenciamento de áudio e cenas, transmissão para múltiplas plataformas.",
    tags: ["OBS", "Live", "Stream"],
  },
  {
    hash: "2c5d9aa",
    date: "out/2022–ago/2025",
    title: "3 anos · Embrapa Pantanal",
    project: "Plataforma Alelo Animal · Corumbá MS",
    meta: "Bolsista IC → Analista",
    desc: "Atuação como bolsista IC e depois Analista. Automação de queries SQL, correção crítica em PHP+MariaDB+Docker, melhorias de UX e fluxo de dados na plataforma Alelo Animal. Publicação oficial EMBRAPA 1176211.",
    tags: ["GCP", "Magalu Cloud", "PHP", "Publicação"],
    link: "https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal",
    bold: ["IC", "SQL", "PHP+MariaDB+Docker"],
  },
  {
    hash: "918aa02",
    date: "jun–ago/2024",
    title: "Estagiário Suporte",
    project: "IFMS",
    meta: "Zendesk · Microsoft Server · Mulheres Mil",
    desc: "Suporte técnico a infraestrutura, atendimento via Zendesk, manutenção de estações e apoio ao programa Mulheres Mil.",
    tags: ["Suporte", "Zendesk", "Windows Server"],
  },
];

const projects = [
  {
    title: "Cartório Alto Longá em produção",
    desc: "Migração Vite → Next.js SSR/SSG com Lighthouse 62→98. SEO técnico, next/image, roteamento institucional e deploy edge na Vercel.",
    tags: ["Next.js", "Vercel", "SEO", "SSR"],
    href: "https://cartorioaltolonga.com.br",
    status: "em produção",
  },
  {
    title: "Sistema Biblioteca Java Desktop",
    desc: "Aplicação desktop completa com Swing, Hibernate ORM, PostgreSQL e Docker. Cadastro, empréstimo e relatórios com interface nativa.",
    tags: ["Java", "Swing", "Hibernate", "PostgreSQL"],
    href: "#",
    status: "open-source",
  },
  {
    title: "Areco Service C# .NET MVC",
    desc: "Sistema de gestão para prestadora de serviços, arquitetura MVC, Entity Framework e SQL Server. Fluxo de OS e clientes.",
    tags: ["C#", ".NET", "MVC"],
    href: "https://github.com/viniszofx/areco-service",
    status: "github",
  },
  {
    title: "App Diagnóstico HTTP",
    desc: "App Expo + React Native para diagnóstico de requisições, com backend Node.js para logs e análise de latência e status codes.",
    tags: ["Expo", "React Native", "Node.js"],
    href: "#",
    status: "mobile",
  },
];

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("sobre");
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  // terminal typing
  useEffect(() => {
    const steps = [
      "$ whoami",
      "Osiris Vinicius Mendes de Souza",
      "$ cat impacto.json",
      `{"publicacao":"Embrapa 1176211","tempo":"out/2022→ago/2025"}`,
    ];
    let step = 0;
    let char = 0;
    let current = "";
    const out: string[] = [];
    let interval: any;

    const typeNext = () => {
      if (step >= steps.length) {
        clearInterval(interval);
        return;
      }
      const target = steps[step];
      if (char < target.length) {
        current += target[char];
        char++;
        out[step] = current;
        setTypedLines([...out]);
      } else {
        step++;
        char = 0;
        current = "";
        if (step < steps.length) {
          // small pause between lines
          clearInterval(interval);
          setTimeout(
            () => {
              interval = setInterval(typeNext, 18);
            },
            step % 2 === 0 ? 420 : 120,
          );
        }
      }
    };

    interval = setInterval(typeNext, 32);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // active nav
  useEffect(() => {
    const sections = navLinks.map((l) => document.getElementById(l.id));
    const onScroll = () => {
      const y = window.scrollY + 140;
      let cur = "sobre";
      sections.forEach((s) => {
        if (s && s.offsetTop <= y) cur = s.id;
      });
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#edeff2] selection:bg-[#e8a857]/30 selection:text-[#edeff2] antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{font-family: Inter, ui-sans-serif, system-ui, sans-serif}
        .mono{font-family: "JetBrains Mono", ui-monospace, monospace}
        [data-reveal]{opacity:0; transform: translateY(14px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)}
        [data-reveal].in{opacity:1; transform: translateY(0)}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-thumb{background:#212a35;border-radius:999px}
        ::-webkit-scrollbar-track{background:#0a0d12}
        html{scroll-behavior:smooth}
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#212a35] bg-[#0a0d12]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-5 md:px-8">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="mono text-[14px] font-medium tracking-tight">
              viniccius.com.br
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8a857] shadow-[0_0_8px_rgba(232,168,87,.8)] group-hover:scale-125 transition-transform" />
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                className={`mono text-[12.5px] tracking-wide transition-colors hover:text-[#edeff2] ${
                  active === l.id ? "text-[#edeff2]" : "text-[#6d7a89]"
                }`}
              >
                {l.label}
                {active === l.id && (
                  <span className="ml-1.5 inline-block h-[3px] w-[3px] -translate-y-[1px] rounded-full bg-[#e8a857]" />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-[#212a35] bg-[#12161d] px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              </span>
              <span className="mono text-[11px] tracking-wide text-[#a2adb9]">
                disponível
              </span>
            </div>
            <a
              href="#contato"
              className="mono inline-flex h-[36px] items-center justify-center rounded-full bg-[#e8a857] px-4 text-[13px] font-medium text-[#0a0d12] transition-all hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              vamos conversar →
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#212a35] bg-[#12161d] md:hidden"
            aria-label="Abrir menu"
          >
            <div className="space-y-1">
              <span className="block h-[1.5px] w-4 bg-[#edeff2]"></span>
              <span className="block h-[1.5px] w-4 bg-[#edeff2]"></span>
              <span className="block h-[1.5px] w-4 bg-[#edeff2]"></span>
            </div>
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-[#0a0d12]/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-[#212a35] bg-[#0a0d12] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="mono text-sm">viniccius.com.br</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#212a35]"
              >
                ✕
              </button>
            </div>
            <div className="mt-10 flex flex-col gap-6">
              {navLinks.map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="mono text-[18px] tracking-wide text-[#a2adb9] hover:text-[#edeff2]"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="mono text-xs text-[#a2adb9]">
                  disponível · resposta em 24h
                </span>
              </div>
              <a
                href="#contato"
                onClick={() => setMobileOpen(false)}
                className="mono inline-flex h-11 items-center justify-center rounded-full bg-[#e8a857] text-sm font-medium text-black"
              >
                vamos conversar →
              </a>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1280px] px-5 md:px-8">
        {/* HERO */}
        <section className="grid gap-10 py-10 md:grid-cols-[1.15fr_0.85fr] md:gap-12 md:py-16 lg:py-[88px]">
          <div data-reveal>
            <div className="mono mb-5 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-[#6d7a89]">
              <span className="h-px w-6 bg-[#212a35]" /> $ whoami
            </div>

            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#212a35] bg-[#12161d] px-3.5 py-1.5 mono text-[11px] text-[#a2adb9]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e8a857]" /> 3
                anos · Embrapa Pantanal
              </span>
              <span className="inline-flex items-center rounded-full border border-[#212a35] bg-[#12161d] px-3.5 py-1.5 mono text-[11px] text-[#a2adb9]">
                Publicação oficial verificável
              </span>
            </div>

            {/* Terminal */}
            <div className="mt-7 overflow-hidden rounded-[16px] border border-[#212a35] bg-[#12161d]">
              <div className="flex items-center justify-between border-b border-[#212a35] bg-[#0f131a] px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <span className="mono text-[11px] text-[#6d7a89]">
                  zsh — impacto.json
                </span>
                <span className="h-2 w-2" />
              </div>
              <div className="min-h-[132px] bg-[#0a0d12]/50 px-4 py-4 mono text-[12.5px] leading-6">
                <div className="space-y-1">
                  {typedLines.map((line, i) => {
                    const isCmd = line.trim().startsWith("$");
                    return (
                      <div
                        key={i}
                        className={isCmd ? "text-[#6fe0d0]" : "text-[#a2adb9]"}
                      >
                        {isCmd ? (
                          line
                        ) : i === 1 ? (
                          <span className="text-[#edeff2]">{line}</span>
                        ) : (
                          <span className="whitespace-pre-wrap break-all text-[#edeff2]">
                            {(() => {
                              try {
                                const obj = JSON.parse(line);
                                return (
                                  <>
                                    <span className="text-[#6d7a89]">
                                      {"{"}
                                    </span>
                                    <span className="text-[#a2adb9]">
                                      "publicacao"
                                    </span>
                                    <span className="text-[#6d7a89]">:</span>
                                    <span className="text-[#e8a857]">
                                      "{obj.publicacao}"
                                    </span>
                                    <span className="text-[#6d7a89]">,</span>
                                    <span className="text-[#a2adb9]">
                                      "tempo"
                                    </span>
                                    <span className="text-[#6d7a89]">:</span>
                                    <span className="text-[#6fe0d0]">
                                      "{obj.tempo}"
                                    </span>

                                    <span className="text-[#6d7a89]">
                                      {"}"}
                                    </span>
                                  </>
                                );
                              } catch {
                                return line;
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-1 pt-1">
                    <span
                      className="inline-block h-[14px] w-[7px] bg-[#edeff2] transition-opacity"
                      style={{ opacity: cursorVisible ? 1 : 0 }}
                    />
                    <span className="mono text-[11px] text-[#6d7a89]">
                      — esc para sair
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#projetos"
                className="inline-flex h-[44px] items-center justify-center rounded-full bg-[#e8a857] px-6 mono text-[13px] font-semibold text-[#0a0d12] transition hover:brightness-110"
              >
                ver projetos em produção
              </a>
              <a
                href="#sobre"
                className="inline-flex h-[44px] items-center justify-center rounded-full border border-[#212a35] bg-[#12161d] px-6 mono text-[13px] text-[#edeff2] transition hover:border-[#2a3442]"
              >
                sobre mim
              </a>
            </div>
          </div>

          {/* RIGHT PHOTO */}
          <div data-reveal className="relative md:pt-2">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[28px] border border-[#212a35] bg-[#12161d] md:ml-auto">
              {/* gradient placeholder */}
              <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,#1f2a38_0%,#12161d_40%,#0a0d12_100%)]" />
              <div className="absolute inset-0 opacity-[0.07] mix-blend-soft-light">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `linear-gradient(#edeff2 1px, transparent 1px), linear-gradient(90deg, #edeff2 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                  }}
                />
              </div>
              {/* abstract avatar shape */}
              <div className="absolute left-1/2 top-[48%] h-[64%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-gradient-to-b from-[#1b2532] to-[#0f141c] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_20px_60px_rgba(0,0,0,.5)]" />
              <div className="absolute left-1/2 top-[38%] h-[34%] w-[38%] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#2a3a4f] to-[#121821] ring-1 ring-white/10" />
              <div className="absolute bottom-0 left-0 right-0 h-[46%] bg-gradient-to-t from-[#0a0d12] to-transparent" />

              {/* OV monogram */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/hero-photo.png"
                  alt=""
                  className="h-full w-full object-cover m-4"
                />
              </div>

              {/* bottom tag */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-full border border-white/10 bg-[#0a0d12]/70 px-3.5 py-2 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="mono text-[11px] text-[#edeff2]">
                    disponível / Campinas, SP
                  </span>
                </div>
                <span className="mono text-[10px] text-[#6d7a89]">
                  GMT-3 • responde 24h
                </span>
              </div>

              {/* top accent */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#e8a857] px-2.5 py-1">
                <span className="mono text-[10px] font-semibold text-black">
                  full-stack · backend → deploy
                </span>
              </div>
            </div>

            {/* floating stats */}
            <div className="absolute -bottom-2 -left-2 hidden rounded-2xl border border-[#212a35] bg-[#12161d] p-3 shadow-xl md:flex">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8a857]/15 text-[#e8a857] mono text-xs font-bold">
                  98
                </div>
                <div className="leading-tight">
                  <div className="mono text-[11px] text-[#edeff2]">
                    Lighthouse
                  </div>
                  <div className="mono text-[10px] text-[#6d7a89]">
                    62 → 98 SEO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="sobre"
          className="border-t border-[#212a35] py-14 md:py-20"
        >
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
            <div data-reveal>
              <div className="mono mb-4 text-[11px] tracking-[0.14em] text-[#6d7a89]">
                $ cat sobre.md
              </div>
              <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]">
                De Corumbá ao deploy global.
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-[1.7] text-[#a2adb9]">
                <p>
                  Sou de Campinas, formado em{" "}
                  <span className="text-[#edeff2]">
                    ADS pelo IFMS (2022–2025)
                  </span>
                  , com base técnica em
                  <span className="text-[#edeff2]">
                    {" "}
                    Operador de Computador (2019)
                  </span>{" "}
                  e Técnico em Administração. Iniciei na Embrapa Pantanal em
                  outubro de 2022 como bolsista de Iniciação Científica e evoluí
                  para Analista.
                </p>
                <p>
                  Lá atuei 3 anos na{" "}
                  <span className="text-[#edeff2]">
                    Plataforma Alelo Animal
                  </span>{" "}
                  — corrigindo um fluxo crítico em PHP + MariaDB + Docker que
                  travava entregas, automatizando SQLs que antes eram manuais e
                  redesenhando UX para pesquisadores. O trabalho resultou em{" "}
                  <a
                    href="https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal"
                    target="_blank"
                    className="underline decoration-[#e8a857]/50 underline-offset-4 hover:text-[#edeff2]"
                  >
                    publicação oficial verificável
                  </a>
                  .
                </p>
                <p>
                  Hoje migro produtos legados para Next.js com foco em
                  performance real — como o Cartório de Alto Longá (PI), saindo
                  de Vite para SSR/SSG com{" "}
                  <span className="text-[#edeff2]">Lighthouse 62→98</span>.
                  Também opero lives oficiais do JIFS 2025 com OBS
                  multi-câmeras.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-[#212a35] bg-[#12161d] p-4">
                  <div className="mono text-[22px] font-semibold text-[#e8a857]">
                    3
                  </div>
                  <div className="mono mt-1 text-[11px] leading-tight text-[#6d7a89]">
                    anos Embrapa Pantanal
                  </div>
                </div>
                <div className="rounded-2xl border border-[#212a35] bg-[#12161d] p-4">
                  <div className="mono text-[22px] font-semibold text-[#6fe0d0]">
                    98
                  </div>
                  <div className="mono mt-1 text-[11px] leading-tight text-[#6d7a89]">
                    Lighthouse SEO em prod
                  </div>
                </div>
                <div className="rounded-2xl border border-[#212a35] bg-[#12161d] p-4">
                  <div className="mono text-[22px] font-semibold text-[#edeff2]">
                    24h
                  </div>
                  <div className="mono mt-1 text-[11px] leading-tight text-[#6d7a89]">
                    tempo de resposta
                  </div>
                </div>
              </div>
            </div>

            <div
              data-reveal
              className="rounded-[20px] border border-[#212a35] bg-[#12161d] p-6 md:p-7"
            >
              <div className="mono mb-5 flex items-center justify-between text-[11px] text-[#6d7a89]">
                <span>// facts.json</span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e8a857]" />
              </div>
              <div className="space-y-4 mono text-[12.5px] leading-6">
                <div className="flex justify-between gap-4 border-b border-[#1a212c] pb-3">
                  <span className="text-[#6d7a89]">domínio</span>
                  <span className="text-[#edeff2]">viniccius.com.br</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#1a212c] pb-3">
                  <span className="text-[#6d7a89]">local</span>
                  <span className="text-[#edeff2]">Campinas, SP · GMT-3</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#1a212c] pb-3">
                  <span className="text-[#6d7a89]">formação</span>
                  <span className="text-right text-[#edeff2]">
                    ADS IFMS 2022–2025
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#1a212c] pb-3">
                  <span className="text-[#6d7a89]">base</span>
                  <span className="text-right text-[#edeff2]">
                    Op. Computador 2019 · Tec. Adm
                  </span>
                </div>
                <div className="space-y-2 border-b border-[#1a212c] pb-4">
                  <div className="text-[#6d7a89]">publicação</div>
                  <a
                    href="https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal"
                    target="_blank"
                    className="block break-all text-[11px] leading-5 text-[#e8a857] underline-offset-4 hover:underline"
                  >
                    Embrapa 1176211 · melhorias Alelo Animal
                  </a>
                </div>
                <div className="space-y-2 border-b border-[#1a212c] pb-4">
                  <div className="text-[#6d7a89]">lattes / github</div>
                  <div className="flex flex-col gap-1">
                    <a
                      href="https://lattes.cnpq.br/4839584308411789"
                      target="_blank"
                      className="text-[#6fe0d0] hover:underline"
                    >
                      lattes.cnpq.br/4839584308411789
                    </a>
                    <a
                      href="https://github.com/viniszofx"
                      target="_blank"
                      className="text-[#edeff2] hover:underline"
                    >
                      @viniszofx
                    </a>
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#6d7a89]">resposta</span>
                  <span className="text-[#edeff2]">
                    24h · contato@viniccius.com.br
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-[#0a0d12] p-3.5 mono text-[11px] leading-5 text-[#6d7a89]">
                <span className="text-[#e8a857]">$</span> disponibilidade
                imediata para freela e CLT remoto — backend, frontend, migração
                Vite→Next e otimização SEO/Lighthouse.
              </div>
            </div>
          </div>
        </section>

        {/* STACK */}
        <section
          id="stack"
          className="border-t border-[#212a35] py-14 md:py-20"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div data-reveal>
              <div className="mono mb-3 text-[11px] tracking-[0.14em] text-[#6d7a89]">
                $ stack --list
              </div>
              <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]">
                Stack que uso em produção.
              </h2>
            </div>
            <p
              data-reveal
              className="max-w-[42ch] text-[14px] leading-6 text-[#6d7a89]"
            >
              Do Figma ao deploy. Foco em performance, SEO técnico e infra que
              não acorda de madrugada.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stackCards.map((card, i) => (
              <div
                key={i}
                data-reveal
                className="group relative overflow-hidden rounded-[18px] border border-[#212a35] bg-[#12161d] p-6 transition hover:border-[#2a3442]"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${card.accent}`} />
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em]">
                    {card.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.items.map((it) => (
                    <span
                      key={it}
                      className="rounded-full border border-[#212a35] bg-[#0a0d12] px-2.5 py-1 mono text-[11px] text-[#a2adb9] group-hover:border-[#2a3442] transition-colors"
                    >
                      {it}
                    </span>
                  ))}
                </div>
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/[0.02] blur-[1px] group-hover:bg-white/[0.04] transition" />
              </div>
            ))}
          </div>
        </section>

        {/* LOG / EXPERIENCE */}
        <section id="log" className="border-t border-[#212a35] py-14 md:py-20">
          <div data-reveal className="mb-10">
            <div className="mono mb-3 text-[11px] tracking-[0.14em] text-[#6d7a89]">
              $ git log --oneline --graph
            </div>
            <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]">
              Histórico em produção.
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-[9px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-[#e8a857] via-[#e8a857]/30 to-transparent md:block" />
            <div className="space-y-8">
              {commits.map((c, idx) => (
                <div
                  key={idx}
                  data-reveal
                  className="relative flex gap-5 md:gap-8"
                  style={{ transitionDelay: `${idx * 80}ms` }}
                >
                  <div className="relative hidden md:block">
                    <div className="absolute left-[4px] top-1.5 h-[10px] w-[10px] rounded-full border border-[#0a0d12] bg-[#e8a857] shadow-[0_0_0_4px_rgba(232,168,87,.15)]" />
                  </div>
                  <div className="flex-1 rounded-[18px] border border-[#212a35] bg-[#12161d] p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="mono rounded-full bg-[#e8a857]/15 px-2.5 py-1 text-[11px] font-medium text-[#e8a857]">
                        {c.hash}
                      </span>
                      <span className="mono text-[11px] text-[#6d7a89]">
                        {c.date}
                      </span>
                      <span className="h-px w-4 bg-[#212a35] hidden md:block" />
                      <span className="mono text-[11px] uppercase tracking-[0.08em] text-[#edeff2]">
                        {c.title}
                      </span>
                      {c.link && (
                        <a
                          href={c.link}
                          target="_blank"
                          className="ml-auto inline-flex items-center gap-1 mono text-[11px] text-[#6fe0d0] hover:underline"
                        >
                          ver link <span>↗</span>
                        </a>
                      )}
                    </div>

                    <div className="mt-3">
                      <h3 className="text-[16px] font-semibold leading-tight">
                        {c.project}{" "}
                        <span className="font-normal text-[#6d7a89]">
                          · {c.meta}
                        </span>
                      </h3>
                      <p className="mt-2 max-w-[70ch] text-[13.5px] leading-6 text-[#a2adb9]">
                        {c.desc.split(" ").map((w, i) => {
                          const isBold = c.bold?.some((b) =>
                            w
                              .toLowerCase()
                              .includes(
                                b.toLowerCase().split("+")[0].toLowerCase(),
                              ),
                          );
                          if (isBold)
                            return (
                              <span
                                key={i}
                                className="text-[#edeff2] font-medium"
                              >
                                {w}{" "}
                              </span>
                            );
                          return w + " ";
                        })}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#212a35] bg-[#0a0d12] px-2.5 py-1 mono text-[11px] text-[#a2adb9]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section
          id="projetos"
          className="border-t border-[#212a35] py-14 md:py-20"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div data-reveal>
              <div className="mono mb-3 text-[11px] tracking-[0.14em] text-[#6d7a89]">
                $ ls projetos/ --em-produção
              </div>
              <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]">
                Projetos que estão no ar.
              </h2>
            </div>
            <a
              href="https://github.com/viniszofx"
              target="_blank"
              className="mono inline-flex h-9 items-center gap-2 rounded-full border border-[#212a35] bg-[#12161d] px-4 text-[12px] text-[#a2adb9] hover:text-[#edeff2]"
            >
              github @viniszofx <span>↗</span>
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p, i) => (
              <div
                key={i}
                data-reveal
                className="group relative overflow-hidden rounded-[20px] border border-[#212a35] bg-[#12161d] p-6 transition hover:border-[#2e3a4b]"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="mono rounded-full bg-[#0a0d12] px-2.5 py-1 text-[10px] tracking-wide text-[#6d7a89] border border-[#212a35]">
                    {p.status}
                  </span>
                  {p.href !== "#" && (
                    <a
                      href={p.href}
                      target="_blank"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#212a35] bg-[#0a0d12] text-[#6d7a89] group-hover:text-[#edeff2] transition"
                    >
                      ↗
                    </a>
                  )}
                </div>
                <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">
                  {p.title}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-6 text-[#a2adb9]">
                  {p.desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="mono rounded-full border border-[#212a35] bg-[#0a0d12] px-2.5 py-1 text-[11px] text-[#a2adb9]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* publication strip */}
          <div
            data-reveal
            className="mt-6 flex flex-wrap items-center gap-3 rounded-[14px] border border-[#212a35] bg-[#0f131a] px-4 py-3"
          >
            <span className="mono text-[12px] text-[#6d7a89]">
              // publicação oficial
            </span>
            <span className="h-3 w-px bg-[#212a35]" />
            <a
              href="https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal"
              target="_blank"
              className="mono text-[12px] text-[#e8a857] hover:underline"
            >
              Embrapa 1176211 ↗
            </a>
            <span className="h-3 w-px bg-[#212a35]" />
            <a
              href="https://lattes.cnpq.br/4839584308411789"
              target="_blank"
              className="mono text-[12px] text-[#6fe0d0] hover:underline"
            >
              Lattes ↗
            </a>
            <span className="ml-auto mono hidden text-[11px] text-[#6d7a89] md:block">
              verificável · Alelo Animal · UX + dados
            </span>
          </div>
        </section>

        {/* CONTACT */}
        <section
          id="contato"
          className="border-t border-[#212a35] py-16 md:py-24"
        >
          <div data-reveal className="mx-auto max-w-[720px] text-center">
            <div className="mono mb-4 text-[11px] tracking-[0.14em] text-[#6d7a89]">
              $ contato --iniciar
            </div>
            <h2 className="text-[32px] font-semibold leading-[0.95] tracking-[-0.03em] md:text-[52px]">
              Vamos criar{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#e8a857]">
                  algo juntos.
                </span>
                <span className="absolute bottom-[8%] left-0 z-0 h-[40%] w-full bg-[#e8a857]/15" />
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-[42ch] text-[15px] leading-6 text-[#a2adb9]">
              Respondo em até 24h. Freela, CLT remoto ou consultoria de
              performance.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:contato@viniccius.com.br"
                className="inline-flex h-[46px] items-center justify-center rounded-full bg-[#e8a857] px-6 mono text-[13px] font-semibold text-[#0a0d12] transition hover:brightness-110"
              >
                contato@viniccius.com.br
              </a>
              <a
                href="https://wa.me/5519933009590"
                target="_blank"
                className="inline-flex h-[46px] items-center justify-center rounded-full border border-[#212a35] bg-[#12161d] px-6 mono text-[13px] text-[#edeff2] transition hover:border-[#2a3442]"
              >
                WhatsApp → 19 93300-9590
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href="https://github.com/viniszofx"
                target="_blank"
                className="mono rounded-full border border-[#212a35] bg-[#12161d] px-3.5 py-1.5 text-[11px] text-[#a2adb9] hover:text-[#edeff2]"
              >
                github
              </a>
              <a
                href="https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal"
                target="_blank"
                className="mono rounded-full border border-[#212a35] bg-[#12161d] px-3.5 py-1.5 text-[11px] text-[#a2adb9] hover:text-[#edeff2]"
              >
                embrapa
              </a>
              <a
                href="https://lattes.cnpq.br/4839584308411789"
                target="_blank"
                className="mono rounded-full border border-[#212a35] bg-[#12161d] px-3.5 py-1.5 text-[11px] text-[#a2adb9] hover:text-[#edeff2]"
              >
                lattes
              </a>
              <span className="mono rounded-full border border-[#212a35] bg-[#12161d] px-3.5 py-1.5 text-[11px] text-[#6d7a89]">
                Campinas, SP
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#212a35] py-6">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-5 text-center md:flex-row md:px-8">
          <span className="mono text-[11px] text-[#6d7a89]">
            © 2026 Osiris Vinicius Mendes de Souza — Campinas, SP
          </span>
          <span className="mono text-[11px] text-[#6d7a89]">
            viniccius.com.br · 3 anos Embrapa · JIFS 2025 · Vercel
          </span>
        </div>
      </footer>
    </div>
  );
}
