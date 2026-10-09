This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Notes locais

Notes fica no sublink de Workspace. No celular, o menu abre pela esquerda, sobre a página, e fecha ao escolher um link, tocar fora ou pressionar Esc.

O dashboard inclui Anotações em `/dashboard/notes`, com catálogo pesquisável, criação, edição e exclusão. O editor oferece comandos `/`, formatação contextual, tarefas, tabelas, blocos lado a lado e incorporações por URL. O título aceita Enter para focar o corpo.

Documentos são salvos automaticamente em IndexedDB (`viniszofx-notes`), com um pequeno rascunho de recuperação em localStorage para os últimos caracteres antes de recarregar. Capas e anexos de até 20 MB ficam no mesmo navegador; imagens podem ser coladas com Ctrl+V. Exportação em Markdown e JSON inclui os arquivos; PDF usa impressão A4 com margens de 25,4 mm.

Este modo é local: não usa API, conta ou sincronização entre dispositivos. Limpar os dados do site também remove as notas. Widgets externos continuam dependendo da conexão e das permissões do site incorporado.

### Validar as anotações

Execute `bun run build` e depois `bun run test:notes`. O teste abre um perfil temporário do Microsoft Edge e verifica criação, edição, tabelas, anexos, reload, recuperação de rascunho, exportação, responsividade e exclusão. Para usar outro navegador Chromium, defina `VINISZOFX_TEST_BROWSER` com o caminho do executável. O perfil de teste é removido ao finalizar.

## Navegação e aparência do painel

O header reúne o controle do menu lateral, a busca global por Notes, boards, listas, cards e páginas e o menu do usuário com atalhos para Workspace, Configurações, página inicial e saída para a tela de login. O acesso atual continua demonstrativo.

No rodapé do menu lateral, o botão de monitor oferece **Light**, **Dark** e **System**. A preferência é salva no navegador; System acompanha mudanças do tema do dispositivo. O menu e a busca também funcionam no celular.

## Boards locais

Boards fica abaixo de Notes no submenu Workspace. Crie, renomeie e exclua quadros; adicione listas e cards com título, descrição, cor e conclusão. Arraste listas e cards para reorganizar, inclusive entre listas. Os botões de direção permitem reorganizar os cards dentro da lista; a movimentação entre listas é feita por arraste. Exclusões pedem confirmação.

Os dados ficam no IndexedDB deste navegador, separados das Notes. A interface atualiza imediatamente e uma fila grava as alterações em sequência. Erros de armazenamento exibem uma opção de tentar novamente. Não há sincronização com servidor ou entre dispositivos.

Novos Boards começam com **Stage**, **Progress** e **Done**. A paleta de cores fica entre o lápis e a lixeira em quadros, listas e cards. Cards aceitam anexos locais de até 20 MB por arquivo, imagens coladas com Ctrl+V, prévia e download. Os arquivos são armazenados com o card no IndexedDB e removidos ao excluir o conteúdo correspondente. O dialog exibe três anexos e oferece Mostrar todos.

A cor do Board preenche o fundo inteiro em um tom suave, adaptado ao tema. O seletor também oferece **Cover** para escolher uma imagem de fundo de até 20 MB e remover a capa. O catálogo exibe a imagem de capa na miniatura, quando definida, e mantém a cor suave no restante do cartão. Capas continuam armazenadas localmente no navegador.

Cards também podem ter capa: envie pelo botão Cover no seletor de cor ou marque uma imagem anexada como capa no dialog. A imagem aparece no card e no dialog, fica salva no navegador e pode ser removida sem excluir o anexo.

Boards e Notes usam cantos retos e listagens com uma coluna no celular, duas a partir de 640 px e três a partir de 1024 px.

## Listagens e busca global

Notes e Boards compartilham os componentes de catálogo: mesmo cabeçalho, busca local, miniaturas, ações, estados de carregamento, botão de criação e grid responsivo. A busca do header é global e abre resultados agrupados para Notes, Boards, listas, cards e páginas. Ela consulta título e conteúdo das notas, títulos das listas e boards, títulos/descrições e nomes dos anexos dos cards. Acentos e maiúsculas não alteram a busca. Cada resultado abre o registro correspondente; notas abrem o editor e cards abrem o dialog. Tudo é pesquisado localmente.

