## Objetivo
- Exibir na aplicação uma tela que apresenta todas as tabelas do banco, com seus nomes e colunas, e (opcional) contagem de registros.

## Abordagem
- Aproveitar o endpoint já existente no backend: `GET /debug/schema` (server/server.js:98–121), que retorna um resumo de colunas presentes por tabela.
- Criar uma tela “Banco de Dados” no frontend que consome `GET /debug/schema` e apresenta:
  - Lista de tabelas: `users`, `countries`, `regions`, `wineries`, `grapes`, `wines`, `wine_pairings`, `harmonizations`.
  - Para cada tabela: número de colunas presentes e lista de colunas.
- (Opcional) Adicionar um endpoint complementar `GET /db/counts` para contagem de linhas por tabela (agregado no backend), exibindo “Registros: N”.

## Backend (opcional)
- Novo endpoint `GET /db/counts` (proteção com `authMiddleware`):
  - Obtém as tabelas alvo e retorna `{ table: 'users', count: 123 }` por tabela.
  - SQL: `SELECT COUNT(*) AS cnt FROM <tabela>` iterado por tabela.

## Frontend
- Criar página/rota “Banco de Dados” acessível por usuários autenticados:
  - Faz `GET /debug/schema` e renderiza cards por tabela com nome e colunas.
  - Se `GET /db/counts` disponível, exibir contagem ao lado do nome.
  - Loading/erro padronizados.

## Segurança
- Endpoints somente autenticados.
- Não exibir dados sensíveis; apenas metadados de estrutura e contagens.

## Entregáveis
- Tela “Banco de Dados” com lista de tabelas e colunas via `/debug/schema`.
- (Opcional) `GET /db/counts` no backend para contagens.

## Confirmação
- Posso implementar a tela consumindo `/debug/schema` imediatamente e, se desejar, incluir o endpoint de contagem `GET /db/counts`?