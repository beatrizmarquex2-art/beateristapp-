// Caixa de Ideias: anotar rápido (texto + etiqueta), com nota de voz opcional que fica SÓ neste aparelho
// (o áudio nunca sobe pra nuvem; o texto da ideia sincroniza como os outros registros). Aceita fotos e documentos anexados
// (guardados como em Meus Arquivos: no aparelho e na pasta privada da nuvem).
// Uma ideia pode virar conteúdo do Feed ou tarefa do Checklist com um toque.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import { db } from '../db.js';
import { banner, toast, confirmSheet, sheet, stars } from '../ui.js';
import * as files from '../files-sync.js';
import { kindOf, mb } from '../files-logic.js';
import { getMic, micToast } from '../mic-access.js';

const KIND = 'idea';
export const TAGS = [['musica', 'música'], ['aula', 'aula'], ['conteudo', 'conteúdo'], ['show', 'show'], ['negocio', 'negócio'], ['outra', 'outra']];
const tagName = (k) => (TAGS.find((t) => t[0] === k) || TAGS[5])[1];
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' }).format(new Date(ts));
const AUDIO = (id) => `audio:${id}`;

/* ---------- nota de voz (MediaRecorder, guardada no IndexedDB do aparelho) ---------- */
function recorder(onDone) {
  let rec = null, chunks = [], stream = null, t0 = 0, timer = 0;
  const btn = h('button', { class: 'btn small id-rec', type: 'button', 'aria-pressed': 'false' }, icon('mic', 16), ' gravar voz');
  const stopAll = () => { clearInterval(timer); if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; delete document.documentElement.dataset.mic; };
  btn.addEventListener('click', async () => {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    if (!window.MediaRecorder || !navigator.mediaDevices) { toast('este navegador não grava áudio. escreve a ideia mesmo :)'); return; }
    try { stream = await getMic({ plain: true }); } catch (e) { toast(micToast(e)); return; }
    document.documentElement.dataset.mic = 'on';
    chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => { stopAll(); btn.setAttribute('aria-pressed', 'false'); btn.replaceChildren(icon('mic', 16), ' gravar de novo'); const blob = new Blob(chunks, { type: rec.mimeType || 'audio/mp4' }); onDone(blob, Math.round((Date.now() - t0) / 1000)); };
    rec.start(); t0 = Date.now(); btn.setAttribute('aria-pressed', 'true');
    timer = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); btn.textContent = `■ parar (${s}s)`; if (s >= 180) rec.stop(); }, 250);
  });
  btn.cleanup = () => { if (rec && rec.state === 'recording') rec.stop(); stopAll(); };
  return btn;
}

