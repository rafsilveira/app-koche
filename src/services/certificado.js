// Certificado do curso — decisões de Rafael em 25/Set/2026: nome do curso, carga horária de 1h30, assinatura dele,
// desconto de R$ 1.000 válido por 30 dias a partir da aprovação. Sem React e sem Firestore aqui (testável).
export const CURSO = { nome: 'Curso Kóche de Troca de Fluido de Transmissão Automática', cargaHoraria: '1h30' };
export const ASSINANTE = { nome: 'Rafael Silveira', empresa: 'Kóche Automotiva', cidade: 'Mogi Mirim' };
export const EMPRESA = { nome: 'Kóche Automotiva', cidadeUf: 'Mogi Mirim/SP', cnpj: '19.817.153/0001-54', site: 'kocheautomotiva.com.br' };
export const VALIDADE_DESCONTO_DIAS = 30;
export const URL_VERIFICACAO_BASE = 'https://kocheautomotiva.com.br/guia-de-aplicacao/';
export const NOTA_ASTERISCO = `*Desconto de R$ 1.000 em qualquer máquina Kóche, válido por ${VALIDADE_DESCONTO_DIAS} dias a partir da aprovação no teste. Uma vez por pessoa.`;

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I, para ser lido sem erro

function fnv(s, reverso) {
    let h = 0x811c9dc5;
    const seq = reverso ? [...s].reverse() : [...s];
    for (const ch of seq) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
}

/** Código determinístico por aluno e aprovação: o mesmo aluno gera sempre o mesmo código; alunos diferentes, códigos diferentes. */
export function gerarCodigo(uid, aprovadoEm) {
    const s = `${uid}|${aprovadoEm}`;
    let a = fnv(s, false), b = fnv(s, true), out = 'KCH-';
    for (let i = 0; i < 4; i += 1) { out += ALFABETO[a & 31]; a >>>= 5; }
    out += '-';
    for (let i = 0; i < 4; i += 1) { out += ALFABETO[b & 31]; b >>>= 5; }
    return out;
}

export const CODIGO_RE = /^KCH-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function validadeDesconto(aprovadoEm) {
    const d = new Date(aprovadoEm);
    d.setUTCDate(d.getUTCDate() + VALIDADE_DESCONTO_DIAS);
    return d.toISOString();
}

const fmtLonga = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' });
const fmtCurta = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
export const dataLonga = (iso) => fmtLonga.format(new Date(iso));
export const dataCurta = (iso) => fmtCurta.format(new Date(iso));

export function urlVerificacao(codigo, base = URL_VERIFICACAO_BASE) {
    return `${base}?certificado=${encodeURIComponent(codigo)}`;
}

/** Monta os dados do certificado a partir do perfil e do teste aprovado; reaproveita o código se já existe. */
export function dadosCertificado({ nome, uid, teste }) {
    if (!teste?.aprovadoEm) return null;
    const codigo = teste.certificado || gerarCodigo(uid, teste.aprovadoEm);
    return {
        codigo, uid, nome: (nome || '').trim() || 'Aluno Kóche', curso: CURSO.nome, cargaHoraria: CURSO.cargaHoraria,
        nota: Number(teste.nota), total: Number(teste.total), aprovadoEm: teste.aprovadoEm, validadeDesconto: validadeDesconto(teste.aprovadoEm),
    };
}
