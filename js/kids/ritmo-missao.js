// Monte seu ritmo, versão MISSÃO (Modo Aventura): desafio de composição com compassos de 4 tempos. A validação é de js/campanha/jogos/monte-logic.js
// (checa a estrutura, aceita várias respostas). O criador livre e o "adivinha" continuam em ritmo.js, sem mudança.
import { h } from '../util.js';
import * as N from '../notation.js';
import { audio, click } from '../audio.js';
import { layoutRhythm } from '../reading.js';
import { FOOD_GROUPS, foodOf, cellOf } from '../kids-logic.js';
import { svgEl } from './art.js';
import { VOICE } from '../views/beatlab.js';
import * as FB from '../feedback.js';
import { session } from '../session.js';
import { check, BEATS } from '../campanha/jogos/monte-logic.js';

const BPM = 80;
const sndOf = (id, t0) => { const q = 60 / BPM; [...cellOf(id)].forEach((x, k) => { if (x === '1') VOICE.sn(t0 + (k * q) / 4, 0.85); }); };

/** Devolve a função de limpeza (com `.inProgress()`), como o resto do jogo. `opts.onResult({ slots, wrong, plays, bars })` é chamado UMA vez, quando o ritmo cumpre a missão. */
export function mountRitmoMissao(box, opts) {
  const P = opts.mission.params || {}; const bars = P.bars || 1; const n = bars * BEATS; const req = P.req || {}; const extra = P.extra || req; const fixed = P.fixed || {};
  const allowed = new Set(P.cells || []); const Play = session(); const UI = session({ quiet: false });
  let slots = Array.from({ length: n }, (_, i) => fixed[i] || null); let cur = -1; let plays = 0; let wrong = 0; let reported = false; let touched = false;
  const fb = h('p', { class: 'kd-fb', 'aria-live': 'polite' });
  const free = (i) => !(i in fixed);
  const feedback = (ok, text) => { fb.className = `kd-fb ${ok ? 'ok' : 'no'}`; fb.textContent = text; };

  const playAll = () => {
    Play.reset(); cur = -1; plays++; const c = audio(); const q = 60 / BPM; const t0 = c.currentTime + 0.15 + q * 4;
    for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
    slots.forEach((id, b) => { if (id) sndOf(id, t0 + b * q); click(t0 + b * q, b % BEATS === 0 ? 2 : 1, 0.35); Play.later(() => { cur = b; mark(); }, (t0 + b * q - c.currentTime) * 1000); });
    Play.later(() => { cur = -1; mark(); }, (t0 + n * q - c.currentTime) * 1000); draw();
  };
  const mark = () => box.querySelectorAll('.kd-slot').forEach((s) => s.classList.toggle('now', Number(s.dataset.i) === cur));
  const confer = (btn) => {
    const r = check(slots, req, { plays });
    if (r.ok) {
      if (reported) return; reported = true; Play.reset(); feedback(true, 'cumpriu a missão! ⭐'); FB.great(btn);
      if (opts.onResult) opts.onResult({ slots: slots.slice(), wrong, plays, bars }); return;
    }
    wrong++; const miss = r.checks.filter((c) => !c.ok && !c.hidden && c.key !== 'complete').map((c) => c.label);
    feedback(false, miss.length ? `quase! falta: ${miss.join('; ')}.` : 'quase! confira o ritmo e tente de novo.'); FB.lose(btn);
  };

  const draw = () => {
    const full = slots.every(Boolean); const base = check(slots, req, { plays }); const ex = check(slots, extra, { plays });
    const baseKeys = new Set(base.checks.map((c) => c.key));
    const li = (c, bonus) => h('li', { class: c.ok ? 'ok' : '', style: 'list-style:none;padding:2px 0' }, h('span', { 'aria-hidden': 'true' }, c.ok ? '✅ ' : '⬜ '), h('span', { class: 'sr-only', style: 'position:absolute;left:-9999px' }, c.ok ? 'feito: ' : 'falta: '), c.label, bonus ? ' ⭐' : '');
    const list = base.checks.filter((c) => !c.hidden);
    const seen = new Set(); const extras = ex.checks.filter((c) => !c.hidden && !baseKeys.has(c.key) && !seen.has(c.key) && seen.add(c.key));
    const bar = (b) => {
      const cells = Array.from({ length: BEATS }, (_, k) => { const i = b * BEATS + k; const id = slots[i]; const f = id ? foodOf(id) : null; const fx = !free(i);
        return h('button', { type: 'button', 'data-i': String(i), class: `kd-slot${cur === i ? ' now' : ''}${id ? ' full' : ''}`, 'aria-disabled': fx ? 'true' : null,
          'aria-label': fx ? `Tempo ${k + 1}: ${f.word}, fixo` : id ? `Tirar ${f.word}` : `Tempo ${k + 1} vazio`,
          onclick: () => { if (fx || !id) return; slots = slots.map((x, j) => (j === i ? null : x)); touched = true; draw(); } },
          id ? [h('span', { class: 'kd-emoji' }, f.emoji), h('small', {}, `${fx ? '🔒 ' : ''}${f.syl.join('-')}`)] : h('small', {}, String(k + 1))); });
      const part = slots.slice(b * BEATS, (b + 1) * BEATS); const score = part.every(Boolean) ? svgEl(N.toSVG(layoutRhythm(part.map(cellOf), { width: 360 })), 'kd-score') : null;
      return h('div', { class: 'mr-bar', style: 'width:100%;max-width:520px;display:grid;gap:6px' }, bars > 1 ? h('p', { class: 'kd-glabel' }, `compasso ${b + 1}`) : null, h('div', { class: 'kd-slots' }, ...cells), score);
    };
    const groups = FOOD_GROUPS.filter((g) => allowed.has(g.cell)).map((g) => h('div', { class: 'kd-group' }, h('p', { class: 'kd-glabel' }, g.title),
      h('div', { class: 'kd-foods' }, ...g.foods.map((f) => h('button', { type: 'button', class: 'kd-food', disabled: full, 'aria-label': `${f.word}, ${f.fig}`,
        onclick: () => { const i = slots.indexOf(null); if (i < 0) return; const c = audio(); sndOf(f.id, c.currentTime + 0.02); slots = slots.map((x, j) => (j === i ? f.id : x)); touched = true; draw(); } },
        h('span', { class: 'kd-emoji' }, f.emoji), h('b', {}, f.syl.join('-')), h('small', {}, f.fig))))));
    box.replaceChildren(
      h('div', { class: 'mr-checks', style: 'width:100%;max-width:520px' }, h('b', {}, 'requisitos'), h('ul', { style: 'margin:4px 0;padding:0' }, ...list.map((c) => li(c, false))),
        extras.length ? h('div', {}, h('b', {}, 'desafio extra (mais estrelas)'), h('ul', { style: 'margin:4px 0;padding:0' }, ...extras.map((c) => li(c, true)))) : null),
      ...Array.from({ length: bars }, (_, b) => bar(b)), ...groups,
      h('div', { class: 'row kd-modes' },
        full ? h('button', { class: 'kd-btn', type: 'button', onclick: playAll }, '▶ tocar') : null,
        h('button', { class: 'kd-btn', type: 'button', disabled: !full || reported, 'aria-label': 'Conferir o ritmo', onclick: (e) => confer(e.currentTarget) }, 'conferir'),
        slots.some((x, i) => x && free(i)) ? h('button', { class: 'kd-chip', type: 'button', onclick: () => { slots = slots.map((x, i) => (free(i) ? null : x)); draw(); } }, 'limpar') : null),
      fb);
  };
  draw();
  const stop = () => { Play.dispose(); UI.dispose(); };
  stop.inProgress = () => touched && !reported;
  return stop;
}
