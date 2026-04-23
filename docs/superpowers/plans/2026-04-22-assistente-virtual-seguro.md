# Assistente Virtual Seguro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalizar o backend seguro do assistente virtual para que o chat responda apenas sobre Koche e o Guia de Transmissao, com limites por usuario, logs no Firestore e consultas somente leitura em `vehicles`.

**Architecture:** O frontend continua chamando a callable `handleAssistantMessage`. O backend decide a intencao, resolve consultas de guia diretamente via Firestore em modo somente leitura, usa Gemini apenas para FAQ em escopo e registra uso e auditoria em colecoes separadas. A entrega prioriza previsibilidade do backend atual, sem memoria de conversa e sem dependencia do app do AI Studio.

**Tech Stack:** React + Vite, Firebase Auth, Firestore, Firebase Cloud Functions v2, Node test runner, Gemini server-side.

---

### Task 1: Mapear o backend atual e criar cobertura para as lacunas mais arriscadas

**Files:**
- Modify: `functions/test/classifyIntent.test.js`
- Create: `functions/test/vehicleLookup.test.js`
- Create: `functions/test/handleAssistantMessage.test.js`

- [ ] **Step 1: Expandir os testes de intencao para proteger o escopo seguro**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyIntent } = require('../src/assistant/classifyIntent');

test('classifyIntent treats empty prompts as out_of_scope', () => {
  const result = classifyIntent('   ');

  assert.equal(result.intent, 'out_of_scope');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent keeps Koche prompts in faq scope', () => {
  const result = classifyIntent('Quais produtos da Koche voces oferecem para cambio automatico?');

  assert.equal(result.intent, 'faq');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent sends generic off-topic prompts to out_of_scope', () => {
  const result = classifyIntent('Me passe uma receita de bolo de cenoura');

  assert.equal(result.intent, 'out_of_scope');
  assert.equal(result.requiresGuideLookup, false);
});
```

- [ ] **Step 2: Escrever o teste inicial do lookup do guia com Firestore fake**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { lookupVehicle } = require('../src/assistant/vehicleLookup');

function createDbWithVehicles(vehicles) {
  return {
    collection(name) {
      assert.equal(name, 'vehicles');

      return {
        async get() {
          return {
            docs: vehicles.map((vehicle) => ({
              id: vehicle.id,
              data: () => vehicle
            }))
          };
        }
      };
    }
  };
}

test('lookupVehicle returns guide match for a complete vehicle query', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?');

  assert.equal(result.status, 'match');
  assert.equal(result.vehicle.id, 'veh-1');
});
```

- [ ] **Step 3: Escrever o teste do fluxo principal da function sem Gemini para consulta de guia**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { handleAssistantMessage } = require('../src/assistant/handleAssistantMessage');

