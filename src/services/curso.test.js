import { describe, it, expect } from 'vitest';
import { AULAS, somarAssistido, concluida, liberada, estaConcluida, concluidas, cursoConcluido, percentualAula, percentualCurso, proximaAula, SALTO_MAXIMO } from './curso';

describe('somarAssistido', () => {
    it('soma avanço normal de reprodução', () => { expect(somarAssistido(10, 1)).toBe(11); expect(somarAssistido(0, 2.4)).toBe(2.4); });
    it('ignora busca na barra (salto grande) e retrocesso', () => {
        expect(somarAssistido(10, SALTO_MAXIMO + 1)).toBe(10);
        expect(somarAssistido(10, 600)).toBe(10);
        expect(somarAssistido(10, -5)).toBe(10);
        expect(somarAssistido(10, 0)).toBe(10);
        expect(somarAssistido(10, NaN)).toBe(10);
    });
});

describe('concluida', () => {
    it('exige 90% do tempo do vídeo', () => {
        expect(concluida(89, 100)).toBe(false);
        expect(concluida(90, 100)).toBe(true);
        expect(concluida(0, 0)).toBe(false);
    });
});

describe('sequência das aulas', () => {
    const vazio = { aulas: {} };
    const soPrimeira = { aulas: { aula1: { concluidaEm: '2026-09-25T00:00:00Z', segundos: 500, duracao: 520 } } };
    const todas = { aulas: Object.fromEntries(AULAS.map((a) => [a.id, { concluidaEm: 'x', segundos: 1, duracao: 1 }])) };
    it('só a primeira abre no começo', () => {
        expect(liberada(vazio, 0)).toBe(true);
        expect(liberada(vazio, 1)).toBe(false);
        expect(liberada(vazio, 2)).toBe(false);
        expect(proximaAula(vazio).id).toBe('aula1');
    });
    it('concluir a 1 libera a 2, não a 3', () => {
        expect(estaConcluida(soPrimeira, 'aula1')).toBe(true);
        expect(liberada(soPrimeira, 1)).toBe(true);
        expect(liberada(soPrimeira, 2)).toBe(false);
        expect(proximaAula(soPrimeira).id).toBe('aula2');
        expect(concluidas(soPrimeira)).toBe(1);
        expect(percentualCurso(soPrimeira)).toBe(33);
    });
    it('curso concluído quando todas estão concluídas', () => {
        expect(cursoConcluido(todas)).toBe(true);
        expect(proximaAula(todas)).toBeNull();
        expect(percentualCurso(todas)).toBe(100);
    });
    it('progresso sem conclusão nunca chega a 100', () => {
        expect(percentualAula({ aulas: { aula1: { segundos: 999, duracao: 1000 } } }, 'aula1')).toBe(99);
        expect(percentualAula({ aulas: { aula1: { segundos: 250, duracao: 1000 } } }, 'aula1')).toBe(25);
        expect(percentualAula(vazio, 'aula1')).toBe(0);
        expect(percentualAula(soPrimeira, 'aula1')).toBe(100);
    });
});
