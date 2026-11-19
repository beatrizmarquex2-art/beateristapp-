// Jogos de toque da Fuga do Estúdio (lote 1): Genius, caminho 3×3 e memória de notas. Sem microfone: só toque.
// Todos têm o mesmo molde da casa (dicas.js): `mount(box, { nivel, fim, area })` desenha dentro de `box`, chama `fim()` quando acaba
// e devolve `{ stats() }` com `{ erros, found, total, estrelas }`. Pra criar um jogo novo: escreva a função, ponha em MINI e em TIPOS (fuga-logic.js).
import { h } from '../util.js';
import { audio, kick, snare, hihat, cymbal, tom } from '../audio.js';
import { epiano } from '../synth.js';
import { symbolEl } from './cartas-simbolos.js';
import { NIVEL_CFG } from './fuga-logic.js';
import { padsDe, sequenciaGenius, confere, estrelasGenius, caminho3x3, NOTAS_3X3, estrelasCaminho, paresMemoria, cartasMemoria, formaPar, estrelasMemoria } from './fuga-mini-logic.js';

const viva = (box) => box.isConnected; // timers de uma porta que já foi fechada não fazem mais nada
const agora = () => audio().currentTime + 0.02;
const toca = (pad) => {
  try {
    const t = agora();
    if (pad.midi) epiano(t, [pad.midi], 0.45, 1);
    else if (pad.som === 'kick') kick(t, 1); else if (pad.som === 'snare') snare(t, 1); else if (pad.som === 'hihat') hihat(t, 1); else if (pad.som === 'cymbal') cymbal(t, false, 1); else if (pad.som === 'surdo') tom(t, 95, 1); else tom(t, 190, 1);
  } catch { /* sem áudio */ }
};
const erroSom = () => { try { epiano(agora(), [43], 0.35, 0.9); } catch { /* sem áudio */ } };

/* ---------- Genius: repete a sequência de sons ---------- */
export function genius(box, { nivel = 'facil', fim = () => {}, area = 'notas' } = {}) {
  const cfg = NIVEL_CFG[nivel].genius; const pads = padsDe(area, cfg.pads); const seq = sequenciaGenius(cfg.rodadas, pads.length);
  let rodada = 1; let pos = 0; let erros = 0; let vez = false; let feitas = 0; let acabou = false; const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(() => { if (viva(box)) fn(); }, ms)); };
  const conta = h('p', { class: 'tr-count' }); const msg = h('p', { class: 'fgm-msg', role: 'status' }, 'toque em começar e ouça a sequência');
  const botoes = pads.map((p, i) => h('button', { type: 'button', class: 'fgm-pad', 'data-pad': String(i), style: `--c:${p.cor}`, disabled: true, 'aria-label': p.nome, onclick: () => toque(i) }, h('span', {}, p.nome)));
  const hub = h('div', { class: 'fgm-hub', 'aria-hidden': 'true' }, h('b', {}, '♪'), h('small', {}, '')); const grid = h('div', { class: `fgm-pads bmr n${pads.length}` }, ...botoes, hub);
  const acende = (i, ms = 260) => { botoes[i].classList.add('on'); later(() => botoes[i].classList.remove('on'), ms); };
  const pinta = () => { conta.textContent = `rodada ${Math.min(rodada, cfg.rodadas)} de ${cfg.rodadas} · ${erros} erro${erros === 1 ? '' : 's'}`; hub.firstChild.textContent = String(Math.min(rodada, cfg.rodadas)); hub.lastChild.textContent = `de ${cfg.rodadas}`; };
  const trava = (v) => botoes.forEach((b) => { b.disabled = v; });
  const mostra = () => { // toca os `rodada` primeiros sons
    vez = false; trava(true); pos = 0; msg.textContent = 'ouça…'; pinta();
    for (let k = 0; k < rodada; k++) later(() => { acende(seq[k], cfg.ms * 0.6); toca(pads[seq[k]]); }, 500 + k * cfg.ms);
    later(() => { vez = true; trava(false); msg.textContent = 'sua vez!'; }, 500 + rodada * cfg.ms);
  };
  function toque(i) {
    if (!vez || acabou) return; acende(i, 200); toca(pads[i]);
    const r = confere(seq.slice(0, rodada), pos, i);
    if (r === 'erro') { erros++; vez = false; trava(true); erroSom(); msg.textContent = 'ops! errou: ouça de novo'; pinta(); later(mostra, 900); return; }
    pos++;
    if (r === 'fim') {
      feitas = rodada; vez = false; trava(true);
      if (rodada >= cfg.rodadas) { acabou = true; msg.textContent = 'acertou tudo! 🎉'; pinta(); later(() => fim(), 400); return; }
      rodada++; msg.textContent = 'muito bem! próxima…'; pinta(); later(mostra, 900);
    }
  }
  const comecar = h('button', { type: 'button', class: 'btn primary wide fgm-go', onclick: () => { comecar.remove(); mostra(); } }, 'começar ▶');
  pinta(); box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, msg, grid, comecar));
  return { stats: () => ({ erros, found: feitas, total: cfg.rodadas, estrelas: estrelasGenius(erros) }) };
}

