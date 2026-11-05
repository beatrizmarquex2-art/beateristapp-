// Uno Musical: tela. Regras em cartas-logic.js.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as C from './cartas-logic.js';
import { getGame, setGame, sfx, figureEl, reduced } from './base.js';
import { ouvirValor } from './ouvir.js';
import { lobby, linkBadge } from './online.js';

const ID = 'cartas';
const NS = 'http://www.w3.org/2000/svg';
const svg = (inner, cls = 'jg-sym', vb = '0 0 24 24') => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
const SYM = {
  vermelho: '<path d="M12 2l3 7 7.5.6-5.7 4.9 1.8 7.4L12 18l-6.6 3.9 1.8-7.4L1.5 9.6 9 9z" fill="currentColor"/>',
  azul: '<path d="M14 1L4 14h6l-2 9 11-14h-7z" fill="currentColor"/>',
  mostarda: '<circle cx="12" cy="12" r="8" fill="currentColor"/>',
  petroleo: '<path d="M12 1l9 11-9 11-9-11z" fill="currentColor"/>',
};
const ACT = {
  pular: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="3"/>',
  inverter: '<path d="M4 8h13M13 3l5 5-5 5M20 16H7M11 11l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  curinga: '<path d="M12 12V2a10 10 0 0110 10z" fill="#BD1733"/><path d="M12 12h10a10 10 0 01-10 10z" fill="#17365B"/><path d="M12 12v10A10 10 0 012 12z" fill="#EBA332"/><path d="M12 12H2A10 10 0 0112 2z" fill="#1E7B7A"/><circle cx="12" cy="12" r="10" fill="none" stroke="#142036" stroke-width="1.4"/>',
};

/** Carta inteira: numeral no canto, figura(s) no centro e símbolo da cor. */
function face(c, small) {
  const cls = `jg-card-u c-${c.color || 'curinga'}${small ? ' sm' : ''}`;
  const corner = isNum(c) ? String(c.value) : c.kind === 'mais2' ? '+2' : '';
  const center = h('span', { class: 'jg-mid' });
  if (isNum(c)) C.FIGS[c.value].forEach((f) => center.append(figureEl(f)));
  else if (c.kind === 'mais2') center.append(h('b', { class: 'jg-plus' }, '+2'));
  else center.append(svg(ACT[c.kind], 'jg-act'));
  return h('span', { class: cls, 'aria-hidden': 'true' },
    h('i', { class: 'jg-cn' }, corner), c.color ? svg(SYM[c.color], 'jg-cs') : null, center);
}
const isNum = C.isNum;

