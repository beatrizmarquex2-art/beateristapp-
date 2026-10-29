// Quebra-cabeça musical: tela. Peças da cena do Paul no palco; regras em quebra-logic.js. Sem drag-and-drop nativo (toque: peça e depois posição; mouse também arrasta).
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as Q from './quebra-logic.js';
import { getGame, setGame, sfx, reduced } from './base.js';

const ID = 'quebra';
const SRC = 'assets/jogos/palco.webp';
const SIZES = [[6, '6 peças'], [12, '12 peças'], [24, '24 peças']];

export function mount(host) {
  let gone = false; let tick = 0;
  const saved = getGame(ID);
  const prefs = { diff: [6, 12, 24].includes(saved.diff) ? saved.diff : 6, free: saved.free === true };
  let best = saved.best && typeof saved.best === 'object' ? saved.best : {};
  let g = null; let selected = null; let hintCell = null; let msg = ''; let img = null; let paused = false; let viewing = false; let zoom = false; let last = 0; let record = false;
  let timeEl = null;
  const root = h('div', { class: 'jg jg-quebra' }); host.replaceChildren(root);
  const persist = () => setGame(ID, { ...prefs, best, game: g && !g.over ? g : null });
  const running = () => g && !g.free && g.started && !g.over && !document.hidden && !paused;

  /* ---------- relógio: soma só o tempo em que a partida está rodando ---------- */
  function clock() {
    const now = performance.now(); if (last && running()) g.elapsed += now - last; last = now;
    if (timeEl) timeEl.textContent = g && !g.free ? Q.fmtTime(g.elapsed) : '—';
  }
  const startClock = () => { clearInterval(tick); last = performance.now(); tick = setInterval(clock, 250); };
  const stopClock = () => { clearInterval(tick); tick = 0; last = 0; };
  const pause = (v) => { clock(); paused = v; last = performance.now(); if (g) persist(); };

  /* ---------- carregamento da imagem ---------- */
  function load(done) {
    root.replaceChildren(h('p', { class: 'jg-p', role: 'status' }, 'carregando a imagem…'));
    const im = new Image();
    im.onload = () => { if (gone) return; img = { w: im.naturalWidth, h: im.naturalHeight }; done(); };
    im.onerror = () => { if (gone) return; root.replaceChildren(h('p', { class: 'jg-msg', role: 'alert' }, 'não consegui carregar a imagem do quebra-cabeça.'), h('button', { class: 'btn primary', type: 'button', onclick: () => load(done) }, 'tentar de novo')); };
    im.src = SRC;
  }

  function intro() {
    stopClock(); g = null; selected = null; hintCell = null;
    const resume = Q.validGame(saved.game) && !saved.game.over ? saved.game : null;
    const seg = h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': 'dificuldade' }, ...SIZES.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.diff === v), class: prefs.diff === v ? 'on' : '', onclick: () => { prefs.diff = v; setGame(ID, { diff: v }); intro(); } }, l)));
    const bests = SIZES.map(([d]) => [d, best[`${d}:sem`], best[`${d}:com`]]).filter((b) => b[1] != null || b[2] != null);
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'quebra-cabeça'), h('img', { class: 'jg-qprev', src: SRC, alt: 'cena do Paul no palco, a imagem que você vai montar' }),
      h('p', { class: 'jg-lab' }, 'tamanho'), seg,
      h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', checked: prefs.free ? true : null, onchange: (e) => { prefs.free = e.target.checked; setGame(ID, { free: prefs.free }); } }), ' modo livre (sem tempo)'),
      h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'), h('ul', {}, h('li', {}, 'toque numa peça da bandeja e depois no lugar dela no quadro (no computador, pode arrastar).'), h('li', {}, 'só encaixa no lugar certo; errou, ela volta para a bandeja.'), h('li', {}, '“dica” mostra o lugar da peça escolhida. “ver imagem” mostra a figura pronta.'), h('li', {}, 'o tempo começa na primeira jogada e para quando a aba fica oculta.'))),
      bests.length ? h('p', { class: 'jg-p muted' }, 'melhores: ', bests.map(([d, s, c]) => `${d} peças ${s != null ? `sem dicas ${Q.fmtTime(s)}` : ''}${s != null && c != null ? ' · ' : ''}${c != null ? `com dicas ${Q.fmtTime(c)}` : ''}`).join(' | ')) : null,
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => load(() => begin(resume)) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => load(() => begin(Q.newGame(prefs))) }, resume ? 'nova partida' : 'iniciar')),
    ].filter(Boolean));
  }
  function begin(game) { g = game; selected = null; hintCell = null; msg = ''; paused = false; viewing = false; zoom = false; record = false; persist(); draw(); startClock(); }

  const pieceStyle = (i) => { const { cols, rows } = Q.DIFFS[g.diff]; return `background-image:url(${SRC});background-size:${cols * 100}% ${rows * 100}%;background-position:${Q.bgPos(i % cols, Math.floor(i / cols), cols, rows)};aspect-ratio:${(img.w / cols) / (img.h / rows)}`; };
  const posLabel = (p) => { const { cols } = Q.DIFFS[g.diff]; return `linha ${Math.floor(p / cols) + 1}, coluna ${(p % cols) + 1}`; };

  function draw() {
    const { cols, rows } = Q.DIFFS[g.diff]; const n = g.diff;
    const cells = Array.from({ length: n }, (_, p) => g.placed[p]
      ? h('div', { class: 'jg-pz fixed', style: pieceStyle(p), role: 'img', 'aria-label': `peça no lugar: ${posLabel(p)}` })
      : h('button', { type: 'button', class: `jg-pz slot${hintCell === p ? ' hint' : ''}`, 'aria-label': `posição vazia: ${posLabel(p)}${hintCell === p ? ' (dica: aqui)' : ''}`, 'data-pos': p, disabled: g.over || selected == null, onclick: () => put(p) }));
    const tray = g.tray.map((p) => h('button', { type: 'button', class: `jg-pz tp${selected === p ? ' sel' : ''}`, style: pieceStyle(p), 'aria-pressed': String(selected === p), 'aria-label': `peça ${g.tray.indexOf(p) + 1} de ${g.tray.length} na bandeja${selected === p ? ', selecionada' : ''}`, 'data-piece': p,
      onclick: () => { if (dragMoved) return; selected = selected === p ? null : p; hintCell = null; sfx('tap'); draw(); }, onpointerdown: (e) => dragStart(e, p) }));
    timeEl = h('b', {}, g.free ? '—' : Q.fmtTime(g.elapsed));
    root.replaceChildren(...[
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, 'peças'), h('span', {}, `${Q.placedCount(g)}/${n}`)), h('div', { class: 'jg-who' }, h('b', {}, 'tempo'), h('span', {}, timeEl)), h('div', { class: 'jg-who' }, h('b', {}, 'dicas'), h('span', {}, String(g.hints)))),
      h('div', { class: 'jg-actions row' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { viewing = true; draw(); } }, 'ver imagem'),
        h('button', { class: 'btn small', type: 'button', disabled: g.over || selected == null, onclick: hint }, 'dica'),
        h('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': String(zoom), onclick: () => { zoom = !zoom; draw(); } }, zoom ? 'reduzir quadro' : 'ampliar quadro'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: showRules }, 'regras')),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, g.over ? '' : msg),
      h('div', { class: `jg-boardwrap${zoom ? ' zoom' : ''}` }, h('div', { class: 'jg-pboard', role: 'group', 'aria-label': `quadro ${cols} colunas por ${rows} linhas`, style: `grid-template-columns:repeat(${cols},1fr);aspect-ratio:${img.w}/${img.h}` }, ...cells)),
      g.over ? result() : h('div', { class: 'jg-tray', role: 'group', 'aria-label': 'bandeja de peças, role para os lados' }, ...tray),
      viewing ? h('div', { class: 'jg-over', role: 'dialog', 'aria-label': 'imagem de referência' }, h('img', { src: SRC, alt: 'cena do Paul no palco' }), h('button', { class: 'btn primary', type: 'button', onclick: () => { viewing = false; draw(); } }, 'fechar')) : null,
    ].filter(Boolean));
  }

  function put(pos) {
    if (selected == null || g.over) return;
    const piece = selected; const r = Q.place(g, piece, pos); g = r.g; selected = null; hintCell = null;
    if (r.ok) { msg = ''; sfx('place'); } else { msg = 'ainda não é aí: a peça voltou para a bandeja'; sfx('bad'); }
    if (g.over) return finish();
    persist(); draw(); if (g.started && !tick) startClock();
  }
  function hint() { if (selected == null) return; g = Q.useHint(g); hintCell = selected; msg = `dica: a peça escolhida vai na posição ${posLabel(selected)}`; sfx('tap'); persist(); draw(); }
  function showRules() { pause(true); const el = h('div', { class: 'jg-over', role: 'dialog', 'aria-label': 'regras' }, h('p', {}, 'toque numa peça e depois no lugar dela. o tempo está pausado.'), h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); pause(false); } }, 'continuar')); root.append(el); el.querySelector('button').focus(); }
  function finish() {
    clock(); stopClock(); const r = Q.recordBest(best, g); best = r.best; record = r.record; setGame(ID, { ...prefs, best, game: null }); sfx('win'); draw();
  }
  function result() {
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, 'montou! 🤘'),
      h('p', {}, g.free ? 'modo livre: sem tempo' : `tempo: ${Q.fmtTime(g.elapsed)}${record ? ' · novo recorde!' : ''}`), h('p', { class: 'muted' }, `${g.hints} dica${g.hints === 1 ? '' : 's'} · ${g.errors} tentativa${g.errors === 1 ? '' : 's'} errada${g.errors === 1 ? '' : 's'}`),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => begin(Q.newGame(prefs)) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  /* ---------- arrastar com mouse/caneta (no toque, a rolagem da bandeja tem prioridade: use toque na peça e na posição) ---------- */
  let dragMoved = false; let ghost = null; let drag = null;
  function dragStart(e, p) {
    if (e.pointerType === 'touch' || e.button !== 0 || g.over) return;
    drag = { p, x: e.clientX, y: e.clientY, el: e.currentTarget }; dragMoved = false;
    addEventListener('pointermove', dragMove); addEventListener('pointerup', dragEnd, { once: true }); addEventListener('pointercancel', dragEnd, { once: true });
  }
  function dragMove(e) {
    if (!drag) return;
    if (!dragMoved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!dragMoved) { dragMoved = true; ghost = drag.el.cloneNode(false); ghost.className = 'jg-pz ghost'; ghost.style.width = `${drag.el.offsetWidth}px`; document.body.append(ghost); }
    ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`; ghost.style.top = `${e.clientY - ghost.offsetHeight / 2}px`;
  }
  function dragEnd(e) {
    removeEventListener('pointermove', dragMove); removeEventListener('pointercancel', dragEnd); removeEventListener('pointerup', dragEnd);
    if (ghost) { ghost.remove(); ghost = null; }
    if (drag && dragMoved && e.type === 'pointerup') { const t = document.elementFromPoint(e.clientX, e.clientY); const cell = t && t.closest && t.closest('[data-pos]'); if (cell) { selected = drag.p; put(Number(cell.dataset.pos)); } }
    drag = null; setTimeout(() => { dragMoved = false; }, 0);
  }

  const onVis = () => { if (document.hidden) { clock(); persist(); } else last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  intro();
  return {
    inProgress: () => !!(g && !g.over && g.started),
    restart: async () => { if (g && !g.over && g.started && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() { gone = true; stopClock(); if (g) persist(); if (ghost) ghost.remove(); document.removeEventListener('visibilitychange', onVis); removeEventListener('pointermove', dragMove); removeEventListener('pointerup', dragEnd); removeEventListener('pointercancel', dragEnd); void reduced; },
  };
}
