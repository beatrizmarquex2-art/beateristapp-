// Áudio do app: um único AudioContext, cliques e caixa sintetizados (sem amostras de terceiros, funciona offline).
// Agendamento pelo relógio do AudioContext (olha 120 ms à frente a cada 25 ms) — nunca setInterval tocando som direto.
let ctx = null, master = null, noiseBuf = null;

// iPhone: o Web Audio fica mudo com o botão de silencioso ligado. Tocar um <audio> mudo em loop (e pedir sessão 'playback') faz o som sair mesmo assim.
let muted = false;
try { muted = localStorage.getItem('bt-mute') === '1'; } catch (e) {}
/** Som do app ligado/desligado (ícone do alto-falante no topo). */
export const isMuted = () => muted;
export function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem('bt-mute', muted ? '1' : '0'); } catch (e) {}
  if (master) master.gain.value = muted ? 0 : 0.9;
  window.dispatchEvent(new CustomEvent('bt-mute', { detail: muted }));
}
let keep = null;
function playbackMode() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) {}
  try {
    if (!keep) {
      const n = 800, b = new DataView(new ArrayBuffer(44 + n * 2));
      const w = (o, t) => { for (let i = 0; i < t.length; i++) b.setUint8(o + i, t.charCodeAt(i)); };
      w(0, 'RIFF'); b.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
      b.setUint32(24, 8000, true); b.setUint32(28, 16000, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); w(36, 'data'); b.setUint32(40, n * 2, true);
      keep = new Audio(URL.createObjectURL(new Blob([b.buffer], { type: 'audio/wav' })));
      keep.loop = true; keep.setAttribute('playsinline', ''); keep.volume = 0.01;
    }
    if (keep.paused) keep.play().catch(() => {});
  } catch (e) {}
}
if (typeof document !== 'undefined') {
  const go = () => { playbackMode(); audio(); };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach((ev) => document.addEventListener(ev, go, { capture: true, passive: true }));
}

// saiu do app / bloqueou a tela: solta o áudio mudo de fundo, senão o iPhone mostra o app como "tocando" na ilha dinâmica
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  try { if (keep && !keep.paused) keep.pause(); } catch (e) {}
  try { if (navigator.audioSession && navigator.audioSession.type !== 'auto') navigator.audioSession.type = 'auto'; } catch (e) {}
});

export function audio() {
  if (!ctx) {
    playbackMode();
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {}); // iPhone: só destrava dentro de um toque ('suspended' ou 'interrupted' depois de bloquear a tela/receber chamada)
  return ctx;
}
export const now = () => (ctx ? ctx.currentTime : 0);
/** Saída principal (pra outros sintetizadores, ex.: o groovebox). */
export const out = () => { audio(); return master; };
/** Ruído branco curto (0,25 s) já pronto. */
export const noise = () => { audio(); return noiseBuf; };

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
const running = new Set();
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
  const handle = { stop, get running() { return !stopped; } };
  function stop() { stopped = true; clearInterval(timer); cancelAnimationFrame(raf); running.delete(handle); }
  running.add(handle);
  tick(); timer = setInterval(tick, 25); raf = requestAnimationFrame(draw);
  return handle;
}

/**
 * Geração do som: sobe a cada silence(). Quem agenda algo pra "depois" guarda o valor e confere antes de tocar
 * (uma fase antiga não pode mais disparar som na fase nova).
 */
let epoch = 0;
export const audioEpoch = () => epoch;
/** setTimeout de som: morre junto com o silence() (troca de tela, de fase ou de rodada). Ex.: "toca o exemplo 250 ms depois de mostrar a pergunta". */
const pending = new Set();
export function later(fn, ms) {
  const id = setTimeout(() => { pending.delete(id); fn(); }, ms);
  pending.add(id); return id;
}
export function cancelLater(id) { clearTimeout(id); pending.delete(id); }

/**
 * Cala tudo que a tela deixou tocando: para os agendadores e troca a saída principal por uma nova
 * (o que já estava agendado na saída velha some junto). O estúdio de ambiente tem saída própria e continua.
 */
export function silence() {
  epoch++;
  for (const id of pending) clearTimeout(id);
  pending.clear();
  for (const r of [...running]) r.stop();
  if (!ctx || !master) return;
  const old = master; const t = ctx.currentTime;
  old.gain.setTargetAtTime(0, t, 0.01); setTimeout(() => { try { old.disconnect(); } catch { /* já saiu */ } }, 80);
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
}

/** Converte um instante do relógio da tela (event.timeStamp / performance.now) pro relógio do som que está SAINDO no alto-falante. */
export function perfToCtx(perfMs) {
  const c = audio(); const ts = c.getOutputTimestamp && c.getOutputTimestamp();
  if (ts && ts.performanceTime) return ts.contextTime + (perfMs - ts.performanceTime) / 1000;
  return c.currentTime - (c.outputLatency || 0) - (c.baseLatency || 0) - (performance.now() - perfMs) / 1000;
}

/** Vibração só onde o navegador suporta (iPhone Safari não suporta: a interface avisa). */
export const canVibrate = () => typeof navigator.vibrate === 'function';
