# Módulos do painel

Funções trazidas do Eureka/Nodus para a área privada (`/dashboard`). Os dados são por conta e ficam no Postgres, uma tabela por coleção, servidas por `/api/data/[kind]`.

## Mapa

| Menu | Módulo | Rota | Coleção |
| --- | --- | --- | --- |
| Visão geral | Início com "Primeiros passos" e bloco "Hoje" (mural ativo, tarefas, to-dos, ordens em andamento, jornadas abertas) | `/dashboard` | — |
| Operação | Ordens de serviço | `/dashboard/orders` (`?order=<id>` abre uma) | `orders` |
| | Viagens | `/dashboard/trip` | `trips` |
| | Jornadas de campo | `/dashboard/journeys` | `journeys` |
| | Tarefas | `/dashboard/tasks` | `tasks` |
| | Calendário | `/dashboard/calendar` | `events` |
| Frota | Veículos | `/dashboard/fleet` | `vehicles` |
| | Lançamentos de KM | `/dashboard/mileage` | `mileage` |
| Cadastros | Clientes, Colaboradores | `/dashboard/clients`, `/dashboard/employees` | `clients`, `employees` |
| | Hotéis | `/dashboard/hotels` | `hotels` |
| | Hospedagens | `/dashboard/reservations` | `reservations` |
| | Inventário | `/dashboard/inventory` | `inventories`, `inventory_items`, `inventory_locations`, `inventory_movements` |
| Comunicação | Mural | `/dashboard/announcements` | `announcements` |
| | Mensagens diretas | `/dashboard/messages` | tabela `app_direct_messages` (API `/api/org/messages`) |
| | Agenda para WhatsApp | `/dashboard/agenda` | — |
| Workspace | To-dos (tarefas pessoais em listas) | `/dashboard/todos` | `todos`, `todo_lists` |
| | Notas, Quadros | `/dashboard/notes`, `/dashboard/boards` | `notes`, `boards` |
| | Solicitações | `/dashboard/requests` | `requests` |
| Financeiro | Cartões, Apontamento, Despesas, Conciliação, Indicadores, Fechamento | `/dashboard/finance/<cards\|timesheets\|expenses\|reconciliation\|indicators\|closing>` | — (em preparo) |
| Ferramentas | Drive | `/dashboard/drive` | `drive` — ver [drive.md](drive.md) |
| | Diagramas (draw.io) | `/dashboard/diagrams` | `diagrams`, `drawio_libraries` |
| | Quadro branco (Excalidraw) | `/dashboard/whiteboards` (`/<id>` abre o editor) | `whiteboards` |
| Configurações | Empresa | `/dashboard/settings/company` | `settings` (registro `company`) |
| | Suporte | `/dashboard/settings/support` | — (`GET /api/health`) |
| Administração | Módulos | `/dashboard/system/modules` | tabela `app_modules` (API `/api/system/modules`) |
| Público | Quadro, diagrama e arquivo por link; links curtos | `/quadro/<token>`, `/diagrama/<token>`, `/arquivo/<token>`, `/s/<código>` | `shareToken` no registro; tabela `app_short_links` |

## Regras de cada módulo

**Empresa.** Nome, CNPJ/CPF, responsável, telefone, e-mail e endereço de origem, mais a cor de cada um dos 9 serviços. No Nodus são os ajustes da organização; aqui os dados são por conta, então ficam num registro único (`id: "company"`) da coleção `settings`. `serviceColor()` lê a cor personalizada.

**Colaboradores.** Além de nome, cargo e contato: CPF (validado), nascimento, sexo, nacionalidade, estado civil, escolaridade, matrícula, admissão, desligamento, categoria eSocial, CBO, natureza, prazo e fim do contrato, salário, horas semanais, horário e local de trabalho, endereço, dependentes (vínculo, nascimento, CPF, IRRF e salário-família), histórico trabalhista (férias com período aquisitivo, afastamento, acidente com CAT e alteração contratual) e contato de emergência. Telefones usam máscara brasileira. Escolher um cargo do catálogo (`jobTitles` em `lib/employees/profile.ts`) preenche o departamento. As regras de validação são as do esquema do Nodus (`validateProfile`).

**Clientes.** CPF/CNPJ, endereço principal estruturado (CEP com ViaCEP) e até 20 endereços extras com nome. O texto livre antigo em `address` continua aparecendo.

**Frota.** Situação (ativo/inativo: inativo some da escolha de veículo nas viagens), propriedade (empresa, colaborador ou alugado), locadora, retirada e devolução, KM na retirada e atual, limite mensal e alerta de KM do aluguel, mostrado no card.

