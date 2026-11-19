// Jogos de toque da Fuga do Estúdio (lote 1): Genius, caminho 3×3 e memória de notas. Sem microfone: só toque.
// Todos têm o mesmo molde da casa (dicas.js): `mount(box, { nivel, fim, area })` desenha dentro de `box`, chama `fim()` quando acaba
// e devolve `{ stats() }` com `{ erros, found, total, estrelas }`. Pra criar um jogo novo: escreva a função, ponha em MINI e em TIPOS (fuga-logic.js).
import { h } from '../util.js';
import { audio, kick, snare, hihat, cymbal, tom } from '../audio.js';
import { epiano } from '../synth.js';
import { symbolEl } from './cartas-simbolos.js';
import { NIVEL_CFG, cfgMini } from './fuga-logic.js';
import { itensTetrisN, ids as figIds } from './figurix-logic.js';
import { FIG_BY, FIG_NAME, beatsLabel } from '../kids/figs.js';
import { figureMarkup, restMarkup, svgEl, noteMarkup } from '../kids/art.js';
import { peçasDe, confereMonte } from './figurix-logic.js';
import { corSrc } from '../paul-cor.js';
import { estrelasPesca, estrelasMira, estrelasMontar, rodadasQA, acertaMira, alvoX, montarCfg, estrelasPorErros, padsDe, sequenciaGenius, confere, estrelasGenius, caminho3x3, NOTAS_3X3, estrelasCaminho, paresMemoria, cartasMemoria, formaPar, estrelasMemoria, REGRA_TEMPO } from './fuga-mini-logic.js';

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
export function genius(box, { nivel = 'facil', fim = () => {}, area = 'notas', extra = 0 } = {}) {
  const cfg = cfgMini(nivel, 'genius', extra); const pads = padsDe(area, cfg.pads); const seq = sequenciaGenius(cfg.rodadas, pads.length);
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
export function caminho(box, { nivel = 'facil', fim = () => {}, extra = 0 } = {}) {
  const cfg = cfgMini(nivel, 'caminho', extra); let n = 0; let cam = caminho3x3(cfg.len); let pos = 0; let erros = 0; let vez = false; let acabou = false; let feitos = 0; const timers = [];
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
export function memoria(box, { nivel = 'facil', fim = () => {}, extra = 0, assuntos = null } = {}) {
  const cfg = cfgMini(nivel, 'memoria', extra); const pares = paresMemoria(cfg.pares, Math.random, assuntos); const cartas = cartasMemoria(pares);
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
  pinta(); box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, h('p', { class: 'fgm-msg' }, 'vire duas cartas: símbolo ou nome combinam com a explicação?'), pares.some((p) => p.dur) ? h('p', { class: 'fgm-regra' }, `regra: ${REGRA_TEMPO}`) : null, h('div', { class: `fgm-mem bmr c${cartas.length}` }, ...els)));
  return { stats: () => ({ erros, found: achados, total: pares.length, estrelas: estrelasMemoria(erros, pares.length) }) };
}

