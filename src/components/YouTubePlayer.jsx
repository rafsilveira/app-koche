// Player do YouTube pela IFrame Player API: o mesmo vídeo embutido, mas o app ouve tocar/pausar/terminar e lê o tempo.
// Mede o tempo REALMENTE assistido (amostra a cada segundo enquanto toca; salto na barra não conta) e avisa
// quando passa do limiar. Nada de conclusão por "abriu o vídeo" nem por "chegou ao fim arrastando".
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { somarAssistido, LIMIAR_CONCLUSAO } from '../services/curso';

let apiPromise = null;
function carregarApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve) => {
        const anterior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { if (typeof anterior === 'function') anterior(); resolve(window.YT); };
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.async = true;
        document.head.appendChild(s);
    });
    return apiPromise;
}

export default function YouTubePlayer({ videoId, titulo, onProgresso, onConcluida, limiar = LIMIAR_CONCLUSAO, intervaloSalvar = 10000 }) {
    const caixa = useRef(null);
    const cbs = useRef({ onProgresso, onConcluida });
    cbs.current = { onProgresso, onConcluida };

    useEffect(() => {
        let vivo = true;
        let player = null;
        const st = { segundos: 0, ultimo: null, duracao: 0, concluiu: false, timer: null, ultimoAviso: 0 };

        const verificar = () => {
            if (!st.concluiu && st.duracao > 0 && st.segundos >= st.duracao * limiar) {
                st.concluiu = true;
                cbs.current.onConcluida?.({ segundos: st.segundos, duracao: st.duracao });
            }
        };
        const avisar = () => {
            st.ultimoAviso = Date.now();
            cbs.current.onProgresso?.({ segundos: st.segundos, duracao: st.duracao });
        };
        const parar = () => { if (st.timer) { clearInterval(st.timer); st.timer = null; } st.ultimo = null; };
        const amostrar = () => {
            if (!player || typeof player.getCurrentTime !== 'function') return;
            const t = player.getCurrentTime();
            if (st.ultimo != null) st.segundos = somarAssistido(st.segundos, t - st.ultimo);
            st.ultimo = t;
            if (!(st.duracao > 0)) st.duracao = player.getDuration() || 0;
            verificar();
            if (Date.now() - st.ultimoAviso > intervaloSalvar) avisar();
        };

        // O YT.Player troca o elemento por um iframe; usamos um filho criado à mão para o React não perder o próprio nó.
        const el = caixa.current;
        const alvo = document.createElement('div');
        el?.appendChild(alvo);

        carregarApi().then((YT) => {
            if (!vivo) return;
            player = new YT.Player(alvo, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
                events: {
                    onStateChange: (e) => {
                        if (e.data === YT.PlayerState.PLAYING) {
                            st.duracao = player.getDuration() || st.duracao;
                            st.ultimo = player.getCurrentTime();
                            if (!st.timer) st.timer = setInterval(amostrar, 1000);
                        } else {
                            parar();
                            if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) { verificar(); avisar(); }
                        }
                    },
                },
            });
        });

        return () => {
            vivo = false;
            parar();
            if (player && typeof player.destroy === 'function') { try { player.destroy(); } catch { /* já destruído */ } }
            if (el) el.innerHTML = '';
        };
    }, [videoId, limiar, intervaloSalvar]);

    return <div className="k-player" aria-label={titulo}><div ref={caixa} /></div>;
}

YouTubePlayer.propTypes = {
    videoId: PropTypes.string.isRequired,
    titulo: PropTypes.string,
    onProgresso: PropTypes.func,
    onConcluida: PropTypes.func,
    limiar: PropTypes.number,
    intervaloSalvar: PropTypes.number,
};
