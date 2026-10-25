// Treinos de leitura e de escuta.
// Leitura: o app mostra um compasso, conta 4 e você toca na tela o que está escrito; cada nota volta pintada (no tempo, cedo/tarde, faltou).
// Escuta (ditado): o app toca um compasso e você escolhe qual das 4 partituras foi.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import { audio, click, snare, perfToCtx } from '../audio.js';
import { toSVG } from '../notation.js';
import { LEVEL_NAMES, genBar, onsets, evaluate, distractors, shuffle, layoutRhythm } from '../reading.js';
import { banner, toast, stars } from '../ui.js';
import { parts } from './tempo.js';

const { chips, line, bpmRow, clampBpm } = parts;
const KEY = 'setting-treinos', KIND = 'treino';
const cfg = () => ({ lv: 1, bpm: 70, bars: 1, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (patch) => store.upsert('setting', KEY, patch);
const MARK = { ok: '#1f9d4a', cedo: '#d98a00', tarde: '#d98a00', faltou: '#c8102e' };
const QUESTIONS = 10;

/** Uma pauta por compasso (4 tempos), cada uma com as suas cores. */
function score(bar4s, marks = []) {
  const box = h('div', { class: 'tr-score' }); let k = 0;
  for (const bar of bar4s) {
    const n = bar.reduce((s, p) => s + [...p].filter((c) => c === '1').length, 0);
    const f = h('figure', { class: 'tr-bar' }); f.innerHTML = toSVG(layoutRhythm(bar, { width: 360, marks: marks.slice(k, k + n) })); // só números nossos
    k += n; box.append(f);
  }
  return box;
}
const chunk = (beats) => { const out = []; for (let i = 0; i < beats.length; i += 4) out.push(beats.slice(i, i + 4)); return out; };


/** Agenda contagem (4 cliques) + cliques nos tempos (+ caixa, se `play`). Devolve o instante do 1º tempo (relógio do áudio). */
function schedule(beats, bpm, { play = false, clickAll = true } = {}) {
  const c = audio(); const q = 60 / bpm; const t0 = c.currentTime + 0.25 + 4 * q;
  for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1);
  if (clickAll) for (let b = 0; b < beats.length; b++) click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.6);
  if (play) for (const e of onsets(beats, bpm)) snare(t0 + e.t, 0.8);
  return t0;
}

function history(mode) {
  const recs = store.list(KIND).filter((r) => r.data.mode === mode).sort((a, b) => b.data.at - a.data.at);
  if (!recs.length) return null;
  const best = {}; for (const r of recs) best[r.data.lv] = Math.max(best[r.data.lv] || 0, r.data.score);
  return h('section', { class: 'card pad tr-hist' }, h('h3', {}, 'seu histórico'),
    h('p', { class: 'muted' }, Object.entries(best).map(([lv, s]) => `melhor no nível ${lv}: ${s}`).join(' · ')),
    h('ul', {}, ...recs.slice(0, 5).map((r) => h('li', {}, h('b', {}, `${r.data.score}`), ` · nível ${r.data.lv} · ${r.data.bpm} BPM · `,
      new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(r.data.at))))));
}

function controls(c, draw, { bars = true } = {}) {
  return h('section', { class: 'card pad tr-ctrl' },
    line('nível', chips([[1, '1'], [2, '2'], [3, '3']], c.lv, (v) => save({ lv: v }).then(() => draw(true)), 'Nível')),
    h('p', { class: 'muted tr-lvname' }, LEVEL_NAMES[c.lv]),
    line('andamento', bpmRow(c, (v) => save({ bpm: clampBpm(Math.min(160, v)) }).then(() => draw(false)))),
    bars ? line('compassos', chips([[1, '1'], [2, '2']], c.bars, (v) => save({ bars: v }).then(() => draw(true)), 'Compassos')) : null);
}

