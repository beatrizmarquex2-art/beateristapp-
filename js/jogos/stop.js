// Stop musical: tela. Quatro categorias, solo ou dois no mesmo aparelho (por turnos). Regras em stop-logic.js.
// Respostas digitadas só entram na tela como texto (textContent / value), nunca como HTML.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as S from './stop-logic.js';
import { getGame, setGame, sfx } from './base.js';

const ID = 'stop';
const DEC_LABEL = { valida: 'válida', invalida: 'inválida', repetida: 'repetida' };
const secLabel = (s) => (s ? `${s} s` : 'sem limite');
const clock = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const pname = (g, p) => (g.mode === 'dupla' ? `jogador ${p + 1}` : 'você');

export function mount(host) {
  let gone = false; let tick = 0;
  const saved = getGame(ID);
  const prefs = { mode: saved.mode === 'dupla' ? 'dupla' : 'solo', seconds: S.SECONDS.includes(saved.seconds) ? saved.seconds : 90, rounds: S.ROUNDS.includes(saved.rounds) ? saved.rounds : 3 };
  let g = null; let view = 'intro'; let remMs = 0; let frozen = false; let paused = false; let lastTs = 0; let timeEl = null; let editing = null;
  const root = h('div', { class: 'jg jg-stop' }); host.replaceChildren(root);
  const persist = () => setGame(ID, { ...prefs, match: g && g.stage !== 'done' ? g : null });
  const stopTick = () => { clearInterval(tick); tick = 0; };

  function intro() {
    stopTick(); view = 'intro'; g = null;
    const resume = S.validMatch(saved.match) && saved.match.stage !== 'done' ? saved.match : null;
    const seg = (key, list, fmt) => h('div', { class: 'jg-seg', role: 'radiogroup' }, ...list.map((v) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs[key] === v), class: prefs[key] === v ? 'on' : '', onclick: () => { prefs[key] = v; setGame(ID, { [key]: v }); intro(); } }, fmt(v))));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'stop'), h('p', { class: 'jg-p' }, 'quatro categorias: nome (de pessoa ou artista), banda, música e instrumento/peça (caixa, bumbo, chimbal…).'),
      h('p', { class: 'jg-lab' }, 'quem joga?'), h('div', { class: 'jg-seg', role: 'radiogroup' }, ...[['solo', 'solo · treino'], ['dupla', 'dois no aparelho']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.mode === v), class: prefs.mode === v ? 'on' : '', onclick: () => { prefs.mode = v; setGame(ID, { mode: v }); intro(); } }, l))),
      prefs.mode === 'dupla' ? h('p', { class: 'jg-p muted' }, 'é uma adaptação por turnos: cada um joga com a mesma letra e o mesmo tempo, um depois do outro. o tempo do primeiro não diminui o do segundo.') : null,
      h('p', { class: 'jg-lab' }, 'tempo por jogador'), seg('seconds', S.SECONDS, secLabel),
      h('p', { class: 'jg-lab' }, 'rodadas'), seg('rounds', S.ROUNDS, String),
      h('div', { class: 'jg-rule-box' }, h('b', {}, 'regra da inicial'), h('p', {}, 'o jogo só confere se o campo está preenchido e se o primeiro caractere alfabético começa com a letra (sem acento e sem diferença de maiúscula). “the beatles” vale T e “beatles” vale B. se existe a banda ou a música de verdade, quem decide é a revisão manual.')),
      h('details', { class: 'jg-rules' }, h('summary', {}, 'pontuação'), h('ul', {}, h('li', {}, 'solo: 10 por resposta válida (máximo 40 por rodada).'), h('li', {}, 'dupla: 10 por resposta válida que só um tem ou que é diferente; 5 para cada uma se as respostas forem equivalentes.'), h('li', {}, 'no fim de cada rodada, você ou o professor marca cada resposta como válida, inválida ou repetida.'))),
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => resumeMatch(resume) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => start(S.newMatch(prefs)) }, resume ? 'nova partida' : 'iniciar')),
    ].filter(Boolean));
  }
  function start(match) { g = match; persist(); ready(); }
  function resumeMatch(match) { g = match; if (g.stage === 'review') { persist(); return reviewView(); } ready(); }

  /* ---------- passagem: o jogo só começa depois de “pronto” ---------- */
  function ready() {
    stopTick(); view = 'cover'; remMs = (g.remaining || g.seconds) * 1000; if (!g.seconds) remMs = 0;
    const t = g.mode === 'dupla' ? `passe o aparelho para o ${pname(g, g.turn)}` : `rodada ${g.round + 1} de ${g.rounds}`;
    root.replaceChildren(h('div', { class: 'jg-cover2', role: 'dialog', 'aria-label': 'passagem' },
      h('p', { class: 'hand' }, t), g.mode === 'dupla' ? h('p', { class: 'muted' }, `rodada ${g.round + 1} de ${g.rounds}. as respostas anteriores estão escondidas.`) : null,
      h('p', {}, `tempo: ${secLabel(g.seconds)} · letra aparece quando você clicar em pronto`),
      h('button', { class: 'btn primary', type: 'button', onclick: play }, 'pronto')));
    root.querySelector('button').focus();
  }

  /* ---------- resposta ---------- */
  function play() {
    view = 'play'; frozen = false; paused = false; lastTs = performance.now();
    const L = S.letterOf(g);
    const inputs = S.CATEGORIES.map((cat, c) => h('label', { class: 'jg-field' }, h('span', {}, cat), h('input', { type: 'text', value: g.cur.answers[g.turn][c], autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', maxlength: 80, 'data-c': c,
      oninput: (e) => { if (!frozen) { g = S.setAnswer(g, g.turn, c, e.target.value); persist(); } } })));
    timeEl = h('b', { class: 'jg-time' }, g.seconds ? clock(remMs) : '∞');
    root.replaceChildren(
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, pname(g, g.turn)), h('span', {}, `rodada ${g.round + 1}/${g.rounds}`)), h('div', { class: 'jg-who' }, h('b', {}, 'tempo'), h('span', {}, timeEl))),
      h('div', { class: 'jg-letter', role: 'status', 'aria-label': `letra ${L}` }, L),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary jg-stopbtn', type: 'button', onclick: () => end() }, 'stop!')),
      h('p', { class: 'jg-msg', 'aria-live': 'assertive' }),
      h('div', { class: 'jg-fields' }, ...inputs));
    stopTick(); tick = setInterval(step, 250); const f = root.querySelector('input'); if (f) f.focus({ preventScroll: true });
  }
  function step() {
    if (view !== 'play' || frozen) return;
    const now = performance.now(); const dt = now - lastTs; lastTs = now;
    if (document.hidden) { if (!paused) pauseNow(); return; }
    if (paused || !g.seconds) return;
    remMs = Math.max(0, remMs - dt); g.remaining = remMs / 1000; timeEl.textContent = clock(remMs);
    if (remMs <= 0) timeUp();
  }
  function pauseNow() { paused = true; persist(); }
  function showPaused() {
    if (view !== 'play' || !paused || root.querySelector('.jg-over')) return;
    root.append(h('div', { class: 'jg-over', role: 'dialog', 'aria-label': 'pausado' }, h('p', { class: 'hand' }, 'pausado'), h('p', {}, 'o tempo parou enquanto você estava fora.'), h('button', { class: 'btn primary', type: 'button', onclick: (e) => { e.target.closest('.jg-over').remove(); paused = false; lastTs = performance.now(); } }, 'continuar')));
    root.querySelector('.jg-over button').focus();
  }
  function timeUp() {
    frozen = true; stopTick(); sfx('lose'); root.querySelectorAll('input').forEach((i) => { i.readOnly = true; });
    const m = root.querySelector('.jg-msg'); if (m) m.textContent = 'tempo! suas respostas foram guardadas.';
    root.querySelector('.jg-stopbtn').textContent = 'continuar';
  }
  function end() {
    if (view !== 'play') return; stopTick(); sfx('tap');
    root.querySelectorAll('input').forEach((i) => { const c = Number(i.dataset.c); if (i.value !== g.cur.answers[g.turn][c]) g = S.setAnswer(g, g.turn, c, i.value); }); // garante o texto final
    const wasFirst = g.mode === 'dupla' && g.turn === 0; g = S.finishTurn(g, remMs / 1000); persist();
    if (g.stage === 'review') return reviewView(); if (wasFirst) ready();
  }

  /* ---------- revisão manual ---------- */
  function reviewView() {
    stopTick(); view = 'review'; const L = S.letterOf(g); const warn = new Set(S.warnings(g).map(([p, c]) => `${p}-${c}`)); const pts = S.scoreRound(g);
    const rows = S.CATEGORIES.map((cat, c) => h('div', { class: 'jg-rv' }, h('b', {}, cat),
      ...g.cur.answers.map((_, p) => {
        const txt = S.effective(g, p, c); const k = g.cur.corrections[p][c]; const d = g.cur.decisions[p][c]; const empty = S.autoCheck(txt, L) === 'vazia';
        const edit = editing && editing.p === p && editing.c === c;
        return h('div', { class: 'jg-ans' }, h('span', { class: 'jg-who2' }, pname(g, p)), h('span', { class: 'jg-txt' }, empty ? '(vazio)' : txt),
          k ? h('small', { class: 'muted' }, `original: ${k.original || '(vazio)'} · motivo: ${k.why}`) : null,
          warn.has(`${p}-${c}`) ? h('small', { class: 'jg-warn', role: 'alert' }, `atenção: não começa com ${L}`) : null,
          h('div', { class: 'jg-seg sm', role: 'radiogroup', 'aria-label': `${cat}, ${pname(g, p)}` }, ...S.DECISIONS.map((x) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(d === x), class: d === x ? 'on' : '', disabled: empty && x === 'valida', onclick: () => { g = S.setDecision(g, p, c, x); persist(); reviewView(); } }, DEC_LABEL[x]))),
          edit ? h('div', { class: 'jg-edit' }, h('input', { type: 'text', 'aria-label': 'texto corrigido', value: editing.text, maxlength: 80, oninput: (e) => { editing.text = e.target.value; } }), h('input', { type: 'text', 'aria-label': 'justificativa da correção', placeholder: 'justificativa', value: editing.why, maxlength: 160, oninput: (e) => { editing.why = e.target.value; } }),
            h('button', { class: 'btn small primary', type: 'button', onclick: () => { try { g = S.correct(g, p, c, editing.text, editing.why); editing = null; persist(); reviewView(); } catch { const m = root.querySelector('.jg-msg'); if (m) m.textContent = 'escreva a justificativa da correção'; } } }, 'salvar correção'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { editing = null; reviewView(); } }, 'cancelar'))
            : h('button', { class: 'btn small ghost', type: 'button', onclick: () => { editing = { p, c, text: txt, why: '' }; reviewView(); } }, 'corrigir'),
          h('small', {}, `${pts[p][c]} pontos`));
      }),
      g.mode === 'dupla' ? h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', checked: g.cur.equiv[c] ? true : null, onchange: (e) => { g = S.setEquiv(g, c, e.target.checked); persist(); reviewView(); } }), ' respostas equivalentes (ex.: beatles / the beatles)') : null));
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, `revisão · letra ${L}`), h('p', { class: 'jg-p' }, 'marque cada resposta. só conta depois de confirmar.'), h('p', { class: 'jg-msg', 'aria-live': 'polite' }), ...rows,
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: confirmReview }, 'confirmar revisão')));
  }
  function confirmReview() {
    editing = null; g = S.confirmRound(g); persist(); sfx('win');
    const hst = g.history.at(-1); summary(hst);
  }
  function summary(hst) {
    view = 'summary'; const last = g.stage === 'done';
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, `rodada com a letra ${hst.letter}`),
      table(hst), h('p', { class: 'jg-p' }, `acumulado: ${hst.totals.map((t, p) => `${pname(g, p)} ${t}`).join(' · ')}`),
      h('div', { class: 'jg-actions' }, last ? h('button', { class: 'btn primary', type: 'button', onclick: final }, 'ver resultado final') : h('button', { class: 'btn primary', type: 'button', onclick: ready }, 'próxima rodada')));
  }
  function table(hst) {
    return h('table', { class: 'jg-tbl' }, h('thead', {}, h('tr', {}, h('th', {}, 'categoria'), ...hst.points.map((_, p) => h('th', {}, pname(g, p))))),
      h('tbody', {}, ...S.CATEGORIES.map((cat, c) => h('tr', {}, h('td', {}, cat), ...hst.points.map((row, p) => h('td', {}, `${row[c]} · `, h('small', {}, hst.corrections[p][c] ? hst.corrections[p][c].text : hst.answers[p][c] || '—'))))),
        h('tr', { class: 'tot' }, h('td', {}, 'rodada'), ...hst.sums.map((s) => h('td', {}, String(s))))));
  }
  function final() {
    view = 'final'; const w = S.winner(g); persist(); setGame(ID, { ...prefs, match: null, last: { totals: g.totals, rounds: g.rounds, mode: g.mode, at: Date.now() } });
    sfx(w === 'empate' ? 'tie' : 'win');
    root.replaceChildren(h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, g.mode === 'solo' ? `total: ${g.totals[0]} pontos` : w === 'empate' ? 'empate!' : `${pname(g, w)} venceu!`),
      h('p', {}, g.totals.map((t, p) => `${pname(g, p)}: ${t}`).join(' · '))),
      h('h3', { class: 'hand' }, 'histórico'), ...g.history.map((x) => h('details', { class: 'jg-rules' }, h('summary', {}, `letra ${x.letter} · ${x.sums.join(' x ')}`), table(x))),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => start(S.newMatch(prefs)) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  const onVis = () => { if (document.hidden) { if (view === 'play' && !frozen) pauseNow(); } else showPaused(); };
  document.addEventListener('visibilitychange', onVis);
  intro();
  return {
    inProgress: () => !!(g && view !== 'intro' && view !== 'final'),
    restart: async () => { if (g && view !== 'intro' && view !== 'final' && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; stopTick(); intro(); },
    destroy() { gone = true; void gone; stopTick(); if (g && g.stage !== 'done') persist(); document.removeEventListener('visibilitychange', onVis); },
  };
}
