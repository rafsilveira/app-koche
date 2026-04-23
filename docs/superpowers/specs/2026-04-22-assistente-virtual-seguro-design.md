# Assistente Virtual Seguro Design

## Objetivo

Finalizar o backend seguro do assistente virtual para que a tela de chat funcione ponta a ponta com autenticacao, limites por usuario, logs no Firestore e consultas somente leitura ao catalogo `vehicles`.

## Escopo

- O chat usa `AssistantScreen.jsx` e `assistantService.js`.
- O backend usa a callable `handleAssistantMessage`.
- Cada mensagem e tratada de forma isolada, sem memoria de conversa.
- O assistente responde apenas sobre Koche e consultas do Guia de Transmissao.
- O fluxo `Abrir no Guia` continua navegando internamente pelo `App.jsx`.

## Fora De Escopo

- Integracao direta com app do AI Studio nesta fase.
- Memoria conversacional.
- Viewer de logs no admin.
- Alteracoes estruturais na colecao `vehicles`.
- Qualquer escrita, merge, delete, migracao ou enriquecimento em `vehicles`.

## Arquitetura

1. `AssistantScreen.jsx` envia `{ message }` para `src/services/assistantService.js`.
2. `assistantService.js` chama a callable `handleAssistantMessage`.
3. A Cloud Function valida autenticacao, carrega configuracao do usuario e aplica limites.
4. A mensagem e classificada como `guide_lookup`, `faq` ou `out_of_scope`.
5. Para `guide_lookup`, o backend extrai marca, modelo, ano e motor, consulta `vehicles` em leitura e responde com `guide_match`, `ask_missing_fields` ou `no_match`.
6. Para `faq`, o backend pode usar Gemini server-side com prompt curto e restrito ao escopo Koche.
7. Em todos os caminhos, o backend valida a resposta final, atualiza contadores de uso e grava log no Firestore.
8. O frontend renderiza a mensagem e exibe `Abrir no Guia` quando houver `guideAction`.

## Componentes E Responsabilidades

### Frontend

- `src/components/AssistantScreen.jsx`: renderizacao do chat, loading, mensagens e CTA de abertura do guia.
- `src/services/assistantService.js`: chamada da callable e normalizacao da resposta.
- `src/App.jsx`: navegacao interna do assistente para o guia.

### Backend

- `functions/src/index.js`: exposicao da callable autenticada.
- `functions/src/assistant/handleAssistantMessage.js`: orquestracao principal.
- `functions/src/assistant/classifyIntent.js`: classificacao de intencao.
- `functions/src/assistant/vehicleLookup.js`: extracao de dados e consulta somente leitura em `vehicles`.
- `functions/src/assistant/missingFields.js`: deteccao de campos minimos necessarios.
- `functions/src/assistant/getAssistantSettings.js`: leitura de configuracoes globais e por usuario.
- `functions/src/assistant/enforceUsageLimits.js`: bloqueio de uso antes de IA.
- `functions/src/assistant/updateUsageCounters.js`: persistencia de contadores diarios e mensais.
- `functions/src/assistant/logAssistantEvent.js`: auditoria completa de cada interacao.
- `functions/src/assistant/geminiClient.js`: encapsulamento do Gemini server-side para FAQ em escopo.
- `functions/src/assistant/fallbacks.js`: respostas fixas e seguras.
- `functions/src/assistant/responseValidators.js`: validacao do contrato devolvido ao frontend.

## Contrato De Resposta

O backend devolve respostas estruturadas com:

- `type`: `faq | guide_match | ask_missing_fields | no_match | out_of_scope | usage_blocked | error`
- `message`: texto curto e controlado
- `guideAction`: opcional, usado para abrir o guia internamente
- `missingFields`: opcional, usado em consultas incompletas
- `usage`: opcional, com saldo restante para requests

## Regras De Negocio

- O assistente responde apenas sobre Koche e Guia de Transmissao.
- Perguntas fora de escopo devem ser recusadas com mensagem util e segura.
- Consultas incompletas do guia devem pedir apenas os campos faltantes.
- Consultas validas ao guia devem devolver payload suficiente para abrir o resultado no app.
- Limites de requests e tokens devem ser aplicados antes de qualquer chamada ao Gemini.
- Quando o limite for excedido, o backend nao chama IA e retorna `usage_blocked`.
- Falhas tecnicas ou respostas invalidas do modelo devem cair em fallback `error`.

## Seguranca De Dados

`vehicles` e estritamente somente leitura para esta funcionalidade.

Restricoes obrigatorias:

- nenhuma branch do assistente pode criar, editar, sobrescrever, apagar ou migrar documentos em `vehicles`
- toda persistencia do assistente ocorre em colecoes separadas como `assistant_logs`, `assistant_usage_periods`, `assistant_user_settings` e `assistant_global_settings`
- em caso de erro, o sistema responde com fallback; nunca tenta gravar ou corrigir dados em `vehicles`

## Tratamento De Erros

- usuario nao autenticado: rejeicao imediata
- payload vazio ou invalido: `error`
- usuario desabilitado ou acima do limite: `usage_blocked`
- consulta de guia incompleta: `ask_missing_fields`
- consulta de guia sem match: `no_match`
- pergunta fora de escopo: `out_of_scope`
- falha de Gemini ou resposta invalida: `error`

Sempre que possivel, o evento deve ser logado fora de `vehicles`.

## Verificacao Minima

- enviar pergunta institucional Koche e receber `faq`
- enviar consulta valida de guia com marca, modelo, ano e motor e receber `guide_match`
- enviar consulta incompleta e receber `ask_missing_fields`
- enviar pergunta fora de escopo e receber `out_of_scope`
- simular usuario bloqueado e receber `usage_blocked`
- verificar logs no Firestore
- confirmar que nenhuma operacao escreve em `vehicles`

## Entrega Minima

- `AssistantScreen` funcionando ponta a ponta
- backend seguro atual finalizado
- limites por usuario funcionando
- logs funcionando
- CTA `Abrir no Guia` funcionando
- sem memoria de conversa
- sem integracao com AI Studio nesta fase
- `vehicles` tratado como somente leitura
