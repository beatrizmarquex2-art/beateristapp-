// Toque as figuras: o app mostra a partitura (semínima, colcheias, semicolcheias, pausas, variações…) e a criança LÊ e toca no tempo,
// na tela ou no pad / bateria de verdade (o microfone escuta). Pode ouvir antes. No fim de cada rodada mostra a precisão em ms.
import { h } from '../util.js';
import { audio, click } from '../audio.js';
import { session } from '../session.js';
import { stars as sparkle } from '../ui.js';
import * as N from '../notation.js';
import { layoutRhythm } from '../reading.js';
import { VOICE } from '../views/beatlab.js';
import { levelSpec, starsFor } from './levels.js';
import { toquePattern, ecoTimes, judgeHits, roundOk, windowFor } from './groove.js';
import { capture } from './capture.js';
import { frame, showResult, introBox, beep } from './engine.js';
import * as FB from '../feedback.js';
import { svgEl } from './art.js';

function scoreOf(p) {
  const lines = []; for (let i = 0; i < p.cells.length; i += 4) lines.push(p.cells.slice(i, i + 4));
  return h('div', { class: 'kx-eco-score' }, ...lines.map((c) => svgEl(N.toSVG(layoutRhythm(c, { width: 340 })), 'kd-score')));
}
/** Contagem de 4 + o ritmo tocado pelo app. Devolve quantos ms dura. */
function playPattern(p) {
  const c = audio(); const q = 60 / p.bpm; const t0 = c.currentTime + 0.2 + 4 * q;
  for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.6);
  ecoTimes(p, t0).forEach((t) => VOICE.sn(t, 0.9));
  return (t0 + p.beats * q - c.currentTime) * 1000 + 150;
}

