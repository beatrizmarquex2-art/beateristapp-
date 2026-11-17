// Captura de toques: conta 4 e escuta `beats` tempos. O toque vem de um botão grande na tela ou do microfone (pad / bateria de verdade).
import * as store from '../store.js';
import { audio, click, perfToCtx } from '../audio.js';
import { openMic } from './mic.js';
import { aprendeVazamento, ehVazamento } from './mic-vazamento.js';

/** Atraso medido no Juiz de Tempo (se houver), pra compensar o microfone. */
const micLatency = () => { const d = store.get('setting-tempo') ? store.get('setting-tempo').data : {}; const l = d.lat || {}; return Number(l.alto || 0) || 0; };

/**
 * mode: 'tela' (precisa de `pad`) ou 'mic'. Devolve { done, cancel, inject, t0 }:
 * done resolve com { onsets: [segundos desde o 1º tempo], t0 } (ou rejeita se o microfone não abriu).
 * tapSound() toca o som de cada toque na tela (sem ele a criança toca no mudo).
 * onCount(i) avisa cada tempo da contagem (i = 0..3) e depois 'go' em i = 4.
 */
export function capture({ mode, pad, bpm, beats, countIn = 4, tail = 0.4, onCount, tapSound, clickBeats = true, onHit = null }) {
  const c = audio(); const q = 60 / bpm; let mic = null; let cancelled = false; const hits = []; const evs = []; const cliques = []; const contagem = []; let vaza = null; const timers = []; let onTap = null; const oscs = [];
  const t0 = c.currentTime + 0.4 + countIn * q;
  const cleanup = () => { timers.forEach(clearTimeout); oscs.forEach((o) => { try { o.stop(); } catch { /* já tocou */ } }); if (mic) mic.stop(); if (pad && onTap) pad.removeEventListener('pointerdown', onTap); };
  const done = (async () => {
    if (mode === 'mic') { const lat = micLatency(); const m = await openMic((ev) => { const e = { raw: ev.t, t: ev.t - lat, level: ev.level, buf: ev.buf }; evs.push(e); if (!vaza && evs.length && c.currentTime > t0 - 0.05) vaza = aprendeVazamento(evs, contagem); if (ehVazamento(e, cliques, vaza)) return; /* clique do alto-falante, não é batida */ hits.push(e.t); e.conta = true; if (onHit && c.currentTime > t0 - 0.3) { try { onHit(e.t - t0, e); } catch { /* tela fechada */ } } }); if (cancelled) { m.stop(); return { onsets: [], t0 }; } mic = m; } // saiu enquanto o microfone abria: desliga na hora e não agenda nada
    else if (pad) { onTap = (e) => { hits.push(perfToCtx(e.timeStamp || performance.now())); if (tapSound) { try { tapSound(); } catch { /* sem som */ } } }; pad.addEventListener('pointerdown', onTap); }
    if (cancelled) return { onsets: [], t0 };
    for (let i = 0; i < countIn; i++) { const ct = t0 - (countIn - i) * q; contagem.push(ct); cliques.push(ct); oscs.push(click(ct, i === 0 ? 2 : 1, 0.9)); }
    if (clickBeats) for (let b = 0; b < beats; b++) { const ct = t0 + b * q; cliques.push(ct); oscs.push(click(ct, b % 4 === 0 ? 2 : 1, 0.3)); } // o clique que vaza pro microfone é descartado por mic-vazamento.js
    if (onCount) for (let i = 0; i <= countIn; i++) timers.push(setTimeout(() => !cancelled && onCount(i), Math.max(0, (t0 - (countIn - i) * q - c.currentTime) * 1000)));
    await new Promise((ok) => timers.push(setTimeout(ok, Math.max(0, (t0 + beats * q + tail - c.currentTime) * 1000))));
    cleanup();
    const dentro = (x) => x > -0.3 && x < beats * q + 0.35; const eventos = evs.filter((e) => e.conta && dentro(e.t - t0)).map((e) => ({ t: e.t - t0, level: e.level, buf: e.buf }));
    return { onsets: hits.map((t) => t - t0).filter(dentro), eventos, t0 };
  })();
  const handle = { done, t0, cancel() { cancelled = true; cleanup(); }, inject(rel) { hits.push(t0 + rel); } };
  if (typeof window !== 'undefined' && window.__kidsTest) window.__kidsTest.cap = handle; // gancho só pros testes automáticos
  return handle;
}
