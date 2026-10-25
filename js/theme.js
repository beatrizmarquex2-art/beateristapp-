import * as store from './store.js';

export const THEMES = [
  { id: 'rabisco', nome: 'Rabisco', desc: 'papel claro, pincel vermelho, estrelas e baquetas', sw: ['#f1ebe1', '#fbf8f2', '#b5162b', '#1b1818'] },
  { id: 'zine', nome: 'Zine colado', desc: 'vinho, papel rasgado, fita e as suas fotos', sw: ['#521622', '#f3e2c4', '#a93a2b', '#d9a441'] },
  { id: 'backstage', nome: 'Backstage', desc: 'preto de palco, crachás e dourado', sw: ['#141010', '#f7ebdc', '#d9a441', '#a93a2b'] },
  { id: 'cereja', nome: 'Cereja', desc: 'vermelho profundo, aquarela rosa e dourado', sw: ['#8e1b22', '#fff7f3', '#e88ba4', '#e3a82f'] },
  { id: 'tapete', nome: 'Tapete', desc: 'vinho e terracota, como o tapete do estúdio', sw: ['#521622', '#f7ebdc', '#c4572f', '#d9a441'] },
  { id: 'noite', nome: 'Noite estrelada', desc: 'azul-petróleo pintado à mão', sw: ['#0e5560', '#f3f1e2', '#3fa3a0', '#e6c84f'] },
  { id: 'vitrine', nome: 'Vitrine', desc: 'papel claro, azul-noite e vermelho', sw: ['#ece6d9', '#fffcf6', '#2f4a5e', '#a32a24'] },
  { id: 'palco', nome: 'Palco', desc: 'azul-marinho e dourado, modo escuro', sw: ['#0e1522', '#19233a', '#2b3f66', '#c9a45c'] },
];
export const FONTS = [
  { id: 'marcador', nome: 'Marcador', desc: 'escrita de canetão, cara de zine', family: 'Permanent Marker' },
  { id: 'cartaz', nome: 'Cartaz', desc: 'letra de pôster de show, forte e estreita', family: 'Anton' },
  { id: 'revista', nome: 'Revista', desc: 'serifa grossa de capa de revista', family: 'Abril Fatface' },
  { id: 'bodoni', nome: 'Bodoni', desc: 'a itálica fina de antes', family: 'Bodoni Moda' },
];
export const THEME_KEY = 'setting-theme';
const prefs = () => (store.get(THEME_KEY) ? store.get(THEME_KEY).data : {});

export const currentTheme = () => (THEMES.some((t) => t.id === prefs().theme) ? prefs().theme : 'rabisco');
export const currentFont = () => (FONTS.some((f) => f.id === prefs().font) ? prefs().font : 'marcador');
export const motionOn = () => prefs().motion !== false;

export function apply() {
  const root = document.documentElement;
  const t = currentTheme();
  root.setAttribute('data-theme', t);
  const f = currentFont();
  root.setAttribute('data-motion', motionOn() ? 'on' : 'off');
  if (f === 'bodoni') root.removeAttribute('data-font'); else root.setAttribute('data-font', f);
  try { localStorage.setItem('beaterista-font', f); localStorage.setItem('beaterista-theme', t); localStorage.setItem('beaterista-motion', motionOn() ? 'on' : 'off'); } catch { /* sem armazenamento: ok */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--meta-color').trim() || '#8e1b22');
}
export const setTheme = (id) => store.upsert('setting', THEME_KEY, { theme: id });
export const setFont = (id) => store.upsert('setting', THEME_KEY, { font: id });
export const setMotion = (on) => store.upsert('setting', THEME_KEY, { motion: !!on });

/** Aplica ao abrir e sempre que mudar (inclusive vindo de outro aparelho). */
export function initTheme() {
  apply();
  return store.subscribe((i) => { if (!i.kind || i.id === THEME_KEY || i.kind === 'setting') apply(); });
}
