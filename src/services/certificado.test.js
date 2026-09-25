import { describe, it, expect } from 'vitest';
import { gerarCodigo, CODIGO_RE, validadeDesconto, dataLonga, dataCurta, dadosCertificado, urlVerificacao, CURSO, VALIDADE_DESCONTO_DIAS } from './certificado';

describe('código do certificado', () => {
    it('tem o formato KCH-XXXX-XXXX sem letras ambíguas e é determinístico', () => {
        const c = gerarCodigo('J2aWgUmarlPAcz6pOAXJKecDX913', '2026-09-25T14:42:40.684Z');
        expect(c).toMatch(CODIGO_RE);
        expect(gerarCodigo('J2aWgUmarlPAcz6pOAXJKecDX913', '2026-09-25T14:42:40.684Z')).toBe(c);
        expect(c).not.toMatch(/[01IO]/);
    });
    it('muda com o aluno e com a aprovação', () => {
        const a = gerarCodigo('uid-a', '2026-09-25T14:42:40.684Z'), b = gerarCodigo('uid-b', '2026-09-25T14:42:40.684Z'), c = gerarCodigo('uid-a', '2026-09-26T10:00:00.000Z');
        expect(new Set([a, b, c]).size).toBe(3);
    });
});

describe('validade e datas', () => {
    it('desconto vale 30 dias a partir da aprovação', () => {
        expect(VALIDADE_DESCONTO_DIAS).toBe(30);
        expect(validadeDesconto('2026-09-25T14:42:40.684Z')).toBe('2026-10-25T14:42:40.684Z');
    });
    it('formata em português e no fuso de São Paulo', () => {
        expect(dataLonga('2026-09-25T14:42:40.684Z')).toBe('25 de setembro de 2026');
        expect(dataCurta('2026-10-25T02:30:00.000Z')).toBe('24/10/2026'); // 02:30 UTC ainda é dia 24 em São Paulo
    });
});

describe('dadosCertificado', () => {
    const teste = { nota: 5, total: 5, aprovadoEm: '2026-09-25T14:42:40.684Z' };
    it('monta os dados com o nome do curso e a carga horária decididos', () => {
        const d = dadosCertificado({ nome: ' Rafael Silveira ', uid: 'uid-a', teste });
        expect(d.curso).toBe(CURSO.nome); expect(d.cargaHoraria).toBe('1h30'); expect(d.nome).toBe('Rafael Silveira');
        expect(d.codigo).toMatch(CODIGO_RE); expect(d.validadeDesconto).toBe('2026-10-25T14:42:40.684Z');
        expect(urlVerificacao(d.codigo)).toBe('https://kocheautomotiva.com.br/guia-de-aplicacao/?certificado=' + d.codigo);
    });
    it('reaproveita o código já gravado e devolve null sem aprovação', () => {
        expect(dadosCertificado({ nome: 'X', uid: 'u', teste: { ...teste, certificado: 'KCH-AAAA-BBBB' } }).codigo).toBe('KCH-AAAA-BBBB');
        expect(dadosCertificado({ nome: 'X', uid: 'u', teste: { nota: 3, total: 5 } })).toBeNull();
    });
});
