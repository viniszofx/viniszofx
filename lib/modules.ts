import type { CollectionKind } from "@/lib/storage/file-refs";

// Catálogo de módulos (Nodus: Sistema › Módulos). Cada função pequena é um módulo
// próprio. Desligar esconde do menu, do Início e dos atalhos, bloqueia a página
// pela URL e faz as APIs responderem 403; os dados ficam guardados.
export type AppModule = {
  key: string; name: string; description: string; section: string;
  hrefs: string[]; kinds: CollectionKind[];
  /** Prefixos de API (e páginas públicas) que também param quando o módulo está desligado. */
  apis?: string[];
  /** Desligado até a administração ligar (funções de nicho ou ainda sem uso). */
  off?: boolean;
};

export const appModules: AppModule[] = [
  { section: "Operação", key: "orders", name: "Ordens de serviço", description: "Ordens com cliente, serviço, equipe, materiais e impressão.", hrefs: ["/dashboard/orders"], kinds: ["orders"] },
  { section: "Operação", key: "trips", name: "Viagens", description: "Planejamento de viagens, visitas e cálculo de rotas.", hrefs: ["/dashboard/trip"], kinds: ["trips"], apis: ["/api/travel-estimate"] },
  { section: "Operação", key: "lodging", off: true, name: "Hospedagem", description: "Reservas de hospedagem com diárias e totais.", hrefs: ["/dashboard/reservations"], kinds: ["reservations"] },
  { section: "Operação", key: "field", off: true, name: "Jornada de campo", description: "Iniciar e encerrar o dia, chegadas, fotos e a página Jornadas.", hrefs: ["/dashboard/journeys"], kinds: ["journeys"] },
  { section: "Operação", key: "tasks", name: "Tarefas", description: "Tarefas operacionais com prazo e responsável.", hrefs: ["/dashboard/tasks"], kinds: ["tasks"] },
  { section: "Operação", key: "calendar", name: "Calendário", description: "Eventos e visão por mês ou agenda, com PDF.", hrefs: ["/dashboard/calendar"], kinds: ["events"] },
  { section: "Frota", key: "fleet", name: "Frota", description: "Cadastro de veículos, propriedade e aluguel.", hrefs: ["/dashboard/fleet"], kinds: ["vehicles"] },
  { section: "Frota", key: "km", off: true, name: "Lançamentos de KM", description: "Quilometragem e custos por veículo, motorista e cliente.", hrefs: ["/dashboard/mileage"], kinds: ["mileage"] },
  { section: "Financeiro", key: "timesheets", off: true, name: "Apontamento de horas", description: "Horas trabalhadas por pessoa e serviço.", hrefs: ["/dashboard/finance/timesheets"], kinds: [] },
  { section: "Financeiro", key: "expenses", off: true, name: "Despesas", description: "Despesas de viagens e operação.", hrefs: ["/dashboard/finance/expenses"], kinds: [] },
  { section: "Financeiro", key: "cards", off: true, name: "Cartões", description: "Cartões corporativos e lançamentos.", hrefs: ["/dashboard/finance/cards"], kinds: [] },
  { section: "Financeiro", key: "reconciliation", off: true, name: "Conciliação", description: "Conferência de despesas, cartões e KM.", hrefs: ["/dashboard/finance/reconciliation"], kinds: [] },
  { section: "Financeiro", key: "indicators", off: true, name: "Indicadores", description: "Indicadores financeiros do período.", hrefs: ["/dashboard/finance/indicators"], kinds: [] },
  { section: "Financeiro", key: "closing", off: true, name: "Fechamento", description: "Fechamento do período.", hrefs: ["/dashboard/finance/closing"], kinds: [] },
  { section: "Cadastros", key: "clients", name: "Clientes", description: "Cadastro de clientes e endereços.", hrefs: ["/dashboard/clients"], kinds: ["clients"] },
  { section: "Cadastros", key: "employees", name: "Colaboradores", description: "Cadastro, dependentes e histórico de colaboradores.", hrefs: ["/dashboard/employees"], kinds: ["employees"] },
  { section: "Cadastros", key: "hotels", off: true, name: "Hotéis", description: "Cadastro e consulta de hotéis.", hrefs: ["/dashboard/hotels"], kinds: ["hotels"] },
  { section: "Cadastros", key: "inventory", off: true, name: "Inventário e estoque", description: "Inventários, itens, saldos e movimentações.", hrefs: ["/dashboard/inventory"], kinds: ["inventories", "inventory_items", "inventory_locations", "inventory_movements"] },
  { section: "Comunicação", key: "mural", name: "Mural", description: "Avisos e discussões da organização, também no Início.", hrefs: ["/dashboard/announcements"], kinds: ["announcements"], apis: ["/api/org/posts"] },
  { section: "Comunicação", key: "messages", name: "Mensagens", description: "Conversas diretas entre membros da organização.", hrefs: ["/dashboard/messages"], kinds: [], apis: ["/api/org/messages"] },
  { section: "Comunicação", key: "agenda", off: true, name: "Gerador de agenda", description: "Mensagem com a programação das obras para o WhatsApp.", hrefs: ["/dashboard/agenda"], kinds: [] },
  { section: "Workspace", key: "todos", name: "To-dos", description: "Tarefas pessoais em listas.", hrefs: ["/dashboard/todos"], kinds: ["todos", "todo_lists"] },
  { section: "Workspace", key: "notes", name: "Notas", description: "Notas com editor por blocos e anexos.", hrefs: ["/dashboard/notes"], kinds: ["notes", "attachments"] },
  { section: "Workspace", key: "boards", name: "Quadros", description: "Quadros Kanban com cartões, checklists e comentários.", hrefs: ["/dashboard/boards"], kinds: ["boards"], apis: ["/api/shared/boards", "/quadro"] },
  { section: "Workspace", key: "requests", off: true, name: "Solicitações", description: "Pedidos de materiais, documentos e liberações.", hrefs: ["/dashboard/requests"], kinds: ["requests"] },
  { section: "Ferramentas", key: "drive", name: "Drive", description: "Pastas, arquivos e editores de DOCX, planilhas e PDF.", hrefs: ["/dashboard/drive"], kinds: ["drive"], apis: ["/api/shared/drive", "/arquivo"] },
  { section: "Ferramentas", key: "drawio", name: "Diagramas", description: "Diagramas do draw.io, bibliotecas de formas e links de leitura.", hrefs: ["/dashboard/diagrams"], kinds: ["diagrams", "drawio_libraries"], apis: ["/api/shared/diagrams", "/diagrama"] },
  { section: "Ferramentas", key: "whiteboard", name: "Quadro branco", description: "Quadros brancos do Excalidraw.", hrefs: ["/dashboard/whiteboards"], kinds: ["whiteboards"] },
  { section: "Ferramentas", key: "shortlinks", name: "Links curtos", description: "Links /s/código para links públicos.", hrefs: [], kinds: [], apis: ["/api/short-links", "/s/"] },
  { section: "Marketing", key: "leads", name: "Leads", description: "Botão de conversa do site e o funil de leads.", hrefs: ["/dashboard/leads"], kinds: [], apis: ["/api/leads", "/api/admin/leads"] },
  { section: "Marketing", key: "blog", name: "Blog", description: "Publicações do blog e páginas públicas /blog.", hrefs: ["/dashboard/blog"], kinds: [], apis: ["/api/blog", "/blog"] },
  { section: "Marketing", key: "ads", off: true, name: "Publicidade", description: "Anúncios exibidos nos artigos do blog.", hrefs: ["/dashboard/ads"], kinds: [], apis: ["/api/ads"] },
];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);

/** Módulo desligado dono desta rota do painel (para esconder o link e bloquear a página). */
export function disabledModuleFor(href: string, disabled: string[]) {
  return appModules.find(module => disabled.includes(module.key) && module.hrefs.some(prefix => matches(href, prefix)));
}
export function hiddenHref(href: string, disabled: string[]) { return !!disabledModuleFor(href, disabled); }
export function kindDisabled(kind: string, disabled: string[]) {
  return appModules.some(module => disabled.includes(module.key) && (module.kinds as string[]).includes(kind));
}
/** Módulo desligado dono desta API ou página pública. */
export function disabledModuleForApi(path: string, disabled: string[]) {
  return appModules.find(module => disabled.includes(module.key) && module.apis?.some(prefix => matches(path, prefix)));
}
/** Desligados: os marcados no banco e os desligados por padrão que ninguém ligou. */
export function resolveDisabled(rows: { key: string; enabled: boolean }[]) {
  const saved = new Map(rows.map(row => [row.key, row.enabled]));
  return appModules.filter(module => !(saved.get(module.key) ?? !module.off)).map(module => module.key);
}
export const isEnabled = (key: string, disabled: string[]) => !disabled.includes(key);
