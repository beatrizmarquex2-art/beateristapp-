// Detetive Note: a criança OUVE um ritmo de 1 compasso e MONTA ele com cartas (4 tempos). Abre direto no CAMINHO (mapa de 12 fases por modo, igual ao pauLta);
// cada fase tem 3 ritmos e a dificuldade sobe. Modos: figuras (primeiro), comida, parque, corpo e animal (cartas com desenhos).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio } from '../audio.js';
import { voz } from '../toca-som.js';
import { session } from '../session.js';
import * as N from '../notation.js';
import { layoutRhythm } from '../reading.js';
import { schedule } from '../views/treinos.js';
import { foodOf } from '../kids-logic.js';
import { svgEl } from '../kids/art.js';
import * as FB from '../feedback.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { themeOf } from '../campanha/themes.js';
import { TEMAS, MODOS, FASES, RODADAS, BPM, cartas, sortear, conferir, acertou, estrelas } from './detetive-logic.js';

const EMOJI_MODO = { comida: '🍞', parque: '🚲', corpo: '✋', animal: '🐶' };
const NOME = (m) => (m === 'normal' ? 'figuras' : `${EMOJI_MODO[m]} ${TEMAS[m].nome}`);
const face = (card, modo) => (modo === 'normal' ? svgEl(N.toSVG(layoutRhythm([card.cell], { width: 120, count: false, clef: false })), 'dn-face-fig')
  : h('span', { class: 'dn-face' }, h('i', { 'aria-hidden': 'true' }, foodOf(card.id).emoji), h('small', {}, foodOf(card.id).syl.join('-'))));
const soa = (cell, bpm = BPM) => { const c = audio(); const q = 60 / bpm; const t = c.currentTime + 0.03; [...cell].forEach((x, k) => { if (x === '1') voz(t + (k * q) / 4, 0.85); }); };

