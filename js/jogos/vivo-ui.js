// Peças de tela e de som que os 4 jogos "de verdade" dividem: nota de piano sintetizada, teclado na tela, chips pequenos,
// o ouvido do microfone (nota e batida) e a entrega das estrelas. Nada de áudio sai do aparelho.
import { h } from '../util.js';
import { audio, out } from '../audio.js';
import { pluck, mallet } from '../instruments.js';
import { getGame, setGame } from './base.js';
import { getMic } from '../mic-access.js';
import { detectPitch, noteOf, rms } from '../pitch.js';
import { openMic } from '../kids/mic.js';
import * as store from '../store.js';
import { rastreador, nomeNota, ehPreta, faixa } from './vivo-logic.js';

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
/** Os sons pra ouvir as notas: piano (teclado sintetizado), violão (corda calculada) e sinos (glockenspiel). Vale pra todos os jogos "de verdade". */
export const TIMBRES = [['piano', 'piano'], ['violao', 'violão'], ['sinos', 'sinos']];
export const timbre = () => { const t = getGame('vivo').som; return TIMBRES.some((x) => x[0] === t) ? t : 'piano'; };
export const setTimbre = (t) => setGame('vivo', { som: t });
/** Nota no som escolhido (piano, violão ou sinos). `t` = instante no relógio do áudio (padrão: agora). */
export function tocaNota(midi, t, dur = 0.42, vol = 0.5, tim = timbre()) {
  try {
    const c = audio(); t = t || c.currentTime + 0.01;
    if (tim === 'violao') { pluck(midi, Math.min(1, vol * 1.7), t, 'acoustic'); return; }
    if (tim === 'sinos') { mallet(midi, Math.min(1, vol * 1.9), 'glockenspiel', t); return; }
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.45, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [tipo, mult, v] of [['triangle', 1, 1], ['sine', 2, 0.28]]) { const o = c.createOscillator(); const og = c.createGain(); o.type = tipo; o.frequency.value = freq(midi) * mult; og.gain.value = v; o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05); }
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
export function teclado({ notas, nomes = true, onNota, pretas = false }) {
  const lo = notas[0]; const hi = notas[notas.length - 1]; const brancas = faixa(lo, hi).filter((m) => !ehPreta(m)); const W = 100 / brancas.length;
  const el = h('div', { class: 'vv-teclado' }); el.style.setProperty('--n', String(brancas.length)); if (brancas.length > 9) el.classList.add('muitas'); const teclas = new Map(); let travado = false;
  brancas.forEach((m) => {
    const vale = notas.includes(m);
    const b = h('button', { type: 'button', class: `vv-tecla${vale ? '' : ' fora'}`, 'data-midi': String(m), disabled: !vale, 'aria-label': nomeNota(m) }, nomes ? h('span', {}, nomeNota(m)) : null);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (travado || !vale) return; onNota(m, e); });
    teclas.set(m, b); el.append(b);
  });
  if (pretas) el.classList.add('pretas');
  brancas.forEach((m, i) => {
    if (i < brancas.length - 1 && ehPreta(m + 1)) {
      if (!pretas) { el.append(h('i', { class: 'vv-preta', 'aria-hidden': 'true', style: { left: `${(i + 1) * W}%` } })); return; }
      const vale = notas.includes(m + 1); const b = h('button', { type: 'button', class: `vv-preta tocavel${vale ? '' : ' fora'}`, 'data-midi': String(m + 1), disabled: !vale, 'aria-label': nomeNota(m + 1), style: { left: `${(i + 1) * W}%` } });
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (travado || !vale) return; onNota(m + 1, e); }); teclas.set(m + 1, b); el.append(b);
    }
  });
  return {
    el,
    acende(midi, classe = 'on', ms = 320) { const alvo = teclas.get(midi) || [...teclas.entries()].filter(([m]) => (m - midi) % 12 === 0).map(([, b]) => b)[0]; if (!alvo) return; alvo.classList.add(classe); setTimeout(() => alvo.classList.remove(classe), ms); },
    trava(v) { travado = !!v; el.classList.toggle('travado', travado); },
  };
}

/** Atraso do microfone medido no Juiz de Tempo (se houver). */
const atrasoMic = () => { const d = store.get('setting-tempo') ? store.get('setting-tempo').data : {}; return Number((d.lat || {}).alto || 0) || 0; };

/** Faixas de detecção por instrumento no microfone (Hz): o violão/guitarra tem notas graves; os sinos soam agudos (e com parciais "desafinados"). */
export const INSTRUMENTOS_MIC = [['violao', 'violão / guitarra', { min: 75, max: 760, clareza: 0.8 }], ['teclado', 'teclado / voz', { min: 110, max: 1100, clareza: 0.8 }], ['sinos', 'sinos', { min: 250, max: 2400, clareza: 0.72 }]];
export const instrumentoMic = () => { const t = getGame('vivo').mic; return INSTRUMENTOS_MIC.some((x) => x[0] === t) ? t : 'violao'; };
export const setInstrumentoMic = (t) => setGame('vivo', { mic: t });
/** Uma leitura do microfone → nota MIDI (ou null): só vale com volume e clareza suficientes na faixa do instrumento. Pura: testável com sinais gerados. */
export function lerNota(buf, sampleRate, instrumento = 'violao') {
  const cfg = (INSTRUMENTOS_MIC.find((x) => x[0] === instrumento) || INSTRUMENTOS_MIC[0])[2]; const nivel = rms(buf); if (nivel <= 0.012) return { midi: null, nivel };
  const r = detectPitch(buf, sampleRate, { min: cfg.min, max: cfg.max }); return { midi: r && r.clarity >= cfg.clareza ? noteOf(r.freq).midi : null, nivel };
}
/** Microfone → notas: chama onNota(midi) uma vez por nota tocada (violão, guitarra, teclado, sinos, voz). Devolve { stop }. Lança se não abrir. */
export async function ouvirNotas(onNota, { instrumento = instrumentoMic() } = {}) {
  const stream = await getMic(); const c = audio(); const src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 2048; src.connect(an);
  const buf = new Float32Array(an.fftSize); const tr = rastreador(); let surdo = false;
  const iv = setInterval(() => {
    an.getFloatTimeDomainData(buf); const r = surdo ? { midi: null, nivel: 0 } : lerNota(buf, c.sampleRate, instrumento);
    const ev = tr.push(r.midi, r.nivel); if (ev != null) onNota(ev);
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
