// Progresso do curso no Firestore: users/{uid}.curso = { aulas: { aulaId: { segundos, duracao, concluidaEm } }, atualizadoEm }.
// Cada usuário escreve só o próprio documento (firestore.rules já permite). Merge profundo: uma aula nunca apaga a outra.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function carregarProgresso(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    const curso = snap.exists() ? snap.data().curso : null;
    return curso && typeof curso === 'object' ? { aulas: {}, ...curso } : { aulas: {} };
}

export async function salvarAula(uid, aulaId, dados) {
    await setDoc(doc(db, 'users', uid), { curso: { aulas: { [aulaId]: dados }, atualizadoEm: new Date().toISOString() } }, { merge: true });
}

/** Resultado do teste final: nota, tentativas e a aprovação (só grava aprovadoEm na primeira aprovação). */
export async function salvarTeste(uid, dados) {
    await setDoc(doc(db, 'users', uid), { curso: { teste: dados, atualizadoEm: new Date().toISOString() } }, { merge: true });
}

export async function marcarEventoEnviado(uid) {
    await setDoc(doc(db, 'users', uid), { curso: { teste: { eventoEnviadoEm: new Date().toISOString() } } }, { merge: true });
}
