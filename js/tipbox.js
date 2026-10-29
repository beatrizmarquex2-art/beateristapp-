// "Dica do momento": uma das 30 dicas, a que mais combina com a tela, aparece embaixo das ferramentas (e leva pros jogos das dicas).
import { h, todayKey } from './util.js';
import * as store from './store.js';
import * as T from './tips.js';

export const tipList = () => store.list('tip').map((r) => ({ n: r.data.n, text: String(r.data.text || '') })).filter((t) => t.text).sort((a, b) => a.n - b.n);

/** Põe o cartão da dica no fim da tela. `ctx` escolhe o assunto (metronomo, rudimentos, treinos, beatlab, repertorio, partitura, toque…). */
export function tipBox(host, ctx) {
  const box = h('section', { class: 'card pad dc-tipbox', hidden: true }); let salt = 0;
  const draw = () => {
    const tips = tipList(); const t = T.tipFor(ctx, tips, todayKey(), salt); box.hidden = !t; if (!t) return;
    box.replaceChildren(h('p', { class: 'dc-n' }, `💡 dica ${t.n} de ${Math.max(30, tips.length)}`), h('p', { class: 'dc-text' }, t.text),
      h('div', { class: 'row dc-tipact' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => { salt++; draw(); } }, 'outra dica'), h('a', { class: 'btn small', href: '#/dicas' }, '🎮 jogar com as dicas')));
  };
  draw(); host.append(box);
  const off = store.subscribe((i) => { if (i.kind === 'tip' && box.hidden) draw(); });
  return off;
}
