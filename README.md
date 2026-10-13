This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Blog, busca e publicidade

Configure `SITE_URL` com a origem pública definitiva (por exemplo, `https://exemplo.com`) para gerar URLs canônicas, metadados sociais, `robots.txt` e `sitemap.xml` corretos. Na Vercel, `VERCEL_PROJECT_PRODUCTION_URL` é usado quando `SITE_URL` não está definido.

No editor de posts, a coluna direita permite definir título e descrição de busca, retirar um artigo do índice e selecionar publicidade após a capa, no meio e ao final do texto. Em **Painel → Publicidade**, configure uma campanha para cada posição: anunciante, título, texto, link, imagem opcional e estado ativo. As imagens ficam no bucket Neon `post`. Uma campanha só aparece quando está ativa e a posição foi habilitada no post; posições sem campanha não ocupam espaço na página.

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

Na Vercel, configure `DATABASE_URL` e `NEON_AUTH_COOKIE_SECRET` (mínimo de 32 caracteres) em **Production**; inclua **Preview** se usar deploys de prévia. Com a integração Neon Auth habilitada, a Vercel recebe `NEON_AUTH_BASE_URL` automaticamente. Sem a integração, configure `AUTH_NEON_URL` manualmente com o endpoint da **mesma branch** do banco, terminado em `/auth`. O código prioriza `NEON_AUTH_BASE_URL` quando ambas existem. Configure também as variáveis de storage descritas em `.env.example` e `SITE_URL` com o domínio público.

Em **Neon Console → projeto → branch usada pela Vercel → Auth → Configuration → Domains**, adicione a origem exata do site em produção, incluindo o protocolo e sem barra final. Para este deploy: `https://www.viniccius.com.br`. O domínio sem `www` redireciona para esse endereço. Um `403 INVALID_ORIGIN` em `/api/auth/sign-in/email` indica que essa origem não está autorizada na branch de Auth usada pelo deploy. Depois de alterar variáveis na Vercel, faça um novo deploy; variáveis novas não entram em deploys existentes.

## Autenticação e storage

O portfólio em `/` e os posts publicados em `/blog` são públicos. `/login` e `/api/auth/*` são acessíveis para permitir a entrada; todas as páginas em `/dashboard/*` exigem uma sessão válida do Neon Auth. Configure as variáveis de `.env.example` no ambiente de execução. Enquanto `neon_auth.user` estiver vazia, `/login` apresenta o formulário de criação da primeira conta. Depois disso, apresenta o login e a rota de cadastro por e-mail recusa novos registros.

`DATABASE_URL` é uma credencial exclusiva do servidor. Nunca use `NEXT_PUBLIC_` no nome dessa variável. `JWKS_URL` pode ser mantida para integrações futuras, mas a autenticação atual usa `NEON_AUTH_BASE_URL` ou `AUTH_NEON_URL` e não lê a JWKS diretamente.

O bucket do Neon Object Storage é `workplace`, configurado em `NEON_STORAGE_BUCKET`. Upload, leitura por URL assinada e exclusão foram verificados com um objeto temporário. Execute `bun run test:storage` para repetir o teste. Capas e anexos são enviados ao bucket por rotas autenticadas.

Os dados do painel usam Drizzle ORM e Postgres no Neon. Cada funcionalidade possui uma tabela com uma linha por registro: `app_clients`, `app_employees`, `app_vehicles`, `app_reservations`, `app_trips`, `app_boards`, `app_notes` e `app_note_attachments`. `app_migration_state` marca a importação inicial para que registros excluídos não voltem do IndexedDB. Ao abrir cada funcionalidade pela primeira vez após a atualização, os registros antigos daquele navegador são importados para a conta autenticada. O IndexedDB antigo é preservado como cópia local, mas novas alterações são gravadas no Postgres. Execute `bun run db:generate` após mudanças no esquema e `bun run db:migrate` para aplicar migrações.

## Notes

Notes fica no grupo Workspace do menu. No celular, o menu abre pela esquerda, sobre a página, e fecha ao escolher um link, tocar fora ou pressionar Esc.

