// Teste final do curso (25/Set/2026): 5 perguntas aprovadas por Rafael, corte 4 de 5, alternativas embaralhadas.
// Aprovado → grava em users/{uid}.curso.teste e manda `evento: curso_aprovado` ao n8n (que cria/marca o lead no Kommo
// com a tag CursoAprovado). Reprovado → mostra a nota e quais perguntas errou (nunca a resposta certa) e deixa refazer.
import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { montarProva, corrigir, respondeuTudo, NOTA_MINIMA } from '../services/teste';
import { AULAS, cursoConcluido, testeAprovado } from '../services/curso';
import { carregarProgresso, salvarTeste, marcarEventoEnviado } from '../services/cursoStore';
import { sendLeadToExternal } from '../services/leads';

export default function QuizScreen({ onBack }) {
    const { currentUser, userProfile } = useAuth();
    const uid = currentUser?.uid;
    const [progresso, setProgresso] = useState(null);
    const [tentativa, setTentativa] = useState(0);
    const [etapa, setEtapa] = useState('intro'); // intro | perguntas | resultado
    const [atual, setAtual] = useState(0);
    const [respostas, setRespostas] = useState({});
    const [resultado, setResultado] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const prova = useMemo(() => montarProva(), [tentativa]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let vivo = true;
        if (!uid) return undefined;
        carregarProgresso(uid).then((p) => { if (vivo) setProgresso(p); }).catch((e) => { console.error('teste: falha ao carregar', e); if (vivo) setProgresso({ aulas: {} }); });
        return () => { vivo = false; };
    }, [uid]);

    const liberado = progresso ? cursoConcluido(progresso) : false;
    const jaAprovado = progresso ? testeAprovado(progresso) : false;
    const pergunta = prova[atual];

    const comecar = () => { setTentativa((t) => t + 1); setRespostas({}); setAtual(0); setResultado(null); setEtapa('perguntas'); };

    const finalizar = async () => {
        const r = corrigir(prova, respostas);
        setResultado(r);
        setEtapa('resultado');
        if (!uid) return;
        setSalvando(true);
        try {
            const anterior = progresso?.teste || {};
            const agora = new Date().toISOString();
            const dados = { nota: r.acertos, total: r.total, tentativas: (anterior.tentativas || 0) + 1, ultimaEm: agora };
            if (r.aprovado && !anterior.aprovadoEm) dados.aprovadoEm = agora;
            await salvarTeste(uid, dados);
            const novo = { ...(progresso || { aulas: {} }), teste: { ...anterior, ...dados } };
            setProgresso(novo);
            if (r.aprovado && !anterior.eventoEnviadoEm) {
                const ok = await sendLeadToExternal({ name: userProfile?.name || currentUser?.displayName, email: userProfile?.email || currentUser?.email, phone: userProfile?.phone, uid }, 'curso_aprovado');
                if (ok) { await marcarEventoEnviado(uid); setProgresso((p) => ({ ...p, teste: { ...p.teste, eventoEnviadoEm: new Date().toISOString() } })); }
            }
        } catch (e) {
            console.error('teste: falha ao salvar resultado', e);
        } finally {
            setSalvando(false);
        }
    };

    const numeroDa = (id) => prova.findIndex((p) => p.id === id) + 1;

    return (
        <div className="curso">
            <div className="curso__wrap">
                <div className="curso__topo">
                    <button type="button" onClick={onBack} className="k-btn k-btn--ghost k-btn--sm"><ChevronLeft size={18} /> Voltar ao curso</button>
                    <span className="k-selo">Teste final</span>
                </div>

                {progresso === null && <section className="k-card"><p className="k-muted">Carregando…</p></section>}

                {progresso !== null && !liberado && (
                    <section className="k-card curso__teste">
                        <p className="k-eyebrow">Teste final</p>
                        <h2>Conclua as {AULAS.length} aulas para liberar o teste</h2>
                        <p className="k-muted">O teste abre quando todas as aulas estiverem concluídas na ordem.</p>
                        <div><button type="button" onClick={onBack} className="k-btn k-btn--primary">Voltar às aulas</button></div>
                    </section>
                )}

                {progresso !== null && liberado && etapa === 'intro' && (
                    <section className="k-card curso__teste">
                        <p className="k-eyebrow">Teste final</p>
                        <h2>{jaAprovado ? 'Você já foi aprovado' : `${prova.length} perguntas · aprovado com ${NOTA_MINIMA}`}</h2>
                        {jaAprovado ? (
                            <>
                                <div className="quiz__nota"><strong>{progresso.teste.nota}/{progresso.teste.total}</strong><span className="k-selo k-selo--feita">Aprovado</span></div>
                                <p className="k-muted">Seu desconto de R$ 1.000 em qualquer máquina Kóche está registrado no seu nome. A equipe Kóche fala com você pelo WhatsApp.</p>
                                <p className="curso__dica">Certificado: em breve disponível nesta tela.</p>
                            </>
                        ) : (
                            <>
                                <p className="k-muted">Múltipla escolha, uma resposta certa por pergunta. Você pode refazer o teste se não passar. Aprovado, o desconto de R$ 1.000 fica registrado no seu nome.</p>
                                <div><button type="button" onClick={comecar} className="k-btn k-btn--primary k-btn--lg"><CheckCircle2 size={20} /> Começar o teste</button></div>
                            </>
                        )}
                    </section>
                )}

                {etapa === 'perguntas' && pergunta && (
                    <section className="k-card quiz">
                        <p className="k-eyebrow">Pergunta {atual + 1} de {prova.length}</p>
                        <div className="curso__barra quiz__barra"><span style={{ width: `${Math.round((100 * (atual + 1)) / prova.length)}%` }} /></div>
                        <h2 className="quiz__pergunta">{pergunta.texto}</h2>
                        <div className="quiz__opcoes" role="radiogroup" aria-label={`Pergunta ${atual + 1}`}>
                            {pergunta.itens.map((item, i) => (
                                <button
                                    type="button"
                                    key={item.texto}
                                    role="radio"
                                    aria-checked={respostas[pergunta.id] === i}
                                    className={`quiz__opcao ${respostas[pergunta.id] === i ? 'quiz__opcao--marcada' : ''}`}
                                    onClick={() => setRespostas((r) => ({ ...r, [pergunta.id]: i }))}
                                >
                                    <span className="quiz__letra">{'ABCD'[i]}</span>
                                    <span>{item.texto}</span>
                                </button>
                            ))}
                        </div>
                        <div className="quiz__nav">
                            <button type="button" className="k-btn k-btn--ghost" onClick={() => setAtual((a) => Math.max(0, a - 1))} disabled={atual === 0}><ChevronLeft size={18} /> Anterior</button>
                            {atual < prova.length - 1
                                ? <button type="button" className="k-btn k-btn--primary" onClick={() => setAtual((a) => a + 1)} disabled={!Number.isInteger(respostas[pergunta.id])}>Próxima <ChevronRight size={18} /></button>
                                : <button type="button" className="k-btn k-btn--primary" onClick={finalizar} disabled={!respondeuTudo(prova, respostas)}><CheckCircle2 size={18} /> Ver resultado</button>}
                        </div>
                    </section>
                )}

                {etapa === 'resultado' && resultado && (
                    <section className="k-card curso__teste">
                        <p className="k-eyebrow">Resultado</p>
                        <div className="quiz__nota">
                            <strong>{resultado.acertos}/{resultado.total}</strong>
                            <span className={`k-selo ${resultado.aprovado ? 'k-selo--feita' : 'k-selo--bloqueada'}`}>{resultado.aprovado ? 'Aprovado' : 'Não foi dessa vez'}</span>
                        </div>
                        {resultado.aprovado ? (
                            <>
                                <h2>Parabéns, você concluiu o curso</h2>
                                <p className="k-muted">Seu desconto de R$ 1.000 em qualquer máquina Kóche está registrado no seu nome. A equipe Kóche fala com você pelo WhatsApp.</p>
                                <p className="curso__dica curso__dica--ok">{salvando ? 'Registrando sua aprovação…' : 'Aprovação registrada. Certificado: em breve disponível nesta tela.'}</p>
                            </>
                        ) : (
                            <>
                                <h2>Faltou pouco: são {NOTA_MINIMA} acertos para passar</h2>
                                <p className="k-muted">Você errou {resultado.erradas.length === 1 ? 'a pergunta' : 'as perguntas'} {resultado.erradas.map(numeroDa).join(', ')}. Reveja as aulas e faça o teste de novo, as alternativas mudam de ordem.</p>
                                <div className="curso__teste-acoes">
                                    <button type="button" className="k-btn k-btn--primary" onClick={comecar}><RotateCcw size={18} /> Refazer o teste</button>
                                    <button type="button" className="k-btn k-btn--ghost" onClick={onBack}>Rever as aulas</button>
                                </div>
                            </>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

QuizScreen.propTypes = { onBack: PropTypes.func.isRequired };
