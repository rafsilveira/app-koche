const { normalizeUsageCount, normalizeUsageData } = require('./enforceUsageLimits');

function createTransactionRunner(db) {
  if (typeof db?.runTransaction === 'function') {
    return db.runTransaction.bind(db);
  }

  return async (callback) => callback({
    async get(ref) {
      return ref.get();
    },
    set(ref, payload, options) {
      return ref.set(payload, options);
    }
  });
}

async function updateUsageCounters(limitState, usageDelta) {
  const now = new Date();
  const inputTokens = normalizeUsageCount(usageDelta?.inputTokens);
  const outputTokens = normalizeUsageCount(usageDelta?.outputTokens);
  const totalTokens = inputTokens + outputTokens;
  const reservedInputTokens = normalizeUsageCount(limitState?.reservedInputTokens);
  const runTransaction = createTransactionRunner(limitState?.db);

  await runTransaction(async (transaction) => {
    const usageRecords = [limitState.dailyUsage, limitState.monthlyUsage];
    const snapshots = await Promise.all(usageRecords.map((usageRecord) => transaction.get(usageRecord.ref)));

    snapshots.forEach((snapshot, index) => {
      const usageRecord = usageRecords[index];
      const currentUsage = normalizeUsageData(
        usageRecord.data.uid,
        usageRecord.data.periodType,
        usageRecord.data.periodKey,
        snapshot.exists ? snapshot.data() : null
      );

      transaction.set(usageRecord.ref, {
        ...currentUsage,
        inputTokens: Math.max(0, currentUsage.inputTokens - reservedInputTokens + inputTokens),
        outputTokens: currentUsage.outputTokens + outputTokens,
        totalTokens: Math.max(0, currentUsage.totalTokens - reservedInputTokens + totalTokens),
        lastRequestAt: now
      }, { merge: true });
    });
  });
}

module.exports = {
  updateUsageCounters
};
