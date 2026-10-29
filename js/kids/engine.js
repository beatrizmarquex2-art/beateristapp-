// Motor das fases: perguntas, tempo, "sem errar", feedback na hora, % de acerto, estrelas e figurinha de prêmio.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { stars as sparkle } from '../ui.js';
import { robo, tierOf } from './robo.js';
import { levelSpec, levelTag, starsFor, pctOf } from './levels.js';
import * as P from './progress.js';
import * as Album from './album.js';
import * as FB from '../feedback.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function beep(ok) {
  try {
    const c = audio(); const t = c.currentTime + 0.01; const notes = ok ? [659, 880] : [220, 165];
    notes.forEach((f, i) => { const o = c.createOscillator(); const g = c.createGain(); o.type = ok ? 'triangle' : 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.11); g.gain.exponentialRampToValueAtTime(ok ? 0.25 : 0.14, t + i * 0.11 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.18); o.connect(c.destination); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.2); });
  } catch { /* sem áudio */ }
}
const countUp = (el, to, ms = 700) => {
  const n = el.querySelector('.n') || el;
  if (reduced() || !to) { n.textContent = String(to); return; }
  const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / ms); n.textContent = String(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
};

/**
 * Roda uma fase. `game`: { id, title, makeQuestion(rnd, d, i, ctx), render(q), options? (q)->[{id,label,color}], onShow(q), okText(q), noText(q), hint(key) , picked?(q,id) }
 * `ctx`: { host, level, profile, mode, onBack, onLevel(n) }. Devolve a função de limpeza.
 */
export function runLevel(game, ctx) {
  const { host, level, profile, mode = '' } = ctx; const spec = levelSpec(level, profile.age); const tier = tierOf(P.totalStars(profile.id));
  let q = null; let i = 0; let right = 0; let misses = []; let locked = true; let timer = 0; let restarts = 0; let gone = false;
  const bot = robo({ mood: 'happy', tier, size: 92 });
  const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'kx-stage' });
  const head = h('div', { class: 'kx-head' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => ctx.onBack() }, '‹ fases'), h('b', {}, `${game.title} · fase ${level}`), h('small', { class: 'muted' }, levelTag(spec)));
  host.replaceChildren(h('div', { class: 'kx-run' }, head, h('div', { class: 'kx-botrow' }, bot.el), dots, stage));
  const clear = () => { clearTimeout(timer); timer = 0; };
  const paintDots = () => dots.replaceChildren(...Array.from({ length: spec.rounds }, (_, k) => h('i', { class: k < i ? 'done' : k === i ? 'now' : '' })));

  const intro = () => {
    bot.set('happy', level === 0 ? 'oi! vamos aquecer?' : spec.sudden ? 'aqui não pode errar!' : spec.secs ? 'rápido! o tempo corre!' : 'bora lá!');
    stage.replaceChildren(h('div', { class: 'kx-intro' },
      h('h2', {}, level === 0 ? 'Aquecimento' : `Fase ${level}`), h('p', { class: 'kx-tag' }, levelTag(spec)),
      spec.sudden ? h('p', { class: 'muted' }, '💥 se errar uma, a fase recomeça do zero.') : null, spec.secs ? h('p', { class: 'muted' }, `⏱ você tem ${spec.secs} segundos em cada pergunta.`) : null,
      h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => { audio(); start(); } }, 'bora!')));
  };
  const start = () => { i = 0; right = 0; next(); };
  const next = () => { if (gone) return; if (i >= spec.rounds) { finish(); return; } q = game.makeQuestion(Math.random, spec.d, i, { mode }); show(); };

  const show = () => {
    locked = false; paintDots(); bot.set('think', game.say ? game.say(q) : 'qual será?');
    const opts = h('div', { class: `kd-opts kx-opts n${q.options.length}` }, ...q.options.map((o) => {
      const b = h('button', { type: 'button', class: 'kd-btn kd-opt', 'data-id': o.id, onclick: () => pick(o.id, b) }, game.optionLabel ? game.optionLabel(q, o) : o.label);
      if (o.color) b.style.setProperty('--c', o.color); return b;
    }));
    const fb = h('p', { class: 'kd-fb kx-fb', 'aria-live': 'polite' });
    const bar = spec.secs ? h('div', { class: 'kx-time', style: `--secs:${spec.secs}s` }, h('i')) : null;
    stage.replaceChildren(...[bar, game.render(q), opts, fb].filter(Boolean));
    stage._fb = fb; if (game.onShow) game.onShow(q);
    if (spec.secs) timer = setTimeout(() => pick(null, null), spec.secs * 1000);
  };

  const pick = (id, btn) => {
    if (locked || gone) return; locked = true; clear();
    const ok = id !== null && id === q.ans; const fb = stage._fb;
    stage.querySelectorAll('.kd-opt').forEach((b) => { b.disabled = true; if (b.dataset.id === q.ans) b.classList.add('right'); });
    if (game.picked) game.picked(q, id);
    beep(ok);
    if (ok) { right++; bot.set('cheer', FB.line('win')); fb.className = 'kd-fb kx-fb ok'; fb.textContent = game.okText ? game.okText(q) : 'acertou! ⭐'; if (btn) { sparkle(btn); btn.classList.add('fb-pop'); } }
    else {
      misses.push(q.key || q.ans); bot.set('oops', id === null ? 'o tempo acabou!' : FB.line('lose')); fb.className = 'kd-fb kx-fb no';
      fb.textContent = id === null ? `acabou o tempo! ${game.noText ? game.noText(q) : ''}` : (game.noText ? game.noText(q) : 'quase!'); if (btn) btn.classList.add('shake');
    }
    if (!ok && spec.sudden) { timer = setTimeout(restart, 1500); return; }
    i++; timer = setTimeout(next, ok ? 1000 : 1700);
  };
  const restart = () => {
    if (gone) return; restarts++; bot.set('oops', 'recomeçando…');
    stage.replaceChildren(h('div', { class: 'kx-restart' }, h('h2', {}, '💥 errou!'), h('p', {}, 'a fase recomeça do zero.'), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => { misses = misses.slice(); start(); } }, 'tentar de novo')));
  };

  const finish = () => (ctx.onFinish ? ctx.onFinish({ right, total: spec.rounds, stars: starsFor(right, spec.rounds), misses, restarts, bot, stage, spec }) : showResult({ game, ctx, bot, stage, spec, right, total: spec.rounds, stars: starsFor(right, spec.rounds), misses, mode, restarts }));
  intro();
  return () => { gone = true; clear(); };
}

