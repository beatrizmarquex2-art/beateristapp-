// pauLta: o motor das fases (introdução do Paul, rodadas, tempo, "sem errar", explicação de cada erro e resultado).
import { h, icon } from '../util.js';
import { session } from '../session.js';
import { silence } from '../audio.js';
import { robo, tierOf } from '../kids/robo.js';
import { stars as sparkle } from '../ui.js';
import * as P from '../kids/progress.js';
import * as FB from '../feedback.js';
import { svgEl } from '../kids/art.js';
import { makeQuestion, phaseSpec, teachOf, revealOf, WORLDS, drumName, isDrum } from './worlds.js';
import { DRUM, drumStaff, clefStaff } from './draw.js';
import { noteName, CLEFS, placeText, sameSpotOther, letterOf, mk } from './music.js';
import * as sfx from './sfx.js';
import * as S from './score.js';
import * as V from './save.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const soundBtn = () => { const b = h('button', { type: 'button', class: 'btn small ghost pl-snd', onclick: () => { sfx.setMute(!sfx.muted()); paint(); } }); const paint = () => { b.textContent = sfx.muted() ? '🔇 sem som' : '🔊 som'; b.setAttribute('aria-pressed', String(!sfx.muted())); }; paint(); return b; };
export { soundBtn };

/** Cartões do que é novo na fase (Paul apresenta). */
export function teachCards(world, n) {
  const ids = teachOf(world, n); if (!ids.length) return null;
  if (isDrum(world)) return h('div', { class: 'pl-teach' }, ...ids.map((id) => h('div', { class: 'pl-card' }, svgEl(drumStaff(id), 'pl-mini'), h('b', {}, DRUM[id].name), h('small', {}, DRUM[id].where))));
  const clef = world;
  return h('div', { class: 'pl-teach' }, ...ids.map((x) => h('div', { class: 'pl-card' }, svgEl(clefStaff(clef, x), 'pl-mini'), h('b', {}, noteName(x)), h('small', {}, placeText(clef, x)))));
}

/**
 * Roda uma sequência de perguntas.
 * cfg: { host, title, world, n, mode, profile, spec:{rounds,secs,sudden,need,optSecs,streak}, make(i)->pergunta, intro?:Node, noScore?, onBack, onFinish(res) }
 */
