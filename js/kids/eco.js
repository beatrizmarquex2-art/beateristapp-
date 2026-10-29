// Eco rítmico: a criança ouve um ritmo de 4 tempos e repete, na tela ou no pad / bateria de verdade (microfone).
import { h } from '../util.js';
import { audio, click } from '../audio.js';
import { session } from '../session.js';
import { stars as sparkle } from '../ui.js';
import * as N from '../notation.js';
import { layoutRhythm } from '../reading.js';
import { VOICE } from '../views/beatlab.js';
import { levelSpec, starsFor } from './levels.js';
import { ecoPattern, ecoTimes, judgeHits, roundOk, windowFor } from './groove.js';
import { capture } from './capture.js';
import { frame, showResult, introBox, beep } from './engine.js';
import * as FB from '../feedback.js';
import { svgEl } from './art.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function scoreOf(p) {
  const lines = []; for (let i = 0; i < p.cells.length; i += 4) lines.push(p.cells.slice(i, i + 4));
  return h('div', { class: 'kx-eco-score' }, ...lines.map((c) => svgEl(N.toSVG(layoutRhythm(c, { width: 340 })), 'kd-score')));
}
/** Toca a contagem e o ritmo. Devolve quantos ms dura tudo. */
function playPattern(p) {
  const c = audio(); const q = 60 / p.bpm; const t0 = c.currentTime + 0.2 + 4 * q;
  for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.6);
  ecoTimes(p, t0).forEach((t) => VOICE.sn(t, 0.9));
  return (t0 + p.beats * q - c.currentTime) * 1000 + 150;
}

export function runEco(game, ctx) {
  const { level, profile } = ctx; let mode = ctx.mode === 'mic' ? 'mic' : 'tela';
  const spec = levelSpec(level, profile.age); const { bot, stage } = frame(game, ctx, spec);
  const S = session(); // a rodada em curso: ouvir, contagem, tempo da vez e próxima rodada. Virou a rodada, recomeçou ou saiu: S.reset()/dispose() cancela tudo e cala o som.
  let gone = false; let i = 0; let right = 0; let restarts = 0; let misses = []; let cap = null; let finished = false;
  const clear = () => { S.reset(); if (cap) { cap.cancel(); cap = null; } };

  const intro = () => {
    bot.set('kit', 'ouve e repete!');
    stage.replaceChildren(introBox(spec, [h('p', { class: 'muted' }, `${spec.rounds} ritmos · ${mode === 'mic' ? '🎙 toca no seu pad de estudo ou na bateria de verdade (o microfone escuta; sem tocar na tela)' : '📱 toca na tela'}`),
      spec.secs ? h('p', { class: 'muted' }, `⏱ você tem ${spec.secs} segundos depois de ouvir.`) : null, spec.sudden ? h('p', { class: 'muted' }, '💥 se errar um ritmo, a fase recomeça.') : null,
      h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => { audio(); start(); } }, 'bora!')].filter(Boolean)));
  };
  const start = () => { clear(); i = 0; right = 0; finished = false; next(); };
  const next = () => { if (gone) return; clear(); if (i >= spec.rounds) { finish(); return; } round(ecoPattern(spec.d, Math.random)); };

  const round = (p) => {
    const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' }, ...Array.from({ length: spec.rounds }, (_, k) => h('i', { class: k < i ? 'done' : k === i ? 'now' : '' })));
    const status = h('p', { class: 'kd-fb kx-fb', 'aria-live': 'polite' });
    const show = spec.d <= 5; // nas fases altas a partitura fica escondida: só de ouvido
    const turn = h('button', { class: 'kd-btn', type: 'button', disabled: true, onclick: () => go() }, '🎯 minha vez');
    const hear = h('button', { class: 'kd-btn kd-listen', type: 'button', disabled: true, onclick: () => listen() }, '▶ ouvir de novo');
    const bar = spec.secs ? h('div', { class: 'kx-time', style: `--secs:${spec.secs}s`, hidden: true }, h('i')) : null;
    const padBox = h('div', { class: 'kx-padbox' });
    stage.replaceChildren(...[dots, bar, h('div', { class: 'kx-q' }, show ? scoreOf(p) : h('p', { class: 'kd-q' }, 'só de ouvido: escuta com atenção'), h('div', { class: 'row kx-act' }, hear, turn), padBox, status)].filter(Boolean));
    bot.set('think', 'escuta primeiro');
    let listened = 0;
    const listen = () => {
      if (spec.secs && listened >= 1) return; listened++; hear.disabled = true; turn.disabled = true; status.textContent = '🎧 ouvindo…';
      const ms = playPattern(p);
      S.later(() => { status.textContent = ''; turn.disabled = false; hear.disabled = !!spec.secs; bot.set('happy', 'sua vez!');
        if (spec.secs) { bar.hidden = false; S.later(() => { if (!turn.disabled) { turn.disabled = true; outcome(false, 'acabou o tempo!'); } }, spec.secs * 1000); } }, ms);
    };
    S.later(listen, 350);

    const go = async () => {
      turn.disabled = true; hear.disabled = true; if (bar) bar.hidden = true;
      const pad = mode === 'tela' ? h('button', { class: 'kx-pad', type: 'button' }, 'toca aqui!') : h('div', { class: 'kx-pad mic' }, '🎙 escutando…');
      padBox.replaceChildren(pad);
      cap = capture({ mode, pad: mode === 'tela' ? pad : null, bpm: p.bpm, beats: p.beats, tapSound: () => VOICE.sn(audio().currentTime, 0.9), onCount: (n) => { status.textContent = n < 4 ? `contando… ${n + 1}` : '🎯 agora!'; } });
      if (window.__kidsTest) window.__kidsTest.expected = ecoTimes(p, 0);
      let res;
      try { res = await cap.done; } catch (e) {
        cap = null; mode = 'tela'; padBox.replaceChildren(); status.textContent = ''; turn.disabled = false; hear.disabled = false;
        status.className = 'kd-fb kx-fb no'; status.textContent = e && e.name === 'NotAllowedError' ? 'sem permissão pro microfone. vou usar a tela!' : 'não consegui abrir o microfone. vou usar a tela!'; return;
      }
      cap = null; if (gone) return; padBox.replaceChildren();
      const j = judgeHits(res.onsets, ecoTimes(p, 0), windowFor(spec.d, mode === 'mic'));
      outcome(roundOk(j), `${j.hits} de ${j.total} batidas${j.extras ? ` · ${j.extras} a mais` : ''}`);
    };
    const outcome = (ok, text) => {
      beep(ok); status.className = `kd-fb kx-fb ${ok ? 'ok' : 'no'}`; status.textContent = `${ok ? 'isso! ' : ''}${text}`;
      if (ok) { right++; bot.set('cheer', FB.line('win')); sparkle(status); } else { misses.push(p.key); bot.set('oops', FB.line('lose')); }
      if (!ok && spec.sudden) { S.later(restart, 1600); return; }
      i++; S.later(next, ok ? 1100 : 1900);
    };
  };
  const restart = () => { if (gone) return; clear(); restarts++; bot.set('oops', 'recomeçando…'); stage.replaceChildren(h('div', { class: 'kx-restart' }, h('h2', {}, '💥 errou!'), h('p', {}, 'a fase recomeça do zero.'), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: start }, 'tentar de novo'))); };
  const finish = () => { if (finished) return; finished = true; showResult({ game, ctx, bot, stage, spec, right, total: spec.rounds, stars: starsFor(right, spec.rounds), misses, mode, restarts }); };
  intro();
  return () => { gone = true; clear(); S.dispose(); };
}
