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
  { title: "Interfaces", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"] },
  { title: "Aplicações e APIs", items: ["Node.js", "PHP / Laravel", "Java / Spring Boot", "C# / ASP.NET Core"] },
  { title: "Dados e infraestrutura", items: ["PostgreSQL", "MySQL", "MongoDB", "Docker", "Linux", "Git"] },
];

export const projects = [
  {
    name: "Workspace",
    category: "Produtividade · Web",
    description: "Um espaço para organizar ideias e tarefas. Notes com editor por blocos e Boards com listas, cards e anexos, salvos no navegador.",
    tags: ["Next.js", "React", "Tiptap", "IndexedDB"],
    href: "https://github.com/viniszofx/viniszofx",
    preview: "workspace",
  },
  {
    name: "Areco",
    category: "Gestão de produtos · Full stack",
    description: "Cadastro de produtos com SKU, categorias, preços e estoque. Interface React integrada a uma API com regras de validação e PostgreSQL.",
    tags: ["C#", "ASP.NET Core", "React", "PostgreSQL"],
    href: "https://github.com/viniszofx/areco-service",
    preview: "products",
  },
  {
    name: "Ticket Management",
    category: "Gestão de tickets · API",
    description: "API REST para gerenciar tickets, status e prioridades. Desenvolvida com Spring Boot, persistência em PostgreSQL e ambiente Docker.",
    tags: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    href: "https://github.com/viniszofx/api-spring",
    preview: "api",
  },
  {
    name: "E-ticket",
    category: "Suporte técnico · Projeto acadêmico",
    description: "Sistema de chamados desenvolvido em dupla no IFMS. Organiza solicitações de suporte e relatórios por status e tempo de resolução.",
    tags: ["PHP", "Laravel", "Bootstrap", "Docker"],
    href: "https://github.com/viniszofx/eticket",
    preview: "tickets",
  },
] as const;
