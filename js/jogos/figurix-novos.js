// Figurix: jogos novos (a Bea escolheu no mockup `prototipos/figurix-novos-opcoes.html`): 1) atenção/memória em 3 formatos (toque nos pares, olhe e vire, quem sumiu),
// 2) Detetive Note (ouça e monte, versão A) e 3) quiz "de quem é esse som?" (instrumentos, versão C). Cada função recebe `c` = o contexto do Figurix:
// { root, S, sfx, topo, acerto, erro, fim, fig, pausa, nomeFig, beatsLabel, aoLimpar }. As regras puras estão em figurix-logic.js (testadas).
import { h } from '../util.js';
import { audio, out, noise, silence } from '../audio.js';
import { pluck, mallet, wake, warmKit, DRUM_REAL, DRUM_CAJON_REAL, CHORDS, PERC, PERC_VAR } from '../instruments.js';
import * as FB from '../feedback.js';
import { FIG_BY } from '../kids/figs.js';
import { ouvidasMax, bpmFase, cartas, sortear, conferir, acertou } from './detetive-logic.js';
import { face as faceDetetive, tocaCompasso, soa } from './detetive-note.js';
import { paresMem, memCfg, mesmoParN, sumiuRodada, previaSeg, detFase } from './figurix-logic.js';

/** Conta regressiva em texto (3… 2… 1…) usando os tempos da sessão da tela. */
function contagem(S, el, seg, aoFim) { let r = seg; el.textContent = String(r); const passo = () => { r--; if (r <= 0) { el.textContent = ''; aoFim(); } else { el.textContent = String(r); S.later(passo, 1000); } }; S.later(passo, 1000); }

/* ---------- 1a e 1b: memória (toque nos pares / olhe e vire) ---------- */
export function memoria(c, p, modo) {
  const { root, S, sfx, topo, acerto, erro, fim, fig, pausa, nomeFig, beatsLabel } = c;
  const cfg = memCfg(p.nivel); const cartasM = paresMem(cfg.k, cfg.modo); window.__figurix.cartas = cartasM; let aberta = null; let trava = modo === 'espiada'; const feitos = new Set();
  const face = (x) => (x.tipo === 'fig' ? fig(x.id, 'fx-fig sm') : x.tipo === 'pausa' ? pausa(x.id, 'fx-fig sm') : h('b', { class: 'fx-txt' }, x.tipo === 'valor' ? beatsLabel(FIG_BY[x.id].beats) : nomeFig(x.id)));
  const B = cartasM.map((x) => h('button', { type: 'button', class: `fx-card${modo === 'pares' ? ' aberta' : ' aberta previa'}`, 'data-k': x.k, 'aria-label': 'carta', onclick: () => toca(x, B[x.k]) }, face(x)));
  const msg = h('p', { class: 'fx-q' }, modo === 'pares' ? 'toque nas duas iguais' : 'decore onde cada uma está'); const cont = h('div', { class: 'fx-cont', 'aria-live': 'polite' });
  function toca(x, b) {
    if (trava || feitos.has(x.k) || (aberta && aberta.x.k === x.k)) return; sfx.play('click');
    if (modo === 'espiada') b.classList.add('aberta'); else b.classList.add('sel');
    if (!aberta) { aberta = { x, b }; return; }
    const a = aberta; aberta = null;
    if (mesmoParN(a.x, x)) { feitos.add(a.x.k); feitos.add(x.k); for (const e of [a.b, b]) { e.classList.remove('sel'); e.classList.add('ok'); } acerto(b); if (feitos.size === cartasM.length) S.later(fim, 900); }
    else { try { FB.lose(b); } catch { /* ok */ } erro(b); trava = true; S.later(() => { for (const e of [a.b, b]) { e.classList.remove('sel', 'no'); if (modo === 'espiada') e.classList.remove('aberta'); } trava = false; }, 800); }
  }
  root.replaceChildren(topo(0, 0), msg, cont, h('div', { class: 'fx-mem' }, ...B));
  if (modo === 'espiada') contagem(S, cont, previaSeg(p.nivel), () => { B.forEach((b) => b.classList.remove('aberta', 'previa')); trava = false; msg.textContent = 'agora ache os pares!'; });
}

