// Cara a cara dos instrumentos: tela. Dados em cara-data.js, regras em cara-logic.js.
import { h } from '../util.js';
import { placar, poseDisponivel } from './placar.js';
import { linha, chips, ajuda } from './opcoes.js';
import { confirmSheet } from '../ui.js';
import * as K from './cara-logic.js';
import { BY_ID, QUESTIONS, answerFor } from './cara-data.js';
import { getGame, setGame, sfx } from './base.js';
const MESA = { vitoria: (j, n) => import('../figurinhas/mesa.js').then((M) => M.vitoria(j, n)).catch(() => 0) }; // carrega só quando alguém ganha (mantém o jogo testável fora do navegador)

const ID = 'cara';
/** Liga/desliga o tema musical (fotos do álbum). As fotos já são liberadas pros alunos no álbum, então fica ligado. */
const MUSICAL_LIBERADO = true;

/** Dois temas no mesmo jogo: instrumentos (original) e "cara a cara musical" (artistas, Kids/Clássico). Missões do Aventura usam sempre os instrumentos. */
/** opts (opcional): { mission: { params: { pool, manual } }, onResult } = Modo Aventura (sempre instrumentos). Sem opts.mission = Modo Livre. */
export function mount(host, opts = {}) {
  let inner = null;
  let morto = false;
  const abrir = async () => {
    const musical = MUSICAL_LIBERADO && !opts.mission; // só artistas: a versão de instrumentos saiu do jogo livre
    const troca = (v) => { setGame(ID, { tema: v }); inner && inner.destroy && inner.destroy(); abrir(); };
    if (musical) { const { mountMusical } = await import('./cara-musical/tela.js'); if (morto) return; inner = mountMusical(host, { onTema: troca }); } // importado só quando usa (some do build dos alunos)
    else inner = mountInstrumentos(host, opts, { onTema: opts.mission || !MUSICAL_LIBERADO ? null : troca });
  };
  abrir();
  return { inProgress: () => !!(inner && inner.inProgress()), restart: () => inner && inner.restart(), destroy: () => { morto = true; inner && inner.destroy(); } };
}