/* ---------- notas caindo: a figura cai e o Paul vai pro nome certo (o "tetris" do Figurix) · queda4 = 4 faixas ---------- */
const NIVEL_QUEDA = { facil: 2, medio: 4, dificil: 5 }; // nível do Figurix: 2 = nome da figura · 4 = quanto vale · 5 = de qual figura é a pausa
const embaralha = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
/** Com 4 faixas: cada figura ganha 4 nomes (1 certo + 3 errados, sem repetir o texto) e `ok` vira o número da faixa certa. */
function itens4(itens, rotulo) {
  return itens.map((it) => {
    const certo = rotulo(it, it.fig); const outros = embaralha(figIds.filter((f) => f !== it.fig)).map((f) => rotulo(it, f)).filter((t, i, a) => t !== certo && a.indexOf(t) === i).slice(0, 3);
    const ops = embaralha([certo, ...outros]); return { ...it, ops, ok: ops.indexOf(certo) };
  });
}
export function queda(box, { nivel = 'facil', fim = () => {}, faixas = 2 } = {}) {
  const T = itensTetrisN(NIVEL_QUEDA[nivel] || 2); const rot = (it, f) => (it.rot === 'valor' ? beatsLabel(FIG_BY[f].beats) : FIG_NAME[f]);
  const quatro = faixas === 4; const itens = quatro ? itens4(T.itens, rot) : T.itens; const ms = (T.queda + (quatro ? 0.9 : 0)) * 1000; const N = quatro ? 4 : 2;
  let k = 0; let lado = 0; let t0 = 0; let raf = 0; let erros = 0; let acertos = 0; let acabou = false;
  const conta = h('p', { class: 'tr-count' }); const msg = h('p', { class: 'fgm-msg', role: 'status' }, { nome: 'leve o Paul até o nome certo antes da figura cair!', valor: 'leve o Paul até quanto a figura vale antes dela cair!', pausa: 'essa pausa é de qual figura? leve o Paul até ela!' }[T.jeito]);
  const nomes = Array.from({ length: N }, (_, i) => h('b', { class: 'fgq-nome', style: `left:${(i / N) * 100 + 1.5}%;width:${100 / N - 3}%` }));
  const cai = h('div', { class: 'fgq-cai' });
  const paul = h('div', { class: 'fgq-paul' }, h('img', { src: corSrc('ouvindo'), alt: '', draggable: 'false' }));
  const campo = h('div', { class: `fgq-campo bmr${quatro ? ' q4' : ''}`, role: 'application', 'aria-label': 'toque ou arraste pro lado certo' }, ...Array.from({ length: N - 1 }, (_, i) => h('i', { class: 'fgq-div', style: `left:${((i + 1) / N) * 100}%` })), cai, paul, ...nomes);
  const poe = () => { paul.style.left = `calc(${((lado + 0.5) / N) * 100}% - ${quatro ? 28 : 35}px)`; };
  const vai = (s) => { const i = s === 'esq' ? 0 : s === 'dir' ? 1 : Number(s); if (i >= 0 && i < N && lado !== i) { lado = i; poe(); } };
  const lado$ = (e) => { const r = campo.getBoundingClientRect(); vai(Math.min(N - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * N)))); };
  campo.addEventListener('pointerdown', (e) => { if (campo.setPointerCapture) { try { campo.setPointerCapture(e.pointerId); } catch { /* ok */ } } lado$(e); });
  campo.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') lado$(e); });
  const pinta = () => { conta.textContent = `${Math.min(k + 1, itens.length)} de ${itens.length} · ${erros} erro${erros === 1 ? '' : 's'}`; };
  const para = () => { acabou = true; cancelAnimationFrame(raf); };
  const certoDe = (it) => (typeof it.ok === 'number' ? it.ok : it.ok === 'esq' ? 0 : 1);
  const proximo = () => {
    if (k >= itens.length) { para(); pinta(); setTimeout(() => { if (viva(box)) fim(); }, 500); return; }
    const it = itens[k]; nomes.forEach((n, i) => { n.textContent = quatro ? it.ops[i] : rot(it, i === 0 ? it.esq : it.dir); });
    cai.replaceChildren(svgEl(it.face === 'pausa' ? restMarkup(it.fig) : figureMarkup(it.fig), 'fgq-fig')); cai.style.top = '0%'; t0 = performance.now(); pinta();
  };
  const passo = (agora) => {
    if (acabou || !viva(box)) { para(); return; }
    const it = itens[k]; const f = Math.min(1, (agora - t0) / ms); cai.style.top = `${f * 72}%`;
    if (f >= 1) {
      const certo = lado === certoDe(it); campo.classList.remove('certo', 'errado'); void campo.offsetWidth; campo.classList.add(certo ? 'certo' : 'errado');
      if (certo) { acertos++; toca({ midi: 60 + (k % 7) * 2 }); } else { erros++; erroSom(); }
      k++; proximo();
    }
    if (!acabou) raf = requestAnimationFrame(passo);
  };
  const onKey = (e) => { if (!viva(box)) { document.removeEventListener('keydown', onKey); return; } if (e.key === 'ArrowLeft') vai(Math.max(0, lado - 1)); else if (e.key === 'ArrowRight') vai(Math.min(N - 1, lado + 1)); };
  document.addEventListener('keydown', onKey);
  const comecar = h('button', { type: 'button', class: 'btn primary wide fgm-go', onclick: () => { comecar.remove(); proximo(); raf = requestAnimationFrame(passo); } }, 'começar ▶');
  poe(); box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, msg, campo, comecar)); pinta();
  return { stats: () => ({ erros, found: acertos, total: itens.length, estrelas: estrelasPorErros(erros, 1, 3) }), vai: (s) => vai(s), item: () => (itens[k] ? { ...itens[k], ok: certoDe(itens[k]) } : null), seg: ms / 1000 };
}
export const queda4 = (box, o = {}) => queda(box, { ...o, faixas: 4 });

