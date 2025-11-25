## Escopo
- Remover toda configuração e código relacionados à API Nyckel (backend, frontend e variáveis de ambiente).
- Atualizar documentação para refletir a remoção e instruções atuais do projeto.

## Remoções por Arquivo
- `.env`
  - Remover `NYCKEL_CLIENT_ID`, `NYCKEL_CLIENT_SECRET`, `NYCKEL_CLASSIFY_FUNCTION_ID` (c:\xampp\htdocs\Wine\.env:18–20).
- `server/server.js`
  - Remover bloco de integração Nyckel, incluindo cache de token e função `getNyckelToken` (c:\xampp\htdocs\Wine\server\server.js:50–76).
  - Remover rota `POST /nyckel/classify` e toda lógica associada (c:\xampp\htdocs\Wine\server\server.js:78–136).
  - Remover uso de `process.env.NYCKEL_*` e referências aos endpoints `https://www.nyckel.com/...` (c:\xampp\htdocs\Wine\server\server.js:58–63, 86, 91).
- `src/api/http.ts`
  - Remover a função `api.nyckelClassify(imageData, functionId?)` e seu encaminhamento para `/nyckel/classify` (c:\xampp\htdocs\Wine\src\api\http.ts:57, 60).
  - Ajustar exportações de `api` para evitar referências quebradas.
- `src/components/CreateWineEntry.tsx`
  - Remover estados e UI relacionados a Nyckel: `nyckelLabel`, `nyckelScore` (c:\xampp\htdocs\Wine\src\components\CreateWineEntry.tsx:52–54, 397–401).
  - Remover chamadas `api.nyckelClassify` e tratamento de erros (c:\xampp\htdocs\Wine\src\components\CreateWineEntry.tsx:316–337, 511–526).
  - Revalidar fluxo de criação de item para garantir que a ausência de classificação não afete funcionalidade principal.

## Ajustes Consequentes
- Verificar que nenhuma rota ou função no front-end referencia `'/nyckel/classify'` após remoção.
- Garantir que o build do front-end compila sem tipos/estados de Nyckel.
- Confirmar que o servidor inicia sem dependências das variáveis `NYCKEL_*`.

## Documentação
- Atualizar `README.md`:
  - Remover qualquer instrução de configuração de Nyckel (não há menções atuais, mas incluir nota de remoção da funcionalidade).
  - Atualizar seção de variáveis de ambiente, mantendo apenas as usadas (ex.: `VITE_API_URL` em c:\xampp\htdocs\Wine\src\api\http.ts:1).
  - Atualizar lista de endpoints, removendo `POST /nyckel/classify`.
  - Adicionar seção "Mudanças" ou `CHANGELOG` com entrada: "Removida integração com Nyckel (classificação de rótulos)".
- Se existir documentação adicional (ex.: `docs/`), sincronizar remoções.

## Validação
- Rodar busca para confirmar zero ocorrências de "Nyckel"/`nyckel.com` no repositório.
- Build front-end e iniciar servidor; navegar pelo fluxo de criação de vinho para garantir estabilidade.
- Verificar que todas referências a `NYCKEL_*` foram removidas e que não há erros em runtime.

## Entregáveis
- Diffs por arquivo com remoções e pequenas refatorações consequentes.
- `README.md` atualizado e, opcionalmente, `CHANGELOG.md` com nota de remoção.

Confirme para eu aplicar as mudanças e enviar os diffs correspondentes.