/* ---------- leitura ---------- */
function leitura(host) {
  let beats = null; let run = null; let lastResult = null;
  const body = h('div');
  const stop = () => { if (run) { clearTimeout(run.timer); run.off(); run.pad.classList.remove('live'); run = null; } };
  const draw = (fresh) => {
    stop(); const c = cfg();
    if (fresh || !beats || beats.length !== c.bars * 4) { beats = [...genBar(c.lv), ...(c.bars > 1 ? genBar(c.lv) : [])]; lastResult = null; }
    const expected = onsets(beats, c.bpm);
    const marks = lastResult ? lastResult.notes.map((n) => MARK[n.st]) : [];
    const pad = h('button', { class: 'tr-pad', type: 'button', 'aria-label': 'Toque aqui no ritmo' }, h('span', {}, 'toque aqui'), h('small', {}, 'ou aperte qualquer tecla'));
    const status = h('p', { class: 'tr-status', 'aria-live': 'polite' }, lastResult ? '' : 'leia, aperte ▶ e toque junto depois do “4” da contagem.');
    const start = () => {
      stop(); const ac = audio(); const q = 60 / c.bpm;
      const t0 = schedule(beats, c.bpm);
      const taps = [];
      const onTap = (e) => { if (e.type === 'keydown' && (e.repeat || e.metaKey || e.ctrlKey)) return; if (e.cancelable) e.preventDefault(); taps.push(perfToCtx(e.timeStamp || performance.now()) - t0); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
      pad.addEventListener('pointerdown', onTap); document.addEventListener('keydown', onTap);
      const off = () => { pad.removeEventListener('pointerdown', onTap); document.removeEventListener('keydown', onTap); };
      // segundos desde o 1º tempo, no relógio do som (para quem testa tocando por script)
      pad.clock = () => perfToCtx(performance.now()) - t0; pad.dataset.onsets = JSON.stringify(expected.map((e) => e.t));
      pad.classList.add('live'); status.textContent = 'conta: 1, 2, 3, 4…';
      const end = (t0 - ac.currentTime + beats.length * q + 0.4) * 1000;
      run = { pad, off, timer: setTimeout(async () => {
        off(); run = null;
        lastResult = evaluate(taps, expected, c.bpm);
        await store.upsert(KIND, null, { mode: 'leitura', lv: c.lv, bpm: c.bpm, bars: c.bars, score: lastResult.score, at: Date.now() });
        if (lastResult.score >= 90) stars(pad);
        draw(false);
      }, end) };
      setTimeout(() => { if (run && run.pad === pad) status.textContent = 'agora!'; }, (t0 - ac.currentTime) * 1000);
    };
    const listen = () => { stop(); schedule(beats, c.bpm, { play: true }); };
    let summary = null;
    if (lastResult) {
      const r = lastResult; const devs = r.notes.filter((n) => n.ms != null).map((n) => n.ms);
      const avg = devs.length ? Math.round(devs.reduce((s, x) => s + x, 0) / devs.length) : 0;
      const tip = r.hits < r.total ? 'faltaram notas: leia o compasso em voz alta (“1 e & a”) antes de tocar.' : Math.abs(avg) > 25 ? (avg < 0 ? `você está adiantando (${avg} ms em média). respira e espera o clique.` : `você está atrasando (+${avg} ms em média). toque mais junto do clique.`) : r.extra ? 'cuidado com toques a mais nas pausas.' : 'leitura limpa! sobe 5 BPM ou passa de nível.';
      summary = h('section', { class: 'card pad tr-res' },
        h('div', { class: 'tr-big' }, h('b', {}, String(r.score)), h('span', {}, 'nota')),
        h('p', {}, `${r.hits}/${r.total} notas · ${r.notes.filter((n) => n.st === 'ok').length} no tempo${r.extra ? ` · ${r.extra} a mais` : ''}`),
        h('p', { class: 'tr-legend' }, h('i', { style: { background: MARK.ok } }), 'no tempo ', h('i', { style: { background: MARK.cedo } }), 'cedo/tarde ', h('i', { style: { background: MARK.faltou } }), 'faltou'),
        h('p', { class: 'muted' }, tip));
    }
    body.replaceChildren(...[controls(c, draw), score(chunk(beats), marks),
      h('div', { class: 'row tr-actions' },
        h('button', { class: 'bl-play tr-go', type: 'button', 'aria-label': 'Começar leitura', onclick: start }, icon('play', 26)),
        h('button', { class: 'btn', type: 'button', onclick: listen }, 'ouvir como é'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => draw(true) }, 'outro compasso')),
      status, pad, summary, history('leitura')].filter(Boolean));
  };
  host.append(body); draw(true);
  return stop;
}

