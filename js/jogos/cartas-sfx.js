// Uno Musical: efeitos sonoros curtos (papel, estalo de carta, baralho, "pop" de ação, UNO, vitória). Nada de nota, melodia ou som contínuo.
// Tudo sintetizado a partir de ruído filtrado (e um "zip" deslizante nos efeitos de festa) e passa pela saída principal do app,
// então sair do jogo ou do app corta o que estiver soando (stopAll). Um efeito mais importante corta o anterior; os leves não empilham.
import { audio, out, noise } from '../audio.js';

let enabled = true;
const live = new Set(); // fontes ainda tocando
let busyUntil = 0; let busyPrio = 0;
const PRIO = { tap: 1, flip: 1, bad: 1, draw: 2, place: 2, shuffle: 3, special: 4, uno: 5, lose: 5, tie: 5, win: 6 };

export const isOn = () => enabled;
export function setOn(v) { enabled = !!v; if (!enabled) stopAll(); }
/** Corta tudo na hora (sair da partida, trocar de tela, desligar o som). */
export function stopAll() {
  live.forEach((n) => { try { n.onended = null; n.stop(); } catch { /* já parou */ } try { n.disconnect(); } catch { /* ok */ } });
  live.clear(); busyUntil = 0; busyPrio = 0;
}

function track(node, tail) { live.add(node); node.onended = () => { live.delete(node); try { tail.disconnect(); } catch { /* ok */ } }; }

/** Estouro de ruído filtrado: f → f2 (varredura), duração `len` s, ataque rápido e queda exponencial. */
function puff(c, t, { len = 0.08, type = 'bandpass', f = 2000, f2 = f, q = 1, vol = 0.4, atk = 0.004 } = {}) {
  const s = c.createBufferSource(); s.buffer = noise(); s.loop = true;
  const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + len);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(fl); fl.connect(g); g.connect(out()); s.start(t); s.stop(t + len + 0.03); track(s, g);
}
/** "Zip" deslizante (efeito de desenho animado, não é nota): frequência sobe ou desce numa varredura. */
function zip(c, t, { len = 0.16, f = 300, f2 = 1500, vol = 0.16, type = 'triangle' } = {}) {
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + len);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(out()); o.start(t); o.stop(t + len + 0.03); track(o, g);
}

const RECIPE = {
  // papel deslizando: ruído "sssh" que desce
  draw: (c, t, n = 1) => { for (let i = 0; i < n; i++) puff(c, t + i * 0.1, { len: 0.13, f: 3200, f2: 1100, q: 0.9, vol: 0.3, atk: 0.02 }); return n * 0.1 + 0.1; },
  // carta na mesa: estalo seco + pancadinha grave de ruído
  place: (c, t) => { puff(c, t, { len: 0.04, type: 'highpass', f: 2600, f2: 2600, vol: 0.5, atk: 0.002 }); puff(c, t, { len: 0.09, type: 'lowpass', f: 420, f2: 160, q: 0.7, vol: 0.5, atk: 0.003 }); return 0.1; },
  // baralho: vários "trrr" rápidos, como as cartas se intercalando
  shuffle: (c, t) => { for (let i = 0; i < 12; i++) puff(c, t + i * 0.042, { len: 0.045, f: 2400 + (i % 3) * 700, f2: 1600, q: 1.4, vol: 0.18 + (i % 2) * 0.08, atk: 0.003 }); return 0.55; },
  flip: (c, t) => { puff(c, t, { len: 0.07, f: 1500, f2: 5200, q: 0.8, vol: 0.22, atk: 0.01 }); return 0.08; },
  tap: (c, t) => { puff(c, t, { len: 0.03, f: 1800, f2: 1500, q: 1.2, vol: 0.18, atk: 0.002 }); return 0.04; },
  bad: (c, t) => { puff(c, t, { len: 0.035, f: 900, f2: 700, q: 1.6, vol: 0.16, atk: 0.002 }); return 0.05; },
  // carta especial: "uóip" divertido e curto
  special: (c, t) => { zip(c, t, { len: 0.2, f: 380, f2: 1250, vol: 0.14 }); puff(c, t + 0.17, { len: 0.1, f: 2800, f2: 5200, q: 0.9, vol: 0.28 }); return 0.3; },
  // UNO: subida rápida + "tchan" de ruído brilhante
  uno: (c, t) => { zip(c, t, { len: 0.15, f: 260, f2: 1700, vol: 0.18, type: 'square' }); puff(c, t + 0.14, { len: 0.2, f: 3600, f2: 2600, q: 0.7, vol: 0.45 }); puff(c, t + 0.14, { len: 0.1, type: 'lowpass', f: 600, f2: 200, vol: 0.4 }); return 0.4; },
  // vitória: estouros de confete + varredura pra cima
  win: (c, t) => { [0, 0.13, 0.26].forEach((d, i) => { puff(c, t + d, { len: 0.12, f: 3000 + i * 600, f2: 2000, q: 0.8, vol: 0.4 }); zip(c, t + d, { len: 0.12, f: 400 + i * 200, f2: 1400 + i * 400, vol: 0.1 }); }); puff(c, t + 0.4, { len: 0.35, f: 5200, f2: 1800, q: 0.6, vol: 0.28, atk: 0.03 }); return 0.8; },
  lose: (c, t) => { zip(c, t, { len: 0.3, f: 420, f2: 150, vol: 0.12 }); return 0.35; },
  tie: (c, t) => { puff(c, t, { len: 0.12, f: 1400, f2: 1000, q: 1, vol: 0.2 }); puff(c, t + 0.15, { len: 0.12, f: 1400, f2: 1000, q: 1, vol: 0.2 }); return 0.3; },
};

/** Toca um efeito. `n` = quantas cartas (só no draw). O resultado (win/lose/tie) também avisa o Paul da moldura (evento jg-sfx), mesmo sem som. */
export function play(kind, n = 1) {
  if (kind === 'win' || kind === 'lose' || kind === 'tie') { try { document.dispatchEvent(new CustomEvent('jg-sfx', { detail: kind })); } catch { /* sem DOM */ } }
  if (!enabled || !RECIPE[kind]) return;
  try {
    const c = audio(); const now = c.currentTime; const pr = PRIO[kind] || 1;
    if (now < busyUntil) { if (pr <= busyPrio) return; stopAll(); } // leve não atropela; importante corta o que estava soando
    const dur = RECIPE[kind](c, now + 0.01, n);
    busyUntil = now + dur; busyPrio = pr;
  } catch { /* sem áudio */ }
}
