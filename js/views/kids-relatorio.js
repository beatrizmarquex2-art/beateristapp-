// Aba "Relatório" do Kids: o relatório vem montado por partes; você liga/desliga o que vai pro PDF e edita tudo aqui dentro.
// As edições ficam guardadas por criança. Nada sai do aparelho até você baixar/compartilhar.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as P from '../kids/progress.js';
import { buildSections, downloadReport } from '../kids/report.js';
import { toast, confirmSheet } from '../ui.js';

const KIND = 'kidsreport';
const idOf = (pid) => `kidsreport-${pid}`;
const saved = (pid) => { const r = store.get(idOf(pid)); return r && Array.isArray(r.data.sections) ? r.data.sections : null; };

export function relatorioScreen(host, topBar) {
  const profs = P.profiles();
  if (!profs.length) { host.append(topBar('#/kids'), h('h1', { class: 'kx-pix kx-pagetitle' }, 'Relatório'), h('p', { class: 'lib-note' }, 'crie um jogador no Kids primeiro; o relatório sai do progresso dele.')); return () => {}; }
  let me = P.active() || profs[0];
  let sections = saved(me.id) || buildSections(me);
  const persist = () => store.upsert(KIND, idOf(me.id), { sections });
  const body = h('div', { class: 'pad-x', style: 'display:grid;gap:10px' });

  const textCell = (get, set, multiline) => { const el = h('div', { contenteditable: 'plaintext-only', role: 'textbox', 'aria-multiline': String(!!multiline), spellcheck: 'false' }, get()); el.addEventListener('blur', () => set(el.textContent)); return el; };
  const textEl = (s, b) => { const t = h('textarea', { rows: Math.min(8, Math.max(2, String(b.text || '').split('\n').length + 1)), maxlength: 4000, 'aria-label': `Texto de ${s.title}`, placeholder: 'escreva aqui…' }); t.value = b.text || ''; t.addEventListener('change', () => { b.text = t.value; persist(); }); return t; };
  const tableEl = (b) => {
    const addRow = h('button', { class: 'btn small', type: 'button', onclick: () => { b.rows.push(b.cols.map(() => '')); persist(); draw(); } }, '+ linha');
    const rows = b.rows.map((r, ri) => h('tr', {}, ...r.map((c, ci) => h('td', {}, c && typeof c === 'object' ? '🖼' : textCell(() => (c == null ? '' : String(c)), (v) => { r[ci] = v; persist(); }))),
      h('td', {}, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Tirar linha', onclick: () => { b.rows.splice(ri, 1); persist(); draw(); } }, icon('trash', 14)))));
    return h('div', { style: 'overflow-x:auto' }, h('table', { class: 'rel-tbl' }, h('thead', {}, h('tr', {}, ...b.cols.map((c) => h('th', {}, c.label)), h('th', {}))), h('tbody', {}, ...rows)), addRow);
  };
  const draw = () => {
    const sel = h('select', { 'aria-label': 'Criança', onchange: (e) => { me = profs.find((p) => p.id === e.target.value); sections = saved(me.id) || buildSections(me); draw(); } }, ...profs.map((p) => h('option', { value: p.id, selected: p.id === me.id }, p.name)));
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= sections.length) return; [sections[i], sections[j]] = [sections[j], sections[i]]; persist(); draw(); };
    body.replaceChildren(
      h('div', { class: 'row between', style: 'gap:8px;flex-wrap:wrap' }, sel,
        h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await confirmSheet('Refazer a partir dos jogos?', 'as suas edições deste relatório serão trocadas pelo que o progresso atual mostra.', 'Refazer')) { sections = buildSections(me); await persist(); draw(); } } }, 'refazer do zero')),
      h('p', { class: 'muted' }, 'marque o que vai pro PDF e edite o texto e as tabelas direto aqui (toque no que quiser mudar).'),
      ...sections.map((s, i) => h('section', { class: `rel-sec${s.on === false ? ' off' : ''}` },
        h('div', { class: 'rel-head' },
          h('input', { type: 'checkbox', checked: s.on !== false, 'aria-label': `Incluir “${s.title}” no PDF`, onchange: (e) => { s.on = e.target.checked; persist(); draw(); } }),
          h('input', { type: 'text', value: s.title, maxlength: 60, 'aria-label': 'Título da parte', onchange: (e) => { s.title = e.target.value; persist(); } }),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Subir parte', disabled: i === 0, onclick: () => move(i, -1) }, icon('up', 16)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Descer parte', disabled: i === sections.length - 1, onclick: () => move(i, 1) }, icon('down', 16)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Tirar parte', onclick: () => { sections.splice(i, 1); persist(); draw(); } }, icon('trash', 16))),
        ...(s.on === false ? [] : [...s.blocks.map((b) => (b.t === 'text' ? textEl(s, b) : tableEl(b))),
          h('button', { class: 'btn small', type: 'button', onclick: () => { s.blocks.push({ t: 'text', text: '', size: 26 }); persist(); draw(); } }, '+ texto')]))),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { sections.push({ id: `x${Date.now().toString(36)}`, title: 'Nova parte', on: true, blocks: [{ t: 'text', text: '', size: 26 }] }); persist(); draw(); } }, '+ nova parte'),
      h('button', { class: 'btn primary wide', type: 'button', onclick: async (e) => {
        const b = e.currentTarget; b.disabled = true; b.textContent = 'gerando…';
        try { const r = await downloadReport(me, sections); toast(r.shared ? 'PDF pronto ✓' : `baixado: ${r.name}`, { id: 'kx-pdf', ms: 2800 }); } catch (err) { toast(`não consegui gerar: ${err.message || 'erro'}`, { id: 'kx-pdf', ms: 4000 }); }
        b.disabled = false; b.textContent = 'gerar PDF timbrado';
      } }, 'gerar PDF timbrado'));
  };
  host.append(topBar('#/kids'), h('h1', { class: 'kx-pix kx-pagetitle' }, 'Relatório'), body);
  draw();
  return () => {};
}
