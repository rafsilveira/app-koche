const test = require('node:test');
const assert = require('node:assert/strict');

function createVehiclesCollection(vehicles) {
  const filters = [];

  return {
    where(field, operator, value) {
      filters.push({ field, operator, value });
      return this;
    },
    limit(value) {
      assert.equal(value, 2);
      return this;
    },
    async get() {
      const matchedVehicles = vehicles.filter((vehicle) => filters.every(({ field, operator, value }) => {
        assert.equal(operator, '==');
        return String(vehicle[field] || '') === String(value || '');
      }));

      return {
        empty: matchedVehicles.length === 0,
        docs: matchedVehicles.map((vehicle) => ({
          id: vehicle.id,
          data: () => vehicle
        }))
      };
    }
  };
}

function loadHandleAssistantMessage({ createGeminiClient } = {}) {
  const handleAssistantMessagePath = require.resolve('../src/assistant/handleAssistantMessage');
  const geminiClientPath = require.resolve('../src/assistant/geminiClient');
  const originalGeminiModule = require.cache[geminiClientPath];

  delete require.cache[handleAssistantMessagePath];

  if (createGeminiClient) {
    const geminiModule = require(geminiClientPath);
    require.cache[geminiClientPath] = {
      ...originalGeminiModule,
      exports: {
        ...geminiModule,
        createGeminiClient
      }
    };
  }

  const { handleAssistantMessage } = require('../src/assistant/handleAssistantMessage');

  if (originalGeminiModule) {
    require.cache[geminiClientPath] = originalGeminiModule;
  } else {
    delete require.cache[geminiClientPath];
  }

  delete require.cache[handleAssistantMessagePath];

  return handleAssistantMessage;
}

function createDb({ settings = {}, usage = {}, vehicles = [] } = {}) {
  const writes = [];

  const usageRecords = {
    daily: usage.daily || null,
    monthly: usage.monthly || null
  };

  const db = {
    collection(name) {
      if (name === 'assistant_global_settings' || name === 'assistant_user_settings') {
        return {
          doc(id) {
            const data = name === 'assistant_global_settings' && id === 'default'
              ? settings.global
              : settings.user;

            return {
              get: async () => ({ exists: Boolean(data), data: () => data || {} })
            };
          }
        };
      }

      if (name === 'assistant_usage_periods') {
        return {
          doc(id) {
            const periodType = id.includes('_daily_') ? 'daily' : 'monthly';

            return {
              get: async () => {
                const data = usageRecords[periodType];
                return { exists: Boolean(data), data: () => data || {} };
              },
              set: async (payload) => {
                usageRecords[periodType] = { ...payload };
                writes.push({ name, id, payload });
              }
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
        return createVehiclesCollection(vehicles);
      }

      throw new Error(`Unexpected collection: ${name}`);
    }
  };

  return { db, writes };
}

test('handleAssistantMessage returns guide_match and logs the event', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage();
  const { db, writes } = createDb({
    vehicles: [
      { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
    ]
  });

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'guide_match');
  assert.equal(response.guideAction.vehicleId, 'veh-1');

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'guide_match');
  assert.equal(logEntry.payload.intent, 'guide_lookup');
  assert.equal(logEntry.payload.matchedVehicleId, 'veh-1');
  assert.equal(logEntry.payload.ip, '127.0.0.1');
  assert.equal(logEntry.payload.userAgent, 'node-test');
});

test('handleAssistantMessage blocks by limit before invoking Gemini', async () => {
  let geminiCreateCalls = 0;
  const handleAssistantMessage = loadHandleAssistantMessage({
    createGeminiClient() {
      geminiCreateCalls += 1;
      throw new Error('Gemini should not be called when usage is blocked.');
    }
  });

  const { db, writes } = createDb({
    usage: {
      daily: {
        uid: 'user-1',
        periodType: 'daily',
        periodKey: '2026-04-22',
        requestCount: 15,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        lastRequestAt: null
      }
    }
  });

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Quais produtos da Koche voces oferecem?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: 'test-key'
  });

  assert.equal(response.type, 'usage_blocked');
  assert.equal(geminiCreateCalls, 0);

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'usage_blocked');
  assert.equal(logEntry.payload.reason, 'daily_request_limit');

  const usageWrites = writes.filter((entry) => entry.name === 'assistant_usage_periods');
  assert.equal(usageWrites.length, 0);
});

test('handleAssistantMessage logs out_of_scope responses', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage();
  const { db, writes } = createDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Me passe uma receita de bolo de cenoura' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: 'test-key'
  });

  assert.equal(response.type, 'out_of_scope');

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'out_of_scope');
  assert.equal(logEntry.payload.intent, 'out_of_scope');
  assert.equal(logEntry.payload.assistantMessage, response.message);
});

test('handleAssistantMessage returns safe faq fallback when Gemini is unavailable', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage();
  const { db, writes } = createDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'O que e a Koche?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'error');
  assert.equal(response.message, 'Posso ajudar apenas com informacoes verificadas sobre a Koche e o Guia de Transmissao. No momento, tente reformular sua pergunta ou consulte o Guia de Transmissao.');

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'error');
  assert.equal(logEntry.payload.intent, 'faq');
  assert.equal(logEntry.payload.assistantMessage, response.message);
});