/* ---------- 1c: quem sumiu? ---------- */
export function sumiu(c, p) {
  const { root, S, sfx, topo, acerto, erro, fim, fig, nomeFig } = c; const total = 5; let i = 0;
  const rodada = () => {
    const q = sumiuRodada(p.nivel); const k = q.mostradas.indexOf(q.sumiu);
    const grade = h('div', { class: `fx-sumiu n${q.mostradas.length}` }, ...q.mostradas.map((f) => h('div', { class: 'fx-sc' }, fig(f, 'fx-fig sm'), h('small', {}, nomeFig(f)))));
    const msg = h('p', { class: 'fx-q' }, 'olhe bem as figuras'); const cont = h('div', { class: 'fx-cont', 'aria-live': 'polite' }); const ops = h('div', { class: `fx-ops n${q.opcoes.length}` });
    root.replaceChildren(topo(i, total), msg, cont, grade, ops);
    contagem(S, cont, previaSeg(p.nivel), () => {
      const alvo = grade.children[k]; alvo.replaceChildren(h('b', { class: 'fx-qm' }, '?')); alvo.classList.add('vazio'); msg.textContent = 'qual figura sumiu?'; window.__figurix.certa = nomeFig(q.sumiu);
      let fechada = false;
      ops.replaceChildren(...q.opcoes.map((f) => { const b = h('button', { type: 'button', class: 'fx-op', 'aria-label': nomeFig(f), 'data-certo': f === q.sumiu ? '1' : null, onclick: () => {
        if (fechada || b.disabled) return; sfx.play('click');
        if (f === q.sumiu) { fechada = true; b.classList.add('ok'); acerto(b); alvo.classList.remove('vazio'); alvo.replaceChildren(fig(f, 'fx-fig sm'), h('small', {}, nomeFig(f))); S.later(() => { i++; if (i >= total) fim(); else rodada(); }, 900); } else { erro(b); b.disabled = true; } } }, fig(f), h('small', {}, nomeFig(f))); return b; }));
    });
  };
  rodada();
}

