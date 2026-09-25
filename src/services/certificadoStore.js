// Registro público do certificado: certificados/{codigo} — quem verifica lê pelo código (sem login); só o próprio aluno
// aprovado cria o seu, uma vez; ninguém edita (firestore.rules). Não guarda telefone nem e-mail.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function buscarCertificado(codigo) {
    const snap = await getDoc(doc(db, 'certificados', codigo));
    return snap.exists() ? { codigo, ...snap.data() } : null;
}

export async function registrarCertificado(d) {
    const existente = await getDoc(doc(db, 'certificados', d.codigo));
    if (existente.exists()) return false;
    await setDoc(doc(db, 'certificados', d.codigo), {
        uid: d.uid, nome: d.nome, curso: d.curso, cargaHoraria: d.cargaHoraria, nota: d.nota, total: d.total, aprovadoEm: d.aprovadoEm, emitidoEm: new Date().toISOString(),
    });
    return true;
}
