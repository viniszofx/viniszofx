// Conteúdo da página inicial de serviços. Sem números, clientes ou depoimentos
// inventados: só o que é oferecido e como o trabalho é feito.
// Escrito para quem não é da área: o cliente se reconhece pelo problema, não pelo nome da tecnologia.

// Situações do dia a dia que o cliente reconhece, com o que dá para fazer em cada uma.
export const situations = [
  { problem: "A equipe passa horas copiando dados de uma planilha para outra.", solution: "Os dados entram uma vez só e o resto acontece sozinho." },
  { problem: "Pedidos e informações se perdem no meio do WhatsApp e do e-mail.", solution: "Tudo num lugar só, com histórico e responsável." },
  { problem: "Ninguém sabe ao certo em que pé está um pedido, chamado ou entrega.", solution: "Um painel que mostra o andamento de cada um." },
  { problem: "O relatório do mês leva dias para ficar pronto.", solution: "Relatórios montados automaticamente, quando você precisar." },
  { problem: "Você usa dois sistemas que não se conversam e alguém digita tudo duas vezes.", solution: "Os sistemas passam a trocar as informações entre si." },
  { problem: "Existe um sistema antigo que ninguém tem coragem de mexer.", solution: "Ele é organizado, documentado e volta a evoluir." },
] as const;

export const services = [
  { id: "sistemas", title: "Sistemas sob medida", description: "Um sistema feito para o jeito que a sua equipe já trabalha, e não o contrário: cadastros, pedidos, aprovações e painéis num lugar só.", items: ["Controle de pedidos", "Cadastro de clientes", "Acesso por perfil"] },
  { id: "automacao", title: "Automação de tarefas", description: "Aquilo que alguém faz toda semana copiando, colando e conferindo passa a acontecer sozinho, com uma pessoa revisando só o que exige decisão.", items: ["Fim do copia e cola", "Avisos automáticos", "Relatórios prontos"] },
  { id: "integracoes", title: "Sistemas que conversam", description: "Ligo o seu sistema ao financeiro, à loja virtual, ao WhatsApp ou a outros serviços que você já usa, para ninguém precisar digitar a mesma coisa duas vezes.", items: ["Sistema de gestão", "Pagamentos", "WhatsApp"] },
  { id: "ia", title: "IA onde faz sentido", description: "Mostro onde a inteligência artificial realmente economiza tempo na sua empresa e onde só traria risco. Custos e limites explicados antes de começar.", items: ["Assistente interno", "Busca em documentos", "Custo explicado antes"] },
  { id: "mobile", title: "Aplicativos para celular", description: "Para quem trabalha na rua ou em campo: aplicativos que funcionam no celular, mesmo com internet fraca.", items: ["Instala no celular", "Funciona com internet fraca", "Fotos e localização"] },
  { id: "evolucao", title: "Cuidar do sistema que você já tem", description: "Assumo sistemas existentes: corrijo o que está lento ou quebrando, atualizo o que ficou velho e documento o que ninguém documentou.", items: ["Correção de problemas", "Atualizações", "Documentação"] },
] as const;

// O que "IA como ferramenta consciente" significa na prática.
export const aiPrinciples = [
  { title: "Uma pessoa responsável", description: "A IA sugere; eu reviso, testo e respondo por tudo que vai para o seu sistema. Nada é entregue sem que eu entenda e saiba explicar." },
  { title: "Seus dados protegidos", description: "Dados de clientes, contratos e senhas não são enviados a ferramentas de IA sem a sua autorização. Quando possível, uso dados de exemplo." },
  { title: "Transparência", description: "Você sabe onde a IA participou do projeto e por quê. Nada de caixa-preta: as decisões ficam registradas." },
  { title: "Só quando compensa", description: "A IA entra quando reduz prazo ou custo sem reduzir qualidade. Quando uma solução simples resolve, fica a solução simples." },
] as const;

export const aiUses = {
  yes: ["Deixar o desenvolvimento mais rápido e mais barato", "Conferir falhas de segurança e de usabilidade", "Escrever manuais e documentação", "Ler documentos automaticamente, com conferência humana", "Testar uma ideia em horas, não em semanas"],
  no: ["Decidir as regras do seu negócio no seu lugar", "Receber dados sensíveis sem autorização", "Entregar algo que ninguém revisou", "Substituir a conversa com você e com quem usa o sistema", "Prometer \"IA\" onde ela não traz resultado"],
} as const;

export const processSteps = [
  { title: "Conversa", description: "Você conta como o trabalho é feito hoje e o que mais incomoda. Não precisa chegar com nada pronto: as perguntas ficam comigo." },
  { title: "Proposta por escrito", description: "O que será feito, em quanto tempo e por quanto, dividido em etapas para você saber o que recebe em cada uma." },
  { title: "Entregas aos poucos", description: "A cada etapa você já usa uma parte funcionando e pode ajustar o rumo antes que fique caro mudar." },
  { title: "No ar e acompanhado", description: "Coloco o sistema para funcionar, ensino a equipe a usar e acompanho os primeiros dias. Tudo fica em seu nome." },
] as const;

export const faq = [
  { question: "Não sei exatamente o que preciso. Posso falar mesmo assim?", answer: "Pode, e é o caso mais comum. Basta contar como o trabalho é feito hoje e o que dá mais dor de cabeça. Eu faço as perguntas e digo o que vale a pena resolver primeiro, e também o que não vale." },
  { question: "Preciso entender de tecnologia?", answer: "Não. A conversa é sobre o seu negócio, não sobre programação. Explico as opções em linguagem simples e você decide com base em prazo, custo e resultado." },
  { question: "Quanto custa um projeto?", answer: "Depende do tamanho. Depois da conversa inicial envio uma proposta com valor fechado por etapa, sem surpresa no meio do caminho." },
  { question: "O sistema fica comigo?", answer: "Sim. O código, a documentação e os acessos ficam em seu nome. Você pode continuar comigo ou levar para outra equipe." },
  { question: "Você usa IA para fazer tudo?", answer: "Não. Uso IA como ferramenta para acelerar partes repetitivas e revisar, mas o desenho da solução, as regras do seu negócio e a revisão final são minhas. Tudo que entrego eu entendo e consigo explicar." },
  { question: "Meus dados vão para alguma IA?", answer: "Só com a sua autorização, e só o necessário. Quando o projeto usa IA no dia a dia, explico qual serviço é usado, onde os dados ficam e quanto custa." },
  { question: "Atende empresas de fora de MS?", answer: "Sim. O trabalho é remoto, com reuniões por vídeo e acompanhamento das entregas online." },
] as const;