test('handleAssistantMessage returns guide_match and logs the event', async () => {
  const writes = [];

  const db = {
    collection(name) {
      if (name === 'assistant_global_settings' || name === 'assistant_user_settings') {
        return {
          doc() {
            return { get: async () => ({ exists: false, data: () => ({}) }) };
          }
        };
      }

      if (name === 'assistant_usage_periods') {
        return {
          doc(id) {
            return {
              get: async () => ({ exists: false, data: () => ({}) }),
              set: async (payload) => writes.push({ name, id, payload })
            };
          }
        };
      }

      if (name === 'assistant_logs') {
        return {
          add: async (payload) => writes.push({ name, payload })
        };
      }

      if (name === 'vehicles') {
        return {
          async get() {
            return {
              docs: [
                {
                  id: 'veh-1',
                  data: () => ({ brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' })
                }
              ]
            };
          }
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    }
  };

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'guide_match');
  assert.equal(response.guideAction.vehicleId, 'veh-1');
  assert.equal(writes.some((entry) => entry.name === 'assistant_logs'), true);
});
```

- [ ] **Step 4: Rodar a suite de testes atual dos functions**

Run: `node --test functions/test/*.test.js`
Expected: falhas em `vehicleLookup.test.js` e possivelmente em `handleAssistantMessage.test.js` porque o lookup atual depende de listas fixas e o fluxo ainda nao esta pronto para esse mock.

- [ ] **Step 5: Commit**

```bash
git add functions/test/classifyIntent.test.js functions/test/vehicleLookup.test.js functions/test/handleAssistantMessage.test.js
git commit -m "test: cover secure assistant backend flows"
```

### Task 2: Tornar o lookup do guia confiavel e estritamente somente leitura

**Files:**
- Modify: `functions/src/assistant/vehicleLookup.js`
- Modify: `functions/src/assistant/missingFields.js`
- Test: `functions/test/vehicleLookup.test.js`

- [ ] **Step 1: Escrever o teste para consulta incompleta pedir campos faltantes**

```js
test('lookupVehicle returns missing_fields when year and engine are absent', async () => {
  const db = createDbWithVehicles([]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla automatico?');

  assert.equal(result.status, 'missing_fields');
  assert.deepEqual(result.missingFields, ['year', 'engine']);
});
```

- [ ] **Step 2: Escrever o teste para no_match com catalogo sem resultado compatível**

```js
test('lookupVehicle returns no_match when no vehicle matches the extracted query', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-9', brand: 'Honda', model: 'Civic', year: '2019', engine: '2.0' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?');

  assert.equal(result.status, 'no_match');
});
```

- [ ] **Step 3: Implementar lookup em memoria a partir de leitura simples do catalogo, sem writes**

```js
const { detectMissingGuideFields } = require('./missingFields');
const { normalizeText } = require('./scopeRules');

function normalizeVehicleField(value) {
  return normalizeText(String(value || ''));
}

function extractVehicleQuery(message) {
  const text = normalizeText(message);
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  const engineMatch = text.match(/\b\d\.\d\b/);

  return {
    brand: extractKnownBrand(text),
    model: extractKnownModel(text),
    year: yearMatch ? yearMatch[1] : '',
    engine: engineMatch ? engineMatch[0] : ''
  };
}

async function lookupVehicle(db, message) {
  const vehicleQuery = extractVehicleQuery(message);
  const missingFields = detectMissingGuideFields(vehicleQuery);

  if (missingFields.length > 0) {
    return { status: 'missing_fields', vehicleQuery, missingFields };
  }

  const snapshot = await db.collection('vehicles').get();
  const candidates = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((vehicle) => {
      return normalizeVehicleField(vehicle.brand) === normalizeVehicleField(vehicleQuery.brand)
        && normalizeVehicleField(vehicle.model) === normalizeVehicleField(vehicleQuery.model)
        && String(vehicle.year || '') === String(vehicleQuery.year || '')
        && normalizeVehicleField(vehicle.engine) === normalizeVehicleField(vehicleQuery.engine);
    })
    .slice(0, 2);

  if (candidates.length === 0) {
    return { status: 'no_match', vehicleQuery, missingFields: [] };
  }

  return {
    status: 'match',
    vehicleQuery,
    missingFields: [],
    vehicle: candidates[0]
  };
}
```

- [ ] **Step 4: Rodar os testes de lookup**

Run: `node --test functions/test/vehicleLookup.test.js functions/test/missingFields.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add functions/src/assistant/vehicleLookup.js functions/src/assistant/missingFields.js functions/test/vehicleLookup.test.js functions/test/missingFields.test.js
git commit -m "fix: make assistant vehicle lookup read-only and reliable"
```

### Task 3: Endurecer a callable principal para respostas seguras, limites e logs consistentes

**Files:**
- Modify: `functions/src/assistant/handleAssistantMessage.js`
- Modify: `functions/src/assistant/getAssistantSettings.js`
- Modify: `functions/src/assistant/enforceUsageLimits.js`
- Modify: `functions/src/assistant/logAssistantEvent.js`
- Test: `functions/test/handleAssistantMessage.test.js`

- [ ] **Step 1: Escrever o teste de bloqueio por limite sem chamada ao Gemini**

```js
test('handleAssistantMessage returns usage_blocked before Gemini when daily limit is reached', async () => {
  const db = createLimitReachedDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'O que e a Koche?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'usage_blocked');
});
```

- [ ] **Step 2: Escrever o teste de fora de escopo com log persistido**

```js
test('handleAssistantMessage returns out_of_scope and still writes an assistant log', async () => {
  const { db, writes } = createBaseAssistantDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Me ajuda com marketing digital?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'out_of_scope');
  assert.equal(writes.some((entry) => entry.name === 'assistant_logs'), true);
});
```

- [ ] **Step 3: Ajustar o orquestrador para defaults seguros e log consistente**

```js
const response = validation.ok ? candidateResponse : createErrorFallback();

await logAssistantEvent(db, {
  uid: auth.uid,
  email: auth.token?.email || null,
  userMessage,
  assistantMessage: response.message,
  status: response.type,
  reason: validation.ok ? null : validation.reason,
  intent: intentResult.intent,
  vehicleQuery: lookupResult?.vehicleQuery || null,
  matchedVehicleId: response.guideAction?.vehicleId || null,
  matchedVehicleSummary: response.guideAction ? {
    brand: response.guideAction.brand,
    model: response.guideAction.model,
    year: response.guideAction.year,
    engine: response.guideAction.engine
  } : null,
  openGuidePayload: response.guideAction || null,
  inputTokens: usage.inputTokens,
  outputTokens: usage.outputTokens,
  totalTokens: usage.inputTokens + usage.outputTokens,
  ip: rawRequest.ip || rawRequest.headers['x-forwarded-for'] || null,
  userAgent: rawRequest.headers['user-agent'] || null
});

return {
  ...response,
  usage: {
    dailyRemaining: Math.max(0, Number(settings.dailyRequestLimit || 0) - (limitState.dailyUsage.data.requestCount + 1)),
    monthlyRemaining: Math.max(0, Number(settings.monthlyRequestLimit || 0) - (limitState.monthlyUsage.data.requestCount + 1))
  }
};
```

- [ ] **Step 4: Rodar os testes do fluxo principal**

Run: `node --test functions/test/handleAssistantMessage.test.js functions/test/classifyIntent.test.js functions/test/responseValidators.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add functions/src/assistant/handleAssistantMessage.js functions/src/assistant/getAssistantSettings.js functions/src/assistant/enforceUsageLimits.js functions/src/assistant/logAssistantEvent.js functions/test/handleAssistantMessage.test.js functions/test/classifyIntent.test.js functions/test/responseValidators.test.js
git commit -m "fix: harden secure assistant backend flow"
```

### Task 4: Restringir o Gemini a FAQ de Koche e tornar o fallback previsivel

**Files:**
- Modify: `functions/src/assistant/geminiClient.js`
- Modify: `functions/src/assistant/fallbacks.js`
- Modify: `functions/src/assistant/handleAssistantMessage.js`
- Test: `functions/test/handleAssistantMessage.test.js`

- [ ] **Step 1: Escrever o teste para FAQ segura sem chave do Gemini**

```js
test('handleAssistantMessage returns error fallback for faq when Gemini is unavailable', async () => {
  const { db } = createBaseAssistantDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'O que e a Koche?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'error');
});
```

- [ ] **Step 2: Ajustar o client Gemini para manter prompt curto, uso estimado e resposta saneada**

```js
function sanitizeModelText(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

async generateAnswer({ systemInstruction, userMessage, guideContext }) {
  const promptSections = [systemInstruction, `Pergunta do usuario: ${userMessage}`];

  if (guideContext) {
    promptSections.push(`Contexto do guia: ${guideContext}`);
  }

  const result = await model.generateContent(promptSections.join('\n\n'));
  const text = sanitizeModelText(result.response.text());

  if (!text) {
    throw new Error('Empty Gemini response.');
  }

  return {
    text,
    usage: {
      inputTokens: estimateTokensFromText(promptSections.join(' ')),
      outputTokens: estimateTokensFromText(text)
    }
  };
}
```

- [ ] **Step 3: Usar uma instrucao de sistema fixa e restrita em `handleAssistantMessage.js`**

```js
const FAQ_SYSTEM_INSTRUCTION = [
  'Voce responde apenas sobre a Koche Automotiva, seus produtos, catalogo e uso do Guia de Transmissao.',
  'Nao responda sobre temas fora desse escopo.',
  'Se a pergunta fugir do escopo, recuse de forma objetiva.',
  'Responda em portugues do Brasil, com no maximo 3 frases curtas.'
].join(' ');
```

- [ ] **Step 4: Rodar o teste do fallback e o teste do fluxo principal**

Run: `node --test functions/test/handleAssistantMessage.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add functions/src/assistant/geminiClient.js functions/src/assistant/fallbacks.js functions/src/assistant/handleAssistantMessage.js functions/test/handleAssistantMessage.test.js
git commit -m "fix: restrict assistant faq generation to safe backend prompts"
```

### Task 5: Verificar a integracao com o chat atual e a navegacao `Abrir no Guia`

**Files:**
- Modify: `src/components/AssistantScreen.jsx`
- Modify: `src/services/assistantService.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Conferir se a UI ja renderiza o contrato estruturado atual sem depender de memoria**

```js
setMessages(prev => [...prev, {
  role: 'assistant',
  type: response.type,
  text: response.message,
  guideAction: response.guideAction,
  missingFields: response.missingFields,
  usage: response.usage
}]);
```

- [ ] **Step 2: Ajustar a normalizacao no client para nunca quebrar a tela com payload parcial**

```js
function normalizeAssistantResponse(response) {
  return {
    type: response?.type || 'error',
    message: response?.message || FALLBACK_ERROR_RESPONSE.message,
    guideAction: response?.guideAction || null,
    missingFields: Array.isArray(response?.missingFields) ? response.missingFields : [],
    usage: response?.usage || null
  };
}
```

- [ ] **Step 3: Confirmar o fluxo interno de navegacao no `App.jsx`**

```js
onOpenGuide={(guideAction) => {
  setGuidePrefill(guideAction);
  setCurrentView('guide');
}}
```

- [ ] **Step 4: Rodar build beta para garantir que o app monta com o backend atual**

Run: `npm run build:beta`
Expected: build concluido com saida em `dist/app-beta`

- [ ] **Step 5: Commit**

```bash
git add src/components/AssistantScreen.jsx src/services/assistantService.js src/App.jsx
git commit -m "fix: connect assistant chat to secure backend flow"
```

### Task 6: Validacao manual ponta a ponta do corte minimo

**Files:**
- No code changes required unless issues are found

- [ ] **Step 1: Rodar os testes unitarios dos functions**

Run: `node --test functions/test/*.test.js`
Expected: PASS

- [ ] **Step 2: Subir o app local e testar o FAQ em escopo**

Run: `npm run dev -- --host localhost`
Expected: abrir o app e responder uma pergunta como `O que e a Koche?`

- [ ] **Step 3: Testar consulta valida do guia e CTA**

Manual input: `Qual o fluido do Toyota Corolla 2018 2.0 automatico?`
Expected: resposta `guide_match` e botao `Abrir no Guia`

- [ ] **Step 4: Testar consulta incompleta, fora de escopo e bloqueio por limite**

Manual inputs:
- `Qual o fluido do Corolla automatico?`
- `Me ajuda com marketing digital?`
- conta com limite zerado ou desabilitada no admin

Expected:
- `ask_missing_fields`
- `out_of_scope`
- `usage_blocked`

- [ ] **Step 5: Verificar Firestore e registrar evidencias antes de encerrar**

Check collections:
- `assistant_logs`
- `assistant_usage_periods`
- `assistant_user_settings`

Expected:
- novos logs e contadores atualizados
- nenhuma escrita em `vehicles`

## Self-Review

- Cobertura do spec: o plano cobre chat, backend seguro, limites, logs, CTA `Abrir no Guia`, escopo restrito e protecao de `vehicles` como somente leitura.
- Placeholder scan: sem `TODO`, `TBD` ou referencias vagas; cada task aponta arquivos e comandos.
- Consistencia: `handleAssistantMessage`, `lookupVehicle`, `guideAction`, `assistant_logs` e `assistant_usage_periods` usam os mesmos nomes do spec e do codigo atual.