**Viagens.** Serviço (cor no calendário), visitas na ordem da rota (endereço de cliente ou manual; subir, descer, remover) e "Distância e tempo": `POST /api/travel-estimate` geocodifica no Nominatim e traça a rota no OSRM, com volta à origem quando há data de retorno; avião, navio ou rota indisponível viram aproximação. A estimativa guarda as assinaturas da origem e das visitas e pede recálculo quando algo muda. Configure `GEOCODER_BASE_URL`, `GEOCODER_USER_AGENT` e `ROUTING_BASE_URL` numa instalação própria. **Exportar PDF** na página da viagem imprime o resumo (programação, equipe, rota, transporte, hospedagem).

**Ordens de serviço.** Título, situação (aberta, agendada, em execução, concluída, cancelada), serviço, cliente, viagem, datas, responsável pela liberação, equipe, execução, materiais em tabela (quantidade, material, descrição, observações), observações e anexos. O término não pode ser anterior ao início. O card usa a cor do serviço.

**Tarefas.** Início, prazo, responsável, cliente, descrição com links clicáveis. Ordenadas por prazo; atrasadas em vermelho; botão Concluir/Reabrir no card. Filtro abertas/atrasadas/concluídas.

**Impressão da ordem.** O botão de impressora no card monta o documento do Nodus: cabeçalho com os dados da empresa, identificação, cliente, programação, viagem vinculada, materiais em tabela, execução e assinaturas do técnico e do responsável pela liberação.

**Calendário.** **Exportar PDF** gera a agenda do mês dia a dia (eventos, viagens e ordens, com cliente, destino, equipe, transporte e hospedagem; tarefas ficam de fora). Visões Mês e Agenda. Junta eventos próprios, viagens (saída a retorno), ordens (início a término, exceto canceladas) e tarefas abertas com prazo, cada um na cor do serviço. Os tipos podem ser ocultados. Os 9 serviços e cores são os do Nodus (`services` em `lib/nodus/stores.ts`).

**Jornadas.** Registro de campo separado da viagem planejada: Iniciar dia (viagem e veículo cadastrados ou digitados, destino, KM), Cheguei (sugere o destino na primeira chegada), Saí, Foto (serviço, comprovante, ocorrência, hodômetro; comprimida para até 1600 px) e Encerrar dia. Cada registro guarda o horário do aparelho e a localização, com link para o mapa. A lista filtra por período e pessoa e soma horas e KM.

**Lançamentos de KM.** Data, carro, motorista, passageiros, cliente, viagem, KM inicial e final, combustível, pedágio e outros custos. Se o KM final ficar vazio, o card usa o KM inicial do próximo lançamento do mesmo carro (marcado com \*).

**Hotéis.** Nome, contato, cidade, endereço e diária.

**Inventário.** Vários inventários (seletor no topo; itens sem inventário ficam em "Geral"); excluir um inventário remove seus itens e as movimentações deles. Abas Saldos (itens × locais, total e alerta de mínimo), Itens (código, categoria, unidade, mínimo, valores de compra e venda), Locais e Movimentações (entrada, saída, transferência). O saldo é calculado pelas movimentações; saída e transferência são recusadas sem saldo na origem. Digitar um local novo na movimentação o cadastra. Excluir item ou local remove as movimentações ligadas a ele. Mostra as 200 movimentações mais recentes.

**Mural.** Compartilhado pela organização (tabelas `app_org_posts` e `app_org_post_comments`, API `/api/org/posts`). Rascunho (só quem escreveu vê) ou publicado, data de publicação (vazia = agora) e prazo de retirada. Estados: rascunho, programado, no mural, encerrado. Membros publicam; quem publicou ou a administração edita e exclui. Cada aviso tem discussão: membros e externos comentam, e cada um exclui o próprio comentário. Avisos do mural antigo (por conta, coleção `announcements`) podem ser movidos para o mural da organização pelo aviso no topo. Só os avisos "no mural" aparecem no Início.

**Mensagens.** Conversa direta entre pessoas ativas da mesma organização: lista com última mensagem e não lidas, conversa atualizada a cada 4 s, "lida" quando a outra pessoa abre. Enter envia.

