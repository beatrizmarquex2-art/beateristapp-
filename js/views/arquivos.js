// Meus Arquivos: pastas pra qualquer arquivo (PDF, foto, áudio, vídeo, documento, partitura).
// O arquivo fica no aparelho e numa pasta PRIVADA da nuvem (bucket "arquivos"); o registro "file" guarda nome, pasta e tamanho.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as files from '../files-sync.js';
import { KINDS, kindOf, previewable, folderList, inFolder, search, nameTaken, mb, extOf, DEFAULT_FOLDERS, GERAL } from '../files-logic.js';
import { banner, toast, confirmSheet, sheet } from '../ui.js';
import { buildPdf, savePdf } from '../folder-pdf.js';
import { fileName } from '../pdf.js';

const FILE = 'file', FOLDER = 'folder';
const KIND_ICON = { pdf: 'book', imagem: 'photo', audio: 'mic', video: 'photo', partitura: 'staff', doc: 'note', planilha: 'check', outro: 'folder' };
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' }).format(new Date(ts));
const SEL = { on: false, ids: [], redraw: () => {} }; // modo "selecionar": a ordem dos toques vira a ordem das páginas do PDF
const toggle = (id) => { const i = SEL.ids.indexOf(id); if (i >= 0) SEL.ids.splice(i, 1); else SEL.ids.push(id); SEL.redraw(); };
const put = (el, ...kids) => el.replaceChildren(...kids.filter(Boolean)); // replaceChildren(null) escreveria "null"
const field = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);

// pastas iniciais com id fixo: dois aparelhos criando ao mesmo tempo não duplicam, e pasta apagada não volta
async function ensureDefaults() {
  if (store.allRaw().some((r) => r.kind === FOLDER || r.kind === FILE)) return;
  for (const name of DEFAULT_FOLDERS) await store.upsert(FOLDER, `folder-${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}`, { name });
}

function pick(folder) {
  const input = h('input', { type: 'file', multiple: true, style: { display: 'none' } });
  document.body.append(input);
  input.addEventListener('change', async () => {
    const list = [...input.files]; input.remove(); let ok = 0;
    for (const f of list) {
      if (f.size > files.MAX_MB * 1048576) { toast(`${f.name}: passa de ${files.MAX_MB} MB, não cabe na nuvem grátis`); continue; }
      toast(`guardando ${f.name}…`, { id: 'arq', ms: 60000 });
      const fileId = await files.saveFile(f);
      await store.upsert(FILE, null, { name: f.name, folder, fileId, mime: f.type || '', kind: kindOf(f.name, f.type), size: f.size, created: Date.now() });
      ok++;
    }
    if (ok) toast(ok === 1 ? 'arquivo guardado ✓' : `${ok} arquivos guardados ✓`, { id: 'arq', ms: 1800 });
  });
  input.click();
}

async function open(r) {
  const k = r.data.kind || kindOf(r.data.name, r.data.mime);
  if (previewable(k)) {
    sheet(r.data.name, () => {
      const box = h('div', { class: 'ar-preview' }, h('p', { class: 'muted' }, 'abrindo…'));
      files.getBlob(r.data.fileId).then((b) => {
        if (!b) { box.replaceChildren(h('p', { class: 'muted' }, 'esse arquivo ainda não chegou neste aparelho. abre com internet.')); return; }
        const u = URL.createObjectURL(b);
        box.replaceChildren(k === 'imagem' ? h('img', { src: u, alt: r.data.name }) : h(k === 'audio' ? 'audio' : 'video', { src: u, controls: true, playsinline: true }),
          h('a', { class: 'btn small', href: u, download: r.data.name }, icon('down', 16), ' baixar'));
      });
      return h('div', { class: 'sheet-body' }, box);
    });
    return;
  }
  const w = window.open('', '_blank'); // abre já no toque (senão o iPhone bloqueia a janela)
  const u = await files.openUrl(r.data.fileId);
  if (!u) { w && w.close(); toast('esse arquivo ainda não chegou neste aparelho. abre com internet.'); return; }
  if (w) w.location.href = u; else location.href = u;
}