/* ---------- pesca: toque (ou solte o anzol) no peixe certo ---------- */
const CORES_PEIXE = ['#ff3b5c', '#ffd23f', '#4fd8ff', '#b18cff', '#ff9f43', '#ff7ad9'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const peixeSvg = (cor) => `<svg viewBox="0 0 120 56" aria-hidden="true"><defs><linearGradient id="pg${cor.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="${cor}"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs><path d="M100 28 118 8v40z" fill="${cor}" stroke="#05060f" stroke-width="3" stroke-linejoin="round"/><ellipse cx="54" cy="28" rx="50" ry="24" fill="url(#pg${cor.slice(1)})" stroke="#05060f" stroke-width="3"/><circle cx="14" cy="22" r="4" fill="#fff" stroke="#05060f" stroke-width="2"/></svg>`;
export function pesca(box, { nivel = 'facil', fim = () => {}, extra = 0, assuntos = null } = {}) {
  const cfg = cfgMini(nivel, 'pesca', extra); const rodadas = rodadasQA(cfg.rodadas, cfg.peixes, Math.random, assuntos); let r = 0; let erros = 0; let acertos = 0; let acabou = false; let trava = false; let raf = 0; let tPrev = 0; let peixes = [];
  const conta = h('p', { class: 'tr-count' }); const pergunta = h('p', { class: 'fgp-q', role: 'status' });
  const linha = h('div', { class: 'fgp-linha' }); const anzol = h('div', { class: 'fgp-anzol', 'aria-hidden': 'true' });
  const barco = h('div', { class: 'fgp-barco' }, h('img', { src: corSrc('ouvindo'), alt: '', draggable: 'false' }));
  const mar = h('div', { class: 'fgp-mar bmr', role: 'application', 'aria-label': 'toque no peixe certo' }, h('i', { class: 'fgp-b b1' }), h('i', { class: 'fgp-b b2' }), h('i', { class: 'fgp-b b3' }), barco, linha, anzol);
  const pinta = () => { conta.textContent = `${Math.min(r + 1, rodadas.length)} de ${rodadas.length} · ${erros} erro${erros === 1 ? '' : 's'}`; };
  const largura = () => mar.clientWidth || 340; const alt = () => mar.clientHeight || 340;
  const solta = () => { peixes.forEach((f) => f.el.remove()); peixes = []; };
  const nada = (agora) => {
    if (acabou || !box.isConnected) { cancelAnimationFrame(raf); return; }
    const dt = Math.min(0.05, (agora - (tPrev || agora)) / 1000); tPrev = agora; const W = largura();
    peixes.forEach((f) => { if (f.pego) return; f.x += f.dir * f.v * dt; if (f.x > W) { f.x = -f.w; } else if (f.x < -f.w) { f.x = W; } f.el.style.transform = `translate(${f.x}px,${f.y}px)`; f.el.classList.toggle('vira', f.dir < 0); });
    raf = requestAnimationFrame(nada);
  };
  const rodada = () => {
    if (r >= rodadas.length) { acabou = true; cancelAnimationFrame(raf); pinta(); setTimeout(() => { if (viva(box)) fim(); }, 500); return; }
    const q = rodadas[r]; solta(); trava = false; pergunta.textContent = `pesque o que combina com “${q.q}”`; pinta(); const W = largura(); const H = alt(); const n = q.opcoes.length;
    peixes = q.opcoes.map((txt, i) => {
      const w = 112; const y = 70 + ((H - 150) / Math.max(1, n - 1)) * i; const dir = i % 2 ? -1 : 1; const v = cfg.vel * (0.8 + (i % 3) * 0.2);
      const el = h('button', { type: 'button', class: 'fgp-peixe', 'data-i': String(i), 'aria-label': txt, style: `--c:${CORES_PEIXE[i % CORES_PEIXE.length]}` }, h('span', { class: 'fgp-fig' }), h('b', {}, txt));
      el.querySelector('.fgp-fig').innerHTML = peixeSvg(CORES_PEIXE[(i + r) % CORES_PEIXE.length]);
      const f = { el, i, x: (W / n) * i + 10, y, w, dir, v, pego: false }; el.addEventListener('pointerdown', (e) => { e.preventDefault(); pega(f); }); mar.append(el); return f;
    });
  };
  function pega(f) {
    if (trava || acabou || f.pego) return; trava = true; f.pego = true; const q = rodadas[r]; const certo = f.i === q.ok;
    const cx = f.x + f.w / 2; linha.style.left = `${cx}px`; anzol.style.left = `${cx - 7}px`; linha.style.height = `${f.y + 20}px`; anzol.style.top = `${f.y + 14}px`; mar.classList.add('lanca');
    setTimeout(() => {
      if (!viva(box)) return; mar.classList.remove('lanca');
      if (certo) { // puxa o peixe pra cima junto com a linha
        acertos++; toca({ midi: 60 + (r % 7) * 2 }); f.el.style.transition = 'transform .55s ease-in'; f.el.style.transform = `translate(${f.x}px,28px)`; f.el.classList.add('pego'); linha.style.transition = anzol.style.transition = 'height .55s ease-in,top .55s ease-in'; linha.style.height = '20px'; anzol.style.top = '14px'; r++;
        setTimeout(() => { if (!viva(box)) return; linha.style.transition = anzol.style.transition = ''; linha.style.height = '0px'; anzol.style.top = '-20px'; rodada(); }, 750);
      } else { linha.style.height = '0px'; anzol.style.top = '-20px'; erros++; erroSom(); f.el.classList.add('errado'); pinta(); setTimeout(() => { if (!viva(box)) return; f.el.remove(); trava = false; }, 500); }
    }, 320);
  }
  const comecar = h('button', { type: 'button', class: 'btn primary wide fgm-go', onclick: () => { comecar.remove(); rodada(); raf = requestAnimationFrame(nada); } }, 'começar ▶');
  mar.addEventListener('pointerup', (e) => { if (e.target !== mar || trava || acabou) return; const rc = mar.getBoundingClientRect(); const x = e.clientX - rc.left; const f = peixes.filter((p) => !p.pego && x >= p.x - 12 && x <= p.x + p.w + 12).sort((a, b) => a.y - b.y)[0]; if (f) pega(f); }); // solta o anzol onde você tocou
  box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, pergunta, mar, comecar)); pinta(); pergunta.textContent = 'toque em começar: pesque o peixe certo!';
  return { stats: () => ({ erros, found: acertos, total: rodadas.length, estrelas: estrelasPesca(erros) }), pega: (i) => { const f = peixes.find((p) => p.i === i && !p.pego); if (f) pega(f); }, rodada: () => rodadas[r] || null };
}

