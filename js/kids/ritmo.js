// Monte seu ritmo: cada tempo é uma palavra (pão, céu, mão, cão = 1 tempo · bolo, bola, corpo, pato = 2 colcheias ·
// chocolate, bicicleta, esqueleto, borboleta = 4 semicolcheias · shhh = pausa). Serve na área Kids e dentro de "Figuras rítmicas".
import { h } from '../util.js';
import * as N from '../notation.js';
import { audio, click } from '../audio.js';
import { layoutRhythm } from '../reading.js';
import { FOODS, FOOD_GROUPS, foodOf, randomFoods, sameRhythm, cellOf } from '../kids-logic.js';
import { svgEl } from './art.js';
import { VOICE } from '../views/beatlab.js';
import * as FB from '../feedback.js';

const put = (el, ...kids) => el.replaceChildren(...kids.filter(Boolean)); // replaceChildren(null) escreveria "null"
const feedback = (el, ok, text) => { el.className = `kd-fb ${ok ? 'ok' : 'no'}`; el.textContent = text; };

export function mountRitmo(box) {
  let mode = 'criar'; let slots = []; let secret = null; let cur = -1; let bpm = 80; const timers = [];
  const fb = h('p', { class: 'kd-fb', 'aria-live': 'polite' });
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const playBar = (ids, mark) => {
    const c = audio(); const q = 60 / bpm; const t0 = c.currentTime + 0.15 + q * 4;
    for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
    ids.forEach((id, b) => { [...cellOf(id)].forEach((x, k) => { if (x === '1') VOICE.sn(t0 + b * q + (k * q) / 4, 0.85); }); click(t0 + b * q, b === 0 ? 2 : 1, 0.35);
      if (mark) later(() => { cur = b; mark(); }, (t0 + b * q - c.currentTime) * 1000); });
    if (mark) later(() => { cur = -1; mark(); }, (t0 + 4 * q - c.currentTime) * 1000);
  };
  const draw = () => {
    const full = slots.length === 4;
    const score = full ? svgEl(N.toSVG(layoutRhythm(slots.map(cellOf), { width: 360 })), 'kd-score') : null;
    const slotEls = Array.from({ length: 4 }, (_, i) => { const id = slots[i]; const f = id ? foodOf(id) : null;
      return h('button', { type: 'button', class: `kd-slot${cur === i ? ' now' : ''}${id ? ' full' : ''}`, 'aria-label': id ? `Tirar ${f.word}` : `Tempo ${i + 1} vazio`, onclick: () => { if (id) { slots = slots.slice(0, i); draw(); } } },
        id ? [h('span', { class: 'kd-emoji' }, f.emoji), h('small', {}, f.syl.join('-'))] : h('small', {}, String(i + 1))); });
    const palette = FOOD_GROUPS.map((g) => h('div', { class: 'kd-group' }, h('p', { class: 'kd-glabel' }, g.title),
      h('div', { class: 'kd-foods' }, ...g.foods.map((f) => h('button', { type: 'button', class: 'kd-food', disabled: full, 'aria-label': `${f.word}, ${f.fig}`, onclick: () => { if (slots.length < 4) { slots = [...slots, f.id]; draw(); } } }, h('span', { class: 'kd-emoji' }, f.emoji), h('b', {}, f.syl.join('-')), h('small', {}, f.fig))))));
    put(box,
      h('div', { class: 'row kd-modes' }, ...[['criar', '🎨 criar'], ['adivinha', '🕵️ adivinha']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { mode = k; slots = []; secret = k === 'adivinha' ? randomFoods() : null; fb.textContent = ''; draw(); } }, t)),
        h('span', { class: 'kd-bpm' }, ...[60, 80, 100].map((v) => h('button', { type: 'button', class: `kd-chip${bpm === v ? ' on' : ''}`, 'aria-label': `${v} BPM`, onclick: () => { bpm = v; draw(); } }, String(v))))),
      mode === 'adivinha' ? h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playBar(secret) }, '▶ ouvir o ritmo secreto') : h('p', { class: 'kd-q' }, 'monta 4 tempos e toca!'),
      h('div', { class: 'kd-slots' }, ...slotEls),
      ...palette,
      score,
      h('div', { class: 'row kd-modes' },
        full ? h('button', { class: 'kd-btn', type: 'button', onclick: () => playBar(slots, () => box.querySelectorAll('.kd-slot').forEach((s, i) => s.classList.toggle('now', i === cur))) }, '▶ tocar') : null,
        mode === 'adivinha' && full ? h('button', { class: 'kd-btn', type: 'button', onclick: (e) => {
          if (sameRhythm(slots, secret)) { feedback(fb, true, 'acertou o ritmo secreto! ⭐'); FB.great(e.currentTarget); secret = randomFoods(Math.random, 2); slots = []; later(draw, 1800); }
          else { feedback(fb, false, 'quase! ouve de novo e troca uma carta'); FB.lose(e.currentTarget); }
        } }, 'conferir') : null,
        slots.length ? h('button', { class: 'kd-chip', type: 'button', onclick: () => { slots = []; draw(); } }, 'limpar') : null),
      fb);
  };
  draw();
  return () => timers.forEach(clearTimeout);
}
export { FOODS };
