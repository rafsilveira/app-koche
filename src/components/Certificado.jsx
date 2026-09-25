// Mostra o certificado (desenho em src/services/certificadoCanvas.js) e oferece PDF (jsPDF, carregado só ao clicar),
// compartilhar como imagem e o link de verificação.
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Download, Share2, Link as LinkIcon } from 'lucide-react';
import { urlVerificacao } from '../services/certificado';
import { desenharCertificado } from '../services/certificadoCanvas';

export default function Certificado({ dados }) {
    const [img, setImg] = useState(null);
    const [aviso, setAviso] = useState('');
    const canvasRef = useRef(null);
    useEffect(() => {
        let vivo = true;
        desenharCertificado(dados).then((c) => { if (vivo) { canvasRef.current = c; setImg(c.toDataURL('image/png')); } }).catch((e) => { console.error('certificado: falha ao desenhar', e); if (vivo) setAviso('Não foi possível montar o certificado agora. Tente de novo.'); });
        return () => { vivo = false; };
    }, [dados]);

    const baixarPdf = async () => {
        if (!canvasRef.current) return;
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        pdf.addImage(canvasRef.current.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
        pdf.save(`certificado-koche-${dados.codigo}.pdf`);
    };
    const compartilhar = async () => {
        if (!canvasRef.current) return;
        const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
        const file = new File([blob], `certificado-koche-${dados.codigo}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: 'Meu certificado Kóche', text: `Concluí o ${dados.curso}. Verifique: ${urlVerificacao(dados.codigo)}` }); return; } catch { /* cancelou */ }
        }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); URL.revokeObjectURL(a.href);
    };
    const copiarLink = async () => {
        try { await navigator.clipboard.writeText(urlVerificacao(dados.codigo)); setAviso('Link de verificação copiado.'); setTimeout(() => setAviso(''), 2500); } catch { setAviso(urlVerificacao(dados.codigo)); }
    };

    return (
        <div className="certificado">
            {img ? <img className="certificado__img" src={img} alt={`Certificado de ${dados.nome}`} /> : <div className="certificado__espera">Montando seu certificado…</div>}
            <div className="certificado__acoes">
                <button type="button" className="k-btn k-btn--primary" onClick={baixarPdf} disabled={!img}><Download size={18} /> Baixar PDF</button>
                <button type="button" className="k-btn k-btn--ghost" onClick={compartilhar} disabled={!img}><Share2 size={18} /> Compartilhar imagem</button>
                <button type="button" className="k-btn k-btn--ghost" onClick={copiarLink}><LinkIcon size={18} /> Link de verificação</button>
            </div>
            <p className="k-muted certificado__codigo">Código <strong>{dados.codigo}</strong> · qualquer pessoa confere em {urlVerificacao(dados.codigo).replace('https://', '')}</p>
            {aviso && <p className="curso__dica">{aviso}</p>}
        </div>
    );
}
Certificado.propTypes = { dados: PropTypes.object.isRequired };