/* ---------- escuta (ditado rítmico) ---------- */
function escuta(host) {
  let q = null; let n = 0, right = 0;
  const body = h('div');
  const next = () => { const c = cfg(); const ans = genBar(c.lv); const opts = shuffle([ans, ...distractors(ans, c.lv)]); q = { ans, opts, picked: null, okIdx: opts.indexOf(ans) }; };
  const draw = (reset) => {
    const c = cfg();
    if (reset) { n = 0; right = 0; next(); }
    if (!q) next();
    const play = () => schedule(q.ans, c.bpm, { play: true });
    const pick = async (i) => {
      if (q.picked != null) return;
      q.picked = i; n++; if (i === q.okIdx) right++;
      if (n >= QUESTIONS) {
        const sc = Math.round((right / QUESTIONS) * 100);
        await store.upsert(KIND, null, { mode: 'escuta', lv: c.lv, bpm: c.bpm, score: sc, at: Date.now() });
        toast(`rodada fechada: ${right}/${QUESTIONS} ✓`);
      }
      draw(false);
    };
    const done = q.picked != null;
    const opts = q.opts.map((b, i) => {
      const st = !done ? '' : i === q.okIdx ? ' ok' : i === q.picked ? ' no' : '';
      return h('button', { class: `tr-opt${st}`, type: 'button', 'aria-label': `Opção ${'ABCD'[i]}`, onclick: () => pick(i) }, h('b', {}, 'ABCD'[i]), score([b]));
    });
    const feedback = done ? h('p', { class: `tr-status ${q.picked === q.okIdx ? 'good' : 'bad'}`, 'aria-live': 'polite' }, q.picked === q.okIdx ? 'isso! ✓' : `era a ${'ABCD'[q.okIdx]}. ouve de novo comparando.`) : h('p', { class: 'tr-status' }, 'aperte ▶, ouça (pode repetir) e escolha a partitura.');
    const finished = n >= QUESTIONS;
    body.replaceChildren(...[controls(c, () => draw(true), { bars: false }),
      h('div', { class: 'row tr-actions' },
        h('button', { class: 'bl-play tr-go', type: 'button', 'aria-label': 'Ouvir o ritmo', onclick: play }, icon('play', 26)),
        h('span', { class: 'tr-count' }, `${right}/${n} · questão ${Math.min(n + (done ? 0 : 1), QUESTIONS)} de ${QUESTIONS}`),
        done && !finished ? h('button', { class: 'btn primary', type: 'button', onclick: () => { next(); draw(false); } }, 'próxima') : null,
        finished ? h('button', { class: 'btn primary', type: 'button', onclick: () => draw(true) }, 'nova rodada') : null),
      feedback, h('div', { class: 'tr-opts' }, ...opts), history('escuta')].filter(Boolean));
  };
  host.append(body); draw(true);
  return () => {};
}

export function mount(host, parts = []) {
  const tab = parts[0] === 'escuta' ? 'escuta' : 'leitura';
  host.append(banner('Treinos', tab === 'leitura' ? 'ler e tocar na hora' : 'ouvir e reconhecer'),
    h('div', { class: 'chips lib-tabs bt-tabs' },
      h('a', { class: `lib-tab${tab === 'leitura' ? ' on' : ''}`, href: '#/treinos' }, 'leitura'),
      h('a', { class: `lib-tab${tab === 'escuta' ? ' on' : ''}`, href: '#/treinos/escuta' }, 'escuta (ditado)')));
  return tab === 'leitura' ? leitura(host) : escuta(host);
}
