// Detetive do groove, em 3 estrelas: ⭐ clicar (o que mudou?), ⭐⭐ escrever na partitura, ⭐⭐⭐ tocar (na tela ou no pad / bateria).
import { h } from '../util.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, click, later } from '../audio.js';
import { session } from '../session.js';
import { stars as sparkle } from '../ui.js';
import { VOICE } from '../views/beatlab.js';
import * as P from './progress.js';
import * as Album from './album.js';
import { levelSpec } from './levels.js';
import { ROWS, ROW_NAME, STEP_LABEL, baseGroove, changed, cellsMatch, emptyGroove, rowToPlay, rowTimes, judgeHits, roundOk, windowFor } from './groove.js';
import { capture } from './capture.js';
import { runLevel, beep } from './engine.js';
import * as FB from '../feedback.js';
import { svgEl } from './art.js';
import { KIT_COLORS } from './icons.js';

const colorOf = (id) => (KIT_COLORS[id] || B.COLORS[id]);
function playGroove(g, bpm, bars = 2, accent = null) {
  const c = audio(); const dt = 60 / bpm / 2; const t0 = c.currentTime + 0.15;
  for (let b = 0; b < bars; b++) for (let i = 0; i < 8; i++) for (const r of ROWS) if (g.rows[r][i]) VOICE[r](t0 + (b * 8 + i) * dt, r === 'hh' ? (accent === 'hh' ? 0.9 : 0.55) : 1);
  return (bars * 8 * dt + 0.3) * 1000;
}
const fullRows = (g) => ({ ...g, rows: Object.fromEntries(B.ROWS.map((r) => [r.id, g.rows[r.id] || Array(8).fill(0)])) });
const scoreSvg = (g) => svgEl(N.toSVG(N.layout(fullRows(g), { width: 340, full: true, color: true })), 'kd-score');

/** Parte 1 (⭐ clicar): dois grooves, o que mudou? Nas fases altas, em qual tempo mudou. */
function clickGame(base) {
  return {
    id: 'detetive', title: base.title, mode: '',
    makeQuestion: (rnd, d) => {
      const g = baseGroove(d, rnd); const { g2, change } = changed(g, d, rnd); const swap = rnd() < 0.5; const byStep = d >= 6;
      if (window.__kidsTest) window.__kidsTest.ans = byStep ? String(change.step) : change.row;
      return { key: change.row, A: swap ? g2 : g, B: swap ? g : g2, change, bpm: 80, byStep, ans: byStep ? String(change.step) : change.row,
        options: byStep ? STEP_LABEL.map((l, i) => ({ id: String(i), label: l })) : ROWS.map((r) => ({ id: r, label: ROW_NAME[r], color: colorOf(r) })) };
    },
    say: () => 'o que mudou do A pro B?',
    render: (q) => h('div', { class: 'kx-q' }, h('div', { class: 'row kx-ab' }, h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playGroove(q.A, q.bpm, 2) }, '▶ A'), h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playGroove(q.B, q.bpm, 2) }, '▶ B')),
      h('p', { class: 'kd-q' }, q.byStep ? 'em que tempo o B mudou?' : 'qual peça mudou do A pro B?')),
    onShow: (q) => { const ms = playGroove(q.A, q.bpm, 1); later(() => playGroove(q.B, q.bpm, 1), ms + 150); },
    okText: (q) => `isso! ${q.change.op === 'pôs' ? 'pôs' : 'tirou'} ${ROW_NAME[q.change.row]} no "${STEP_LABEL[q.change.step]}" ⭐`,
    noText: (q) => `mudou o ${ROW_NAME[q.change.row]} (no "${STEP_LABEL[q.change.step]}")`,
    hint: (k) => `treinar: ouvir o ${ROW_NAME[k] || k}`,
  };
}