/* ---------- mira e bolinha: arraste pra mirar (linha pontilhada), solte pra jogar a bolinha na resposta certa ---------- */
export function mira(box, { nivel = 'facil', fim = () => {}, extra = 0, assuntos = null } = {}) {
  const cfg = cfgMini(nivel, 'mira', extra); const rodadas = rodadasQA(cfg.rodadas, cfg.alvos, Math.random, assuntos); let r = 0; let erros = 0; let acertos = 0; let acabou = false; let trava = false; let raf = 0; let t0 = performance.now();
  const W = 300; const H = 330; const O = { x: W / 2, y: H - 34 }; const R = cfg.alvos > 3 ? 30 : 36;
  const conta = h('p', { class: 'tr-count' }); const pergunta = h('p', { class: 'fgp-q', role: 'status' });
  const el = (tag, attrs = {}) => { const e = document.createElementNS(SVG_NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fgx-svg', role: 'application', 'aria-label': 'arraste pra mirar e solte pra jogar a bolinha' });
  const defs = el('defs'); defs.innerHTML = '<radialGradient id="fgxBola" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffd23f"/><stop offset="1" stop-color="#b8620a"/></radialGradient><radialGradient id="fgxAlvo" cx=".35" cy=".28" r=".9"><stop offset="0" stop-color="#8c7bff"/><stop offset=".55" stop-color="#3a2d9c"/><stop offset="1" stop-color="#150f45"/></radialGradient>';
  const mirinha = el('line', { class: 'fgx-mira', x1: O.x, y1: O.y, x2: O.x, y2: O.y - 100 }); const bola = el('circle', { class: 'fgx-bola', r: 11, cx: O.x, cy: O.y, fill: 'url(#fgxBola)' });
  const base = el('ellipse', { cx: O.x, cy: O.y + 14, rx: 34, ry: 10, class: 'fgx-base' });
  let alvos = []; const grupo = el('g');
  svg.append(defs, grupo, mirinha, base, bola); const campo = h('div', { class: 'fgx-campo bmr' }, svg);
  const quebra = (t) => { const p = t.split(' '); if (p.length < 2) return [t]; const m = Math.ceil(p.length / 2); return [p.slice(0, m).join(' '), p.slice(m).join(' ')]; };
  const pinta = () => { conta.textContent = `${Math.min(r + 1, rodadas.length)} de ${rodadas.length} · ${erros} erro${erros === 1 ? '' : 's'}`; };
  const pos = () => { const seg = (performance.now() - t0) / 1000; return alvos.map((a, i) => ({ x: alvoX(a.bx, i, seg, cfg.move), y: a.y, r: R })); };
  const desenha = () => { if (acabou || !box.isConnected) return; const p = pos(); alvos.forEach((a, i) => { a.g.setAttribute('transform', `translate(${p[i].x} ${p[i].y})`); }); raf = requestAnimationFrame(desenha); };
  const rodada = () => {
    if (r >= rodadas.length) { acabou = true; cancelAnimationFrame(raf); pinta(); setTimeout(() => { if (viva(box)) fim(); }, 500); return; }
    const q = rodadas[r]; grupo.replaceChildren(); trava = false; pergunta.textContent = `mire na resposta de “${q.q}”`; pinta(); const n = q.opcoes.length;
    alvos = q.opcoes.map((txt, i) => {
      const bx = n > 1 ? 44 + ((W - 88) / (n - 1)) * i : W / 2; const y = 62 + (i % 2) * 44 + (cfg.alvos > 3 ? 0 : 14); const g = el('g', { class: 'fgx-alvo', 'data-i': String(i) });
      g.append(el('circle', { r: R + 5, class: 'fgx-anel' }), el('circle', { r: R, fill: 'url(#fgxAlvo)', class: 'fgx-disco' }), el('ellipse', { cx: -8, cy: -R * 0.55, rx: R * 0.55, ry: R * 0.28, class: 'fgx-brilho' }));
      const ls = quebra(txt); ls.forEach((l, k) => { const t = el('text', { x: 0, y: (k - (ls.length - 1) / 2) * 12 + 4, 'text-anchor': 'middle', class: 'fgx-tx' }); t.textContent = l; g.append(t); });
      grupo.append(g); return { g, bx, y, i, vivo: true };
    }); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(desenha);
  };
  const ponto = (e) => { const rc = svg.getBoundingClientRect(); return { x: ((e.clientX - rc.left) / rc.width) * W, y: ((e.clientY - rc.top) / rc.height) * H }; };
  const aponta = (pt) => { let dx = pt.x - O.x; let dy = Math.min(-20, pt.y - O.y); const d = Math.hypot(dx, dy); dx = (dx / d) * 260; dy = (dy / d) * 260; mirinha.setAttribute('x2', O.x + dx); mirinha.setAttribute('y2', O.y + dy); mirinha.style.opacity = '1'; };
  let mirando = false;
  const joga = (pt) => {
    if (trava || acabou) return; const dir = { x: pt.x, y: Math.min(O.y - 20, pt.y) }; const idx = acertaMira(O, dir, pos(), 10); trava = true; mirinha.style.opacity = '0';
    const alvo = idx >= 0 && alvos[idx].vivo ? pos()[idx] : null; const fx = alvo ? alvo.x : O.x + (dir.x - O.x) * 3; const fy = alvo ? alvo.y : O.y + (dir.y - O.y) * 3; const t1 = performance.now(); const dur = 420;
    const voa = (agora) => { const f = Math.min(1, (agora - t1) / dur); bola.setAttribute('cx', O.x + (fx - O.x) * f); bola.setAttribute('cy', O.y + (fy - O.y) * f); bola.setAttribute('r', 11 - 4 * f);
      if (f < 1) { requestAnimationFrame(voa); return; }
      bola.setAttribute('cx', O.x); bola.setAttribute('cy', O.y); bola.setAttribute('r', 11); if (!viva(box)) return; resolve(idx); }; requestAnimationFrame(voa);
  };
  function resolve(idx) {
    const q = rodadas[r];
    if (idx < 0) { pergunta.textContent = 'passou longe! mire de novo'; trava = false; return; }
    if (idx === q.ok) { acertos++; alvos[idx].g.classList.add('certo'); toca({ midi: 60 + (r % 7) * 2 }); r++; setTimeout(() => { if (viva(box)) rodada(); }, 700); return; }
    erros++; erroSom(); alvos[idx].g.classList.add('errado'); alvos[idx].vivo = false; pinta(); pergunta.textContent = `mire na resposta de “${q.q}”`; trava = false;
  }
  svg.addEventListener('pointerdown', (e) => { if (trava || acabou) return; mirando = true; try { svg.setPointerCapture(e.pointerId); } catch { /* ok */ } aponta(ponto(e)); });
  svg.addEventListener('pointermove', (e) => { if (mirando && !trava) aponta(ponto(e)); });
  svg.addEventListener('pointerup', (e) => { if (!mirando) return; mirando = false; joga(ponto(e)); });
  const comecar = h('button', { type: 'button', class: 'btn primary wide fgm-go', onclick: () => { comecar.remove(); rodada(); } }, 'começar ▶');
  box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, pergunta, campo, comecar)); pinta(); pergunta.textContent = 'toque em começar: arraste pra mirar, solte pra jogar!';
  return { stats: () => ({ erros, found: acertos, total: rodadas.length, estrelas: estrelasMira(erros) }), rodada: () => rodadas[r] || null, atira: (i) => { const p = pos()[i]; if (p) joga({ x: p.x, y: p.y }); }, alvos: () => pos() };
}

