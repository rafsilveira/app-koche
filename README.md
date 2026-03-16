# App Kóche - Documentação Oficial

## Visão Geral
O **App Kóche** é uma aplicação web (PWA) e Android desenvolvida para auxiliar aplicadores mecânicos de fluidos de transmissão automática (ATF). Ele serve como um guia técnico rápido para consulta de especificações, procedimentos, suporte via IA e área de membros para usuários avançados.

## Tecnologias e Stack
- **Frontend**: React.js 18 + Vite.
- **Estilização**: CSS Vanilla (mobile-first, design premium, UI focada para excelente experiência em dispositivos móveis).
- **Serviços Cloud e Autenticação**:
  - **Firebase**: Autenticação de Usuários e Admins e banco de dados.
  - **Gemini AI**: Assistente virtual integrado ('Assistente Kóche') que guia os mecânicos e dá orientações sobre trocas de fluido baseado nos bancos de dados internos.
- **Distribuição**:
  - **PWA**: Instalável via navegador padrão (Manifest e Service Workers).
  - **Android App**: Gerado via PWA/TWA, disponível na Play Store (detalhes no `PLAYSTORE_GUIDE.md`).

## 🧠 Memória Permanente da IA (`.koche_memory/` e `docs/`)
**Aviso para os Desenvolvedores e Engenheiros:** 
Este repositório contém diretórios específicos dedicados a fornecer contexto em tempo longo para os agentes de Inteligência Artificial que auxiliam no desenvolvimento:
- **`.koche_memory/`**: Contém arquivos cruciais (`app_overview.md`, `changelog.md`, `functions_map.md`). **NÃO ignore, NÃO esconda e NÃO exclua estes arquivos**, pois eles garantem que a IA tenha o contexto arquitetural completo do projeto sempre que um novo chat for iniciado. Ao fazer mudanças na estrutura, atualize-os.
- **`docs/agent/`**: Registros de planos de implementação (`implementation_plan.md`) usados como log e passo-a-passo técnico.

## Estrutura do Projeto
- `src/components/`: Componentes da interface (`Dashboard.jsx`, `UserArea.jsx`, `AdminScreen.jsx`, `AssistantScreen.jsx`, etc).
- `src/contexts/`: Gerenciamento de estado e proteção de rotas (`AuthContext.jsx` para gerenciar Firebase Auth).
- `src/services/`: Regras de negócio, fetch de dados e IA (`aiService.js`, `dataService.js`, `firebase.js`).
- `Data_Carros_Koche_App.json`: A fonte primária com todos os veículos, fluidos motores e fotos armazenados.

## Instalação e Execução Rápida

1. **Clone e Instale**
   ```bash
   git clone https://github.com/rafsilveira/app-koche.git
   cd app-koche
   npm install
   ```

2. **Configure as Variáveis de Ambiente**
   Crie um `.env` com suas chaves baseadas no arquivo de exemplo `/.env.example`. Você precisará das credenciais do Firebase (Auth) e da Google Gemini API para a IA funcionar.

3. **Inicie o servidor local**
   ```bash
   npm run dev
   ```

## Boas Práticas e Contribuição
- **Manter a Qualidade Visual:** O design inicial buscou um padrão extremamente Premium e polido. Jamais insira componentes visualmente quebrados.
- **Logs de Histórico:** Qualquer nova funcionalidade grande deve ser adicionada à `.koche_memory/changelog.md`.
- **Commits Claros:** Enviar commits detalhados explicando o contexto e garantindo o rastreio.
