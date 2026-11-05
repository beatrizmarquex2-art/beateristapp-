// Bingo musical: tela (solo, dupla e modo professor). Regras em bingo-logic.js.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as B from './bingo1-logic.js';
import { artEl } from './bingo-art.js';
import { getGame, setGame, sfx, reduced } from './base.js';

const ID = 'bingo';
const MODES = [['solo', 'solo · 1 cartela'], ['dupla', 'dupla · 2 cartelas'], ['prof', 'professor · só o sorteador']];
const GOALS = [['linha', 'linha ou coluna'], ['cheia', 'cartela cheia']];
const AUTO_MS = 6000;
const pic = (it, cls = 'jg-bpic') => h('span', { class: cls, 'aria-hidden': 'true' }, it.img ? h('img', { src: `assets/jogos/instrumentos/${it.img}.webp`, alt: '', draggable: 'false', decoding: 'async' }) : artEl(it.id));

// `opts.mission` (Modo Aventura): partida fixa pelos params da missão, sem menus, sem retomar nem gravar nada do modo livre; avisa `opts.onResult` uma vez no fim real.
export function mount(host, opts) {
  const M = opts && opts.mission ? opts.mission : null; const MP = (M && M.params) || {};
  let gone = false; let timer = 0; let fin = false; const ms = { rm: 0, rb: 0 };
  const saved = M ? {} : getGame(ID);
  const prefs = { mode: MODES.some((m) => m[0] === saved.mode) ? saved.mode : 'solo', goal: saved.goal === 'cheia' ? 'cheia' : 'linha' };
  let g = null; let msg = ''; let auto = false; let flash = false;
  const root = h('div', { class: 'jg jg-bingo' }); host.replaceChildren(root);
  const persist = () => { if (!M) setGame(ID, { ...prefs, game: g && !g.over ? g : null }); };
  const stop = () => { clearTimeout(timer); timer = 0; };

  function intro() {
    stop(); auto = false; g = null;
    const resume = B.validGame(saved.game) && !saved.game.over ? saved.game : null;
    const seg = (key, list) => h('div', { class: 'jg-seg', role: 'radiogroup' }, ...list.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs[key] === v), class: prefs[key] === v ? 'on' : '', onclick: () => { prefs[key] = v; setGame(ID, { [key]: v }); intro(); } }, l)));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'bingo'), h('p', { class: 'jg-p' }, 'sorteie um item, marque na cartela e grite “bingo!”. os sons são só feedback, não são os instrumentos de verdade.'),
      h('p', { class: 'jg-lab' }, 'modo'), seg('mode', MODES),
      prefs.mode !== 'prof' ? h('p', { class: 'jg-lab' }, 'vitória por') : null, prefs.mode !== 'prof' ? seg('goal', GOALS) : null,
      h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'), h('ul', {}, h('li', {}, 'cartela 4×4 com 16 dos 24 itens, sem casa livre.'), h('li', {}, 'só dá para marcar um item que já foi sorteado.'), h('li', {}, 'bingo! confere as casas marcadas e sorteadas.'))),
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(B.newGame(prefs)) }, resume ? 'nova partida' : 'iniciar')),
    ].filter(Boolean));
  }
  function begin(game) { g = game; msg = ''; auto = false; persist(); draw(); }

  function drawerPanel() {
    const cur = B.current(g); const it = cur ? B.ITEM[cur] : null; const left = B.remaining(g);
    const big = g.mode === 'prof';
    return h('div', { class: `jg-drawer${big ? ' jg-bigmode' : ''}`, 'aria-live': 'polite' },
      h('div', { class: `jg-call${flash ? ' flash' : ''}`, role: 'status' }, it ? [pic(it, 'jg-cpic'), h('b', {}, it.name), h('small', {}, it.desc)] : h('b', {}, 'ainda não sorteou nada')),
      h('p', { class: 'jg-p' }, `restam ${left} de 24`),
      h('div', { class: 'jg-actions row' },
        h('button', { class: 'btn primary', type: 'button', disabled: g.over || left === 0, onclick: () => next(true) }, left ? (M && MP.limit != null && g.drawn >= MP.limit ? 'sortear (passa do limite!)' : 'sortear') : 'acabou o sorteio'),
        M ? null : h('button', { class: 'btn small', type: 'button', disabled: g.over || left === 0, 'aria-pressed': String(auto), onclick: toggleAuto }, auto ? 'pausar automático' : 'automático (6 s)'),
        big ? [h('button', { class: 'btn small ghost', type: 'button', disabled: !cur, onclick: repeat }, 'repetir chamada'), h('button', { class: 'btn small ghost', type: 'button', onclick: fullscreen }, 'tela cheia'), h('button', { class: 'btn small ghost', type: 'button', onclick: resetDraw }, 'zerar sorteio')] : null),
      left === 0 && !g.over && g.mode !== 'prof' ? h('p', { class: 'jg-msg' }, 'todos foram sorteados: complete as marcas e confira o bingo') : null,
      h('div', { class: 'jg-hist', role: 'list', 'aria-label': 'histórico de sorteados' }, ...B.calledIds(g).slice().reverse().map((id) => h('span', { class: 'jg-chip', role: 'listitem' }, B.ITEM[id].name))));
  }

  function cardGrid(ci) {
    const win = g.over && g.result.lines[ci] ? new Set(g.result.lines[ci]) : null; const called = new Set(B.calledIds(g));
    return h('div', { class: 'jg-bcard', role: 'group', 'aria-label': `cartela ${ci + 1}` }, g.cards[ci].map((id, cell) => {
      const it = B.ITEM[id]; const on = g.marks[ci][cell];
      return h('button', { type: 'button', class: `jg-bcell${on ? ' on' : ''}${win && win.has(cell) ? ' win' : ''}${g.cat && g.cat.includes(id) ? ' cat' : ''}`, style: g.cat && g.cat.includes(id) ? 'border-color:#1b8fb8;box-shadow:0 0 0 3px #4fd2ff' : null, 'aria-pressed': String(on), 'aria-label': `${it.name}${on ? ', marcado' : called.has(id) ? ', já sorteado' : ''}`, disabled: g.over, onclick: () => mark(ci, cell) },
        pic(it), h('small', {}, it.name), on ? h('i', { class: 'jg-stamp', 'aria-hidden': 'true' }, '●') : null);
    }));
  }

  function draw() {
    if (g.mode === 'prof') { root.replaceChildren(drawerPanel()); return; }
    root.replaceChildren(...[
      g.cards.length > 1 ? h('div', { class: 'jg-seg', role: 'tablist' }, ...g.cards.map((_, i) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(g.active === i), class: g.active === i ? 'on' : '', onclick: () => { g.active = i; persist(); draw(); } }, `cartela ${i + 1}`))) : null,
      M ? missionBar() : null, drawerPanel(), cardGrid(g.active),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      g.over ? result() : h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: bingo }, `bingo!${g.cards.length > 1 ? ` (cartela ${g.active + 1})` : ''}`)),
    ].filter(Boolean));
  }

  function next(user) {
    if (!g || g.over || B.remaining(g) === 0) { auto = false; return; }
    if (M && MP.limit != null && g.drawn >= MP.limit) { finishMission(false, 'limite'); return; }
    g = B.drawNext(g); msg = ''; sfx('draw'); flash = !reduced(); persist(); draw(); flash = false;
    if (B.remaining(g) === 0) { auto = false; stop(); draw(); } else if (auto) schedule();
    void user;
  }
  function schedule() { stop(); if (auto && !document.hidden && !gone && g && !g.over) timer = setTimeout(() => { timer = 0; next(false); }, AUTO_MS); }
  function toggleAuto() { auto = !auto; if (auto) schedule(); else stop(); draw(); }
  function repeat() { flash = !reduced(); draw(); flash = false; sfx('tap'); }
  function fullscreen() { try { const el = root; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); } catch { /* sem tela cheia */ } }
  async function resetDraw() { if (B.calledIds(g).length && !(await confirmSheet('zerar o sorteio?', 'o histórico será apagado.', 'zerar'))) return; stop(); auto = false; g = B.newGame({ mode: 'prof', goal: g.goal }); persist(); draw(); }

  function mark(ci, cell) {
    const r = B.toggleMark(g, ci, cell);
    if (!r.ok) {
      msg = r.reason === 'nao-sorteado' ? `“${B.ITEM[g.cards[ci][cell]].name}” ainda não foi sorteado. espere a chamada!` : ''; sfx('bad');
      if (M && r.reason === 'nao-sorteado') { ms.rm++; if (MP.strict) { draw(); finishMission(false, 'erro'); return; } }
      draw(); return;
    }
    g = r.g; msg = ''; sfx('tap'); persist(); draw();
  }
  function bingo() {
    const r = B.declare(g, g.active);
    if (!r.ok) {
      msg = 'ainda não: confira se a combinação inteira está marcada e já foi sorteada'; sfx('bad');
      if (M) { ms.rb++; if (MP.strict) { draw(); finishMission(false, 'erro'); return; } }
      draw(); return;
    }
    g = r.g; stop(); auto = false; persist(); sfx('win'); draw();
    if (M) finishMission(true, 'bingo');
  }
  /* ---------- Modo Aventura ---------- */
  const GOAL_TXT = { linha: 'uma linha ou coluna', lincol: 'uma linha e uma coluna', duas: 'duas linhas', cheia: 'a cartela cheia' };
  function guideText() {
    if (!MP.guide || g.over) return '';
    const called = new Set(B.calledIds(g)); const pend = g.cards[0].some((id, c) => called.has(id) && !g.marks[0][c]);
    if (!g.drawn) return 'passo 1: toque em “sortear” para chamar o primeiro item.';
    if (B.winning(g, 0)) return 'a combinação está completa! toque em “bingo!”.';
    if (pend) return 'passo 2: o item chamado está na sua cartela? toque nele para marcar.';
    return 'esse item não está na cartela. toque em “sortear” de novo.';
  }
  function missionBar() {
    const lim = MP.limit != null ? ` de ${MP.limit}` : ''; const cat = g.cat ? ` · alvo: ${B.CATS[MP.cat].name} (casas com borda azul)` : '';
    const guide = guideText();
    return h('div', { class: 'jg-mbar' }, h('p', { class: 'jg-p', role: 'status' }, `objetivo: ${GOAL_TXT[g.goal]}${cat}`),
      h('p', { class: 'jg-p' }, `sorteios: ${g.drawn}${lim} · erros: ${ms.rm + ms.rb}${MP.strict ? ' (qualquer erro encerra a tentativa)' : ''}`),
      guide ? h('p', { class: 'jg-msg jg-guide', 'aria-live': 'polite' }, guide) : null);
  }
  function finishMission(won, reason) {
    if (fin || !M) return; fin = true; stop(); auto = false;
    if (!won) { g = { ...g, over: true, result: { winners: [], lines: {}, tie: false, reason } }; sfx('lose'); msg = reason === 'limite' ? 'passou do limite de sorteios.' : 'houve um erro e esta missão não aceita erros.'; draw(); }
    if (typeof opts.onResult === 'function') opts.onResult({ won, reason, draws: g.drawn, marks: g.marks[0].slice(), refusedMarks: ms.rm, refusedBingo: ms.rb, goal: g.goal, seed: MP.seed });
  }
  function result() {
    if (M) return h('p', { class: 'jg-msg', role: 'status' }, g.result.reason === 'bingo' ? 'bingo! a combinação vencedora está destacada.' : 'tentativa encerrada.');
    const w = g.result.winners;
    const title = g.result.tie ? 'empate! as duas cartelas valem' : g.cards.length > 1 ? `cartela ${w[0] + 1} venceu!` : 'bingo! você venceu 🤘';
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, title), h('p', {}, 'a combinação vencedora está destacada. dá para revisar a cartela.'),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => begin(B.newGame(prefs)) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  const onVis = () => { if (document.hidden) stop(); else if (auto) schedule(); };
  document.addEventListener('visibilitychange', onVis);
  if (M) begin(B.newMissionGame(MP)); else intro();
  return {
    inProgress: () => !!(g && !g.over && B.calledIds(g).length > 0),
    restart: async () => { if (M) return; if (g && !g.over && B.calledIds(g).length && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() { gone = true; stop(); document.removeEventListener('visibilitychange', onVis); if (document.fullscreenElement) { try { document.exitFullscreen(); } catch { /* ok */ } } },
  };
}
