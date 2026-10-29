// Folhas de leitura: gera leitura rítmica nova (mesmas células dos Treinos) e baixa em PDF A4, com ou sem papel timbrado.
// Cada folha tem um código (semente): o mesmo código gera a mesma folha, pra repetir com outro aluno.
import { h } from '../util.js';
import * as store from '../store.js';
import * as N from '../notation.js';
import { LEVEL_NAMES, genBar, layoutRhythm, rng, CELLS } from '../reading.js';
import { jpegPdf, fileName } from '../pdf.js';
import { toJpeg, savePdf } from './plan-pdf.js';
import { banner, toast, sheet, confirmSheet } from '../ui.js';
import { back } from './tools-common.js';
import { sendCanvases } from '../send-folder.js';

const KEY = 'setting-folhas';
const W = 1240, H = 1754, MM = W / 210;
const FONT = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
const conf = () => ({ lv: 1, pages: 1, lines: 10, paper: 'timbrado', count: true, title: 'Leitura rítmica', custom: null, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const REST = '0000'; const BLANK = () => Array(8).fill(REST); // 2 compassos de 4 tempos por linha
const save = (p) => store.upsert('setting', KEY, p);
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

/** As linhas (2 compassos cada) de todas as folhas, a partir da semente. */
/** Folha que a Bea mexeu ou criou (`c.custom`) vale mais que a sorteada. */
export function sheetBars(c, seed) {
  if (c.custom && c.custom.pages) return c.custom.pages;
  const r = rng(seed); const out = [];
  for (let p = 0; p < c.pages; p++) { const page = []; for (let l = 0; l < c.lines; l++) page.push([...genBar(c.lv, r), ...genBar(c.lv, r)]); out.push(page); }
  return out;
}

async function render(c, seed, student) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const paper = c.paper === 'timbrado' ? await loadImg('assets/papel-timbrado.png') : null;
  const side = Math.round(16 * MM), top = Math.round((paper ? 40 : 18) * MM), bottom = H - Math.round((paper ? 32 : 14) * MM);
  const sheets = sheetBars(c, seed);
  return sheets.map((page, pi) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); if (paper) g.drawImage(paper, 0, 0, W, H);
    g.fillStyle = '#111'; g.font = `700 44px ${FONT}`; g.fillText(c.title || 'Leitura rítmica', side, top);
    g.font = `400 22px ${FONT}`; g.fillStyle = '#444';
    g.fillText([student, c.custom ? 'folha montada à mão' : LEVEL_NAMES[c.lv], `folha ${pi + 1} de ${sheets.length}`, c.custom ? '' : `código ${seed}`].filter(Boolean).join(' · '), side, top + 36);
    const lines = page.length; const rowH = (bottom - top - 70) / Math.max(lines, 1); const scale = Math.min(1.6, rowH / (c.count ? 84 : 64)); const lineW = (W - side * 2) / scale;
    page.forEach((cells, li) => {
      const lay = layoutRhythm(cells, { width: lineW, count: c.count });
      const y = top + 60 + li * rowH; g.font = `700 20px ${FONT}`; g.fillStyle = '#b5162b'; g.fillText(String(li + 1), side - 34, y + 46 * scale * 0.9);
      g.save(); g.translate(side, y); N.draw(g, lay, { scale, ink: '#111' }); g.restore();
    });
    return cv;
  });
}

const cellSvg = (pat, w = 92) => { const f = h('span', { class: 'tr-cell', 'aria-hidden': 'true' }); f.innerHTML = N.toSVG(layoutRhythm([pat], { width: w, count: false, clef: false })); return f; };

/** Editor de uma linha (2 compassos = 8 tempos): toca num tempo e escolhe a figura. */
function lineSheet(initial, { lv, onSave, title }) {
  sheet(title, (close) => {
    const cells = initial.slice(); let at = 0;
    const slots = h('div', { class: 'ft-slots' }); const prev = h('figure', { class: 'tr-bar' });
    const paint = () => {
      slots.replaceChildren(...cells.map((p, i) => h('button', { type: 'button', class: `tr-slot full${i === at ? ' sel' : ''}${i === 4 ? ' bar2' : ''}`, 'aria-label': `Tempo ${(i % 4) + 1} do compasso ${i < 4 ? 1 : 2}${i === at ? ' (escolhido)' : ''}`, onclick: () => { at = i; paint(); } }, cellSvg(p, 70))));
      prev.innerHTML = N.toSVG(layoutRhythm(cells, { width: 560, count: true }));
    };
    const palette = h('div', { class: 'tr-palette ft-pal' }, ...CELLS.map((c) => h('button', { type: 'button', class: 'tr-pal', title: c.name, 'aria-label': c.name, onclick: () => { cells[at] = c.p; at = Math.min(7, at + 1); paint(); } }, cellSvg(c.p))));
    paint();
    return h('div', { class: 'sheet-body' }, prev, h('p', { class: 'muted' }, 'toca num tempo e escolhe a figura embaixo (ele já pula pro próximo).'), slots, palette,
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { const nb = [...genBar(lv), ...genBar(lv)]; nb.forEach((p, i) => { cells[i] = p; }); paint(); } }, '🎲 sortear a linha'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { cells.fill(REST); at = 0; paint(); } }, 'limpar')),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { onSave(cells.slice()); close(); } }, 'pronto'));
  });
}

