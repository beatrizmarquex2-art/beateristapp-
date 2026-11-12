// Detetive Note: a criança OUVE um ritmo de 1 compasso e MONTA ele com cartas (4 tempos). Escolhe o modo: comida, parque, corpo, animal (cartas com desenhos)
// ou normal (cartas com as figuras na pauta). Ouve quantas vezes quiser, confere, e se errar vê quais tempos estão errados.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio, later } from '../audio.js';
import { voz } from '../toca-som.js';
import { session } from '../session.js';
import * as N from '../notation.js';
import { layoutRhythm } from '../reading.js';
import { schedule } from '../views/treinos.js';
import { foodOf } from '../kids-logic.js';
import { svgEl } from '../kids/art.js';
import * as FB from '../feedback.js';
import { TEMAS, MODOS, cartas, sortear, conferir, acertou, estrelas, RODADAS, BPM } from './detetive-logic.js';

const EMOJI_MODO = { comida: '🍞', parque: '🚲', corpo: '✋', animal: '🐶' };
const face = (card, modo) => (modo === 'normal' ? svgEl(N.toSVG(layoutRhythm([card.cell], { width: 120, count: false, clef: false })), 'dn-face-fig')
  : h('span', { class: 'dn-face' }, h('i', { 'aria-hidden': 'true' }, foodOf(card.id).emoji), h('small', {}, foodOf(card.id).syl.join('-'))));
const soa = (cell, bpm = BPM) => { const c = audio(); const q = 60 / bpm; const t = c.currentTime + 0.03; [...cell].forEach((x, k) => { if (x === '1') voz(t + (k * q) / 4, 0.85); }); };

export function mount(host) {
  const saved = getGame('detetive'); let modo = MODOS.includes(saved.modo) ? saved.modo : 'comida';
  const root = h('div', { class: 'jg jg-detetive' }); host.replaceChildren(root);
  // S = tempos da tela (próxima rodada); Au = só o som (ouvir de novo não cancela nada da tela)
  const S = session(); const Au = session();
  let secreto = null; let slots = []; let rodada = 0; let primeira = 0; let errou = false; let gone = false; let jogando = false; let marcas = null;
  const chip = (txt, on, fn, label) => h('button', { type: 'button', class: `kd-chip dn-modo${on ? ' on' : ''}`, role: 'radio', 'aria-checked': String(on), 'aria-label': label || txt, onclick: fn }, txt);
  const entrada = () => {
    S.reset(); Au.reset(); jogando = false;
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, 'detetive note'),
      h('p', { class: 'jg-p' }, 'escute o ritmo e monte ele com as cartas, na ordem certa. escolha o jeito:'),
      h('div', { class: 'dn-modos', role: 'radiogroup', 'aria-label': 'Modo' }, ...MODOS.map((m) => chip(m === 'normal' ? 'figuras' : `${EMOJI_MODO[m]} ${TEMAS[m].nome}`, modo === m, () => { modo = m; setGame('detetive', { modo }); entrada(); }, m === 'normal' ? 'normal (figuras)' : TEMAS[m].nome))),
      h('button', { class: 'btn primary wide', type: 'button', onclick: () => { rodada = 0; primeira = 0; jogando = true; nova(); } }, 'jogar'));
  };
  const ouvir = () => { Au.reset(); audio(); schedule(secreto, BPM, { play: true }); };
  const nova = () => { S.reset(); secreto = sortear(); slots = []; errou = false; marcas = null; desenha(); Au.later(ouvir, 400); };
  const desenha = () => {
    const cs = cartas(modo); const cheio = slots.length === 4;
    const casas = Array.from({ length: 4 }, (_, i) => { const c = slots[i] != null ? cs.find((x) => x.cell === slots[i]) : null; const m = marcas ? marcas[i] : null;
      return h('button', { type: 'button', class: `dn-slot${c ? ' cheia' : ''}${m === true ? ' ok' : m === false ? ' no' : ''}`, 'aria-label': c ? `tempo ${i + 1}: tirar` : `tempo ${i + 1} vazio`, onclick: () => { if (c) { slots = slots.slice(0, i); marcas = null; desenha(); } } },
        c ? face(c, modo) : h('small', {}, String(i + 1))); });
    const baralho = cs.map((c) => h('button', { type: 'button', class: 'dn-card', disabled: cheio, 'aria-label': c.cell === '0000' ? 'pausa' : c.id ? foodOf(c.id).word : c.cell, onclick: () => { if (slots.length < 4) { soa(c.cell); slots = [...slots, c.cell]; marcas = null; desenha(); } } }, face(c, modo)));
    root.replaceChildren(h('p', { class: 'dn-prog' }, `rodada ${rodada + 1} de ${RODADAS}`),
      h('button', { class: 'btn primary wide dn-ouvir', type: 'button', onclick: ouvir }, '▶ ouvir o ritmo'),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, errou ? 'quase! os vermelhos estão errados: ouça de novo e troque.' : 'monte na ordem que você ouviu:'),
      h('div', { class: 'dn-slots' }, ...casas), h('div', { class: 'dn-baralho' }, ...baralho),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', disabled: !cheio, onclick: confere }, 'conferir'), slots.length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { slots = []; marcas = null; desenha(); } }, 'limpar') : null));
  };
  const confere = () => {
    if (acertou(slots, secreto)) {
      if (!errou) primeira++; marcas = secreto.map(() => true); desenha(); const el = root.querySelector('.dn-slots'); FB.win(el); Au.reset(); soa('1000');
      S.later(() => { rodada++; if (rodada >= RODADAS) fim(); else nova(); }, 1200);
    } else { errou = true; marcas = conferir(slots, secreto); desenha(); FB.lose(root.querySelector('.dn-slots')); }
  };
  const fim = () => {
    S.reset(); Au.reset(); jogando = false; const est = estrelas(primeira);
    if (est) import('../figurinhas/mesa.js').then((M) => M.vitoria('detetive', est)).catch(() => {});
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, `${primeira} de ${RODADAS} de primeira`), h('p', { class: 'jg-p' }, est === 3 ? 'detetive de ouro! ⭐⭐⭐' : est === 2 ? 'muito bem! ⭐⭐' : est === 1 ? 'bom começo! ⭐' : 'bora treinar mais um pouco'),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { rodada = 0; primeira = 0; jogando = true; nova(); } }, 'jogar de novo'), h('button', { class: 'btn', type: 'button', onclick: entrada }, 'mudar o modo')));
  };
  window.__detetive = { get secreto() { return secreto; } }; // só pros testes automáticos
  entrada();
  return { inProgress: () => jogando, restart: () => { if (!gone) entrada(); }, destroy() { gone = true; S.dispose(); Au.dispose(); delete window.__detetive; } };
}
