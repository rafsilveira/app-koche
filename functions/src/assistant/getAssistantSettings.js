const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  dailyRequestLimit: 15,
  monthlyRequestLimit: 200,
  dailyTokenLimit: 12000,
  monthlyTokenLimit: 120000,
  fallbackLimitMessage: 'Seu limite atual do assistente foi atingido. Consulte o Guia de Transmissao ou entre em contato com a Koche para suporte.'
});

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function normalizeLimit(value, fallback) {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return fallback;
  }

  return Math.floor(normalized);
}

function normalizeMessage(value, fallback) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

async function getAssistantSettings(db, uid) {
  const globalRef = db.collection('assistant_global_settings').doc('default');
  const userRef = db.collection('assistant_user_settings').doc(uid);

  const [globalSnapshot, userSnapshot] = await Promise.all([
    globalRef.get(),
    userRef.get()
  ]);

  const globalData = globalSnapshot.exists ? globalSnapshot.data() : {};
  const userData = userSnapshot.exists ? userSnapshot.data() : {};

  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...globalData,
    ...userData
  };

  return {
    enabled: normalizeBoolean(mergedSettings.enabled, DEFAULT_SETTINGS.enabled),
    dailyRequestLimit: normalizeLimit(mergedSettings.dailyRequestLimit, DEFAULT_SETTINGS.dailyRequestLimit),
    monthlyRequestLimit: normalizeLimit(mergedSettings.monthlyRequestLimit, DEFAULT_SETTINGS.monthlyRequestLimit),
    dailyTokenLimit: normalizeLimit(mergedSettings.dailyTokenLimit, DEFAULT_SETTINGS.dailyTokenLimit),
    monthlyTokenLimit: normalizeLimit(mergedSettings.monthlyTokenLimit, DEFAULT_SETTINGS.monthlyTokenLimit),
    fallbackLimitMessage: normalizeMessage(mergedSettings.fallbackLimitMessage, DEFAULT_SETTINGS.fallbackLimitMessage)
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  getAssistantSettings
};