export function mountLeitura(host) {
  let seed = Math.floor(Math.random() * 90000) + 10000; let pg = 0;
  const prev = h('div', { class: 'ft-sheet' });
  const student = h('input', { type: 'text', maxlength: 60, placeholder: 'nome do aluno (opcional)', 'aria-label': 'Nome do aluno' });
  const code = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': 'Código da folha', value: String(seed) });
  code.addEventListener('change', () => { seed = Number(code.value) || seed; draw(); });
  const title = h('input', { type: 'text', maxlength: 60, value: conf().title, 'aria-label': 'Título da folha' });
  title.addEventListener('change', () => save({ title: title.value.trim() || 'Leitura rítmica' }));
  const opts = h('div'); const mine = h('div');
  const chip = (label, key, list, set) => h('div', { class: 'tr-line' }, h('span', { class: 'tp-lab' }, label), h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': label },
    ...list.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(conf()[key] === v), class: `lib-tab${conf()[key] === v ? ' on' : ''}`, onclick: () => (set ? set(v) : save({ [key]: v }).then(draw)) }, t))));
  /** Cria/ajusta a folha manual: mantém as linhas que já existem e completa com linhas vazias. */
  const fit = (custom, pages, lines) => ({ pages: Array.from({ length: pages }, (_, p) => Array.from({ length: lines }, (_, l) => (custom.pages[p] && custom.pages[p][l]) || BLANK())) });
  const startCustom = (fromSheet) => {
    const c = conf(); const pages = fromSheet ? sheetBars(c, seed).map((pgs) => pgs.map((l) => l.slice())) : Array.from({ length: c.pages }, () => Array.from({ length: c.lines }, BLANK));
    pg = 0; return save({ custom: { pages } });
  };
  const edit = (pi, li) => { const c = conf(); const cu = c.custom;
    lineSheet(cu.pages[pi][li], { lv: c.lv, title: `Linha ${li + 1}`, onSave: (cells) => { const pages = cu.pages.map((x) => x.map((l) => l.slice())); pages[pi][li] = cells; save({ custom: { pages } }); } }); };
  const draw = () => {
    const c = conf(); const cu = c.custom;
    if (cu) { pg = Math.min(pg, cu.pages.length - 1); }
    opts.replaceChildren(...(cu ? [
      h('p', { class: 'muted tr-lvname' }, 'folha montada à mão: toca numa linha pra mudar as figuras.'),
      chip('folhas', 'pages', [[1, '1'], [2, '2'], [3, '3'], [5, '5']], (v) => save({ pages: v, custom: fit(cu, v, cu.pages[0].length) }).then(draw)),
      chip('linhas', 'lines', [[6, '6'], [8, '8'], [10, '10'], [12, '12']], (v) => save({ lines: v, custom: fit(cu, cu.pages.length, v) }).then(draw)),
    ] : [chip('nível', 'lv', [[1, '1'], [2, '2'], [3, '3']]), h('p', { class: 'muted tr-lvname' }, LEVEL_NAMES[c.lv]),
      chip('folhas', 'pages', [[1, '1'], [2, '2'], [3, '3'], [5, '5']]), chip('linhas', 'lines', [[6, '6'], [8, '8'], [10, '10'], [12, '12']])]),
      chip('papel', 'paper', [['timbrado', 'timbrado'], ['branco', 'branco']]), chip('contagem', 'count', [[true, 'com 1 e & a'], [false, 'sem']]));
    mine.replaceChildren(
      !cu ? h('button', { class: 'btn', type: 'button', onclick: async () => { await startCustom(true); draw(); toast('agora é só tocar numa linha pra mudar ✏️', { ms: 2500 }); } }, '✏️ editar esta folha') : null,
      !cu ? h('button', { class: 'btn', type: 'button', onclick: async () => { await startCustom(false); draw(); toast('folha em branco: toca numa linha pra escrever', { ms: 2500 }); } }, '📝 criar a minha folha') : null,
      cu ? h('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (await confirmSheet('Voltar pra folha sorteada?', 'o que você montou nesta folha será descartado.', 'Voltar')) { await save({ custom: null }); draw(); } } }, 'voltar pra folha sorteada') : null);
    const pages = sheetBars(c, seed); const lines = pages[Math.min(pg, pages.length - 1)];
    const mk = (cells, li) => { const f = h(cu ? 'button' : 'figure', { class: `tr-bar${cu ? ' ft-edit' : ''}`, type: cu ? 'button' : null, 'aria-label': cu ? `Editar linha ${li + 1}` : null, onclick: cu ? () => edit(pg, li) : null });
      f.innerHTML = N.toSVG(layoutRhythm(cells, { width: 560, count: c.count })); return f; };
    prev.replaceChildren(
      cu && pages.length > 1 ? h('div', { class: 'chips lib-tabs' }, ...pages.map((_, i) => h('button', { type: 'button', class: `lib-tab${i === pg ? ' on' : ''}`, onclick: () => { pg = i; draw(); } }, `folha ${i + 1}`))) : null,
      ...(cu ? lines : lines.slice(0, 4)).map((cells, li) => { const el = mk(cells, li); if (!cu) { el.classList.add('ft-edit'); el.setAttribute('role', 'button'); el.tabIndex = 0; const go = async () => { await startCustom(true); draw(); edit(0, li); }; el.addEventListener('click', go); el.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }); } return el; }),
      h('p', { class: 'muted' }, cu ? `folha ${pg + 1} de ${pages.length} · ${lines.length} linhas · toca numa linha pra editar` : `prévia: 4 de ${c.lines} linhas da folha 1 · toca numa linha pra mexer nela`));
  };
  const nameOf = (c) => fileName(c.title || 'Leitura', student.value.trim(), c.custom ? 'montada a mao' : `nivel ${c.lv} - ${seed}`);
  const pdf = async (e) => {
    const btn = e.currentTarget; btn.disabled = true; toast('montando o PDF…', { id: 'ft-pdf', ms: 20000 });
    try {
      const c = conf(); const pages = await render(c, seed, student.value.trim());
      const jpegs = await Promise.all(pages.map(toJpeg));
      const name = nameOf(c);
      const r = await savePdf(jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title: name }), name);
      toast(r.shared ? 'PDF pronto ✓' : `baixado: ${r.name}`, { id: 'ft-pdf', ms: 2500 });
    } catch (err) { toast(`não consegui gerar: ${err.message || 'erro'}`, { id: 'ft-pdf', ms: 4000 }); }
    btn.disabled = false;
  };
  const toFolder = async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    try { const c = conf(); const pages = await render(c, seed, student.value.trim()); await sendCanvases(pages, nameOf(c)); } catch (err) { toast(`não consegui enviar: ${err.message || 'erro'}`, { ms: 3500 }); }
    btn.disabled = false;
  };
  const codeField = h('label', { class: 'field' }, h('span', {}, 'código da folha'), code);
  host.append(banner('Folhas de leitura', 'leitura nova toda vez, pronta pra imprimir'), back(),
    h('section', { class: 'card pad tr-ctrl' }, h('label', { class: 'field' }, h('span', {}, 'título'), title), opts, h('div', { class: 'row ft-row' }, mine), h('label', { class: 'field' }, h('span', {}, 'aluno'), student), codeField),
    h('div', { class: 'row pad-x ft-row' }, h('button', { class: 'btn primary', type: 'button', onclick: pdf }, 'baixar PDF'), h('button', { class: 'btn', type: 'button', onclick: toFolder }, '📁 enviar pra pasta'), h('button', { class: 'btn', type: 'button', onclick: () => { seed = Math.floor(Math.random() * 90000) + 10000; code.value = String(seed); if (conf().custom) { save({ custom: null }).then(draw); } else draw(); } }, 'outra folha')),
    h('section', { class: 'card pad' }, prev),
    h('p', { class: 'pad-x lib-note' }, 'o mesmo código gera a mesma folha sorteada: anota o código pra repetir a leitura com outro aluno. a folha que você monta à mão fica guardada aqui até você voltar pra sorteada.'));
  draw();
  const off = store.subscribe((i) => { if (i.kind === 'setting' && i.id === KEY) draw(); });
  return off;
}