export function mount(host, opts) {
  // Modo Aventura (opts.mission): partida contra o computador montada pelos params da missão, sem tocar no estado do Modo Livre.
  const adv = opts && opts.mission ? opts : null; const mp = adv ? (adv.mission.params || {}) : {};
  const rnd = adv ? C.seededRnd(mp.seed) : Math.random; const stats = C.newStats(); let reported = false;
  const put = (patch) => { if (!adv) setGame(ID, patch); }; // aventura nunca grava o jogo livre
  let gone = false; let timer = 0;
  const saved = adv ? {} : getGame(ID);
  const prefs = adv ? { mode: 'paul', hint: mp.hint === false ? 'sem' : 'com' } : { mode: saved.mode === 'local' ? 'local' : 'paul', hint: saved.hint === 'sem' ? 'sem' : 'com' };
  const dica = () => prefs.hint !== 'sem'; // com dica: cartas que servem ficam destacadas
  const rec = () => ({ w: 0, l: 0, e: 0, ...(saved.rec || {}) });
  let g = null; let hidden = false; let picking = null; let recorded = false;
  let conn = null; let lob = null; const badge = linkBadge();
  const me0 = () => (conn ? conn.me : 0);
  const PL = (p) => (g.mode === 'paul' ? (p === 0 ? 'você' : 'Paul') : g.mode === 'online' ? (p === me0() ? 'você' : 'o outro') : `jogador ${p + 1}`);
  const root = h('div', { class: 'jg jg-cartas' }); host.replaceChildren(root);

  const persist = () => { if (adv || (g && g.mode === 'online')) return; setGame(ID, { ...prefs, game: g && !g.over ? g : null, rec: saved.rec }); };
  const leave = () => { if (conn) { conn.close(); conn = null; } if (lob) { lob.close(); lob = null; } };
  const stop = () => { clearTimeout(timer); timer = 0; };
  const human = () => g && !g.over && !(g.mode === 'paul' && g.turn === 1) && !(g.mode === 'online' && g.turn !== me0());

  function intro() {
    stop(); leave(); g = null; picking = null;
    const resume = C.validGame(saved.game) && !saved.game.over ? saved.game : null; const r = rec();
    const seg = h('div', { class: 'jg-seg', role: 'radiogroup' }, ...[['paul', 'contra o paul'], ['local', 'dois no aparelho'], ['online', '2 celulares (código)']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.mode === v), class: prefs.mode === v ? 'on' : '', onclick: () => { prefs.mode = v; put({ mode: v }); intro(); } }, l)));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'Uno Musical'), h('p', { class: 'jg-p' }, 'números e figuras. neste jogo, a semínima vale 1 tempo: cada número é a soma das durações da carta.'),
      h('div', { class: 'jg-legend', role: 'list', 'aria-label': 'legenda dos números' }, ...[1, 2, 3, 4, 5, 6].map((v) => h('button', { type: 'button', class: 'jg-leg', role: 'listitem', onclick: () => { sfx('tap'); ouvirValor(v, (x) => C.FIGS[x]); }, 'aria-label': `${v} (toque para ouvir): ${C.FIGS[v].map((f) => ({ seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' }[f])).join(' + ')}` }, face({ color: 'azul', kind: 'num', value: v }, true), h('small', {}, C.FIGS[v].map((f) => ({ seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' }[f])).join(' + '))))),
      h('p', { class: 'jg-p muted' }, '🔊 toque numa carta da legenda (ou numa carta no jogo) pra ouvir.'),
      h('p', { class: 'jg-lab' }, 'contra quem?'), seg,
      h('p', { class: 'jg-lab' }, 'dicas'), h('div', { class: 'jg-seg', role: 'radiogroup' }, ...[['com', 'com dica'], ['sem', 'sem dica']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.hint === v), class: prefs.hint === v ? 'on' : '', onclick: () => { prefs.hint = v; put({ hint: v }); intro(); } }, l))),
      h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'), h('ul', {},
        h('li', {}, 'cada um começa com 7 cartas. jogue uma carta da mesma cor, do mesmo número ou da mesma ação que a do descarte.'),
        h('li', {}, 'tem carta que serve? tem que jogar. não tem? compre uma. se servir, jogue ou passe; se não servir, passa sozinho.'),
        h('li', {}, 'pular e inverter (com dois jogadores) fazem o adversário perder a vez. +2: ele compra duas e perde a vez. não empilha.'),
        h('li', {}, 'curinga muda a cor. as cores têm símbolo: vermelho estrela, azul raio, mostarda círculo, verde-petróleo losango.'),
        h('li', {}, 'ficou com uma carta: “uno!”. quem esvaziar a mão vence.'))),
      prefs.mode === 'online' ? (lob = lobby({ jogo: ID, makeState: () => C.newGame({ mode: 'online' }), onStart: startOnline })).el
        : h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, 'continuar partida') : null,
          h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(C.newGame({ mode: prefs.mode })) }, resume ? 'nova partida' : 'iniciar')),
      r.w + r.l + r.e ? h('p', { class: 'jg-p muted' }, `contra o paul: ${r.w} vitória${r.w === 1 ? '' : 's'} · ${r.l} derrota${r.l === 1 ? '' : 's'} · ${r.e} empate${r.e === 1 ? '' : 's'}`) : null,
    ].filter(Boolean));
  }

  function startOnline(c, state) {
    conn = c; lob = null; badge.set(true);
    c.on.link = (v) => badge.set(v);
    c.on.state = (st) => { g = st; picking = null; hidden = false; if (g.over) { const w = g.result.winner; sfx(w == null ? 'tie' : w === me0() ? 'win' : 'lose'); } else sfx('tap'); draw(); };
    g = state; recorded = false; picking = null; hidden = false; draw();
  }
  /** manda a jogada pro outro celular (só no modo 2 celulares) */
  function sync() { if (conn && g.mode === 'online') conn.push(g).then((ok) => { if (!ok) { g = { ...g, note: 'o outro celular jogou ao mesmo tempo, veja a mesa' }; } }); }
  function again() { const ng = C.newGame({ mode: prefs.mode }); if (prefs.mode === 'online') { g = ng; recorded = false; picking = null; draw(); sync(); } else begin(ng); }
  function begin(game) { g = game; recorded = false; picking = null; hidden = g.mode === 'local'; persist(); draw(); afterTurn(); }

  function paint() {
    const me = g.mode === 'paul' ? 0 : g.mode === 'online' ? me0() : g.turn; const opp = 1 - me; const hand = g.hands[me];
    const top = C.topOf(g); const canMove = human() && !hidden;
    const legal = new Set(canMove && dica() ? C.legalCards(g, me).map((c) => c.id) : []);
    const status = g.over ? '' : g.mode === 'paul' ? (g.turn === 0 ? 'sua vez' : 'vez do paul…') : g.mode === 'online' ? (g.turn === me ? 'sua vez' : 'vez do outro celular…') : `vez do ${PL(g.turn)}`;
    const canD = canMove && C.canDraw(g); const canP = canMove && C.canPass(g);
    const colorTxt = `cor ativa: ${C.COLOR_NAME[g.color]} (${C.COLOR_SYMBOL[g.color]})`;
    const last = !g.over && g.last != null ? `${PL(g.last)}: uno!` : '';
    root.replaceChildren(...[
      g.mode === 'online' ? badge.el : null,
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, g.mode === 'paul' ? (adv ? (mp.oppName || 'paul').toLowerCase() : 'paul') : g.mode === 'online' ? 'o outro' : `jogador ${opp + 1}`), h('span', {}, `${g.hands[opp].length} carta${g.hands[opp].length === 1 ? '' : 's'}`)),
        h('div', { class: 'jg-who' }, h('b', {}, 'monte'), h('span', {}, String(C.available(g))))),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, status),
      h('div', { class: 'jg-pile' },
        h('button', { type: 'button', class: `jg-deck${canD && dica() ? ' fit' : ''}`, disabled: !canD, 'aria-label': 'comprar uma carta', onclick: draw1 }, h('span', { class: 'jg-card-u back', 'aria-hidden': 'true' }, h('b', {}, '♪')), h('small', {}, 'comprar')),
        h('div', { class: 'jg-top', role: 'img', 'aria-label': `descarte: ${C.cardName(top)}` }, face(top)),
        h('div', { class: `jg-active c-${g.color}` }, svg(SYM[g.color], 'jg-cs'), h('b', {}, colorTxt))),
      adv ? h('p', { class: 'jg-p muted', role: 'status' }, `adversário: ${mp.oppName || 'Paul'} · rodada ${Math.max(1, stats.rounds)} · compras ${stats.draws} · especiais jogadas ${stats.specials}`) : null,
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, g.note), last ? h('p', { class: 'jg-last', role: 'status' }, last) : null,
      picking ? h('div', { class: 'jg-pick', role: 'group', 'aria-label': 'escolha a cor' }, h('b', {}, 'escolha a cor:'), ...C.COLORS.map((k) => h('button', { type: 'button', class: `jg-pc c-${k}`, onclick: () => play(picking, k) }, svg(SYM[k], 'jg-cs'), C.COLOR_NAME[k])), h('button', { type: 'button', class: 'btn small ghost', onclick: () => { picking = null; paint(); } }, 'cancelar')) : null,
      g.over ? result() : h('div', { class: 'jg-actions row' }, h('button', { class: 'btn small', type: 'button', disabled: !canP, onclick: pass1 }, 'passar'), canMove && g.drawn ? h('small', { class: 'muted' }, 'a carta comprada serve: jogue ou passe') : null),
      h('div', { class: 'jg-hand', role: 'group', 'aria-label': hidden ? 'mão oculta' : 'sua mão' }, hidden ? h('p', { class: 'jg-empty' }, 'mão oculta') : hand.map((c) => h('button', { type: 'button', class: `jg-hbtn${legal.has(c.id) ? ' fit' : ''}${picking === c.id ? ' sel' : ''}`, disabled: !canMove, 'aria-label': C.cardName(c) + (legal.has(c.id) ? ', pode jogar' : ''), onclick: () => pick(c) }, face(c)))),
    ].filter(Boolean));
  }
  function draw() {
    paint();
    if (!(g && g.mode === 'local' && hidden && !g.over)) return;
    root.querySelector('.jg-hand').replaceChildren();
    root.append(h('div', { class: 'jg-cover', role: 'dialog', 'aria-label': 'passe o aparelho' }, h('p', { class: 'hand' }, `passe o aparelho para o ${PL(g.turn)}`), h('p', { class: 'muted' }, 'as cartas estão escondidas'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { hidden = false; sfx('tap'); paint(); } }, `sou o ${PL(g.turn)}, mostrar minha mão`)));
    root.querySelector('.jg-cover button').focus();
  }

  function pick(c) {
    if (!human() || hidden) return; sfx('tap'); if (C.FIGS[c.value]) ouvirValor(c.value, (v) => C.FIGS[v]); // ouve o que está na carta
    if (!C.legalCards(g, g.turn).some((x) => x.id === c.id)) { g = { ...g, note: g.drawn ? 'só a carta comprada pode ser jogada' : dica() ? `essa carta não serve: o descarte é ${C.cardName(C.topOf(g))}` : 'essa carta não serve' }; sfx('bad'); paint(); return; }
    if (C.isWild(c)) { picking = c.id; paint(); return; }
    play(c.id);
  }
  function play(id, color) {
    const who = g.turn; picking = null; const before = g;
    try { g = C.applyPlay(g, who, id, color, rnd); } catch { g = { ...g, note: 'jogada inválida' }; paint(); return; }
    if (adv) C.track(stats, before, g, { type: 'play', id }, 0);
    sfx('place'); persist(); after(who);
  }
  function draw1() { if (!human() || !C.canDraw(g)) return; const who = g.turn; const before = g; g = C.applyDraw(g, who, rnd); if (adv) C.track(stats, before, g, { type: 'draw' }, 0); sfx('draw'); persist(); after(who); }
  function pass1() { if (!human() || !C.canPass(g)) return; const who = g.turn; const before = g; g = C.applyPass(g, who); if (adv) C.track(stats, before, g, { type: 'pass' }, 0); persist(); after(who); }

  /** Depois de qualquer ação: fim, troca de vez (cobre a tela no modo local) ou continua. */
  function after(who) {
    sync();
    if (g.over) return finishUp();
    if (g.mode === 'local' && g.turn !== who) hidden = true;
    draw(); afterTurn();
  }
  function afterTurn() { stop(); if (!g || g.over || gone || document.hidden) return; if (g.mode === 'paul' && g.turn === 1) timer = setTimeout(paulStep, reduced() ? 350 : 900); }
  function paulStep() {
    timer = 0; if (gone || !g || g.over || g.turn !== 1 || document.hidden) return;
    const mv = adv ? C.aiMove(g, 1, mp.style, rnd) : C.paulMove(g, 1);
    if (mv.type === 'play') { const c = g.hands[1].find((x) => x.id === mv.id); g = C.applyPlay(g, 1, mv.id, mv.color, rnd); g.note = `paul jogou ${C.cardName(c)}. ${g.note}`; sfx('place'); }
    else if (mv.type === 'draw') { g = C.applyDraw(g, 1, rnd); g.note = `paul: ${g.note.replace('comprou uma carta que serve: jogue ou passe', 'comprou uma carta')}`; sfx('draw'); }
    else { g = C.applyPass(g, 1); g.note = `paul: ${g.note}`; }
    persist(); if (g.over) return finishUp(); draw(); afterTurn();
  }
  function finishUp() {
    if (adv) { // aventura: só avisa o resultado real (uma vez); nada é gravado no jogo livre
      const w = g.result.winner; sfx(w == null ? 'tie' : w === 0 ? 'win' : 'lose'); draw();
      if (!reported) { reported = true; adv.onResult(C.matchResult(g, stats, 0)); }
      return;
    }
    if (g.mode === 'online') { sfx(g.result.winner == null ? 'tie' : g.result.winner === me0() ? 'win' : 'lose'); draw(); return; }
    if (!recorded) { recorded = true; if (g.mode === 'paul') { const r = rec(); const w = g.result.winner; if (w === 0) r.w++; else if (w === 1) r.l++; else r.e++; saved.rec = r; } }
    put({ ...prefs, game: null, rec: saved.rec });
    const w = g.result.winner; sfx(w == null ? 'tie' : g.mode === 'paul' && w === 1 ? 'lose' : 'win'); hidden = false; draw();
  }
  function result() {
    const r = g.result; const w = r.winner;
    const title = w == null ? 'empate' : g.mode === 'paul' ? (w === 0 ? 'você venceu! 🤘' : 'o paul venceu') : `${PL(w)} venceu!`;
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, title),
      h('p', {}, w == null ? 'jogo travado com o mesmo número de cartas' : r.reason === 'mao-vazia' ? `${PL(w)} descartou a última carta` : `jogo travado: ${PL(w)} ficou com menos cartas`),
      h('p', { class: 'muted' }, `cartas restantes: ${PL(0)} ${r.counts[0]} · ${PL(1)} ${r.counts[1]}`),
      adv ? null : h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: again }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  const onVis = () => { if (document.hidden) stop(); else afterTurn(); };
  document.addEventListener('visibilitychange', onVis);
  if (adv) begin(C.newGame({ mode: 'paul', rnd })); else intro();
  return {
    inProgress: () => !!(g && !g.over),
    restart: async () => { if (g && !g.over && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; stop(); intro(); },
    destroy() { gone = true; stop(); leave(); document.removeEventListener('visibilitychange', onVis); },
  };
}