Na capa das Notes, o botão de paleta agrupa Trocar capa, Reposicionar/Concluir ajuste e Remover capa.

Capas de boards e cards oferecem **Reposicionar** no seletor de cor. A prévia aceita arraste e controles horizontal/vertical. Concluir ajuste salva a posição, que também aparece nas miniaturas e permanece ao recarregar. No dialog do card, Reposicionar capa ajusta o rascunho até Salvar.

O dialog de cards segue a divisão do Nodus: descrição e título à esquerda, anexos à direita no desktop e abaixo no celular. A descrição reutiliza o editor de Notes, com blocos, comandos /, tarefas, tabelas e formatação preservada no documento estruturado. Imagens coladas e arquivos inseridos pelo editor ficam nos anexos do card, com referências locais persistentes.

## Portfólio público

A index (`/`) apresenta Vinicius Souza, sua formação, tecnologias, projetos e contato, com links para GitHub e LinkedIn. Os dados foram conferidos no perfil público e nos READMEs dos repositórios em 08/10/2026 e ficam em `lib/portfolio/content.ts`; a página não depende da API do GitHub para renderizar. Os projetos são Workspace, Areco, Ticket Management e E-ticket. As miniaturas são ilustrações da interface, não capturas dos aplicativos.

A apresentação é responsiva e acompanha o tema do site. O header mantém Login e adiciona atalhos para Sobre, Projetos e Contato. O Workspace pode ser experimentado pelo link do projeto.

## Clients locais

Clients é uma seção do menu principal, fora de Workspace, em `/dashboard/clients`. O cadastro oferece nome obrigatório e empresa, e-mail, telefone, endereço e observações opcionais. A listagem usa o mesmo catálogo responsivo de Notes e Boards, com criação e edição em diálogo, busca por dados do cliente e exclusão com confirmação.

Os registros são salvos em IndexedDB (`viniszofx-clients`), com fila de gravação, datas de criação/atualização e atualização entre abas. A busca global inclui clientes e abre diretamente o cadastro selecionado. Não há envio para servidor ou sincronização entre dispositivos; os dados permanecem neste navegador.

Validação: `bun run build` e `bun run test:clients` verificam cadastro, validação, edição, busca global, datas, persistência, responsividade e exclusão no navegador.

## Tema visual

O tema segue o preset shadcn `b1xTtTQQVu`: Sera, base Stone, acento Cyan, gráficos Blue, fontes Oxanium e Raleway, ícones Remix Icon e menus `default-translucent` com realce `subtle`. Botões e superfícies Sera usam cantos retos; avatares mantêm seu formato próprio. Os componentes compartilhados mantêm os ajustes de responsividade, limites de altura e acessibilidade necessários ao dashboard. As superfícies de menus/popovers são centralizadas em `components/ui/menu-styles.ts`.

## Feedback e confirmação

O dashboard utiliza toasts Base UI para criação, edição, exclusão e erros de armazenamento ou upload. A confirmação de sucesso só aparece após a gravação no IndexedDB; salvamento automático e movimentação por arraste não geram notificações repetitivas. Os avisos são acessíveis, dispensáveis e seguem o tema Sera.

Exclusões de clientes, boards, listas, cards, notas e anexos pedem confirmação. O diálogo compartilhado bloqueia cliques repetidos durante uma ação assíncrona e mantém os erros visíveis. Anexos do card só são removidos definitivamente ao salvar o card.

Na criação e edição dos Boards, informe uma descrição e escolha um cliente opcional de Clients. O vínculo e a descrição aparecem no catálogo e no cabeçalho do board, participam da busca e ficam salvos no IndexedDB. A remoção de um cliente preserva o board e sinaliza o vínculo como Cliente removido até escolher outro ou Sem cliente.

