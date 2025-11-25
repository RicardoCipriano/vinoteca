## Objetivo
- Apresentar na tela todas as tabelas existentes no banco (não apenas as 8 conhecidas), consultando diretamente `INFORMATION_SCHEMA` para refletir o estado real.

## Backend
- Atualizar o endpoint `GET /debug/schema` para ser dinâmico:
  - Buscar todas as tabelas do banco atual em `INFORMATION_SCHEMA.TABLES`.
  - Para cada tabela, consultar `INFORMATION_SCHEMA.COLUMNS` e montar `{ tabela: [colunas...] }`.
  - (Opcional) incluir contagem de registros por tabela (`SELECT COUNT(*) FROM tabela`).
- Alternativa: criar novo endpoint `GET /debug/tables` que retorna `{ tables: [...], columns: {tabela: [...]}, counts: {tabela: N} }`.
- Proteger com `authMiddleware`.

## Frontend
- Atualizar `DatabaseScreen` para consumir o endpoint dinâmico:
  - Exibir todas as tabelas retornadas, com suas colunas e (opcional) o total de registros.
  - Adicionar botão “Atualizar” para recarregar os dados.

## Benefícios
- Reflete fielmente as 15 tabelas (ou quaisquer outras) existentes no banco.
- Dispensa manutenção manual de lista de tabelas.

## Entregáveis
- Endpoint dinâmico no backend (atualização de `GET /debug/schema` ou novo `GET /debug/tables`).
- Tela atualizada exibindo todas as tabelas e colunas (e contagens, se habilitado).

## Confirmação
- Posso implementar a consulta dinâmica agora (backend + frontend) para listar todas as tabelas diretamente do banco?