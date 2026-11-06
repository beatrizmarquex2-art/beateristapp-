// Treinos de leitura e de escuta.
// Leitura: o app mostra um compasso, conta 4 e você toca na tela o que está escrito; cada nota volta pintada (no tempo, cedo/tarde, faltou).
// Escuta (ditado): o app toca um compasso e você escolhe qual das 4 partituras foi.
// Montar (ditado de células): o app toca 4 tempos e você monta o compasso tocando nas células; 5 vidas e recorde.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import { audio, click, snare, perfToCtx } from '../audio.js';
import { voz, getSom, setSom, SONS, VELOCIDADES, BPM_MAX, velocidadeDe } from '../toca-som.js';
import { toSVG } from '../notation.js';
import { PATH, TIERS, PASS_SCORE, LEVEL_NAMES, genBar, onsets, evaluate, distractors, shuffle, layoutRhythm, cellsFor, checkCells } from '../reading.js';
import { banner, toast, stars } from '../ui.js';
import { parts } from './tempo.js';
import * as FB from '../feedback.js';
import { mountRitmo } from '../kids/ritmo.js';
import { aprender } from './figuras-aprender.js';
import { tipBox } from '../tipbox.js';
import { capture } from '../kids/capture.js';
import { session } from '../session.js';

const { chips, line, bpmRow, clampBpm } = parts;
const KEY = 'setting-treinos', KIND = 'treino';
const cfg = () => ({ lv: 1, bpm: 90, bars: 1, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (patch) => store.upsert('setting', KEY, patch);
export const MARK = { ok: '#1f9d4a', cedo: '#d98a00', tarde: '#d98a00', faltou: '#c8102e' };
const QUESTIONS = 10;

/** Uma pauta por compasso (4 tempos), cada uma com as suas cores. */
export function score(bar4s, marks = []) {
  const box = h('div', { class: 'tr-score' }); let k = 0;
  for (const bar of bar4s) {
    const n = bar.reduce((s, p) => s + [...p].filter((c) => c === '1').length, 0);
    const f = h('figure', { class: 'tr-bar' }); f.innerHTML = toSVG(layoutRhythm(bar, { width: 360, marks: marks.slice(k, k + n) })); // só números nossos
    k += n; box.append(f);
  }
  return box;
}
export const chunk = (beats) => { const out = []; for (let i = 0; i < beats.length; i += 4) out.push(beats.slice(i, i + 4)); return out; };


/** Agenda contagem (4 cliques) + cliques nos tempos (+ caixa, se `play`). Devolve o instante do 1º tempo (relógio do áudio). */
export function schedule(beats, bpm, { play = false, clickAll = true } = {}) {
  const c = audio(); const q = 60 / bpm; const t0 = c.currentTime + 0.25 + 4 * q;
  for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1);
  if (clickAll) for (let b = 0; b < beats.length; b++) click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.6);
  if (play) for (const e of onsets(beats, bpm)) voz(t0 + e.t, 0.8);
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

function controls(c, draw, { bars = true, barList = [1, 2], speeds = false, input = false } = {}) {
  return h('section', { class: 'card pad tr-ctrl' },
    line('nível', chips([[1, '1'], [2, '2'], [3, '3']], c.lv, (v) => save({ lv: v }).then(() => draw(true)), 'Nível')),
    h('p', { class: 'muted tr-lvname' }, LEVEL_NAMES[c.lv]),
    line('velocidade', chips(VELOCIDADES.map(([k, v]) => [k, k]), velocidadeDe(c.bpm), (k) => save({ bpm: VELOCIDADES.find(([x]) => x === k)[1] }).then(() => draw(false)), 'Velocidade')),
    line('andamento', bpmRow(c, (v) => save({ bpm: clampBpm(Math.min(BPM_MAX, v)) }).then(() => draw(false)))),
    line('som do toque', chips(SONS, getSom(), (k) => { setSom(k); voz(audio().currentTime + 0.02, 0.9, k); draw(false); }, 'Som do toque')),
    bars ? line('compassos', chips(barList.map((v) => [v, String(v)]), Math.min(c.bars, barList[barList.length - 1]), (v) => save({ bars: v }).then(() => draw(true)), 'Compassos por fase')) : null,
    input ? line('como toca', chips([['tela', 'na tela'], ['mic', 'microfone']], c.input === 'mic' ? 'mic' : 'tela', (v) => save({ input: v }).then(() => draw(false)), 'Como você toca')) : null);
}

/** Leitura: passos do caminho (2 por nível). Um passo só abre depois de tirar PASS_SCORE no anterior. */
const bestOf = (c) => c.pbest || {};
/** Estrelas de um exercício do caminho: 70% = 1, 85% = 2, 95% = 3. */
export const estrelasToca = (sc) => (sc >= 95 ? 3 : sc >= 85 ? 2 : sc >= PASS_SCORE ? 1 : 0);
const unlocked = (c, i) => i === 0 || (bestOf(c)[i - 1] || 0) >= PASS_SCORE;
const firstOpen = (c) => { const i = PATH.findIndex((_, k) => (bestOf(c)[k] || 0) < PASS_SCORE); return i < 0 ? PATH.length - 1 : i; };

/* ---------- leitura (Toca Aqui, versão normal) ---------- */
// Dois jeitos de tocar: na tela (cada toque soa) ou no microfone (pad de estudo / bateria de verdade; o app escuta e confere).
// Dois jeitos de começar: "tocar direto" ou "ouvir e depois tocar". 1 compasso por vez, nível livre, BPM à escolha e a precisão no fim.
export function leitura(host) {
  let beats = null; let run = null; let lastResult = null; let micBlocked = false; let passedNow = false;
  const body = h('div');
  const S = session(); // contagem, cliques, fim da rodada: se parou, trocou de compasso ou saiu, S.reset()/dispose() cancela tudo e cala o som
  const stop = () => { S.reset(); if (run) { run.off(); run.pad.classList.remove('live'); run = null; } };
  const draw = (fresh) => {
    stop(); const c = cfg(); const nb = 1; // sempre 1 compasso
    const livre = c.mode === 'livre';
    const step = Math.min(PATH.length - 1, unlocked(c, c.pstep ?? firstOpen(c)) ? (c.pstep ?? firstOpen(c)) : firstOpen(c)); const lvNow = livre ? c.lv : PATH[step].lv;
    const useMic = c.input === 'mic' && !micBlocked;
    const key = livre ? 'livre' : `p${step}`;
    if (!livre && beats && beats.key !== key) { fresh = true; }
    if (fresh || !beats || beats.length !== nb * 4) { beats = livre ? genBar(c.lv) : [...PATH[step].bar]; beats.key = key; lastResult = null; }
    const expected = onsets(beats, c.bpm);
    const marks = lastResult ? lastResult.notes.map((n) => MARK[n.st]) : [];
    const pad = useMic ? h('div', { class: 'tr-pad mic', 'aria-label': 'O microfone escuta o seu pad ou a sua bateria' }, h('span', {}, '🎙 toque no seu pad ou bateria'), h('small', {}, 'o app escuta depois da contagem'))
      : h('button', { class: 'tr-pad', type: 'button', 'aria-label': 'Toque aqui no ritmo' }, h('span', {}, 'toque aqui'), h('small', {}, 'ou aperte qualquer tecla'));
    const status = h('p', { class: 'tr-status', 'aria-live': 'polite' }, lastResult ? '' : '▶ vai direto pra sua vez (toque depois do “4”) · “ouvir e depois tocar” toca o ritmo antes.');
    const conclude = async (taps) => {
      const g = S.gen; run = null;
      lastResult = evaluate(taps, expected, c.bpm, { mic: useMic }); passedNow = !livre && lastResult.score >= PASS_SCORE;
      await store.upsert(KIND, null, { mode: 'leitura', lv: lvNow, bpm: c.bpm, bars: nb, score: lastResult.score, at: Date.now() });
      if (!livre) { const ganho = estrelasToca(lastResult.score) - estrelasToca(bestOf(c)[step] || 0); if (ganho > 0) import('../figurinhas/mesa.js').then((M) => M.vitoria('toca', ganho)).catch(() => {}); } // só ganha estrela quando melhora (não dá pra repetir e farmar)
      if (!livre && lastResult.score > (bestOf(c)[step] || 0)) await save({ pbest: { ...bestOf(c), [step]: lastResult.score }, pstep: step }); // fica neste exercício vendo o resultado; o próximo abre no menu
      if (!S.alive || g !== S.gen) return; // saiu da tela (ou recomeçou) enquanto gravava: não mexe na tela de agora
      draw(false);
      const tgt = body.querySelector('.tr-res') || body;
      if (lastResult.score >= 90) FB.great(tgt); else if (lastResult.score >= 60) FB.win(tgt); else FB.lose(tgt);
    };
    const start = () => {
      stop(); const ac = audio(); const q = 60 / c.bpm;
      if (useMic) {
        const cap = capture({ mode: 'mic', pad: null, bpm: c.bpm, beats: beats.length, clickBeats: false, onCount: (n) => { status.textContent = n < 4 ? `conta: ${n + 1}…` : '🎯 agora!'; } });
        pad.classList.add('live'); status.textContent = 'abrindo o microfone…';
        run = { pad, off: () => cap.cancel() };
        const g = S.gen;
        cap.done.then((r) => { if (!S.alive || g !== S.gen) return; conclude(r.onsets); }, (e) => {
          if (!S.alive || g !== S.gen) return; run = null; micBlocked = true; toast(e && e.name === 'NotAllowedError' ? 'sem permissão pro microfone: vou usar a tela' : 'não consegui abrir o microfone: vou usar a tela'); draw(false);
        });
        return;
      }
      const t0 = schedule(beats, c.bpm);
      const taps = [];
      const onTap = (e) => { if (e.type === 'keydown' && (e.repeat || e.metaKey || e.ctrlKey)) return; if (e.cancelable) e.preventDefault(); voz(audio().currentTime, 0.7); taps.push(perfToCtx(e.timeStamp || performance.now()) - t0); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
      pad.addEventListener('pointerdown', onTap); document.addEventListener('keydown', onTap);
      const off = () => { pad.removeEventListener('pointerdown', onTap); document.removeEventListener('keydown', onTap); };
      // segundos desde o 1º tempo, no relógio do som (para quem testa tocando por script)
      pad.clock = () => perfToCtx(performance.now()) - t0; pad.dataset.onsets = JSON.stringify(expected.map((e) => e.t));
      pad.classList.add('live'); status.textContent = 'conta: 1, 2, 3, 4…';
      const end = (t0 - ac.currentTime + beats.length * q + 0.4) * 1000;
      run = { pad, off, timer: S.later(() => { off(); conclude(taps); }, end) };
      S.later(() => { if (run && run.pad === pad) status.textContent = 'agora!'; }, (t0 - ac.currentTime) * 1000);
    };
    const listen = () => { stop(); schedule(beats, c.bpm, { play: true }); status.textContent = 'ouvindo como é…'; };
    // ouvir primeiro e, quando acabar, já entra a vez da Bea (contagem + clique + o som de cada toque)
    const listenThenPlay = () => { stop(); const q = 60 / c.bpm; schedule(beats, c.bpm, { play: true }); status.textContent = 'ouça primeiro…'; S.later(start, ((4 + beats.length) * q + 0.9) * 1000); };
    let summary = null;
    if (lastResult) {
      const r = lastResult; const devs = r.notes.filter((n) => n.ms != null).map((n) => n.ms);
      const avg = devs.length ? Math.round(devs.reduce((s, x) => s + x, 0) / devs.length) : 0;
      const spread = devs.length ? Math.round(Math.sqrt(devs.reduce((s, x) => s + (x - avg) ** 2, 0) / devs.length)) : 0;
      const tip = r.hits < r.total ? 'faltaram notas: leia o compasso em voz alta (“1 e & a”) antes de tocar.' : Math.abs(avg) > 25 ? (avg < 0 ? `você está adiantando (${avg} ms em média). respira e espera o clique.` : `você está atrasando (+${avg} ms em média). toque mais junto do clique.`) : r.extra ? 'cuidado com toques a mais nas pausas.' : 'leitura limpa! pra desafiar, sobe 5 BPM.';
      summary = h('section', { class: 'card pad tr-res' },
        h('div', { class: 'tr-big' }, h('b', {}, `${r.score}%`), h('span', {}, 'precisão')),
        h('p', {}, `${r.hits}/${r.total} notas · ${r.notes.filter((n) => n.st === 'ok').length} no tempo${r.extra ? ` · ${r.extra} a mais` : ''}`),
        devs.length ? h('p', { class: 'muted' }, `média ${avg > 0 ? '+' : ''}${avg} ms (${avg < -15 ? 'adiantada' : avg > 15 ? 'atrasada' : 'no tempo'}) · oscilação ±${spread} ms`) : null,
        h('p', { class: 'tr-legend' }, h('i', { style: { background: MARK.ok } }), 'no tempo ', h('i', { style: { background: MARK.cedo } }), 'cedo/tarde ', h('i', { style: { background: MARK.faltou } }), 'faltou'),
        h('p', { class: 'muted' }, tip),
        !livre ? h('p', { class: passedNow ? 'tr-status good' : 'muted' }, passedNow ? (`${'★'.repeat(estrelasToca(r.score))}${'☆'.repeat(3 - estrelasToca(r.score))} · ` + (step < PATH.length - 1 ? '✓ passou! o próximo exercício abriu.' : '✓ passou! você terminou o caminho todo.')) : `precisa de ${PASS_SCORE}% pra abrir o próximo. tenta de novo!`) : null);
    }
    const modeLine = line('jeito', chips([['caminho', 'caminho'], ['livre', 'livre (aleatório)']], livre ? 'livre' : 'caminho', (v) => save({ mode: v }).then(() => { lastResult = null; draw(true); }), 'Modo'));
    const ctl = h('section', { class: 'card pad tr-ctrl' }, modeLine,
      line('nível', h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Iniciante, intermediário ou avançado' }, ...TIERS.map((t, ti) => {
        const first = PATH.findIndex((x) => x.tier === t.id); const open = livre || unlocked(c, first); const on = livre ? c.lv === t.lv : PATH[step].tier === t.id;
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), disabled: !open, class: `lib-tab${on ? ' on' : ''}`, 'aria-label': `${t.name}${open ? '' : ' (fechado)'}`,
          onclick: () => (livre ? save({ lv: t.lv }) : save({ pstep: PATH.findIndex((x, k) => x.tier === t.id && (bestOf(c)[k] || 0) < PASS_SCORE && unlocked(c, k)) >= 0 ? PATH.findIndex((x, k) => x.tier === t.id && (bestOf(c)[k] || 0) < PASS_SCORE && unlocked(c, k)) : first })).then(() => { lastResult = null; draw(true); }) }, open ? t.name : `🔒 ${t.name}`); }))),
      livre ? null : h('div', { class: 'tr-path', role: 'group', 'aria-label': 'Exercícios do caminho' }, ...PATH.map((st, i) => (st.tier !== PATH[step].tier ? null : (() => { const open = unlocked(c, i); const sc = bestOf(c)[i]; return h('button', { type: 'button', class: `lib-tab${i === step ? ' on' : ''}`, disabled: !open, 'aria-label': `Exercício ${st.n} de ${st.of}${open ? '' : ' (fechado)'}`, onclick: () => save({ pstep: i }).then(() => { lastResult = null; draw(true); }) }, open ? `${st.n}${sc >= PASS_SCORE ? ` ${'★'.repeat(estrelasToca(sc))}` : ''}` : `🔒 ${st.n}`); })()))),
      h('p', { class: 'muted tr-lvname' }, livre ? `${TIERS[c.lv - 1].name} · ${TIERS[c.lv - 1].about}` : `${PATH[step].tier === 'ini' ? 'iniciante' : PATH[step].tier === 'int' ? 'intermediário' : 'avançado'} · exercício ${PATH[step].n} de ${PATH[step].of}${(bestOf(c)[step] || 0) ? ` · melhor: ${bestOf(c)[step]}%` : ''}`),
      line('velocidade', chips(VELOCIDADES.map(([k, v]) => [k, k]), velocidadeDe(c.bpm), (k) => save({ bpm: VELOCIDADES.find(([x]) => x === k)[1] }).then(() => draw(false)), 'Velocidade')),
    line('andamento', bpmRow(c, (v) => save({ bpm: clampBpm(Math.min(BPM_MAX, v)) }).then(() => draw(false)))),
    line('som do toque', chips(SONS, getSom(), (k) => { setSom(k); voz(audio().currentTime + 0.02, 0.9, k); draw(false); }, 'Som do toque')),
      line('como toca', chips([['tela', 'na tela'], ['mic', 'microfone']], c.input === 'mic' ? 'mic' : 'tela', (v) => save({ input: v }).then(() => draw(false)), 'Como você toca')));
    body.replaceChildren(...[ctl, score(chunk(beats), marks),
      micBlocked && c.input === 'mic' ? h('p', { class: 'tr-status bad' }, 'microfone indisponível agora: usando a tela.') : null,
      h('div', { class: 'row tr-actions' },
        h('button', { class: 'btn primary', type: 'button', onclick: start }, '▶ tocar direto'),
        h('button', { class: 'btn', type: 'button', onclick: listenThenPlay }, 'ouvir e depois tocar'),
        h('button', { class: 'btn', type: 'button', onclick: listen }, 'só ouvir'),
        livre ? h('button', { class: 'btn ghost', type: 'button', onclick: () => draw(true) }, 'outro compasso') : null),
      status, pad, summary, history('leitura')].filter(Boolean));
  };
  host.append(body); draw(true);
  return () => { stop(); S.dispose(); };
}

