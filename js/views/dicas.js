// Jogos das 30 dicas: quiz, caça-palavras e cruzadinha. Quando a palavra é achada, aparece a explicação (a dica inteira).
// Os textos vêm dos registros privados "tip" (os mesmos do Plano de Estudo); sem eles os jogos avisam em vez de inventar texto.
import { h } from '../util.js';
import * as store from '../store.js';
import { banner } from '../ui.js';
import * as T from '../tips.js';
import * as FB from '../feedback.js';
import { TERMS } from '../glossary.js';
const MESA = { vitoria: (j, n) => import('../figurinhas/mesa.js').then((M) => M.vitoria(j, n)).catch(() => 0), pct: (c, t) => (t ? (c / t >= 0.9 ? 3 : c / t >= 0.7 ? 2 : c / t >= 0.4 ? 1 : 0) : 0), erros: (e) => (e === 0 ? 3 : e <= 2 ? 2 : 1) }; // estrelas só quando termina (carrega sob demanda)
import { alunoSemCodigo, GRATIS, avisoCodigo, cacaUsadas, cacaUsar } from '../amostra.js';

const KEY = 'setting-dicas';
const conf = () => ({ kw: {}, best: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (p) => store.upsert('setting', KEY, p);
import { tipList } from '../tipbox.js';
const items = () => T.keywords(tipList(), conf().kw);
// amostra grátis (sem código): a caça-palavras usa palavras do dicionário musical, não as dicas do método
const termItems = () => TERMS.filter((x) => /^\p{L}+$/u.test(x.t)).map((x, i) => ({ n: i + 1, text: x.d, w: T.norm(x.t), shown: x.t, termo: true })).filter((x) => x.w.length >= 4 && x.w.length <= 8);
const TABS = [['quiz', 'quiz'], ['caca', 'caça-palavras'], ['cruzadinha', 'cruzadinha']];
const total = () => Math.max(30, tipList().length);

/** A dica inteira, pra quando a palavra é achada. */
const explain = (it) => h('div', { class: 'card pad dc-explain', role: 'status' }, h('p', { class: 'dc-n' }, it.termo ? `termo musical · a palavra é ${it.shown}` : `dica ${it.n} de ${total()} · a palavra é ${it.shown}`), h('p', { class: 'dc-text' }, it.text));

/* ---------- quiz (mesma cara do caça-palavras e da cruzadinha: bolinhas coloridas, opções com letra, progresso) ---------- */
const LETRAS = ['A', 'B', 'C', 'D'];
function quiz(box, kinds, key) {
  const its = items(); const ROUNDS = Math.min(10, its.length);
  let i = 0; let score = 0; let q = null; let answered = false; let picked = null; let hist = [];
  const next = () => { const k = kinds[Math.floor(Math.random() * kinds.length)]; q = T.question(its, k); answered = false; picked = null; draw(); };
  const dots = () => h('div', { class: 'dc-prog', role: 'img', 'aria-label': `pergunta ${i + 1} de ${ROUNDS}, ${score} certas` }, ...Array.from({ length: ROUNDS }, (_, n) => h('i', { class: n < hist.length ? (hist[n] ? 'ok' : 'no') : n === i ? 'now' : '' })));
  const finish = () => {
    if (!alunoSemCodigo()) MESA.vitoria('quiz', MESA.pct(score, ROUNDS));
    const b = conf().best; const best = Math.max(b[key] || 0, score); if (score > (b[key] || 0)) save({ best: { ...b, [key]: score } });
    const frase = score >= ROUNDS * 0.9 ? 'você é fera! 🏆' : score >= ROUNDS * 0.7 ? 'mandou muito bem!' : score >= ROUNDS * 0.4 ? 'tá evoluindo, bora de novo!' : 'sem stress, errar faz parte';
    box.replaceChildren(h('section', { class: 'card pad ft-center dc-fim' }, h('div', { class: 'dc-score' }, h('b', {}, String(score)), h('small', {}, `de ${ROUNDS}`)), h('p', { class: 'dc-clue' }, frase), h('p', { class: 'muted' }, `seu melhor: ${best}`),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { i = 0; score = 0; hist = []; next(); } }, 'jogar de novo')));
    (score >= ROUNDS * 0.7 ? FB.great : FB.win)(box.firstChild);
  };
  const done = (ok, el) => { answered = true; hist.push(ok); if (ok) score++; draw(); FB.result(ok, el && el.isConnected ? el : box.querySelector('.dc-q'), { live: null }); };
  function draw() {
    const head = h('p', { class: 'tr-count' }, `pergunta ${i + 1} de ${ROUNDS} · ${score} certas`);
    const ask = q.ask || (q.kind === 'blank' ? 'qual palavra completa a dica?' : null);
    const body = [dots(), head, h('p', { class: 'dc-clue' }, q.prompt), ask ? h('p', { class: 'muted' }, ask) : null,
      h('div', { class: `dc-opts${q.options.some((o) => o.label.length > 18) ? ' long' : ''}` }, ...q.options.map((o, n) => h('button', { type: 'button', class: `tr-pal dc-opt dc-op${answered ? (o.id === q.ans ? ' ok' : picked === o.id ? ' no' : '') : ''}`, disabled: answered, onclick: (e) => { picked = o.id; done(o.id === q.ans, e.currentTarget); } },
        h('span', { class: `dc-bd dc-k${n}` }, answered && o.id === q.ans ? '✓' : answered && picked === o.id ? '✕' : LETRAS[n]), h('span', { class: 'dc-ot' }, o.label))))];
    box.replaceChildren(...[h('section', { class: 'card pad dc-q' }, ...body.filter(Boolean)),
      answered ? explain(q.item) : null,
      answered ? h('button', { class: 'btn primary', type: 'button', onclick: () => { i++; if (i >= ROUNDS) finish(); else next(); } }, i + 1 >= ROUNDS ? 'ver o resultado' : 'próxima') : null].filter(Boolean));
  }
  next();
}

