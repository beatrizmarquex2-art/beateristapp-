// Pacotinho de figurinhas: rasga, as cartas saem viradas e a pessoa vira uma a uma. Depois é só colar no álbum.
import { h, reducedMotion } from '../util.js';
import { cardEl } from './album.js';
import { rarityOf, RARITY } from './card-art.js';

const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? Math.min(ms, 60) : ms));

/** Mostra o pacotinho com as `cards` (já sorteadas). Devolve uma promessa que resolve quando a pessoa fecha. */
export function openPack(cards, { onPaste } = {}) {
  return new Promise((resolve) => {
    const root = h('div', { class: 'kx-pk', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Pacotinho de figurinhas' });
    const close = (goAlbum) => { root.classList.add('out'); setTimeout(() => { root.remove(); document.body.classList.remove('kx-pk-open'); resolve(); if (goAlbum && onPaste) onPaste(); }, 220); };
    const pack = h('button', { class: 'kx-pack-wrap', type: 'button', 'aria-label': 'Rasgar o pacotinho' },
      h('span', { class: 'pk-top' }), h('span', { class: 'pk-body' }, h('b', {}, 'BEATERISTA'), h('small', {}, `${cards.length} figurinha${cards.length > 1 ? 's' : ''}`), h('i', { class: 'pk-star' }, '★')), h('span', { class: 'pk-shine' }));
    const hint = h('p', { class: 'pk-hint' }, 'toque para rasgar');
    const deck = h('div', { class: 'pk-deck' }); const say = h('p', { class: 'pk-say' }); const act = h('div', { class: 'pk-act' });
    root.append(h('button', { class: 'pk-x', type: 'button', 'aria-label': 'Fechar', onclick: () => close(false) }, '×'), pack, hint, deck, say, act);
    document.body.append(root); document.body.classList.add('kx-pk-open'); pack.focus();

    let busy = false;
    pack.addEventListener('click', async () => {
      if (busy) return; busy = true; hint.remove(); pack.classList.add('shake'); await wait(550); pack.classList.remove('shake'); pack.classList.add('torn'); await wait(500);
      deck.classList.add('on'); let shown = 0;
      const els = cards.map((c, i) => {
        const face = cardEl(c); const back = h('span', { class: 'pk-back' }, h('b', {}, '★'));
        const el = h('button', { class: `pk-card rar-${rarityOf(c.id)}`, type: 'button', style: `--i:${i};--n:${cards.length}`, 'aria-label': `Virar figurinha ${i + 1}` }, h('span', { class: 'pk-in' }, back, h('span', { class: 'pk-face' }, face)));
        el.addEventListener('click', async () => {
          if (el.classList.contains('flip') || i !== shown) return; shown++; el.classList.add('flip');
          const r = rarityOf(c.id); say.textContent = `${c.name}${r > 1 ? ` · ${RARITY[r]}!` : ''}`; if (r > 1) el.classList.add('glow');
          if (shown === cards.length) { await wait(700); act.append(h('button', { class: 'kd-btn', type: 'button', onclick: () => close(true) }, 'colar no álbum →'), h('button', { class: 'kd-chip', type: 'button', onclick: () => close(false) }, 'depois')); }
          else await wait(300);
        });
        return el;
      });
      deck.append(...els); pack.hidden = true; say.textContent = 'toque na carta de cima para virar';
    });
  });
}
