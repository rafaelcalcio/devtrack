# Instruções para agentes de IA (Kilo)

Este arquivo orienta agentes de IA que trabalham no repositório DevTrack.

## Visão geral do projeto

DevTrack é um painel de produtividade local para desenvolvedores: projetos, tarefas, estudos e metas.

- **Frontend:** `client/` — React 19 + TypeScript + Vite + React Router + Lucide React + CSS puro.
- **Backend:** `server/` — Node.js + Express 5 + TypeScript + SQLite (`better-sqlite3`) + Zod.
- **Testes:** Vitest (servidor com supertest; interface com testing library).
- **Qualidade:** ESLint (flat config) + `tsc --noEmit`.
- **Infra:** npm workspaces na raiz + GitHub Actions (CI).

## Comandos importantes (executar na raiz `devtrack/`)

| Comando | Propósito |
| ------- | --------- |
| `npm run typecheck` | Verifica tipos nos dois pacotes |
| `npm run lint` | Executa ESLint nos dois pacotes |
| `npm test` | Roda testes do servidor e do cliente |
| `npm run build` | Compila a API e gera o bundle do cliente |
| `npm run dev` | Sobe API (3333) e interface (5173) juntas |
| `npm run seed` | Insere dados de demonstração (idempotente) |

## Convenções de código

- TypeScript estrito (`strict: true`, `noUncheckedIndexedAccess: true`).
- Imports com extensão `.js` (ESM/NodeNext no servidor; `verbatimModuleSyntax` no cliente).
- Nomes de arquivos e pastas em português para rotas/UI (ex.: `/projetos`, `/tarefas`, `Configs`).
- Mensagens de erro e labels da interface em português (pt-BR).
- Sem comentários no código, a menos que solicitado.
- ESLint proíbe `any` e variáveis não usadas.

## Áreas principais do servidor

- `server/src/routes/*.ts` — rotas REST por recurso (`/api/projects`, `/api/tasks`, `/api/study/...`, `/api/goals`, `/api/dashboard`, `/api/calendar`, `/api/health`).
- `server/src/services/*.ts` — regras de negócio e consultas SQL parametrizadas.
- `server/src/validations/schemas.ts` — schemas Zod de entrada.
- `server/src/db/schema.ts` — schema SQLite (migração em `CREATE TABLE IF NOT EXISTS`).
- `server/src/middleware/error-handler.ts` — tratamento centralizado de erros (ApiError, ZodError, constraint do SQLite).
- `server/src/tests/*.test.ts` — testes de integração com banco em memória (`:memory:`).

## Áreas principais do cliente

- `client/src/App.tsx` — rotas da interface (React Router).
- `client/src/pages/*.tsx` — uma página por área (Dashboard, Projetos, Tarefas, Kanban, Estudos, Metas, Calendário, Configurações, NotFound).
- `client/src/services/*.ts` — cliente HTTP (`apiRequest`) e APIs tipadas por recurso.
- `client/src/components/ui/*.tsx` — componentes reutilizáveis (Button, Card, Modal, Badge, ProgressBar, StatCard, States, Form, ConfirmDialog).
- `client/src/hooks/*.ts` — `useAsync`, `useDebounced`, `useLocalStorage`, `useTheme`, `useToast`.
- `client/src/types/index.ts` — tipos compartilhados (mesmos nomes do servidor).

## Antes de finalizar uma tarefa

1. Confirme que `npm run typecheck`, `npm run lint` e `npm test` passam (se Node.js estiver disponível no ambiente).
2. Não commite `.env`, `server/data/devtrack.db*`, `dist/`, `node_modules/` ou `coverage/`.
3. Novas rotas ou endpoints devem ter testes correspondentes em `server/tests/`.
4. Novas páginas ou componentes de interface devem ter testes em `client/src/`.
5. Atualize o `README.md` se adicionar funcionalidade visível ao usuário ou alterar scripts.

## Observações

- Node.js não está instalado neste ambiente de execução, então comandos `npm` não podem ser rodados aqui; verifique apenas a consistência do código.
- O banco de dados é um único arquivo SQLite (`server/data/devtrack.db`), ignorado pelo git.
- Para publicar no GitHub: aponte o remote e faça push da branch `main`; o CI roda automaticamente.
