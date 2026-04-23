function createPeriodKey(date, periodType) {
  const iso = date.toISOString();
  if (periodType === 'daily') {
    return iso.slice(0, 10);
  }

  return iso.slice(0, 7);
}

function normalizeUsageCount(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return 0;
  }

  return normalized;
}

function normalizeUsageData(uid, periodType, periodKey, data) {
  return {
    uid,
    periodType,
    periodKey,
    requestCount: normalizeUsageCount(data?.requestCount),
    inputTokens: normalizeUsageCount(data?.inputTokens),
    outputTokens: normalizeUsageCount(data?.outputTokens),
    totalTokens: normalizeUsageCount(data?.totalTokens),
    lastRequestAt: data?.lastRequestAt || null
  };
}

function getUsageRecordRef(db, uid, periodType, now) {
  const periodKey = createPeriodKey(now, periodType);
  const docId = `${uid}_${periodType}_${periodKey}`;
  const collection = db.collection('assistant_usage_periods');
  const ref = collection.doc(docId);

  return {
    ref,
    docId,
    periodKey
  };
}

async function getUsageRecord(db, uid, periodType, now) {
  const usageRecordRef = getUsageRecordRef(db, uid, periodType, now);
  const snapshot = await usageRecordRef.ref.get();

  return {
    ...usageRecordRef,
    data: normalizeUsageData(uid, periodType, usageRecordRef.periodKey, snapshot.exists ? snapshot.data() : null)
  };
}

function createTransactionRunner(db) {
  if (typeof db.runTransaction === 'function') {
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

function reserveUsageData(usageData, estimatedInputTokens, now) {
  return {
    ...usageData,
    requestCount: usageData.requestCount + 1,
    inputTokens: usageData.inputTokens + estimatedInputTokens,
    totalTokens: usageData.totalTokens + estimatedInputTokens,
    lastRequestAt: now
  };
}

async function enforceUsageLimits(db, uid, settings, estimatedInputTokens = 0) {
  const now = new Date();
  const normalizedEstimate = normalizeUsageCount(estimatedInputTokens);

  if (settings.enabled === false) {
    const [dailyUsage, monthlyUsage] = await Promise.all([
      getUsageRecord(db, uid, 'daily', now),
      getUsageRecord(db, uid, 'monthly', now)
    ]);

    return {
      allowed: false,
      reason: 'assistant_disabled',
      dailyUsage,
      monthlyUsage,
      reservedInputTokens: 0,
      db
    };
  }

  const runTransaction = createTransactionRunner(db);

  return runTransaction(async (transaction) => {
    const dailyUsageRef = getUsageRecordRef(db, uid, 'daily', now);
    const monthlyUsageRef = getUsageRecordRef(db, uid, 'monthly', now);
    const [dailySnapshot, monthlySnapshot] = await Promise.all([
      transaction.get(dailyUsageRef.ref),
      transaction.get(monthlyUsageRef.ref)
    ]);

    const dailyUsage = {
      ...dailyUsageRef,
      data: normalizeUsageData(uid, 'daily', dailyUsageRef.periodKey, dailySnapshot.exists ? dailySnapshot.data() : null)
    };
    const monthlyUsage = {
      ...monthlyUsageRef,
      data: normalizeUsageData(uid, 'monthly', monthlyUsageRef.periodKey, monthlySnapshot.exists ? monthlySnapshot.data() : null)
    };

    if (dailyUsage.data.requestCount >= settings.dailyRequestLimit) {
      return {
        allowed: false,
        reason: 'daily_request_limit',
        dailyUsage,
        monthlyUsage,
        reservedInputTokens: 0,
        db
      };
    }

    if (monthlyUsage.data.requestCount >= settings.monthlyRequestLimit) {
      return {
        allowed: false,
        reason: 'monthly_request_limit',
        dailyUsage,
        monthlyUsage,
        reservedInputTokens: 0,
        db
      };
    }

    if ((dailyUsage.data.totalTokens + normalizedEstimate) > settings.dailyTokenLimit) {
      return {
        allowed: false,
        reason: 'daily_token_limit',
        dailyUsage,
        monthlyUsage,
        reservedInputTokens: 0,
        db
      };
    }

    if ((monthlyUsage.data.totalTokens + normalizedEstimate) > settings.monthlyTokenLimit) {
      return {
        allowed: false,
        reason: 'monthly_token_limit',
        dailyUsage,
        monthlyUsage,
        reservedInputTokens: 0,
        db
      };
    }

    const reservedDailyUsage = {
      ...dailyUsage,
      data: reserveUsageData(dailyUsage.data, normalizedEstimate, now)
    };
    const reservedMonthlyUsage = {
      ...monthlyUsage,
      data: reserveUsageData(monthlyUsage.data, normalizedEstimate, now)
    };

    transaction.set(reservedDailyUsage.ref, reservedDailyUsage.data, { merge: true });
    transaction.set(reservedMonthlyUsage.ref, reservedMonthlyUsage.data, { merge: true });

    return {
      allowed: true,
      reason: null,
      dailyUsage: reservedDailyUsage,
      monthlyUsage: reservedMonthlyUsage,
      reservedInputTokens: normalizedEstimate,
      db
    };
  });
}

module.exports = {
  enforceUsageLimits,
  normalizeUsageCount,
  normalizeUsageData
};
