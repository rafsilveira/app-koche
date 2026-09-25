import { describe, it, expect } from 'vitest';
import { PERGUNTAS, NOTA_MINIMA, montarProva, corrigir, respondeuTudo } from './teste';

const fixo = () => 0; // embaralha de forma determinística
const prova = montarProva(PERGUNTAS, fixo);
const idxCerta = (p) => p.itens.findIndex((i) => i.certa);
const idxErrada = (p) => p.itens.findIndex((i) => !i.certa);

describe('prova', () => {
    it('tem 5 perguntas com 4 alternativas e exatamente 1 certa cada', () => {
        expect(prova).toHaveLength(5);
        for (const p of prova) {
            expect(p.itens).toHaveLength(4);
            expect(p.itens.filter((i) => i.certa)).toHaveLength(1);
            expect(new Set(p.itens.map((i) => i.texto)).size).toBe(4);
        }
    });
    it('embaralhar não perde nem inventa alternativa', () => {
        const outra = montarProva(PERGUNTAS, () => 0.99);
        prova.forEach((p, k) => {
            expect(new Set(p.itens.map((i) => i.texto))).toEqual(new Set(PERGUNTAS[k].alternativas));
            expect(p.itens.find((i) => i.certa).texto).toBe(PERGUNTAS[k].alternativas[0]);
            expect(outra[k].itens.find((i) => i.certa).texto).toBe(PERGUNTAS[k].alternativas[0]);
        });
    });
});

describe('corrigir', () => {
    it('5 de 5 aprova', () => {
        const r = corrigir(prova, Object.fromEntries(prova.map((p) => [p.id, idxCerta(p)])));
        expect(r).toEqual({ acertos: 5, total: 5, aprovado: true, erradas: [] });
    });
    it('4 de 5 aprova (nota de corte)', () => {
        const resp = Object.fromEntries(prova.map((p) => [p.id, idxCerta(p)]));
        resp[prova[2].id] = idxErrada(prova[2]);
        const r = corrigir(prova, resp);
        expect(NOTA_MINIMA).toBe(4);
        expect(r.acertos).toBe(4); expect(r.aprovado).toBe(true); expect(r.erradas).toEqual([prova[2].id]);
    });
    it('3 de 5 reprova e lista as erradas sem entregar a certa', () => {
        const resp = Object.fromEntries(prova.map((p) => [p.id, idxCerta(p)]));
        resp[prova[0].id] = idxErrada(prova[0]); resp[prova[4].id] = idxErrada(prova[4]);
        const r = corrigir(prova, resp);
        expect(r.acertos).toBe(3); expect(r.aprovado).toBe(false); expect(r.erradas).toEqual([prova[0].id, prova[4].id]);
        expect(JSON.stringify(r)).not.toContain('certa');
    });
    it('sem resposta conta como errada, e respondeuTudo detecta', () => {
        expect(corrigir(prova, {}).acertos).toBe(0);
        expect(respondeuTudo(prova, {})).toBe(false);
        expect(respondeuTudo(prova, Object.fromEntries(prova.map((p) => [p.id, 0])))).toBe(true);
    });
});
