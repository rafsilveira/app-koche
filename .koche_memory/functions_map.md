# Mapa de Funções e Componentes

Mapeamento técnico da estrutura interna do App Kóche.

## Componentes Principais (`src/components`)

- `WelcomeScreen.jsx`: Tela inicial com opções de Guia e Assistente.
- `Selector.jsx`: Componente de dropdown personalizado para seleção de marcas e modelos.
- `ResultCard.jsx`: Exibe os detalhes técnicos do veículo selecionado (fluido, fotos, vídeo).
- `AssistantScreen.jsx`: Interface de chat com o assistente de IA.
- `AdminScreen.jsx`: Painel administrativo para gerenciamento de dados e usuários.
- `Login.jsx`: Tela de autenticação para as áreas restritas.
- `ErrorBoundary.jsx`: Tratamento de erros globais da aplicação.

## Serviços (`src/services`)

- `aiService.js`: Gerencia a comunicação com a API do Google Generative AI (Gemini).
- `dataService.js`: Lógica de busca e filtragem na base de dados JSON.
- `firebase.js`: Configuração e instâncias do Firebase (Auth/Firestore).
- `leads.js`: Serviço para captura e gerenciamento de leads.

## Utilitários e Contextos

- `contexts/AuthContext.js`: Fornece o estado de autenticação para toda a aplicação.
- `App.jsx`: Componente raiz gerenciando o roteamento e o estado global da navegação.
- `Data_Carros_Koche_App.json`: A "fonte da verdade" para os dados técnicos.