/* ---------- caminho 3×3: refaça o caminho de notas ---------- */
export function caminho(box, { nivel = 'facil', fim = () => {} } = {}) {
  const cfg = NIVEL_CFG[nivel].caminho; let n = 0; let cam = caminho3x3(cfg.len); let pos = 0; let erros = 0; let vez = false; let acabou = false; let feitos = 0; const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(() => { if (viva(box)) fn(); }, ms)); };
  const conta = h('p', { class: 'tr-count' }); const msg = h('p', { class: 'fgm-msg', role: 'status' }, 'toque em começar: um caminho de notas vai acender');
  const cel = NOTAS_3X3.map(([nome, midi], i) => h('button', { type: 'button', class: 'fgm-cel', 'data-cel': String(i), disabled: true, 'aria-label': nome, onclick: () => toque(i) }, h('span', {}, nome)));
  const grid = h('div', { class: 'fgm-grade bmr' }, ...cel);
  const trava = (v) => cel.forEach((b) => { b.disabled = v; });
  const limpa = () => cel.forEach((b) => b.classList.remove('on', 'ok', 'ruim'));
  const pinta = () => { conta.textContent = `caminho ${Math.min(n + 1, cfg.caminhos)} de ${cfg.caminhos} · ${cam.length} casas · ${erros} erro${erros === 1 ? '' : 's'}`; };
  const mostra = () => {
    vez = false; trava(true); pos = 0; limpa(); msg.textContent = 'olhe o caminho…'; pinta();
    cam.forEach((c, k) => later(() => { cel[c].classList.add('on'); try { epiano(agora(), [NOTAS_3X3[c][1]], 0.4, 1); } catch { /* sem áudio */ } later(() => cel[c].classList.remove('on'), 380); }, 600 + k * 520));
    later(() => { vez = true; trava(false); limpa(); msg.textContent = 'agora é você: refaça o caminho!'; }, 600 + cam.length * 520);
  };
  function toque(i) {
    if (!vez || acabou) return;
    if (cam[pos] !== i) { erros++; vez = false; trava(true); erroSom(); cel[i].classList.add('ruim'); msg.textContent = 'esse não! olhe de novo'; pinta(); later(mostra, 1000); return; }
    cel[i].classList.add('ok'); try { epiano(agora(), [NOTAS_3X3[i][1]], 0.4, 1); } catch { /* sem áudio */ } pos++;
    if (pos >= cam.length) {
      feitos++; vez = false; trava(true); n++;
      if (n >= cfg.caminhos) { acabou = true; msg.textContent = 'todos os caminhos! 🎉'; pinta(); later(() => fim(), 500); return; }
      msg.textContent = 'isso! outro caminho…'; cam = caminho3x3(cfg.len); later(() => { pinta(); mostra(); }, 900);
    }
  }
  const comecar = h('button', { type: 'button', class: 'btn primary wide fgm-go', onclick: () => { comecar.remove(); mostra(); } }, 'começar ▶');
  pinta(); box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, msg, grid, comecar));
  return { stats: () => ({ erros, found: feitos, total: cfg.caminhos, estrelas: estrelasCaminho(erros) }) };
}

/* ---------- memória de notas: acha os pares ---------- */
export function memoria(box, { nivel = 'facil', fim = () => {} } = {}) {
  const cfg = NIVEL_CFG[nivel].memoria; const pares = paresMemoria(cfg.pares); const cartas = cartasMemoria(pares);
  let virada = null; let trava = false; let erros = 0; let achados = 0; const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(() => { if (viva(box)) fn(); }, ms)); };
  const conta = h('p', { class: 'tr-count' });
  const pinta = () => { conta.textContent = `${achados} de ${pares.length} pares · ${erros} erro${erros === 1 ? '' : 's'}`; };
  const face = (c) => { const p = pares[c.par]; if (c.lado === 'A') return p.sym ? symbolEl(p.sym, 'fgm-sym') : h('span', {}, p.a); return h('span', {}, p.b); };
  const els = cartas.map((c) => { const b = h('button', { type: 'button', class: 'fgm-carta', 'data-par': String(c.par), 'aria-label': 'carta virada pra baixo', onclick: () => vira(c, b) }, h('span', { class: 'fgm-costas' }, '♪')); return b; });
  const mostra = (c, b) => { b.replaceChildren(face(c)); b.classList.add('up'); b.removeAttribute('aria-label'); };
  const esconde = (b) => { b.replaceChildren(h('span', { class: 'fgm-costas' }, '♪')); b.classList.remove('up'); b.setAttribute('aria-label', 'carta virada pra baixo'); };
  function vira(c, b) {
    if (trava || b.classList.contains('up') || b.classList.contains('par')) return;
    toca({ midi: 60 + (c.par % 12) * 2 }); mostra(c, b);
    if (!virada) { virada = { c, b }; return; }
    const a = virada; virada = null;
    if (formaPar(a.c, c)) { a.b.classList.add('par'); b.classList.add('par'); achados++; pinta(); if (achados >= pares.length) { trava = true; later(() => fim(), 600); } return; }
    erros++; trava = true; pinta(); later(() => { esconde(a.b); esconde(b); trava = false; }, 1000);
  }
  pinta(); box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, h('p', { class: 'fgm-msg' }, 'vire duas cartas: símbolo ou nome combinam com a explicação?'), h('div', { class: `fgm-mem bmr c${cartas.length}` }, ...els)));
  return { stats: () => ({ erros, found: achados, total: pares.length, estrelas: estrelasMemoria(erros, pares.length) }) };
}

/** Registro dos jogos de toque: o `tipo` da porta (fuga-logic.js TIPOS) aponta pra função daqui. */
export const MINI = { genius, caminho, memoria };
