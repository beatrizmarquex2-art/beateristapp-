// Identidade dos jogos: papel rasgado com fita, clipe, pichação e o Paul espiando por cima da folha (tudo na borda, sem clique, nunca em cima do jogo).
// Quando o jogo avisa o resultado pelo som (evento "jg-sfx" de base.js), o Paul aparece comemorando, chorando ou rindo. Não mexe no miolo de nenhum jogo.
import { h } from '../util.js';
import { stars } from '../ui.js';
import { reduced } from './base.js';

const PAUL = 'assets/paul/';
const MURAL = 'assets/mural/';
const ZINE = 'assets/zine/';
const POSE = { win: ['e20', 'e03', 'e06'], lose: ['e17', 'e25'], tie: ['e26', 'e04'] };
const peek = ['e04', 'e03', 'e27'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const img = (cls, src) => h('img', { class: `jg-deco ${cls}`, src, alt: '', decoding: 'async', draggable: 'false' });

/** Enfeites da folha (fita nos cantos, clipe, rabiscos e o Paul espiando) + reação ao resultado. Devolve a função que desfaz tudo. */
export function attachFesta(wrap, { paul = true } = {}) {
  const decos = [img('tape-l', `${ZINE}fita-1.webp`), img('tape-r', `${ZINE}fita-3.webp`), paul ? img('paul', `${PAUL}${pick(peek)}.webp`) : null, img('spray', `${MURAL}star-spray.svg`), img('bolt', `${MURAL}bolt-red.svg`)].filter(Boolean);
  wrap.append(...decos);
  let timer = 0; let cur = null;
  const react = (e) => {
    const kind = e.detail; const poses = POSE[kind]; if (!poses) return;
    if (cur) cur.remove(); clearTimeout(timer);
    const el = h('img', { class: `jg-paul-react ${kind}`, src: `${PAUL}${pick(poses)}.webp`, alt: '', decoding: 'async', draggable: 'false' });
    document.body.append(el); cur = el; // no body: a folha tem camadas próprias e o Paul precisa ficar por cima de tudo
    if (kind === 'win') stars(el);
    timer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), reduced() ? 0 : 350); }, 2600);
  };
  document.addEventListener('jg-sfx', react);
  return () => { document.removeEventListener('jg-sfx', react); clearTimeout(timer); if (cur) cur.remove(); decos.forEach((d) => d.remove()); };
}
