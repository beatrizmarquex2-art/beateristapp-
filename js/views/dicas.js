// Jogos das 30 dicas: quiz, caça-palavras e cruzadinha. Quando a palavra é achada, aparece a explicação (a dica inteira).
// Os textos vêm dos registros privados "tip" (os mesmos do Plano de Estudo); sem eles os jogos avisam em vez de inventar texto.
import { h } from '../util.js';
import * as store from '../store.js';
import { banner } from '../ui.js';
import * as T from '../tips.js';
import * as FB from '../feedback.js';

const KEY = 'setting-dicas';
const conf = () => ({ kw: {}, best: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (p) => store.upsert('setting', KEY, p);
import { tipList } from '../tipbox.js';
const items = () => T.keywords(tipList(), conf().kw);
const TABS = [['quiz', 'quiz'], ['caca', 'caça-palavras'], ['cruzadinha', 'cruzadinha']];
const total = () => Math.max(30, tipList().length);

/** A dica inteira, pra quando a palavra é achada. */
const explain = (it) => h('div', { class: 'card pad dc-explain', role: 'status' }, h('p', { class: 'dc-n' }, `dica ${it.n} de ${total()} · a palavra é ${it.shown}`), h('p', { class: 'dc-text' }, it.text));

/* ---------- quiz ---------- */
function quiz(box, kinds, key) {
  const its = items(); const ROUNDS = Math.min(10, its.length);
  let i = 0; let score = 0; let q = null; let answered = false; let picked = [];
  const next = () => { const k = kinds[Math.floor(Math.random() * kinds.length)]; q = T.question(its, k); answered = false; picked = []; draw(); };
  const finish = () => {
    const b = conf().best; const best = Math.max(b[key] || 0, score); if (score > (b[key] || 0)) save({ best: { ...b, [key]: score } });
    box.replaceChildren(h('section', { class: 'card pad ft-center' }, h('h2', {}, `${score} de ${ROUNDS}`), h('p', { class: 'muted' }, `seu melhor: ${best}`),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { i = 0; score = 0; next(); } }, 'jogar de novo')));
    (score >= ROUNDS * 0.7 ? FB.great : FB.win)(box.firstChild);
  };
  const done = (ok, el) => { answered = true; if (ok) score++; draw(); FB.result(ok, el && el.isConnected ? el : box.querySelector('.dc-q'), { live: null }); };
  function draw() {
    const head = h('p', { class: 'tr-count' }, `pergunta ${i + 1} de ${ROUNDS} · ${score} certas`);
    const body = [h(q.kind === 'blank' ? 'p' : 'h3', { class: q.kind === 'blank' ? 'dc-clue' : 'dc-ask' }, q.prompt), q.kind === 'blank' ? h('p', { class: 'muted' }, 'qual palavra completa a dica?') : null,
        h('div', { class: `dc-opts${q.kind === 'match' ? ' long' : ''}` }, ...q.options.map((o) => h('button', { type: 'button', class: `tr-pal dc-opt${answered ? (o.id === q.ans ? ' ok' : '') : ''}`, disabled: answered, onclick: (e) => { const btn = e.currentTarget; done(o.id === q.ans, btn); if (o.id !== q.ans) btn.classList.add('no'); } }, o.label)))];
    box.replaceChildren(...[h('section', { class: 'card pad dc-q' }, head, ...body.filter(Boolean)),
      answered ? explain(q.item) : null,
      answered ? h('button', { class: 'btn primary', type: 'button', onclick: () => { i++; if (i >= ROUNDS) finish(); else next(); } }, i + 1 >= ROUNDS ? 'ver o resultado' : 'próxima') : null].filter(Boolean));
  }
  next();
}

