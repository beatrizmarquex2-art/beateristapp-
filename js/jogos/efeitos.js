// Toca os efeitos de efeitos-dados.js no AudioContext do app. `tocarEfeito('velha', 'marcar X')`. Respeita o som do topo e o som dos jogos.
import { audio, out, isMuted } from '../audio.js';
import { soundOn } from './base.js';
import { EFEITOS } from './efeitos-dados.js';

let noiseBuf = null;
/** Toca um efeito (lista de sons) a partir de `t0`. Exportado pra página de audição e pros testes. */
export function tocarLista(c, destino, lista, t0) {
  for (const e of lista) {
    const t = t0 + (e.t || 0);
    if (e.n != null) {
      if (!noiseBuf) { noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = c.createBufferSource(); const f = c.createBiquadFilter(); const a = c.createGain(); s.buffer = noiseBuf; f.type = e.lp ? 'bandpass' : 'highpass'; f.frequency.value = e.lp ? Math.sqrt(e.n * e.lp) : e.n;
      a.gain.setValueAtTime(e.g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + e.d); s.connect(f); f.connect(a); a.connect(destino); s.start(t); s.stop(t + e.d + 0.02);
    } else {
      const o = c.createOscillator(); const a = c.createGain(); o.type = e.w; o.frequency.setValueAtTime(e.f, t); if (e.to) o.frequency.exponentialRampToValueAtTime(e.to, t + e.d);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, e.g), t + 0.008); a.gain.exponentialRampToValueAtTime(0.0001, t + e.d);
      o.connect(a); a.connect(destino); o.start(t); o.stop(t + e.d + 0.03);
    }
  }
}
export function tocarEfeito(jogo, nome) {
  if (isMuted() || !soundOn()) return;
  const lista = EFEITOS[jogo] && EFEITOS[jogo].efeitos[nome]; if (!lista) return;
  try { const c = audio(); tocarLista(c, out(), lista, c.currentTime + 0.01); } catch { /* sem áudio */ }
}