/* ---------- caça-palavras (fácil: grade 9×9, 6 palavras curtas, só → e ↓, palavras à vista e cada uma de uma cor) ---------- */
const COLORS = 6; // classes dc-k0..dc-k5 (css/jogos.css)
function caca(box) {
  const free = alunoSemCodigo();
  if (free && cacaUsadas() >= GRATIS.caca) { box.replaceChildren(avisoCodigo(`você já jogou as ${GRATIS.caca} partidas grátis de caça-palavras. com o código de aluno tem caça-palavras sem limite, quiz e cruzadinha com as dicas do método.`)); return; }
  let counted = false; // a partida grátis conta quando a aluna faz a primeira jogada
  const its = free ? termItems() : items(); const pick = T.easyPick(its, 6); const byWord = Object.fromEntries(pick.map((x) => [x.w, x]));
  const ws = T.wordsearch(pick.map((x) => x.w), 9, Math.random, T.EASY_DIRS); const words = ws.placed.map((p) => p.w);
  const colorOf = Object.fromEntries(words.map((w, i) => [w, i % COLORS]));
  let erros = 0; let pagou = false;
  let start = null; const found = new Map(); let last = null; // found: palavra -> casas
  const key = (x, y) => `${x},${y}`;
  const cellColor = new Map(); // casa -> cor da palavra achada
  const cellEnd = new Set(); // última letra de cada palavra achada (leva a estrelinha do modelo figurinha)
  let drag = null; let grid = null;
  const cellAt = (el) => { const c = el && el.closest && el.closest('.dc-c'); return c && c.dataset.x != null ? { x: +c.dataset.x, y: +c.dataset.y, el: c } : null; };
  const preview = (line) => { grid.querySelectorAll('.dc-c.sel').forEach((e) => e.classList.remove('sel')); if (line) line.forEach((c) => grid.children[c.y * ws.size + c.x].classList.add('sel')); };
  const attempt = (line, el) => {
    const str = line.map((c) => ws.grid[c.y][c.x]).join(''); const rev = [...str].reverse().join('');
    const w = words.find((k) => !found.has(k) && (k === str || k === rev));
    if (w) { found.set(w, line); line.forEach((c) => cellColor.set(key(c.x, c.y), colorOf[w])); { const e = line[line.length - 1]; cellEnd.add(key(e.x, e.y)); } last = byWord[w]; draw(); const els = box.querySelectorAll('.dc-c.found'); const done = found.size === words.length; if (done && !pagou && !free) { pagou = true; MESA.vitoria('caca', MESA.erros(erros)); } (done ? FB.great : FB.win)(els[els.length - 1] || box, { msg: done ? 'achou todas! 🏆' : `achou: ${byWord[w].shown}!` }); }
    else { erros++; draw(); FB.lose(box.querySelector('.dc-grid') || el, { paul: false }); }
  };
  const up = () => {
    const d = drag; drag = null; if (!d) return; preview(null);
    if (free && !counted) { counted = true; cacaUsar(); }
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
      return h('button', { type: 'button', 'data-x': String(x), 'data-y': String(y), class: `dc-c${ck != null ? ` found dc-k${ck}${cellEnd.has(key(x, y)) ? ' fe' : ''}` : ''}${start && start.x === x && start.y === y ? ' start' : ''}`, 'aria-label': `${l}, linha ${y + 1}, coluna ${x + 1}` }, l);
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
    box.replaceChildren(...[h('section', { class: 'card pad dc-cacabox' }, ...[h('p', { class: 'tr-count' }, `${found.size} de ${words.length} palavras${free ? ` · partida grátis ${counted ? cacaUsadas() : cacaUsadas() + 1} de ${GRATIS.caca}` : ''}`), dica, chips, grid].filter(Boolean)), last ? explain(last) : null,
      found.size === words.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => { box.replaceChildren(); caca(box); } }, 'outra grade') : null].filter(Boolean));
  };
  draw();
}

