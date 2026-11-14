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
    description: "Um espaço para organizar ideias e tarefas: anotações e quadros de tarefas com listas, cartões e anexos, que funciona direto no navegador.",
    tags: ["Next.js", "React", "Tiptap", "IndexedDB"],
    href: "https://github.com/viniszofx/viniszofx",
    preview: "workspace",
  },
  {
    name: "Areco",
    category: "Gestão de produtos · Full stack",
    description: "Cadastro de produtos com código, categoria, preço e estoque, que confere os dados na hora e não deixa informação errada entrar.",
    tags: ["C#", "ASP.NET Core", "React", "PostgreSQL"],
    href: "https://github.com/viniszofx/areco-service",
    preview: "products",
  },
  {
    name: "Ticket Management",
    category: "Gestão de tickets · API",
    description: "O motor de um sistema de atendimento: registra cada chamado, a prioridade e o andamento, pronto para ser ligado a qualquer tela ou aplicativo.",
    tags: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    href: "https://github.com/viniszofx/api-spring",
    preview: "api",
  },
  {
    name: "E-ticket",
    category: "Suporte técnico · Projeto acadêmico",
    description: "Sistema de chamados feito em dupla no IFMS. Organiza os pedidos de suporte e mostra quantos estão abertos e quanto tempo cada um levou.",
    tags: ["PHP", "Laravel", "Bootstrap", "Docker"],
    href: "https://github.com/viniszofx/eticket",
    preview: "tickets",
  },
] as const;