/* ---------- caça-palavras (fácil: grade 9×9, 6 palavras curtas, só → e ↓, palavras à vista e cada uma de uma cor) ---------- */
const COLORS = 6; // classes dc-k0..dc-k5 (css/jogos.css)
function caca(box) {
  const its = items(); const pick = T.easyPick(its, 6); const byWord = Object.fromEntries(pick.map((x) => [x.w, x]));
  const ws = T.wordsearch(pick.map((x) => x.w), 9, Math.random, T.EASY_DIRS); const words = ws.placed.map((p) => p.w);
  const colorOf = Object.fromEntries(words.map((w, i) => [w, i % COLORS]));
  let start = null; const found = new Map(); let last = null; // found: palavra -> casas
  const key = (x, y) => `${x},${y}`;
  const cellColor = new Map(); // casa -> cor da palavra achada
  let drag = null; let grid = null;
  const cellAt = (el) => { const c = el && el.closest && el.closest('.dc-c'); return c && c.dataset.x != null ? { x: +c.dataset.x, y: +c.dataset.y, el: c } : null; };
  const preview = (line) => { grid.querySelectorAll('.dc-c.sel').forEach((e) => e.classList.remove('sel')); if (line) line.forEach((c) => grid.children[c.y * ws.size + c.x].classList.add('sel')); };
  const attempt = (line, el) => {
    const str = line.map((c) => ws.grid[c.y][c.x]).join(''); const rev = [...str].reverse().join('');
    const w = words.find((k) => !found.has(k) && (k === str || k === rev));
    if (w) { found.set(w, line); line.forEach((c) => cellColor.set(key(c.x, c.y), colorOf[w])); last = byWord[w]; draw(); const els = box.querySelectorAll('.dc-c.found'); const done = found.size === words.length; (done ? FB.great : FB.win)(els[els.length - 1] || box, { msg: done ? 'achou todas! 🏆' : `achou: ${byWord[w].shown}!` }); }
    else { draw(); FB.lose(box.querySelector('.dc-grid') || el, { paul: false }); }
  };
  const up = () => {
    const d = drag; drag = null; if (!d) return; preview(null);
    if (d.end && (d.end.x !== d.x0 || d.end.y !== d.y0)) { // arrastou: a linha vai da casa do dedo até onde soltou
      start = null; const line = T.lineCells(d.x0, d.y0, d.end.x, d.end.y); if (line) attempt(line, d.end.el); else { draw(); FB.lose(box.querySelector('.dc-grid'), { paul: false }); } return;
    }
    // só tocou: toca na primeira letra e depois na última
    if (!start) { start = { x: d.x0, y: d.y0 }; draw(); return; }
    const s0 = start; start = null;
    if (s0.x === d.x0 && s0.y === d.y0) { draw(); return; }
    const line = T.lineCells(s0.x, s0.y, d.x0, d.y0);
    if (!line) { start = { x: d.x0, y: d.y0 }; draw(); FB.lose(box.querySelector('.dc-grid'), { paul: false }); return; }
    attempt(line, d.el);
  };
  const draw = () => {
    grid = h('div', { class: 'dc-grid dc-easy', style: `--n:${ws.size}` }, ...ws.grid.flatMap((row, y) => row.map((l, x) => {
      const ck = cellColor.get(key(x, y));
      return h('button', { type: 'button', 'data-x': String(x), 'data-y': String(y), class: `dc-c${ck != null ? ` found dc-k${ck}` : ''}${start && start.x === x && start.y === y ? ' start' : ''}`, 'aria-label': `${l}, linha ${y + 1}, coluna ${x + 1}` }, l);
    })));
    grid.addEventListener('pointerdown', (e) => { const c = cellAt(e.target); if (!c) return; drag = { x0: c.x, y0: c.y, el: c.el, end: null }; });
    grid.addEventListener('pointermove', (e) => {
      if (!drag) return; const c = cellAt(document.elementFromPoint(e.clientX, e.clientY)); if (!c) return;
      drag.end = c; preview(T.lineCells(drag.x0, drag.y0, c.x, c.y));
    });
    grid.addEventListener('pointerup', up); grid.addEventListener('pointercancel', () => { drag = null; preview(null); });
    const chips = h('div', { class: 'dc-chips' }, ...words.map((w) => found.has(w)
      ? h('button', { type: 'button', class: `dc-chip ok dc-k${colorOf[w]}`, onclick: () => { last = byWord[w]; draw(); } }, `✓ ${byWord[w].shown}`)
      : h('span', { class: `dc-chip dc-k${colorOf[w]}` }, byWord[w].shown)));
    const dica = !found.size ? h('p', { class: 'muted' }, 'ache as palavras na grade: arraste o dedo por cima ou toque na primeira e na última letra. quando achar, aparece a dica!') : null;
    box.replaceChildren(...[h('section', { class: 'card pad dc-cacabox' }, ...[h('p', { class: 'tr-count' }, `${found.size} de ${words.length} palavras`), dica, chips, grid].filter(Boolean)), last ? explain(last) : null,
      found.size === words.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => { box.replaceChildren(); caca(box); } }, 'outra grade') : null].filter(Boolean));
  };
  draw();
}