/* ---------- 2: Detetive Note (ouça e monte) ---------- */
export function detetive(c, p) {
  const { root, S, sfx, topo, acerto, erro, fim } = c; const fase = detFase(p.nivel); const bpm = bpmFase('m1', fase); const total = 3; c.aoLimpar(() => silence());
  let rodada = 0; let slots = []; let secreto = null; let errou = false; let marcas = null; let ouvidas = 0; let ultimo = null; const cs = cartas('m1', fase, 'figuras');
  const restam = () => ouvidasMax(fase) - ouvidas;
  const ouvir = () => { if (restam() <= 0) return; ouvidas++; silence(); audio(); tocaCompasso(secreto, bpm, 'caixa'); };
  const nova = () => { secreto = sortear(fase, Math.random, ultimo, 'm1'); ultimo = secreto; slots = []; errou = false; marcas = null; ouvidas = 0; window.__figurix.secreto = secreto; desenha(); S.later(() => { ouvir(); desenha(); }, 400); };
  const desenha = () => {
    const cheio = slots.length === 4;
    const casas = Array.from({ length: 4 }, (_, i) => { const x = slots[i] != null ? cs.find((y) => y.cell === slots[i]) : null; const m = marcas ? marcas[i] : null;
      return h('button', { type: 'button', class: `dn-slot${x ? ' cheia' : ''}${m === true ? ' ok' : m === false ? ' no' : ''}`, 'aria-label': x ? `tempo ${i + 1}: tirar` : `tempo ${i + 1} vazio`, onclick: () => { if (x) { slots = slots.slice(0, i); marcas = null; desenha(); } } }, x ? faceDetetive(x, 'figuras') : h('small', {}, String(i + 1))); });
    const baralho = cs.map((x) => h('button', { type: 'button', class: 'dn-card', disabled: cheio, 'data-cell': x.cell, 'aria-label': x.cell === '0000' ? 'pausa' : x.cell, onclick: () => { if (slots.length < 4) { soa(x.cell, bpm, 'caixa'); slots = [...slots, x.cell]; marcas = null; desenha(); } } }, faceDetetive(x, 'figuras')));
    const rest = restam(); const vezes = rest === Infinity ? '' : rest > 0 ? ` · ${rest} ${rest === 1 ? 'vez' : 'vezes'}` : ' · acabou, confie no ouvido!';
    root.replaceChildren(h('div', { class: 'jg-detetive fx-det' }, h('div', { class: 'dn-caderno' }, topo(rodada, total),
      h('h2', { class: 'dn-caso' }, 'caso ', h('em', {}, String(rodada + 1).padStart(2, '0'))),
      h('button', { class: 'dn-ouvir', type: 'button', disabled: rest <= 0, onclick: () => { ouvir(); desenha(); } }, h('span', { class: 'dn-vinil', 'aria-hidden': 'true' }), h('span', { class: 'dn-ouvir-t' }, 'ouvir a pista', h('small', {}, `caixa · ${bpm} bpm${vezes}`))),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, errou ? 'quase! os vermelhos estão errados: ouça de novo e troque.' : 'monte na ordem que você ouviu:'),
      h('div', { class: 'dn-wrap sem' }, h('div', { class: 'dn-slots' }, ...casas)), h('p', { class: 'dn-lab' }, 'suas pistas'), h('div', { class: 'dn-baralho', style: `--n:${cs.length > 4 ? 3 : cs.length}` }, ...baralho),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary dn-conferir', type: 'button', disabled: !cheio, onclick: confere }, 'conferir'), slots.length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { slots = []; marcas = null; desenha(); } }, 'limpar') : null))));
  };
  const confere = () => {
    if (acertou(slots, secreto)) { marcas = secreto.map(() => true); desenha(); acerto(root.querySelector('.dn-slots')); silence(); S.later(() => { rodada++; if (rodada >= total) fim(); else nova(); }, 1100); }
    else { errou = true; marcas = conferir(slots, secreto); desenha(); erro(root.querySelector('.dn-slots')); }
  };
  nova();
}


/* ---------- sons do quiz (sintetizados aqui: só o piano: parciais com leve desafinação e toque do martelo) ---------- */
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const ramp = (g, t, pico, a, fim) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pico), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + fim); };
/** Piano: 8 parciais um pouco esticados (como corda de verdade), cada um com seu decaimento, dois "coros" levemente desafinados e o toque do martelo. */
function pianoSom(t, midi, len = 1.7, v = 1) {
  const c = audio(); const f = hz(midi); const mix = c.createGain(); mix.gain.value = 0.55 * v; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 8 + 1200); mix.connect(lp).connect(out());
  for (let k = 1; k <= 8; k++) for (const cents of [-1.6, 1.6]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * k * Math.sqrt(1 + 0.0004 * k * k); o.detune.value = cents; const g = c.createGain(); ramp(g, t, 0.55 / k ** 1.1, 0.004, Math.max(0.25, len / (0.9 + k * 0.55))); o.connect(g).connect(mix); o.start(t); o.stop(t + len + 0.1); }
  const n = c.createBufferSource(); n.buffer = noise(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(5000, f * 3); bp.Q.value = 0.8; const ng = c.createGain(); ramp(ng, t, 0.22 * v, 0.002, 0.05); n.connect(bp).connect(ng).connect(out()); n.start(t, Math.random() * 0.2); n.stop(t + 0.08);
}
/* ---------- 3: de quem é esse som? ---------- */
const perc = (id) => { wake(); return (PERC_VAR[id] && PERC_VAR[id][0]) || PERC.find((x) => x[0] === id)[2]; }; // percussão do app, agendada no relógio do áudio
/** Toca um trechinho curto de cada instrumento (tudo sintetizado no próprio app). */
export function tocaInstr(id) {
  try {
    silence(); const ct = audio(); const t = ct.currentTime + 0.05; const q = 0.28;
    if (id === 'bateria') { const D = DRUM_REAL; const e = 0.25; for (let k = 0; k < 8; k++) { D.hh(t + k * e, k % 2 ? 0.55 : 0.8); } [0, 3, 4, 7].forEach((k) => D.bd(t + k * e, 1)); [2, 6].forEach((k) => D.sn(t + k * e, 1, 0.3)); D.bd(t + 3.5 * e, 0.8); D.tt(t + 8 * e, 0.9); D.mt(t + 8.5 * e, 0.9); D.ft(t + 9 * e, 0.95); D.cr(t + 10 * e, 1); D.bd(t + 10 * e, 1); }
    else if (id === 'violao') { // dedilhado: baixo com o polegar e três cordas agudas em arpejo (p-i-m-a-m-i-m-a), dó e depois sol
    const e = 0.2; [[CHORDS[0][1], 0], [CHORDS[1][1], 8 * e]].forEach(([ch, d0]) => { const cs = ch.filter((m) => m != null); const b = cs[0]; const b2 = cs[1]; const [x, y, z] = cs.slice(-3);
      [[b, 0.85], [x, 0.6], [y, 0.65], [z, 0.7], [b2, 0.75], [y, 0.6], [z, 0.65], [y, 0.55]].forEach(([m, v], k) => pluck(m, v, t + d0 + k * e, 'acoustic')); });
    CHORDS[0][1].filter((m) => m != null).forEach((m, j) => pluck(m, 0.7, t + 16 * e + j * 0.03, 'acoustic')); }
    else if (id === 'guitarra') { [[40, 47, 52], [40, 47, 52], [43, 50, 55], [45, 52, 57]].forEach((ch, k) => ch.forEach((m, j) => pluck(m, 1, t + k * 0.38 + j * 0.018, 'rock'))); }
    else if (id === 'piano') { [60, 64, 67].forEach((m, k) => pianoSom(t + k * 0.24, m, 1.6)); pianoSom(t + 0.8, 72, 1.8); pianoSom(t + 0.8, 64, 1.8); pianoSom(t + 0.8, 55, 1.8); }
    else if (id === 'cajon') { const D = DRUM_CAJON_REAL; const e = 0.22; [0, 3, 4, 5].forEach((k) => D.bd(t + k * e, 1)); [2, 6].forEach((k) => D.sn(t + k * e, 1)); [1, 3.5, 5.5, 7].forEach((k, j) => D.sn(t + k * e, 0.45 + (j % 2) * 0.1)); [8, 8.5, 9].forEach((k) => D.sn(t + k * e, 0.8)); D.bd(t + 10 * e, 1); D.sn(t + 10 * e, 1); } // cajón de verdade (amostras CC0 do app): grave no centro, estalo na borda
    else if (id === 'triangulo') { const f = perc('tr'); [0, 0.45, 0.9, 1.2, 1.35].forEach((d, k) => f(t + d, k === 4 ? 0.6 : 0.9)); }
    else if (id === 'recoreco') { const f = perc('rr'); [0, 0.3, 0.6, 0.78, 0.96, 1.4, 1.7].forEach((d, k) => f(t + d, k % 2 ? 2 : 2.8)); }
    else if (id === 'xilofone') { [72, 74, 76, 79, 81, 79, 76, 84].forEach((m, k) => mallet(m, k === 7 ? 1 : 0.85, 'xilofone', t + k * 0.15)); mallet(72, 0.6, 'xilofone', t + 1.5); }
  } catch { /* sem áudio */ }
}


/** Esquenta as amostras de bateria de verdade (CC0) antes do 1º som; sem internet cai no sintético. */
export const esquenta = () => { try { warmKit('acustica'); warmKit('cajon'); } catch { /* sem áudio */ } };
export const paraSom = () => { try { silence(); } catch { /* sem áudio */ } };