export function mount(host) {
  const saved = getGame('detetive'); let modo = MODOS.includes(saved.modo) ? saved.modo : 'normal';
  const root = h('div', { class: 'jg jg-detetive' }); host.replaceChildren(root);
  // S = tempos da tela (próxima rodada); Au = só o som (ouvir de novo não cancela nada da tela)
  const S = session(); const Au = session(); let off = null;
  let fase = 1; let secreto = null; let slots = []; let rodada = 0; let primeira = 0; let errou = false; let gone = false; let jogando = false; let marcas = null;
  const estOf = (m, n) => ((getGame('detetive').est || {})[`${m}:${n}`] || 0);
  const guardaEst = (m, n, v) => { const g = getGame('detetive'); setGame('detetive', { ...g, est: { ...(g.est || {}), [`${m}:${n}`]: v } }); };
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } S.reset(); Au.reset(); };

  /* ---------- mapa (abre aqui) ---------- */
  const mapa = () => {
    limpa(); jogando = false;
    const box = h('div', { class: 'tm-map' });
    const levels = Array.from({ length: FASES }, (_, i) => ({ id: `det:${modo}:${i + 1}`, index: i + 1, label: String(i + 1), tag: '', boss: i === FASES - 1 }));
    const have = levels.reduce((s, l) => s + estOf(modo, l.index), 0);
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Modo' }, ...MODOS.map((m) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(modo === m), class: modo === m ? 'on' : '', onclick: () => { modo = m; setGame('detetive', { ...getGame('detetive'), modo }); mapa(); } }, NOME(m))));
    root.replaceChildren(h('p', { class: 'tm-dica' }, 'escute o ritmo e monte ele com as cartas, na ordem certa.'), box);
    off = mountProgressionMap(box, {
      gameId: `detetive-${modo}`, levels, profileId: 'detetive', unitName: 'Fase', tier: 0, stars: { have, max: FASES * 3 }, theme: themeOf('toca'),
      starsOf: (id) => estOf(modo, Number(id.split(':')[2])), unlockedOf: () => true, lockedMsg: '', onOpen: (lv) => comeca(lv.index),
    });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };

  /* ---------- uma fase: 3 ritmos ---------- */
  const comeca = (n) => { limpa(); fase = n; rodada = 0; primeira = 0; jogando = true; nova(); };
  const ouvir = () => { Au.reset(); audio(); schedule(secreto, BPM, { play: true }); };
  const nova = () => { S.reset(); secreto = sortear(fase); slots = []; errou = false; marcas = null; desenha(); Au.later(ouvir, 400); };
  const topo = () => h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: mapa }, '‹ mapa'), h('b', {}, `${NOME(modo)} · fase ${fase} de ${FASES} · ritmo ${rodada + 1} de ${RODADAS}`));
  const desenha = () => {
    const cs = cartas(modo, fase); const cheio = slots.length === 4;
    const casas = Array.from({ length: 4 }, (_, i) => { const c = slots[i] != null ? cs.find((x) => x.cell === slots[i]) : null; const m = marcas ? marcas[i] : null;
      return h('button', { type: 'button', class: `dn-slot${c ? ' cheia' : ''}${m === true ? ' ok' : m === false ? ' no' : ''}`, 'aria-label': c ? `tempo ${i + 1}: tirar` : `tempo ${i + 1} vazio`, onclick: () => { if (c) { slots = slots.slice(0, i); marcas = null; desenha(); } } },
        c ? face(c, modo) : h('small', {}, String(i + 1))); });
    const baralho = cs.map((c) => h('button', { type: 'button', class: 'dn-card', disabled: cheio, 'aria-label': c.cell === '0000' ? 'pausa' : c.id ? foodOf(c.id).word : c.cell, onclick: () => { if (slots.length < 4) { soa(c.cell); slots = [...slots, c.cell]; marcas = null; desenha(); } } }, face(c, modo)));
    root.replaceChildren(topo(), h('button', { class: 'btn primary wide dn-ouvir', type: 'button', onclick: ouvir }, '▶ ouvir o ritmo'),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, errou ? 'quase! os vermelhos estão errados: ouça de novo e troque.' : 'monte na ordem que você ouviu:'),
      h('div', { class: 'dn-slots' }, ...casas), h('div', { class: 'dn-baralho', style: `--n:${cs.length}` }, ...baralho),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', disabled: !cheio, onclick: confere }, 'conferir'), slots.length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { slots = []; marcas = null; desenha(); } }, 'limpar') : null));
  };
  const confere = () => {
    if (acertou(slots, secreto)) {
      if (!errou) primeira++; marcas = secreto.map(() => true); desenha(); FB.win(root.querySelector('.dn-slots')); Au.reset(); soa('1000');
      S.later(() => { rodada++; if (rodada >= RODADAS) fim(); else nova(); }, 1200);
    } else { errou = true; marcas = conferir(slots, secreto); desenha(); FB.lose(root.querySelector('.dn-slots')); }
  };
  const fim = () => {
    S.reset(); Au.reset(); jogando = false; const est = estrelas(primeira); const antes = estOf(modo, fase);
    if (est > antes) { guardaEst(modo, fase, est); import('../figurinhas/mesa.js').then((M) => M.vitoria('detetive', est - antes)).catch(() => {}); } // só ganha a diferença sobre o melhor da fase
    root.replaceChildren(topo(), h('h2', { class: 'jg-h hand' }, `fase ${fase} concluída!`), h('p', { class: 'dn-estrelas', 'aria-label': `${est} de 3 estrelas` }, '★'.repeat(est), '☆'.repeat(3 - est)),
      h('p', { class: 'jg-p' }, `${primeira} de ${RODADAS} ritmos de primeira.${est < 3 ? ' acerte todos de primeira pra ganhar as 3 estrelas.' : ' perfeito!'}`),
      h('div', { class: 'jg-actions' }, fase < FASES ? h('button', { class: 'btn primary', type: 'button', onclick: () => comeca(fase + 1) }, 'próxima fase ▶') : null, h('button', { class: 'btn', type: 'button', onclick: () => comeca(fase) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa')));
  };
  window.__detetive = { get secreto() { return secreto; } }; // só pros testes automáticos
  mapa();
  return { inProgress: () => jogando, restart: () => { if (!gone) mapa(); }, destroy() { gone = true; limpa(); S.dispose(); Au.dispose(); delete window.__detetive; } };
}
