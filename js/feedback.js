// Feedback dos jogos e exercícios: barulhinho, animação e uma frase de incentivo, com o Paul aparecendo por perto.
// Um só lugar pra todos: `win(el)` quando acerta, `lose(el)` quando erra, `great(el)` pra uma rodada fechada.
import { h, reducedMotion } from './util.js';
import { audio } from './audio.js';
import { stars as sparkle } from './ui.js';

export const WIN_LINES = ['isso aí! 🤘', 'mandou bem!', 'na veia!', 'perfeito!', 'arrasou!', 'é assim que se faz!', 'você é fera!', 'boa! continua assim!', 'que groove!', 'acertou em cheio!'];
export const LOSE_LINES = ['quase! tenta de novo', 'sem stress, errar faz parte', 'ouve de novo, você chega lá', 'respira e tenta outra vez', 'tudo bem! bora de novo', 'está pertinho!', 'o erro ensina, continua!', 'calma, vai no seu tempo'];
export const GREAT_LINES = ['rodada incrível! 🏆', 'você está voando!', 'que evolução!', 'nota máxima de atitude!'];
// qual desenho do Paul aparece em cada reação (assets/paul/…)
const PAUL = { win: ['e20', 'e02', 'e26', 'e07'], lose: ['e25', 'e17', 'e05'], great: ['e01', 'e20', 'e09'] };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

let last = '';
/** Frase sorteada que não repete a anterior. */
export function line(kind = 'win') {
  const list = kind === 'win' ? WIN_LINES : kind === 'lose' ? LOSE_LINES : GREAT_LINES;
  let t = pick(list); for (let i = 0; i < 4 && t === last; i++) t = pick(list);
  last = t; return t;
}

/** Barulhinho: acerto = subidinha alegre; erro = descidinha suave; great = arpejo maior com brilho. */
export function sound(kind = 'win') {
  try {
    const c = audio(); const t = c.currentTime + 0.01;
    const seq = { win: [[659, 0], [880, 0.1]], great: [[523, 0], [659, 0.09], [784, 0.18], [1047, 0.27]], lose: [[262, 0], [196, 0.14]] }[kind] || [];
    seq.forEach(([f, d]) => {
      const o = c.createOscillator(); const g = c.createGain(); const ok = kind !== 'lose';
      o.type = ok ? 'triangle' : 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(ok ? 0.24 : 0.12, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + (ok ? 0.22 : 0.3));
      o.connect(c.destination); o.start(t + d); o.stop(t + d + 0.34);
    });
  } catch { /* sem áudio */ }
}

let paulTimer = 0;
/** O Paul aparece no canto com um balão e some sozinho. */
export function paul(kind, text, ms = 1800) {
  if (reducedMotion()) { return; }
  document.querySelectorAll('.fb-paul').forEach((x) => x.remove()); clearTimeout(paulTimer);
  const el = h('div', { class: `fb-paul ${kind}`, 'aria-hidden': 'true' }, h('span', { class: 'fb-say' }, text), h('img', { src: `assets/paul/${pick(PAUL[kind] || PAUL.win)}.webp`, alt: '', draggable: 'false' }));
  document.body.append(el);
  paulTimer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}

/** Texto de apoio na tela (para quem não vê o Paul): vai pro `live` se existir. */
function say(live, text, cls) { if (live) { live.textContent = text; if (cls) live.classList.add(cls); } }

/**
 * Acertou: som, estrelinhas saindo do elemento, o elemento pulando e o Paul com uma frase.
 * `opts.msg` troca a frase, `opts.live` é um elemento de texto que também recebe a frase, `opts.paul = false` esconde o Paul.
 */
export function win(el, opts = {}) {
  const msg = opts.msg || line('win'); sound('win');
  if (el && el.isConnected) { sparkle(el); pulse(el, 'fb-pop'); }
  if (opts.paul !== false) paul('win', msg);
  say(opts.live, msg); return msg;
}
/** Errou: som suave, o elemento treme e o Paul incentiva (nada de bronca). */
export function lose(el, opts = {}) {
  const msg = opts.msg || line('lose'); sound('lose');
  if (el && el.isConnected) pulse(el, 'fb-shake');
  if (opts.paul !== false) paul('lose', msg);
  say(opts.live, msg); return msg;
}
/** Fechou uma rodada/fase com nota boa: arpejo, mais estrelas e o Paul comemorando. */
export function great(el, opts = {}) {
  const msg = opts.msg || line('great'); sound('great');
  if (el && el.isConnected) { sparkle(el); setTimeout(() => el.isConnected && sparkle(el), 260); pulse(el, 'fb-pop'); }
  if (opts.paul !== false) paul('great', msg, 2400);
  say(opts.live, msg); return msg;
}
function pulse(el, cls) { el.classList.remove('fb-pop', 'fb-shake'); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList && el.classList.remove(cls), 700); }

/** Atalho: `ok ? win : lose`. */
export const result = (ok, el, opts) => (ok ? win(el, opts) : lose(el, opts));
