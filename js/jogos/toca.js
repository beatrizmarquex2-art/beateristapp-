// Toca Aqui: ler a figura na pauta e tocar no tempo. Abre direto no CAMINHO (mapa de 12 fases por modo: iniciante, intermediário, avançado),
// igual ao pauLta; o "treino" (compassos novos sem parar, sem estrela) é o botão grande logo abaixo do título. Toca na tela (com as duas mãos) ou no microfone (vale mais estrelas).
// Os outros jogos que moravam aqui agora são separados: Detetive Note (adivinhar o ritmo), Figurix (figuras rítmicas) e, em breve, o de rudimentos (taiko).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { leitura, progressoToca } from '../views/treinos.js';
import { PATH, TIERS } from '../reading.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { temaDoMundo } from './mundos-tema.js';
import { toast } from '../ui.js';
import { botaoTreino } from './treino-ui.js';

/** Os 3 modos viram 3 mundos, cada um com o seu cenário (o id do modo continua o mesmo: ini, int, ava). */
const MUNDOS = {
  ini: { id: 'vila', tema: 'gelo', nome: 'Geleira das Semínimas', curto: 'geleira', sub: 'o pulso e as colcheias', regioes: [['praca', 'Praça do Pulso', 'semínima e pausa'], ['feira', 'Feira das Colcheias', 'duas por tempo'], ['iglu', 'Vila dos Iglus', 'colcheias misturadas'], ['lago', 'Lago Congelado', 'com pausas'], ['pico', 'Pico Nevado', 'mais rápido'], ['topo', 'Topo da Geleira', 'o último passo']] },
  int: { id: 'cidade', tema: 'laser', nome: 'Estúdio das Semicolcheias', curto: 'estúdio', sub: 'quatro por tempo', regioes: [['palco', 'Palco das Semis', 'rápido e firme'], ['ampli', 'Sala dos Amplis', 'mistura de figuras'], ['cabine', 'Cabine de Som', 'semis e pausas'], ['pista', 'Pista dos Lasers', 'bem rápido'], ['camarim', 'Camarim', 'tudo misturado'], ['show', 'Show Final', 'o último passo']] },
  ava: { id: 'palco', tema: 'porsol', nome: 'Pôr do Sol das Síncopes', curto: 'pôr do sol', sub: 'pontuadas e contratempos', regioes: [['praia', 'Praia dos Contratempos', 'o ritmo fora do lugar'], ['deque', 'Deque das Pontuadas', 'colcheia pontuada'], ['onda', 'Ondas Cruzadas', 'síncopes'], ['farol', 'Farol Veloz', 'bem rápido'], ['horizonte', 'Horizonte', 'tudo junto'], ['ocaso', 'Último Raio', 'o último passo']] },
};

export function mount(host) {
  const saved = getGame('toca');
  let tier = TIERS.some((t) => t.id === saved.tier) ? saved.tier : 'ini';
  let view = 'mapa'; let off = null; let gone = false;
  const root = h('div', { class: 'jg jg-toca' }); host.replaceChildren(root);
  const idxOf = (t, n) => PATH.findIndex((x) => x.tier === t && x.n === n);
  const starsAt = (pr, i) => (pr.pstars[i] ?? ((pr.pbest[i] || 0) >= 85 ? 1 : 0));
  const clean = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } };
  const drawMapa = () => {
    clean(); view = 'mapa'; musicaVolta(); const pr = progressoToca(); // a musiquinha só toca no mapa (dentro da fase precisa de silêncio: contagem, clique e microfone)
    const mapBox = h('div', { class: 'tm-map' });
    const levels = Array.from({ length: 12 }, (_, i) => ({ id: `toca:${tier}:${i + 1}`, index: i + 1, label: String(i + 1), tag: '', boss: i === 11 }));
    const have = PATH.reduce((s, x, i) => s + (x.tier === tier ? starsAt(pr, i) : 0), 0);
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Modo' }, ...TIERS.map((t) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(tier === t.id), class: tier === t.id ? 'on' : '',
      onclick: () => { tier = t.id; setGame('toca', { ...getGame('toca'), tier }); drawMapa(); } }, `${TIERS.indexOf(t) + 1} · ${MUNDOS[t.id].curto}`)));
    const bar = h('div', { class: 'tm-bar' }, tabs);
    root.replaceChildren(h('p', { class: 'tm-dica' }, `${MUNDOS[tier].nome} · toque as figuras da pauta no tempo: na tela, com as duas mãos, ou no microfone (vale mais estrelas).`),
      botaoTreino(() => jogar(null), `${TIERS.find((t) => t.id === tier).name} · compassos novos sem parar, sem estrelas`), mapBox);
    off = mountProgressionMap(mapBox, {
      gameId: `toca-${tier}`, levels, profileId: 'toca', unitName: 'Fase', tier: 0, stars: { have, max: 36 },
      theme: temaDoMundo(MUNDOS[tier].tema, MUNDOS[tier].nome, MUNDOS[tier].regioes),
      starsOf: (id) => starsAt(pr, idxOf(tier, Number(id.split(':')[2]))),
      unlockedOf: () => true, lockedMsg: '',
      onOpen: (lv) => jogar(lv.index),
    });
    const hd = mapBox.querySelector('.mp-head'); if (hd) hd.append(bar); else mapBox.prepend(bar); // o modo fica no cabeçalho fixo do mapa
  };
  const jogar = (n) => {
    clean(); view = 'jogo'; musicaPausa(); const stage = h('div', { class: 'jg-toca-stage' }); root.replaceChildren(stage);
    off = leitura(stage, n == null ? { mapa: true, livre: true, lv: TIERS.find((t) => t.id === tier).lv, onBack: drawMapa } : { mapa: true, step: idxOf(tier, n), onBack: (info) => { drawMapa(); if (info && info.andou != null) { const f = PATH[info.andou].n; toast(f < 12 ? `você andou no mundinho: fase ${f} concluída, a fase ${f + 1} abriu!` : `você chegou ao fim do ${MUNDOS[tier].nome}!`, { ms: 3600 }); } } });
  };
  drawMapa();
  return {
    inProgress: () => false,
    restart: () => { if (!gone) drawMapa(); },
    destroy() { gone = true; clean(); },
  };
}
