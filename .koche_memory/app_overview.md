# App Kóche - Visão Geral

O **App Kóche** é uma aplicação React + Vite para consulta técnica de transmissões, captura de leads, administração de dados e suporte via IA.

## Entradas Reais

- `src/main.jsx` monta o app e remove service workers ativos no carregamento.
- `src/App.jsx` é o shell real da aplicação: envolve `ErrorBoundary`, `AuthProvider` e a máquina de estados de navegação.
- Não há `react-router`; a navegação é controlada por `currentView` local em `App.jsx`.

## Fluxo Principal

1. Usuário sem sessão autenticada vê `Login`.
2. Usuário autenticado sem `userProfile.phone` é forçado para `ProfileForm`.
3. Só depois disso o app libera `WelcomeScreen` e os destinos internos.
4. A partir de `WelcomeScreen`, `currentView` leva para `Dashboard`, `CourseScreen`, `AssistantScreen`, `UserArea` e `AdminScreen`.

## Fonte De Verdade E Persistência

- A fonte de verdade em runtime é o Firestore, não `Data_Carros_Koche_App.json`.
- Veículos ficam na coleção `vehicles` e são lidos por `src/services/dataService.js`.
- `fetchVehicleData()` salva o dataset inteiro em `localStorage` com a chave `koche_vehicle_data_v1` por 24 horas.
- CRUD de veículos no Admin limpa esse cache; sem isso, verificações manuais podem parecer desatualizadas.

## Serviços Centrais

- `src/contexts/AuthContext.jsx`: sessão Firebase, perfil do usuário, resolução de admin, gate de carregamento e atualização de perfil.
- `src/services/dataService.js`: leitura/cache de veículos, CRUD administrativo, busca/export de usuários e normalização de links de mídia.
- `src/services/aiService.js`: integração Gemini via `VITE_GEMINI_API_KEY`, enviando o dataset completo como contexto.
- `src/services/leads.js`: envio não bloqueante de leads para webhook externo.

## Restrições Importantes

- O app é hospedado no subcaminho `/guia-de-aplicacao/`; links absolutos e assets precisam respeitar esse `base`.
- O suporte PWA está desativado na prática: plugin comentado em `vite.config.js`, unregister em `src/main.jsx` e `public/sw.js` autodestrutivo.
- `updateProfileData()` envia lead externo quando recebe `phone`; editar a conta depois pode gerar envios duplicados.
- O assistente hoje só renderiza `response.message`; ações estruturadas como `SELECT_VEHICLE` ainda não estão conectadas à UI.