O dashboard inclui Anotações em `/dashboard/notes`, com catálogo pesquisável, criação, edição e exclusão. O editor oferece comandos `/`, formatação contextual, tarefas, tabelas, blocos lado a lado e incorporações por URL. O título aceita Enter para focar o corpo.

Documentos são salvos automaticamente no Postgres, com um pequeno rascunho de recuperação em localStorage para os últimos caracteres antes de recarregar. Capas e anexos de até 20 MB ficam no Neon Object Storage; imagens podem ser coladas com Ctrl+V. Exportação em Markdown e JSON inclui os arquivos; PDF usa impressão A4 com margens de 25,4 mm.

As notas exigem uma sessão e conexão com o servidor. Widgets externos continuam dependendo da conexão e das permissões do site incorporado.

### Validar as anotações

Execute `bun run build` e depois `bun run test:notes`. O teste abre um perfil temporário do Microsoft Edge e verifica criação, edição, tabelas, anexos, reload, recuperação de rascunho, exportação, responsividade e exclusão. Para usar outro navegador Chromium, defina `VINISZOFX_TEST_BROWSER` com o caminho do executável. O perfil de teste é removido ao finalizar.

## Navegação e aparência do painel

O menu lateral organiza as áreas em Visão geral, Pessoas, Operações, Workspace e Configurações. O header reúne o controle do menu, a busca global por Notes, boards, listas, cards e páginas e o menu do usuário com atalhos para Workspace, Perfil, configurações do Workplace, página inicial e saída da sessão.

Em `/dashboard/settings/profile`, o usuário pode alterar o nome e a senha pelo Neon Auth. O e-mail é exibido apenas para consulta. Em `/dashboard/settings/workplace`, pode definir nome e descrição da área de trabalho, salvos na tabela `app_workplace_settings`, e escolher o tema. O nome e a descrição aparecem em `/dashboard/workspace`.

## Blog

O blog público está em `/blog`. A gestão de posts fica em `/dashboard/blog`: criação, edição, rascunhos, publicação, retorno a rascunho e exclusão. Apenas posts publicados e seus arquivos podem ser acessados por visitantes. O editor de posts reutiliza o editor de Notes, com formatação, blocos, tabelas, links, imagens, anexos, capa e colagem de imagens.

Os posts e metadados dos arquivos ficam nas tabelas `app_blog_posts` e `app_blog_assets`. Os arquivos são enviados para o bucket **`post`** do Neon Object Storage, configurável por `NEON_POST_BUCKET` (padrão `post`), separado do bucket `workplace`. A API entrega os arquivos de posts publicados publicamente e exige sessão do autor para rascunhos. O limite é de 20 MB por arquivo.

No rodapé do menu lateral, o botão de monitor oferece **Light**, **Dark** e **System**. A preferência é salva no navegador; System acompanha mudanças do tema do dispositivo. O menu e a busca também funcionam no celular.

## Boards

Boards fica abaixo de Notes no grupo Workspace. Crie, renomeie e exclua quadros; adicione listas e cards com título, descrição, cor e conclusão. Arraste listas e cards para reorganizar, inclusive entre listas. Os botões de direção permitem reorganizar os cards dentro da lista; a movimentação entre listas é feita por arraste. Exclusões pedem confirmação.

Os dados ficam na tabela `app_boards`. A interface atualiza imediatamente e uma fila grava as alterações em sequência. Erros de armazenamento exibem uma opção de tentar novamente.

Novos Boards começam com **Stage**, **Progress** e **Done**. A paleta de cores fica entre o lápis e a lixeira em quadros, listas e cards. Cards aceitam anexos de até 20 MB por arquivo, imagens coladas com Ctrl+V, prévia e download. Os arquivos são armazenados no bucket `workplace` e removidos ao excluir o conteúdo correspondente. O dialog exibe três anexos e oferece Mostrar todos.

A cor do Board preenche o fundo inteiro em um tom suave, adaptado ao tema. O seletor também oferece **Cover** para escolher uma imagem de fundo de até 20 MB e remover a capa. O catálogo exibe a imagem de capa na miniatura, quando definida, e mantém a cor suave no restante do cartão.

Cards também podem ter capa: envie pelo botão Cover no seletor de cor ou marque uma imagem anexada como capa no dialog. A imagem aparece no card e no dialog e pode ser removida sem excluir o anexo.