/** Tela de resultado: % de acerto, estrelas, figurinha de prêmio, o que treinar e os botões. Serve pra qualquer jogo. */
export async function showResult({ game, ctx, bot, stage, spec, right, total, stars, misses, mode = '', restarts = 0, pct: pctIn, note = '' }) {
  const { level, profile } = ctx; const pct = pctIn != null ? pctIn : pctOf(right, total);
  const { gain } = await P.record(profile.id, { game: game.id, level, right, total, stars, misses, mode });
  const won = Album.grant(profile.id, gain); // novas figurinhas (se houver)
  const next$ = level < 10 && stars >= 1;
  bot.set(stars >= 2 ? 'cheer' : stars === 1 ? 'happy' : 'oops', stars === 3 ? FB.line('great') : stars >= 1 ? FB.line('win') : FB.line('lose'));
  const pctEl = h('b', { class: 'kx-pct' }, h('span', { class: 'n' }, '0'), h('small', {}, '%'));
  const starsEl = h('div', { class: 'kx-stars', 'aria-label': `${stars} de 3 estrelas` }, ...[1, 2, 3].map((n) => h('span', { class: `kx-star${n <= stars ? ' on' : ''}`, style: `--d:${n * 0.25}s` }, '★')));
  const missList = [...new Set(misses)].map((k) => (game.hint ? game.hint(k) : '')).filter(Boolean);
  stage.replaceChildren(h('div', { class: 'kx-result' },
    h('h2', {}, stars >= 1 ? 'Fase concluída!' : 'Quase lá!'), pctEl, h('p', { class: 'muted' }, note || `${right} de ${total} certas${restarts ? ` · recomeçou ${restarts}×` : ''}`), starsEl,
    won.length ? h('div', { class: 'kx-reward' }, h('p', { class: 'kx-reward-t' }, `🎁 ${won.length === 1 ? 'figurinha nova!' : `${won.length} figurinhas novas!`}`), h('div', { class: 'kx-pack' }, ...won.map((c) => Album.cardEl(c, { fresh: true })))) : null,
    missList.length ? h('div', { class: 'kx-miss' }, h('b', {}, 'pra treinar mais:'), h('ul', {}, ...missList.slice(0, 4).map((t) => h('li', {}, t)))) : null,
    h('div', { class: 'row kx-act' },
      next$ ? h('button', { class: 'kd-btn', type: 'button', onclick: () => ctx.onLevel(level + 1) }, `fase ${level + 1} →`) : null,
      h('button', { class: next$ ? 'kd-chip' : 'kd-btn', type: 'button', onclick: () => ctx.onLevel(level) }, 'jogar de novo'),
      h('button', { class: 'kd-chip', type: 'button', onclick: () => ctx.onBack() }, 'todas as fases'))));
  countUp(pctEl, pct); if (stars >= 1) setTimeout(() => { if (starsEl.isConnected) sparkle(starsEl); }, 400);
}
/** Cabeçalho comum das fases: robô, título e pontinhos. */
export function frame(game, ctx, spec) {
  const tier = tierOf(P.totalStars(ctx.profile.id)); const bot = robo({ mood: 'happy', tier, size: 92 });
  const stage = h('div', { class: 'kx-stage' });
  const head = h('div', { class: 'kx-head' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => ctx.onBack() }, '‹ fases'), h('b', {}, `${game.title} · fase ${ctx.level}`), h('small', { class: 'muted' }, levelTag(spec)));
  ctx.host.replaceChildren(h('div', { class: 'kx-run' }, head, h('div', { class: 'kx-botrow' }, bot.el), stage));
  return { bot, stage };
}
export const introBox = (spec, extra) => h('div', { class: 'kx-intro' }, h('h2', {}, spec.level === 0 ? 'Aquecimento' : `Fase ${spec.level}`), h('p', { class: 'kx-tag' }, levelTag(spec)), ...extra);
export { beep };
