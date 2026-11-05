// Monte seu ritmo: cada tempo é uma palavra (pão, céu, mão, cão = 1 tempo · bolo, bola, corpo, pato = 2 colcheias ·
// chocolate, bicicleta, esqueleto, borboleta = 4 semicolcheias · shhh = pausa). Serve na área Kids e dentro de "Figuras rítmicas".
import { h } from '../util.js';
import * as N from '../notation.js';
import { audio, click } from '../audio.js';
import { voz, getSom, setSom, SONS, VELOCIDADES, BPM_MAX, velocidadeDe } from '../toca-som.js';
import { layoutRhythm } from '../reading.js';
import { FOODS, FOOD_GROUPS, foodOf, randomFoods, sameRhythm, cellOf } from '../kids-logic.js';
import { svgEl } from './art.js';
import * as FB from '../feedback.js';
import { session } from '../session.js';
import { mountRitmoMissao } from './ritmo-missao.js';

const put = (el, ...kids) => el.replaceChildren(...kids.filter(Boolean)); // replaceChildren(null) escreveria "null"
const feedback = (el, ok, text) => { el.className = `kd-fb ${ok ? 'ok' : 'no'}`; el.textContent = text; };

/** `opts.mission` (Modo Aventura) abre o desafio de composição de ritmo-missao.js; sem ele é o jogo de sempre (criar / adivinha). */
export function mountRitmo(box, opts) {
  if (opts && opts.mission) return mountRitmoMissao(box, opts);
  let mode = 'criar'; let slots = []; let secret = null; let cur = -1; let bpm = 90;
  const Play = session(); // a execução em curso (cliques, sons e o destaque do tempo); tocar de novo ou trocar de modo cancela a anterior
  const UI = session({ quiet: false }); // timers só de tela (redesenhar depois do acerto)
  const fb = h('p', { class: 'kd-fb', 'aria-live': 'polite' });
  const later = (fn, ms) => Play.later(fn, ms);
  const playBar = (ids, mark) => {
    Play.reset(); cur = -1;
    const c = audio(); const q = 60 / bpm; const t0 = c.currentTime + 0.15 + q * 4;
    for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
    ids.forEach((id, b) => { [...cellOf(id)].forEach((x, k) => { if (x === '1') voz(t0 + b * q + (k * q) / 4, 0.85); }); click(t0 + b * q, b === 0 ? 2 : 1, 0.35);
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
      h('div', { class: 'kd-foods' }, ...g.foods.map((f) => h('button', { type: 'button', class: 'kd-food', disabled: full, 'aria-label': `${f.word}, ${f.fig}`, onclick: () => { { const c = audio(); const q = 60 / bpm; const t = c.currentTime + 0.02; [...cellOf(f.id)].forEach((x, k) => { if (x === '1') voz(t + (k * q) / 4, 0.85); }); } if (slots.length < 4) { slots = [...slots, f.id]; draw(); } } }, h('span', { class: 'kd-emoji' }, f.emoji), h('b', {}, f.syl.join('-')), h('small', {}, f.fig))))));
    put(box,
      h('div', { class: 'row kd-modes' }, ...[['criar', '🎨 criar'], ['adivinha', '🕵️ adivinha']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { Play.reset(); UI.reset(); cur = -1; mode = k; slots = []; secret = k === 'adivinha' ? randomFoods() : null; fb.textContent = ''; draw(); } }, t)),
        h('span', { class: 'kd-bpm' }, h('button', { type: 'button', class: 'kd-chip', 'aria-label': 'menos 5 BPM', onclick: () => { bpm = Math.max(40, bpm - 5); draw(); } }, '−'), h('output', { class: 'kd-bpmv', 'aria-label': `${bpm} BPM` }, `${bpm} BPM`), h('button', { type: 'button', class: 'kd-chip', 'aria-label': 'mais 5 BPM', onclick: () => { bpm = Math.min(BPM_MAX, bpm + 5); draw(); } }, '+'))),
      h('div', { class: 'row kd-modes kd-vel', role: 'radiogroup', 'aria-label': 'Velocidade' }, h('span', { class: 'kd-lab' }, 'velocidade'), ...VELOCIDADES.map(([k, v]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(velocidadeDe(bpm) === k), class: `kd-chip${velocidadeDe(bpm) === k ? ' on' : ''}`, onclick: () => { bpm = v; draw(); } }, k))),
      h('div', { class: 'row kd-modes kd-som', role: 'radiogroup', 'aria-label': 'Som do toque' }, h('span', { class: 'kd-lab' }, 'som'), ...SONS.map(([k, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(getSom() === k), class: `kd-chip${getSom() === k ? ' on' : ''}`, onclick: () => { setSom(k); voz(audio().currentTime + 0.02, 0.9, k); draw(); } }, t))),
      mode === 'adivinha' ? h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playBar(secret) }, '▶ ouvir o ritmo secreto') : h('p', { class: 'kd-q' }, 'monta 4 tempos e toca!'),
      h('div', { class: 'kd-slots' }, ...slotEls),
      ...palette,
      score,
      h('div', { class: 'row kd-modes' },
        full ? h('button', { class: 'kd-btn', type: 'button', onclick: () => playBar(slots, () => box.querySelectorAll('.kd-slot').forEach((s, i) => s.classList.toggle('now', i === cur))) }, '▶ tocar') : null,
        mode === 'adivinha' && full ? h('button', { class: 'kd-btn', type: 'button', onclick: (e) => {
          if (sameRhythm(slots, secret)) { feedback(fb, true, 'acertou o ritmo secreto! ⭐'); FB.great(e.currentTarget); secret = randomFoods(Math.random, 2); slots = []; UI.later(draw, 1800); }
          else { feedback(fb, false, 'quase! ouve de novo e troca uma carta'); FB.lose(e.currentTarget); }
        } }, 'conferir') : null,
        slots.length ? h('button', { class: 'kd-chip', type: 'button', onclick: () => { slots = []; draw(); } }, 'limpar') : null),
      fb);
  };
  draw();
  return () => { Play.dispose(); UI.dispose(); };
}
export { FOODS };