/* ---------- montar nota: cabeça, haste e colchetes ---------- */
export function montar(box, { nivel = 'facil', fim = () => {} } = {}) {
  const cfg = montarCfg(nivel); const figs = cfg.figuras; let r = 0; let erros = 0; let acertos = 0; let m = { cabeca: null, haste: null, colchetes: null }; let marcas = null; let trava = false;
  const conta = h('p', { class: 'tr-count' }); const pergunta = h('p', { class: 'fgp-q', role: 'status' }); const cena = h('div', { class: 'fgn-cena bmr' }); const bancada = h('div', { class: 'fgn-banca bmr' });
  const pinta = () => { conta.textContent = `${Math.min(r + 1, figs.length)} de ${figs.length} · ${erros} erro${erros === 1 ? '' : 's'}`; };
  const peca = (grupo, valor, texto, cor) => h('button', { type: 'button', class: `fgn-peca c${cor}${m[grupo] === valor ? ' on' : ''}${marcas && marcas[grupo] === false && m[grupo] === valor ? ' no' : ''}`, 'data-g': grupo, 'data-v': String(valor), disabled: trava, onclick: () => { if (trava) return; m = { ...m, [grupo]: valor }; marcas = null; desenha(); } }, texto);
  const grupo = (tit, ...bs) => h('div', { class: 'fgn-grupo' }, h('small', {}, tit), h('div', { class: 'fgn-linha' }, ...bs));
  function desenha() {
    const alvo = figs[r]; const cheio = m.cabeca != null && m.haste != null && m.colchetes != null; pergunta.textContent = `monte a ${FIG_NAME[alvo]}`; pinta();
    cena.replaceChildren(svgEl(noteMarkup({ open: m.cabeca === 'vazia', stem: !!m.haste, flags: m.colchetes || 0 }, 'figura montada'), 'fgn-nota'));
    bancada.replaceChildren(grupo('cabeça', peca('cabeca', 'cheia', 'preenchida', 1), peca('cabeca', 'vazia', 'vazia', 2)), grupo('haste', peca('haste', true, 'com haste', 3), peca('haste', false, 'sem haste', 4)),
      grupo('colchetes', ...Array.from({ length: cfg.maxC + 1 }, (_, n) => n).map((n) => peca('colchetes', n, n === 0 ? 'nenhum' : String(n), (n % 4) + 1))), h('button', { type: 'button', class: 'btn primary wide fgn-ok', disabled: !cheio || trava, onclick: confere }, 'conferir ✓'));
  }
  function confere() {
    if (trava) return; const c = confereMonte(figs[r], m); const tudo = c.cabeca && c.haste && c.colchetes;
    if (tudo) { trava = true; acertos++; cena.classList.add('certo'); toca({ midi: 60 + (r % 7) * 2 }); desenha(); setTimeout(() => { if (!viva(box)) return; cena.classList.remove('certo'); r++; m = { cabeca: null, haste: null, colchetes: null }; marcas = null; trava = false; if (r >= figs.length) { pinta(); fim(); return; } desenha(); }, 900); }
    else { erros++; marcas = c; erroSom(); cena.classList.remove('errado'); void cena.offsetWidth; cena.classList.add('errado'); desenha(); }
  }
  box.replaceChildren(h('section', { class: 'card pad fgm' }, conta, pergunta, cena, bancada)); desenha();
  return { stats: () => ({ erros, found: acertos, total: figs.length, estrelas: estrelasMontar(erros) }), alvo: () => figs[r] || null, certo: () => (figs[r] ? peçasDe(figs[r]) : null) };
}

/** Registro dos jogos de toque: o `tipo` da porta (fuga-logic.js TIPOS) aponta pra função daqui. */
export const MINI = { genius, caminho, memoria, queda, queda4, pesca, mira, montar };