function actions(r) {
  sheet(r.data.name, (close) => {
    const name = h('input', { type: 'text', maxlength: 120, value: r.data.name, 'aria-label': 'Nome do arquivo' });
    const folders = folderList(store.list(FOLDER), []);
    const sel = h('select', { 'aria-label': 'Pasta' }, ...folders.map((f) => h('option', { value: f.id, selected: (r.data.folder || GERAL) === f.id }, f.name)));
    const save = async () => {
      let n = name.value.trim() || r.data.name; const e = extOf(r.data.name);
      if (e && !extOf(n)) n += `.${e}`; // não perde a extensão ao renomear
      await store.upsert(FILE, r.id, { name: n, folder: sel.value }); close(); toast('salvo ✓', { ms: 1300 });
    };
    const del = async () => { close(); if (await confirmSheet('Apagar arquivo?', r.data.name, 'Apagar')) { await files.remove(r.data.fileId); await store.remove(r.id); } };
    return h('div', { class: 'sheet-body' }, field('nome', name), field('pasta', sel),
      h('button', { class: 'btn primary', type: 'button', onclick: save }, 'salvar'),
      h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: del }, icon('trash', 16), ' apagar arquivo'));
  });
}

function folderSheet(f) {
  sheet(f ? 'Pasta' : 'Nova pasta', (close) => {
    const name = h('input', { type: 'text', maxlength: 40, value: f ? f.data.name : '', placeholder: 'ex.: Shows 2026', 'aria-label': 'Nome da pasta' });
    const save = async () => {
      const n = name.value.trim(); if (!n) return;
      if ((!f || n !== f.data.name) && nameTaken(store.list(FOLDER), n)) { toast('já existe uma pasta com esse nome'); return; }
      const rec = await store.upsert(FOLDER, f ? f.id : null, { name: n }); close();
      if (!f) location.hash = `#/arquivos/${rec.id}`;
    };
    const del = async () => {
      const n = inFolder(store.list(FOLDER), store.list(FILE), f.id).length; close();
      if (!(await confirmSheet('Apagar pasta?', n ? `os ${n} arquivo(s) dela vão pra “Geral”.` : f.data.name, 'Apagar'))) return;
      for (const r of store.list(FILE)) if (r.data.folder === f.id) await store.upsert(FILE, r.id, { folder: GERAL });
      await store.remove(f.id); location.hash = '#/arquivos';
    };
    return h('div', { class: 'sheet-body' }, field('nome da pasta', name), h('button', { class: 'btn primary', type: 'button', onclick: save }, f ? 'salvar' : 'criar pasta'),
      f ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: del }, icon('trash', 16), ' apagar pasta') : null);
  });
}