Boards e Notes usam cantos retos e listagens com uma coluna no celular, duas a partir de 640 px e três a partir de 1024 px.

## Listagens e busca global

Notes e Boards compartilham os componentes de catálogo: mesmo cabeçalho, busca local, miniaturas, ações, estados de carregamento, botão de criação e grid responsivo. A busca do header é global e abre resultados agrupados para Notes, Boards, listas, cards e páginas. Ela consulta título e conteúdo das notas, títulos das listas e boards, títulos/descrições e nomes dos anexos dos cards. Acentos e maiúsculas não alteram a busca. Cada resultado abre o registro correspondente; notas abrem o editor e cards abrem o dialog. Tudo é pesquisado localmente.

Na capa das Notes, o botão de paleta agrupa Trocar capa, Reposicionar/Concluir ajuste e Remover capa.

Capas de boards e cards oferecem **Reposicionar** no seletor de cor. A prévia aceita arraste e controles horizontal/vertical. Concluir ajuste salva a posição, que também aparece nas miniaturas e permanece ao recarregar. No dialog do card, Reposicionar capa ajusta o rascunho até Salvar.

O dialog de cards segue a divisão do Nodus: descrição e título à esquerda, anexos à direita no desktop e abaixo no celular. A descrição reutiliza o editor de Notes, com blocos, comandos /, tarefas, tabelas e formatação preservada no documento estruturado. Imagens coladas e arquivos inseridos pelo editor ficam nos anexos do card, com referências locais persistentes.

## Portfólio público

A index (`/`) apresenta Vinicius Souza, sua formação, tecnologias, projetos e contato, com links para GitHub e LinkedIn. Os dados foram conferidos no perfil público e nos READMEs dos repositórios em 08/10/2026 e ficam em `lib/portfolio/content.ts`; a página não depende da API do GitHub para renderizar. Os projetos são Workspace, Areco, Ticket Management e E-ticket. As miniaturas são ilustrações da interface, não capturas dos aplicativos.

A apresentação é responsiva e acompanha o tema do site. O header mantém Login e adiciona atalhos para Sobre, Projetos e Contato.

## Clients

Clients é uma seção do menu principal, fora de Workspace, em `/dashboard/clients`. O cadastro oferece nome obrigatório e empresa, e-mail, telefone, endereço e observações opcionais. A listagem usa o mesmo catálogo responsivo de Notes e Boards, com criação e edição em diálogo, busca por dados do cliente e exclusão com confirmação.

Os registros são salvos na tabela `app_clients`, com fila de gravação, datas de criação/atualização e atualização entre abas. A busca global inclui clientes e abre diretamente o cadastro selecionado.

Validação: `bun run build` e `bun run test:clients` verificam cadastro, validação, edição, busca global, datas, persistência, responsividade e exclusão no navegador.

## Tema visual

O tema segue o preset shadcn `b1xTtTQQVu`: Sera, base Stone, acento Cyan, gráficos Blue, fontes Oxanium e Raleway, ícones Remix Icon e menus `default-translucent` com realce `subtle`. Botões e superfícies Sera usam cantos retos; avatares mantêm seu formato próprio. Os componentes compartilhados mantêm os ajustes de responsividade, limites de altura e acessibilidade necessários ao dashboard. As superfícies de menus/popovers são centralizadas em `components/ui/menu-styles.ts`.

## Feedback e confirmação

O dashboard utiliza toasts Base UI para criação, edição, exclusão e erros de armazenamento ou upload. A confirmação de sucesso só aparece após a gravação no servidor; salvamento automático e movimentação por arraste não geram notificações repetitivas. Os avisos são acessíveis, dispensáveis e seguem o tema Sera.

Exclusões de clientes, boards, listas, cards, notas e anexos pedem confirmação. O diálogo compartilhado bloqueia cliques repetidos durante uma ação assíncrona e mantém os erros visíveis. Anexos do card só são removidos definitivamente ao salvar o card.

Na criação e edição dos Boards, informe uma descrição e escolha um cliente opcional de Clients. O vínculo e a descrição aparecem no catálogo e no cabeçalho do board, participam da busca e ficam salvos no Postgres. A remoção de um cliente preserva o board e sinaliza o vínculo como Cliente removido até escolher outro ou Sem cliente.

