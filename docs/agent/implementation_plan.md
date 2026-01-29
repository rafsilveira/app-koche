# Plano de Melhoria de Qualidade de Código

Este plano visa abordar os problemas de manutenibilidade, escalabilidade e padronização identificados na auditoria inicial do código. O foco principal é refatorar componentes monolíticos e padronizar a estilização.

## User Review Required

> [!IMPORTANT]
> **Refatoração de Estilos**: O código atual utiliza extensivamente estilos inline e tags `<style>` dentro do JSX. O plano propõe migrar esses estilos para arquivos CSS separados (`.css` ou CSS Modules). Isso pode alterar levemente a especificidade do CSS, exigindo verificação visual.

## Proposed Changes

### Refatoração de Componentes
Separar componentes definidos dentro de arquivos grandes em seus próprios arquivos para reduzir complexidade.

#### [MODIFY] [src/App.jsx](file:///Users/rafaelsilveira/Documents/Guia koche app/src/App.jsx)
- Extrair `Dashboard`, `WelcomeScreen` e `AppContent` para arquivos individuais em `src/components/`.
- Manter apenas a configuração de rotas/estado global em `App.jsx`.

#### [NEW] [src/components/Dashboard.jsx](file:///Users/rafaelsilveira/Documents/Guia koche app/src/components/Dashboard.jsx)
- Novo arquivo para o componente `Dashboard` extraído de `App.jsx`.

#### [NEW] [src/components/WelcomeScreen.jsx](file:///Users/rafaelsilveira/Documents/Guia koche app/src/components/WelcomeScreen.jsx)
- Novo arquivo para o componente `WelcomeScreen` extraído de `App.jsx`.

### Padronização de Estilos
Remover estilos inline e centralizar no CSS global ou módulos.

#### [MODIFY] [src/index.css](file:///Users/rafaelsilveira/Documents/Guia koche app/src/index.css)
- Centralizar variáveis de cores (e.g., `--koche-red`, `--koche-blue`).
- Criar classes utilitárias para substituir estilos inline repetitivos (e.g., containers, flexbox alignments).

#### [MODIFY] [src/components/AdminScreen.jsx](file:///Users/rafaelsilveira/Documents/Guia koche app/src/components/AdminScreen.jsx)
- Remover a tag `<style>` interna.
- Mover estilos inline para classes CSS.

### Configuração de Linting e Qualidade
Adicionar regras para prevenir anti-patterns futuros.

#### [MODIFY] [eslint.config.js](file:///Users/rafaelsilveira/Documents/Guia koche app/eslint.config.js)
- Adicionar regras para desencorajar estilos inline excessivos.
- Enforcing de `prop-types` (ou desabilitar explicitamente se a decisão for não usar).
- Ordenação de imports.

## Verification Plan

### Automated Tests
- Executar `npm run lint` para garantir que novas regras sejam seguidas e não haja erros de linting.
- Executar `npm run build` para garantir que a refatoração não quebrou o build de produção.

### Manual Verification
- **Navegação**: Verificar se `WelcomeScreen` -> `Dashboard` e `WelcomeScreen` -> `AdminScreen` continuam funcionando.
- **Visual**: Comparar visualmente a aplicação antes e depois para garantir que a extração de CSS não quebrou o layout.
- **Admin**: Testar abas do `AdminScreen` para garantir que a lógica (que estava misturada com UI) não foi afetada.
