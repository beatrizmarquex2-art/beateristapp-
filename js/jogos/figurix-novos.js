// Figurix: jogos novos (a Bea escolheu no mockup `prototipos/figurix-novos-opcoes.html`): 1) atenção/memória em 3 formatos (toque nos pares, olhe e vire, quem sumiu),
// 2) Detetive Note (ouça e monte, versão A) e 3) quiz "de quem é esse som?" (instrumentos, versão C). Cada função recebe `c` = o contexto do Figurix:
// { root, S, sfx, topo, acerto, erro, fim, fig, pausa, nomeFig, beatsLabel, aoLimpar }. As regras puras estão em figurix-logic.js (testadas).
import { h } from '../util.js';
import { audio, out, noise, kick, snare, hihat, silence } from '../audio.js';
import { bass } from '../synth.js';
import { pluck, mallet } from '../instruments.js';
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


/* ---------- sons do quiz (sintetizados aqui: parciais com leve desafinação, martelo, formantes de voz, platinelas) ---------- */
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const ramp = (g, t, pico, a, fim) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pico), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + fim); };
/** Piano: 8 parciais um pouco esticados (como corda de verdade), cada um com seu decaimento, dois "coros" levemente desafinados e o toque do martelo. */
function pianoSom(t, midi, len = 1.7, v = 1) {
  const c = audio(); const f = hz(midi); const mix = c.createGain(); mix.gain.value = 0.55 * v; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 8 + 1200); mix.connect(lp).connect(out());
  for (let k = 1; k <= 8; k++) for (const cents of [-1.6, 1.6]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * k * Math.sqrt(1 + 0.0004 * k * k); o.detune.value = cents; const g = c.createGain(); ramp(g, t, 0.55 / k ** 1.1, 0.004, Math.max(0.25, len / (0.9 + k * 0.55))); o.connect(g).connect(mix); o.start(t); o.stop(t + len + 0.1); }
  const n = c.createBufferSource(); n.buffer = noise(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(5000, f * 3); bp.Q.value = 0.8; const ng = c.createGain(); ramp(ng, t, 0.22 * v, 0.002, 0.05); n.connect(bp).connect(ng).connect(out()); n.start(t, Math.random() * 0.2); n.stop(t + 0.08);
}
/** Voz "ahh": serra com vibrato passando por filtros de vogal (formantes do "a") e um sopro de ar. */
function vozSom(t, midi, len = 0.9, v = 1) {
  const c = audio(); const f = hz(midi); const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * v, t + 0.12); g.gain.setValueAtTime(0.9 * v, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len); g.connect(out());
  const lfo = c.createOscillator(); lfo.frequency.value = 5.4; const lg = c.createGain(); lg.gain.value = f * 0.011; lfo.connect(lg); lfo.start(t); lfo.stop(t + len + 0.1);
  for (const cents of [-9, 0, 9]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents; lg.connect(o.frequency);
    for (const [fr, q, ga] of [[800, 8, 1], [1150, 10, 0.55], [2900, 12, 0.3], [3500, 12, 0.18]]) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; const x = c.createGain(); x.gain.value = ga * 0.5; o.connect(b).connect(x).connect(g); }
    o.start(t); o.stop(t + len + 0.1); }
  const n = c.createBufferSource(); n.buffer = noise(); const nb = c.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = 1800; nb.Q.value = 0.7; const ng = c.createGain(); ng.gain.value = 0.05 * v; n.connect(nb).connect(ng).connect(g); n.start(t, Math.random() * 0.3); n.stop(t + len);
}
/** Pandeiro: "tum" (couro grave), "tá" (couro agudo) e "tchi" (só as platinelas). As platinelas soam junto em todas as batidas. */
function pandeiroSom(t, tipo, v = 1) {
  const c = audio();
  if (tipo !== 'tchi') { const o = c.createOscillator(); o.type = 'sine'; const grave = tipo === 'tum'; o.frequency.setValueAtTime(grave ? 210 : 360, t); o.frequency.exponentialRampToValueAtTime(grave ? 120 : 250, t + 0.1); const g = c.createGain(); ramp(g, t, (grave ? 0.8 : 0.55) * v, 0.003, grave ? 0.26 : 0.13); o.connect(g).connect(out()); o.start(t); o.stop(t + 0.3);
    const n = c.createBufferSource(); n.buffer = noise(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = grave ? 900 : 2400; bp.Q.value = 1; const ng = c.createGain(); ramp(ng, t, 0.3 * v, 0.002, 0.05); n.connect(bp).connect(ng).connect(out()); n.start(t, Math.random() * 0.2); n.stop(t + 0.08); }
  const plat = tipo === 'tchi' ? 1 : 0.55;
  for (const [fr, d] of [[6200, 0.2], [7600, 0.17], [9100, 0.15], [10800, 0.12]]) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = fr * (1 + Math.random() * 0.02); const hp = c.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = fr; hp.Q.value = 9; const g = c.createGain(); ramp(g, t + Math.random() * 0.012, 0.09 * v * plat, 0.001, d); o.connect(hp).connect(g).connect(out()); o.start(t); o.stop(t + d + 0.05); }
  const n2 = c.createBufferSource(); n2.buffer = noise(); const hp2 = c.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 6500; const g2 = c.createGain(); ramp(g2, t, 0.22 * v * plat, 0.001, 0.14); n2.connect(hp2).connect(g2).connect(out()); n2.start(t, Math.random() * 0.2); n2.stop(t + 0.18);
}

/* ---------- 3: de quem é esse som? ---------- */
/** Toca um trechinho curto de cada instrumento (tudo sintetizado no próprio app). */
export function tocaInstr(id) {
  try {
    silence(); const ct = audio(); const t = ct.currentTime + 0.05; const q = 0.28;
    if (id === 'bateria') { [0, 2].forEach((k) => kick(t + k * q, 1)); [1, 3].forEach((k) => snare(t + k * q, 1)); for (let k = 0; k < 8; k++) hihat(t + k * q / 2, 0.6); }
    else if (id === 'violao') { [48, 52, 55, 60, 64].forEach((m, k) => pluck(m, 0.8, t + k * 0.07, 'acoustic')); }
    else if (id === 'guitarra') { [[40, 47, 52], [40, 47, 52], [43, 50, 55], [45, 52, 57]].forEach((ch, k) => ch.forEach((m, j) => pluck(m, 1, t + k * 0.38 + j * 0.018, 'rock'))); }
    else if (id === 'piano') { [60, 64, 67].forEach((m, k) => pianoSom(t + k * 0.24, m, 1.6)); pianoSom(t + 0.8, 72, 1.8); pianoSom(t + 0.8, 64, 1.8); pianoSom(t + 0.8, 55, 1.8); }
    else if (id === 'baixo') { [36, 36, 43, 41].forEach((m, k) => bass(t + k * 0.28, m, 0.26, 1)); }
    else if (id === 'voz') { [[67, 0], [69, 0.55], [71, 1.1]].forEach(([m, d]) => vozSom(t + d, m, 0.7)); }
    else if (id === 'pandeiro') { ['tum', 'tchi', 'ta', 'tchi', 'tum', 'tchi', 'ta', 'ta'].forEach((x, k) => pandeiroSom(t + k * 0.16, x, k % 4 === 0 ? 0.7 : 0.56)); }
    else if (id === 'xilofone') { [72, 76, 79, 84].forEach((m, k) => mallet(m, 0.9, 'xilofone', t + k * 0.18)); }
  } catch { /* sem áudio */ }
}


export const paraSom = () => { try { silence(); } catch { /* sem áudio */ } };
