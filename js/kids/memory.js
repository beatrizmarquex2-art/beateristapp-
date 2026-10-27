// Memória dos instrumentos: som + imagem (vira a carta do som e acha o desenho) ou imagem + imagem.
// Fases 0 a 10 pelo número de pares; com tempo total e "poucos erros" nas fases especiais.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { stars as sparkle } from '../ui.js';
import { levelSpec } from './levels.js';
import { shuffle } from '../kids-logic.js';
import { INSTRUMENTS, byId, nameOf, playInstrument } from './instruments.js';
import { frame, showResult, introBox, beep } from './engine.js';
import { gameIcon } from './icons.js';

const ico = (name, cls, a, b) => { const e = h('span', { class: cls, 'aria-hidden': 'true' }); e.innerHTML = gameIcon(name, a, b); return e; };
const PAIRS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8];
const cols = (n) => (n <= 6 ? 3 : n === 10 ? 5 : 4);
const starsMem = (pct) => (pct >= 85 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0);

export function runMemory(game, ctx) {
  const { level, profile, mode = 'som' } = ctx; const spec = levelSpec(level, profile.age); const pairs = PAIRS[spec.d]; const { bot, stage } = frame(game, ctx, spec);
  const totalSecs = spec.secs ? Math.round(pairs * spec.secs * 1.4) : 0; const maxMiss = spec.sudden ? Math.max(2, Math.ceil(pairs / 2)) : Infinity;
  let gone = false; let timer = 0; let tick = 0; let open = []; let lock = false; let matched = 0; let tries = 0; let miss = 0; let restarts = 0; let misses = []; let left = 0;
  const clear = () => { clearTimeout(timer); clearInterval(tick); timer = 0; tick = 0; };

  const intro = () => {
    bot.set('happy', mode === 'som' ? 'ouve o som e acha o desenho!' : 'acha os pares iguais!');
    stage.replaceChildren(introBox(spec, [h('p', { class: 'muted' }, `${pairs} pares · ${mode === 'som' ? 'vira a carta do som (🔊) e acha o desenho do instrumento' : 'vira duas cartas e acha as figuras iguais'}`),
      totalSecs ? h('p', { class: 'muted' }, `⏱ você tem ${totalSecs} segundos no total.`) : null, spec.sudden ? h('p', { class: 'muted' }, `💥 no máximo ${maxMiss} erros, senão a fase recomeça.`) : null,
      h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => { audio(); start(); } }, 'bora!')].filter(Boolean)));
  };
  const start = () => {
    clear(); matched = 0; tries = 0; miss = 0; open = []; lock = false; misses = [];
    const picks = shuffle(INSTRUMENTS, Math.random).slice(0, pairs);
    const deck = shuffle(picks.flatMap((x) => (mode === 'som' ? [{ id: x.id, kind: 'sound' }, { id: x.id, kind: 'img' }] : [{ id: x.id, kind: 'img' }, { id: x.id, kind: 'img' }])), Math.random).map((c, i) => ({ ...c, key: i }));
    bot.set('think', 'onde será?');
    const status = h('p', { class: 'kx-memstat', 'aria-live': 'polite' });
    const bar = totalSecs ? h('div', { class: 'kx-time', style: `--secs:${totalSecs}s` }, h('i')) : null;
    const board = h('div', { class: 'kx-board', style: `--cols:${cols(deck.length)}` }, ...deck.map((c) => {
      const b = h('button', { type: 'button', class: 'kx-mem', 'aria-label': 'carta virada para baixo', onclick: () => flip(b, c) },
        h('span', { class: 'kx-mem-in' }, ico('figuras', 'kx-mem-back'),
          h('span', { class: 'kx-mem-front', 'aria-hidden': 'true' }, c.kind === 'sound' ? [ico('eco', 'kx-snd', '#a31d30', '#1b1818'), h('small', {}, 'som')] : [svgBox(c.id), h('small', {}, nameOf(c.id))])));
      b._c = c; return b;
    }));
    const paint = () => { status.textContent = `${matched}/${pairs} pares · ${tries} tentativa${tries === 1 ? '' : 's'}`; };
    stage.replaceChildren(...[bar, status, board].filter(Boolean)); stage._paint = paint; stage._board = board; paint();
    if (totalSecs) timer = setTimeout(timeUp, totalSecs * 1000);
  };
  const svgBox = (id) => { const d = h('span', { class: 'kx-mem-art' }); d.innerHTML = byId[id].art; return d; };
  const flip = (btn, c) => {
    if (lock || gone || btn.classList.contains('up') || btn.classList.contains('ok')) return;
    btn.classList.add('up'); btn.setAttribute('aria-label', c.kind === 'sound' ? 'carta de som' : nameOf(c.id));
    if (c.kind === 'sound') playInstrument(c.id); // a figura só mostra; o som fica na carta do som
    open.push(btn); if (open.length < 2) return;
    lock = true; tries++; const [a, b] = open; const same = a._c.id === b._c.id && (mode === 'som' ? a._c.kind !== b._c.kind : true);
    setTimeout(() => {
      if (gone) return;
      if (same) {
        a.classList.add('ok'); b.classList.add('ok'); matched++; beep(true); bot.set('cheer', 'isso!'); sparkle(b); if (mode === 'som') playInstrument(a._c.id);
        open = []; lock = false; stage._paint();
        if (matched === pairs) { clear(); finishUp(false); }
      } else {
        beep(false); miss++; misses.push(a._c.id, b._c.id); a.classList.add('no'); b.classList.add('no'); bot.set('oops', 'ops, tenta de novo');
        setTimeout(() => { a.classList.remove('up', 'no'); b.classList.remove('up', 'no'); open = []; lock = false; stage._paint(); if (miss > maxMiss) restart(); }, 700);
      }
    }, 650);
  };
  const restart = () => {
    clear(); restarts++; bot.set('oops', 'recomeçando…');
    stage.replaceChildren(h('div', { class: 'kx-restart' }, h('h2', {}, '💥 erros demais!'), h('p', {}, 'a fase recomeça do zero.'), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: start }, 'tentar de novo')));
  };
  const timeUp = () => { if (gone) return; clear(); lock = true; finishUp(true); };
  const finishUp = (timedOut) => {
    const t = Math.max(tries, 1); const pct = Math.round((matched / t) * 100);
    const stars = timedOut ? 0 : starsMem(pct);
    showResult({ game, ctx, bot, stage, spec, right: matched, total: t, stars, misses, mode, restarts, pct, note: timedOut ? `acabou o tempo! ${matched} de ${pairs} pares` : `${pairs} pares em ${tries} tentativas${restarts ? ` · recomeçou ${restarts}×` : ''}` });
  };
  intro();
  return () => { gone = true; clear(); };
}