**Módulos.** Como no Nodus web, cada função pequena é um módulo próprio (32 no catálogo de `lib/modules.ts`, agrupados por seção): Hospedagem separada de Hotéis, Lançamentos de KM separado de Frota, Diagramas separado de Quadro branco, cada etapa do Financeiro, Gerador de agenda, Jornada de campo, Links curtos, Leads, Blog e Publicidade. Desligar pede confirmação e: tira do menu, do Início (grade, painéis "Hoje", primeiros passos), dos atalhos e do calendário; troca a página do painel por um aviso (`ModuleGate` no shell); faz `/api/data/<coleção>` responder 403; e, pelo `proxy.ts` (cache de 10 s), bloqueia as APIs e páginas públicas do módulo (ex.: `/api/leads`, `/blog`, `/quadro/…`, `/s/…`), que vão para `/indisponivel`. No site, Leads desligado esconde o botão de conversa e Blog desligado tira o link do menu. Os dados ficam guardados.

**Links públicos.** Quadros (**Compartilhar** no topo do quadro) e diagramas (**Compartilhar** no card) ganham link somente leitura, como os arquivos do Drive. O quadro público mostra listas e cartões sem anexos nem comentários; o diagrama abre no visualizador do draw.io. **Criar link curto** gera `/s/<código>` para qualquer link público.

**Organização ativa.** Recursos compartilhados usam a primeira organização ativa da pessoa (`lib/organizations/current.ts`); a administração da plataforma, sem vínculo, usa a primeira organização ativa.

**Agenda para WhatsApp.** Data e obras (número, cliente cadastrado ou digitado, local, tarefa, equipe cadastrada e outros nomes, carro cadastrado ou digitado). Gera o mesmo texto do Nodus (📅/📍/👷🏻/👥/🚘), com orientações finais editáveis; copia ou abre no WhatsApp.

**Solicitações.** Tipo (materiais, equipamento, documento, liberação, atualização), ordem relacionada, descrição, to-dos marcáveis, anexos e situação; botão Concluir no card.

**To-dos.** Listas inteligentes (Hoje, Agendadas, Todas, Concluídas), a lista padrão "Tarefas" e listas próprias com cor e ícone. Linha "Nova tarefa" no fim da lista (Enter salva), detalhes com notas, lista e datas; links no título viram clicáveis. Excluir uma lista exclui as tarefas dela.

**Quadros (cartões).** Além de descrição, anexos e capa: etiquetas coloridas, prazo (atrasado em vermelho), prioridade alta, checklists com progresso, campos personalizados (texto, número, data) e comentários. O card mostra o resumo.

**Quadro branco.** Excalidraw 0.18 carregado sob demanda. O desenho vai como arquivo JSON para o storage (pode ter imagens; até 20 MB) e o registro guarda a referência e uma miniatura. Salva 1,5 s depois da última alteração e ao sair; exporta PNG, SVG e `.excalidraw`; importa `.excalidraw`.

**Suporte.** Conexão, resposta do servidor e do banco (`/api/health`), recarregar o app e copiar um diagnóstico do aparelho para o chamado.

**Diagramas.** Botão **Bibliotecas**: escolhe as bibliotecas nativas do draw.io que abrem no editor (guardado no navegador) e importa bibliotecas próprias (`.xml` de Arquivo › Exportar biblioteca), entregues ao editor pelo evento `configure`. Editor do diagrams.net embutido (`NEXT_PUBLIC_DRAWIO_URL`, padrão `https://embed.diagrams.net`), com salvamento automático, miniatura SVG e importação de `.drawio`/`.xml` até 20 MB. Exportar PNG/SVG/.drawio fica no menu Arquivo do próprio editor.

**Financeiro.** Páginas reservadas com o escopo de cada etapa; ainda sem dados.

## Estrutura

Cadastros simples não têm tela própria: são uma configuração de campos sobre um motor genérico.

| Caminho | Papel |
| --- | --- |
| `lib/records/store.ts` | `createRecordStore(kind, mensagens, { lazyFiles })`: carrega, salva em fila, avisa outras abas e recarrega ao focar. Gera `id`, `code` (8 caracteres), `createdAt`, `updatedAt`. `fieldsOf` remove esses metadados para salvar de novo |
| `lib/records/references.ts` | Opções e nomes de registros ligados (clientes, colaboradores, veículos, viagens, hotéis, ordens, itens, locais) |
| `components/records/record-form.tsx` | Campos por configuração: texto, número, data, moeda, seleção, referência (simples ou múltipla), tabela de linhas, anexos, caixa de seleção |
| `components/records/records-page.tsx` | Catálogo com busca, filtro, card, ação rápida, edição e exclusão |
| `components/nodus/modules.tsx` | Configurações de Ordens, Tarefas, Hotéis, KM, Mural e Solicitações |
| `components/nodus/*-page.tsx` | Telas próprias: Calendário, Inventário, Jornadas, Agenda, Diagramas, Financeiro, bloco "Hoje" |
| `lib/nodus/stores.ts` | Tipos, stores e regras (serviços, estados do mural, saldo do estoque) |

