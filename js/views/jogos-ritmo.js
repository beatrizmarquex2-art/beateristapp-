// Jogos de ritmo: o pacote "beater rhythm games" (assets/rhythm-games/) montado dentro do app.
// O pacote é um script clássico que expõe window.BeaterRhythm; carregamos css + js uma vez só e
// chamamos mount/unmount a cada entrada/saída da tela. XP dos jogos vai pro registro "setting-xp".
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, toast, confirmSheet } from '../ui.js';
import { parseMidi } from '../midi.js';
import { toChart, nameFromFile } from '../midi-chart.js';
import { readZip } from '../zip.js';

const BASE = 'assets/rhythm-games/';
const XP = 'setting-xp';
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
    const sg = cache.get(k); if (sg) out.push({ ...sg, id: r.id, name: r.data.name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
/** Importa arquivos .mid/.midi/.kar (soltos ou dentro de .zip). Devolve { ok:[{name, drums, melody}], bad:[{name, why}] }. */
export async function importMidis(files) {
  const items = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) { for (const e of await readZip(await f.arrayBuffer())) if (/\.(mid|midi|kar)$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name)) items.push({ name: e.name, read: async () => new Uint8Array(await e.read()) }); }
    else if (/\.(mid|midi|kar)$/i.test(f.name)) items.push({ name: f.name, read: async () => new Uint8Array(await f.arrayBuffer()) });
  }
  const ok = [], bad = [];
  for (const it of items) {
    const name = nameFromFile(it.name);
    try {
      const bytes = await it.read(); if (bytes.length > MAX) throw new Error('arquivo grande demais');
      const { song, report } = toChart(parseMidi(bytes), name);
      await store.upsert(KIND, `midi-${song.id.slice(4)}`, { name, file: it.name.split('/').pop(), b64: toB64(bytes), size: bytes.length, bpm: report.bpm, drums: report.drums, melody: report.melody, seconds: report.seconds, added: Date.now() });
      ok.push({ name, ...report });
    } catch (e) { bad.push({ name, why: e.message || 'não consegui ler' }); }
  }
  return { ok, bad };
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

export function mount(host) {
  let mounted = false; let gone = false;
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
      h('ul', { class: 'rg-list' }, ...recs.map((r) => h('li', {}, h('span', {}, h('b', {}, r.data.name), h('small', { class: 'muted' }, ` · ${r.data.bpm} bpm${r.data.drums ? ` · ${r.data.drums} notas de bateria` : ' · sem bateria'}`)),
        h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar ${r.data.name}`, onclick: async () => { if (await confirmSheet('Apagar música importada?', r.data.name, 'Apagar')) { await store.remove(r.id); refresh(); } } }, 'apagar')))));
  };
  input.addEventListener('change', async () => {
    const list = [...input.files]; input.value = ''; if (!list.length) return;
    toast('lendo os MIDIs…', { id: 'rg-imp', ms: 60000 });
    try {
      const { ok, bad } = await importMidis(list);
      const noDrums = ok.filter((x) => !x.drums).length;
      toast(ok.length ? `${ok.length} música(s) em "Importados" ✓${noDrums ? ` · ${noDrums} sem bateria (só melodia)` : ''}${bad.length ? ` · ${bad.length} não deu` : ''}` : `nenhum MIDI deu certo${bad.length ? `: ${bad[0].why}` : ''}`, { id: 'rg-imp', ms: 5000 });
      refresh(ok.length > 0);
    } catch (e) { toast(`não consegui importar: ${e.message}`, { id: 'rg-imp', ms: 4000 }); }
  });
  const tools = h('div', { class: 'row pad-x rg-tools' }, h('button', { class: 'btn small', type: 'button', onclick: () => input.click() }, '+ importar MIDI'), h('small', { class: 'muted' }, '.mid, .midi ou um .zip com vários'), input);
  host.append(banner('Jogos de ritmo', 'joga, ganha XP e treina o tempo'), h('div', { class: 'row between pad-x rg-top' }, h('a', { class: 'link', href: '#/kids' }, '← kids e jogos'), xpOut), tools, frame, manage);
  document.documentElement.classList.add('rg-on');
  loadPackage().then((BR) => {
    if (gone) return;
    box.replaceChildren();
    BR.mount('#jogos', { storageKey: 'beaterista-ritmo', songs: importedSongs(), onXp: async (n, why) => { const t = await addXp(n, why); xpOut.textContent = `${t} XP`; if (n > 0) toast(`+${Math.round(n)} XP${why ? ` · ${why}` : ''}`, { id: 'rg-xp', ms: 1600 }); } });
    mounted = true; refresh();
  }).catch((e) => {
    if (gone) return;
    box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'os jogos ainda não foram instalados.'), h('p', { class: 'muted' }, `faltam os arquivos rhythm-games.js e rhythm-games.css em ${BASE} (${e.message}).`)));
  });
  // MIDI importado em outro aparelho chega pela sincronização
  const off = store.subscribe((i) => { if ((!i.kind || i.kind === KIND) && mounted && !document.body.classList.contains('rz-lock')) refresh(); });
  return () => {
    off(); gone = true; document.documentElement.classList.remove('rg-on'); document.body.classList.remove('rz-lock');
    if (mounted && window.BeaterRhythm && window.BeaterRhythm.unmount) { try { window.BeaterRhythm.unmount(); } catch { /* o pacote já desmontou */ } }
  };
}