export function runToque(game, ctx) {
  const { level, profile } = ctx; let mode = ctx.mode === 'mic' ? 'mic' : 'tela';
  const spec = levelSpec(level, profile.age); const { bot, stage } = frame(game, ctx, spec);
  const S = session(); let gone = false; let i = 0; let right = 0; let restarts = 0; const misses = []; let cap = null; let finished = false; let bpmAdj = 0;
  const clear = () => { S.reset(); if (cap) { cap.cancel(); cap = null; } };

  const intro = () => {
    bot.set('kit', 'lê e toca!');
    const modeBtns = h('div', { class: 'row kd-modes' }, ...[['tela', '📱 na tela'], ['mic', '🎙 pad ou bateria']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { mode = k; intro(); } }, t)));
    const base = toquePattern(spec.d).bpm;
    const bpmRow = h('div', { class: 'row kd-modes' }, h('button', { type: 'button', class: 'kd-chip', 'aria-label': 'menos 5 BPM', onclick: () => { bpmAdj = Math.max(-30, bpmAdj - 5); intro(); } }, '−'), h('b', {}, `${base + bpmAdj} BPM`), h('button', { type: 'button', class: 'kd-chip', 'aria-label': 'mais 5 BPM', onclick: () => { bpmAdj = Math.min(40, bpmAdj + 5); intro(); } }, '+'));
    const tier = level <= 3 ? 'iniciante' : level <= 7 ? 'intermediário' : 'avançado';
    stage.replaceChildren(introBox(spec, [h('p', { class: 'kx-tag' }, `modo ${tier}`), h('p', { class: 'muted' }, `${spec.rounds} ritmos pra ler e tocar · ${mode === 'mic' ? '🎙 toca no seu pad de estudo ou na bateria (o microfone escuta)' : '📱 toca na tela'}`),
      modeBtns, bpmRow, spec.sudden ? h('p', { class: 'muted' }, '💥 se errar um ritmo, a fase recomeça.') : null,
      h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => { audio(); start(); } }, 'bora!')].filter(Boolean)));
  };
  const start = () => { clear(); i = 0; right = 0; finished = false; next(); };
  const next = () => { if (gone) return; clear(); if (i >= spec.rounds) { finish(); return; } const p = toquePattern(spec.d); p.bpm = Math.max(40, p.bpm + bpmAdj); round(p); };

  const round = (p) => {
    const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' }, ...Array.from({ length: spec.rounds }, (_, k) => h('i', { class: k < i ? 'done' : k === i ? 'now' : '' })));
    const status = h('p', { class: 'kd-fb kx-fb', 'aria-live': 'polite' }, `${p.bpm} BPM · leia e toque depois da contagem`);
    const hear = h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => listen() }, '🎧 ouvir antes');
    const turn = h('button', { class: 'kd-btn', type: 'button', onclick: () => go() }, '🎯 tocar agora');
    const padBox = h('div', { class: 'kx-padbox' });
    stage.replaceChildren(dots, h('div', { class: 'kx-q' }, scoreOf(p), h('div', { class: 'row kx-act' }, hear, turn), padBox, status));
    bot.set('think', 'leia primeiro');
    const listen = () => { hear.disabled = true; turn.disabled = true; status.textContent = '🎧 ouvindo…'; const ms = playPattern(p); S.later(() => { hear.disabled = false; turn.disabled = false; status.textContent = 'agora é com você!'; bot.set('happy', 'sua vez!'); }, ms); };

    const go = async () => {
      turn.disabled = true; hear.disabled = true; S.reset();
      const pad = mode === 'tela' ? h('button', { class: 'kx-pad', type: 'button' }, 'toca aqui!') : h('div', { class: 'kx-pad mic' }, '🎙 escutando…');
      padBox.replaceChildren(pad);
      cap = capture({ mode, pad: mode === 'tela' ? pad : null, bpm: p.bpm, beats: p.beats, clickBeats: mode === 'tela', tapSound: () => VOICE.sn(audio().currentTime, 0.9), onCount: (n) => { status.textContent = n < 4 ? `contando… ${n + 1}` : '🎯 agora!'; } });
      if (window.__kidsTest) window.__kidsTest.expected = ecoTimes(p, 0);
      let res;
      try { res = await cap.done; } catch (e) {
        cap = null; mode = 'tela'; padBox.replaceChildren(); turn.disabled = false; hear.disabled = false;
        status.className = 'kd-fb kx-fb no'; status.textContent = e && e.name === 'NotAllowedError' ? 'sem permissão pro microfone. vou usar a tela!' : 'não consegui abrir o microfone. vou usar a tela!'; return;
      }
      cap = null; if (gone) return; padBox.replaceChildren();
      const j = judgeHits(res.onsets, ecoTimes(p, 0), windowFor(spec.d, mode === 'mic'));
      const avg = j.devs.length ? Math.round(j.devs.reduce((a, b) => a + b, 0) / j.devs.length) : 0;
      outcome(roundOk(j), `${j.hits} de ${j.total} batidas${j.extras ? ` · ${j.extras} a mais` : ''}${j.devs.length ? ` · média ${avg > 0 ? '+' : ''}${avg} ms` : ''}`);
    };
    const outcome = (ok, text) => {
      beep(ok); status.className = `kd-fb kx-fb ${ok ? 'ok' : 'no'}`; status.textContent = `${ok ? 'isso! ' : ''}${text}`;
      if (ok) { right++; bot.set('cheer', FB.line('win')); sparkle(status); } else { misses.push(p.key); bot.set('oops', FB.line('lose')); }
      if (!ok && spec.sudden) { S.later(restart, 1800); return; }
      i++; S.later(next, ok ? 1500 : 2300);
    };
  };
  const restart = () => { if (gone) return; clear(); restarts++; bot.set('oops', 'recomeçando…'); stage.replaceChildren(h('div', { class: 'kx-restart' }, h('h2', {}, '💥 errou!'), h('p', {}, 'a fase recomeça do zero.'), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: start }, 'tentar de novo'))); };
  const finish = () => { if (finished) return; finished = true; showResult({ game, ctx, bot, stage, spec, right, total: spec.rounds, stars: starsFor(right, spec.rounds), misses, mode, restarts }); };
  intro();
  return () => { gone = true; clear(); S.dispose(); };
}
