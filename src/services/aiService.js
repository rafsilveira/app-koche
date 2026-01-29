import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
// IMPORTANT: You need to add VITE_GEMINI_API_KEY to your .env file
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    // Fallback to gemini-pro if flash is not available for this key
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
}

/**
 * Sends a message to the AI assistant along with the vehicle database context.
 * @param {string} userMessage - The user's natural language query.
 * @param {Array} database - The full vehicle database.
 * @returns {Promise<Object>} - Structured response { message, action, target, troubleshooting }
 */
export async function sendMessageToAI(userMessage, database) {
    if (!API_KEY || !model) {
        return {
            message: "Erro: Chave de API do Google Gemini não configurada. Por favor, configure VITE_GEMINI_API_KEY no arquivo .env.",
            action: null
        };
    }

    // Optimize context: Convert DB to a lightweight string
    // We only need Brand, Model, Year, Engine and maybe Transmission to identify the car.
    // We don't need the full image URLs in the context to save tokens, but Gemini 1.5 has a huge window so it's fine.
    const contextString = JSON.stringify(database.map(d => ({
        b: d.brand,
        m: d.model,
        y: d.year,
        e: d.engine,
        oil: d.fluid, // Helpful for troubleshooting "low oil"
        trans: d.transmission
    })));

    const systemPrompt = `
    You are an expert vehicle transmission mechanic assistant for the "Kóche Guia" app.
    
    YOUR GOAL:
    1. Identify if the user wants to FIND a vehicle or solve a PROBLEM.
    2. If finding a vehicle, key match against the provided DATABASE.
    3. If solving a problem, provide brief technical advice.

    DATABASE:
    ${contextString}

    INSTRUCTIONS:
    - Respond in Brazilian Portuguese.
    - Output MUST be valid JSON.
    - Format: { "message": "string", "action": "SELECT_VEHICLE" | null, "target": { "brand": "...", "model": "...", "year": "...", "engine": "..." } | null }
    - If you find a vehicle match, set action to "SELECT_VEHICLE" and fill "target" EXACTLY as it appears in the database.
    - If multiple matches, ask for clarification in "message".
    - If the user asks about a problem (e.g., "doesn't shift", "slipping"), explain potential causes (fluid level, air, solenoid) in "message" and set action to null.
  `;

    try {
        const result = await model.generateContent([
            systemPrompt,
            `User says: "${userMessage}"`
        ]);

        const responseText = result.response.text();

        // Clean code blocks if present
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);

    } catch (error) {
        console.error("AI Error:", error);
        return {
            message: "Desculpe, tive um problema ao processar sua solicitação. Tente novamente.",
            action: null
        };
    }
}
