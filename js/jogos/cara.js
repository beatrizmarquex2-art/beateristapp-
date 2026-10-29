// Cara a cara dos instrumentos: tela. Dados em cara-data.js, regras em cara-logic.js.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as K from './cara-logic.js';
import { INSTRUMENTS, BY_ID, QUESTIONS } from './cara-data.js';
import { getGame, setGame, sfx } from './base.js';

const ID = 'cara';

export function mount(host) {
  let gone = false;
  const saved = getGame(ID);
  const prefs = { manual: saved.manual === true };
  let g = null; let picked = null; let msg = '';
  const root = h('div', { class: 'jg jg-cara' }); host.replaceChildren(root);
  const persist = () => setGame(ID, { ...prefs, game: g && !g.over ? g : null, best: saved.best });

  function intro() {
    g = null; picked = null;
    const resume = K.validGame(saved.game) && !saved.game.over ? saved.game : null;
    const seg = h('div', { class: 'jg-seg', role: 'radiogroup' }, ...[[false, 'automático'], [true, 'manual']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.manual === v), class: prefs.manual === v ? 'on' : '', onclick: () => { prefs.manual = v; setGame(ID, { manual: v }); intro(); } }, l)));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'cara a cara'), h('p', { class: 'jg-p' }, 'o paul escolheu um instrumento em segredo. faça perguntas de sim ou não e descubra qual é. você tem 3 chutes.'),
      h('p', { class: 'jg-lab' }, 'eliminar cartas'), seg,
      h('p', { class: 'jg-p muted' }, prefs.manual ? 'manual: você vira as cartas sozinho e pode desfazer a última virada.' : 'automático: cada resposta tira as cartas que não combinam.'),
      saved.best ? h('p', { class: 'jg-p muted' }, `seu recorde: ${saved.best} pergunta${saved.best === 1 ? '' : 's'}`) : null,
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(K.newGame(prefs)) }, resume ? 'nova partida' : 'iniciar')),
    ].filter(Boolean));
  }
  function begin(game) { g = game; picked = null; msg = ''; persist(); draw(); }

  function card(inst) {
    const gone = !K.candidates(g).includes(inst.id); const wrong = g.wrong.includes(inst.id); const flipped = g.flips.includes(inst.id);
    const state = wrong ? 'chute errado' : (flipped || g.out.includes(inst.id)) ? 'eliminado' : '';
    return h('div', { class: `jg-ccell${gone ? ' out' : ''}${picked === inst.id ? ' sel' : ''}` },
      h('button', { type: 'button', class: 'jg-cbtn', disabled: g.over || gone, 'aria-pressed': String(picked === inst.id), 'aria-label': `${inst.name}${state ? `, ${state}` : ''}`, onclick: () => { picked = picked === inst.id ? null : inst.id; sfx('tap'); draw(); } },
        h('img', { src: `assets/jogos/instrumentos/${inst.img}.webp`, alt: '', draggable: 'false' }), h('small', {}, inst.name), gone ? h('i', { class: 'jg-x', 'aria-hidden': 'true' }, '✕') : null),
      g.manual && !g.over && !wrong ? h('button', { type: 'button', class: 'jg-flip', 'aria-pressed': String(flipped), onclick: () => { g = K.flip(g, inst.id); if (picked === inst.id) picked = null; sfx('tap'); persist(); draw(); } }, flipped ? 'desvirar' : 'virar') : null);
  }

  function draw() {
    const left = K.candidates(g).length;
    root.replaceChildren(...[
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, 'perguntas'), h('span', {}, String(g.asked.length))), h('div', { class: 'jg-who' }, h('b', {}, 'chutes'), h('span', { 'aria-label': `${g.lives} de 3` }, '♥'.repeat(g.lives) + '♡'.repeat(K.LIVES - g.lives))), h('div', { class: 'jg-who' }, h('b', {}, 'em jogo'), h('span', {}, String(left)))),
      h('div', { class: 'jg-cgrid', role: 'group', 'aria-label': 'instrumentos' }, ...INSTRUMENTS.map(card)),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      g.over ? result() : picked ? h('div', { class: 'jg-pick', role: 'group', 'aria-label': 'confirmar chute' }, h('b', {}, `é o ${BY_ID[picked].name}?`), h('button', { class: 'btn small primary', type: 'button', onclick: () => doGuess(picked) }, 'sim, chutar'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { picked = null; draw(); } }, 'cancelar')) : null,
      !g.over ? h('div', { class: 'jg-qs', role: 'group', 'aria-label': 'perguntas' }, h('b', {}, 'pergunte:'), ...QUESTIONS.map((q) => h('button', { type: 'button', class: 'jg-qbtn', disabled: K.alreadyAsked(g, q.id), onclick: () => ask(q.id) }, q.text))) : null,
      g.manual && !g.over ? h('button', { class: 'btn small ghost', type: 'button', disabled: !g.flips.length, onclick: () => { g = K.undoFlip(g); persist(); draw(); } }, 'desfazer última virada') : null,
      g.asked.length ? h('div', { class: 'jg-hist2', 'aria-label': 'histórico de perguntas' }, h('b', {}, 'histórico'), h('ol', { reversed: true }, ...g.asked.slice().reverse().map((a) => h('li', {}, h('b', {}, a.yes ? 'sim' : 'não'), ` · ${a.text}`)))) : null,
    ].filter(Boolean));
  }
  function ask(qid) {
    g = K.ask(g, qid); const a = g.asked.at(-1);
    msg = `${a.yes ? 'sim' : 'não'}. ${a.why}${g.manual ? '' : a.removed.length ? ` saíram ${a.removed.length} carta${a.removed.length === 1 ? '' : 's'}.` : ''}`; sfx('tap'); persist(); draw();
  }
  function doGuess(id) {
    const ok = id === g.secret; g = K.guess(g, id); picked = null;
    if (ok) { msg = ''; sfx('win'); } else { msg = g.over ? '' : `não era o ${BY_ID[id].name}. ele sai do jogo.`; sfx(g.over ? 'lose' : 'bad'); }
    if (g.over && g.result.win && (!saved.best || g.asked.length < saved.best)) saved.best = g.asked.length;
    persist(); draw();
  }
  function result() {
    const s = BY_ID[g.secret]; const r = g.result;
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, r.win ? 'acertou! 🤘' : 'acabaram os chutes'),
      h('img', { class: 'jg-qimg', src: `assets/jogos/instrumentos/${s.img}.webp`, alt: s.name }),
      h('p', {}, `o paul tinha escolhido: ${s.name}`), h('p', { class: 'muted' }, `${r.questions} pergunta${r.questions === 1 ? '' : 's'} · ${r.wrong} chute${r.wrong === 1 ? '' : 's'} errado${r.wrong === 1 ? '' : 's'}`),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => begin(K.newGame(prefs)) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }
  intro();
  return {
    inProgress: () => !!(g && !g.over && (g.asked.length || g.wrong.length)),
    restart: async () => { if (g && !g.over && (g.asked.length || g.wrong.length) && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() { gone = true; void gone; },
  };
}
