import { db } from './firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export const DEFAULT_ASSISTANT_SETTINGS = Object.freeze({
    enabled: true,
    dailyRequestLimit: 15,
    monthlyRequestLimit: 200,
    dailyTokenLimit: 12000,
    monthlyTokenLimit: 120000,
});

export async function getAssistantUserSettings(uid) {
    const userRef = doc(db, 'assistant_user_settings', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return {
            ...DEFAULT_ASSISTANT_SETTINGS,
            exists: false,
        };
    }

    return {
        ...DEFAULT_ASSISTANT_SETTINGS,
        ...snapshot.data(),
        exists: true,
    };
}

export async function saveAssistantUserSettings({ uid, email, settings, updatedBy }) {
    const userRef = doc(db, 'assistant_user_settings', uid);

    await setDoc(userRef, {
        ...settings,
        email: email || null,
        updatedBy: updatedBy || null,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}
