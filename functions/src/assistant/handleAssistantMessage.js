const { classifyIntent } = require('./classifyIntent');
const { validateAssistantResponse } = require('./responseValidators');
const { createOutOfScopeFallback, createUsageBlockedFallback, createFaqFallback, createErrorFallback } = require('./fallbacks');
const { getAssistantSettings } = require('./getAssistantSettings');
const { enforceUsageLimits } = require('./enforceUsageLimits');
const { updateUsageCounters } = require('./updateUsageCounters');
const { logAssistantEvent } = require('./logAssistantEvent');
const { createGeminiClient, estimateTokensFromText } = require('./geminiClient');
const { lookupVehicle } = require('./vehicleLookup');

const FAQ_SYSTEM_INSTRUCTION = [
  'Voce responde apenas sobre a Koche Automotiva, seus produtos, catalogo e uso do Guia de Transmissao.',
  'Nao responda sobre temas fora desse escopo.',
  'Se a pergunta fugir do escopo, recuse de forma objetiva.',
  'Responda em portugues do Brasil, com no maximo 3 frases curtas.'
].join(' ');

function getRequestMetadata(rawRequest) {
  const headers = rawRequest?.headers || {};

  return {
    ip: rawRequest?.ip || headers['x-forwarded-for'] || null,
    userAgent: headers['user-agent'] || null
  };
}

function buildGuideMatchResponse(vehicle) {
  return {
    type: 'guide_match',
    message: `Encontrei um resultado compativel para ${vehicle.brand} ${vehicle.model} ${vehicle.year} ${vehicle.engine}.`,
    guideAction: {
      label: 'Abrir no Guia',
      vehicleId: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      engine: vehicle.engine
    }
  };
}

function buildMissingFieldsResponse(missingFields) {
  const fieldLabels = {
    brand: 'marca',
    model: 'modelo',
    year: 'ano',
    engine: 'motor'
  };

  return {
    type: 'ask_missing_fields',
    message: `Para localizar o veiculo no Guia de Transmissao, preciso que voce informe: ${missingFields.map((field) => fieldLabels[field] || field).join(', ')}. Nao guardo contexto entre mensagens, entao envie tudo novamente em uma unica mensagem com os dados completos do veiculo.`,
    missingFields
  };
}

async function handleAssistantMessage({ db, auth, data, rawRequest, geminiApiKey }) {
  if (!auth?.uid) {
    throw new Error('unauthenticated');
  }

  const userMessage = String(data?.message || '').trim();
  if (!userMessage) {
    return createErrorFallback();
  }

  const requestMetadata = getRequestMetadata(rawRequest);
  const settings = await getAssistantSettings(db, auth.uid);
  const estimatedInputTokens = estimateTokensFromText(userMessage);
  const limitState = await enforceUsageLimits(db, auth.uid, settings, estimatedInputTokens);

  if (!limitState.allowed) {
    const blockedResponse = createUsageBlockedFallback(settings.fallbackLimitMessage);
    await logAssistantEvent(db, {
      uid: auth.uid,
      email: auth.token?.email || null,
      userMessage,
      assistantMessage: blockedResponse.message,
      status: blockedResponse.type,
      reason: limitState.reason,
      intent: 'usage_blocked',
      vehicleQuery: null,
      matchedVehicleId: null,
      matchedVehicleSummary: null,
      openGuidePayload: null,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      ip: requestMetadata.ip,
      userAgent: requestMetadata.userAgent
    });
    return blockedResponse;
  }

  const intentResult = classifyIntent(userMessage);
  let candidateResponse;
  let usage = { inputTokens: 0, outputTokens: 0 };
  let lookupResult = null;

  if (intentResult.intent === 'out_of_scope') {
    candidateResponse = createOutOfScopeFallback();
  } else if (intentResult.intent === 'guide_lookup') {
    lookupResult = await lookupVehicle(db, userMessage);

    if (lookupResult.status === 'missing_fields') {
      candidateResponse = buildMissingFieldsResponse(lookupResult.missingFields);
    } else if (lookupResult.status === 'no_match') {
      candidateResponse = {
        type: 'no_match',
        message: 'Nao encontrei um resultado compativel no banco de dados do Guia de Transmissao com as informacoes fornecidas.'
      };
    } else {
      candidateResponse = buildGuideMatchResponse(lookupResult.vehicle);
    }
  } else {
    const geminiClient = createGeminiClient(geminiApiKey);
    if (!geminiClient.available) {
      candidateResponse = createFaqFallback();
    } else {
      try {
        const geminiResult = await geminiClient.generateAnswer({
          systemInstruction: FAQ_SYSTEM_INSTRUCTION,
          userMessage,
          guideContext: null
        });

        usage = geminiResult.usage;
        candidateResponse = {
          type: 'faq',
          message: geminiResult.text
        };
      } catch (_error) {
        candidateResponse = createFaqFallback();
      }
    }
  }

  const validation = validateAssistantResponse(candidateResponse);
  const response = validation.ok
    ? candidateResponse
    : (candidateResponse?.type === 'faq' ? createFaqFallback() : createErrorFallback());

  await updateUsageCounters(limitState, usage);
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
    ip: requestMetadata.ip,
    userAgent: requestMetadata.userAgent
  });

  return {
    ...response,
    usage: {
      dailyRemaining: Math.max(0, Number(settings.dailyRequestLimit || 0) - limitState.dailyUsage.data.requestCount),
      monthlyRemaining: Math.max(0, Number(settings.monthlyRequestLimit || 0) - limitState.monthlyUsage.data.requestCount)
    }
  };
}

module.exports = {
  handleAssistantMessage
};
