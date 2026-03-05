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

    // Improve context optimization: 
    // If the message is short, we might be looking for a car.
    // If it's long, it might be a troubleshooting question.
    const contextString = JSON.stringify(database.map(d => ({
        b: d.brand,
        m: d.model,
        y: d.year,
        e: d.engine,
        oil: d.fluid,
        trans: d.transmission,
        part: d.fluid_capacities?.partial_change,
        tot: d.fluid_capacities?.total_capacity
    })));

    const systemPrompt = `
    Você é o Engenheiro Especialista em Transmissões da Kóche Automotiva. 
    Seu papel é auxiliar mecânicos profissionais com informações precisas e técnicas.

    OBJETIVOS:
    1. IDENTIFICAÇÃO DE VEÍCULO: Ajude o mecânico a encontrar o fluido correto, filtro e capacidades.
    2. DIAGNÓSTICO TÉCNICO: Forneça orientações sobre problemas comuns em transmissões automáticas (trancos, patinação, códigos de erro).
    3. PROCEDIMENTO: Explique brevemente como verificar o nível ou realizar a troca se solicitado.

    DADOS DISPONÍVEIS (DATABASE):
    ${contextString}

    REGRAS DE RESPOSTA:
    - Responda SEMPRE em Português Brasileiro, de forma profissional e direta.
    - Use Markdown para formatar tabelas ou listas se necessário na sua mensagem.
    - O retorno DEVE ser um objeto JSON puro, sem blocos de código markdown.
    - Se encontrar o veículo, defina "action" como "SELECT_VEHICLE" e preencha "target" com os dados exatos do banco.
    - Se o usuário perguntar sobre um problema, use seu conhecimento geral de transmissões automáticas para dar uma dica técnica valiosa antes de sugerir verificar o fluido.

    FORMATO JSON DE SAÍDA:
    {
      "message": "Sua resposta textual aqui (pode conter markdown)",
      "action": "SELECT_VEHICLE" | null,
      "target": { "brand": "...", "model": "...", "year": "...", "engine": "..." } | null
    }
    `;

    try {
        const result = await model.generateContent([
            systemPrompt,
            `Mecânico pergunta: "${userMessage}"`
        ]);

        const responseText = result.response.text();

        // Robust JSON extraction
        let cleanText = responseText;
        if (cleanText.includes('{')) {
            cleanText = cleanText.substring(cleanText.indexOf('{'), cleanText.lastIndexOf('}') + 1);
        }

        return JSON.parse(cleanText);

    } catch (error) {
        console.error("AI Error:", error);
        return {
            message: "Desculpe, tive um problema técnico ao processar seu diagnóstico. Por favor, tente novamente ou verifique sua conexão.",
            action: null
        };
    }
}
