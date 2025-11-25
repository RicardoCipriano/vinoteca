# PRD de Teste (Wine)

## Objetivo
- Definir requisitos funcionais e critérios de aceite testáveis do app "Wine" para validar o MVP em SPA (React/Vite) com backend Express/MySQL.

## Escopo
- Autenticação, biblioteca de vinhos, upload/OCR, perfil de gosto e recomendações, conta do usuário, catálogos, nível do usuário, privacidade.

## Visão Geral
- Frontend: React 18 + Vite + TypeScript + Tailwind + Radix/shadcn.
- Backend: Node.js + Express + JWT + bcryptjs + mysql2/promise.
- Ambientes: frontend em http://localhost:3000, API em http://localhost:4000.
- Persistência: MySQL com tabelas para usuários, vinhos, regiões, vinícolas, uvas, harmonizações, preferências.
- Limitação conhecida: OCR via tesseract.js com worker desativado; endpoint retorna 503 quando inativo.

## Personas
- Iniciante: registra rótulos e aprende harmonizações.
- Entusiasta: organiza biblioteca, ajusta perfil e recebe recomendações.
- Profissional: busca consistência de cadastro e catálogos.

## Requisitos Funcionais
### Autenticação
- Registrar: POST /auth/register cria usuário e retorna token.
- Login: POST /auth/login retorna token.
- Esqueci/Reset: POST /auth/forgot gera code; POST /auth/reset troca senha.
- Perfil atual: GET /auth/me retorna usuário e nível.

### Biblioteca de Vinhos
- Listar: GET /wines mostra vinhos do usuário com país/região/vinícola/uvas.
- Detalhes: GET /wines/:id inclui harmonizações e bandeira do país.
- Criar: POST /wines normaliza wine_type e cria catálogos faltantes se necessário.
- Editar: PUT /wines/:id atualiza e substitui harmonizações.
- Excluir: DELETE /wines/:id.
- Favorito: PATCH /wines/:id/favorite.
- Sumário: GET /wines/summary por tipo.

### Upload/OCR
- Upload: POST /upload aceita imagem base64 (data:image/*;base64) e retorna url.
- OCR: POST /ocr retorna texto/sugestões; 503 quando worker não inicializado.

### Perfil de Gosto e Recomendações
- Perfil: GET /taste-profile, PUT /taste-profile com intensidade, estilo, doçura, momentos, personalidade.
- Recomendações: GET /wines/recommendations lista uvas e seleção de vinhos conforme perfil.

### Conta do Usuário
- Dados: GET /account.
- Atualizar: PUT /account (país, idioma, tema, marketing, etc.).
- Excluir: DELETE /account remove conta e dados relacionados.

### Catálogos
- Harmonizações: GET /harmonizations.
- Uvas: GET /grapes.
- Regiões: GET /regions?country|country_id.
- Vinícolas: GET /wineries?region_id|region|country|country_id.

### Nível do Usuário
- GET /user/level calcula score/nível (Iniciante/Curioso/Sommelier/Expert) e sugestões.

### Legal/Utilitários
- Saúde: GET /health.
- Privacidade: GET /legal/privacy.
- Debug: GET /debug/schema, POST /debug/fix.

## Requisitos Não Funcionais
### Segurança
- JWT obrigatório nas rotas protegidas; sem exposição de tokens em logs.
- Hash de senha com bcryptjs; sem senhas em claro.
- CORS configurado para o frontend.

### Performance
- Listagem de vinhos responde em < 500 ms com até 500 registros.
- Upload aceita imagens até 5 MB; resposta < 2 s em disco local.

### Confiabilidade
- Migrações idempotentes; criação automática de catálogos faltantes ao cadastrar vinho.
- Respostas de erro padronizadas com mensagens claras.

### Compatibilidade
- Navegadores modernos; responsivo para mobile e desktop.

### Observabilidade
- GET /health indica status.
- Logs de erro sem dados sensíveis.

## Fluxos Principais
### Registro/Login
- Usuário registra → recebe token → navega à biblioteca.
- Login válido → armazena token → GET /auth/me popula estado.

### Cadastro de Vinho
- Usuário abre criação → preenche dados → opcional upload/OCR → salva → volta à lista.

### Preferências e Recomendações
- Usuário define perfil → acessa recomendações → vê vinhos sugeridos e uvas.

### Gestão de Conta
- Atualiza configurações → confirmação de sucesso; exclusão de conta remove dados.

## Critérios de Aceite
### Autenticação
- Registrar com e-mail novo retorna 201 e token; login válido retorna 200.
- Fluxo forgot/reset: POST /auth/forgot retorna code; POST /auth/reset com email+code+nova senha retorna 200.

### Biblioteca de Vinhos
- POST /wines com campos mínimos retorna 201; GET /wines inclui item.
- Editar substitui harmonizações; favorito alterna estado.
- Excluir remove item; GET /wines/:id responde 404 após remoção.

### Upload/OCR
- Upload base64 válido retorna url acessível em GET /image?file=... .
- OCR inativo retorna 503 sem quebrar criação manual.

### Perfil e Recomendações
- PUT /taste-profile persiste; GET /wines/recommendations retorna lista quando há perfil.

### Conta do Usuário
- PUT /account atualiza; DELETE /account apaga dados; GET /auth/me passa a retornar 401.

### Nível
- GET /user/level retorna nível consistente com atividade simulada.

### Legal
- GET /legal/privacy retorna texto.

## Métricas de Sucesso
- Sucesso em CRUD de vinhos ≥ 99% em testes.
- Tempo médio de resposta nas principais rotas ≤ 500 ms.
- Erros 5xx ≤ 1% em cenários padrão.

## Riscos e Suposições
- OCR dependente de worker; marcado como experimental até ativação.
- Seed/migrações criam catálogos básicos; dados mínimos válidos esperados.
- Armazenamento de imagens em disco local (uploads/) em ambiente dev.