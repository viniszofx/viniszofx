"use client";

import "@/app/index.css";
import { useEffect, useState } from "react";

const lines = [
  {
    prompt: "$ whoami",
    out: "Osiris Vinicius Mendes de Souza",
  },
  {
    prompt: "$ cat stack.json",
    out: '["Node.js","TypeScript","React","Next.js","Java/Spring"]',
  },
];

export default function Home() {
  const [history, setHistory] = useState<{ prompt: string; out: string }[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      setHistory(lines);
      setFinished(true);
      return;
    }

    let cancelled = false;

    async function run() {
      for (const line of lines) {
        if (cancelled) return;

        await new Promise((r) => setTimeout(r, 450));

        setHistory((prev) => [...prev, line]);
      }

      setFinished(true);
    }

    run();

    const revealEls = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          }
        });
      },
      {
        threshold: 0.15,
      },
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <nav>
        <div className="wrap">
          <div className="logo">
            <span className="dot"></span>
            vinicius
            <span style={{ color: "var(--text-tertiary)" }}>.dev</span>
          </div>

          <div className="nav-links">
            <a href="#sobre">sobre</a>
            <a href="#stack">stack</a>
            <a href="#experiencia">experiência</a>
            <a href="#projetos">projetos</a>
          </div>

          <a href="#contato" className="nav-cta">
            vamos conversar
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">$ whoami</div>

            <h1>
              Osiris Vinicius —
              <br />
              construo produtos <span>do backend ao deploy</span>.
            </h1>

            <p className="hero-tagline">
              Desenvolvedor full-stack em Campinas, SP. Node.js, TypeScript,
              React e Next.js em produção — sem depender de equipes separadas
              para tirar uma ideia do papel.
            </p>

            <div className="terminal">
              <div className="terminal-bar">
                <span className="tb-dot red"></span>
                <span className="tb-dot yellow"></span>
                <span className="tb-dot green"></span>

                <span className="tb-title">~/vinicius — zsh</span>
              </div>

              <div className="terminal-body">
                {history.map((line, index) => (
                  <div key={index}>
                    <div className="line">
                      <span className="prompt">{line.prompt}</span>
                    </div>

                    <div className="out">{line.out}</div>
                  </div>
                ))}

                {finished && (
                  <div className="line">
                    <span className="prompt">$</span>
                    <span className="cursor"></span>
                  </div>
                )}
              </div>
            </div>

            <div className="hero-ctas">
              <a href="#contato" className="btn btn-primary">
                vamos criar algo juntos →
              </a>

              <a href="#projetos" className="btn btn-ghost">
                ver projetos
              </a>
            </div>
          </div>

          <div className="hero-photo">
            <img
              src="/hero-photo.png"
              alt="Osiris Vinicius trabalhando em seu notebook"
            />

            <div className="tag">
              <span className="live">disponível</span>

              <span>Campinas, SP</span>
            </div>
          </div>
        </div>
      </section>
      <section id="sobre">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-eyebrow">01 · sobre</div>

            <h2 className="section-title">
              De laboratório de pesquisa a produto próprio
            </h2>
          </div>

          <div className="about-grid">
            <div className="about-text reveal">
              <p>
                Sou formado em{" "}
                <strong>Análise e Desenvolvimento de Sistemas</strong> pelo IFMS
                e passei quase dois anos em produção institucional na{" "}
                <strong>Embrapa Pantanal</strong>, desenvolvendo e mantendo
                sistemas críticos em produção.
              </p>

              <p>
                As melhorias de UX e fluxo de dados que implementei na
                plataforma Alelo Animal resultaram em uma{" "}
                <strong>publicação técnica oficial</strong> da instituição.
              </p>

              {/*
          <p>
            Hoje desenvolvo a ECCO, uma plataforma
            SaaS para gestão de pedidos e delivery.
          </p>
          */}
            </div>

            <div className="facts reveal">
              <div className="fact">
                <span className="k">local</span>
                <span className="v">Campinas, SP</span>
              </div>

              <div className="fact">
                <span className="k">formação</span>
                <span className="v">ADS — IFMS (2025)</span>
              </div>

              <div className="fact">
                <span className="k">publicação</span>

                <span className="v">
                  <a
                    href="https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Embrapa Pantanal ↗
                  </a>
                </span>
              </div>

              <div className="fact">
                <span className="k">idiomas</span>

                <span className="v">Português, Inglês técnico</span>
              </div>

              <div className="fact">
                <span className="k">github</span>

                <span className="v">
                  <a
                    href="https://github.com/viniszofx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @viniszofx ↗
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="divider"></div>
      </div>

      <section id="stack">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-eyebrow">02 · stack</div>

            <h2 className="section-title">Ferramentas que uso todo dia</h2>
          </div>

          <div className="stack-grid">
            <div className="stack-card reveal">
              <h3>Frontend</h3>

              <div className="pill-row">
                <span className="pill">React</span>
                <span className="pill">Next.js</span>
                <span className="pill">Vue / Nuxt</span>
                <span className="pill">TypeScript</span>
                <span className="pill">Tailwind CSS</span>
                <span className="pill">shadcn/ui</span>
              </div>
            </div>

            <div className="stack-card reveal">
              <h3>Backend</h3>

              <div className="pill-row">
                <span className="pill">Node.js</span>
                <span className="pill">Java / Spring Boot</span>
                <span className="pill">PHP / Laravel</span>
                <span className="pill">C# / .NET</span>
                <span className="pill">REST APIs</span>
              </div>
            </div>

            <div className="stack-card reveal">
              <h3>Mobile</h3>

              <div className="pill-row">
                <span className="pill">React Native</span>
                <span className="pill">Expo</span>
              </div>
            </div>

            <div className="stack-card reveal">
              <h3>Cloud & Infra</h3>

              <div className="pill-row">
                <span className="pill">Docker</span>
                <span className="pill">GCP</span>
                <span className="pill">Magalu Cloud</span>
                <span className="pill">Terraform</span>
                <span className="pill">Vercel</span>
                <span className="pill">Grafana</span>
              </div>
            </div>

            <div className="stack-card reveal">
              <h3>Dados</h3>

              <div className="pill-row">
                <span className="pill">PostgreSQL</span>
                <span className="pill">MySQL</span>
                <span className="pill">Supabase</span>
                <span className="pill">Prisma</span>
                <span className="pill">SQL avançado</span>
              </div>
            </div>

            <div className="stack-card reveal">
              <h3>Design & Mídia</h3>

              <div className="pill-row">
                <span className="pill">Figma</span>
                <span className="pill">Adobe Suite</span>
                <span className="pill">Affinity</span>
                <span className="pill">OBS Studio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="divider"></div>
      </div>
      <section id="experiencia">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-eyebrow">03 · experiência</div>

            <h2 className="section-title">
              $ git log --oneline --reverse=false
            </h2>
          </div>

          <div className="gitlog">
            <div className="commit reveal">
              <div className="commit-meta">
                <span className="hash">7fb3a10</span>
                <span>fev/2026</span>
                <span className="badge">freela</span>
              </div>

              <h3>Desenvolvedor Full-stack — Cartório LCM</h3>

              <div className="role">Alto Longá, PI (remoto)</div>

              <p>
                Migração completa de React/Vite para Next.js com SSR/SSG,
                otimização de rotas, imagens e SEO. Deploy contínuo configurado
                na Vercel.
              </p>
            </div>

            <div className="commit reveal">
              <div className="commit-meta">
                <span className="hash">4e881bd</span>
                <span>jan – mar/2026</span>
              </div>

              <h3>Desenvolvedor Full Stack</h3>

              <div className="role">Campinas, SP</div>

              <p>
                Levantamento de requisitos, migração de aplicações Vite.js para
                Next.js e trabalho em equipe multidisciplinar.
              </p>
            </div>

            <div className="commit reveal">
              <div className="commit-meta">
                <span className="hash">2c5d9aa</span>
                <span>out/2023 – ago/2025</span>
                <span className="badge">2 anos</span>
              </div>

              <h3>Desenvolvedor de Software — Embrapa Pantanal</h3>

              <div className="role">Corumbá, MS</div>

              <p>
                Automação de validações SQL, manutenção de sistemas críticos,
                melhorias de UX e fluxo de dados na Plataforma Alelo Animal,
                culminando em publicação técnica oficial.
              </p>
            </div>

            <div className="commit reveal">
              <div className="commit-meta">
                <span className="hash">918aa02</span>
                <span>jun – ago/2024</span>
              </div>

              <h3>Estagiário de Suporte Técnico — IFMS</h3>

              <div className="role">Corumbá, MS</div>

              <p>
                Atendimento via Zendesk, manutenção de Microsoft Server e apoio
                ao projeto Mulheres Mil.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="divider"></div>
      </div>

      <section id="projetos">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-eyebrow">04 · projetos</div>

            <h2 className="section-title">Coisas que construí</h2>
          </div>

          <div className="proj-grid">
            <div className="proj-card reveal">
              <div className="proj-top">
                <h3>Cartório Alto Longá</h3>

                <span className="proj-status live">em produção</span>
              </div>

              <p>
                Migração de React/Vite para Next.js com SSR/SSG, otimização de
                SEO e deploy contínuo na Vercel.
              </p>

              <div className="proj-tags">
                <span>Next.js</span>
                <span>Vercel</span>
                <span>SEO</span>
              </div>
            </div>

            <div className="proj-card reveal">
              <div className="proj-top">
                <h3>Sistema de Biblioteca</h3>
              </div>

              <p>
                Aplicação desktop em Java utilizando Swing, Hibernate ORM e
                PostgreSQL com Docker.
              </p>

              <div className="proj-tags">
                <span>Java</span>
                <span>Hibernate</span>
                <span>PostgreSQL</span>
                <span>Docker</span>
              </div>
            </div>

            <div className="proj-card reveal">
              <div className="proj-top">
                <h3>Areco Service</h3>
              </div>

              <p>API REST em C# utilizando arquitetura MVC.</p>

              <div className="proj-tags">
                <span>C#</span>
                <span>.NET</span>
                <span>MVC</span>
              </div>

              <a
                href="https://github.com/viniszofx/areco-service"
                target="_blank"
                rel="noopener noreferrer"
                className="proj-link"
              >
                ver repositório ↗
              </a>
            </div>

            <div className="proj-card reveal">
              <div className="proj-top">
                <h3>App de Diagnóstico HTTP</h3>
              </div>

              <p>
                Aplicativo mobile em React Native + Expo consumindo API Node.js
                para diagnóstico de chamadas HTTP.
              </p>

              <div className="proj-tags">
                <span>Expo</span>
                <span>React Native</span>
                <span>Node.js</span>
              </div>
            </div>
          </div>

          <div className="pub-strip reveal">
            <span className="icon">//</span>

            <span>
              Autor de artigo técnico oficial da Embrapa Pantanal sobre
              otimização de UX e fluxo de dados na Plataforma Alelo Animal —
              <a
                href="https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1176211/melhorias-no-fluxo-de-dados-e-experiencia-do-usuario-ux-na-plataforma-do-alelo-animal-embrapa-pantanal"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                ler publicação ↗
              </a>
            </span>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="divider"></div>
      </div>
      <section id="contato" className="contact-section">
        <div className="wrap">
          <div className="eyebrow reveal">$ contato --iniciar</div>

          <h2 className="reveal">
            Vamos criar
            <br />
            <span>algo juntos.</span>
          </h2>

          <p className="contact-sub reveal">
            Tem um projeto, uma ideia ou apenas quer conversar sobre tecnologia?
            Me chama.
          </p>

          <div className="contact-ctas reveal">
            <a
              href="mailto:contato@viniccius.com.br"
              className="btn btn-primary btn-lg"
            >
              enviar um e-mail →
            </a>

            <a
              href="https://wa.me/5519933009590"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-lg"
            >
              chamar no WhatsApp
            </a>
          </div>

          <div className="contact-links reveal">
            <a href="mailto:contato@viniccius.com.br">
              contato@viniccius.com.br
            </a>

            <a
              href="https://github.com/viniszofx"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/viniszofx
            </a>

            <a
              href="https://linkedin.com/in/viniszofx"
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin.com/in/viniszofx
            </a>

            <a
              href="https://viniccius.com.br"
              target="_blank"
              rel="noopener noreferrer"
            >
              viniccius.com.br
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>© 2026 Osiris Vinicius Mendes de Souza</span>

          <span>Campinas, SP · Carbon Cycle LTDA</span>
        </div>
      </footer>
    </>
  );
}
