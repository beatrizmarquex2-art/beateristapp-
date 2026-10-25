// Análise de som feita no próprio aparelho (nada sai do celular): altura (YIN), notas, ataques e andamento.
// Funções puras, sem tela; testadas com sinais sintéticos em tests/pitch.test.mjs.

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SOLFA = ['dó', 'dó#', 'ré', 'ré#', 'mi', 'fá', 'fá#', 'sol', 'sol#', 'lá', 'lá#', 'si'];

/** Nível RMS de um bloco. */
export function rms(buf) { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); }

/**
 * Frequência fundamental pelo método YIN (de Cheveigné & Kawahara), limitado à faixa [min, max] Hz.
 * Devolve { freq, clarity } (clarity 0–1, quanto maior mais confiável) ou null se não achar tom.
 */
export function detectPitch(buf, sampleRate, { min = 60, max = 1000, threshold = 0.15 } = {}) {
  const maxLag = Math.min(Math.floor(sampleRate / min), Math.floor(buf.length / 2));
  const minLag = Math.max(2, Math.floor(sampleRate / max));
  if (maxLag <= minLag + 2) return null;
  const W = buf.length - maxLag;
  const d = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + lag]; s += x * x; }
    d[lag] = s;
  }
  // diferença normalizada pela média acumulada
  const cm = new Float32Array(maxLag + 1); cm[0] = 1; let run = 0;
  for (let lag = 1; lag <= maxLag; lag++) { run += d[lag]; cm[lag] = run ? d[lag] * lag / run : 1; }
  let best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (cm[lag] < threshold) { while (lag + 1 <= maxLag && cm[lag + 1] < cm[lag]) lag++; best = lag; break; }
  }
  if (best < 0) { // sem passar do limiar: pega o mínimo global se for razoável
    let m = Infinity; for (let lag = minLag; lag <= maxLag; lag++) if (cm[lag] < m) { m = cm[lag]; best = lag; }
    if (m > 0.35) return null;
  }
  // interpolação parabólica para precisão abaixo de uma amostra
  const a = cm[best - 1] ?? cm[best], b = cm[best], c = cm[best + 1] ?? cm[best];
  const den = a - 2 * b + c; const shift = den ? (a - c) / (2 * den) : 0;
  const lag = best + Math.max(-1, Math.min(1, shift));
  return { freq: sampleRate / lag, clarity: Math.max(0, Math.min(1, 1 - b)) };
}

/** FFT radix-2 no lugar (re, im com tamanho potência de 2). */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2; const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

/**
 * Altura de tambor: a membrana tem harmônicos fora da série (1, 1,59, 2,14…), então o YIN se confunde.
 * Aqui: espectro com janela Hann e zero-padding, e o pico MAIS GRAVE que seja forte (≥ 45% do maior) dentro da faixa da peça.
 */
