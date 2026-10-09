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
