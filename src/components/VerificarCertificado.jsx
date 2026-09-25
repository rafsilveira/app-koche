// Página pública de verificação: /guia-de-aplicacao/?certificado=KCH-XXXX-XXXX — sem login; lê certificados/{codigo}.
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { buscarCertificado } from '../services/certificadoStore';
import { CODIGO_RE, dataLonga } from '../services/certificado';

export default function VerificarCertificado({ codigo }) {
    const [estado, setEstado] = useState({ carregando: true, dados: null });
    useEffect(() => {
        let vivo = true;
        const cod = String(codigo || '').trim().toUpperCase();
        if (!CODIGO_RE.test(cod)) { setEstado({ carregando: false, dados: null }); return undefined; }
        buscarCertificado(cod).then((d) => { if (vivo) setEstado({ carregando: false, dados: d }); }).catch(() => { if (vivo) setEstado({ carregando: false, dados: null }); });
        return () => { vivo = false; };
    }, [codigo]);
    const { carregando, dados } = estado;
    return (
        <div className="curso">
            <div className="curso__wrap">
                <div className="curso__topo"><span className="k-selo">Verificação de certificado</span><a className="k-btn k-btn--ghost k-btn--sm" href={import.meta.env.BASE_URL}>Abrir o app</a></div>
                <section className="k-card curso__teste">
                    {carregando && <p className="k-muted">Verificando…</p>}
                    {!carregando && dados && (
                        <>
                            <p className="k-eyebrow">Certificado válido</p>
                            <div className="quiz__nota"><ShieldCheck size={44} color="#1DA851" /><span className="k-selo k-selo--feita">Autêntico</span></div>
                            <h2>{dados.nome}</h2>
                            <p>concluiu o <strong>{dados.curso}</strong>, com carga horária de {dados.cargaHoraria}, com aprovação na avaliação final (nota {dados.nota} de {dados.total}), em {dataLonga(dados.aprovadoEm)}.</p>
                            <p className="k-muted">Código {dados.codigo} · emitido pela Kóche Automotiva.</p>
                        </>
                    )}
                    {!carregando && !dados && (
                        <>
                            <p className="k-eyebrow">Certificado não encontrado</p>
                            <div className="quiz__nota"><ShieldX size={44} color="#D9002D" /><span className="k-selo k-selo--bloqueada">Não localizado</span></div>
                            <h2>Não existe certificado com o código {String(codigo || '').toUpperCase()}</h2>
                            <p className="k-muted">Confira se o código foi digitado exatamente como está no certificado.</p>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
VerificarCertificado.propTypes = { codigo: PropTypes.string };