function selectBar(list, folderName) {
  const byId = new Map(list.map((r) => [r.id, r]));
  const go = async (e) => {
    const picked = SEL.ids.map((id) => byId.get(id)).filter(Boolean); if (!picked.length) { toast('toca nos itens pra escolher a ordem das páginas', { ms: 2500 }); return; }
    const btn = e.currentTarget; btn.disabled = true; toast('montando o PDF…', { id: 'ar-pdf', ms: 60000 });
    try {
      const date = new Date().toISOString().slice(0, 10).split('-').reverse().join('-');
      const name = fileName(folderName, '', date) + '.pdf';
      const { pdf, pages, skipped } = await buildPdf(picked, folderName);
      if (!pdf) { toast(skipped ? 'só consigo juntar imagens e exercícios por enquanto (PDF enviado ainda não entra).' : 'nada pra juntar', { id: 'ar-pdf', ms: 4500 }); btn.disabled = false; return; }
      await savePdf(pdf, name);
      toast(`PDF com ${pages} página(s) pronto ✓${skipped ? ` · ${skipped} item(ns) ficaram de fora (só imagens entram)` : ''}`, { id: 'ar-pdf', ms: 5000 });
    } catch (err) { toast(`não consegui gerar o PDF: ${err.message || 'erro'}`, { id: 'ar-pdf', ms: 4000 }); }
    btn.disabled = false;
  };
  return h('div', { class: 'pad-x ar-selbar' }, h('b', {}, `${SEL.ids.length} selecionado(s)`), h('small', { class: 'muted' }, ' · a ordem dos toques é a ordem das páginas'),
    h('button', { class: 'btn primary', type: 'button', onclick: go }, 'juntar em PDF'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { SEL.ids = list.filter((r) => (r.data.kind || '') === 'imagem').sort((a, b) => (a.data.created || 0) - (b.data.created || 0)).map((r) => r.id); draw0(); } }, 'marcar todas as imagens'));
}
const draw0 = () => SEL.redraw();
function row(r) {
  const k = r.data.kind || kindOf(r.data.name, r.data.mime);
  const cloud = h('small', { class: 'muted' });
  files.isUp(r.data.fileId).then((up) => { cloud.textContent = up ? ' · nuvem ✓' : ' · só aqui'; });
  const nth = SEL.ids.indexOf(r.id) + 1;
  return h('li', { class: `ar-file k-${k}${SEL.on && nth ? ' picked' : ''}` },
    h('button', { class: 'ar-open', type: 'button', 'aria-label': SEL.on ? `Selecionar ${r.data.name}` : `Abrir ${r.data.name}`, onclick: () => (SEL.on ? toggle(r.id) : open(r)) },
      h('span', { class: 'ar-ico' }, SEL.on ? h('b', { class: `ar-pick${nth ? ' on' : ''}` }, nth ? String(nth) : '') : icon(KIND_ICON[k] || 'folder', 20)),
      h('span', { class: 'ar-name' }, h('b', {}, r.data.name), h('small', { class: 'muted' }, `${KINDS[k]} · ${mb(r.data.size || 0)} · ${when(r.data.created || r.updated_at)}`, cloud))),
    SEL.on ? null : h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Opções de ${r.data.name}`, onclick: () => actions(r) }, icon('edit', 18)));
}

export function mount(host, parts = []) {
  const folderId = parts[0] || null; let q = '';
  SEL.on = false; SEL.ids = [];
  ensureDefaults();
  const body = h('div', { class: 'ar-body' });
  const searchEl = h('input', { type: 'search', placeholder: 'buscar em todos os arquivos…', 'aria-label': 'Buscar arquivo' });
  const draw = () => {
    const folders = store.list(FOLDER), all = store.list(FILE);
    const sortNew = (a, b) => (b.data.created || 0) - (a.data.created || 0);
    if (q) {
      const found = search(all, q).sort(sortNew);
      body.replaceChildren(h('p', { class: 'pad-x muted' }, `${found.length} encontrado(s)`), h('ul', { class: 'ar-list' }, ...found.map(row)));
      return;
    }
    if (!folderId) {
      const recent = [...all].sort(sortNew).slice(0, 4);
      put(body,
        h('div', { class: 'ar-grid' }, ...folderList(folders, all).map((f) => h('a', { class: 'ar-folder', href: `#/arquivos/${f.id}` }, icon('folder', 26), h('b', {}, f.name), h('small', { class: 'muted' }, f.n === 1 ? '1 arquivo' : `${f.n} arquivos`))),
          h('button', { class: 'ar-folder ar-new', type: 'button', onclick: () => folderSheet(null) }, icon('plus', 26), h('b', {}, 'nova pasta'))),
        recent.length ? h('h3', { class: 'pad-x ar-h' }, 'mais recentes') : null, recent.length ? h('ul', { class: 'ar-list' }, ...recent.map(row)) : null);
      return;
    }
    const f = folders.find((x) => x.id === folderId);
    if (folderId !== GERAL && !f) { body.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'essa pasta não existe mais.'), h('a', { class: 'btn', href: '#/arquivos' }, 'ver pastas'))); return; }
    const list = inFolder(folders, all, folderId).sort(sortNew);
    body.replaceChildren(
      h('div', { class: 'row between pad-x ar-top' }, h('a', { class: 'btn small ghost', href: '#/arquivos' }, '‹ pastas'), h('h2', { class: 'ar-title' }, f ? f.data.name : 'Geral'),
        f ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Renomear ou apagar pasta', onclick: () => folderSheet(f) }, icon('edit', 18)) : h('span')),
      h('div', { class: 'pad-x row ar-tools' }, SEL.on ? null : h('button', { class: 'btn primary ar-add', type: 'button', onclick: () => pick(folderId) }, icon('plus', 18), ' enviar arquivos'),
        list.length ? h('button', { class: 'btn', type: 'button', 'aria-pressed': String(SEL.on), onclick: () => { SEL.on = !SEL.on; SEL.ids = []; draw(); } }, SEL.on ? 'cancelar seleção' : '☑ selecionar pra PDF') : null),
      SEL.on ? selectBar(list, f ? f.data.name : 'Geral') : null,
      list.length ? h('ul', { class: 'ar-list' }, ...list.map(row)) : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'pasta vazia.'), h('p', { class: 'muted' }, 'pdf, foto, áudio, vídeo curto, documento… até 50 MB cada.')));
  };
  SEL.redraw = draw;
  searchEl.addEventListener('input', () => { q = searchEl.value; draw(); });
  host.append(banner('Meus Arquivos', 'tudo num lugar só'), h('div', { class: 'pad-x' }, searchEl), body,
    h('p', { class: 'pad-x lib-note' }, `até ${files.MAX_MB} MB por arquivo. fica numa pasta privada da sua nuvem (só você abre) e uma cópia neste aparelho.`));
  draw(); files.pushPending();
  return store.subscribe((i) => { if (!i.kind || i.kind === FILE || i.kind === FOLDER) draw(); });
}
