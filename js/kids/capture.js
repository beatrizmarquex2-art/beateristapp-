// Captura de toques: conta 4 e escuta `beats` tempos. O toque vem de um botão grande na tela ou do microfone (pad / bateria de verdade).
import * as store from '../store.js';
import { audio, click, perfToCtx } from '../audio.js';
import { openMic } from './mic.js';

/** Atraso medido no Juiz de Tempo (se houver), pra compensar o microfone. */
const micLatency = () => { const d = store.get('setting-tempo') ? store.get('setting-tempo').data : {}; const l = d.lat || {}; return Number(l.alto || 0) || 0; };

/**
 * mode: 'tela' (precisa de `pad`) ou 'mic'. Devolve { done, cancel, inject, t0 }:
 * done resolve com { onsets: [segundos desde o 1º tempo], t0 } (ou rejeita se o microfone não abriu).
 * onCount(i) avisa cada tempo da contagem (i = 0..3) e depois 'go' em i = 4.
 */
export function capture({ mode, pad, bpm, beats, countIn = 4, tail = 0.4, onCount }) {
  const c = audio(); const q = 60 / bpm; let mic = null; let cancelled = false; const hits = []; const timers = []; let onTap = null; const oscs = [];
  const t0 = c.currentTime + 0.4 + countIn * q;
  const cleanup = () => { timers.forEach(clearTimeout); oscs.forEach((o) => { try { o.stop(); } catch { /* já tocou */ } }); if (mic) mic.stop(); if (pad && onTap) pad.removeEventListener('pointerdown', onTap); };
  const done = (async () => {
    if (mode === 'mic') { const lat = micLatency(); const m = await openMic((ev) => hits.push(ev.t - lat)); if (cancelled) { m.stop(); return { onsets: [], t0 }; } mic = m; } // saiu enquanto o microfone abria: desliga na hora e não agenda nada
    else if (pad) { onTap = (e) => { hits.push(perfToCtx(e.timeStamp || performance.now())); }; pad.addEventListener('pointerdown', onTap); }
    if (cancelled) return { onsets: [], t0 };
    for (let i = 0; i < countIn; i++) oscs.push(click(t0 - (countIn - i) * q, i === 0 ? 2 : 1, 0.9));
    for (let b = 0; b < beats; b++) oscs.push(click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.3));
    if (onCount) for (let i = 0; i <= countIn; i++) timers.push(setTimeout(() => !cancelled && onCount(i), Math.max(0, (t0 - (countIn - i) * q - c.currentTime) * 1000)));
    await new Promise((ok) => timers.push(setTimeout(ok, Math.max(0, (t0 + beats * q + tail - c.currentTime) * 1000))));
    cleanup();
    return { onsets: hits.map((t) => t - t0).filter((x) => x > -0.3 && x < beats * q + 0.35), t0 };
  })();
  const handle = { done, t0, cancel() { cancelled = true; cleanup(); }, inject(rel) { hits.push(t0 + rel); } };
  if (typeof window !== 'undefined' && window.__kidsTest) window.__kidsTest.cap = handle; // gancho só pros testes automáticos
  return handle;
}