test('handleAssistantMessage returns faq response when Gemini returns valid scoped text', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage({
    createGeminiClient(apiKey) {
      assert.equal(apiKey, 'test-key');

      return {
        available: true,
        async generateAnswer({ systemInstruction, userMessage, guideContext }) {
          assert.match(systemInstruction, /Koche Automotiva/);
          assert.match(systemInstruction, /Guia de Transmissao/);
          assert.equal(userMessage, 'O que e a Koche?');
          assert.equal(guideContext, null);

          return {
            text: 'A Koche Automotiva oferece suporte e orientacoes sobre produtos e o Guia de Transmissao.',
            usage: {
              inputTokens: 12,
              outputTokens: 18
            }
          };
        }
      };
    }
  });
  const { db, writes } = createDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'O que e a Koche?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: 'test-key'
  });

  assert.equal(response.type, 'faq');
  assert.equal(response.message, 'A Koche Automotiva oferece suporte e orientacoes sobre produtos e o Guia de Transmissao.');

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'faq');
  assert.equal(logEntry.payload.intent, 'faq');
  assert.equal(logEntry.payload.inputTokens, 12);
  assert.equal(logEntry.payload.outputTokens, 18);
  assert.equal(logEntry.payload.totalTokens, 30);
});

test('handleAssistantMessage falls back when Gemini returns obviously off-scope faq text', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage({
    createGeminiClient() {
      return {
        available: true,
        async generateAnswer() {
          return {
            text: 'Nao posso ajudar com a Koche agora, mas aqui vai uma receita de bolo de cenoura com cobertura de chocolate.',
            usage: {
              inputTokens: 10,
              outputTokens: 20
            }
          };
        }
      };
    }
  });
  const { db, writes } = createDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'O que e a Koche?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: 'test-key'
  });

  assert.equal(response.type, 'error');
  assert.equal(response.message, 'Posso ajudar apenas com informacoes verificadas sobre a Koche e o Guia de Transmissao. No momento, tente reformular sua pergunta ou consulte o Guia de Transmissao.');

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'error');
  assert.equal(logEntry.payload.intent, 'faq');
});

test('handleAssistantMessage explains that missing-fields retries must include all data again', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage();
  const { db } = createDb({
    vehicles: [
      { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
    ]
  });

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Qual o fluido do Toyota Corolla?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'ask_missing_fields');
  assert.match(response.message, /nao guardo contexto/i);
  assert.match(response.message, /envie tudo novamente/i);
  assert.deepEqual(response.missingFields, ['year', 'engine']);
});

test('handleAssistantMessage returns safe faq fallback when Gemini rejects the request', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage({
    createGeminiClient() {
      return {
        available: true,
        async generateAnswer() {
          throw new Error('Empty Gemini response.');
        }
      };
    }
  });
  const { db, writes } = createDb();

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'O que e a Koche?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: 'test-key'
  });

  assert.equal(response.type, 'error');
  assert.equal(response.message, 'Posso ajudar apenas com informacoes verificadas sobre a Koche e o Guia de Transmissao. No momento, tente reformular sua pergunta ou consulte o Guia de Transmissao.');

  const logEntry = writes.find((entry) => entry.name === 'assistant_logs');
  assert.ok(logEntry);
  assert.equal(logEntry.payload.status, 'error');
  assert.equal(logEntry.payload.intent, 'faq');
  assert.equal(logEntry.payload.inputTokens, 0);
  assert.equal(logEntry.payload.outputTokens, 0);
});

test('handleAssistantMessage ignores invalid limit settings instead of blocking a valid guide match', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage();
  const { db } = createDb({
    settings: {
      global: {
        dailyRequestLimit: '',
        monthlyRequestLimit: null,
        dailyTokenLimit: Number.NaN,
        monthlyTokenLimit: -1
      }
    },
    vehicles: [
      { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
    ]
  });

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'guide_match');
  assert.equal(response.usage.dailyRemaining, 14);
  assert.equal(response.usage.monthlyRemaining, 199);
});

test('handleAssistantMessage normalizes malformed usage records during normal processing', async () => {
  const handleAssistantMessage = loadHandleAssistantMessage();
  const { db, writes } = createDb({
    usage: {
      daily: {
        uid: 'user-1',
        periodType: 'daily',
        periodKey: '2026-04-22',
        requestCount: '',
        inputTokens: 'bad',
        outputTokens: null,
        totalTokens: -50,
        lastRequestAt: null
      },
      monthly: {
        uid: 'user-1',
        periodType: 'monthly',
        periodKey: '2026-04',
        requestCount: Number.NaN,
        inputTokens: undefined,
        outputTokens: 'oops',
        totalTokens: '',
        lastRequestAt: null
      }
    },
    vehicles: [
      { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
    ]
  });

  const response = await handleAssistantMessage({
    db,
    auth: { uid: 'user-1', token: { email: 'user@example.com' } },
    data: { message: 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?' },
    rawRequest: { ip: '127.0.0.1', headers: { 'user-agent': 'node-test' } },
    geminiApiKey: ''
  });

  assert.equal(response.type, 'guide_match');
  assert.equal(response.usage.dailyRemaining, 14);
  assert.equal(response.usage.monthlyRemaining, 199);

  const usageWrites = writes.filter((entry) => entry.name === 'assistant_usage_periods');
  assert.equal(usageWrites.length, 4);
  for (const usageWrite of usageWrites.slice(-2)) {
    assert.equal(usageWrite.payload.requestCount, 1);
    assert.equal(usageWrite.payload.inputTokens, 0);
    assert.equal(usageWrite.payload.outputTokens, 0);
    assert.equal(usageWrite.payload.totalTokens, 0);
  }
});