export function drumPitch(buf, sampleRate, { min = 40, max = 420, size = 16384 } = {}) {
  const re = new Float64Array(size), im = new Float64Array(size); const n = Math.min(buf.length, size);
  for (let i = 0; i < n; i++) re[i] = buf[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
  fft(re, im);
  const binHz = sampleRate / size; const lo = Math.max(1, Math.floor(min / binHz)), hi = Math.min(size / 2 - 2, Math.ceil(max / binHz));
  const mag = (k) => Math.hypot(re[k], im[k]);
  let peak = 0, total = 0; for (let k = lo; k <= hi; k++) { const m = mag(k); total += m; if (m > peak) peak = m; }
  if (!peak) return null;
  for (let k = lo + 1; k < hi; k++) {
    const m = mag(k); if (m < peak * 0.45 || m < mag(k - 1) || m < mag(k + 1)) continue;
    const a = Math.log(mag(k - 1) + 1e-12), b = Math.log(m), c = Math.log(mag(k + 1) + 1e-12);
    const den = a - 2 * b + c; const shift = den ? 0.5 * (a - c) / den : 0;
    return { freq: (k + shift) * binHz, clarity: Math.min(1, (m / total) * 12) };
  }
  return null;
}

/** Nota mais próxima de uma frequência: { name, solfa, octave, midi, cents, label }. */
export function noteOf(freq, a4 = 440) {
  const m = 69 + 12 * Math.log2(freq / a4); const midi = Math.round(m);
  const cents = Math.round((m - midi) * 100); const i = ((midi % 12) + 12) % 12; const octave = Math.floor(midi / 12) - 1;
  return { name: NAMES[i], solfa: SOLFA[i], octave, midi, cents, label: `${NAMES[i]}${octave}` };
}
export const freqOf = (midi, a4 = 440) => a4 * 2 ** ((midi - 69) / 12);
export const centsBetween = (f, target) => Math.round(1200 * Math.log2(f / target));
export const midiName = (midi) => { const i = ((midi % 12) + 12) % 12; return { name: NAMES[i], solfa: SOLFA[i], octave: Math.floor(midi / 12) - 1, label: `${NAMES[i]}${Math.floor(midi / 12) - 1}` }; };

/** Faixas típicas da fundamental de cada peça (afinação comum; varia com o tamanho do tambor). */
export const PIECES = [
  { id: 'caixa', label: 'Caixa', min: 150, max: 420 },
  { id: 'tom1', label: 'Tom 1', min: 110, max: 320 },
  { id: 'tom2', label: 'Tom 2', min: 90, max: 240 },
  { id: 'surdo', label: 'Surdo', min: 60, max: 160 },
  { id: 'bumbo', label: 'Bumbo', min: 40, max: 110 },
];

/** Média que descarta o mais distante (leitura mais calma no ponteiro). */
export function steady(values) {
  const v = values.filter((x) => Number.isFinite(x)); if (!v.length) return null;
  if (v.length < 3) return v.reduce((a, b) => a + b, 0) / v.length;
  const s = [...v].sort((a, b) => a - b); const med = s[Math.floor(s.length / 2)];
  const keep = v.filter((x) => Math.abs(x - med) / med < 0.03);
  return (keep.length ? keep : [med]).reduce((a, b) => a + b, 0) / (keep.length || 1);
}

/**
 * Detector de ataques em tempo real, alimentado com o nível (RMS) de cada quadro.
 * Ataque = subida forte acima do ruído de fundo, com intervalo mínimo entre ataques.
 */
export function onsetDetector({ ratio = 2.2, floor = 0.012, gap = 0.09 } = {}) {
  let noise = 0.005, prev = 0, last = -Infinity;
  return (level, t) => {
    const rise = level - prev; prev = level;
    const hit = level > floor && level > noise * ratio && rise > noise * 0.8 && t - last >= gap;
    noise = noise * 0.97 + Math.min(level, noise * 3) * 0.03; // ruído de fundo segue devagar
    if (hit) { last = t; return true; }
    return false;
  };
}

/**
 * Andamento a partir dos instantes dos ataques (segundos).
 * Dobra/divide intervalos para 60–200 BPM, agrupa e mede a confiança (quanto dos intervalos concorda).
 */
export function tempoOf(times, { lo = 60, hi = 200 } = {}) {
  if (times.length < 4) return null;
  const iois = [];
  for (let i = 1; i < times.length; i++) { const d = times[i] - times[i - 1]; if (d > 0.12 && d < 2.5) iois.push(d); }
  if (iois.length < 3) return null;
  const fold = (bpm) => { while (bpm < lo) bpm *= 2; while (bpm > hi) bpm /= 2; return bpm; };
  const cands = iois.map((d) => fold(60 / d));
  // o candidato com mais vizinhos (±4%) ganha; depois média dos que concordam
  let best = cands[0], bestN = 0;
  for (const c of cands) { const n = cands.filter((x) => Math.abs(x - c) / c < 0.04).length; if (n > bestN) { bestN = n; best = c; } }
  const agree = cands.filter((x) => Math.abs(x - best) / best < 0.04);
  const bpm = agree.reduce((a, b) => a + b, 0) / agree.length;
  const spread = Math.sqrt(agree.reduce((a, b) => a + (b - bpm) ** 2, 0) / agree.length);
  return { bpm: Math.round(bpm), exact: bpm, confidence: Math.round(100 * agree.length / cands.length), stable: agree.length / cands.length >= 0.7 && spread < 2.5, spread };
}

/**
 * Melodia: transforma uma sequência de leituras {t, freq|null} em notas {midi, start, dur}.
 * Junta leituras seguidas na mesma nota (±0,5 semitom), ignora pedaços curtos demais.
 */
export function segmentNotes(frames, { minDur = 0.09, maxGap = 0.06 } = {}) {
  const out = []; let cur = null;
  const close = () => { if (cur && cur.end - cur.start >= minDur) out.push({ midi: Math.round(median(cur.m)), start: cur.start, dur: +(cur.end - cur.start).toFixed(3) }); cur = null; };
  for (const f of frames) {
    if (!f.freq) { if (cur && f.t - cur.end > maxGap) close(); continue; }
    const m = 69 + 12 * Math.log2(f.freq / 440);
    if (cur && Math.abs(m - median(cur.m)) <= 0.5 && f.t - cur.end <= maxGap + 0.05) { cur.m.push(m); cur.end = f.t; }
    else { close(); cur = { m: [m], start: f.t, end: f.t }; }
  }
  close();
  return out;
}
function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
