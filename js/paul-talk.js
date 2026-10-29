// O Paul fala: clicar nele faz um barulhinho de robô e, de vez em quando, um pensamento dele aparece numa nuvem.
// Os pensamentos com link abrem a rede/site da Bea. Não aparecem no meio de uma música (jogo em tela cheia).
import { h } from './util.js';
import { audio } from './audio.js';

const IG = 'https://www.instagram.com/beaterista_/', YT = 'https://www.youtube.com/@beateristadrummer';
// Link da avaliação no Google: quando a Bea mandar o endereço, é só colocar aqui (vazio = a nuvem aparece sem link).
export const GOOGLE_REVIEW = 'https://g.page/r/CS34GVfs3jjqEAE/review';
export const THOUGHTS = [
  ['já estudou hoje?'],
  ['siga a Bea nas redes!', IG],
  ['veja os vídeos do canal!', YT],
  ['seja aluno online da Bea!', 'https://beaterista.com.br'],
  ['já tem o seu uniforme?'],
  ['paradiddle: D E D D E D E E'],
  ['semínima vale 1 tempo'],
  ['qual música tá na sua cabeça?'],
  ['avalie a escola no Google ⭐', GOOGLE_REVIEW],
];

/** Barulhinho de robô: dois a quatro "blips" rápidos, cada vez um diferente. Só toca depois de um toque. */
export function chirp() {
  try {
    const c = audio(); const t0 = c.currentTime + 0.01;
    const base = 520 + Math.random() * 380;
    const pats = [[1, 1.5], [1, 1.25, 1.5], [1.5, 1, 1.5, 2], [1, 2], [1.2, 0.9, 1.6]];
    const seq = pats[Math.floor(Math.random() * pats.length)];
    seq.forEach((m, i) => {
      const t = t0 + i * 0.085; const o = c.createOscillator(); const g = c.createGain();
      o.type = i % 2 ? 'triangle' : 'square'; o.frequency.setValueAtTime(base * m, t); o.frequency.exponentialRampToValueAtTime(base * m * 1.18, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      if (localStorage.getItem('bt-mute') !== '1') o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.1);
    });
  } catch { /* sem áudio */ }
}

let box = null, hideT = 0, last = -1;
function pick() { let i = Math.floor(Math.random() * THOUGHTS.length); if (THOUGHTS.length > 1 && i === last) i = (i + 1) % THOUGHTS.length; last = i; return THOUGHTS[i]; }
function busy() { return document.hidden || document.body.classList.contains('rz-lock') || document.querySelector('#overlay .sheet, #overlay .drawer'); }

/** Mostra uma nuvem de pensamento (some sozinha). */
export function think(item, ms = 6500) {
  if (busy()) return;
  const [text, href] = item || pick();
  if (!box) { box = h('div', { class: 'pt-think', role: 'status' }); document.body.append(box); }
  const bubble = href
    ? h('a', { class: 'pt-cloud', href, target: '_blank', rel: 'noopener noreferrer' }, text)
    : h('span', { class: 'pt-cloud' }, text);
  box.replaceChildren(h('img', { class: 'pt-face', src: 'assets/paul/e02.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }), h('i', { class: 'pt-dot d1' }), h('i', { class: 'pt-dot d2' }), bubble);
  box.style.bottom = `${document.querySelector('.bottom-nav') ? 96 : 22}px`;
  box.classList.remove('out'); void box.offsetWidth; box.classList.add('on');
  clearTimeout(hideT); hideT = setTimeout(() => { box.classList.remove('on'); box.classList.add('out'); }, ms);
}

/** Liga o clique no Paul e os pensamentos soltos. `allowed()` diz se, na tela atual, pode aparecer. */
let started = false;
export function startPaul({ allowed = () => true, first = 9000, every = [26000, 48000] } = {}) {
  if (started) return; started = true;
  document.addEventListener('click', (e) => {
    const p = e.target.closest && e.target.closest('.al-paul-img, .rb-img, .bn-paul, .login-paul');
    if (!p) return;
    chirp(); p.classList.remove('pt-tap'); void p.offsetWidth; p.classList.add('pt-tap');
    if (allowed()) think();
  });
  const loop = (ms) => setTimeout(() => { if (allowed()) think(); loop(every[0] + Math.random() * (every[1] - every[0])); }, ms);
  loop(first);
}
