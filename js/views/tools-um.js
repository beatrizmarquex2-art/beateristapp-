// Achar o 1: o groove começa num lugar qualquer do compasso (sem contagem). Você toca no botão toda vez que sente o 1.
// O app mostra quantas vezes você caiu no 1 e se estava adiantada ou atrasada. 5 rodadas por partida.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as T from '../tools-logic.js';
import { audio, click, perfToCtx, scheduler } from '../audio.js';
import { VOICE, velOf } from './beatlab.js';
import { banner, stars } from '../ui.js';
import { back } from './tools-common.js';
import * as FB from '../feedback.js';

const KEY = 'setting-achar1';
const BARS = 4, ROUNDS = 5;
const conf = () => ({ lv: 1, best: 0, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const pool = (lv) => B.PRESETS.filter((p) => p.kind === 'groove' && p.steps !== 12 && B.levelOf(p) === lv);

export function mountUm(host) {
  let round = 0, pts = 0, q = null, run = null, startT = 0, taps = [], res = null, showOne = false;
  const body = h('div');
  const next = () => {
    const c = conf(); const list = pool(c.lv); const g = list[Math.floor(Math.random() * list.length)];
    const offset = 1 + Math.floor(Math.random() * (g.steps - 1)); const bpm = Math.max(80, Math.min(120, g.bpm));
    q = { g, offset, bpm }; taps = []; res = null; showOne = false;
  };
  const stop = () => { if (run) run.stop(); run = null; };
  const play = (withOne = false) => {
    stop(); taps = []; res = null; showOne = withOne; audio();
    const { g, offset, bpm } = q; const step = 60 / bpm / (g.steps / 4); const total = BARS * g.steps;
    run = scheduler((i) => {
      if (i >= total) return null; const s = (i + offset) % g.steps;
      return { at: i * step, play: (t) => { if (i === 0) startT = t; B.hitsAt(g, s).forEach((r) => VOICE[r](t, velOf(g, s))); if (withOne && s === 0) click(t, 2, 0.9); },
        ui: () => { if (s === 0 && withOne) flash(); } };
    }, { onEnd: () => { run = null; if (!withOne) finish(); else draw(); } });
    draw();
  };
  const flash = () => { const b = body.querySelector('.um-tap'); if (!b) return; b.classList.remove('one'); void b.offsetWidth; b.classList.add('one'); };
  const tap = (e) => { if (!run || showOne) return; e.preventDefault(); taps.push(perfToCtx(e.timeStamp) - startT); const b = e.currentTarget; b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); };
  const finish = () => {
    res = T.oneScore(taps, { bpm: q.bpm, steps: q.g.steps, offset: q.offset });
    // ponto: achou o 1 em pelo menos 2 dos compassos (o primeiro 1 pode vir rápido demais) e quase não tocou fora
    const good = res.hits >= 2 && res.total - res.hits <= 1; if (good) pts++;
    round++;
    if (round >= ROUNDS) { const c = conf(); if (pts > (c.best || 0)) store.upsert('setting', KEY, { best: pts }); }
    draw(); FB.result(good, body.querySelector('.um-res') || body);
  };
  const where = () => { const per = q.g.steps / 4; const beat = Math.floor(q.offset / per) + 1; const sub = q.offset % per; return sub === 0 ? `no tempo ${beat}` : `no "${['', 'e', '&', 'a'][per === 4 ? sub : sub * 2]}" do ${beat}`; };
  const draw = () => {
    const c = conf(); const over = round >= ROUNDS;
    body.replaceChildren(...[
      h('section', { class: 'card pad tr-ctrl' }, h('div', { class: 'tr-line' }, h('span', { class: 'tp-lab' }, 'nível'), h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Nível' },
        ...[[1, 'fácil'], [2, 'médio'], [3, 'difícil']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(c.lv === v), class: `lib-tab${c.lv === v ? ' on' : ''}`, onclick: () => store.upsert('setting', KEY, { lv: v }).then(() => { stop(); round = 0; pts = 0; next(); draw(); }) }, t)))),
        h('p', { class: 'muted' }, `rodada ${Math.min(round + (res ? 0 : 1), ROUNDS)} de ${ROUNDS} · pontos ${pts} · recorde ${Math.max(c.best || 0, pts)}`)),
      h('section', { class: 'card pad ft-center' },
        h('p', { class: 'muted' }, run && !showOne ? 'toque no botão em todo 1 que você sentir' : 'aperte ▶: o groove começa no meio. ache o 1 e toque nele (4 compassos).'),
        h('button', { class: 'um-tap', type: 'button', 'aria-label': 'Toque no 1', onpointerdown: tap }, '1'),
        over ? null : h('div', { class: 'row ft-row' }, h('button', { class: `bl-play${run ? ' on' : ''}`, type: 'button', 'aria-label': run ? 'Parar' : 'Tocar', onclick: () => (run ? (stop(), draw()) : play(false)) }, icon(run ? 'stop' : 'play', 28))),
        res ? h('div', { class: 'um-res' },
          h('p', { class: `tr-status ${res.hits >= 2 ? 'good' : 'bad'}` }, `${res.hits} no 1 de ${res.total} toques${res.avg != null ? ` · ${Math.abs(res.avg) < 25 ? 'em cima' : res.avg > 0 ? `${res.avg} ms atrasada` : `${-res.avg} ms adiantada`}` : ''}`),
          h('p', { class: 'muted' }, `${q.g.name} a ${q.bpm} BPM, começando ${where()}.`),
          h('div', { class: 'row ft-row' }, h('button', { class: 'btn', type: 'button', onclick: () => play(true) }, 'ouvir com o 1 marcado'),
            !over ? h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); next(); draw(); } }, 'próxima') : null)) : null,
        over ? h('div', { class: 'empty' }, h('p', { class: 'hand' }, `fim: ${pts} de ${ROUNDS}`), h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); round = 0; pts = 0; next(); draw(); } }, 'jogar de novo')) : null),
      h('p', { class: 'pad-x lib-note' }, 'dica: o 1 costuma ter bumbo e vem depois da caixa do 4. respira, ouve 1 compasso inteiro antes de tocar.')].filter(Boolean));
  };
  next();
  host.append(banner('Achar o 1', 'o groove começa no meio. cadê o 1?'), back(), body);
  draw();
  return stop;
}