export function ideaForm(close) {
  let tag = 'musica'; let audio = null;
  const text = h('textarea', { rows: 3, maxlength: 2000, placeholder: 'qual é a ideia? (groove, aula, vídeo, show…)', 'aria-label': 'Ideia' });
  const chips = h('div', { class: 'chips lib-tabs tp-chips id-tags' });
  const drawTags = () => chips.replaceChildren(...TAGS.map(([k, t]) => h('button', { type: 'button', class: `lib-tab${tag === k ? ' on' : ''}`, 'aria-pressed': String(tag === k), onclick: () => { tag = k; drawTags(); } }, t)));
  drawTags();
  const audioInfo = h('small', { class: 'muted' });
  const picked = []; const pickedBox = h('div', { class: 'id-picked' });
  const drawPicked = () => pickedBox.replaceChildren(...picked.map((f, i) => h('span', { class: 'id-chip' }, `${kindOf(f.name, f.type) === 'imagem' ? '🖼' : '📄'} ${f.name.length > 22 ? `${f.name.slice(0, 20)}…` : f.name} · ${mb(f.size)}`, h('button', { type: 'button', 'aria-label': `Tirar ${f.name}`, onclick: () => { picked.splice(i, 1); drawPicked(); } }, '×'))));
  const addFiles = (list) => { for (const f of list) { if (f.size > files.MAX_MB * 1048576) { toast(`${f.name} passa de ${files.MAX_MB} MB.`); continue; } picked.push(f); } drawPicked(); };
  const picker = (label, ico, accept) => { const inp = h('input', { type: 'file', multiple: true, accept, hidden: true, onchange: () => { addFiles([...inp.files]); inp.value = ''; } }); return [h('button', { class: 'btn small', type: 'button', onclick: () => inp.click() }, icon(ico, 16), ` ${label}`), inp]; };
  const rec = recorder((blob, secs) => { audio = blob; audioInfo.textContent = `voz gravada (${secs}s) · fica só neste aparelho`; });
  const save = async (e) => {
    const btn = e.currentTarget;
    if (!text.value.trim() && !audio && !picked.length) { toast('escreve, grava ou anexa alguma coisa.'); return; }
    let audioId = null;
    if (audio) { audioId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; await db.metaSet(AUDIO(audioId), audio); }
    const attach = [];
    for (const f of picked) { const id = await files.saveFile(f); attach.push({ id, name: f.name, kind: kindOf(f.name, f.type), size: f.size }); }
    await store.upsert(KIND, null, { text: text.value.trim() || (attach.length ? '(anexo)' : '(nota de voz)'), tag, star: false, archived: false, audioId, files: attach, created: Date.now() });
    picked.length = 0; drawPicked();
    rec.cleanup(); stars(btn); toast('ideia guardada ✓'); close && close();
  };
  const el = h('div', { class: 'sheet-body id-form' }, text, chips, h('div', { class: 'row between' }, rec, audioInfo), h('div', { class: 'row id-attach' }, ...picker('foto', 'photo', 'image/*'), ...picker('documento', 'folder', '.pdf,.doc,.docx,.txt,.md,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,.pages,.key,.zip,.epub,application/pdf,image/*')), pickedBox, h('button', { class: 'btn primary', type: 'button', onclick: save }, 'guardar ideia'));
  el.cleanup = rec.cleanup;
  return el;
}

function card(r, redraw) {
  const d = r.data; const audioBox = h('div');
  if (d.audioId) db.metaGet(AUDIO(d.audioId)).then((b) => audioBox.replaceChildren(b ? h('audio', { controls: true, src: URL.createObjectURL(b), preload: 'none' }) : h('small', { class: 'muted' }, 'nota de voz gravada em outro aparelho')));
  const fileBox = h('div', { class: 'id-files' });
  for (const f of d.files || []) {
    if (f.kind === 'imagem') { const im = h('img', { class: 'id-img', alt: f.name, loading: 'lazy' }); files.getBlob(f.id).then((b) => { if (b) im.src = URL.createObjectURL(b); }); im.addEventListener('click', async () => { const u = await files.openUrl(f.id); if (u) window.open(u, '_blank', 'noopener'); }); fileBox.append(im); }
    else fileBox.append(h('button', { class: 'btn small ghost id-doc', type: 'button', onclick: async () => { const u = await files.openUrl(f.id); if (u) window.open(u, '_blank', 'noopener'); else toast('não achei o arquivo.'); } }, `📄 ${f.name.length > 26 ? `${f.name.slice(0, 24)}…` : f.name}`));
  }
  const starBtn = h('button', { class: `icon-btn${d.star ? ' on' : ''}`, type: 'button', 'aria-pressed': String(!!d.star), 'aria-label': d.star ? 'Tirar destaque' : 'Destacar ideia', onclick: () => store.upsert(KIND, r.id, { star: !d.star }) }, icon('star', 18));
  const delBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Apagar ideia', onclick: async () => { if (await confirmSheet('Apagar ideia?', d.text.slice(0, 80), 'Apagar')) { for (const f of d.files || []) await files.remove(f.id).catch(() => {}); if (d.audioId) await db.metaDel(AUDIO(d.audioId)); await store.remove(r.id); } } }, icon('trash', 18));
  const toPost = h('button', { class: 'btn small', type: 'button', onclick: async () => { await store.upsert('post', null, { title: d.text.slice(0, 100), stage: 'ideia', brand: 'Beaterista', script: d.text, caption: '', hashtags: '', captions: {}, targets: [], status: {}, created: Date.now() }); await store.upsert(KIND, r.id, { archived: true, became: 'conteúdo' }); toast('virou ideia no Feed ✓', { action: 'abrir', onAction: () => { location.hash = '#/feed'; } }); } }, '→ conteúdo');
  const toTask = h('button', { class: 'btn small', type: 'button', onclick: async () => { await store.upsert('task', null, { title: d.text.slice(0, 140), label: 'Pessoal', recur: 'none', time: '', day: todayKey(), done: false, doneDates: [], order: Date.now() }); await store.upsert(KIND, r.id, { archived: true, became: 'tarefa' }); toast('virou tarefa de hoje ✓', { action: 'abrir', onAction: () => { location.hash = '#/checklist'; } }); } }, '→ tarefa');
  const arch = h('button', { class: 'btn small ghost', type: 'button', onclick: () => store.upsert(KIND, r.id, { archived: !d.archived }) }, d.archived ? 'voltar' : 'arquivar');
  // quem já virou conteúdo/tarefa não mostra os atalhos de novo
  return h('article', { class: `card id-card${d.star ? ' star' : ''}${d.archived ? ' arch' : ''}` },
    h('div', { class: 'id-head' }, h('span', { class: `id-tag t-${d.tag}` }, tagName(d.tag)), h('small', { class: 'muted' }, when(d.created || r.updated_at)), starBtn, delBtn),
    h('p', { class: 'id-text' }, d.text), fileBox, audioBox,
    h('div', { class: 'id-act' }, ...(d.became ? [h('small', { class: 'muted' }, `virou ${d.became}`)] : [toPost, toTask]), arch));
}

