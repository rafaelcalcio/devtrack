# Guia de Contribuição

Obrigado pelo interesse em contribuir com o DevTrack! Este documento explica como participar do projeto.

## Código de conduta

Ao contribuir, você concorda em manter um ambiente respeitoso e inclusivo para todos os participantes.

## Como começar

1. Faça um fork do repositório e crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-melhoria
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie os arquivos de exemplo de variáveis de ambiente:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

## Padrões de commit

O projeto usa [Commits Convencionais](https://www.conventionalcommits.org/). Exemplos:

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` alterações na documentação
- `style:` formatação, ponto e vírgula ausente, etc. (sem mudança de código)
- `refactor:` refatoração de código (sem mudança de comportamento)
- `test:` adição ou correção de testes
- `chore:` tarefas de manutenção

Exemplo: `feat: adicionar filtro de prioridade na lista de tarefas`

## Fluxo de trabalho

1. Crie uma branch descritiva a partir de `main`.
2. Implemente a alteração com testes correspondentes.
3. Execute as verificações locais antes de enviar:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
4. Abra um pull request para `main` descrevendo o problema e a solução.
5. Mantenha os pull requests pequenos e focados em um único assunto.

## Testes

- Servidor: vitest + supertest em `server/tests/`
- Interface: vitest + testing library em `client/src/`

Rode os testes completos com `npm test`. Novas funcionalidades devem incluir testes de integração (API) e de componente (interface) quando aplicável.

## Estrutura do repositório

```
devtrack/
├── client/              # Interface React + Vite
├── server/              # API Express + SQLite
├── docs/                # Documentação e capturas de tela
├── .github/workflows/   # CI (GitHub Actions)
└── README.md            # Visão geral e instruções
```

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a licença MIT do projeto.