Componentes de interface reutilizáveis (`components/ui/`):

| Componente | Uso |
| --- | --- |
| `Field`, `Select`, `Textarea` | Rótulo + controle + dica; classes únicas de select e textarea |
| `LoadingBlock`, `EmptyState`, `Badge` | Carregando, vazio, etiqueta colorida |
| `Segmented`, `Tabs` | Alternância (grade/lista, mês/agenda) e abas |
| `Dropdown`, `DropdownItem` | Menu aberto por botão |
| `ContextMenu` | Menu do botão direito, no `<body>`, posicionado pelo tamanho real |
| `NameDialog` | Criar/renomear com um campo |
| `ActionButton`, `ActionList` | Ações com ícone e rótulo responsivo |
| `Switch`, `ErrorToast` | Chave liga/desliga; erro como toast |

## Novo cadastro

1. Acrescente o nome em `collectionKinds` (`lib/storage/file-refs.ts`), a tabela em `lib/db/schema/app.ts` (`records("app_<nome>")` e `featureTables`).
2. `bun run db:generate` e `bun run db:migrate`. Não escreva migrations à mão: sem o snapshot, o próximo `db:generate` repete as tabelas.
3. Crie o store em `lib/nodus/stores.ts` e um `RecordsConfig` com os campos; a página é `<RecordsPage config={...} />`.
4. Inclua a rota em `app/dashboard/<rota>/page.tsx` e o link em `components/dashboard-shell.tsx`.

## Fora do escopo por enquanto

Os cadastros e ferramentas continuam por conta; mural e mensagens são da organização. Por isso não fazem sentido aqui:

- Papéis personalizados por módulo e a prévia "Visualizar como papel": as permissões do Nodus valem sobre dados compartilhados, e os cadastros daqui são de cada conta. Vale o papel da organização (membro edita, externo só lê) e o liga/desliga de módulos.
- Workspaces com membros, jornadas da equipe e vínculo de colaborador com conta: dependem de cadastros compartilhados.
- Fila offline com service worker: as gravações vão direto para `/api/data`; o que falhar fica marcado e é reenviado ao voltar a conexão.
- Financeiro: também é só reserva de páginas no Nodus.

## Acesso: onboarding e senha

**Onboarding (`/onboarding`).** Criar conta passa por etapas: conta (nome, e-mail, senha) → empresa (nome da organização, CNPJ/CPF, responsável, telefone, e-mail) → endereço (CEP com busca; pode pular). Ao concluir, a organização é criada com a pessoa como membro e os dados vão para Configurações › Empresa (registro `company` da coleção `settings`). Quem pode passar pelo onboarding (`canOnboard` em `lib/organizations/onboarding.ts`): sem `ALLOW_SIGNUP`, só a primeira conta e a administração enquanto não existir organização; com `ALLOW_SIGNUP=true`, qualquer pessoa cria conta e a própria organização. O painel manda para o onboarding quem ainda pode criar a organização, e o login sem nenhuma conta cadastrada também.

**Esqueci a senha.** Botão no login. No modo local (sem e-mail) registra o pedido (`app_password_requests`, resposta igual para e-mail com ou sem conta); a administração vê os pedidos em Administração › Organizações e define uma senha nova (também pelo botão **Senha** de cada membro), o que encerra as sessões da pessoa. No Neon Auth o botão envia o link por e-mail e `/reset-password?token=…` grava a senha nova.

## Marketing: leads do site

**Captura.** A página inicial tem um botão flutuante de conversa (e o botão **Enviar mensagem** da seção Contato abre o mesmo formulário): nome, e-mail, telefone/WhatsApp e mensagem. `POST /api/leads` aceita só envios do próprio site, ignora robôs pelo campo isca `website`, limita 5 envios por IP a cada 10 minutos e guarda a página de origem e os parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) e o `referrer`. Tabela `app_leads`.

**Funil (Marketing › Leads, só administração).** Etapas Novo → Em contato → Qualificado → Convertido / Perdido, com contadores clicáveis como filtro e taxa de conversão. No detalhe: atalhos para e-mail, telefone e WhatsApp (mensagem pronta), etapa, próximo contato (avisa quando vence) e anotações salvas ao sair do campo. **Converter em cliente** cria o cliente no cadastro e marca o lead como Convertido. **Exportar CSV** baixa a lista filtrada (separador `;`, abre no Excel).