/* ---------- cruzadinha (fácil: 5 palavras curtas, banco de palavras à vista, 1ª letra de cada uma já na grade, cores) ---------- */
function cruzadinha(box) {
  const its = items(); const pick = T.easyPick(its, 5, { min: 4, max: 8 });
  const cw = T.crossword(pick.map((x) => x.w), Math.random, 12); const solved = new Set(); let last = null;
  const cellsOf = (e) => Array.from({ length: e.w.length }, (_, k) => ({ x: e.x + (e.dir === 'h' ? k : 0), y: e.y + (e.dir === 'v' ? k : 0), ch: e.w[k] }));
  const shown = new Map(); // casa -> { ch, k } letra revelada e a cor da palavra
  const hintOf = new Map(); // casa -> 1ª letra de cada palavra (já aparece clarinha)
  cw.entries.forEach((e) => { const c = cellsOf(e)[0]; hintOf.set(`${c.x},${c.y}`, { ch: c.ch, k: e.idx % COLORS }); });
  const draw = (focus) => {
    const nums = new Map(); for (const e of cw.entries) nums.set(`${e.x},${e.y}`, e.n);
    const live = new Map(); for (const e of cw.entries) for (const c of cellsOf(e)) live.set(`${c.x},${c.y}`, c.ch);
    const grid = h('div', { class: 'dc-cw', style: `--cols:${cw.w}` }, ...Array.from({ length: cw.h }, (_, y) => Array.from({ length: cw.w }, (_, x) => {
      const k = `${x},${y}`; if (!live.has(k)) return h('i', { class: 'dc-blank', 'aria-hidden': 'true' });
      const s = shown.get(k); const hint = hintOf.get(k);
      return h('span', { class: `dc-cell${s ? ` on dc-k${s.k}` : hint ? ' hint' : ''}` }, nums.has(k) ? h('small', {}, String(nums.get(k))) : null, s ? s.ch : hint ? hint.ch : '');
    })).flat());
    const bank = h('div', { class: 'dc-chips' }, ...T.shuffle(cw.entries.map((e) => e.idx), () => 0.5).map((idx) => h('span', { class: `dc-chip dc-k${idx % COLORS}${solved.has(idx) ? ' done' : ''}` }, solved.has(idx) ? `✓ ${pick[idx].shown}` : pick[idx].shown)));
    const clues = h('ol', { class: 'dc-clues' }, ...cw.entries.map((e) => { const it = pick[e.idx]; const ok = solved.has(e.idx);
      const inp = h('input', { type: 'text', maxlength: e.w.length, autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false', disabled: ok, placeholder: e.w[0] + '·'.repeat(e.w.length - 1), 'aria-label': `Resposta da ${e.n} ${e.dir === 'h' ? 'horizontal' : 'vertical'}`, value: ok ? it.w : '' });
      inp.addEventListener('input', () => {
        const v = T.norm(inp.value).replace(/[^A-Z]/g, ''); if (v.length < e.w.length) return;
        if (v === e.w) { solved.add(e.idx); cellsOf(e).forEach((c) => shown.set(`${c.x},${c.y}`, { ch: c.ch, k: e.idx % COLORS })); last = it; draw(); const all = solved.size === cw.entries.length; (all ? FB.great : FB.win)(box.querySelector('.dc-explain') || box, { msg: all ? 'cruzadinha completa! 🏆' : `isso: ${it.shown}!` }); }
        else { FB.lose(inp, { paul: false }); inp.select(); }
      });
      return h('li', { class: `${ok ? 'ok ' : ''}dc-k${e.idx % COLORS}`, value: e.n }, h('span', { class: 'dc-dir' }, `${e.dir === 'h' ? '→' : '↓'} ${e.w.length} letras · começa com ${e.w[0]}`), h('p', {}, T.clueOf(it)), inp); }));
    box.replaceChildren(...[h('section', { class: 'card pad' }, h('p', { class: 'tr-count' }, `${solved.size} de ${cw.entries.length} palavras`), h('p', { class: 'muted' }, 'as respostas estão aqui embaixo, é só encaixar cada uma na pista certa:'), bank, grid), last ? explain(last) : null, h('section', { class: 'card pad' }, h('h3', { class: 'tag' }, 'pistas'), clues),
      solved.size === cw.entries.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => { box.replaceChildren(); cruzadinha(box); } }, 'outra cruzadinha') : null].filter(Boolean));
    if (focus != null) { const el = box.querySelectorAll('.dc-clues input')[focus]; el && el.focus(); }
  };
  draw();
}