/* ---------- escuta (ditado rítmico) ---------- */
function escuta(host) {
  let q = null; let n = 0, right = 0;
  const body = h('div');
  const S = session(); // o ditado em execução: trocar de pergunta ou apertar ▶ de novo corta o anterior (antes os dois tocavam juntos)
  const next = () => { S.reset(); const c = cfg(); const ans = genBar(c.lv); const opts = shuffle([ans, ...distractors(ans, c.lv)]); q = { ans, opts, picked: null, okIdx: opts.indexOf(ans) }; };
  const draw = (reset) => {
    const c = cfg();
    if (reset) { n = 0; right = 0; next(); }
    if (!q) next();
    const play = () => { S.reset(); schedule(q.ans, c.bpm, { play: true }); };
    const pick = async (i) => {
      if (q.picked != null) return;
      q.picked = i; n++; const hit = i === q.okIdx; if (hit) right++;
      if (n >= QUESTIONS) {
        const sc = Math.round((right / QUESTIONS) * 100);
        await store.upsert(KIND, null, { mode: 'escuta', lv: c.lv, bpm: c.bpm, score: sc, at: Date.now() });
        toast(`rodada fechada: ${right}/${QUESTIONS} ✓`);
      }
      draw(false);
      const btn = body.querySelectorAll('.tr-opt')[i]; FB.result(hit, btn || body);
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
  return () => S.dispose();
}

/* ---------- montar (ditado de células) ---------- */
const LIVES = 5;
function cellSvg(p) { const f = h('span', { class: 'tr-cell', 'aria-hidden': 'true' }); f.innerHTML = toSVG(layoutRhythm([p], { width: 92, count: false, clef: false })); return f; }
function montar(host) {
  let ans = null, guess = [], lives = LIVES, pts = 0, marks = null, over = false;
  const body = h('div');
  const S = session(); // o ditado e a espera da próxima pergunta
  const hi = () => (store.get(KEY) && store.get(KEY).data.hiMontar) || 0;
  const fresh = () => { ans = genBar(cfg().lv); guess = [null, null, null, null]; marks = null; };
  const play = () => { S.reset(); schedule(ans, cfg().bpm, { play: true }); };
  const conferir = async () => {
    if (marks) return; // já conferido e nada mudou desde então: tocar de novo em "conferir" não soma ponto nem tira outra vida (editar uma casinha limpa as marcas)
    if (guess.some((g) => g == null)) { toast('complete os 4 tempos'); return; }
    marks = checkCells(ans, guess);
    if (marks.every(Boolean)) { pts++; S.later(() => { fresh(); draw(); play(); }, 1500); }
    else { lives--; if (lives <= 0) { over = true; if (pts > hi()) await save({ hiMontar: pts }); await store.upsert(KIND, null, { mode: 'montar', lv: cfg().lv, bpm: cfg().bpm, score: pts, at: Date.now() }); } }
    draw(); (marks.every(Boolean) ? FB.win : FB.lose)(body.querySelector('.tr-slots'));
  };
  const draw = (reset) => {
    const c = cfg();
    if (reset) { S.reset(); lives = LIVES; pts = 0; over = false; fresh(); }
    const firstEmpty = guess.indexOf(null);
    const slots = guess.map((g, i) => h('button', { type: 'button', class: `tr-slot${g ? ' full' : ''}${marks ? (marks[i] ? ' ok' : ' no') : ''}`, 'aria-label': g ? `Tempo ${i + 1}: tirar` : `Tempo ${i + 1}: vazio`,
      onclick: () => { if (over || !g) return; guess[i] = null; marks = null; draw(); } }, g ? cellSvg(g) : h('b', {}, '?')));
    const pal = cellsFor(c.lv).map((cell) => h('button', { type: 'button', class: 'tr-pal', 'aria-label': cell.name, title: cell.name,
      onclick: () => { if (over) return; const i = guess.indexOf(null); if (i < 0) return; guess[i] = cell.p; marks = null; draw(); } }, cellSvg(cell.p)));
    const hearts = h('span', { class: 'tr-lives', 'aria-label': `${lives} vidas` }, '♥'.repeat(lives), h('span', { class: 'off' }, '♥'.repeat(LIVES - lives)));
    body.replaceChildren(...[controls(c, () => draw(true), { bars: false }),
      h('div', { class: 'row between pad-x tr-hud' }, hearts, h('span', { class: 'tr-count' }, `pontos ${pts} · recorde ${Math.max(hi(), pts)}`)),
      h('div', { class: 'tr-slots' }, ...slots),
      over ? h('div', { class: 'empty' }, h('p', { class: 'hand' }, `fim de jogo: ${pts} ponto${pts === 1 ? '' : 's'}`), h('p', { class: 'muted' }, 'era assim:'), score([ans]), h('button', { class: 'btn primary', type: 'button', onclick: () => draw(true) }, 'jogar de novo'))
        : h('div', { class: 'row tr-actions' },
          h('button', { class: 'bl-play tr-go', type: 'button', 'aria-label': 'Ouvir o ditado', onclick: play }, icon('play', 26)),
          h('button', { class: 'btn', type: 'button', 'aria-label': 'Desfazer', onclick: () => { const k = firstEmpty < 0 ? 3 : firstEmpty - 1; if (k >= 0) { guess[k] = null; marks = null; draw(); } } }, '↺'),
          h('button', { class: 'btn primary', type: 'button', onclick: conferir }, 'conferir')),
      over ? null : h('p', { class: `tr-status${marks ? (marks.every(Boolean) ? ' good' : ' bad') : ''}`, 'aria-live': 'polite' }, marks ? (marks.every(Boolean) ? 'isso! ✓ lá vem o próximo' : 'os vermelhos estão errados: ouve de novo e troca') : 'aperte ▶, ouça (pode repetir) e monte os 4 tempos tocando nas células.'),
      over ? null : h('div', { class: 'tr-palette' }, ...pal), history('montar')].filter(Boolean));
  };
  host.append(body); draw(true);
  return () => S.dispose();
}

/* ---------- figuras rítmicas: o ditado de montar (normal), a versão com imagens (monte seu ritmo) e o "aprender" ---------- */
function figuras(host, sub) {
  const subs = [['', 'normal'], ['imagens', 'com imagens'], ['aprender', 'aprender']];
  host.append(h('div', { class: 'chips lib-tabs bt-tabs bt-sub', role: 'tablist', 'aria-label': 'Versão' },
    ...subs.map(([k, t]) => h('a', { class: `lib-tab${sub === k ? ' on' : ''}`, role: 'tab', 'aria-selected': String(sub === k), href: k ? `#/treinos/montar/${k}` : '#/treinos/montar' }, t))));
  if (sub === 'imagens') {
    const box = h('div', { class: 'kx-arc kx-embed kd-game' }); host.append(h('p', { class: 'pad-x lib-note' }, 'a versão simples: cada tempo é uma palavrinha com imagem (pão, bolo, chocolate…). a palavra mostra quantas notas tem o tempo.'), box);
    return mountRitmo(box);
  }
  if (sub === 'aprender') return aprender(host);
  return montar(host);
}

export function mount(host, parts = []) {
  if (parts[0] === 'leitura') { location.replace('#/partitura/leitura'); return null; } // a leitura rítmica mora na aba Partitura
  const tab = ['escuta', 'montar', 'figuras'].includes(parts[0]) ? (parts[0] === 'figuras' ? 'montar' : parts[0]) : 'escuta';
  const sub = tab === 'montar' && ['imagens', 'aprender'].includes(parts[1]) ? parts[1] : '';
  host.append(banner(tab === 'montar' ? 'Figuras rítmicas' : 'Treinos', { escuta: 'ouvir e reconhecer', montar: 'ouvir, montar e aprender cada figura' }[tab]),
    h('div', { class: 'chips lib-tabs bt-tabs' },
      h('a', { class: `lib-tab${tab === 'escuta' ? ' on' : ''}`, href: '#/treinos' }, 'escuta (ditado)'),
      h('a', { class: `lib-tab${tab === 'montar' ? ' on' : ''}`, href: '#/treinos/montar' }, 'figuras rítmicas')));
  const off = tab === 'escuta' ? escuta(host) : figuras(host, sub);
  tipBox(host, 'treinos');
  return off;
}
