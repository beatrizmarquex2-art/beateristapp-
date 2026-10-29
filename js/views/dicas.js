// Jogos das 30 dicas: quiz, caça-palavras, cruzadinha e um "misturado". Quando a palavra é achada, aparece a explicação (a dica inteira).
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
const TABS = [['quiz', 'quiz'], ['caca', 'caça-palavras'], ['cruzadinha', 'cruzadinha'], ['misturado', 'misturado'], ['palavras', 'palavras']];
const total = () => Math.max(30, tipList().length);

/** A dica inteira, pra quando a palavra é achada. */
const explain = (it) => h('div', { class: 'card pad dc-explain', role: 'status' }, h('p', { class: 'dc-n' }, `dica ${it.n} de ${total()} · a palavra é ${it.shown}`), h('p', { class: 'dc-text' }, it.text));

/* ---------- quiz (e o misturado: também embaralhada) ---------- */
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
    let body;
    if (q.kind === 'embaralhada') {
      const word = picked.map((p) => q.letters[p]).join('');
      const tiles = q.letters.map((l, k) => h('button', { type: 'button', class: `dc-tile${picked.includes(k) ? ' used' : ''}`, disabled: answered || picked.includes(k), onclick: () => { picked.push(k); if (picked.length === q.ans.length) { const ok = picked.map((p) => q.letters[p]).join('') === q.ans; done(ok); } else draw(); } }, l));
      body = [h('p', { class: 'dc-clue' }, q.clue), h('p', { class: 'muted' }, q.prompt), h('div', { class: 'dc-word' }, ...[...q.ans].map((_, k) => h('span', { class: word[k] ? 'on' : '' }, word[k] || ''))), h('div', { class: 'dc-tiles' }, ...tiles),
        h('button', { class: 'btn small ghost', type: 'button', disabled: answered || !picked.length, onclick: () => { picked.pop(); draw(); } }, '↺ apagar a última')];
    } else {
      body = [h(q.kind === 'blank' ? 'p' : 'h3', { class: q.kind === 'blank' ? 'dc-clue' : 'dc-ask' }, q.prompt), q.kind === 'blank' ? h('p', { class: 'muted' }, 'qual palavra completa a dica?') : null,
        h('div', { class: `dc-opts${q.kind === 'match' ? ' long' : ''}` }, ...q.options.map((o) => h('button', { type: 'button', class: `tr-pal dc-opt${answered ? (o.id === q.ans ? ' ok' : '') : ''}`, disabled: answered, onclick: (e) => { const btn = e.currentTarget; done(o.id === q.ans, btn); if (o.id !== q.ans) btn.classList.add('no'); } }, o.label)))];
    }
    box.replaceChildren(...[h('section', { class: 'card pad dc-q' }, head, ...body.filter(Boolean)),
      answered ? explain(q.item) : null,
      answered ? h('button', { class: 'btn primary', type: 'button', onclick: () => { i++; if (i >= ROUNDS) finish(); else next(); } }, i + 1 >= ROUNDS ? 'ver o resultado' : 'próxima') : null].filter(Boolean));
  }
  next();
}

