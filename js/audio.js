// Áudio do app: um único AudioContext, cliques e caixa sintetizados (sem amostras de terceiros, funciona offline).
// Agendamento pelo relógio do AudioContext (olha 120 ms à frente a cada 25 ms) — nunca setInterval tocando som direto.
let ctx = null, master = null, noiseBuf = null;

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume(); // iPhone: só destrava dentro de um toque
  return ctx;
}
export const now = () => (ctx ? ctx.currentTime : 0);

/** Clique de metrônomo. level 2 = tempo 1 (agudo), 1 = tempo, 0 = subdivisão (baixo). */
export function click(t, level = 1, vol = 1) {
  const c = audio(); const o = c.createOscillator(); const g = c.createGain();
  o.type = 'square'; o.frequency.value = level === 2 ? 1760 : level === 1 ? 1175 : 880;
  const peak = (level === 0 ? 0.18 : level === 2 ? 0.5 : 0.35) * vol;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.06);
  return o; // quem agendou muitos cliques de uma vez consegue cancelar
}

/** Caixa sintetizada; `vel` 0–1 (acento = 1, nota fantasma ≈ 0.4). */
export function snare(t, vel = 1) {
  const c = audio();
  const n = c.createBufferSource(); n.buffer = noiseBuf;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
  const gn = c.createGain(); const peak = 0.06 + 0.7 * vel * vel;
  gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + 0.003); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.09 + 0.07 * vel);
  n.connect(hp).connect(gn).connect(master); n.start(t); n.stop(t + 0.2);
  const o = c.createOscillator(); const go = c.createGain(); o.type = 'triangle';
  o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
  go.gain.setValueAtTime(0.0001, t); go.gain.exponentialRampToValueAtTime(0.05 + 0.45 * vel * vel, t + 0.002); go.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(go).connect(master); o.start(t); o.stop(t + 0.12);
}

/** Bumbo sintetizado: seno que cai de ~150 Hz para ~45 Hz. */
export function kick(t, vel = 1) {
  const c = audio(); const o = c.createOscillator(); const g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.35);
}

/** Chimbal fechado (ou aberto com `open`): ruído agudo bem curto. */
export function hihat(t, vel = 1, open = false) {
  vel = Math.min(vel, 1.2);
  const c = audio(); const n = c.createBufferSource(); n.buffer = noiseBuf;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const g = c.createGain(); const len = open ? 0.22 : 0.045;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  n.connect(hp).connect(g).connect(master); n.start(t); n.stop(t + len + 0.02);
}

/** Prato de ataque (crash) ou condução (ride): ruído agudo com cauda longa. */
export function cymbal(t, ride = false, vel = 1) {
  const c = audio(); const n = c.createBufferSource(); n.buffer = noiseBuf; n.loop = true; // o ruído base tem 0,25 s; o prato soa mais
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = ride ? 5200 : 3800;
  const g = c.createGain(); const len = ride ? 0.38 : 1.1; const peak = ride ? 0.16 : 0.3;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  n.connect(hp).connect(g).connect(master); n.start(t); n.stop(t + len + 0.02);
  if (ride) { const o = c.createOscillator(); const og = c.createGain(); o.type = 'triangle'; o.frequency.value = 3150; og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.002); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(og).connect(master); o.start(t); o.stop(t + 0.32); }
}

/** Tom (agudo) ou surdo (grave): seno com queda curta de afinação. */
export function tom(t, freq = 180, vel = 1) {
  const c = audio(); const o = c.createOscillator(); const g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.5, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.4);
}

/**
 * Agendador genérico. `next(i)` devolve {at: segundos desde o início, play(t), ui()} para o evento i, ou null para parar.
 * ui() roda quando o som acontece de verdade (playhead visual sincronizado ao áudio).
 */
export function scheduler(next, { onEnd } = {}) {
  const c = audio(); const t0 = c.currentTime + 0.12; let i = 0, timer = null, stopped = false; const visuals = [];
  let raf = 0;
  const tick = () => {
    while (!stopped) {
      const ev = next(i); if (!ev) { if (!visuals.length) { stop(); onEnd && onEnd(); } break; }
      const at = t0 + ev.at; if (at > c.currentTime + 0.12) break;
      ev.play && ev.play(at); if (ev.ui) visuals.push([at, ev.ui]); i++;
    }
  };
  const draw = () => {
    while (visuals.length && visuals[0][0] <= c.currentTime) visuals.shift()[1]();
    if (!stopped) raf = requestAnimationFrame(draw);
  };
  function stop() { stopped = true; clearInterval(timer); cancelAnimationFrame(raf); }
  tick(); timer = setInterval(tick, 25); raf = requestAnimationFrame(draw);
  return { stop, get running() { return !stopped; } };
}

/** Vibração só onde o navegador suporta (iPhone Safari não suporta: a interface avisa). */
export const canVibrate = () => typeof navigator.vibrate === 'function';
