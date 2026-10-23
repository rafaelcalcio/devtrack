# DevTrack

Painel de produtividade para desenvolvedores: **projetos, tarefas, estudos e metas** em um só lugar, com
dashboard, quadro Kanban, calendário e histórico de sessões de estudo.

O DevTrack é uma aplicação **local, de usuário único, sem autenticação**. Todos os dados ficam
persistidos em um banco **SQLite** na sua própria máquina.

![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6) ![Vite](https://img.shields.io/badge/Vite-8-646cff) ![Express](https://img.shields.io/badge/Express-5-000000) ![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-e38c00) ![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-10b981)

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Executando o projeto](#executando-o-projeto)
- [Implantação com Docker](#implantação-com-docker)
- [Dados de demonstração](#dados-de-demonstração)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts npm](#scripts-npm)
- [Estrutura de pastas](#estrutura-de-pastas)
- [API REST](#api-rest)
- [Testes](#testes)
- [Lint e verificação de tipos](#lint-e-verificação-de-tipos)
- [Capturas de tela](#capturas-de-tela)
- [Demonstração online](#demonstracao-online)
- [Contribuindo](#contribuindo)
- [Limitações conhecidas](#limitações-conhecidas)
- [Licença](#licença)

---

## Funcionalidades

### Dashboard

- Total de projetos, de tarefas pendentes, concluídas e **atrasadas**.
- **Progresso geral** dos projetos, calculado a partir das tarefas concluídas.
- Atividades recentes (criação/conclusão de projetos, tarefas, metas e sessões de estudo).
- Metas próximas do prazo e tarefas com vencimento em destaque.
- Gráficos de produtividade (tarefas concluídas por dia) e de distribuição de tarefas por status,
  exibidos apenas quando há dados suficientes.

### Projetos

- Cadastro com nome, descrição, categoria, status, prioridade, cor, data de início e prazo.
- Visualização em cartões com **progresso calculado pelas tarefas concluídas**.
- Filtros por status e prioridade, além de busca pelo nome.
- Página de detalhes com as tarefas do projeto, edição e exclusão.

### Tarefas

- Cadastro com título, descrição, categoria, prioridade, prazo e projeto vinculado.
- Filtros por status, prioridade e projeto, busca pelo título e opção "somente atrasadas".
- Identificação automática de tarefas com prazo vencido.
- **Quadro Kanban** com arrastar e soltar (e botões de movimento para navegação por teclado).
  Cada mudança de coluna é persistida no banco de dados.

### Estudos

- Cadastro de assuntos e tecnologias, com cor de identificação.
- Registro de sessões de estudo com data, duração em minutos e anotações.
- Edição de sessões já registradas (assunto, data, duração e anotações).
- Tempo total estudado, média por sessão e gráfico de minutos por dia.
- Histórico filtrável por assunto e por período de datas.

### Metas

- Metas pessoais ou profissionais, com título, descrição, prazo, progresso e status.
- Registro automático de conclusão (data e hora) ao marcar a meta como concluída.
- Filtros por status, âmbito e busca por título.

### Calendário

- Visão mensal com prazos de tarefas, datas de início/fim de projetos e metas próximas.
- Navegação entre meses e detalhe do item ao clicar.

### Interface

- Menu lateral responsivo, cabeçalho com título e ações, layout consistente.
- Tema claro/escuro (persistido no `localStorage`) e densidade compacta/confortável.
- Formulários com rótulos claros, validação de campos obrigatórios, estados de carregamento,
  mensagens de sucesso/erro, confirmação antes de excluir e estados vazios com instruções.
- Ícones consistentes ([Lucide](https://lucide.dev)), navegação por teclado e foco visível.

---

## Tecnologias

| Camada    | Tecnologias                                                                 |
| --------- | --------------------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, React Router, Lucide React, CSS puro com tokens   |
| Backend   | Node.js, Express 5, Zod (validação), CORS, dotenv                           |
| Banco     | SQLite com `better-sqlite3` (consultas parametrizadas e chaves estrangeiras)  |
| Testes    | Vitest, Supertest (API), Testing Library (interface)                        |
| Qualidade | ESLint 10 (flat config) e `tsc --noEmit` para verificação de tipos          |
| Infra     | npm workspaces, GitHub Actions                                               |

Sem frameworks de UI, bibliotecas de gráficos ou gerenciadores de estado: os gráficos são SVG
próprios e o CSS é organizado em tokens, base, layout, componentes e páginas.

---

## Pré-requisitos

- **Node.js 22 ou superior** (recomendado: 22 LTS ou 24 LTS).
- **npm 10 ou superior** (o projeto usa *npm workspaces*).
- Git (opcional, apenas para clonar o repositório).

Não é necessário ter Python, Visual Studio Build Tools ou qualquer compilador C++: o
`better-sqlite3` e o `esbuild` são usados a partir dos binários pré-compilados que já vêm nos
próprios pacotes.

Verifique a instalação:

```bash
node --version
npm --version
```

---

## Instalação

```bash
git clone <url-do-repositorio>
cd devtrack
npm install
```

O `npm install` instala as dependências dos dois pacotes (`client` e `server`) de uma vez, usando
npm workspaces.

> **Nota:** o arquivo `.npmrc` da raiz define `ignore-scripts=true`. Isso dispensa a compilação
> nativa (que exigiria Python e Visual Studio Build Tools) e funciona em qualquer versão do npm,
> inclusive nas que bloqueiam scripts de instalação por padrão. Se preferir revisar e aprovar os
> scripts manualmente, remova essa linha e use `npm install-scripts approve better-sqlite3 esbuild`
> nas versões mais recentes do npm.

---

## Executando o projeto

### Desenvolvimento (API + interface)

Na raiz do repositório:

```bash
npm run dev
```

Isso sobe:

- **API** em `http://localhost:3333` (com recarga automática)
- **Interface** em `http://localhost:5173`

O Vite encaminha as chamadas de `/api` para a API, então não é necessário configurar nada.

Para rodar separadamente:

```bash
npm run dev:server   # apenas a API
npm run dev:client   # apenas a interface
```

### Build de produção

```bash
npm run build
```

O build gera `server/dist` (API compilada) e `client/dist` (interface otimizada).

### Executar a versão de produção

```bash
npm start
```

A API sobe em `http://localhost:3333` e **serve também a interface já compilada** em
`http://localhost:3333` — basta abrir essa URL no navegador.

---

## Implantação com Docker

O projeto inclui um `Dockerfile` multi-estágio que compila a interface e a API, e uma imagem
final que executa apenas a API servindo a interface já compilada.

### Construir e rodar

```bash
docker compose up --build
```

A API ficará disponível em `http://localhost:3333` (mesma porta da interface).

### Persistência de dados

O banco SQLite é armazenado no volume `devtrack_data`, montado em `/app/server/data`, para que
os dados não sejam perdidos quando o container for recriado.

### Variáveis de ambiente

Copie os exemplos e ajuste antes de subir:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

As variáveis `server/.env` são lidas pela API. No `docker-compose.yml`, valores padrão já estão
definidos para porta, caminho do banco, CORS e seed de demonstração.

---

## Dados de demonstração

Para preencher a aplicação com dados de exemplo (4 projetos, 12 tarefas, 4 assuntos de estudo,
8 sessões, 5 metas e atividades):

```bash
npm run seed
```

A inserção é **idempotente**: se o banco já contiver projetos, nada é duplicado e o comando apenas
avisa que os dados já existem.

Para limpar e começar do zero, apague o arquivo do banco e rode o seed novamente:

```bash
rm server/data/devtrack.db        # Linux/macOS
del server\data\devtrack.db       # Windows
npm run seed
```

Também é possível popular o banco automaticamente ao iniciar a API com `SEED_DEMO_DATA=true`
(veja a seção de variáveis de ambiente).

---

## Variáveis de ambiente

Copie os arquivos de exemplo e ajuste conforme necessário:

```bash
cp server/.env.example server/.env     # Linux/macOS
copy server\.env.example server\.env  # Windows

cp client/.env.example client/.env
copy client\.env.example client\.env  # Windows
```

**`server/.env`**

| Variável       | Padrão                 | Descrição                                                    |
| -------------- | ---------------------- | ------------------------------------------------------------ |
| `PORT`         | `3333`                 | Porta da API                                                  |
| `DATABASE_PATH`| `data/devtrack.db`     | Caminho do arquivo SQLite (relativo à pasta `server`)        |
| `CORS_ORIGIN`  | `http://localhost:5173`| Origens permitidas, separadas por vírgula                    |
| `SEED_DEMO_DATA`| `false`                | Insere dados de demonstração ao iniciar a API                |

**`client/.env`**

| Variável                  | Padrão      | Descrição                                                        |
| ------------------------- | ----------- | ---------------------------------------------------------------- |
| `VITE_API_URL`            | `/api`      | URL base da API usada pelo frontend                               |
| `VITE_API_PROXY_TARGET`   | `http://localhost:3333` | Destino do proxy `/api` durante o desenvolvimento           |

---

## Scripts npm

Todos os comandos são executados a partir da raiz do repositório.

| Comando                | O que faz                                                     |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Sobe API e interface juntas, com recarga automática             |
| `npm run dev:server`    | Sobe apenas a API                                              |
| `npm run dev:client`    | Sobe apenas a interface                                        |
| `npm run build`         | Compila a API e gera o bundle de produção da interface         |
| `npm start`             | Executa a API compilada servindo a interface buildada          |
| `npm run seed`          | Insere os dados de demonstração                                |
| `npm test`              | Roda os testes do servidor e do cliente                         |
| `npm run test:server`   | Roda apenas os testes da API                                   |
| `npm run test:client`   | Roda apenas os testes da interface                              |
| `npm run lint`          | Executa o ESLint nos dois pacotes                              |
| `npm run typecheck`     | Verifica os tipos com `tsc` nos dois pacotes                   |

---

## Estrutura de pastas

```
devtrack/
├── client/                       # Interface (React + Vite)
│   ├── public/                   # Ícones estáticos (favicon)
│   └── src/
│       ├── components/
│       │   ├── charts/           # Gráficos em SVG (barras e rosca)
│       │   ├── forms/            # Formulários de projetos, tarefas, metas e estudos
│       │   ├── layout/           # Casca da aplicação (sidebar, header)
│       │   └── ui/               # Componentes reutilizáveis (botão, modal, badges...)
│       ├── config/               # Metadados de navegação
│       ├── context/              # Contextos de tema e de notificações
│       ├── hooks/                # useAsync, useDebounced, useLocalStorage, useTheme...
│       ├── pages/                # Uma página por área do produto
│       ├── services/             # Cliente HTTP e APIs tipadas
│       ├── styles/               # Tokens, base, layout, componentes e páginas
│       ├── test/                 # Configuração dos testes de interface
│       ├── types/                # Tipos compartilhados com a API
│       └── utils/                # Formatação de datas, números e valores de formulário
├── server/                       # API REST (Express + SQLite)
│   ├── src/
│   │   ├── config/               # Leitura das variáveis de ambiente
│   │   ├── db/                   # Conexão, schema, seed e CLI de seed
│   │   ├── lib/                  # Erros, validação, mapeadores e datas
│   │   ├── middleware/           # Tratamento central de erros
│   │   ├── routes/               # Rotas REST por recurso
│   │   ├── services/             # Regras de negócio e consultas SQL
│   │   ├── validations/          # Schemas Zod de entrada
│   │   ├── app.ts                # Factory da aplicação Express
│   │   └── index.ts              # Ponto de entrada do servidor
│   └── tests/                    # Testes de integração da API (Supertest)
├── docs/                         # Documentação e capturas de tela
│   └── screenshots/              # Capturas da interface (opcional)
├── .github/workflows/ci.yml      # Lint, tipos, testes e build automáticos
├── .npmrc                        # Instalação sem compilação nativa
├── AGENTS.md                     # Instruções para agentes de IA
├── CONTRIBUTING.md               # Diretrizes de contribuição
├── Dockerfile                    # Imagem de produção (multi-estágio)
├── docker-compose.yml            # Orquestração local com Docker
├── LICENSE                       # Licença MIT
├── package.json                  # Workspaces e scripts da raiz
├── README.md
└── SECURITY.md                   # Política de segurança
```

---

## API REST

Base: `http://localhost:3333/api`

| Método | Rota                            | Descrição                                             |
| ------ | ------------------------------- | ----------------------------------------------------- |
| GET    | `/health`                       | Verificação de saúde da API                            |
| GET    | `/dashboard`                    | Indicadores, gráficos e atividades do dashboard        |
| GET    | `/calendar?month=AAAA-MM`       | Itens do calendário do mês                             |
| GET    | `/projects`                     | Lista projetos (filtros: `status`, `priority`, `search`) |
| POST   | `/projects`                     | Cria um projeto                                        |
| GET    | `/projects/:id`                 | Detalha um projeto (inclui tarefas e progresso)        |
| PATCH  | `/projects/:id`                 | Atualiza um projeto                                    |
| DELETE | `/projects/:id`                 | Exclui o projeto e as tarefas vinculadas                |
| GET    | `/tasks`                        | Lista tarefas (filtros: `status`, `priority`, `projectId`, `search`, `overdue`) |
| POST   | `/tasks`                        | Cria uma tarefa                                        |
| GET    | `/tasks/:id`                    | Detalha uma tarefa                                     |
| PATCH  | `/tasks/:id`                    | Atualiza uma tarefa                                    |
| PATCH  | `/tasks/:id/status`             | Altera o status (usado pelo Kanban)                    |
| DELETE | `/tasks/:id`                    | Exclui uma tarefa                                      |
| GET    | `/study/subjects`               | Lista assuntos de estudo com o tempo total             |
| POST   | `/study/subjects`               | Cadastra um assunto                                    |
| GET    | `/study/subjects/:id`           | Detalha um assunto                                     |
| PATCH  | `/study/subjects/:id`           | Atualiza um assunto                                    |
| DELETE | `/study/subjects/:id`           | Exclui um assunto e suas sessões                        |
| GET    | `/study/sessions`               | Histórico de sessões (filtros: `subjectId`, `from`, `to`) |
| POST   | `/study/sessions`               | Registra uma sessão                                    |
| GET    | `/study/sessions/:id`           | Detalha uma sessão                                     |
| PATCH  | `/study/sessions/:id`           | Atualiza uma sessão                                    |
| DELETE | `/study/sessions/:id`           | Exclui uma sessão                                      |
| GET    | `/study/summary`                | Totais de estudo por assunto e por dia                 |
| GET    | `/goals`                        | Lista metas (filtros: `status`, `scope`, `search`)     |
| POST   | `/goals`                        | Cria uma meta                                          |
| GET    | `/goals/:id`                    | Detalha uma meta                                       |
| PATCH  | `/goals/:id`                    | Atualiza uma meta                                      |
| DELETE | `/goals/:id`                    | Exclui uma meta                                        |

### Exemplos

Health check:

```bash
curl http://localhost:3333/api/health
```

Criar um projeto:

```bash
curl -X POST http://localhost:3333/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Portal de Clientes",
    "description": "Painel web para clientes",
    "category": "Web",
    "status": "active",
    "priority": "high",
    "color": "#6366f1",
    "startDate": "2026-01-01",
    "dueDate": "2026-03-31"
  }'
```

Criar uma tarefa vinculada ao projeto `1`:

```bash
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar tela de login",
    "description": "Com validação de formulário",
    "projectId": 1,
    "priority": "high",
    "category": "Frontend",
    "dueDate": "2026-02-10"
  }'
```

Mover a tarefa `1` para "Concluído" (mesma rota usada pelo Kanban):

```bash
curl -X PATCH http://localhost:3333/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "done" }'
```

Registrar uma sessão de estudo:

```bash
curl -X POST http://localhost:3333/api/study/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": 1,
    "studiedOn": "2026-01-20",
    "durationMinutes": 60,
    "notes": "Tipagem avançada"
  }'
```

Listar as tarefas atrasadas:

```bash
curl "http://localhost:3333/api/tasks?overdue=true"
```

### Formato das respostas e dos erros

Sucesso: o recurso em JSON (listas retornam um array direto).

Erro: sempre no mesmo formato, com o código HTTP correspondente:

```json
{
  "error": {
    "message": "Dados inválidos.",
    "details": {
      "fields": [{ "field": "name", "message": "Informe o nome do projeto." }]
    }
  }
}
```

Códigos utilizados: `200` (sucesso), `201` (criação), `204` (exclusão sem corpo), `400`
(validação), `404` (recurso inexistente), `409` (conflito, por exemplo assunto duplicado) e `500`
(erro interno — a mensagem retornada é genérica, sem detalhes da implementação).

---

## Testes

```bash
npm test              # servidor + interface
npm run test:server   # apenas a API
npm run test:client   # apenas a interface
```

**184 testes no total (78 na API e 106 na interface).**

A suíte do servidor sobe a aplicação Express com um banco SQLite em memória e cobre:

- criação, validação, listagem, filtros, atualização e exclusão de projetos;
- consulta por identificador, `PUT` como alternativa ao `PATCH` e contagem de tarefas atrasadas;
- exclusão de projeto sem deixar tarefas órfãs **e sem deixar atividades órfãs no histórico**;
- cálculo de progresso a partir das tarefas concluídas;
- criação, atualização, mudança de status, filtros, busca e identificação de tarefas atrasadas;
- desvinculação e revinculação de tarefa a um projeto;
- validação e ciclo de vida de metas (incluindo conclusão, reabertura e cancelamento);
- cadastro, edição e exclusão de assuntos, registro, edição e exclusão de sessões e totais de estudo;
- rotas principais da API: health check, dashboard, calendário, CORS (inclusive preflight) e tratamento de erros;
- paginação de datas: a tarefa concluída é contabilizada no **dia local**, e não em UTC.

Na interface são testados:

- todas as páginas: Dashboard, Projetos, Detalhe do Projeto, Tarefas, Kanban, Estudos, Metas,
  Calendário, Configurações e a página 404;
- listagem, busca com *debounce*, filtros, estados vazios, estados de erro e re-tentativa;
- criação, edição, conclusão e exclusão de itens, com confirmação e mensagem de erro da API;
- arrastar e soltar no Kanban e os botões de movimento acessível;
- formulários: validação de campos obrigatórios e mensagens em pt-BR;
- componentes: modal (Esc, fundo e botão de fechar), gráficos SVG, barra de progresso e hook `useAsync`;
- tema claro/escuro, densidade da interface e preferências salvas no navegador.

---

## Lint e verificação de tipos

```bash
npm run lint
npm run typecheck
```

Ambos rodam nos dois pacotes. O ESLint usa configuração flat (`eslint.config.js`) com
`typescript-eslint`, regras de hooks do React e `eslint-config-prettier`.

---

## Capturas de tela

A pasta `docs/screenshots/` está pronta para receber capturas da aplicação. Para facilitar a
avaliação por recrutadores, recomenda-se adicionar:

- `dashboard-claro.png` e `dashboard-escuro.png` — tema claro e escuro
- `projetos.png` — listagem e detalhes de projetos
- `tarefas.png` — tabela de tarefas com filtros
- `kanban.png` — quadro Kanban com arrastar e soltar
- `estudos.png` — sessões de estudo e resumo de tempo
- `metas.png` — metas com progresso
- `calendario.png` — visão mensal de prazos
- `configuracoes.png` — tema e densidade da interface

Referencie as imagens na seção "Funcionalidades" deste README:

```markdown
![Dashboard do DevTrack](docs/screenshots/dashboard-claro.png)
```

---

## Demonstração online

O DevTrack é uma aplicação **local, de usuário único, sem autenticação e sem sincronização em
nuvem**. Todos os dados ficam em um arquivo SQLite na própria máquina. Isso é uma decisão de
design válida, mas não permite que alguém simplesmente abra uma URL e experimente a aplicação.

Se quiser disponibilizar uma demonstração pública, as opções são:

1. **Vídeo curto** mostrando os fluxos principais (criar projeto, mover tarefa no Kanban, registrar sessão de estudo, adicionar meta). Hospede no YouTube ou Vimeo e cole o link abaixo.
2. **Deploy público** em plataformas como Render, Railway ou Fly.io, apontando o `Dockerfile` e o `docker-compose.yml` já incluídos no repositório. Como não há autenticação, recomenda-se proteger o demo com uma senha de nível de infraestrutura (por exemplo, autenticação básica do proxy reverso).

Quando tiver um vídeo ou deploy, adicione o link aqui:

```markdown
- [Vídeo de demonstração](https://youtu.be/...)
- [Deploy público (demo)](https://devtrack-demo.onrender.com)
```

---

## Contribuindo

Obrigado pelo interesse em contribuir com o DevTrack! Leia o
[guia de contribuição](CONTRIBUTING.md) para conhecer o padrão de commits (Commits Convencionais),
o fluxo de trabalho e como executar testes e lint antes de abrir um pull request.

Resumo rápido:

```bash
# 1. Clone e entre no repositório
git clone https://github.com/rafaelcalcio/devtrack.git
cd devtrack

# 2. Instale as dependências
npm install

# 3. Copie os arquivos de exemplo de ambiente
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Execute as verificações locais
npm run typecheck
npm run lint
npm test
npm run build

# 5. Rode em desenvolvimento
npm run dev
```

Mantenha commits pequenos e descritivos, com alterações reais e verificáveis.

---

## Limitações conhecidas

- **Sem autenticação:** a aplicação é de usuário único e local. Qualquer pessoa com acesso ao
  computador e ao arquivo do banco tem acesso aos dados. Não há login, senha, sessões ou
  permissões. Veja a [política de segurança](SECURITY.md) para mais detalhes.
- **Sem sincronização:** não há multiusuário nem armazenamento em nuvem.
- **Banco em arquivo único:** o SQLite atende bem ao uso local, mas não é adequado para gravações
  simultâneas de vários processos.
- **Kanban com arrastar e soltar nativo (HTML5):** funciona com mouse; em dispositivos móveis o
  padrão de arrastar pode variar entre navegadores — nesse caso, use os botões "Mover" do cartão.
- **Sem-upload de anexos:** tarefas, projetos e metas aceitam apenas texto.
- **Sem metas recorrentes:** o acompanhamento de metas é por período, sem repetição automática.
- **Sem testes de ponta a ponta no navegador:** a suíte cobre a API e os componentes de interface
  isoladamente.

---

## Licença

Distribuído sob a licença [MIT](LICENSE). Se quiser uma atribuição pessoal, substitua
`DevTrack contributors` pelo seu nome no arquivo `LICENSE` antes de publicar.
