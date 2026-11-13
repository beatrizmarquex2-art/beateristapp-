// Toca os efeitos de efeitos-dados.js no AudioContext do app. `tocarEfeito('velha', 'marcar X')`. Respeita o som do topo e o som dos jogos.
import { audio, out, isMuted } from '../audio.js';
import { soundOn, setPerfilSom } from './base.js';
import { EFEITOS } from './efeitos-dados.js';

let noiseBuf = null;
/** Toca um efeito (lista de sons) a partir de `t0`. Exportado pra página de audição e pros testes. */
export function tocarLista(c, destino, lista, t0, vol = 1) {
  for (const e of lista) {
    const t = t0 + (e.t || 0);
    if (e.n != null) {
      if (!noiseBuf) { noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = c.createBufferSource(); const f = c.createBiquadFilter(); const a = c.createGain(); s.buffer = noiseBuf; f.type = e.lp ? 'bandpass' : 'highpass'; f.frequency.value = e.lp ? Math.sqrt(e.n * e.lp) : e.n;
      a.gain.setValueAtTime(e.g * vol, t); a.gain.exponentialRampToValueAtTime(0.0001, t + e.d); s.connect(f); f.connect(a); a.connect(destino); s.start(t); s.stop(t + e.d + 0.02);
    } else {
      const o = c.createOscillator(); const a = c.createGain(); o.type = e.w; o.frequency.setValueAtTime(e.f, t); if (e.to) o.frequency.exponentialRampToValueAtTime(e.to, t + e.d);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, e.g * vol), t + 0.008); a.gain.exponentialRampToValueAtTime(0.0001, t + e.d);
      o.connect(a); a.connect(destino); o.start(t); o.stop(t + e.d + 0.03);
    }
  }
}
export function tocarEfeito(jogo, nome) {
  if (isMuted() || !soundOn()) return;
  const lista = EFEITOS[jogo] && EFEITOS[jogo].efeitos[nome]; if (!lista) return;
  try { const c = audio(); tocarLista(c, out(), lista, c.currentTime + 0.01); } catch { /* sem áudio */ }
}

/** Qual jogo é a tela atual (pra escolher o perfil de som). */
export const jogoDaRota = (hash = typeof location !== 'undefined' ? location.hash : '') => {
  const h = String(hash || '');
  if (/^#\/jogos\/velha(\/|$|\?)/.test(h)) return 'velha';
  if (/^#\/jogos\/bingo(\/|$|\?)/.test(h)) return 'bingo';
  if (/^#\/jogos\/quebra(\/|$|\?)/.test(h)) return 'quebra';
  if (/^#\/jogos\/cara(\/|$|\?)/.test(h)) return 'cara';
  if (/^#\/kids\/figuras(\/|$|\?)/.test(h)) return 'figuras';
  if (/^#\/(kids\/memoria|jogos\/memart)(\/|$|\?)/.test(h)) return 'memoria';
  return '';
};
/** Os sons genéricos dos jogos (tap, place, draw, ok, bad, win, lose, tie) viram o efeito próprio de cada jogo. Sem entrada = continua o som de sempre. */
export const POR_JOGO = {
  velha: { ok: 'acertou a pergunta', bad: 'errou a pergunta', win: 'vitória', lose: 'derrota (trombone)', tie: 'empate', place: 'marcar X' },
  bingo: { draw: 'sorteou a bola', bad: 'errou', win: 'BINGO!' },
  quebra: { tap: 'pegar a peça', place: 'encaixou', bad: 'não encaixa', win: 'terminou' },
  cara: { tap: 'virar carta', place: 'resposta: sim', bad: 'resposta: não', win: 'palpite certo', lose: 'palpite errado' },
};
let alterna = false; // Velha: marca X e O se alternam
setPerfilSom((kind) => {
  const j = jogoDaRota(); const nome = j && POR_JOGO[j] && POR_JOGO[j][kind]; if (!nome) return false;
  const eff = j === 'velha' && kind === 'place' ? (alterna = !alterna, alterna ? 'marcar X' : 'marcar O') : nome;
  tocarEfeito(j, eff); return true;
});

// o Beat Hero (rhythm-games.js, script antigo) chama os efeitos por aqui
if (typeof window !== 'undefined') window.__bfx = (jogo, nome) => tocarEfeito(jogo, nome);
