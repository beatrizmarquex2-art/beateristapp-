// Peças de tela e de som que os 4 jogos "de verdade" dividem: nota de piano sintetizada, teclado na tela, chips pequenos,
// o ouvido do microfone (nota e batida) e a entrega das estrelas. Nada de áudio sai do aparelho.
import { h } from '../util.js';
import { audio, out } from '../audio.js';
import { getMic } from '../mic-access.js';
import { detectPitch, noteOf, rms } from '../pitch.js';
import { openMic } from '../kids/mic.js';
import * as store from '../store.js';
import { rastreador, nomeNota, ehPreta, faixa } from './vivo-logic.js';

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
/** Nota de teclado (triângulo + um pouco da oitava), com ataque rápido e cauda curta. */
export function tocaNota(midi, t, dur = 0.42, vol = 0.5) {
  try {
    const c = audio(); const g = c.createGain(); t = t || c.currentTime + 0.01;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.45, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [tipo, mult, v] of [['triangle', 1, 1], ['sine', 2, 0.28]]) { const o = c.createOscillator(); const og = c.createGain(); o.type = tipo; o.frequency.value = freq(midi) * mult; og.gain.value = v; o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.03); }
    g.connect(out());
  } catch { /* sem áudio */ }
}
/** Som de erro curto e grave (não é nota da escala, pra não confundir). */
export function somErro() {
  try { const c = audio(); const t = c.currentTime + 0.01; const o = c.createOscillator(); const g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.18); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g).connect(out()); o.start(t); o.stop(t + 0.25); } catch { /* sem áudio */ }
}

/** Linha de chips pequenos (retângulo curto, texto pequeno, sombra deslocada). `opts` = [[valor, texto]]. */
export function chips(rotulo, opts, atual, onPick) {
  return h('div', { class: 'vv-linha', role: 'radiogroup', 'aria-label': rotulo }, h('span', { class: 'vv-lab' }, rotulo),
    ...opts.map(([v, txt]) => h('button', { type: 'button', role: 'radio', class: `vv-chip${v === atual ? ' on' : ''}`, 'aria-checked': String(v === atual), 'data-v': String(v), onclick: () => { if (v !== atual) onPick(v); } }, txt)));
}

/**
 * Teclado na tela. `notas` = teclas brancas que valem (as pretas entre elas aparecem só de enfeite, sem tocar).
 * `nomes` = escreve dó, ré, mi nas teclas. Devolve { el, acende(midi, classe, ms), trava(bool) }.
 */
export function teclado({ notas, nomes = true, onNota }) {
  const lo = notas[0]; const hi = notas[notas.length - 1]; const brancas = faixa(lo, hi).filter((m) => !ehPreta(m)); const W = 100 / brancas.length;
  const el = h('div', { class: 'vv-teclado' }); el.style.setProperty('--n', String(brancas.length)); const teclas = new Map(); let travado = false;
  brancas.forEach((m) => {
    const vale = notas.includes(m);
    const b = h('button', { type: 'button', class: `vv-tecla${vale ? '' : ' fora'}`, 'data-midi': String(m), disabled: !vale, 'aria-label': nomeNota(m) }, nomes ? h('span', {}, nomeNota(m)) : null);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (travado || !vale) return; onNota(m, e); });
    teclas.set(m, b); el.append(b);
  });
  brancas.forEach((m, i) => { if (i < brancas.length - 1 && ehPreta(m + 1)) el.append(h('i', { class: 'vv-preta', 'aria-hidden': 'true', style: { left: `${(i + 1) * W}%` } })); });
  return {
    el,
    acende(midi, classe = 'on', ms = 320) { const alvo = teclas.get(midi) || [...teclas.entries()].filter(([m]) => (m - midi) % 12 === 0).map(([, b]) => b)[0]; if (!alvo) return; alvo.classList.add(classe); setTimeout(() => alvo.classList.remove(classe), ms); },
    trava(v) { travado = !!v; el.classList.toggle('travado', travado); },
  };
}

/** Atraso do microfone medido no Juiz de Tempo (se houver). */
const atrasoMic = () => { const d = store.get('setting-tempo') ? store.get('setting-tempo').data : {}; return Number((d.lat || {}).alto || 0) || 0; };

/** Microfone → notas: chama onNota(midi) uma vez por nota tocada (violão, guitarra, teclado, voz). Devolve { stop }. Lança se não abrir. */
export async function ouvirNotas(onNota) {
  const stream = await getMic(); const c = audio(); const src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 2048; src.connect(an);
  const buf = new Float32Array(an.fftSize); const tr = rastreador(); let surdo = false;
  const iv = setInterval(() => {
    an.getFloatTimeDomainData(buf); const nivel = rms(buf);
    const r = !surdo && nivel > 0.012 ? detectPitch(buf, c.sampleRate, { min: 75, max: 1100 }) : null;
    const ev = tr.push(r && r.clarity >= 0.8 ? noteOf(r.freq).midi : null, nivel); if (ev != null) onNota(ev);
  }, 45);
  return { /** enquanto o app toca o exemplo, o microfone não vale (senão ele ouve o próprio alto-falante) */ surdo(v) { surdo = !!v; }, stop() { clearInterval(iv); try { src.disconnect(); } catch { /* já desligado */ } stream.getTracks().forEach((t) => t.stop()); } };
}

/** Microfone → batidas: chama onBatida(t) com o relógio do som, já descontado o atraso medido. Devolve { stop }. Lança se não abrir. */
export async function ouvirBatidas(onBatida) { const lat = atrasoMic(); return openMic((ev) => onBatida(ev.t - lat)); }

/** Estrelas desenhadas: ★★☆ */
export const estrelasTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
/** Entrega as estrelas (cada `chave` paga até 3 ★ na vida; repetir não acumula). */
export const premiar = (jogo, n, chave) => { if (n > 0) import('../figurinhas/mesa.js').then((M) => M.vitoria(jogo, n, chave)).catch(() => { /* sem estrelas */ }); };
/** Quadro de resultado: número grande, estrelas e uma frase. */
export function quadro(grande, estrelas, frase, ...extra) {
  return h('div', { class: 'vv-res', role: 'status' }, h('b', { class: 'vv-res-n' }, grande), h('span', { class: 'vv-res-est', 'aria-label': `${estrelas} de 3 estrelas` }, estrelasTxt(estrelas)), h('p', {}, frase), ...extra);
}
