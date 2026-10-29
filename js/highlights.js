// Grifar: seleciona um trecho do texto e guarda como anotação (cor + pasta). Os grifos voltam a aparecer no texto e
// ficam todos em "Minhas anotações". Registro "grifo": { src, srcTitle, href, text, before, after, color, folder, gid, created }.
import { h, icon, debounce } from './util.js';
import * as store from './store.js';
import { sheet, toast, confirmSheet } from './ui.js';

export const KIND = 'grifo', CFG = 'setting-grifos', GERAL = 'Geral';
export const COLORS = [['w', 'vinho'], ['y', 'amarelo'], ['m', 'azul-petróleo']]; // grifos antigos (rosa, verde, azul claro) continuam aparecendo; só não entram mais na barra
const cfg = () => ({ folder: GERAL, folders: [], color: 'w', ...(store.get(CFG) ? store.get(CFG).data : {}) });
const setCfg = (p) => store.upsert('setting', CFG, p);
export const all = () => store.list(KIND);
const byDate = (a, b) => (b.data.created || 0) - (a.data.created || 0);
export const forSource = (src) => all().filter((r) => r.data.src === src);
/** Pastas: Geral primeiro, depois as criadas e as que algum grifo usa. */
export function folders() {
  const set = new Set(cfg().folders || []); for (const r of all()) if (r.data.folder) set.add(r.data.folder); set.delete(GERAL);
  return [GERAL, ...[...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}

/* ---------- pastas e edição ---------- */
function askName(title, initial = '', okLabel = 'Salvar') {
  return new Promise((resolve) => {
    let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
    sheet(title, (close) => {
      const inp = h('input', { type: 'text', maxlength: 40, value: initial, placeholder: 'nome da pasta', 'aria-label': 'Nome da pasta' });
      const go = () => { const v = inp.value.replace(/\s+/g, ' ').trim(); if (!v) return; finish(v); close(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => { inp.focus(); inp.select(); }, 50);
      return h('div', { class: 'sheet-body' }, inp, h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { finish(null); close(); } }, 'Cancelar'), h('button', { class: 'btn primary', type: 'button', onclick: go }, okLabel)));
    }, { onClose: () => finish(null) });
  });
}
export async function addFolder() {
  const n = await askName('Nova pasta de anotações', '', 'Criar'); if (!n) return null;
  const ex = folders().find((f) => f.toLowerCase() === n.toLowerCase()); if (ex) return ex;
  await setCfg({ folders: [...(cfg().folders || []), n] }); return n;
}
/** Escolhe a pasta (ou cria). Resolve com o nome ou null. */
export function pickFolder(title = 'Em qual pasta?', cur = '') {
  return new Promise((resolve) => {
    let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
    sheet(title, (close) => h('div', { class: 'sheet-body' }, h('div', { style: 'display:grid;gap:6px' },
      ...folders().map((f) => h('button', { class: `btn${f === cur ? '' : ' ghost'}`, type: 'button', onclick: () => { finish(f); close(); } }, icon('folder', 16), ` ${f}`)),
      h('button', { class: 'btn ghost', type: 'button', onclick: async () => { close(); finish(await addFolder()); } }, '+ nova pasta'))), { onClose: () => finish(null) });
  });
}
export async function renameFolder(old) {
  const n = await askName('Renomear pasta', old); if (!n || n === old) return null;
  if (folders().some((f) => f.toLowerCase() === n.toLowerCase() && f !== old)) { toast('já existe uma pasta com esse nome', { ms: 2200 }); return null; }
  await setCfg({ folders: (cfg().folders || []).filter((f) => f !== old).concat(n) });
  for (const r of all()) if (r.data.folder === old) await store.upsert(KIND, r.id, { folder: n });
  return n;
}
export async function deleteFolder(name) {
  const n = all().filter((r) => r.data.folder === name).length;
  if (!(await confirmSheet(`Apagar a pasta "${name}"?`, n ? `os ${n} grifo(s) continuam guardados, em "${GERAL}".` : 'a pasta está vazia.', 'Apagar pasta'))) return false;
  await setCfg({ folders: (cfg().folders || []).filter((f) => f !== name) });
  for (const r of all()) if (r.data.folder === name) await store.upsert(KIND, r.id, { folder: GERAL });
  return true;
}
export const moveTo = (ids, folder) => Promise.all(ids.map((id) => store.upsert(KIND, id, { folder })));
/** Remove o grifo (e os pedaços do mesmo grifo, quando pegou mais de um parágrafo). */
export async function removeGrifo(rec) {
  const group = rec.data.gid ? all().filter((r) => r.data.gid === rec.data.gid) : [rec];
  for (const r of group) await store.remove(r.id);
}

