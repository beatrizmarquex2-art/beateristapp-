// Toca Aqui: ler a figura na pauta e tocar no tempo. Abre direto no CAMINHO (mapa de 12 fases por modo: iniciante, intermediário, avançado),
// igual ao pauLta; o "aleatório" fica ao lado do mapa. Toca na tela (com as duas mãos) ou no microfone (vale mais estrelas).
// Os outros jogos que moravam aqui agora são separados: Detetive Note (adivinhar o ritmo), Figurix (figuras rítmicas) e, em breve, o de rudimentos (taiko).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { themeOf } from '../campanha/themes.js';
import { leitura, progressoToca } from '../views/treinos.js';
import { PATH, TIERS } from '../reading.js';

export function mount(host) {
  const saved = getGame('toca');
  let tier = TIERS.some((t) => t.id === saved.tier) ? saved.tier : 'ini';
  let view = 'mapa'; let off = null; let gone = false;
  const root = h('div', { class: 'jg jg-toca' }); host.replaceChildren(root);
  const idxOf = (t, n) => PATH.findIndex((x) => x.tier === t && x.n === n);
  const starsAt = (pr, i) => (pr.pstars[i] ?? ((pr.pbest[i] || 0) >= 50 ? 1 : 0));
  const clean = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } };
  const drawMapa = () => {
    clean(); view = 'mapa'; const pr = progressoToca();
    const mapBox = h('div', { class: 'tm-map' });
    const levels = Array.from({ length: 12 }, (_, i) => ({ id: `toca:${tier}:${i + 1}`, index: i + 1, label: String(i + 1), tag: '', boss: i === 11 }));
    const have = PATH.reduce((s, x, i) => s + (x.tier === tier ? starsAt(pr, i) : 0), 0);
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Modo' }, ...TIERS.map((t) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(tier === t.id), class: tier === t.id ? 'on' : '',
      onclick: () => { tier = t.id; setGame('toca', { ...getGame('toca'), tier }); drawMapa(); } }, t.name)));
    const bar = h('div', { class: 'tm-bar' }, tabs, h('button', { type: 'button', class: 'tm-rand', onclick: () => jogar(null) }, h('span', { 'aria-hidden': 'true' }, '↻'), ' aleatório'));
    root.replaceChildren(h('p', { class: 'tm-dica' }, 'toque as figuras da pauta no tempo: na tela, com as duas mãos, ou no microfone (vale mais estrelas).'), mapBox);
    off = mountProgressionMap(mapBox, {
      gameId: `toca-${tier}`, levels, profileId: 'toca', unitName: 'Fase', tier: 0, stars: { have, max: 36 },
      theme: themeOf('toca'),
      starsOf: (id) => starsAt(pr, idxOf(tier, Number(id.split(':')[2]))),
      unlockedOf: () => true, lockedMsg: '',
      onOpen: (lv) => jogar(lv.index),
    });
    const hd = mapBox.querySelector('.mp-head'); if (hd) hd.append(bar); else mapBox.prepend(bar); // o modo e o aleatório ficam no cabeçalho fixo do mapa
  };
  const jogar = (n) => {
    clean(); view = 'jogo'; const stage = h('div', { class: 'jg-toca-stage' }); root.replaceChildren(stage);
    off = leitura(stage, n == null ? { mapa: true, livre: true, lv: TIERS.find((t) => t.id === tier).lv, onBack: drawMapa } : { mapa: true, step: idxOf(tier, n), onBack: drawMapa });
  };
  drawMapa();
  return {
    inProgress: () => false,
    restart: () => { if (!gone) drawMapa(); },
    destroy() { gone = true; clean(); },
  };
}