export function runSession(cfg) {
  const { host, profile, mode, world } = cfg; const spec = { ...cfg.spec }; const S_ = session();
  const tier = tierOf(P.totalStars(profile.id)); const bot = robo({ mood: 'happy', tier, size: 92 });
  let q = null; let i = 0; let right = 0; const misses = []; let locked = true; let gone = false; let finished = false; let restarts = 0; let streak = 0; let best = 0; let left = 0; let armedAt = 0; let tid = 0; let secs = spec.secs; const relieved = [];
  const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'kx-stage pl-stage' });
  const tag = () => [secs ? `⏱ ${secs}s` : '', spec.sudden ? '💥 sem errar' : '', `${spec.rounds} rodadas`].filter(Boolean).join(' · ');
  const redoBtn = h('button', { type: 'button', class: 'btn small ghost pl-redo', hidden: true, title: 'recomeçar a fase do zero (pra buscar as 3 estrelas)', onclick: () => redo() }, '↻ recomeçar');
  const head = h('div', { class: 'kx-head' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => cfg.onBack() }, '‹ fases'), h('b', {}, cfg.title), redoBtn, soundBtn());
  host.replaceChildren(h('div', { class: 'kx-run pl-run', 'data-world': world }, head, h('div', { class: 'kx-botrow' }, bot.el), dots, stage));
  const paintDots = () => dots.replaceChildren(...Array.from({ length: spec.rounds }, (_, k) => h('i', { class: k < i ? 'done' : k === i ? 'now' : '' })));

  const intro = () => {
    bot.set(world === 'duel' ? 'cool' : 'happy', cfg.say || 'bora lá!');
    const opt = spec.optSecs ? h('label', { class: 'pl-opt' }, h('input', { type: 'checkbox', onchange: (e) => { secs = e.target.checked ? spec.optSecs : spec.secs; } }), h('span', {}, `⏱ desafio opcional: ${spec.optSecs} segundos por pergunta`)) : null;
    stage.replaceChildren(h('div', { class: 'kx-intro pl-intro' },
      h('h2', {}, cfg.sub || cfg.title), h('p', { class: 'kx-tag' }, tag()), cfg.intro || null,
      spec.sudden ? h('p', { class: 'muted' }, '💥 se errar uma, a fase recomeça do zero.') : h('p', { class: 'muted' }, spec.secs ? `⏱ você tem ${spec.secs} segundos em cada pergunta.` : 'sem pressa: errar também ensina.'), opt,
      spec.streak ? h('p', { class: 'muted' }, '🔥 novidade: conte quantas você acerta seguidas, sem errar.') : null,
      h('button', { class: 'kd-btn kx-go', type: 'button', onclick: begin }, world === 'duel' ? 'DUELAR!' : 'bora!')));
  };
  const countdown = (done) => {
    if (world !== 'duel' || reduced()) { done(); return; }
    let k = 3; const big = h('div', { class: 'pl-count', 'aria-live': 'assertive' }, '3'); bot.set('wow', 'preparados?'); stage.replaceChildren(big); sfx.tick(false);
    const step = () => { k--; if (k > 0) { big.textContent = String(k); big.classList.remove('pop'); void big.offsetWidth; big.classList.add('pop'); sfx.tick(false); S_.later(step, 650); } else { big.textContent = 'DUELO!'; sfx.tick(true); S_.later(done, 500); } };
    S_.later(step, 650);
  };
  const begin = () => { S_.reset(); sfx.ok(); i = 0; right = 0; streak = 0; finished = false; redoBtn.hidden = false; countdown(next); };
  /** recomeço voluntário (quem quer as 3 estrelas): volta pra primeira pergunta, sem punição; os erros já ficam anotados */
  const redo = () => { if (gone || finished) return; S_.reset(); locked = true; restarts++; i = 0; right = 0; streak = 0; next(); };
  const next = () => {
    if (gone) return; if (i >= spec.rounds) { finish(); return; }
    q = cfg.make(i); if (!q) { finish(); return; }
    locked = false; paintDots(); bot.set('think', q.say);
    if (q.clefName && world === 'duel') bot.set('think', `${q.clefName}!`);
    const opts = h('div', { class: `pl-opts n${q.options.length}${mode === 'imagens' ? ' img' : ''}` }, ...q.options.map((o, k) => {
      const b = h('button', { type: 'button', class: 'kd-btn kd-opt pl-opt-btn', 'data-id': o.id, onclick: () => pick(o.id, b) }, mode === 'imagens' ? svgEl(o.img, 'pl-optimg') : o.label);
      if (mode === 'imagens') b.setAttribute('aria-label', `imagem ${k + 1}`);
      return b;
    }));
    const fb = h('div', { class: 'kd-fb kx-fb pl-fb', 'aria-live': 'polite' });
    const bar = secs ? h('div', { class: 'kx-time', style: `--secs:${secs}s` }, h('i')) : null;
    const clefTag = q.kind === 'note' && world === 'duel' ? h('p', { class: `pl-clef ${q.clef}` }, q.clefName) : null;
    stage.replaceChildren(...[bar, clefTag, svgEl(q.promptSvg, 'pl-prompt'), h('p', { class: 'kd-q' }, q.say), opts, fb, spec.streak && streak > 1 ? h('p', { class: 'pl-streak' }, `🔥 ${streak} seguidas`) : null].filter(Boolean));
    stage._fb = fb; stage._opts = opts;
    if (secs) { left = secs * 1000; arm(); }
  };
  const arm = () => { S_.cancel(tid); armedAt = performance.now(); tid = S_.later(() => pick(null, null), left); const b = stage.querySelector('.kx-time i'); if (b) b.style.animationPlayState = ''; };
  const onVis = () => { if (locked || !secs || !q) return; if (document.hidden) { left = Math.max(400, left - (performance.now() - armedAt)); S_.cancel(tid); const b = stage.querySelector('.kx-time i'); if (b) b.style.animationPlayState = 'paused'; } else arm(); };
  document.addEventListener('visibilitychange', onVis);

  const tagsFor = (c) => {
    const t = [...(q.tags || [])];
    if (q.kind === 'note' && c != null && q.notes.length === 1) { const ch = Number(c); if (ch === sameSpotOther(q.clef, q.notes[0])) t.push('clave'); else if (letterOf(ch) === letterOf(q.notes[0])) t.push('oitava'); }
    return t;
  };
  const pick = (id, btn) => {
    if (locked || gone) return; locked = true; S_.cancel(tid);
    const bar = stage.querySelector('.kx-time i'); if (bar) bar.style.animationPlayState = 'paused';
    const ok = id !== null && id === q.ans; const fb = stage._fb;
    stage._opts.querySelectorAll('.kd-opt').forEach((b) => { b.disabled = true; if (b.dataset.id === q.ans) b.classList.add('right'); });
    if (q.sound) { if (q.sound.type === 'drum') sfx.drum(q.sound.ids, q.sound.fig); else if (q.sound.type === 'note') sfx.note(q.sound.ns[0]); }
    S_.later(() => (ok ? sfx.ok() : sfx.no()), 380);
    if (cfg.relief) cfg.relief(q, ok);
    if (ok) {
      right++; streak++; best = Math.max(best, streak); bot.set('cheer', FB.line('win')); fb.className = 'kd-fb kx-fb pl-fb ok'; fb.textContent = `isso! ${revealOf(q)} ⭐`; if (btn) { sparkle(btn); btn.classList.add('fb-pop'); }
      i++; S_.later(next, 1250); return;
    }
    streak = 0; for (const t of tagsFor(id)) misses.push(t); if (!misses.length) misses.push(q.key);
    bot.set('oops', id === null ? 'o tempo acabou!' : 'quase! olha a dica'); fb.className = 'kd-fb kx-fb pl-fb no'; if (btn) btn.classList.add('shake');
    const why = id === null ? `O tempo acabou! A resposta era ${revealOf(q)}.` : `${q.explain(id)} (Era: ${revealOf(q)}.)`;
    fb.replaceChildren(h('p', { class: 'pl-why' }, why));
    const go = h('button', { class: 'kd-btn pl-continue', type: 'button', disabled: true, onclick: () => { if (spec.sudden) restart(); else { i++; next(); } } }, spec.sudden ? 'recomeçar a fase' : 'entendi, próxima →');
    S_.later(() => { go.disabled = false; }, 700); fb.append(go);
    if (!spec.sudden && spec.rounds > 1) fb.append(h('button', { class: 'kd-chip pl-redo2', type: 'button', onclick: () => redo() }, '↻ recomeçar a fase (buscar as 3 ⭐)'));
    S_.later(() => { try { go.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch { /* ok */ } }, 120);
  };
  const restart = () => { if (gone) return; S_.reset(); restarts++; i = 0; right = 0; streak = 0; bot.set('oops', 'recomeçando…'); stage.replaceChildren(h('div', { class: 'kx-restart' }, h('h2', {}, '💥 errou!'), h('p', {}, 'a fase recomeça do zero. a dica já ficou guardada.'), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => { sfx.ok(); countdown(next); } }, 'tentar de novo'))); };
  const finish = () => { if (finished) return; finished = true; cfg.onFinish({ right, total: spec.rounds, misses, restarts, best, bot, stage, spec, secs, perfectRun: right === spec.rounds }); };
  intro();
  return () => { gone = true; document.removeEventListener('visibilitychange', onVis); S_.dispose(); silence(); };
}