/* ---------- selecionar texto -> pedaços por parágrafo ---------- */
const BLOCK = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,dd,dt,summary,pre,figcaption';
const leafBlocks = (root) => [...root.querySelectorAll(BLOCK)].filter((b) => !b.querySelector(BLOCK));
function piecesOf(range, body) {
  const out = [];
  for (const b of leafBlocks(body)) {
    if (!range.intersectsNode(b)) continue;
    const r = range.cloneRange();
    if (!b.contains(range.startContainer)) r.setStart(b, 0);
    if (!b.contains(range.endContainer)) r.setEnd(b, b.childNodes.length);
    const pre = document.createRange(); pre.selectNodeContents(b); pre.setEnd(r.startContainer, r.startOffset);
    let start = pre.toString().length; let text = r.toString();
    const lead = text.length - text.trimStart().length; start += lead; text = text.trim();
    if (text.length < 2) continue;
    const full = b.textContent;
    out.push({ text, before: full.slice(Math.max(0, start - 24), start), after: full.slice(start + text.length, start + text.length + 24) });
  }
  return out;
}

/* ---------- pintar os grifos no texto ---------- */
function unwrap(body) { body.querySelectorAll('mark.hl').forEach((m) => m.replaceWith(...m.childNodes)); body.normalize(); }
function wrap(block, start, end, color, id) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT); const nodes = []; let pos = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) { const len = n.nodeValue.length; if (pos + len > start && pos < end) nodes.push({ n, from: Math.max(start - pos, 0), to: Math.min(end - pos, len) }); pos += len; }
  for (const { n, from, to } of nodes) { const r = document.createRange(); r.setStart(n, from); r.setEnd(n, to); const m = document.createElement('mark'); m.className = `hl hl-${color}`; m.dataset.hid = id; r.surroundContents(m); }
}
export function paint(body, src) {
  unwrap(body);
  const hs = forSource(src); if (!hs.length) return;
  const blocks = leafBlocks(body);
  for (const r of hs) {
    const d = r.data; let pick = null;
    for (const b of blocks) {
      const t = b.textContent; let from = 0;
      for (let i = t.indexOf(d.text, from); i >= 0; i = t.indexOf(d.text, from)) {
        const strict = t.slice(Math.max(0, i - (d.before || '').length), i) === (d.before || '');
        if (!pick || (strict && !pick.strict)) pick = { b, i, strict };
        if (strict) break; from = i + 1;
      }
      if (pick && pick.strict) break;
    }
    if (pick) { try { wrap(pick.b, pick.i, pick.i + d.text.length, d.color || 'y', r.id); } catch { /* trecho já cortado por outro grifo */ } }
  }
}

