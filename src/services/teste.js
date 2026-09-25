// Teste final do curso — perguntas aprovadas por Rafael em 25/Set/2026 (2 dele + 3 da apostila do curso presencial),
// nota de corte 4 de 5 ("Pode usar as 5, nota de corte 4 de 5"). Sem React aqui, para ser testável.
// Em cada pergunta a PRIMEIRA alternativa é a certa; a tela embaralha a ordem antes de mostrar.

export const NOTA_MINIMA = 4;

export const PERGUNTAS = [
    {
        id: 'arrefecimento',
        texto: 'Quais tipos de arrefecimento uma transmissão automática pode ter?',
        alternativas: [
            'Dois: um em que o fluido do câmbio vai até o radiador, e outro em que a água do radiador vai até o trocador de calor na transmissão.',
            'Um só: o fluido do câmbio passa sempre pelo radiador do motor.',
            'Dois: ar forçado pela ventoinha e água do motor.',
            'Três: radiador, ventoinha e o cárter.',
        ],
    },
    {
        id: 'flange',
        texto: 'Quando se usa a flange adaptadora Kóche?',
        alternativas: [
            'Quando a água do radiador vai até o trocador de calor na transmissão: o trocador é removido e a flange entra no lugar dele.',
            'Quando o trocador de calor fica no radiador e a mangueira leva fluido.',
            'Em toda troca, para prender as mangueiras da máquina no carro.',
            'Só em câmbios CVT.',
        ],
    },
    {
        id: 'dialise',
        texto: 'Por que a troca por diálise é superior à drenagem por gravidade?',
        alternativas: [
            'A gravidade só troca o fluido do cárter; a diálise substitui o fluido em circulação por completo, inclusive o do conversor de torque e do corpo de válvulas.',
            'Porque a diálise é mais rápida e dispensa o diagnóstico.',
            'Porque na gravidade é obrigatório trocar o filtro, e na diálise não.',
            'Não é superior: as duas trocam a mesma quantidade de fluido.',
        ],
    },
    {
        id: 'fluxo',
        texto: 'Antes de conectar a FT-100, como identificar qual mangueira é a de retorno da transmissão?',
        alternativas: [
            'Dando uma partida rápida no veículo, de 2 a 3 segundos: a mangueira de onde sai fluido é a de retorno, e é nela que entra a mangueira de fluido novo da máquina.',
            'Pela cor da mangueira do carro: a preta é sempre o retorno.',
            'Medindo a temperatura das duas mangueiras com o motor desligado.',
            'Não precisa identificar: a FT-100 corrige o sentido do fluxo sozinha.',
        ],
    },
    {
        id: 'momento-critico',
        texto: 'Durante a diálise, o reservatório de fluido usado chegou à marca que corresponde ao fluido novo que ainda restava. O que fazer imediatamente?',
        alternativas: [
            'Desligar o carro e manter a FT-100 ligada até esvaziar o fluido novo.',
            'Desligar a máquina e depois o carro.',
            'Desligar tudo ao mesmo tempo.',
            'Adicionar mais fluido na máquina e continuar.',
        ],
    },
];

/** Embaralha as alternativas de cada pergunta guardando qual é a certa. `aleatorio` permite teste determinístico. */
export function montarProva(perguntas = PERGUNTAS, aleatorio = Math.random) {
    return perguntas.map((p) => {
        const itens = p.alternativas.map((texto, i) => ({ texto, certa: i === 0 }));
        for (let i = itens.length - 1; i > 0; i -= 1) {
            const j = Math.floor(aleatorio() * (i + 1));
            [itens[i], itens[j]] = [itens[j], itens[i]];
        }
        return { id: p.id, texto: p.texto, itens };
    });
}

/** respostas = { perguntaId: índice escolhido em `itens` }. Devolve nota, aprovação e quais erraram (sem entregar a certa). */
export function corrigir(prova, respostas) {
    const erradas = prova.filter((p) => !(p.itens[respostas?.[p.id]]?.certa)).map((p) => p.id);
    const acertos = prova.length - erradas.length;
    return { acertos, total: prova.length, aprovado: acertos >= NOTA_MINIMA, erradas };
}

export function respondeuTudo(prova, respostas) {
    return prova.every((p) => Number.isInteger(respostas?.[p.id]));
}