Boards possuem status **Draft**, **Started**, **Paused**, **Pending**, **Completed** e **Cancelled**, selecionado no painel direito do diálogo e exibido no catálogo e no cabeçalho. Novos boards e registros antigos sem status usam Draft; o status é salvo no navegador e pode ser alterado na edição.

Trip fica abaixo de Clients no menu principal. New trip permite cadastrar descrição, cliente opcional e transporte (Car, Motorcycle, Bus, Plane ou Ship). Viagens podem ser editadas, excluídas com confirmação e encontradas pela busca global. Os registros ficam salvos neste navegador.

Fleet fica abaixo de Trip no menu principal. Permite cadastrar, editar e excluir veículos com identificação, placa, marca, modelo, ano, tipo e observações. Inclui pesquisa, confirmação de exclusão, datas no rodapé e armazenamento local no navegador.

Em Fleet, a coluna direita inclui RENAVAM e chassi opcionais, com ajuda sobre onde encontrar os códigos, e anexos antes das observações. Os arquivos (até 20 MB cada) ficam no IndexedDB e podem ser abertos, baixados ou removidos ao salvar o veículo.

A identificação em Fleet é gerada automaticamente por tipo, marca, modelo e cor. A seleção de cor oferece opções padrão e Nova cor; cores personalizadas de veículos salvos ficam disponíveis nos próximos cadastros.

Marca e modelo em Fleet usam seleções com opções iniciais e botão Novo. Modelos são filtrados pela marca; opções personalizadas são reutilizadas a partir dos veículos salvos. Ao trocar a marca, a seleção de modelo é limpa.

Ano em Fleet é uma seleção e também integra a identificação automática (tipo · marca · modelo · cor · ano).

Cada veículo possui um código curto de 8 caracteres derivado do UUID, exibido na listagem e no diálogo. O código é mantido na edição e pode ser pesquisado. Novos cadastros verificam duplicidade do código no armazenamento local antes de salvar.

Trip permite vincular um veículo de Fleet, selecionando pela identificação, placa e código. O vínculo é salvo na viagem e aparece na listagem e na busca. Veículos removidos são sinalizados e a viagem permanece preservada.

Trip inclui KM inicial/final, informações e local da viagem. O check Precisa de hospedagem? libera nome, telefone, endereço e diária em reais. KM final não pode ser menor que o inicial; todos esses campos são opcionais.

New trip usa diálogo simplificado com cliente, board, transporte, veículo e descrição opcional. Clicar na viagem abre /dashboard/trip/[tripId] ao lado do aside; nessa página ficam também quilometragem, local, informações e hospedagem. Salvar na página mantém a viagem aberta.

Informações da viagem é uma seção com cidade, estado/UF, rua, número, complemento, bairro, CEP e datas de ida/retorno. O retorno não pode anteceder a ida. O campo livre Informações foi removido da interface.

Reservations fica abaixo de Trip no menu. Armazena nome do hotel, telefone, endereço, diária, datas de entrada/saída e observações, com total calculado pelas noites. Inclui CRUD, confirmação de exclusão, busca global e armazenamento local.

## Employees

Employees fica acima de Trip no menu principal. Permite cadastrar, consultar, editar e excluir empregados com nome obrigatório, departamento, cargo, e-mail, telefone, endereço e observações opcionais. Usa catálogo responsivo, diálogo em duas colunas, confirmação de exclusão, toasts e datas de criação/atualização. Os registros ficam no IndexedDB deste navegador e participam da busca global.

Employees inclui código curto de 8 caracteres derivado do UUID, preservado nas edições, endereço separado por CEP, rua, número, complemento, bairro, cidade e UF, consulta ViaCEP e anexos de até 20 MB acima das observações. O rodapé apresenta o aviso de armazenamento local e as datas de criação/atualização com horário.

Trip permite selecionar vários colaboradores de Employees, buscar por nome/cargo/código e manter os vínculos na criação e edição com autosave na página. Os participantes aparecem no catálogo e na busca global; empregados removidos são sinalizados sem excluir a viagem.
