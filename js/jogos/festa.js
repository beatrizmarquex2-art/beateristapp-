// Identidade dos jogos de tabuleiro: o Paul aparece na tela de abertura e reage (comemora, chora, empata) quando o jogo avisa
// o resultado pelo som (evento "jg-sfx" de base.js). Não mexe no miolo de nenhum jogo.
import { h } from '../util.js';
import { stars } from '../ui.js';
import { reduced } from './base.js';

const PAUL = 'assets/paul/';
const POSE = { win: ['e20', 'e03', 'e06'], lose: ['e17', 'e25'], tie: ['e26', 'e04'] };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function attachFesta(wrap, body) {
  const idle = h('img', { class: 'jg-paul-idle', src: `${PAUL}e04.webp`, alt: '', decoding: 'async', draggable: 'false' });
  wrap.append(idle);
  const sync = () => { idle.hidden = !body.querySelector('.jg-h'); }; // só na tela de abertura (não cobre o tabuleiro)
  sync(); const mo = new MutationObserver(sync); mo.observe(body, { childList: true, subtree: true });
  let timer = 0; let cur = null;
  const react = (e) => {
    const kind = e.detail; const poses = POSE[kind]; if (!poses) return;
    if (cur) cur.remove(); clearTimeout(timer);
    const img = h('img', { class: `jg-paul-react ${kind}`, src: `${PAUL}${pick(poses)}.webp`, alt: '', decoding: 'async', draggable: 'false' });
    wrap.append(img); cur = img;
    if (kind === 'win') stars(img);
    timer = setTimeout(() => { img.classList.add('out'); setTimeout(() => img.remove(), reduced() ? 0 : 350); }, 2600);
  };
  document.addEventListener('jg-sfx', react);
  return () => { document.removeEventListener('jg-sfx', react); mo.disconnect(); clearTimeout(timer); if (cur) cur.remove(); idle.remove(); };
}