/* ---------- barra de grifar + toque no grifo ---------- */
/** host = elemento que contém .reader-body. getSource() -> { id, title, href }. Devolve { apply, off }. */
export function attach(host, getSource) {
  let pieces = []; let color = cfg().color;
  const bar = h('div', { class: 'hl-bar', hidden: true, role: 'toolbar', 'aria-label': 'Grifar trecho' });
  const folderBtn = h('button', { class: 'hl-folder', type: 'button' });
  const body = () => host.querySelector('.reader-body');
  const hide = () => { bar.hidden = true; pieces = []; };
  const drawBar = () => {
    folderBtn.textContent = `📁 ${cfg().folder}`; folderBtn.onclick = async () => { const f = await pickFolder('Guardar grifos em…', cfg().folder); if (f) { await setCfg({ folder: f }); drawBar(); } };
    bar.replaceChildren(h('span', { class: 'hl-lab' }, 'grifar'),
      ...COLORS.map(([c, name]) => h('button', { class: `hl-dot hl-${c}`, type: 'button', 'aria-label': `Grifar de ${name}`, onclick: () => save(c) })), folderBtn);
  };
  const save = async (c) => {
    const src = getSource(); const todo = pieces; if (!todo.length) return; color = c;
    const gid = `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; const t0 = Date.now(); const folder = cfg().folder;
    getSelection().removeAllRanges(); hide();
    for (let i = 0; i < todo.length; i++) await store.upsert(KIND, null, { src: src.id, srcTitle: src.title, href: src.href, text: todo[i].text, before: todo[i].before, after: todo[i].after, color: c, folder, gid: todo.length > 1 ? gid : null, created: t0 + i });
    setCfg({ color: c });
    toast(`grifado em ${folder} ✓`, { id: 'hl', ms: 3500, action: 'ver anotações', onAction: () => { location.hash = '#/anotacoes'; } });
  };
  const update = debounce(() => {
    const s = getSelection(); const b = body();
    if (!s || !s.rangeCount || s.isCollapsed || !b) { hide(); return; }
    const rg = s.getRangeAt(0); if (!b.contains(rg.startContainer) || !b.contains(rg.endContainer)) { hide(); return; }
    pieces = piecesOf(rg, b); if (!pieces.length) { hide(); return; }
    bar.hidden = false;
  }, 120);
  const keep = (e) => e.preventDefault(); // tocar na barra não pode desfazer a seleção
  bar.addEventListener('pointerdown', keep); bar.addEventListener('mousedown', keep); bar.addEventListener('touchstart', keep, { passive: false });
  document.addEventListener('selectionchange', update);
  const onTap = (e) => {
    const m = e.target.closest && e.target.closest('mark.hl'); if (!m || !host.contains(m)) return;
    const s = getSelection(); if (s && !s.isCollapsed) return;
    const rec = store.get(m.dataset.hid); if (rec) editSheet(rec);
  };
  host.addEventListener('click', onTap);
  drawBar(); document.body.append(bar);
  const apply = () => { const b = body(); if (b) paint(b, getSource().id); };
  const offStore = store.subscribe((i) => { if (!i.kind || i.kind === KIND || i.id === CFG) { drawBar(); apply(); } });
  return { apply, off: () => { document.removeEventListener('selectionchange', update); host.removeEventListener('click', onTap); offStore(); bar.remove(); } };
}

function editSheet(rec) {
  sheet('Grifo', (close) => {
    const d = rec.data; const colors = h('div', { class: 'hl-colors', role: 'radiogroup', 'aria-label': 'Cor' });
    const drawC = () => colors.replaceChildren(...COLORS.map(([c, name]) => h('button', { class: `hl-dot hl-${c}${(rec.data.color || 'y') === c ? ' on' : ''}`, type: 'button', role: 'radio', 'aria-checked': String((rec.data.color || 'y') === c), 'aria-label': name,
      onclick: async () => { const grp = d.gid ? all().filter((r) => r.data.gid === d.gid) : [rec]; for (const r of grp) await store.upsert(KIND, r.id, { color: c }); rec.data.color = c; drawC(); } })));
    drawC();
    return h('div', { class: 'sheet-body' }, h('blockquote', { class: 'hl-quote' }, d.text), h('p', { class: 'muted' }, `pasta: ${d.folder || GERAL}`), colors,
      h('div', { class: 'row' },
        h('button', { class: 'btn small', type: 'button', onclick: async () => { const f = await pickFolder('Mover grifo pra…', d.folder || GERAL); if (f) { const grp = d.gid ? all().filter((r) => r.data.gid === d.gid) : [rec]; await moveTo(grp.map((r) => r.id), f); close(); toast(`movido pra ${f} ✓`, { ms: 1800 }); } } }, '📁 mover'),
        h('a', { class: 'btn small ghost', href: '#/anotacoes', onclick: close }, 'ver anotações'),
        h('button', { class: 'btn small ghost danger-txt', type: 'button', onclick: async () => { close(); await removeGrifo(rec); toast('grifo removido', { ms: 1800 }); } }, 'tirar grifo')));
  });
}
