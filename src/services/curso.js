// Regras do curso — sem React e sem Firestore, para serem testáveis (src/services/curso.test.js).
// Decisões de Rafael (25/Set/2026): as aulas ficam no YouTube; só abre a próxima depois de concluir
// a anterior; "concluída" = 90% do tempo do vídeo realmente assistido (arrastar a barra não conta).

export const AULAS = [
    { id: 'aula1', numero: 1, titulo: 'Aula 1 · Teórica', descricao: 'Fundamentos e conceitos básicos.', videoId: 'tD9ieJkbQec' },
    { id: 'aula2', numero: 2, titulo: 'Aula 2 · Prática: Pajero TR4 2008', descricao: 'Procedimentos práticos de troca.', videoId: 'gYYSNlaZB9Q' },
    { id: 'aula3', numero: 3, titulo: 'Aula 3 · Prática: Honda HR-V 2021', descricao: 'Continuação dos procedimentos práticos.', videoId: 'Be0NA8uHS64' },
];

export const LIMIAR_CONCLUSAO = 0.9;   // fração do vídeo assistida para contar como concluída
export const SALTO_MAXIMO = 2.5;       // segundos entre duas leituras; acima disso foi busca na barra, não assistir
export const TESTE_DISPONIVEL = true;  // teste final (src/services/teste.js), desde 25/Set/2026

export const thumb = (videoId) => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

/** Soma ao acumulado só o que foi assistido de verdade: avanço pequeno e positivo entre duas leituras do player. */
export function somarAssistido(acumulado, delta) {
    if (!(delta > 0) || delta > SALTO_MAXIMO) return acumulado;
    return acumulado + delta;
}

export function concluida(segundos, duracao) {
    return duracao > 0 && segundos >= duracao * LIMIAR_CONCLUSAO;
}

export function estaConcluida(progresso, aulaId) {
    return Boolean(progresso?.aulas?.[aulaId]?.concluidaEm);
}

/** A aula de índice i está liberada se é a primeira ou se a anterior foi concluída. */
export function liberada(progresso, indice) {
    if (indice <= 0) return true;
    return estaConcluida(progresso, AULAS[indice - 1].id);
}

export function concluidas(progresso) {
    return AULAS.filter((a) => estaConcluida(progresso, a.id)).length;
}

export function cursoConcluido(progresso) {
    return concluidas(progresso) === AULAS.length;
}

export function percentualCurso(progresso) {
    return Math.round((100 * concluidas(progresso)) / AULAS.length);
}

/** Percentual assistido de uma aula: 100 se concluída; senão proporção do tempo, nunca 100 sem conclusão. */
export function percentualAula(progresso, aulaId) {
    const p = progresso?.aulas?.[aulaId];
    if (!p) return 0;
    if (p.concluidaEm) return 100;
    if (!(p.duracao > 0)) return 0;
    return Math.min(99, Math.round((100 * (p.segundos || 0)) / p.duracao));
}

/** Primeira aula liberada e ainda não concluída — a que o aluno deve abrir. */
export function proximaAula(progresso) {
    return AULAS.find((a, i) => liberada(progresso, i) && !estaConcluida(progresso, a.id)) || null;
}

export function testeAprovado(progresso) {
    return Boolean(progresso?.teste?.aprovadoEm);
}
