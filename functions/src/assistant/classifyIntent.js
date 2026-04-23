const {
  GUIDE_HINTS,
  FAQ_HINTS,
  OUT_OF_SCOPE_HINTS,
  normalizeText,
  includesAny
} = require('./scopeRules');

function classifyIntent(message) {
  const text = normalizeText(message);
  const hasFaqHint = includesAny(text, FAQ_HINTS);
  const hasGuideHint = includesAny(text, GUIDE_HINTS);
  const hasStrongGuideSignal = includesAny(text, ['fluido', 'oleo', 'óleo', 'guia'])
    || /\b(19\d{2}|20\d{2}|\d\.\d)\b/.test(text);

  if (!text) {
    return {
      intent: 'out_of_scope',
      requiresGuideLookup: false
    };
  }

  if (includesAny(text, OUT_OF_SCOPE_HINTS)) {
    return {
      intent: 'out_of_scope',
      requiresGuideLookup: false
    };
  }

  if (hasFaqHint && !hasStrongGuideSignal) {
    return {
      intent: 'faq',
      requiresGuideLookup: false
    };
  }

  if (hasGuideHint) {
    return {
      intent: 'guide_lookup',
      requiresGuideLookup: true
    };
  }

  if (hasFaqHint) {
    return {
      intent: 'faq',
      requiresGuideLookup: false
    };
  }

  return {
    intent: 'out_of_scope',
    requiresGuideLookup: false
  };
}

module.exports = {
  classifyIntent
};
