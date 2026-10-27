// Jogos de ritmo: o pacote "beater rhythm games" (assets/rhythm-games/) montado dentro do app.
// O pacote é um script clássico que expõe window.BeaterRhythm; carregamos css + js uma vez só e
// chamamos mount/unmount a cada entrada/saída da tela. XP dos jogos vai pro registro "setting-xp".
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, toast } from '../ui.js';

const BASE = 'assets/rhythm-games/';
const XP = 'setting-xp';
let loading = null;

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
  host.append(banner('Jogos de ritmo', 'joga, ganha XP e treina o tempo'), h('div', { class: 'row between pad-x rg-top' }, h('a', { class: 'link', href: '#/kids' }, '← kids e jogos'), xpOut), frame);
  document.documentElement.classList.add('rg-on');
  loadPackage().then((BR) => {
    if (gone) return;
    box.replaceChildren();
    BR.mount('#jogos', { storageKey: 'beaterista-ritmo', onXp: async (n, why) => { const t = await addXp(n, why); xpOut.textContent = `${t} XP`; if (n > 0) toast(`+${Math.round(n)} XP${why ? ` · ${why}` : ''}`, { id: 'rg-xp', ms: 1600 }); } });
    mounted = true;
  }).catch((e) => {
    if (gone) return;
    box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'os jogos ainda não foram instalados.'), h('p', { class: 'muted' }, `faltam os arquivos rhythm-games.js e rhythm-games.css em ${BASE} (${e.message}).`)));
  });
  return () => {
    gone = true; document.documentElement.classList.remove('rg-on'); document.body.classList.remove('rz-lock');
    if (mounted && window.BeaterRhythm && window.BeaterRhythm.unmount) { try { window.BeaterRhythm.unmount(); } catch { /* o pacote já desmontou */ } }
  };
}
