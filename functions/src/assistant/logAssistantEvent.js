function normalizeText(value) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeCount(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return 0;
  }

  return normalized;
}

function normalizeObject(value) {
  return value && typeof value === 'object' ? value : null;
}

async function logAssistantEvent(db, payload) {
  await db.collection('assistant_logs').add({
    createdAt: new Date(),
    uid: normalizeText(payload?.uid),
    email: normalizeText(payload?.email),
    userMessage: normalizeText(payload?.userMessage),
    assistantMessage: normalizeText(payload?.assistantMessage),
    status: normalizeText(payload?.status),
    reason: normalizeText(payload?.reason),
    intent: normalizeText(payload?.intent),
    vehicleQuery: normalizeObject(payload?.vehicleQuery),
    matchedVehicleId: normalizeText(payload?.matchedVehicleId),
    matchedVehicleSummary: normalizeObject(payload?.matchedVehicleSummary),
    openGuidePayload: normalizeObject(payload?.openGuidePayload),
    inputTokens: normalizeCount(payload?.inputTokens),
    outputTokens: normalizeCount(payload?.outputTokens),
    totalTokens: normalizeCount(payload?.totalTokens),
    ip: normalizeText(payload?.ip),
    userAgent: normalizeText(payload?.userAgent)
  });
}

module.exports = {
  logAssistantEvent
};
