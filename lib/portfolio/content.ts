// Public profile and repository READMEs: https://github.com/viniszofx
// Reviewed on 2026-10-08. Keep curated content independent of GitHub API availability.
export const profile = {
  name: "Vinicius Souza",
  role: "Analista de Sistemas",
  location: "Corumbá, MS",
  email: "contato@viniccius.com.br",
  github: "https://github.com/viniszofx",
  linkedin: "https://www.linkedin.com/in/viniszofx/",
  avatar: "https://github.com/viniszofx.png?size=640",
};

export const technologies = [
  { title: "Interfaces", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Figma"] },
  { title: "Aplicações e APIs", items: ["Node.js / Express", "Bun / Hono", "PHP / Laravel", "Java / Spring Boot", "C# / ASP.NET Core"] },
  { title: "Dados e infraestrutura", items: ["PostgreSQL", "MySQL", "MongoDB", "Power BI", "Docker", "Vercel", "Magalu Cloud", "Git"] },
];

export const projects = [
  {
    name: "Cartório LCM",
    category: "Site institucional · Cliente",
    description: "Site do cartório, do levantamento de requisitos à publicação em nuvem, com análise de viabilidade de um sistema interno.",
    partner: { name: "Gabriel", href: "https://gabriellucasafb.com.br/", linkedin: "https://www.linkedin.com/in/gabriellucasafb/" },
    tags: ["Requisitos", "Landing page", "Vercel"],
    href: "https://cartorioaltolonga.com.br/",
    link: "site",
    preview: "site",
  },
  {
    name: "Areco",
    category: "Gestão de produtos · Full stack",
    description: "Cadastro de produtos com código, categoria, preço e estoque, que confere os dados na hora e não deixa informação errada entrar.",
    tags: ["C#", "ASP.NET Core", "React", "PostgreSQL"],
    href: "https://github.com/viniszofx/areco-service",
    link: "code",
    preview: "products",
  },
  {
    name: "Ticket Management",
    category: "Gestão de tickets · API",
    description: "O motor de um sistema de atendimento: registra cada chamado, a prioridade e o andamento, pronto para ser ligado a qualquer tela ou aplicativo.",
    tags: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    href: "https://github.com/viniszofx/api-spring",
    link: "code",
    preview: "api",
  },
  {
    name: "E-ticket",
    category: "Suporte técnico · Projeto acadêmico",
    description: "Sistema de chamados feito em dupla no IFMS. Organiza os pedidos de suporte e mostra quantos estão abertos e quanto tempo cada um levou.",
    tags: ["PHP", "Laravel", "Bootstrap", "Docker"],
    href: "https://github.com/viniszofx/eticket",
    link: "code",
    preview: "tickets",
  },
] as const;
