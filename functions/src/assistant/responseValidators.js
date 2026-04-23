const { ASSISTANT_RESPONSE_TYPES } = require('./types');
const { GUIDE_HINTS, FAQ_HINTS, OUT_OF_SCOPE_HINTS, normalizeText, includesAny } = require('./scopeRules');

const FAQ_SCOPE_HINTS = [
  ...FAQ_HINTS,
  ...GUIDE_HINTS,
  'transmissao',
  'suporte',
  'contato',
  'atendimento',
  'cliente'
];

function validateFaqResponseMessage(message) {
  const trimmedMessage = String(message || '').trim();
  const normalizedMessage = normalizeText(trimmedMessage);
  const sentenceCount = (trimmedMessage.match(/[.!?]+/g) || []).length;

  if (trimmedMessage.length > 280 || sentenceCount > 3) {
    return {
      ok: false,
      reason: 'FAQ response exceeded the safe length limit.'
    };
  }

  if (includesAny(normalizedMessage, OUT_OF_SCOPE_HINTS)) {
    return {
      ok: false,
      reason: 'FAQ response appears to be out of scope.'
    };
  }

  if (!includesAny(normalizedMessage, FAQ_SCOPE_HINTS)) {
    return {
      ok: false,
      reason: 'FAQ response is missing clear Koche or guide scope signals.'
    };
  }

  return {
    ok: true,
    reason: null
  };
}

function validateAssistantResponse(response) {
  if (!response || typeof response !== 'object') {
    return {
      ok: false,
      reason: 'Response must be an object.'
    };
  }

  if (!ASSISTANT_RESPONSE_TYPES.includes(response.type)) {
    return {
      ok: false,
      reason: 'Response type is not supported.'
    };
  }

  if (!response.message || typeof response.message !== 'string') {
    return {
      ok: false,
      reason: 'Response message must be a non-empty string.'
    };
  }

  if (response.type === 'guide_match') {
    const guideAction = response.guideAction;
    if (!guideAction || typeof guideAction !== 'object') {
      return {
        ok: false,
        reason: 'guideAction is required for guide_match responses.'
      };
    }

    const requiredFields = ['label', 'vehicleId', 'brand', 'model', 'year', 'engine'];
    const missing = requiredFields.filter((field) => !guideAction[field]);

    if (missing.length > 0) {
      return {
        ok: false,
        reason: `guideAction is missing required fields: ${missing.join(', ')}.`
      };
    }
  }

  if (response.type === 'faq') {
    return validateFaqResponseMessage(response.message);
  }

  return {
    ok: true,
    reason: null
  };
}

module.exports = {
  validateAssistantResponse
};