const ICON = { quiz: 'quiz.svg', caca: 'caca.svg', cruzadinha: 'cruza.svg' };
const SUB = { quiz: 'completa e liga', caca: 'ache na grade', cruzadinha: 'preencha as pistas' };

export function mount(host, parts = []) {
  const tab = TABS.some(([k]) => k === parts[0]) ? parts[0] : 'quiz';
  const box = h('div', { class: 'dc-box' });
  // modo claro/escuro: lembra a escolha; sem escolha, segue o aparelho
  const KM = 'beaterista-dicas-modo';
  let modo = ''; try { modo = localStorage.getItem(KM) || ''; } catch { /* sem armazenamento: segue o aparelho */ }
  if (modo !== 'claro' && modo !== 'escuro') modo = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  const wrap = h('div', { class: `jg jg-wrap dc-wrap${modo === 'escuro' ? ' escuro' : ''}` });
  const tg = h('button', { type: 'button', class: 'dc-modo', 'aria-label': 'trocar entre modo claro e escuro' });
  const paint = () => { wrap.classList.toggle('escuro', modo === 'escuro'); tg.textContent = modo === 'escuro' ? '☀️ claro' : '🌙 escuro'; tg.setAttribute('aria-pressed', String(modo === 'escuro')); };
  tg.addEventListener('click', () => { modo = modo === 'escuro' ? 'claro' : 'escuro'; try { localStorage.setItem(KM, modo); } catch { /* ok */ } paint(); });
  paint();
  host.append(banner('Quiz e Letras', 'quiz, caça-palavras e cruzadinha com as dicas do método'),
    wrap);
  wrap.append(
      h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), h('span', { style: 'flex:1' }), tg),
      h('div', { class: 'dc-picks', role: 'tablist', 'aria-label': 'Jogo' }, ...TABS.map(([k, t]) => h('a', { class: `dc-pick${tab === k ? ' on' : ''}`, role: 'tab', 'aria-selected': String(tab === k), href: `#/dicas/${k}` },
        h('img', { src: `assets/jogos/icones/${ICON[k]}`, alt: '', draggable: 'false' }), h('b', {}, t), h('small', {}, SUB[k])))),
      box);
  const run = () => {
    box.replaceChildren(); const n = items().length;
    if (n < 6) { box.append(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'elas vêm do seu Plano de Estudo quando sincronizar. abre o app com internet uma vez e volta aqui.'), h('a', { class: 'btn', href: '#/plano' }, 'abrir o Plano de Estudo'))); return; }
    ({ quiz: () => quiz(box, ['blank', 'match'], 'quiz'), caca: () => caca(box), cruzadinha: () => cruzadinha(box) })[tab]();
  };
  run();
  const off = store.subscribe((i) => { if (i.kind === 'tip' && !box.children.length) run(); });
  return off;
}
