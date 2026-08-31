# Log de Alterações - App Kóche

Registro histórico das principais mudanças e marcos do projeto.

---

## [0.1.0] - Janeiro 2026

### Adicionado
- Estrutura base em React + Vite.
- Integração com Firebase para autenticação de administradores.
- Fluxo de navegação Marca > Modelo > Ano > Motor.
- Exibição de especificações de fluido, fotos de conectores e links de vídeos.
- Configuração de PWA (Service Workers, Manifest).
- Integração com Google Gemini AI para o "Assistente Kóche".
- Script de deploy automatizado via FTP para Hostinger.
- Criação de pacote Android (AAB) via Bubblewrap.
- Customização de Seletores (Dropdowns) para melhor experiência mobile.
- **Sistema de Memória Persistente (.koche_memory)**: Implementado para manter contexto entre sessões de IA.

### Melhorado
- UI/UX refinada com foco em design premium.
- Lógica de sincronização com base de dados JSON.

---

## [Não lançado] - Agosto 2026

### Adicionado
- Novo campo `level_check_procedure` (texto livre) em cada veículo: explica como verificar o nível de fluido daquela transmissão específica. Adicionado em `Data_Carros_Koche_App.json` (todas as 788 entradas, valor `null` por padrão), exibido em `ResultCard.jsx` (só aparece quando preenchido) e editável em `AdminScreen.jsx` (novo textarea "Como Verificar o Nível"). Conteúdo por veículo ainda não populado — infraestrutura pronta, falta preencher dado real.

### Removido
- Tarefa/plano de correção de imagens do Google Drive (`.agent/tasks/task_google_drive_images.md`, `.agent/plans/implementation_plan_google_drive_images.md`) — Rafael confirmou que as imagens de conexão já estão funcionando, tarefa estava desatualizada.

### Adicionado (captação de leads)
- `ProfileForm` (exigência de telefone) deixou de substituir a tela inteira do app e passou a ser um **overlay obrigatório por cima** da tela normal (`App.jsx`) — usuário nunca "perde acesso" tecnicamente, mas continua sem poder usar nada até preencher o telefone. Vale pra conta nova e pra conta antiga sem telefone.
- Novo destino do lead capturado (`src/services/leads.js`): antes ia pra uma planilha Google (Apps Script), agora vai direto pro workflow n8n `App Kóche -> Kommo Lead (com checagem de cliente)` (webhook `https://n8nvps.kocheautomotiva.com.br/webhook/app-koche-lead`), que cria o lead no Funil de Vendas do Kommo — **exceto se o telefone já pertencer a um cliente existente** (checado via busca de leads por telefone no Kommo, considerando `status_id 142` — ganho universal — ou pipeline Pós Venda), caso em que nada é criado.
- **Limitação conhecida:** a tag "App Kóche" enviada na criação do lead não está sendo aplicada pelo endpoint `/leads/complex` do Kommo (motivo ainda não investigado a fundo) — o lead cai no pipeline/etapa certos, só falta a tag de rastreio de origem funcionar.
