# Como a aplicação funciona

Site público, blog e painel de trabalho de organizações num só app **Next.js 16** (App Router), com React 19, Tailwind CSS 4, Drizzle ORM e Postgres.

| Área | Rota | Acesso |
| --- | --- | --- |
| Site e portfólio, com o assistente de contato que gera leads | `/` | público |
| Blog | `/blog` | público (só posts publicados) |
| Login, recuperação de senha, onboarding | `/login`, `/reset-password`, `/onboarding` | público |
| Painel | `/dashboard/*` | exige sessão |
| Arquivos compartilhados por link | `/s/...`, `/arquivo/...` | quem tem o link |

Mais detalhes:

- [Módulos do painel](modulos.md): mapa do menu, rotas, coleções e como criar um cadastro novo.
- [Drive](drive.md): pastas, compartilhamento e os editores de DOCX, XLSX e PDF.

## Arquitetura

```
app/            rotas (páginas e /api)
components/     interface, um diretório por módulo; components/ui são as peças compartilhadas
lib/            regras, acesso a dados, storage, autenticação
lib/db/schema/  esquema Drizzle (app.ts e auth.ts)
drizzle/        migrations geradas
scripts/        migração no build, buckets e testes de navegador
```

- **Dados.** Cada coleção do painel é uma tabela no Postgres, com uma linha por registro, servida por `/api/data/[kind]`. Os dados pertencem à organização da conta. A interface atualiza na hora e uma fila grava as alterações em sequência; se a gravação falhar, aparece a opção de tentar de novo.
- **Arquivos.** Ficam num storage compatível com S3: bucket `workplace` (anexos, capas, Drive) e bucket `post` (imagens do blog). Envio, leitura e exclusão passam por rotas autenticadas, e a leitura usa URLs assinadas.
- **Módulos.** Cada função do painel pode ser ligada ou desligada em Sistema › Módulos.
- **Busca global.** O cabeçalho do painel pesquisa notas, quadros, cadastros e páginas, ignorando acentos e maiúsculas.

## Autenticação

- **Desenvolvimento:** Better Auth local (`AUTH_MODE`, `AUTH_BASE_URL`, `AUTH_SECRET`).
- **Produção:** Neon Auth. O código usa `NEON_AUTH_BASE_URL` e, se ela não existir, `AUTH_NEON_URL`.

Enquanto não existe nenhuma conta, `/login` oferece **Criar conta e organização**, que leva ao onboarding (conta, empresa e endereço). Depois disso só há login, e as pessoas novas são adicionadas pela administração, a menos que `ALLOW_SIGNUP=true`.

`DATABASE_URL` é só do servidor. Nunca use o prefixo `NEXT_PUBLIC_` nela.

## Aparência

A identidade visual completa (cores, tipografia, grafismos, fotos, tom de voz e impressos) está em [brand/README.md](brand/README.md), com os valores em [brand/tokens.json](brand/tokens.json).

- Paleta grafite e cobre, com variáveis em `app/globals.css`: fundo ardósia frio, cobre como destaque (ação principal, seleção e foco) e branco-mármore no tema claro.
- Superfícies de vidro reutilizáveis: `glass-bar`, `glass-card`, `glass-float` e `glass-surface`.
- Fontes Oxanium (texto) e Raleway (títulos). Ícones Remix Icon.
- O tema pode ser **Claro**, **Escuro** ou **Sistema**. A escolha fica salva num cookie, então a página já abre no tema certo.

## Blog e publicidade

Os posts são gerenciados em `/dashboard/blog`: rascunho, publicação, volta a rascunho e exclusão. O editor é o mesmo das Notas e inclui SEO (título, descrição e opção de tirar o post do índice).

Em **Painel › Publicidade** dá para cadastrar uma campanha para cada posição (após a capa, no meio ou ao final do texto). Uma campanha só aparece quando está ativa e a posição está habilitada no post.

`SITE_URL` define a origem pública usada nas URLs canônicas, nos metadados sociais, em `robots.txt` e em `sitemap.xml`. Na Vercel, se ela não estiver definida, vale `VERCEL_PROJECT_PRODUCTION_URL`.

## Desenvolvimento

A infra roda no Docker (Postgres e RustFS) e o app roda na máquina, com hot reload:

```bash
cp .env.example .env   # uma vez
bun install
bun run infra:up       # sobe Postgres e RustFS, cria os buckets e aplica as migrations
bun run dev
```

- App: <http://localhost:3000>
- Postgres: `localhost:5432` (usuário `postgres`, senha `postgres`, banco `my_database`)
- Console do RustFS: <http://localhost:9001> (usuário `admin`, senha `password123`)

**Migrations.** Depois de alterar `lib/db/schema/app.ts`, rode `bun run db:generate` e depois `bun run db:migrate`. Não escreva migrations à mão: sem o snapshot, o próximo `db:generate` cria as tabelas de novo.

**Verificações:**

```bash
bun run lint
bunx tsc --noEmit
bun run build && bun run test:notes   # também há test:boards, test:clients e test:storage
```

Os testes de navegador abrem um perfil temporário do Microsoft Edge. Para usar outro navegador Chromium, defina `VINISZOFX_TEST_BROWSER` com o caminho do executável.

## Produção

Em produção o app usa Neon para o banco, o Auth e o Object Storage.

- **Vercel:** recebe as variáveis pela integração do Neon. Defina também `DATABASE_URL`, `NEON_AUTH_COOKIE_SECRET` (32 caracteres ou mais), as variáveis de storage e `SITE_URL`. Variáveis novas só valem a partir do próximo deploy.
- **Docker:** `cp .env.production.example .env.production` e depois `bun run prod:up`. A imagem é compilada, as migrations são aplicadas no Neon e só então o app sobe.
- **Domínio do Auth:** em Neon Console › branch › Auth › Configuration › Domains, adicione a origem exata do site, com protocolo e sem barra final. Se a origem não estiver cadastrada, o login falha com `403 INVALID_ORIGIN`.
