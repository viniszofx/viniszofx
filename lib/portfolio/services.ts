// Conteúdo da página inicial de serviços. Sem números, clientes ou depoimentos
// inventados: só o que é oferecido e como o trabalho é feito.

export const services = [
  { id: "sistemas", title: "Sistemas web sob medida", description: "Painéis, cadastros, fluxos de aprovação e portais pensados para o jeito que a sua equipe já trabalha, não o contrário.", items: ["Next.js e React", "Painel administrativo", "Perfis e permissões"] },
  { id: "automacao", title: "Automação de processos", description: "Planilhas, e-mails e tarefas repetitivas viram fluxos automáticos, com IA onde ela de fato economiza tempo e com revisão humana onde há decisão.", items: ["Rotinas agendadas", "Leitura de documentos", "Alertas e relatórios"] },
  { id: "integracoes", title: "APIs e integrações", description: "Conecto o seu sistema a ERPs, gateways de pagamento, WhatsApp e serviços de terceiros com contratos claros e registros de cada chamada.", items: ["REST e webhooks", "Spring Boot, Laravel, .NET", "Documentação"] },
  { id: "ia", title: "IA aplicada ao seu negócio", description: "Diagnóstico de onde a IA ajuda e onde só adiciona risco. Assistentes, busca em documentos e classificação, com custos e limites explicados antes.", items: ["Assistentes internos", "Busca em documentos", "Avaliação de custo e risco"] },
  { id: "mobile", title: "Apps e PWA", description: "Aplicações que funcionam no celular, instaláveis e preparadas para conexão instável, para quem trabalha em campo.", items: ["PWA instalável", "Uso em campo", "Câmera e localização"] },
  { id: "evolucao", title: "Manutenção e evolução", description: "Assumo sistemas existentes: atualizo dependências, corrijo gargalos, escrevo testes e documento o que ninguém documentou.", items: ["Refatoração segura", "Testes automatizados", "Atualizações"] },
] as const;

// O que "IA como ferramenta consciente" significa na prática.
export const aiPrinciples = [
  { title: "Você no controle", description: "A IA sugere; eu reviso, testo e assino cada linha que vai para produção. Nenhum código entra sem entendimento de quem entrega." },
  { title: "Seus dados protegidos", description: "Dados de clientes, contratos e senhas não são enviados a modelos de IA sem a sua autorização explícita. Quando for preciso, uso dados fictícios." },
  { title: "Transparência", description: "Você sabe onde a IA participou do projeto e por quê. Nada de caixa-preta: o código e as decisões ficam documentados." },
  { title: "Uso com propósito", description: "IA entra quando reduz prazo ou custo sem reduzir qualidade. Quando uma regra simples resolve, a solução é a regra simples." },
] as const;

export const aiUses = {
  yes: ["Acelerar código repetitivo e testes", "Revisar segurança e acessibilidade", "Gerar documentação e rascunhos", "Automatizar leitura de documentos com conferência humana", "Prototipar ideias em horas, não semanas"],
  no: ["Decidir regras de negócio no seu lugar", "Receber dados sensíveis sem autorização", "Entregar código que ninguém revisou", "Substituir conversa com você e com quem usa o sistema", "Prometer \"IA\" onde ela não traz resultado"],
} as const;

export const processSteps = [
  { title: "Conversa e diagnóstico", description: "Entendo o problema, quem usa e o que já existe. Saio com uma lista do que resolve e do que pode esperar." },
  { title: "Proposta com escopo claro", description: "Escopo, prazo e valor por escrito, com as etapas e o que é entregue em cada uma." },
  { title: "Entregas curtas", description: "Você acompanha o sistema funcionando a cada etapa e ajusta o rumo antes que fique caro mudar." },
  { title: "Publicação e acompanhamento", description: "Coloco no ar, treino a equipe e acompanho o uso. Código e acessos ficam com você." },
] as const;

export const faq = [
  { question: "Você usa IA para escrever tudo?", answer: "Não. Uso IA como ferramenta para acelerar partes repetitivas e revisar, mas o desenho da solução, as regras de negócio e a revisão final são minhas. Tudo que entrego eu entendo e consigo explicar." },
  { question: "Meus dados vão para alguma IA?", answer: "Só com a sua autorização, e só o necessário. Por padrão trabalho com dados fictícios, e quando o projeto usa IA em produção explico qual serviço, onde os dados ficam e quanto custa." },
  { question: "Quanto custa um projeto?", answer: "Depende do escopo. Depois da conversa inicial envio uma proposta com valor fechado por etapa, sem surpresa no meio do caminho." },
  { question: "O código fica comigo?", answer: "Sim. Repositório, documentação e acessos são seus. Você pode continuar comigo ou com outra equipe." },
  { question: "Atende empresas de fora de MS?", answer: "Sim. O trabalho é remoto, com reuniões por vídeo e acompanhamento das entregas online." },
] as const;