export function runDetetive(game, ctx) {
  const { level, profile } = ctx; const spec = levelSpec(level, profile.age); const d = spec.d; let gone = false; let parts = (P.starsAt(profile.id, 'detetive', level) || 0); let cap = null; let mode = 'tela';
  const S = session(); // timers das partes 2 e 3 (a parte 1 usa o motor de fases, que tem a sessão dele)
  const done = []; // % de cada parte nesta sessão
  const rec = async (stars, right, total, misses, m) => { const { gain } = await P.record(profile.id, { game: 'detetive', level, right, total, stars, misses, mode: m }); return Album.grant(profile.id, gain); };

  // ---- parte 1: clicar (usa o motor de fases) ----
  const part1 = () => {
    const stop = runLevel(clickGame(game), { ...ctx, mode: '', onFinish: async ({ right, total, misses, restarts, bot, stage }) => {
      const ok = right / total >= 0.6; const won = await rec(ok ? 1 : 0, right, total, misses, 'clicar'); done[0] = Math.round((right / total) * 100); if (ok) parts = Math.max(parts, 1);
      ladder(bot, stage, 1, ok, won, restarts);
    } });
    cleanup = stop;
  };
  let cleanup = () => {};

  // ---- escada de estrelas ----
  const ladder = (bot, stage, step, ok, won, restarts = 0) => {
    bot.set(ok ? 'cheer' : 'oops', ok ? (step === 3 ? 'detetive perfeito!' : 'achou a pista!') : FB.line('lose'));
    const have = Math.max(parts, ok ? step : 0); const label = ['clicar', 'escrever na partitura', 'tocar'];
    stage.replaceChildren(h('div', { class: 'kx-result' },
      h('h2', {}, ok ? (step === 3 ? 'Detetive completo!' : `Estrela ${step} ganha!`) : 'Quase lá!'),
      h('p', { class: 'muted' }, `${label[step - 1]}: ${done[step - 1] != null ? `${done[step - 1]}% de acerto` : ''}${restarts ? ` · recomeçou ${restarts}×` : ''}`),
      h('div', { class: 'kx-stars', 'aria-label': `${have} de 3 estrelas` }, ...[1, 2, 3].map((n) => h('span', { class: `kx-star${n <= have ? ' on' : ''}`, style: `--d:${n * 0.25}s` }, '★'))),
      h('p', { class: 'muted kx-ladder' }, '⭐ clicar · ⭐⭐ escrever na partitura · ⭐⭐⭐ tocar'),
      won.length ? h('div', { class: 'kx-reward' }, h('p', { class: 'kx-reward-t' }, `🎁 ${won.length === 1 ? 'figurinha nova!' : `${won.length} figurinhas novas!`}`), h('div', { class: 'kx-pack' }, ...won.map((c) => Album.cardEl(c, { fresh: true })))) : null,
      h('div', { class: 'row kx-act' },
        ok && step < 3 ? h('button', { class: 'kd-btn', type: 'button', onclick: () => (step === 1 ? write(bot, stage) : play(bot, stage)) }, step === 1 ? '⭐⭐ escrever na partitura' : '⭐⭐⭐ tocar') : null,
        !ok ? h('button', { class: 'kd-btn', type: 'button', onclick: () => (step === 1 ? (cleanup(), part1()) : step === 2 ? write(bot, stage) : play(bot, stage)) }, 'tentar de novo') : null,
        ok && step === 3 && level < 10 ? h('button', { class: 'kd-btn', type: 'button', onclick: () => ctx.onLevel(level + 1) }, `fase ${level + 1} →`) : null,
        ok && step < 3 && have >= 1 && level < 10 ? h('button', { class: 'kd-chip', type: 'button', onclick: () => ctx.onLevel(level + 1) }, `fase ${level + 1} →`) : null,
        h('button', { class: 'kd-chip', type: 'button', onclick: () => ctx.onLevel(level) }, 'jogar de novo'), h('button', { class: 'kd-chip', type: 'button', onclick: () => ctx.onBack() }, 'todas as fases'))));
    if (ok) S.later(() => { const el = stage.querySelector('.kx-stars'); if (el && el.isConnected) sparkle(el); }, 350);
  };

  // ---- parte 2: escrever na partitura ----
  const write = (bot, stage) => {
    const g = baseGroove(d, Math.random); let mine = emptyGroove(); let checked = false; const bpm = 80;
    if (window.__kidsTest) window.__kidsTest.groove = g;
    bot.set('think', 'escuta e escreve!'); const listen = h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playGroove(g, bpm, 2) }, '▶ ouvir o groove');
    const grid = h('div', { class: 'kx-grid8' });
    const draw = () => {
      grid.replaceChildren(h('span'), ...STEP_LABEL.map((l) => h('b', { class: 'kx-gh' }, l)), ...ROWS.flatMap((r) => [h('b', { class: 'kx-gl', style: `--c:${colorOf(r)}` }, ROW_NAME[r]),
        ...Array.from({ length: 8 }, (_, i) => { const wrong = checked && g.rows[r][i] !== mine.rows[r][i];
          return h('button', { type: 'button', class: `kx-cell${mine.rows[r][i] ? ' on' : ''}${wrong ? ' wrong' : ''}`, style: `--c:${colorOf(r)}`, 'aria-label': `${ROW_NAME[r]} no ${STEP_LABEL[i]}`, 'aria-pressed': String(!!mine.rows[r][i]), disabled: checked,
            onclick: () => { mine.rows[r][i] = mine.rows[r][i] ? 0 : 1; if (mine.rows[r][i]) VOICE[r](audio().currentTime + 0.01, 0.8); draw(); } }); })]));
    };
    const fb = h('p', { class: 'kd-fb kx-fb', 'aria-live': 'polite' });
    const check = h('button', { class: 'kd-btn', type: 'button', onclick: async () => {
      const m = cellsMatch(mine, g); const pct = Math.round((m.ok / 24) * 100); const need = profile.age === 'a' ? 80 : 90; const ok = pct >= need; checked = true; draw(); check.disabled = true;
      done[1] = pct; beep(ok); fb.className = `kd-fb kx-fb ${ok ? 'ok' : 'no'}`; fb.textContent = ok ? `isso! ${m.ok} de 24 casinhas certas` : `${m.ok} de 24 certas (precisa de ${need}%). olha as vermelhas!`;
      const wrongRows = [...new Set(m.wrong.map((x) => x.split(':')[0]))];
      const won = await rec(ok ? 2 : parts, m.ok, 24, wrongRows, 'escrever'); if (ok) parts = Math.max(parts, 2);
      stage.append(h('div', { class: 'row kx-act' }, scoreSvg(g)), h('button', { class: 'kd-btn', type: 'button', onclick: () => ladder(bot, stage, 2, ok, won) }, ok ? 'continuar' : 'ver as estrelas'));
    } }, '✔ conferir');
    stage.replaceChildren(h('p', { class: 'kd-q' }, 'toca nas casinhas e escreve o groove que você ouviu'), listen, grid, check, fb);
    S.reset(); draw(); S.later(() => playGroove(g, bpm, 2), 400);
  };

  // ---- parte 3: tocar ----
  const play = (bot, stage) => {
    const g = baseGroove(d, Math.random); const row = rowToPlay(d); const bpm = 70; const beats = 8; bot.set('think', `toca o ${ROW_NAME[row]}!`);
    const fb = h('p', { class: 'kd-fb kx-fb', 'aria-live': 'polite' }); const padBox = h('div', { class: 'kx-padbox' });
    const dots = h('div', { class: 'kx-target' }, ...Array.from({ length: 8 }, (_, i) => h('span', { class: g.rows[row][i] ? 'on' : '' }, g.rows[row][i] ? '●' : '·')), h('small', {}, STEP_LABEL.join(' ')));
    const chips = h('div', { class: 'row kd-modes' }, ...[['tela', '📱 na tela'], ['mic', '🥁 no pad / bateria']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { mode = k; chips.querySelectorAll('.kd-chip').forEach((b, i) => b.classList.toggle('on', ['tela', 'mic'][i] === mode)); } }, t)));
    const hear = h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playGroove(g, bpm, 2, row) }, '▶ ouvir o groove');
    const go = h('button', { class: 'kd-btn', type: 'button', onclick: async () => {
      go.disabled = true; hear.disabled = true;
      const pad = mode === 'tela' ? h('button', { class: 'kx-pad', type: 'button' }, `toca o ${ROW_NAME[row]}!`) : h('div', { class: 'kx-pad mic' }, '🎙 escutando…'); padBox.replaceChildren(pad);
      cap = capture({ mode, pad: mode === 'tela' ? pad : null, bpm, beats, tapSound: () => VOICE[row](audio().currentTime, 0.9), onCount: (n) => { fb.className = 'kd-fb kx-fb'; fb.textContent = n < 4 ? `contando… ${n + 1}` : '🎯 agora!'; } });
      if (window.__kidsTest) window.__kidsTest.expected = rowTimes(g, row, bpm, 2, 0);
      let res; try { res = await cap.done; } catch (e) { cap = null; mode = 'tela'; padBox.replaceChildren(); go.disabled = false; hear.disabled = false; fb.className = 'kd-fb kx-fb no'; fb.textContent = 'não consegui abrir o microfone. vou usar a tela!'; return; }
      cap = null; if (gone) return; padBox.replaceChildren();
      const j = judgeHits(res.onsets, rowTimes(g, row, bpm, 2, 0), windowFor(d, mode === 'mic')); const ok = roundOk(j); done[2] = Math.round((j.hits / Math.max(1, j.total)) * 100);
      beep(ok); fb.className = `kd-fb kx-fb ${ok ? 'ok' : 'no'}`; fb.textContent = `${ok ? 'isso! ' : ''}${j.hits} de ${j.total} batidas${j.extras ? ` · ${j.extras} a mais` : ''}`;
      const won = await rec(ok ? 3 : parts, j.hits, j.total, ok ? [] : [row], mode === 'mic' ? 'tocar-mic' : 'tocar-tela'); if (ok) parts = 3;
      S.later(() => ladder(bot, stage, 3, ok, won), 1400);
    } }, '🎯 minha vez');
    stage.replaceChildren(h('p', { class: 'kd-q' }, `toca só o ${ROW_NAME[row]}, no tempo certo`), dots, chips, h('div', { class: 'row kx-act' }, hear, go), padBox, fb);
    S.reset(); S.later(() => playGroove(g, bpm, 2, row), 400);
  };

  part1();
  return () => { gone = true; cleanup(); S.dispose(); if (cap) cap.cancel(); };
}
