// Conteúdo da página inicial de serviços. Sem números, clientes ou depoimentos
// inventados: só o que é oferecido e como o trabalho é feito.
// Escrito para quem não é da área: o cliente se reconhece pelo problema, não pelo nome da tecnologia.

// Situações do dia a dia que o cliente reconhece, com o que dá para fazer em cada uma.
export const situations = [
  { problem: "A equipe passa horas copiando dados de uma planilha para outra.", solution: "Os dados entram uma vez só. O resto acontece sozinho." },
  { problem: "Pedidos e informações se perdem entre mensagens e e-mails.", solution: "Tudo num lugar só, com histórico e um responsável para cada coisa." },
  { problem: "Ninguém sabe ao certo em que pé está um pedido, chamado ou entrega.", solution: "Um painel mostra o andamento de tudo, na hora." },
  { problem: "O relatório do mês leva dias para ficar pronto.", solution: "O relatório fica pronto sozinho, quando você precisar." },
  { problem: "Você usa dois sistemas que não se conversam e alguém digita tudo duas vezes.", solution: "Os sistemas passam a conversar, e ninguém digita nada duas vezes." },
  { problem: "Existe um sistema antigo que ninguém tem coragem de mexer.", solution: "Ele é organizado, documentado e volta a trabalhar a seu favor." },
] as const;

export const services = [
  { id: "sistemas", title: "Sistemas sob medida", description: "Informação espalhada em planilhas e conversas? Um sistema que se adapta à sua equipe, com cadastros, pedidos, aprovações e painéis num lugar só.", items: ["Controle de pedidos", "Cadastro de clientes", "Acesso por perfil"] },
  { id: "automacao", title: "Automação de tarefas", description: "Alguém passa horas copiando, colando e conferindo? Isso passa a acontecer sozinho, e a sua equipe fica só com o que exige decisão.", items: ["Fim do copia e cola", "Avisos automáticos", "Relatórios prontos"] },
  { id: "integracoes", title: "Sistemas que conversam", description: "Digitando a mesma coisa em dois lugares? Ligamos o seu sistema ao financeiro, à loja virtual e aos serviços que você já usa. Digitou uma vez, chegou em todo lugar.", items: ["Sistema de gestão", "Pagamentos", "Loja virtual"] },
  { id: "ia", title: "IA onde faz sentido", description: "Na dúvida se a IA vale a pena? Mostramos onde ela economiza tempo de verdade na sua empresa, e onde só traria risco. Custos e limites claros antes de começar.", items: ["Assistente interno", "Busca em documentos", "Custo explicado antes"] },
  { id: "mobile", title: "Aplicativos para celular", description: "Equipe na rua sem acesso ao sistema? Tudo na palma da mão, funcionando mesmo com internet fraca.", items: ["Instala no celular", "Funciona com internet fraca", "Fotos e localização"] },
  { id: "evolucao", title: "Cuidar do sistema que você já tem", description: "Sistema antigo que ninguém tem coragem de mexer? Assumimos, corrigimos o que está lento ou quebrando, atualizamos o que ficou velho e documentamos o que ninguém documentou.", items: ["Correção de problemas", "Atualizações", "Documentação"] },
] as const;

// O que "IA como ferramenta consciente" significa na prática.
export const aiPrinciples = [
  { title: "Uma pessoa responsável", description: "A IA sugere; uma pessoa revisa, testa e responde por tudo que vai para o seu sistema. Nada é entregue sem ser entendido e explicado." },
  { title: "Seus dados protegidos", description: "Dados de clientes, contratos e senhas não são enviados a ferramentas de IA sem a sua autorização. Quando possível, usamos dados de exemplo." },
  { title: "Transparência", description: "Você sabe onde a IA participou do projeto e por quê. Nada de caixa-preta: as decisões ficam registradas." },
  { title: "Só quando compensa", description: "A IA entra quando reduz prazo ou custo sem reduzir qualidade. Quando uma solução simples resolve, fica a solução simples." },
] as const;

export const aiUses = {
  yes: ["Deixar o desenvolvimento mais rápido e mais barato", "Conferir falhas de segurança e de usabilidade", "Escrever manuais e documentação", "Ler documentos automaticamente, com conferência humana", "Testar uma ideia em horas, não em semanas"],
  no: ["Decidir as regras do seu negócio no seu lugar", "Receber dados sensíveis sem autorização", "Entregar algo que ninguém revisou", "Substituir a conversa com você e com quem usa o sistema", "Prometer \"IA\" onde ela não traz resultado"],
} as const;

export const processSteps = [
  { title: "Conversa", description: "Você conta como o trabalho é feito hoje e o que mais incomoda. Não precisa chegar com nada pronto: as perguntas ficam com a gente." },
  { title: "Proposta por escrito", description: "O que será feito, em quanto tempo e por quanto, dividido em etapas para você saber o que recebe em cada uma." },
  { title: "Entregas aos poucos", description: "A cada etapa você já usa uma parte funcionando e pode ajustar o rumo antes que fique caro mudar." },
  { title: "No ar e acompanhado", description: "Colocamos o sistema no ar, treinamos a sua equipe e acompanhamos os primeiros dias. Tudo fica em seu nome." },
] as const;

export const faq = [
  { question: "Não sei exatamente o que preciso. Posso falar mesmo assim?", answer: "Pode, e é o caso mais comum. Basta contar como o trabalho é feito hoje e o que dá mais dor de cabeça. Nós fazemos as perguntas e dizemos o que vale a pena resolver primeiro, e também o que não vale." },
  { question: "Preciso entender de tecnologia?", answer: "Não. A conversa é sobre o seu negócio, não sobre programação. Explicamos as opções em linguagem simples, e você decide com base em prazo, custo e resultado." },
  { question: "Quanto custa um projeto?", answer: "Depende do tamanho. Depois da conversa inicial, enviamos uma proposta com valor fechado por etapa, sem surpresas no meio do caminho." },
  { question: "O sistema fica comigo?", answer: "Sim. O código, a documentação e os acessos ficam em seu nome. Você pode continuar com a gente ou levar para outra equipe." },
  { question: "Vocês usam IA para fazer tudo?", answer: "Não. A IA é uma ferramenta para acelerar partes repetitivas e revisar, mas o desenho da solução, as regras do seu negócio e a revisão final são feitos por pessoas. Tudo que entregamos, entendemos e sabemos explicar." },
  { question: "Meus dados vão para alguma IA?", answer: "Só com a sua autorização, e só o necessário. Quando o projeto usa IA no dia a dia, explicamos qual serviço é usado, onde os dados ficam e quanto custa." },
  { question: "Vocês atendem empresas de fora de MS?", answer: "Sim. O trabalho é remoto, com reuniões por vídeo e acompanhamento das entregas online." },
] as const;
