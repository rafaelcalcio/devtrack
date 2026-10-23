# Política de Segurança

## Versões suportadas

| Versão | Suportada |
| ------ | --------- |
| 1.0.x  | :white_check_mark: |

## Reportando uma vulnerabilidade

Se você descobrir um problema de segurança, **não abra uma issue pública**. Entre em contato diretamente com os mantenedores do repositório (por exemplo, abrindo uma issue privada ou enviando um e-mail aos responsáveis).

Inclua o máximo de detalhes possível:

- Descrição da vulnerabilidade
- Passos para reproduzir
- Versão do DevTrack afetada
- Ambiente (Node.js, sistema operacional)
- Possível impacto e sugestão de correção

## Resposta

Os mantenedores se comprometem a:

1. Confirmar o recebimento do relatório em até 5 dias úteis.
2. Avaliar a gravidade e fornecer um prazo estimado para correção.
3. Publicar um aviso e, quando aplicável, uma versão corrigida.

## Escopo

O DevTrack é uma aplicação **local, de usuário único, sem autenticação**. Todos os dados ficam persistidos em um arquivo SQLite na própria máquina do usuário. Por isso:

- Não há login, senha, sessões ou controle de acesso.
- Qualquer pessoa com acesso ao computador e ao arquivo do banco tem acesso aos dados.
- Não há sincronização em nuvem nem armazenamento remoto.

Leve isso em conta ao avaliar riscos e ao implantar o projeto em ambientes compartilhados.
