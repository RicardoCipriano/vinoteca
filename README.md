
  # Vinoteca

  This is a code bundle for Vinoteca. The original project is available at https://www.figma.com/design/2sbQTF62ezZMhrkw2DCQJS/Design-Frontend-for-VinhaCloset.

  ## Visão geral

  Aplicação para cadastro e gestão de vinhos, com backend em Node/Express e frontend em React/Vite. Suporta OCR de rótulos via Tesseract (client-side) ou endpoint de OCR no servidor.

  ## Configuração
  1. Instale dependências: `npm i`
  2. Crie `.env` na raiz com, por exemplo:
     - `PORT=4000`
     - `JWT_SECRET=<uma-chave-segura>`
     - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
     - `AUTO_MIGRATE=true` para executar migrações ao iniciar
     - `VITE_API_URL` apontando para a URL do backend (ex.: `http://localhost:4000`)
     - `VITE_USE_SERVER_OCR=true` para usar OCR do servidor (ou `false` para client-side)

  ## Executando
  - API (servidor): `npm run server`
  - Frontend (Vite): `npm run dev`

  ## Alterações recentes
  - Removida a integração com a API Nyckel (classificação de rótulos). O fluxo de OCR e cadastro permanece funcionando sem a classificação externa.
  
