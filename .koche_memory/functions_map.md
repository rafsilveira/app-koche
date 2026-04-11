# Mapa de Funções e Componentes

Mapeamento técnico das peças que realmente controlam fluxo, dados e efeitos colaterais do App Kóche.

## Entrypoints

- `src/main.jsx`: bootstrap React e limpeza forçada de service workers.
- `src/App.jsx`: navegação por `currentView`, preload de base para o assistente e guards de autenticação/perfil.

## Contexto E Fluxo De Autenticação

- `src/contexts/AuthContext.jsx`
  - expõe `currentUser`, `userProfile`, `isAdmin`, `loading` e ações de auth/perfil.
  - resolve admin por email hardcoded ou coleção `admins` no Firestore.
  - carrega perfil da coleção `users`.
  - `updateProfileData()` faz merge no Firestore, atualiza `displayName` no Auth e dispara integração de lead se houver `phone`.

## Componentes Principais (`src/components`)

- `Login.jsx`: login com Google, email/senha e criação de conta.
- `ProfileForm.jsx`: gate obrigatório de telefone; salvar telefone destrava o restante do app.
- `WelcomeScreen.jsx`: hub principal de navegação após autenticação.
- `Dashboard.jsx`: fluxo guia Marca -> Modelo -> Ano -> Motor usando `fetchVehicleData()`.
- `ResultCard.jsx`: renderiza dados do veículo e faz fallback entre chaves novas (`snake_case`) e antigas (`camelCase`).
- `AssistantScreen.jsx`: chat simples; hoje só exibe a mensagem textual retornada pela IA.
- `CourseScreen.jsx`: módulo legado de videoaulas grátis com lista local de vídeos.
- `LearningPlatformScreen.jsx`: nova plataforma de ensino; navega entre módulos, aulas e detalhe da aula usando dados do Firestore.
- `AdminScreen.jsx`: CRUD de veículos, gestão de admins e exportação CSV de leads.
- `UserArea.jsx`: edição de nome/telefone e logout; reutiliza `updateProfileData()`.
- `ErrorBoundary.jsx`: proteção global contra crash de render.

## Serviços (`src/services`)

- `firebase.js`: inicialização do Firebase com configuração hardcoded.
- `dataService.js`
  - fonte real: coleção `vehicles` no Firestore.
  - cache local de 24h em `koche_vehicle_data_v1`.
  - CRUD de veículos limpa cache.
  - também centraliza admins, busca/export de usuários e normalização de URLs de imagem/vídeo.
- `aiService.js`
  - usa `VITE_GEMINI_API_KEY`.
  - envia dataset compactado para o Gemini.
  - espera JSON puro com `message`, `action` e `target`.
- `leads.js`: POST para webhook externo; falha não bloqueia UX.
- `learningService.js`
  - lê módulos na coleção `learning_modules`.
  - lê aulas em subcoleções `learning_modules/{moduleId}/lessons`.
  - oferece seed de placeholders para popular rapidamente a nova plataforma.

## Fluxos Que Costumam Gerar Erro Em Mudanças

- Refresh da página não preserva destino interno; como não há router, o app volta ao fluxo padrão após reavaliar auth/perfil.
- `App.jsx` e `Dashboard.jsx` carregam veículos separadamente; o cache reduz custo, mas há duplicação de fetch.
- `UserArea.jsx` pode disparar lead duplicado ao editar telefone porque usa a mesma rotina do gate inicial.
- `AssistantScreen.jsx` ainda não usa `action/target`; mudar `aiService.js` sem ligar a UI pode não ter efeito funcional.
- A plataforma nova e o módulo antigo de vídeo coexistem; não trate `CourseScreen.jsx` e `LearningPlatformScreen.jsx` como a mesma feature.