Boards possuem status **Draft**, **Started**, **Paused**, **Pending**, **Completed** e **Cancelled**, selecionado no painel direito do diálogo e exibido no catálogo e no cabeçalho. Novos boards e registros antigos sem status usam Draft; o status pode ser alterado na edição.

Trip fica abaixo de Clients no menu principal. New trip permite cadastrar descrição, cliente opcional e transporte (Car, Motorcycle, Bus, Plane ou Ship). Viagens podem ser editadas, excluídas com confirmação e encontradas pela busca global. Os registros ficam na tabela `app_trips`.

Fleet fica abaixo de Trip no menu principal. Permite cadastrar, editar e excluir veículos com identificação, placa, marca, modelo, ano, tipo e observações. Inclui pesquisa, confirmação de exclusão e datas no rodapé. Os registros ficam na tabela `app_vehicles`.

Em Fleet, a coluna direita inclui RENAVAM e chassi opcionais, com ajuda sobre onde encontrar os códigos, e anexos antes das observações. Os arquivos (até 20 MB cada) ficam no bucket `workplace` e podem ser abertos, baixados ou removidos ao salvar o veículo.

A identificação em Fleet é gerada automaticamente por tipo, marca, modelo e cor. A seleção de cor oferece opções padrão e Nova cor; cores personalizadas de veículos salvos ficam disponíveis nos próximos cadastros.

Marca e modelo em Fleet usam seleções com opções iniciais e botão Novo. Modelos são filtrados pela marca; opções personalizadas são reutilizadas a partir dos veículos salvos. Ao trocar a marca, a seleção de modelo é limpa.

Ano em Fleet é uma seleção e também integra a identificação automática (tipo · marca · modelo · cor · ano).

Cada veículo possui um código curto de 8 caracteres derivado do UUID, exibido na listagem e no diálogo. O código é mantido na edição e pode ser pesquisado. Novos cadastros verificam duplicidade do código entre os registros carregados antes de salvar.

Trip permite vincular um veículo de Fleet, selecionando pela identificação, placa e código. O vínculo é salvo na viagem e aparece na listagem e na busca. Veículos removidos são sinalizados e a viagem permanece preservada.

Trip inclui KM inicial/final, informações e local da viagem. O check Precisa de hospedagem? libera nome, telefone, endereço e diária em reais. KM final não pode ser menor que o inicial; todos esses campos são opcionais.

New trip usa diálogo simplificado com cliente, board, transporte, veículo e descrição opcional. Clicar na viagem abre /dashboard/trip/[tripId] ao lado do aside; nessa página ficam também quilometragem, local, informações e hospedagem. Salvar na página mantém a viagem aberta.

Informações da viagem é uma seção com cidade, estado/UF, rua, número, complemento, bairro, CEP e datas de ida/retorno. O retorno não pode anteceder a ida. O campo livre Informações foi removido da interface.

Reservations fica abaixo de Trip no menu. Armazena nome do hotel, telefone, endereço, diária, datas de entrada/saída e observações, com total calculado pelas noites. Inclui CRUD, confirmação de exclusão e busca global. Os registros ficam na tabela `app_reservations`.

## Employees

Employees fica acima de Trip no menu principal. Permite cadastrar, consultar, editar e excluir empregados com nome obrigatório, departamento, cargo, e-mail, telefone, endereço e observações opcionais. Usa catálogo responsivo, diálogo em duas colunas, confirmação de exclusão, toasts e datas de criação/atualização. Os registros ficam na tabela `app_employees` e participam da busca global.

Employees inclui código curto de 8 caracteres derivado do UUID, preservado nas edições, endereço separado por CEP, rua, número, complemento, bairro, cidade e UF, consulta ViaCEP e anexos de até 20 MB acima das observações. O rodapé apresenta as datas de criação/atualização com horário.

Trip permite selecionar vários colaboradores de Employees, buscar por nome/cargo/código e manter os vínculos na criação e edição com autosave na página. Os participantes aparecem no catálogo e na busca global; empregados removidos são sinalizados sem excluir a viagem.
