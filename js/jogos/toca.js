// Toca Aqui: ler a figura na pauta e tocar no tempo. Abre direto no CAMINHO (mapa de 12 fases por modo: iniciante, intermediário, avançado),
// igual ao pauLta; o "aleatório" fica ao lado do mapa. Toca na tela (com as duas mãos) ou no microfone (vale mais estrelas).
// Os outros jogos que moravam aqui agora são separados: Detetive Note (adivinhar o ritmo), Figurix (figuras rítmicas) e, em breve, o de rudimentos (taiko).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { leitura, progressoToca } from '../views/treinos.js';
import { PATH, TIERS } from '../reading.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { temaDoMundo } from './mundos-tema.js';

/** Os 3 modos viram 3 mundos, cada um com o seu cenário (o id do modo continua o mesmo: ini, int, ava). */
const MUNDOS = {
  ini: { id: 'vila', tema: 'floresta', nome: 'Bosque das Semínimas', curto: 'bosque', sub: 'o pulso e as colcheias', regioes: [['praca', 'Praça do Pulso', 'semínima e pausa'], ['feira', 'Feira das Colcheias', 'duas por tempo']] },
  int: { id: 'cidade', tema: 'mar', nome: 'Maré das Semicolcheias', curto: 'maré', sub: 'quatro por tempo', regioes: [['avenida', 'Enseada das Semis', 'rápido e firme'], ['metro', 'Recife dos Ritmos', 'mistura de figuras']] },
  ava: { id: 'palco', tema: 'espaco', nome: 'Órbita das Síncopes', curto: 'órbita', sub: 'pontuadas e contratempos', regioes: [['coxia', 'Anel dos Contratempos', 'o ritmo fora do lugar'], ['palco', 'Estação Principal', 'tudo junto']] },
};

export function mount(host) {
  const saved = getGame('toca');
  let tier = TIERS.some((t) => t.id === saved.tier) ? saved.tier : 'ini';
  let view = 'mapa'; let off = null; let gone = false;
  const root = h('div', { class: 'jg jg-toca' }); host.replaceChildren(root);
  const idxOf = (t, n) => PATH.findIndex((x) => x.tier === t && x.n === n);
  const starsAt = (pr, i) => (pr.pstars[i] ?? ((pr.pbest[i] || 0) >= 50 ? 1 : 0));
  const clean = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } };
  const drawMapa = () => {
    clean(); view = 'mapa'; musicaVolta(); const pr = progressoToca(); // a musiquinha só toca no mapa (dentro da fase precisa de silêncio: contagem, clique e microfone)
    const mapBox = h('div', { class: 'tm-map' });
    const levels = Array.from({ length: 12 }, (_, i) => ({ id: `toca:${tier}:${i + 1}`, index: i + 1, label: String(i + 1), tag: '', boss: i === 11 }));
    const have = PATH.reduce((s, x, i) => s + (x.tier === tier ? starsAt(pr, i) : 0), 0);
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Modo' }, ...TIERS.map((t) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(tier === t.id), class: tier === t.id ? 'on' : '',
      onclick: () => { tier = t.id; setGame('toca', { ...getGame('toca'), tier }); drawMapa(); } }, `${TIERS.indexOf(t) + 1} · ${MUNDOS[t.id].curto}`)));
    const bar = h('div', { class: 'tm-bar' }, tabs, h('button', { type: 'button', class: 'tm-rand', onclick: () => jogar(null) }, h('span', { 'aria-hidden': 'true' }, '↻'), ' aleatório'));
    root.replaceChildren(h('p', { class: 'tm-dica' }, `${MUNDOS[tier].nome} · toque as figuras da pauta no tempo: na tela, com as duas mãos, ou no microfone (vale mais estrelas).`), mapBox);
    off = mountProgressionMap(mapBox, {
      gameId: `toca-${tier}`, levels, profileId: 'toca', unitName: 'Fase', tier: 0, stars: { have, max: 36 },
      theme: temaDoMundo(MUNDOS[tier].tema, MUNDOS[tier].nome, MUNDOS[tier].regioes),
      starsOf: (id) => starsAt(pr, idxOf(tier, Number(id.split(':')[2]))),
      unlockedOf: () => true, lockedMsg: '',
      onOpen: (lv) => jogar(lv.index),
    });
    const hd = mapBox.querySelector('.mp-head'); if (hd) hd.append(bar); else mapBox.prepend(bar); // o modo e o aleatório ficam no cabeçalho fixo do mapa
  };
  const jogar = (n) => {
    clean(); view = 'jogo'; musicaPausa(); const stage = h('div', { class: 'jg-toca-stage' }); root.replaceChildren(stage);
    off = leitura(stage, n == null ? { mapa: true, livre: true, lv: TIERS.find((t) => t.id === tier).lv, onBack: drawMapa } : { mapa: true, step: idxOf(tier, n), onBack: drawMapa });
  };
  drawMapa();
  return {
    inProgress: () => false,
    restart: () => { if (!gone) drawMapa(); },
    destroy() { gone = true; clean(); },
  };
}
