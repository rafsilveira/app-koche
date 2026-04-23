const test = require('node:test');
const assert = require('node:assert/strict');

const { enforceUsageLimits } = require('../src/assistant/enforceUsageLimits');
const { updateUsageCounters } = require('../src/assistant/updateUsageCounters');

function createUsageDb({ daily = null, monthly = null } = {}) {
  const state = {
    daily,
    monthly
  };
  const writes = [];
  let transactionCount = 0;

  function getPeriodTypeFromId(id) {
    return id.includes('_daily_') ? 'daily' : 'monthly';
  }

  function clone(value) {
    return value ? { ...value } : null;
  }

  function createDocRef(id) {
    return {
      id,
      async get() {
        const periodType = getPeriodTypeFromId(id);
        const data = state[periodType];
        return {
          exists: Boolean(data),
          data: () => clone(data) || {}
        };
      },
      async set(payload) {
        const periodType = getPeriodTypeFromId(id);
        state[periodType] = { ...payload };
        writes.push({ id, payload: clone(payload) });
      }
    };
  }

  return {
    db: {
      collection(name) {
        assert.equal(name, 'assistant_usage_periods');

        return {
          doc(id) {
            return createDocRef(id);
          }
        };
      },
      async runTransaction(callback) {
        transactionCount += 1;

        return callback({
          async get(ref) {
            return ref.get();
          },
          set(ref, payload) {
            const periodType = getPeriodTypeFromId(ref.id);
            state[periodType] = { ...payload };
            writes.push({ id: ref.id, payload: clone(payload), viaTransaction: true });
          }
        });
      }
    },
    getState() {
      return {
        daily: clone(state.daily),
        monthly: clone(state.monthly)
      };
    },
    getTransactionCount() {
      return transactionCount;
    },
    writes
  };
}

const settings = {
  enabled: true,
  dailyRequestLimit: 15,
  monthlyRequestLimit: 200,
  dailyTokenLimit: 12000,
  monthlyTokenLimit: 120000,
  fallbackLimitMessage: 'blocked'
};

test('enforceUsageLimits reserves one request and estimated tokens atomically', async () => {
  const { db, getState, getTransactionCount } = createUsageDb();

  const result = await enforceUsageLimits(db, 'user-1', settings, 11);

  assert.equal(result.allowed, true);
  assert.equal(getTransactionCount(), 1);
  assert.equal(result.dailyUsage.data.requestCount, 1);
  assert.equal(result.dailyUsage.data.inputTokens, 11);
  assert.equal(result.dailyUsage.data.totalTokens, 11);
  assert.equal(result.monthlyUsage.data.requestCount, 1);
  assert.equal(result.monthlyUsage.data.inputTokens, 11);
  assert.equal(result.monthlyUsage.data.totalTokens, 11);

  const usageState = getState();
  assert.equal(usageState.daily.requestCount, 1);
  assert.equal(usageState.daily.inputTokens, 11);
  assert.equal(usageState.daily.totalTokens, 11);
  assert.equal(usageState.monthly.requestCount, 1);
  assert.equal(usageState.monthly.inputTokens, 11);
  assert.equal(usageState.monthly.totalTokens, 11);
});

test('enforceUsageLimits blocks inside the transaction when a request limit is already exhausted', async () => {
  const { db, getState, getTransactionCount, writes } = createUsageDb({
    daily: {
      uid: 'user-1',
      periodType: 'daily',
      periodKey: '2026-04-22',
      requestCount: 15,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      lastRequestAt: null
    },
    monthly: {
      uid: 'user-1',
      periodType: 'monthly',
      periodKey: '2026-04',
      requestCount: 15,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      lastRequestAt: null
    }
  });

  const result = await enforceUsageLimits(db, 'user-1', settings, 4);

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'daily_request_limit');
  assert.equal(getTransactionCount(), 1);
  assert.equal(writes.length, 0);
  assert.equal(getState().daily.requestCount, 15);
});

test('updateUsageCounters finalizes actual usage from the reserved estimate without double-counting requests', async () => {
  const { db, getState, getTransactionCount } = createUsageDb();
  const limitState = await enforceUsageLimits(db, 'user-1', settings, 11);

  await updateUsageCounters(limitState, {
    inputTokens: 12,
    outputTokens: 18
  });

  assert.equal(getTransactionCount(), 2);

  const usageState = getState();
  assert.equal(usageState.daily.requestCount, 1);
  assert.equal(usageState.daily.inputTokens, 12);
  assert.equal(usageState.daily.outputTokens, 18);
  assert.equal(usageState.daily.totalTokens, 30);
  assert.equal(usageState.monthly.requestCount, 1);
  assert.equal(usageState.monthly.inputTokens, 12);
  assert.equal(usageState.monthly.outputTokens, 18);
  assert.equal(usageState.monthly.totalTokens, 30);
});
