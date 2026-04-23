import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const FALLBACK_ERROR_RESPONSE = {
    type: 'error',
    message: 'O assistente virtual nao conseguiu responder agora. Tente novamente em instantes ou consulte o Guia de Transmissao.',
    guideAction: null,
    missingFields: [],
    usage: null
};

function normalizeMessage(message) {
    return typeof message === 'string' && message.trim()
        ? message
        : FALLBACK_ERROR_RESPONSE.message;
}

function normalizeGuideAction(guideAction) {
    if (!guideAction || typeof guideAction !== 'object') {
        return null;
    }

    const requiredFields = ['vehicleId', 'brand', 'model', 'year', 'engine'];
    const normalizedFields = Object.fromEntries(requiredFields.map((field) => {
        const value = guideAction[field];
        return [field, typeof value === 'string' ? value.trim() : ''];
    }));
    const hasRequiredFields = requiredFields.every((field) => normalizedFields[field]);

    if (!hasRequiredFields) {
        return null;
    }

    return {
        vehicleId: normalizedFields.vehicleId,
        brand: normalizedFields.brand,
        model: normalizedFields.model,
        year: normalizedFields.year,
        engine: normalizedFields.engine,
        label: typeof guideAction.label === 'string' && guideAction.label.trim() ? guideAction.label : null
    };
}

function normalizeAssistantResponse(response) {
    if (!response || typeof response !== 'object') {
        return FALLBACK_ERROR_RESPONSE;
    }

    return {
        type: typeof response.type === 'string' && response.type.trim() ? response.type : 'error',
        message: normalizeMessage(response.message),
        guideAction: normalizeGuideAction(response.guideAction),
        missingFields: Array.isArray(response.missingFields) ? response.missingFields : [],
        usage: response.usage && typeof response.usage === 'object' ? response.usage : null
    };
}

export async function sendAssistantMessage(message) {
    try {
        const callable = httpsCallable(functions, 'handleAssistantMessage');
        const result = await callable({ message });
        return normalizeAssistantResponse(result.data);
    } catch (error) {
        console.error('Assistant function error:', error);
        return normalizeAssistantResponse(FALLBACK_ERROR_RESPONSE);
    }
}
