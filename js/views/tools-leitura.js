// Folhas de leitura: gera leitura rítmica nova (mesmas células dos Treinos) e baixa em PDF A4, com ou sem papel timbrado.
// Cada folha tem um código (semente): o mesmo código gera a mesma folha, pra repetir com outro aluno.
import { h } from '../util.js';
import * as store from '../store.js';
import * as N from '../notation.js';
import { LEVEL_NAMES, genBar, layoutRhythm, rng } from '../reading.js';
import { jpegPdf, fileName } from '../pdf.js';
import { toJpeg, savePdf } from './plan-pdf.js';
import { banner, toast } from '../ui.js';
import { back } from './tools-common.js';
import { sendCanvases } from '../send-folder.js';

const KEY = 'setting-folhas';
const W = 1240, H = 1754, MM = W / 210;
const FONT = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
const conf = () => ({ lv: 1, pages: 1, lines: 10, paper: 'timbrado', count: true, title: 'Leitura rítmica', ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (p) => store.upsert('setting', KEY, p);
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

/** As linhas (2 compassos cada) de todas as folhas, a partir da semente. */
export function sheetBars(c, seed) {
  const r = rng(seed); const out = [];
  for (let p = 0; p < c.pages; p++) { const page = []; for (let l = 0; l < c.lines; l++) page.push([...genBar(c.lv, r), ...genBar(c.lv, r)]); out.push(page); }
  return out;
}

async function render(c, seed, student) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const paper = c.paper === 'timbrado' ? await loadImg('assets/papel-timbrado.png') : null;
  const side = Math.round(16 * MM), top = Math.round((paper ? 40 : 18) * MM), bottom = H - Math.round((paper ? 32 : 14) * MM);
  return sheetBars(c, seed).map((page, pi) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); if (paper) g.drawImage(paper, 0, 0, W, H);
    g.fillStyle = '#111'; g.font = `700 44px ${FONT}`; g.fillText(c.title || 'Leitura rítmica', side, top);
    g.font = `400 22px ${FONT}`; g.fillStyle = '#444';
    g.fillText([student, LEVEL_NAMES[c.lv], `folha ${pi + 1} de ${c.pages}`, `código ${seed}`].filter(Boolean).join(' · '), side, top + 36);
    const rowH = (bottom - top - 70) / c.lines; const scale = Math.min(1.6, rowH / (c.count ? 84 : 64)); const lineW = (W - side * 2) / scale;
    page.forEach((cells, li) => {
      const lay = layoutRhythm(cells, { width: lineW, count: c.count });
      const y = top + 60 + li * rowH; g.font = `700 20px ${FONT}`; g.fillStyle = '#b5162b'; g.fillText(String(li + 1), side - 34, y + 46 * scale * 0.9);
      g.save(); g.translate(side, y); N.draw(g, lay, { scale, ink: '#111' }); g.restore();
    });
    return cv;
  });
}

export function mountLeitura(host) {
  let seed = Math.floor(Math.random() * 90000) + 10000;
  const prev = h('div', { class: 'ft-sheet' });
  const student = h('input', { type: 'text', maxlength: 60, placeholder: 'nome do aluno (opcional)', 'aria-label': 'Nome do aluno' });
  const code = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': 'Código da folha', value: String(seed) });
  code.addEventListener('change', () => { seed = Number(code.value) || seed; draw(); });
  const opts = h('div');
  const chip = (label, key, list) => h('div', { class: 'tr-line' }, h('span', { class: 'tp-lab' }, label), h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': label },
    ...list.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(conf()[key] === v), class: `lib-tab${conf()[key] === v ? ' on' : ''}`, onclick: () => save({ [key]: v }).then(draw) }, t))));
  const draw = () => {
    const c = conf();
    opts.replaceChildren(chip('nível', 'lv', [[1, '1'], [2, '2'], [3, '3']]), h('p', { class: 'muted tr-lvname' }, LEVEL_NAMES[c.lv]),
      chip('folhas', 'pages', [[1, '1'], [2, '2'], [3, '3'], [5, '5']]), chip('linhas', 'lines', [[6, '6'], [8, '8'], [10, '10'], [12, '12']]),
      chip('papel', 'paper', [['timbrado', 'timbrado'], ['branco', 'branco']]), chip('contagem', 'count', [[true, 'com 1 e & a'], [false, 'sem']]));
    const first = sheetBars({ ...c, pages: 1 }, seed)[0];
    prev.replaceChildren(...first.slice(0, 4).map((cells) => { const f = h('figure', { class: 'tr-bar' }); f.innerHTML = N.toSVG(layoutRhythm(cells, { width: 560, count: c.count })); return f; }),
      h('p', { class: 'muted' }, `prévia: 4 de ${c.lines} linhas da folha 1`));
  };
  const pdf = async (e) => {
    const btn = e.currentTarget; btn.disabled = true; toast('montando o PDF…', { id: 'ft-pdf', ms: 20000 });
    try {
      const c = conf(); const pages = await render(c, seed, student.value.trim());
      const jpegs = await Promise.all(pages.map(toJpeg));
      const name = fileName(c.title || 'Leitura', student.value.trim(), `nivel ${c.lv} - ${seed}`);
      const r = await savePdf(jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title: name }), name);
      toast(r.shared ? 'PDF pronto ✓' : `baixado: ${r.name}`, { id: 'ft-pdf', ms: 2500 });
    } catch (err) { toast(`não consegui gerar: ${err.message || 'erro'}`, { id: 'ft-pdf', ms: 4000 }); }
    btn.disabled = false;
  };
  const toFolder = async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    try { const c = conf(); const pages = await render(c, seed, student.value.trim()); await sendCanvases(pages, fileName(c.title || 'Leitura', student.value.trim(), `nivel ${c.lv} - ${seed}`)); } catch (err) { toast(`não consegui enviar: ${err.message || 'erro'}`, { ms: 3500 }); }
    btn.disabled = false;
  };
  host.append(banner('Folhas de leitura', 'leitura nova toda vez, pronta pra imprimir'), back(),
    h('section', { class: 'card pad tr-ctrl' }, opts, h('label', { class: 'field' }, h('span', {}, 'aluno'), student), h('label', { class: 'field' }, h('span', {}, 'código da folha'), code)),
    h('div', { class: 'row pad-x ft-row' }, h('button', { class: 'btn primary', type: 'button', onclick: pdf }, 'baixar PDF'), h('button', { class: 'btn', type: 'button', onclick: toFolder }, '📁 enviar pra pasta'), h('button', { class: 'btn', type: 'button', onclick: () => { seed = Math.floor(Math.random() * 90000) + 10000; code.value = String(seed); draw(); } }, 'outra folha')),
    h('section', { class: 'card pad' }, prev),
    h('p', { class: 'pad-x lib-note' }, 'o mesmo código gera a mesma folha: anota o código pra repetir a leitura com outro aluno ou conferir a correção.'));
  draw();
  return () => {};
}
