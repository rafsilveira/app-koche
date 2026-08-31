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
