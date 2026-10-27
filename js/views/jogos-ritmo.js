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
  // .rg-host controla o tamanho; #jogos (onde o pacote monta) só preenche: o css do pacote pode mexer no #jogos à vontade
  const box = h('div', { id: 'jogos' }, h('p', { class: 'muted rg-wait' }, 'carregando os jogos…'));
  const frame = h('div', { class: 'rg-host' }, box);
  // a área do jogo ocupa o que sobra da tela (sem rolar a página enquanto joga)
  const fit = () => {
    const top = frame.getBoundingClientRect().top + window.scrollY; const nav = document.querySelector('.bottom-nav'); const nb = nav ? window.innerHeight - nav.getBoundingClientRect().top : 0;
    let hgt = Math.max(320, window.innerHeight - top - nb - 8); frame.style.setProperty('--rg-h', `${hgt}px`);
    // o que ainda sobrar de rolagem (respiro do fim da página) sai da altura do jogo
    const extra = document.documentElement.scrollHeight - window.innerHeight;
    if (extra > 0) { hgt = Math.max(320, hgt - extra); frame.style.setProperty('--rg-h', `${hgt}px`); }
    window.scrollTo(0, 0);
  };
  host.append(banner('Jogos de ritmo', 'joga, ganha XP e treina o tempo'), h('div', { class: 'row between pad-x rg-top' }, h('a', { class: 'link', href: '#/kids' }, '← kids e jogos'), xpOut), frame);
  document.documentElement.classList.add('rg-on');
  requestAnimationFrame(fit); window.addEventListener('resize', fit);
  // mede de novo depois que as fontes e o banner assentam (no celular a primeira medida sai curta ou comprida)
  const t1 = setTimeout(fit, 350), t2 = setTimeout(fit, 1200); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!gone) fit(); });
  loadPackage().then((BR) => {
    if (gone) return;
    box.replaceChildren();
    BR.mount('#jogos', { storageKey: 'beaterista-ritmo', onXp: async (n, why) => { const t = await addXp(n, why); xpOut.textContent = `${t} XP`; if (n > 0) toast(`+${Math.round(n)} XP${why ? ` · ${why}` : ''}`, { id: 'rg-xp', ms: 1600 }); } });
    mounted = true; fit();
  }).catch((e) => {
    if (gone) return;
    box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'os jogos ainda não foram instalados.'), h('p', { class: 'muted' }, `faltam os arquivos rhythm-games.js e rhythm-games.css em ${BASE} (${e.message}).`)));
  });
  return () => {
    gone = true; clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', fit); document.documentElement.classList.remove('rg-on');
    if (mounted && window.BeaterRhythm && window.BeaterRhythm.unmount) { try { window.BeaterRhythm.unmount(); } catch { /* o pacote já desmontou */ } }
  };
}
