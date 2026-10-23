# Lance do Pix

Uma experiência mobile-first de disputa por lances, baseada no protótipo fornecido.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/lance-do-pix/public/prototype.html` — protótipo original, referência de interface e demonstração interativa
- `artifacts/lance-do-pix/src/App.tsx` — moldura da aplicação
- `artifacts/lance-do-pix/src/index.css` — estilos da moldura

## Architecture decisions

- A demonstração visual usa o HTML original diretamente para não divergir da composição e dos comportamentos de referência.
- O saldo e os lances são demonstrativos; não há processamento de pagamento nem sincronização entre usuários.

## Product

O protótipo permite explorar disputas, lances, cronômetro, histórico, saldo demonstrativo e temas claro/escuro.

## User preferences

- Tratar o protótipo anexado como fonte da verdade visual e de comportamento. Manter sua hierarquia, proporções, cores, espaçamentos e composição; não inventar uma nova direção visual sem pedido explícito.
- Manter o layout original no celular; em telas desktop, pode adaptar para duas colunas, preservando os tokens e a linguagem visual do protótipo.
- Manter o cabeçalho fixo no topo durante a rolagem.

## Gotchas

- O fluxo do protótipo está isolado em `public/prototype.html`; mudanças visuais e de interação da referência devem ser feitas nessa página.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