export function mount(host) {
  let filter = ''; let q = '';
  const form = ideaForm(null);
  const chips = h('div', { class: 'chips lib-tabs id-filter' });
  const search = h('input', { type: 'search', placeholder: 'buscar ideia…', 'aria-label': 'Buscar ideia' });
  const list = h('div', { class: 'id-list' });
  const draw = () => {
    const all = store.list(KIND);
    chips.replaceChildren(...[['', `todas (${all.filter((r) => !r.data.archived).length})`], ['star', '★ destaque'], ...TAGS.map(([k, t]) => [k, t]), ['arch', 'arquivadas']].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${filter === k ? ' on' : ''}`, 'aria-pressed': String(filter === k), onclick: () => { filter = k; draw(); } }, t)));
    const shown = all.filter((r) => (filter === 'arch' ? r.data.archived : !r.data.archived) && (!filter || filter === 'arch' || (filter === 'star' ? r.data.star : r.data.tag === filter)) && (!q || r.data.text.toLowerCase().includes(q)))
      .sort((a, b) => (b.data.star ? 1 : 0) - (a.data.star ? 1 : 0) || (b.data.created || 0) - (a.data.created || 0));
    list.replaceChildren(...(shown.length ? shown.map((r) => card(r, draw)) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, filter === 'arch' ? 'nada arquivado.' : 'nenhuma ideia aqui ainda.'))]));
  };
  // depois de guardar, limpa o formulário
  const off0 = store.subscribe((i) => { if (i.kind === KIND && form.isConnected) { form.querySelector('textarea').value = ''; } });
  search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); draw(); });
  host.append(banner('Caixa de Ideias', 'anota antes que fuja'), h('section', { class: 'card pad' }, form), chips, h('div', { class: 'pad-x' }, search), list,
    h('p', { class: 'pad-x lib-note' }, 'o texto da ideia sincroniza com a sua conta. a nota de voz fica só neste aparelho (nunca sobe pra internet). fotos e documentos anexados ficam guardados na sua pasta privada.'));
  draw();
  const off = store.subscribe((i) => { if (!i.kind || i.kind === KIND) draw(); });
  return () => { off(); off0(); form.cleanup && form.cleanup(); };
}

export function openIdea() { sheet('Nova ideia', (close) => ideaForm(close)); }
