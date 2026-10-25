// Exportar áudio (WAV) de uma partitura: renderiza sem tocar (OfflineAudioContext) com o mesmo timbre sintetizado do app.
// Lógica de codificação pura (encodeWav) testada em tests/wav.test.mjs.

/** PCM 16 bits, mono. `samples` Float32Array (−1..1). */
export function encodeWav(samples, sampleRate) {
  const buf = new ArrayBuffer(44 + samples.length * 2); const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const x = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  return buf;
}

/** Linha do tempo de uma partitura: [{ t (s), piece, vel }]. Mesma regra de volume do tocador (acento cheio, resto mais baixo). */
export function timeline(doc, steps = (b) => b.steps) {
  const out = []; let t0 = 0;
  for (const bar of doc.bars) {
    const n = steps(bar); const per = { 8: 2, 12: 3, 16: 4 }[n]; const dt = 60 / doc.bpm / per;
    const hasAcc = bar.acc && bar.acc.some(Boolean);
    for (let i = 0; i < n; i++) {
      const vel = hasAcc ? (bar.acc[i] ? 1.1 : 0.55) : 1;
      for (const [p, row] of Object.entries(bar.rows || {})) if (row && row[i]) out.push({ t: t0 + i * dt, piece: p, vel });
    }
    t0 += n * dt;
  }
  return { events: out, dur: t0 };
}

export async function renderWav(doc) {
  const { events, dur } = timeline(doc); const sr = 44100;
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OC(1, Math.ceil((dur + 1.2) * sr), sr);
  const out = ctx.createGain(); out.gain.value = 0.8; out.connect(ctx.destination);
  const noise = ctx.createBuffer(1, sr, sr); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const env = (g, t, peak, len) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + len); };
  const nz = (t, f, peak, len) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = f; const g = ctx.createGain(); env(g, t, peak, len); s.connect(hp).connect(g).connect(out); s.start(t); s.stop(t + len + 0.02); };
  const osc = (t, type, f0, f1, peak, len) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.12, len)); const g = ctx.createGain(); env(g, t, peak, len); o.connect(g).connect(out); o.start(t); o.stop(t + len + 0.02); };
  const V = {
    bd: (t, v) => osc(t, 'sine', 150, 45, 0.9 * v, 0.32),
    sn: (t, v) => { nz(t, 1400, 0.06 + 0.7 * v * v, 0.12 + 0.06 * v); osc(t, 'triangle', 240, 160, 0.05 + 0.4 * v * v, 0.1); },
    hh: (t, v) => nz(t, 7000, 0.3 * v, 0.045), ho: (t, v) => nz(t, 7000, 0.3 * v, 0.22), hf: (t, v) => nz(t, 7000, 0.15 * v, 0.04),
    cr: (t, v) => nz(t, 3800, 0.3 * v, 1.1), rd: (t, v) => nz(t, 5200, 0.16 * v, 0.38),
    tt: (t, v) => osc(t, 'sine', 315, 210, 0.7 * v, 0.35), mt: (t, v) => osc(t, 'sine', 240, 160, 0.7 * v, 0.35), ft: (t, v) => osc(t, 'sine', 165, 110, 0.7 * v, 0.4),
  };
  for (const e of events) (V[e.piece] || V.sn)(e.t + 0.05, e.vel);
  const rendered = await ctx.startRendering();
  return new Blob([encodeWav(rendered.getChannelData(0), sr)], { type: 'audio/wav' });
}
