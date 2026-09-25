// Tela do curso — visual nos moldes do site (src/assets/curso.css) e regras em src/services/curso.js.
// O que muda em 25/Set/2026: as aulas abrem em ordem, "concluída" é 90% do vídeo assistido de verdade,
// o progresso fica no Firestore por usuário, e o teste (fase B) entra como próximo passo.
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, PlayCircle, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import YouTubePlayer from './YouTubePlayer';
import { AULAS, TESTE_DISPONIVEL, thumb, liberada, estaConcluida, concluidas, cursoConcluido, percentualCurso, percentualAula, proximaAula, testeAprovado } from '../services/curso';
import { carregarProgresso, salvarAula } from '../services/cursoStore';
import { NOTA_ASTERISCO } from '../services/certificado';

export default function CourseScreen({ onBack, onStartQuiz }) {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [progresso, setProgresso] = useState({ aulas: {} });
    const [carregando, setCarregando] = useState(true);
    const [selecionada, setSelecionada] = useState(null);
    const [aviso, setAviso] = useState('');
    const [dica, setDica] = useState('');
    const playerRef = useRef(null);

    useEffect(() => {
        let vivo = true;
        if (!uid) { setCarregando(false); return undefined; }
        carregarProgresso(uid)
            .then((p) => { if (vivo) setProgresso(p); })
            .catch((e) => console.error('curso: falha ao carregar progresso', e))
            .finally(() => { if (vivo) setCarregando(false); });
        return () => { vivo = false; };
    }, [uid]);

    const gravar = useCallback((aulaId, dados) => {
        setProgresso((atual) => ({ ...atual, aulas: { ...atual.aulas, [aulaId]: { ...(atual.aulas?.[aulaId] || {}), ...dados } } }));
        if (uid) salvarAula(uid, aulaId, dados).catch((e) => console.error('curso: falha ao salvar progresso', e));
    }, [uid]);

    const abrir = (aula, indice) => {
        if (!liberada(progresso, indice)) {
            setAviso(`Conclua a ${AULAS[indice - 1].titulo.split(' · ')[0]} para liberar esta aula.`);
            return;
        }
        setAviso('');
        setDica('');
        setSelecionada(aula);
        setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const onProgresso = ({ segundos, duracao }) => {
        if (!selecionada || estaConcluida(progresso, selecionada.id)) return;
        gravar(selecionada.id, { segundos: Math.round(segundos), duracao: Math.round(duracao) });
    };

    const onConcluida = ({ segundos, duracao }) => {
        if (!selecionada || estaConcluida(progresso, selecionada.id)) return;
        gravar(selecionada.id, { segundos: Math.round(segundos), duracao: Math.round(duracao), concluidaEm: new Date().toISOString() });
        const indice = AULAS.findIndex((a) => a.id === selecionada.id);
        const proxima = AULAS[indice + 1];
        setDica(proxima ? `Aula concluída. A ${proxima.titulo.split(' · ')[0]} já está liberada.` : 'Você concluiu todas as aulas. O próximo passo é o teste.');
    };

    const feitas = concluidas(progresso);
    const pct = percentualCurso(progresso);
    const tudo = cursoConcluido(progresso);
    const proxima = proximaAula(progresso);
    const aprovado = testeAprovado(progresso);
    const pctSelecionada = selecionada ? percentualAula(progresso, selecionada.id) : 0;
    const selecionadaFeita = selecionada ? estaConcluida(progresso, selecionada.id) : false;

    return (
        <div className="curso">
            <div className="curso__wrap">
                <div className="curso__topo">
                    <button type="button" onClick={onBack} className="k-btn k-btn--ghost k-btn--sm"><ChevronLeft size={18} /> Voltar</button>
                    <span className="k-selo">Treinamento Kóche</span>
                </div>

                <section className="k-card curso__hero">
                    <div>
                        <p className="k-eyebrow">Curso grátis · 3 aulas em vídeo</p>
                        <h1>Troca de fluido de câmbio automático por diálise</h1>
                        <p className="curso__sub">Do fundamento à prática. Conclua as aulas na ordem: cada uma libera a seguinte, e a última libera o teste e o certificado.</p>
                    </div>
                    <div className="curso__progresso" aria-label="Progresso do curso">
                        <div className="curso__barra"><span style={{ width: `${pct}%` }} /></div>
                        <p>{carregando ? 'Carregando seu progresso…' : `${feitas} de ${AULAS.length} aulas concluídas · ${pct}%`}</p>
                    </div>
                    <div className="curso__oferta">
                        <span className="curso__oferta-label">Seu desconto ao concluir</span>
                        <strong className="curso__oferta-valor">R$ 1.000</strong>
                        <span className="curso__oferta-txt">em <strong>qualquer máquina Kóche</strong>, para quem conclui o curso com certificado*</span>
                    </div>
                    {!carregando && !selecionada && proxima && (
                        <div>
                            <button type="button" className="k-btn k-btn--primary k-btn--lg" onClick={() => abrir(proxima, AULAS.findIndex((a) => a.id === proxima.id))}>
                                <PlayCircle size={20} /> {feitas ? `Continuar: ${proxima.titulo.split(' · ')[0]}` : 'Começar a Aula 1'}
                            </button>
                        </div>
                    )}
                </section>

                {aviso && <p className="curso__aviso" role="alert">{aviso}</p>}

                {selecionada && (
                    <section className="k-card curso__player-card" ref={playerRef}>
                        <div>
                            <p className="k-eyebrow">Assistindo</p>
                            <h2>{selecionada.titulo}</h2>
                        </div>
                        <YouTubePlayer videoId={selecionada.videoId} titulo={selecionada.titulo} onProgresso={onProgresso} onConcluida={onConcluida} />
                        <div className="curso__status">
                            {selecionadaFeita
                                ? <span className="k-selo k-selo--feita">Concluída</span>
                                : <span>Assistido: <strong>{pctSelecionada}%</strong> · conta como concluída a partir de <strong>90%</strong></span>}
                        </div>
                        {dica && <p className={`curso__dica ${selecionadaFeita ? 'curso__dica--ok' : ''}`}>{dica}</p>}
                    </section>
                )}

                <section className="curso__aulas" aria-label="Aulas">
                    <div className="curso__lista-head">
                        <p className="k-eyebrow">Conteúdo do curso</p>
                        <h2>As {AULAS.length} aulas, em ordem</h2>
                        <p className="k-muted">Toque numa aula liberada para assistir. A seguinte abre quando você concluir a anterior.</p>
                    </div>
                    {AULAS.map((aula, i) => {
                        const feita = estaConcluida(progresso, aula.id);
                        const aberta = liberada(progresso, i);
                        const atual = selecionada?.id === aula.id;
                        const pctAula = percentualAula(progresso, aula.id);
                        return (
                            <button
                                type="button"
                                key={aula.id}
                                onClick={() => abrir(aula, i)}
                                className={`aula ${atual ? 'aula--atual' : ''} ${!aberta ? 'aula--bloqueada' : ''}`}
                                aria-disabled={!aberta}
                            >
                                <div className="aula__thumb">
                                    <img src={thumb(aula.videoId)} alt="" loading="lazy" />
                                    <div className="aula__play"><span>{aberta ? <PlayCircle size={24} /> : <Lock size={20} />}</span></div>
                                </div>
                                <div className="aula__info">
                                    <div className="aula__linha">
                                        {atual && !feita
                                            ? <span className="k-selo k-selo--vermelho">Reproduzindo</span>
                                            : <span className={`k-selo ${feita ? 'k-selo--feita' : ''} ${!aberta ? 'k-selo--bloqueada' : ''}`}>
                                                {feita ? 'Concluída' : aberta ? `Aula ${aula.numero}` : 'Bloqueada'}
                                            </span>}
                                        {!feita && aberta && !atual && pctAula > 0 && <span className="aula__pct">assistido <b>{pctAula}%</b></span>}
                                    </div>
                                    <h3 className="aula__titulo">{aula.titulo}</h3>
                                    <p className="aula__desc">{aberta ? aula.descricao : `Libera ao concluir a ${AULAS[i - 1].titulo.split(' · ')[0]}.`}</p>
                                </div>
                            </button>
                        );
                    })}
                </section>

                <section className="k-card curso__teste">
                    <div>
                        <p className="k-eyebrow">Próximo passo</p>
                        <h2>{aprovado ? 'Teste concluído: você foi aprovado' : tudo ? 'Faça o teste e garanta seu desconto' : 'Conclua as 3 aulas para liberar o teste'}</h2>
                        <p className="k-muted">{aprovado ? `Nota ${progresso.teste.nota}/${progresso.teste.total}. Seu desconto de R$ 1.000 está registrado no seu nome e o certificado está pronto.` : 'Aprovado no teste, você recebe o certificado e o desconto de R$ 1.000 fica registrado no seu nome.'}</p>
                    </div>
                    <div className="curso__teste-acoes">
                        {aprovado
                            ? <><span className="k-selo k-selo--feita">Aprovado</span><button type="button" className="k-btn k-btn--primary" onClick={onStartQuiz}>Ver certificado</button></>
                            : tudo && TESTE_DISPONIVEL
                                ? <button type="button" className="k-btn k-btn--primary k-btn--lg" onClick={onStartQuiz}><CheckCircle2 size={20} /> Fazer o teste</button>
                                : <button type="button" className="k-btn k-btn--lg" disabled>{tudo ? 'Teste disponível em breve' : 'Fazer o teste'}</button>}
                        {!tudo && <span className="k-selo k-selo--bloqueada">{feitas} de {AULAS.length} aulas</span>}
                    </div>
                </section>

                <p className="curso__nota">{NOTA_ASTERISCO}</p>
            </div>
        </div>
    );
}

CourseScreen.propTypes = {
    onBack: PropTypes.func.isRequired,
    onStartQuiz: PropTypes.func,
};
