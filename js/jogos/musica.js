// Musiquinha de fundo dos jogos: uma diferente pra cada jogo, sintetizada na hora (sem arquivos), bem baixinha, no mesmo som geral do app
// (vale o mudo do app e o botão de som de cada jogo). Cada jogo tem o seu tom, andamento, timbre e melodia (gerada de uma semente, sempre a mesma).
// Os jogos que dependem de ouvir ou de microfone (Toca Aqui, Detetive Note) avisam com o evento "jogo-musica" ('pausa' / 'volta') pra a música não atrapalhar.
import { audio, out, isMuted } from '../audio.js';

/** root = nota base (MIDI); scale = graus da escala; bpm; wave = timbre da melodia; seed = semente da melodia. */
export const TEMAS = {
  toca: { root: 60, scale: [0, 2, 4, 7, 9], bpm: 100, wave: 'triangle', seed: 11 },
  detetive: { root: 62, scale: [0, 2, 5, 7, 9], bpm: 92, wave: 'sine', seed: 23 },
  rudimentos: { root: 57, scale: [0, 3, 5, 7, 10], bpm: 100, wave: 'triangle', seed: 131 },
  figurix: { root: 57, scale: [0, 3, 5, 7, 10], bpm: 108, wave: 'triangle', seed: 37 },
  cartas: { root: 64, scale: [0, 2, 4, 7, 9], bpm: 116, wave: 'square', seed: 41 },
  quizuno: { root: 65, scale: [0, 2, 4, 5, 7, 9], bpm: 104, wave: 'triangle', seed: 53 },
  bingo: { root: 67, scale: [0, 2, 4, 7, 9], bpm: 124, wave: 'square', seed: 67 },
  velha: { root: 60, scale: [0, 4, 7, 9], bpm: 96, wave: 'sine', seed: 71 },
  quebra: { root: 55, scale: [0, 2, 4, 7, 9], bpm: 84, wave: 'sine', seed: 83 },
  cara: { root: 62, scale: [0, 3, 5, 7, 10], bpm: 112, wave: 'triangle', seed: 97 },
  stop: { root: 59, scale: [0, 2, 3, 7, 8], bpm: 120, wave: 'square', seed: 101 },
  memart: { root: 66, scale: [0, 2, 4, 7, 9], bpm: 88, wave: 'sine', seed: 113 },
};
const PADRAO = { root: 60, scale: [0, 2, 4, 7, 9], bpm: 100, wave: 'triangle', seed: 7 };
const VOL = 0.045; // bem baixinho: a música fica atrás dos sons do jogo

/** Gerador repetível (mesma semente = mesma melodia). */
const lcg = (seed) => { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
/** 16 passos (2 compassos de colcheias): { deg, oit } ou null (silêncio), e o baixo nos tempos fortes. Puro, testado em tests/musica.test.mjs. */
export function melodia(tema) {
  const r = lcg(tema.seed); const n = tema.scale.length; const passos = []; let atual = Math.floor(r() * n);
  for (let i = 0; i < 16; i++) {
    if (i % 4 === 0 || r() > 0.38) { atual = Math.max(0, Math.min(n * 2 - 1, atual + Math.floor(r() * 5) - 2)); passos.push({ deg: atual % n, oit: Math.floor(atual / n) }); } else passos.push(null);
  }
  const baixo = [0, null, null, null, 2 % n, null, null, null, 0, null, null, null, (n - 1) % n, null, null, null].map((d) => (d == null ? null : { deg: d, oit: -1 }));
  return { passos, baixo };
}
export const nota = (tema, p) => tema.root + tema.scale[p.deg] + 12 * p.oit;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

/** Cria a música de um jogo. start()/stop() são seguros de chamar várias vezes. */
export function musica(id) {
  const tema = TEMAS[id] || PADRAO; const { passos, baixo } = melodia(tema); let timer = 0; let passo = 0; let proximo = 0; let ligada = false; let pausada = false; const nos = new Set();
  const voz = (c, t, m, dur, tipo, vol) => {
    const o = c.createOscillator(); const g = c.createGain(); o.type = tipo; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.05); nos.add(o); o.onended = () => { nos.delete(o); try { g.disconnect(); } catch { /* ok */ } };
  };
  const tick = () => {
    if (!ligada || pausada || isMuted()) { return; }
    const c = audio(false); const dt = 60 / tema.bpm / 2;
    if (proximo < c.currentTime - 0.5) proximo = c.currentTime + 0.05;
    while (proximo < c.currentTime + 0.3) {
      const i = passo % 16; const m = passos[i]; const b = baixo[i];
      if (m) voz(c, proximo, nota(tema, m), dt * 1.6, tema.wave, VOL);
      if (b) voz(c, proximo, nota(tema, b), dt * 3.2, 'sine', VOL * 1.2);
      proximo += dt; passo++;
    }
  };
  const api = {
    id, tema,
    start() { if (ligada) { pausada = false; return; } ligada = true; pausada = false; passo = 0; proximo = 0; tick(); timer = setInterval(tick, 80); },
    stop() { ligada = false; clearInterval(timer); timer = 0; nos.forEach((o) => { try { o.stop(); } catch { /* ok */ } }); nos.clear(); },
    pausa() { pausada = true; nos.forEach((o) => { try { o.stop(); } catch { /* ok */ } }); nos.clear(); }, volta() { if (ligada) { pausada = false; proximo = 0; } },
    get ligada() { return ligada && !pausada; },
  };
  const onEvento = (e) => { if (e.detail === 'pausa') api.pausa(); else if (e.detail === 'volta') api.volta(); };
  window.addEventListener('jogo-musica', onEvento);
  const parar = api.stop; api.stop = () => { parar(); window.removeEventListener('jogo-musica', onEvento); };
  const iniciar = api.start; api.start = () => { window.removeEventListener('jogo-musica', onEvento); window.addEventListener('jogo-musica', onEvento); iniciar(); };
  return api;
}
/** Os jogos avisam: a música dá uma pausa enquanto o jogo precisa de silêncio (ouvir o ritmo, microfone). */
export const musicaPausa = () => { try { window.dispatchEvent(new CustomEvent('jogo-musica', { detail: 'pausa' })); } catch { /* sem DOM */ } };
export const musicaVolta = () => { try { window.dispatchEvent(new CustomEvent('jogo-musica', { detail: 'volta' })); } catch { /* sem DOM */ } };
