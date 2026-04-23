const { GoogleGenerativeAI } = require('@google/generative-ai');

function estimateTokensFromText(text) {
  return Math.max(1, Math.ceil(String(text || '').length / 4));
}

function sanitizeModelText(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

function buildPrompt({ systemInstruction, userMessage, guideContext }) {
  const promptSections = [
    String(systemInstruction || '').trim(),
    `Pergunta: ${String(userMessage || '').trim()}`
  ];

  if (guideContext) {
    promptSections.push(`Contexto: ${String(guideContext).trim()}`);
  }

  return promptSections.filter(Boolean).join('\n');
}

function createGeminiClient(apiKey) {
  const normalizedApiKey = String(apiKey || '').trim();

  if (!normalizedApiKey) {
    return {
      available: false,
      async generateAnswer() {
        throw new Error('GEMINI_API_KEY is not configured.');
      }
    };
  }

  const genAI = new GoogleGenerativeAI(normalizedApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  return {
    available: true,
    async generateAnswer({ systemInstruction, userMessage, guideContext }) {
      const prompt = buildPrompt({ systemInstruction, userMessage, guideContext });
      const result = await model.generateContent(prompt);
      const text = sanitizeModelText(result.response.text());

      if (!text) {
        throw new Error('Empty Gemini response.');
      }

      return {
        text,
        usage: {
          inputTokens: estimateTokensFromText(prompt),
          outputTokens: estimateTokensFromText(text)
        }
      };
    }
  };
}

module.exports = {
  createGeminiClient,
  estimateTokensFromText,
  sanitizeModelText
};
