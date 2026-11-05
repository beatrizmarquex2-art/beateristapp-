// Cara a cara dos artistas: tela. Dados em cara-artistas-data.js, regras em cara-artistas-logic.js. As cartas são as figurinhas do álbum (fotos originais, sem edição).
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as K from './cara-artistas-logic.js';
import { BY_ID, QUESTIONS, falador } from './cara-artistas-data.js';
import { getGame, setGame, sfx } from './base.js';

const ID = 'cara';
const mini = (code) => `assets/figurinhas/mini/${code}.webp`;
const foto = (code) => `assets/figurinhas/fotos/${code}.jpeg`;

/** Modo Artistas do Cara a Cara. `onTema(t)` troca de tema (instrumentos ↔ artistas) na tela de abertura. */
export function mountArtistas(host, { onTema } = {}) {
  const cur = () => getGame(ID).artistas || {};
  const prefs = { manual: cur().manual === true }; let best = cur().best;
  const fala = falador(); let g = null; let picked = null; let msg = ''; let say = '';
  const root = h('div', { class: 'jg jg-cara jg-cara-art' }); host.replaceChildren(root);
  const store = () => setGame(ID, { artistas: { manual: prefs.manual, game: g && !g.over ? g : null, best } });
  const paulBox = () => (say ? h('div', { class: 'jg-fala', role: 'status', 'aria-live': 'polite' }, h('img', { src: 'assets/paul/e02.webp', alt: '', width: 40, height: 33, draggable: 'false' }), h('p', {}, say)) : null);
  const temaRow = () => h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': 'tema' }, ...[['instrumentos', 'instrumentos'], ['artistas', 'artistas']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === 'artistas'), class: v === 'artistas' ? 'on' : '', onclick: () => { if (v !== 'artistas' && onTema) onTema(v); } }, l)));

  function intro() {
    g = null; picked = null; say = '';
    const saved = cur().game; const resume = K.validGame(saved) && !saved.over ? saved : null;
    const seg = h('div', { class: 'jg-seg', role: 'radiogroup' }, ...[[false, 'automático'], [true, 'manual']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.manual === v), class: prefs.manual === v ? 'on' : '', onclick: () => { prefs.manual = v; setGame(ID, { artistas: { ...cur(), manual: v } }); intro(); } }, l)));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'cara a cara'), h('p', { class: 'jg-lab' }, 'tema'), temaRow(),
      h('p', { class: 'jg-p' }, 'o paul escolheu uma figurinha em segredo entre 16 artistas e bandas. faça perguntas de sim ou não e descubra quem é. você tem 3 chutes.'),
      h('p', { class: 'jg-lab' }, 'eliminar cartas'), seg,
      h('p', { class: 'jg-p muted' }, prefs.manual ? 'manual: você vira as cartas sozinho e pode desfazer a última virada.' : 'automático: cada resposta tira as cartas que não combinam.'),
      best ? h('p', { class: 'jg-p muted' }, `seu recorde: ${best} pergunta${best === 1 ? '' : 's'}`) : null,
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume, false) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(K.newGame(prefs)) }, resume ? 'nova partida' : 'iniciar')),
    ].filter(Boolean));
  }
  function begin(game, novo = true) { g = game; picked = null; msg = ''; say = novo ? fala('abertura') : ''; store(); draw(); }

  function card(id) {
    const a = BY_ID[id]; const out = g.out.includes(id); const wrong = g.wrong.includes(id); const flipped = g.flips.includes(id); const gone = out || wrong || flipped;
    const state = wrong ? 'chute errado' : gone ? 'eliminado' : '';
    return h('div', { class: `jg-ccell${gone ? ' out' : ''}${picked === id ? ' sel' : ''}` },
      h('button', { type: 'button', class: 'jg-cbtn jg-cart', disabled: g.over || gone, 'aria-pressed': String(picked === id), 'aria-label': `${a.short}${state ? `, ${state}` : ''}`, onclick: () => { picked = picked === id ? null : id; sfx('tap'); draw(); } },
        h('img', { src: mini(g.photos[id]), alt: '', loading: 'lazy', draggable: 'false', onerror: (e) => { e.target.style.visibility = 'hidden'; } }), h('small', {}, a.short), gone ? h('i', { class: 'jg-x', 'aria-hidden': 'true' }, '✕') : null),
      g.manual && !g.over && !wrong ? h('button', { type: 'button', class: 'jg-flip', 'aria-pressed': String(flipped), onclick: () => { g = K.flip(g, id); if (picked === id) picked = null; sfx('tap'); store(); draw(); } }, flipped ? 'desvirar' : 'virar') : null);
  }

  function draw() {
    root.replaceChildren(...[
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, 'perguntas'), h('span', {}, String(g.asked.length))), h('div', { class: 'jg-who' }, h('b', {}, 'chutes'), h('span', { 'aria-label': `${g.lives} de 3` }, '♥'.repeat(g.lives) + '♡'.repeat(K.LIVES - g.lives))), h('div', { class: 'jg-who' }, h('b', {}, 'cartas'), h('span', {}, String(K.candidates(g).length)))),
      paulBox(),
      h('div', { class: 'jg-cgrid jg-cgrid4', role: 'group', 'aria-label': 'artistas' }, ...g.deck.map(card)),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      g.over ? result() : picked ? h('div', { class: 'jg-pick', role: 'group', 'aria-label': 'confirmar chute' }, h('b', {}, `é ${BY_ID[picked].short}?`), h('button', { class: 'btn small primary', type: 'button', onclick: () => doGuess(picked) }, 'sim, chutar'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { picked = null; draw(); } }, 'não')) : null,
      !g.over ? h('div', { class: 'jg-qs', role: 'group', 'aria-label': 'perguntas' }, h('b', {}, 'pergunte:'), ...QUESTIONS.map((q) => h('button', { type: 'button', class: 'jg-qbtn', disabled: K.alreadyAsked(g, q.id), onclick: () => ask(q.id) }, q.text))) : null,
      g.manual && !g.over ? h('button', { class: 'btn small ghost', type: 'button', disabled: !g.flips.length, onclick: () => { g = K.undoFlip(g); store(); draw(); } }, 'desfazer última virada') : null,
      g.asked.length ? h('div', { class: 'jg-hist2', 'aria-label': 'histórico de perguntas' }, h('b', {}, 'histórico'), h('ol', { reversed: true }, ...g.asked.slice().reverse().map((a) => h('li', {}, h('b', {}, a.yes ? 'sim' : 'não'), ` · ${a.text}`)))) : null,
    ].filter(Boolean));
  }
  function ask(qid) {
    g = K.ask(g, qid); const a = g.asked.at(-1); const left = K.candidates(g).length;
    msg = `${a.yes ? 'sim' : 'não'}. ${a.why}${g.manual ? '' : a.removed.length ? ` saíram ${a.removed.length} carta${a.removed.length === 1 ? '' : 's'}.` : ''}`;
    say = !g.manual && left === 1 ? fala('uma') : !g.manual && left <= 3 ? fala('poucas', { k: left }) : fala(a.yes ? 'sim' : 'nao'); sfx('tap'); store(); draw();
  }
  function doGuess(id) {
    const ok = id === g.secret; g = K.guess(g, id); picked = null; const a = BY_ID[id];
    if (ok) { msg = ''; say = fala('acerto', { n: a.short }); sfx('win'); } else { msg = g.over ? '' : `não era ${a.short}. ele(a) sai do jogo.`; say = g.over ? fala('erroFinal', { n: BY_ID[g.secret].short }) : g.lives === 1 ? fala('ultimaVida') : fala('chuteErrado', { n: a.short }); sfx(g.over ? 'lose' : 'bad'); }
    if (g.over && g.result.win && (!best || g.asked.length < best)) { best = g.asked.length; say = `${say} ${fala('recorde', { q: best })}`; }
    store(); draw();
  }
  function result() {
    const s = BY_ID[g.secret]; const r = g.result; const code = g.photos[g.secret];
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, r.win ? 'acertou! 🤘' : 'acabaram os chutes'),
      h('img', { class: 'jg-qimg jg-foto', src: foto(code), alt: s.short, onerror: (e) => { e.target.src = mini(code); } }),
      h('p', {}, `o paul tinha escolhido: ${s.short}`), h('p', { class: 'muted' }, `figurinha ${code} · ${r.questions} pergunta${r.questions === 1 ? '' : 's'} · ${r.wrong} chute${r.wrong === 1 ? '' : 's'} errado${r.wrong === 1 ? '' : 's'}`),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { begin(K.newGame(prefs)); say = fala('novaPartida'); draw(); } }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }
  intro();
  return {
    inProgress: () => !!(g && !g.over && (g.asked.length || g.wrong.length)),
    restart: async () => { if (g && !g.over && (g.asked.length || g.wrong.length) && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() { /* sem timers */ },
  };
}
