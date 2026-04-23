const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { handleAssistantMessage } = require('./assistant/handleAssistantMessage');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.handleAssistantMessage = onCall({ secrets: [geminiApiKey] }, async (request) => {
  try {
    return await handleAssistantMessage({
      db,
      auth: request.auth,
      data: request.data,
      rawRequest: request.rawRequest,
      geminiApiKey: geminiApiKey.value()
    });
  } catch (error) {
    if (error.message === 'unauthenticated') {
      throw new HttpsError('unauthenticated', 'Usuario nao autenticado.');
    }

    console.error('handleAssistantMessage failed', error);
    throw new HttpsError('internal', 'Nao foi possivel processar a mensagem do assistente.');
  }
});
