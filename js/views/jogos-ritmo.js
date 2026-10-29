// Jogos de ritmo: o pacote "beater rhythm games" (assets/rhythm-games/) montado dentro do app.
// O pacote é um script clássico que expõe window.BeaterRhythm; carregamos css + js uma vez só e
// chamamos mount/unmount a cada entrada/saída da tela. XP dos jogos vai pro registro "setting-xp".
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, toast, confirmSheet, sheet } from '../ui.js';
import { parseMidi } from '../midi.js';
import { toChart, nameFromFile } from '../midi-chart.js';
import { readZip, writeZip } from '../zip.js';
import * as FB from '../feedback.js';
import * as RK from '../ranking.js';

const BASE = 'assets/rhythm-games/';
const XP = 'setting-xp';
const HALL = 'setting-ritmo-hall'; // ranking estilo fliperama: { boards: { 'jogo|instrumento|dificuldade|musica': [{ name, score, acc, grade, at }] } }
const FOLDERS = 'setting-midi-folders'; // pastas criadas (inclusive as vazias); a pasta de cada música fica em data.folder
const KIND = 'midisong';
const MAX = 2 * 1024 * 1024; // MIDI maior que isso não é música, é susto
let loading = null;

/* ---------- MIDIs importados (privados: registro "midisong" com o arquivo em base64) ---------- */
const toB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
const cache = new Map();
/** As fases das músicas importadas (converte uma vez por sessão). */
export function importedSongs() {
  const out = [];
  for (const r of store.list(KIND)) {
    const k = `${r.id}|${r.updated_at}`;
    if (!cache.has(k)) { try { cache.set(k, toChart(parseMidi(fromB64(r.data.b64)), r.data.name).song); } catch { cache.set(k, null); } }
    const sg = cache.get(k); if (sg) out.push({ ...sg, id: r.id, name: r.data.name, folder: r.data.folder || '', trim: r.data.trim && r.data.trim.b > r.data.trim.a ? r.data.trim : null, hid: 1 });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
/** Importa arquivos .mid/.midi/.kar (soltos ou dentro de .zip). Devolve { ok:[{name, drums, melody}], bad:[{name, why}] }. */
export async function importMidis(files) {
  const items = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) { for (const e of await readZip(await f.arrayBuffer())) if (/\.(mid|midi|kar)$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name)) { const pp = e.name.split('/'); items.push({ name: e.name, folder: pp.length > 1 ? pp[pp.length - 2] : '', read: async () => new Uint8Array(await e.read()) }); } }
    else if (/\.(mid|midi|kar)$/i.test(f.name)) items.push({ name: f.name, read: async () => new Uint8Array(await f.arrayBuffer()) });
  }
  const ok = [], bad = [];
  for (const it of items) {
    const name = nameFromFile(it.name);
    try {
      const bytes = await it.read(); if (bytes.length > MAX) throw new Error('arquivo grande demais');
      const { song, report } = toChart(parseMidi(bytes), name);
      await store.upsert(KIND, `midi-${song.id.slice(4)}`, { name, file: it.name.split('/').pop(), b64: toB64(bytes), size: bytes.length, bpm: report.bpm, drums: report.drums, melody: report.melody, seconds: report.seconds, added: Date.now(), ...(it.folder ? { folder: it.folder } : {}) });
      if (it.folder && !folderNames().includes(it.folder)) await store.upsert('setting', FOLDERS, { list: [...folderNames(), it.folder] });
      ok.push({ name, ...report });
    } catch (e) { bad.push({ name, why: e.message || 'não consegui ler' }); }
  }
  return { ok, bad };
}