function mountInstrumentos(host, opts, { onTema } = {}) {
  const mission = opts && opts.mission ? opts : null; const MP = mission ? (mission.mission.params || {}) : null; let reported = false;
  let gone = false;
  const saved = mission ? {} : getGame(ID);
  const prefs = { manual: mission ? MP.manual === true : saved.manual === true };
  let g = null; let picked = null; let msg = '';
  const root = h('div', { class: `jg jg-cara${mission ? ' jg-game jg-dark' : ''}` }); host.replaceChildren(root);
  const persist = () => mission || setGame(ID, { ...prefs, game: g && !g.over ? g : null, best: saved.best });

  function intro() {
    g = null; picked = null;
    const resume = K.validGame(saved.game) && !saved.game.over ? saved.game : null;
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'cara a cara'),
      h('div', { class: 'jo-card' },
        onTema ? linha('tema', chips([['instrumentos', 'instrumentos'], ['musical', 'cara a cara musical']], 'instrumentos', (v) => { if (v !== 'instrumentos') onTema(v); }, 'tema')) : null,
        linha('cartas', chips([[false, 'automático'], [true, 'manual']], prefs.manual, (v) => { prefs.manual = v; setGame(ID, { manual: v }); intro(); }, 'eliminar cartas'),
          ajuda('Eliminar cartas', prefs.manual ? 'manual: você vira as cartas sozinho e pode desfazer a última virada.' : 'automático: cada resposta tira as cartas que não combinam.')),
        linha('regras', ajuda('Como jogar', 'o paul escolheu um instrumento em segredo. faça perguntas de sim ou não e descubra qual é. você tem 3 chutes.'))),
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

  let maisQ = false;
  /** 5 perguntas que mais dividem as cartas que ainda estão em jogo (as outras ficam em "mais perguntas"). */
  function sugeridas() {
    const cand = K.candidates(g).map((id) => BY_ID[id]); const livres = QUESTIONS.filter((q) => !K.alreadyAsked(g, q.id));
    const nota = (q) => { const sim = cand.filter((i) => answerFor(i, q.id)).length; return Math.min(sim, cand.length - sim); };
    const uteis = livres.filter((q) => nota(q) > 0).sort((a, b) => nota(b) - nota(a)); const resto = livres.filter((q) => !uteis.includes(q));
    return [...uteis, ...resto].slice(0, 5);
  }
  function draw() {
    const left = K.candidates(g).length;
    root.replaceChildren(...[
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, 'perguntas'), h('span', {}, String(g.asked.length))), h('div', { class: 'jg-who' }, h('b', {}, 'chutes'), h('span', { 'aria-label': `${g.lives} de 3` }, '♥'.repeat(g.lives) + '♡'.repeat(K.LIVES - g.lives))), h('div', { class: 'jg-who' }, h('b', {}, 'em jogo'), h('span', {}, String(left)))),
      h('div', { class: 'jg-cgrid', role: 'group', 'aria-label': 'instrumentos' }, ...K.boardOf(g).map(card)),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      g.over ? result() : picked ? h('div', { class: 'jg-pick', role: 'group', 'aria-label': 'confirmar chute' }, h('b', {}, `é o ${BY_ID[picked].name}?`), h('button', { class: 'btn small primary', type: 'button', onclick: () => doGuess(picked) }, 'sim, chutar'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { picked = null; draw(); } }, 'cancelar')) : null,
      !g.over ? h('div', { class: 'jg-qs', role: 'group', 'aria-label': 'perguntas' }, h('b', {}, 'pergunte:'), ...(maisQ ? QUESTIONS : sugeridas()).map((q) => h('button', { type: 'button', class: 'jg-qbtn', disabled: K.alreadyAsked(g, q.id), onclick: () => ask(q.id) }, q.text)),
        h('button', { type: 'button', class: 'btn small ghost', onclick: () => { maisQ = !maisQ; draw(); } }, maisQ ? 'só as 5 principais' : 'mais perguntas')) : null,
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
    if (g.over && g.result.win && !mission) MESA.vitoria('cara');
    if (g.over && g.result.win && (!saved.best || g.asked.length < saved.best)) saved.best = g.asked.length;
    persist(); draw();
    if (mission && g.over && !reported) { reported = true; mission.onResult({ win: g.result.win, questions: g.result.questions, wrong: g.result.wrong, lives: g.lives, manual: g.manual, size: K.boardOf(g).length, secret: g.secret }); }
  }
  function result() {
    const s = BY_ID[g.secret]; const r = g.result;
    return placar({ classe: 'jg-result', estado: r.win ? 'win' : 'lose', pose: r.win ? poseDisponivel('selfie', 'baquetas-pra-cima') : poseDisponivel('meditando', 'ouvindo'), titulo: r.win ? 'acertou! 🤘' : 'acabaram os chutes', sub: `o paul tinha escolhido: ${s.name}`,
      extra: [h('img', { class: 'jg-qimg', src: `assets/jogos/instrumentos/${s.img}.webp`, alt: s.name })],
      quadros: [{ n: r.questions, l: r.questions === 1 ? 'pergunta' : 'perguntas', win: r.win }, { n: r.wrong, l: r.wrong === 1 ? 'chute errado' : 'chutes errados' }],
      estrelas: r.win && !mission ? '+3 ★ pra roleta' : '',
      acoes: mission ? [] : [h('button', { class: 'btn primary', type: 'button', onclick: () => begin(K.newGame(prefs)) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')] });
  }
  if (mission) begin(K.newGame({ manual: prefs.manual, pool: Array.isArray(MP.pool) ? MP.pool : null })); else intro();
  return {
    inProgress: () => !!(g && !g.over && (g.asked.length || g.wrong.length)),
    restart: async () => { if (g && !g.over && (g.asked.length || g.wrong.length) && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() { gone = true; void gone; },
  };
}