/* ---------- caça-palavras ---------- */
function caca(box) {
  const its = items(); const pick = T.shuffle(its).slice(0, 8); const byWord = Object.fromEntries(pick.map((x) => [x.w, x]));
  const ws = T.wordsearch(pick.map((x) => x.w), 12); const words = ws.placed.map((p) => p.w);
  let start = null; const found = new Map(); let last = null; // found: palavra -> casas
  const key = (x, y) => `${x},${y}`;
  const cellsFound = new Set();
  const draw = () => {
    const grid = h('div', { class: 'dc-grid', style: `--n:${ws.size}` }, ...ws.grid.flatMap((row, y) => row.map((l, x) => h('button', { type: 'button', class: `dc-c${cellsFound.has(key(x, y)) ? ' found' : ''}${start && start.x === x && start.y === y ? ' start' : ''}`, 'aria-label': `${l}, linha ${y + 1}, coluna ${x + 1}`, onclick: (e) => tap(x, y, e.currentTarget) }, l))));
    const list = h('ul', { class: 'dc-words' }, ...words.map((w) => h('li', { class: found.has(w) ? 'ok' : '' }, found.has(w) ? h('button', { type: 'button', class: 'link', onclick: () => { last = byWord[w]; draw(); } }, `✓ ${byWord[w].shown}`) : h('span', {}, `${T.clueOf(byWord[w])} (${w.length} letras)`)))); // a palavra só aparece quando acha
    const dica = !found.size ? h('p', { class: 'muted' }, 'cada pista esconde uma palavra: toca na primeira letra e depois na última dela na grade. quando achar, aparece a explicação!') : null;
    box.replaceChildren(...[h('section', { class: 'card pad dc-cacabox' }, ...[h('p', { class: 'tr-count' }, `${found.size} de ${words.length} palavras`), dica, grid, list].filter(Boolean)), last ? explain(last) : null,
      found.size === words.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => mount2() }, 'outra grade') : null].filter(Boolean));
  };
  const tap = (x, y, el) => {
    if (!start) { start = { x, y }; draw(); return; }
    const line = T.lineCells(start.x, start.y, x, y); const s0 = start; start = null;
    if (!line) { if (s0.x !== x || s0.y !== y) { FB.lose(el, { paul: false }); } start = s0.x === x && s0.y === y ? null : { x, y }; draw(); return; }
    const str = line.map((c) => ws.grid[c.y][c.x]).join(''); const rev = [...str].reverse().join('');
    const w = words.find((k) => !found.has(k) && (k === str || k === rev));
    if (w) { found.set(w, line); line.forEach((c) => cellsFound.add(key(c.x, c.y))); last = byWord[w]; draw(); const els = box.querySelectorAll('.dc-c.found'); const done = found.size === words.length; (done ? FB.great : FB.win)(els[els.length - 1] || box, { msg: done ? 'achou todas! 🏆' : `achou: ${byWord[w].shown}!` }); }
    else { draw(); FB.lose(box.querySelector('.dc-grid'), { paul: false }); }
  };
  const mount2 = () => { box.replaceChildren(); caca(box); };
  draw();
}