/** Nomes das pastas: as criadas + as que alguma música usa (assim uma pasta nunca "some"). */
export function folderNames() {
  const set = new Set(store.get(FOLDERS) ? store.get(FOLDERS).data.list || [] : []);
  for (const r of store.list(KIND)) if (r.data.folder) set.add(r.data.folder);
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
const cleanName = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
/** Pergunta um texto numa folha (celular-friendly). Resolve com o texto ou null se cancelar. */
function askText(title, label, initial = '', okLabel = 'Salvar') {
  return new Promise((resolve) => {
    let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
    sheet(title, (close) => {
      const inp = h('input', { class: 'field', type: 'text', value: initial, maxlength: 60, 'aria-label': label, placeholder: label });
      const go = () => { const v = cleanName(inp.value); if (!v) return; finish(v); close(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => { inp.focus(); inp.select(); }, 50);
      return h('div', { class: 'sheet-body' }, inp, h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { finish(null); close(); } }, 'Cancelar'),
        h('button', { class: 'btn primary', type: 'button', onclick: go }, okLabel)));
    }, { onClose: () => finish(null) });
  });
}
export async function renameSong(id) {
  const r = store.get(id); if (!r) return;
  const name = await askText('Renomear música', 'novo nome', r.data.name);
  if (name && name !== r.data.name) { await store.upsert(KIND, id, { name }); toast('renomeada ✓', { id: 'rg-ren', ms: 1800 }); }
}
export async function addFolder() {
  const name = await askText('Nova pasta', 'nome da pasta', '', 'Criar');
  if (!name) return null;
  const list = folderNames();
  if (list.some((f) => f.toLowerCase() === name.toLowerCase())) { toast('essa pasta já existe', { id: 'rg-fold', ms: 2200 }); return list.find((f) => f.toLowerCase() === name.toLowerCase()); }
  await store.upsert('setting', FOLDERS, { list: [...list, name] });
  toast(`pasta "${name}" criada ✓`, { id: 'rg-fold', ms: 2200 });
  return name;
}
/** Folha pra escolher a pasta (ou criar uma na hora). Resolve com o nome ('' = sem pasta) ou null se cancelar. */
function pickFolder(title, cur = '') {
  return new Promise((resolve) => {
    let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
    sheet(title, (close) => {
      const opt = (label, folder, on) => h('button', { class: `btn${on ? '' : ' ghost'}`, type: 'button', onclick: () => { finish(folder); close(); } }, label);
      return h('div', { class: 'sheet-body' }, h('div', { style: 'display:grid;gap:6px' },
        opt('sem pasta', '', !cur), ...folderNames().map((f) => opt(`📁 ${f}`, f, f === cur)),
        h('button', { class: 'btn ghost', type: 'button', onclick: async () => { close(); finish(await addFolder()); } }, '+ nova pasta')));
    }, { onClose: () => finish(null) });
  });
}
export async function moveSong(id) {
  const r = store.get(id); if (!r) return;
  const folder = await pickFolder(`Pasta de "${r.data.name}"`, r.data.folder || '');
  if (folder === null) return;
  await store.upsert(KIND, id, { folder }); toast(folder ? `na pasta ${folder} ✓` : 'sem pasta ✓', { id: 'rg-mov', ms: 1800 });
}
/** Move várias de uma vez. done(true) se moveu (a tela sai do modo seleção). */
export async function moveMany(ids, done) {
  const folder = await pickFolder(`Mover ${ids.length} música(s) pra…`);
  if (folder === null) return;
  toast(`movendo ${ids.length}…`, { id: 'rg-mov', ms: 30000 });
  for (const id of ids) if (store.get(id)) await store.upsert(KIND, id, { folder });
  toast(`${ids.length} música(s) ${folder ? `na pasta ${folder}` : 'sem pasta'} ✓`, { id: 'rg-mov', ms: 2500 }); done(true);
}
export async function renameFolder(old, done) {
  const name = await askText('Renomear pasta', 'novo nome da pasta', old);
  if (!name || name === old) return;
  const clash = folderNames().find((f) => f.toLowerCase() === name.toLowerCase() && f !== old);
  if (clash) { toast(`já existe a pasta "${clash}"`, { id: 'rg-fold', ms: 2500 }); return; }
  await store.upsert('setting', FOLDERS, { list: folderNames().map((f) => (f === old ? name : f)) });
  for (const r of store.list(KIND)) if (r.data.folder === old) await store.upsert(KIND, r.id, { folder: name });
  toast('pasta renomeada ✓', { id: 'rg-fold', ms: 2000 }); done(name);
}
/** Apaga a pasta; as músicas dela NÃO são apagadas, só ficam sem pasta. */
export async function deleteFolder(name, done) {
  const n = store.list(KIND).filter((r) => r.data.folder === name).length;
  if (!(await confirmSheet(`Apagar a pasta "${name}"?`, n ? `as ${n} música(s) dentro dela continuam no app, só ficam sem pasta.` : 'a pasta está vazia.', 'Apagar pasta'))) return;
  await store.upsert('setting', FOLDERS, { list: folderNames().filter((f) => f !== name) });
  for (const r of store.list(KIND)) if (r.data.folder === name) await store.upsert(KIND, r.id, { folder: '' });
  toast('pasta apagada ✓', { id: 'rg-fold', ms: 2000 }); done(true);
}