/* ---------- cruzadinha (fácil: 5 palavras curtas, banco de palavras à vista, 1ª letra de cada uma já na grade, cores) ---------- */
function cruzadinha(box) {
  const its = items(); const pick = T.easyPick(its, 5, { min: 4, max: 8 });
  const cw = T.crossword(pick.map((x) => x.w), Math.random, 12); const solved = new Set(); let last = null; let erros = 0; let pagou = false;
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
        if (v === e.w) { solved.add(e.idx); cellsOf(e).forEach((c) => shown.set(`${c.x},${c.y}`, { ch: c.ch, k: e.idx % COLORS })); last = it; draw(); const all = solved.size === cw.entries.length; if (all && !pagou) { pagou = true; MESA.vitoria('cruzadinha', MESA.erros(erros)); } (all ? FB.great : FB.win)(box.querySelector('.dc-explain') || box, { msg: all ? 'cruzadinha completa! 🏆' : `isso: ${it.shown}!` }); }
        else { erros++; FB.lose(inp, { paul: false }); inp.select(); }
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
  const limited = alunoSemCodigo(); // sem código: só a caça-palavras (2 partidas, com palavras do dicionário)
  const tab = TABS.some(([k]) => k === parts[0]) ? parts[0] : limited ? 'caca' : 'quiz';
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
  host.append(banner('Quiz e Letras', limited ? `${GRATIS.caca} partidas de caça-palavras de graça` : 'quiz, caça-palavras e cruzadinha com as dicas do método'),
    wrap);
  wrap.append(
      h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), h('span', { style: 'flex:1' }), tg),
      h('div', { class: 'dc-picks', role: 'tablist', 'aria-label': 'Jogo' }, ...TABS.map(([k, t]) => h('a', { class: `dc-pick${tab === k ? ' on' : ''}`, role: 'tab', 'aria-selected': String(tab === k), href: `#/dicas/${k}` },
        h('img', { src: `assets/jogos/icones/${ICON[k]}`, alt: '', draggable: 'false' }), h('b', {}, limited && k !== 'caca' ? `🔒 ${t}` : t), h('small', {}, SUB[k])))),
      box);
  const run = () => {
    box.replaceChildren();
    if (limited) { if (tab === 'caca') caca(box); else box.append(avisoCodigo(`${tab === 'quiz' ? 'o quiz' : 'a cruzadinha'} é pra alunos da Beaterista: usa as dicas do método. a caça-palavras tem ${GRATIS.caca} partidas grátis.`)); return; }
    const n = items().length;
    if (n < 6) { box.append(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'elas vêm do seu Plano de Estudo quando sincronizar. abre o app com internet uma vez e volta aqui.'), h('a', { class: 'btn', href: '#/plano' }, 'abrir o Plano de Estudo'))); return; }
    ({ quiz: () => quiz(box, ['blank', 'continua'], 'quiz'), caca: () => caca(box), cruzadinha: () => cruzadinha(box) })[tab]();
  };
  run();
  const off = store.subscribe((i) => { if (i.kind === 'tip' && !box.children.length) run(); });
  return off;
}