/* ---------- cruzadinha ---------- */
function cruzadinha(box) {
  const its = items(); const pick = T.shuffle(its).filter((x) => x.w.length <= 11).slice(0, 8);
  const cw = T.crossword(pick.map((x) => x.w)); const solved = new Set(); let last = null;
  const cellsOf = (e) => Array.from({ length: e.w.length }, (_, k) => ({ x: e.x + (e.dir === 'h' ? k : 0), y: e.y + (e.dir === 'v' ? k : 0), ch: e.w[k] }));
  const shown = new Map(); // casa -> letra revelada
  const draw = (focus) => {
    const nums = new Map(); for (const e of cw.entries) nums.set(`${e.x},${e.y}`, e.n);
    const live = new Map(); for (const e of cw.entries) for (const c of cellsOf(e)) live.set(`${c.x},${c.y}`, c.ch);
    const grid = h('div', { class: 'dc-cw', style: `--cols:${cw.w}` }, ...Array.from({ length: cw.h }, (_, y) => Array.from({ length: cw.w }, (_, x) => {
      const k = `${x},${y}`; if (!live.has(k)) return h('i', { class: 'dc-blank', 'aria-hidden': 'true' });
      return h('span', { class: `dc-cell${shown.has(k) ? ' on' : ''}` }, nums.has(k) ? h('small', {}, String(nums.get(k))) : null, shown.get(k) || '');
    })).flat());
    const clues = h('ol', { class: 'dc-clues' }, ...cw.entries.map((e) => { const it = pick[e.idx]; const ok = solved.has(e.idx);
      const inp = h('input', { type: 'text', maxlength: e.w.length, autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false', disabled: ok, placeholder: '·'.repeat(e.w.length), 'aria-label': `Resposta da ${e.n} ${e.dir === 'h' ? 'horizontal' : 'vertical'}`, value: ok ? it.w : '' });
      inp.addEventListener('input', () => {
        const v = T.norm(inp.value).replace(/[^A-Z]/g, ''); if (v.length < e.w.length) return;
        if (v === e.w) { solved.add(e.idx); cellsOf(e).forEach((c) => shown.set(`${c.x},${c.y}`, c.ch)); last = it; draw(); const all = solved.size === cw.entries.length; (all ? FB.great : FB.win)(box.querySelector('.dc-explain') || box, { msg: all ? 'cruzadinha completa! 🏆' : `isso: ${it.shown}!` }); }
        else { FB.lose(inp, { paul: false }); inp.select(); }
      });
      return h('li', { class: ok ? 'ok' : '', value: e.n }, h('span', { class: 'dc-dir' }, `${e.dir === 'h' ? '→' : '↓'} ${e.w.length} letras`), h('p', {}, T.clueOf(it)), inp); }));
    box.replaceChildren(...[h('section', { class: 'card pad' }, h('p', { class: 'tr-count' }, `${solved.size} de ${cw.entries.length} palavras`), grid), last ? explain(last) : null, h('section', { class: 'card pad' }, h('h3', { class: 'tag' }, 'pistas'), clues),
      solved.size === cw.entries.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => { box.replaceChildren(); cruzadinha(box); } }, 'outra cruzadinha') : null].filter(Boolean));
    if (focus != null) { const el = box.querySelectorAll('.dc-clues input')[focus]; el && el.focus(); }
  };
  draw();
}

/* ---------- palavras: dá pra trocar a palavra-chave de cada dica ---------- */
function palavras(box) {
  const its = items();
  box.replaceChildren(h('p', { class: 'pad-x lib-note' }, 'cada dica vira uma palavra nos jogos. se a escolha automática não ficou boa, troca aqui.'),
    h('section', { class: 'card pad' }, h('ul', { class: 'dc-kw' }, ...its.map((it) => h('li', {}, h('b', {}, `${it.n}`), h('span', { class: 'dc-kwt' }, it.text.length > 80 ? `${it.text.slice(0, 78)}…` : it.text),
      h('select', { 'aria-label': `Palavra da dica ${it.n}`, onchange: (e) => save({ kw: { ...conf().kw, [it.n]: e.target.value } }) }, ...it.cands.map((c) => h('option', { value: c.w, selected: c.w === it.w }, c.shown))))))));
}

export function mount(host, parts = []) {
  const tab = TABS.some(([k]) => k === parts[0]) ? parts[0] : 'quiz';
  const box = h('div', { class: 'dc-box' });
  host.append(banner('Jogos das dicas', 'quiz, caça-palavras e cruzadinha com as 30 dicas'),
    h('div', { class: 'chips lib-tabs bt-tabs', role: 'tablist' }, ...TABS.map(([k, t]) => h('a', { class: `lib-tab${tab === k ? ' on' : ''}`, role: 'tab', 'aria-selected': String(tab === k), href: `#/dicas/${k}` }, t))), box);
  const run = () => {
    box.replaceChildren(); const n = items().length;
    if (n < 6) { box.append(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'elas vêm do seu Plano de Estudo quando sincronizar. abre o app com internet uma vez e volta aqui.'), h('a', { class: 'btn', href: '#/plano' }, 'abrir o Plano de Estudo'))); return; }
    ({ quiz: () => quiz(box, ['blank', 'match'], 'quiz'), caca: () => caca(box), cruzadinha: () => cruzadinha(box), misturado: () => quiz(box, ['blank', 'match', 'embaralhada'], 'misturado'), palavras: () => palavras(box) })[tab]();
  };
  run();
  const off = store.subscribe((i) => { if (i.kind === 'tip' && !box.children.length) run(); });
  return off;
}
