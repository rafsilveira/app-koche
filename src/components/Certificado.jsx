// Desenha o certificado num canvas (A4 paisagem, 1754×1240) no visual do site, com a assinatura de Rafael e o código de
// verificação; oferece PDF (jsPDF, carregado só ao clicar), compartilhar como imagem e o link de verificação.
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Download, Share2, Link as LinkIcon } from 'lucide-react';
import assinaturaSrc from '../assets/certificado/assinatura-rafael.png';
import { ASSINANTE, EMPRESA, dataLonga, urlVerificacao } from '../services/certificado';

const W = 1754, H = 1240, M = 96;
const COR = { navy: '#1A0B3A', red: '#D9002D', gray2: '#E4E4EA', gray6: '#5B5B68', ink: '#1C1B22', prata: '#C6C6C6' };

function carregar(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
async function logoPrata() {
    const r = await fetch(`${import.meta.env.BASE_URL}images/brand/logo-silver.svg`);
    const svg = (await r.text()).replace('<svg ', '<svg width="1580.71" height="316.14" ');
    return carregar('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
}
function linhas(ctx, texto, maxW) {
    const out = []; let atual = '';
    for (const p of texto.split(' ')) {
        const tent = atual ? `${atual} ${p}` : p;
        if (ctx.measureText(tent).width > maxW && atual) { out.push(atual); atual = p; } else atual = tent;
    }
    if (atual) out.push(atual);
    return out;
}

export async function desenharCertificado(d) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    await Promise.all(['800 90px Navigo', '700 30px Navigo', '400 34px Manrope', '600 30px Manrope', '700 20px Manrope'].map((f) => document.fonts.load(f).catch(() => null)));
    const [logo, assinatura] = await Promise.all([logoPrata().catch(() => null), carregar(assinaturaSrc).catch(() => null)]);

    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COR.navy; ctx.fillRect(0, 0, W, 112);
    ctx.fillStyle = COR.red; ctx.fillRect(0, 112, W, 8);
    if (logo) ctx.drawImage(logo, M, 30, 260, 52);
    ctx.fillStyle = '#fff'; ctx.font = '600 22px Manrope'; ctx.textAlign = 'right'; ctx.fillText(EMPRESA.site, W - M, 66); ctx.textAlign = 'left';

    ctx.fillStyle = COR.red; ctx.font = '700 28px Navigo';
    try { ctx.letterSpacing = '5px'; } catch { /* navegador sem suporte */ }
    ctx.fillText('CERTIFICADO DE CONCLUSÃO', M, 236);
    try { ctx.letterSpacing = '0px'; } catch { /* idem */ }

    ctx.fillStyle = COR.gray6; ctx.font = '400 34px Manrope'; ctx.fillText('Certificamos que', M, 318);
    let tam = 90; ctx.fillStyle = COR.navy;
    do { ctx.font = `800 ${tam}px Navigo`; tam -= 4; } while (ctx.measureText(d.nome).width > W - 2 * M && tam > 40);
    ctx.fillText(d.nome, M, 420);
    ctx.fillStyle = COR.gray2; ctx.fillRect(M, 452, 560, 3);

    ctx.fillStyle = COR.ink; ctx.font = '400 34px Manrope';
    const texto = `concluiu o ${d.curso}, com carga horária de ${d.cargaHoraria}, com aprovação na avaliação final (nota ${d.nota} de ${d.total}).`;
    let y = 530;
    for (const l of linhas(ctx, texto, W - 2 * M)) { ctx.fillText(l, M, y); y += 50; }
    ctx.fillStyle = COR.gray6; ctx.font = '600 30px Manrope'; ctx.fillText(`${ASSINANTE.cidade}, ${dataLonga(d.aprovadoEm)}`, M, y + 40);

    // assinatura sobre a linha, nome e empresa
    const yLinha = 1030;
    if (assinatura) { const h = 300, w = (assinatura.width / assinatura.height) * h; ctx.drawImage(assinatura, M + 40, yLinha - h + 14, w, h); }
    ctx.fillStyle = COR.gray2; ctx.fillRect(M, yLinha, 480, 3);
    ctx.fillStyle = COR.navy; ctx.font = '700 30px Navigo'; ctx.fillText(ASSINANTE.nome, M, yLinha + 46);
    ctx.fillStyle = COR.gray6; ctx.font = '400 24px Manrope'; ctx.fillText(ASSINANTE.empresa, M, yLinha + 82);

    // verificação, à direita
    ctx.textAlign = 'right';
    ctx.fillStyle = COR.gray6; ctx.font = '700 20px Manrope'; ctx.fillText('CÓDIGO DE VERIFICAÇÃO', W - M, yLinha - 44);
    ctx.fillStyle = COR.navy; ctx.font = '800 44px Navigo'; ctx.fillText(d.codigo, W - M, yLinha + 8);
    ctx.fillStyle = COR.gray6; ctx.font = '400 22px Manrope'; ctx.fillText(urlVerificacao(d.codigo).replace('https://', ''), W - M, yLinha + 46);
    ctx.textAlign = 'left';

    ctx.fillStyle = COR.gray2; ctx.fillRect(M, 1168, W - 2 * M, 2);
    ctx.fillStyle = COR.gray6; ctx.font = '400 20px Manrope'; ctx.fillText(`${EMPRESA.nome} · ${EMPRESA.cidadeUf} · CNPJ ${EMPRESA.cnpj}`, M, 1206);
    return c;
}

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