/** Baixa todas as músicas importadas num .zip (as pastas viram pastas do zip; serve de backup e pra importar nos outros sites). */
export function exportAll() {
  const used = new Set(); const files = [];
  for (const r of store.list(KIND).sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt-BR'))) {
    const safe = (t) => String(t).replace(/[\\/:*?"<>|]+/g, '-').trim();
    const dir = r.data.folder ? `${safe(r.data.folder)}/` : '';
    let base = safe(r.data.name) || 'musica'; let n = base, i = 2; while (used.has(`${dir}${n}`.toLowerCase())) n = `${base} (${i++})`; used.add(`${dir}${n}`.toLowerCase());
    try { files.push({ name: `${dir}${n}.mid`, data: fromB64(r.data.b64) }); } catch { /* registro sem arquivo legível */ }
  }
  if (!files.length) { toast('nenhuma música pra baixar', { id: 'rg-zip', ms: 2500 }); return; }
  const url = URL.createObjectURL(writeZip(files));
  const a = h('a', { href: url, download: `musicas-midi-${new Date().toISOString().slice(0, 10)}.zip` }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast(`${files.length} música(s) no zip ✓`, { id: 'rg-zip', ms: 3000 });
}
export const hallTop = (key) => { const b = store.get(HALL); return (b && b.data.boards && b.data.boards[key]) || []; };
export function hallAdd(key, entry) {
  const b = store.get(HALL); const boards = { ...((b && b.data.boards) || {}) };
  boards[key] = [...(boards[key] || []), entry].sort((x, y) => y.score - x.score).slice(0, 10);
  store.upsert('setting', HALL, { boards });
}

export const xpTotal = () => (store.get(XP) ? store.get(XP).data.total || 0 : 0);
export async function addXp(n, why = '') {
  n = Math.round(Number(n) || 0); if (n <= 0) return xpTotal();
  const cur = store.get(XP) ? store.get(XP).data : { total: 0, log: [] };
  const total = (cur.total || 0) + n;
  await store.upsert('setting', XP, { total, log: [{ n, why: String(why || '').slice(0, 60), at: Date.now() }, ...(cur.log || [])].slice(0, 50) });
  return total;
}

/** Carrega o css e o js do pacote (uma vez). Resolve com window.BeaterRhythm ou rejeita se o pacote não está lá. */
export function loadPackage() {
  if (window.BeaterRhythm) return Promise.resolve(window.BeaterRhythm);
  if (loading) return loading;
  if (!document.querySelector('link[data-rg]')) document.head.append(h('link', { rel: 'stylesheet', href: `${BASE}rhythm-games.css`, 'data-rg': '' }));
  loading = new Promise((ok, fail) => {
    const s = h('script', { src: `${BASE}rhythm-games.js`, 'data-rg': '' });
    s.addEventListener('load', () => (window.BeaterRhythm ? ok(window.BeaterRhythm) : fail(new Error('o pacote carregou mas não criou BeaterRhythm'))));
    s.addEventListener('error', () => fail(new Error('pacote não encontrado')));
    document.head.append(s);
  }).catch((e) => { loading = null; document.querySelectorAll('script[data-rg], link[data-rg]').forEach((x) => x.remove()); throw e; });
  return loading;
}

/** opts.student: área do aluno (sem importar MIDI; músicas originais do app; ranking compartilhado com o nome do aluno). */
export function mount(host, opts = {}) {
  const student = !!opts.student;
  let mounted = false; let gone = false;
  const studentTop = (key) => RK.cached(`ritmo|${key}`);
  const studentAdd = (key, e) => { RK.add(`ritmo|${key}`, e.name, e.score, e.acc, e.grade).then(() => RK.top(`ritmo|${key}`, { fresh: true })).then(() => window.BeaterRhythm && window.BeaterRhythm.refresh && window.BeaterRhythm.refresh()); };
  const xpOut = h('output', { class: 'rg-xp', 'aria-live': 'polite' }, `${xpTotal()} XP`);
  // #jogos fica sem altura fixa (o pacote mede a tela com 100dvh); durante o jogo o .rg-host vira tela cheia (ver app.css)
  const box = h('div', { id: 'jogos' }, h('p', { class: 'muted rg-wait' }, 'carregando os jogos…'));
  const frame = h('div', { class: 'rg-host' }, box);
  // importar MIDI: vira a aba "Importados" do pacote (a busca do próprio pacote filtra pelo nome)
  const input = h('input', { type: 'file', accept: '.mid,.midi,.kar,.zip,audio/midi,audio/x-midi,application/zip', multiple: true, hidden: true, 'aria-label': 'Arquivos MIDI' });
  const manage = h('details', { class: 'card pad rg-manage' });
  const refresh = (go) => {
    const songs = importedSongs();
    if (window.BeaterRhythm && mounted) {
      window.BeaterRhythm.setSongs(songs);
      if (go) { const tab = document.querySelector('#jogos [data-act="rz-style"][data-v="imp"]'); if (tab && !tab.classList.contains('on')) tab.click(); }
    }
    const recs = store.list(KIND).sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt-BR'));
    manage.hidden = !recs.length;
    manage.replaceChildren(h('summary', {}, `músicas importadas (${recs.length})`),
      h('ul', { class: 'rg-list' }, ...recs.map((r) => h('li', {}, h('span', {}, h('b', {}, r.data.name), h('small', { class: 'muted' }, ` · ${r.data.bpm} bpm${r.data.drums ? ` · ${r.data.drums} notas de bateria` : ' · sem bateria (ritmo criado)'}${r.data.trim ? ' · ✂ cortada' : ''}`)),
        h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar ${r.data.name}`, onclick: async () => { if (await confirmSheet('Apagar música importada?', r.data.name, 'Apagar')) { await store.remove(r.id); refresh(); } } }, 'apagar')))));
  };
  input.addEventListener('change', async () => {
    const list = [...input.files]; input.value = ''; if (!list.length) return;
    toast('lendo os MIDIs…', { id: 'rg-imp', ms: 60000 });
    try {
      const { ok, bad } = await importMidis(list);
      const noDrums = ok.filter((x) => !x.drums).length;
      toast(ok.length ? `${ok.length} música(s) em "Importados" ✓${noDrums ? ` · ${noDrums} sem bateria (o app cria um ritmo)` : ''}${bad.length ? ` · ${bad.length} não deu` : ''}` : `nenhum MIDI deu certo${bad.length ? `: ${bad[0].why}` : ''}`, { id: 'rg-imp', ms: 5000 });
      refresh(ok.length > 0);
    } catch (e) { toast(`não consegui importar: ${e.message}`, { id: 'rg-imp', ms: 4000 }); }
  });
  const tools = h('div', { class: 'row pad-x rg-tools' }, h('button', { class: 'btn small', type: 'button', onclick: () => input.click() }, '+ importar MIDI'), h('button', { class: 'btn small ghost', type: 'button', onclick: exportAll }, '⬇ baixar tudo (.zip)'), h('small', { class: 'muted' }, '.mid, .midi ou um .zip com vários'), input);
  host.append(banner('Jogos de ritmo', 'joga, ganha XP e treina o tempo'), h('div', { class: 'row between pad-x rg-top' }, student ? h('span') : h('a', { class: 'link', href: '#/kids' }, '← kids e jogos'), xpOut), ...(student ? [] : [tools]), frame, ...(student ? [] : [manage]));
  document.documentElement.classList.add('rg-on');
  // o pacote avisa quando acerta/erra (figuras) e quando fecha uma música: aqui entram o Paul e a frase
  window.__bfb = (kind, withSound) => { const msg = FB.line(kind); if (withSound) FB.sound(kind); FB.paul(kind, msg, 1600); };
  loadPackage().then((BR) => {
    if (gone) return;
    box.replaceChildren();
    const studentOpts = student ? { builtin: true, autoName: opts.name, hallTop: studentTop, hallAdd: studentAdd, onPlay: (key) => RK.top(`ritmo|${key}`, { fresh: true }).then(() => BR.refresh && BR.refresh()) } : {};
    BR.mount('#jogos', { storageKey: student ? 'beaterista-aluno-ritmo' : 'beaterista-ritmo', midiImport: false, songs: student ? [] : importedSongs(), folders: student ? () => [] : folderNames, hallTop, hallAdd, onRename: renameSong, onMove: moveSong, onAddFolder: addFolder, onMoveMany: moveMany, onRenameFolder: renameFolder, onDelFolder: deleteFolder, onTrim: async (id, trim) => { await store.upsert(KIND, id, { trim: trim || null }); toast(trim ? 'corte salvo ✂' : 'corte removido', { id: 'rg-trim', ms: 1800 }); }, ...studentOpts, onXp: async (n, why) => { const t = await addXp(n, why); xpOut.textContent = `${t} XP`; if (n > 0) toast(`+${Math.round(n)} XP${why ? ` · ${why}` : ''}`, { id: 'rg-xp', ms: 1600 }); } });
    mounted = true; refresh();
  }).catch((e) => {
    if (gone) return;
    box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'os jogos ainda não foram instalados.'), h('p', { class: 'muted' }, `faltam os arquivos rhythm-games.js e rhythm-games.css em ${BASE} (${e.message}).`)));
  });
  // MIDI importado em outro aparelho chega pela sincronização
  const off = store.subscribe((i) => { if ((!i.kind || i.kind === KIND || i.kind === 'setting') && mounted && !document.body.classList.contains('rz-lock')) refresh(); });
  return () => {
    off(); gone = true; window.__bfb = null; document.documentElement.classList.remove('rg-on'); document.body.classList.remove('rz-lock');
    if (mounted && window.BeaterRhythm && window.BeaterRhythm.unmount) { try { window.BeaterRhythm.unmount(); } catch { /* o pacote já desmontou */ } }
  };
}
