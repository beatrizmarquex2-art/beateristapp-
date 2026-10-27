// Ferramentas: contas puras (sem tela nem som), testadas em tests/tools.test.mjs.
// Tap tempo, BPM pelo microfone, mapa da música, achar o 1, forma, roleta, desafio da semana, loop do YouTube e notas do groovebox.

/* ---------- tap tempo ---------- */
/** BPM pelas batidas (ms). Usa só as últimas 8 e ignora intervalos fora da curva (toque perdido). Recomeça se parar 2 s. */
export function tapBpm(times) {
  const t = times.slice(-9); if (t.length < 2) return null;
  const iv = []; for (let i = 1; i < t.length; i++) iv.push(t[i] - t[i - 1]);
  const sorted = [...iv].sort((a, b) => a - b); const med = sorted[Math.floor(sorted.length / 2)];
  const ok = iv.filter((x) => Math.abs(x - med) <= med * 0.25);
  const avg = ok.reduce((s, x) => s + x, 0) / ok.length;
  return Math.round((60000 / avg) * 10) / 10;
}
/** Ajusta o BPM pra faixa musical (dobra ou divide por 2 até caber entre 60 e 200). */
export const fold = (bpm, lo = 60, hi = 200) => { let b = bpm; while (b < lo) b *= 2; while (b > hi) b /= 2; return b; };

/* ---------- BPM pelo microfone ---------- */
/**
 * Andamento a partir do "envelope de ataques" (um valor por quadro, `rate` quadros/s): autocorrelação nos atrasos
 * de 60 a 200 BPM, com leve preferência pela faixa 80–160 (onde mora a maioria das músicas). Devolve { bpm, conf }.
 */
export function tempoFromEnvelope(env, rate, { lo = 60, hi = 200 } = {}) {
  const n = env.length; if (n < rate * 3) return null;
  const mean = env.reduce((s, x) => s + x, 0) / n; const x = env.map((v) => Math.max(0, v - mean));
  const energy = x.reduce((s, v) => s + v * v, 0) || 1;
  const ac = (lag) => { let s = 0; for (let i = lag; i < n; i++) s += x[i] * x[i - lag]; return s / energy; };
  let best = null; const scores = [];
  for (let bpm = lo; bpm <= hi; bpm += 0.5) {
    const lag = (60 / bpm) * rate; const l0 = Math.floor(lag); const f = lag - l0;
    let s = ac(l0) * (1 - f) + ac(l0 + 1) * f;
    // reforço pelos múltiplos (compasso) e preferência suave pela faixa central
    const l2 = lag * 2; if (l2 < n / 2) s += 0.5 * (ac(Math.floor(l2)) * (1 - (l2 % 1)) + ac(Math.floor(l2) + 1) * (l2 % 1));
    s *= bpm >= 80 && bpm <= 160 ? 1 : 0.85;
    scores.push(s); if (!best || s > best.s) best = { bpm, s };
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { bpm: Math.round(best.bpm), conf: Math.max(0, Math.min(1, (best.s - avg) / (best.s || 1))) };
}

/* ---------- mapa da música ---------- */
export const SECTION_NAMES = ['intro', 'verso', 'pré-refrão', 'refrão', 'ponte', 'solo', 'virada', 'final'];
export const beatsPerBar = (meter) => Number(String(meter || '4/4').split('/')[0]) || 4;
/** Linha do tempo: cada seção com compasso inicial (0 = primeiro) e total. */
export function timeline(sections) {
  let bar = 0; const out = [];
  for (const s of sections) { const bars = Math.max(1, Number(s.bars) || 1); out.push({ ...s, bars, start: bar }); bar += bars; }
  return { parts: out, total: bar };
}
/** Onde estou no compasso `bar` (0..): seção, compasso dentro dela (1..), quantos faltam e qual é a próxima. */
export function whereAt(tl, bar) {
  const i = tl.parts.findIndex((p) => bar >= p.start && bar < p.start + p.bars); if (i < 0) return null;
  const p = tl.parts[i];
  return { index: i, part: p, barIn: bar - p.start + 1, left: p.start + p.bars - bar, next: tl.parts[i + 1] || null };
}
/** Duração total em segundos. */
export const mapSeconds = (tl, bpm, meter) => (tl.total * beatsPerBar(meter) * 60) / bpm;
export const fmtSec = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/* ---------- forma (contar compassos) ---------- */
const FORMS = [
  [['intro', 4], ['verso', 8], ['refrão', 8], ['verso', 8], ['refrão', 8], ['final', 4]],
  [['intro', 2], ['verso', 8], ['pré-refrão', 4], ['refrão', 8], ['ponte', 4], ['refrão', 8]],
  [['intro', 4], ['verso', 12], ['refrão', 8], ['solo', 8], ['refrão', 8]],
  [['intro', 8], ['verso', 8], ['refrão', 4], ['verso', 8], ['refrão', 4], ['final', 2]],
];
/** Uma forma pra adivinhar: `bars` reais e a pergunta (qual seção) com 4 opções de número. */
export function formQuiz(rnd = Math.random) {
  const f = FORMS[Math.floor(rnd() * FORMS.length)];
  const sections = f.map(([name, bars]) => ({ name, bars }));
  const ask = Math.floor(rnd() * sections.length); const right = sections[ask].bars;
  const opts = [...new Set([right, right + 4, Math.max(2, right - 4), right * 2, right + 2].filter((x) => x > 0))].slice(0, 4);
  for (let k = right + 6; opts.length < 4; k += 2) if (!opts.includes(k)) opts.push(k);
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return { sections, ask, right, opts };
}

/* ---------- achar o 1 ---------- */
/**
 * O groove começa num ponto aleatório do compasso (`offset` em passos). Os toques (segundos desde o início do som)
 * são comparados com o "1" mais perto. Devolve o erro médio (ms, + = atrasado) e quantos foram no 1 (± 1/8 de tempo).
 */
export function oneScore(taps, { bpm, steps, offset }) {
  const step = 60 / bpm / (steps / 4); const bar = step * steps; const first = ((steps - offset) % steps) * step;
  const res = taps.map((t) => { const k = Math.round((t - first) / bar); const one = first + k * bar; return { err: (t - one) * 1000, near: Math.abs(t - one) <= (60 / bpm) / 8 }; });
  const hits = res.filter((r) => r.near);
  return { hits: hits.length, total: taps.length, avg: hits.length ? Math.round(hits.reduce((s, r) => s + r.err, 0) / hits.length) : null, res };
}

/* ---------- roleta ---------- */
/** Sorteia um item diferente do último (se der). */
export function spin(items, last = null, rnd = Math.random) {
  if (!items.length) return null;
  const pool = items.length > 1 ? items.filter((x) => x !== last) : items;
  return pool[Math.floor(rnd() * pool.length)];
}

/* ---------- desafio da semana ---------- */
/** Chave da semana (segunda-feira da semana de `day`, YYYY-MM-DD). */
export function weekKey(day) {
  const d = new Date(`${day}T12:00:00Z`); const w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w);
  return d.toISOString().slice(0, 10);
}
const hash = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; } return x; };
export const TWISTS = ['de olhos fechados', 'só com a mão fraca conduzindo', 'com 1 compasso de virada a cada 4', 'trocando o chimbal pelo prato de condução', 'com ghost notes na caixa', 'cantando a contagem em voz alta', 'gravando e postando sem cortar', 'começando 20 BPM abaixo e subindo de 5 em 5'];
/** O mesmo desafio pra semana toda (muda toda segunda). `pools`: { grooves: [{name,bpm}], ruds: [{name}] }. */
export function weekChallenge(wk, pools, salt = 0) {
  const r = hash(`${wk}#${salt}`);
  const g = pools.grooves.length ? pools.grooves[r % pools.grooves.length] : { name: 'Rock Básico', bpm: 100 };
  const ru = pools.ruds.length ? pools.ruds[(r >>> 8) % pools.ruds.length] : { name: 'Paradiddle simples' };
  const twist = TWISTS[(r >>> 16) % TWISTS.length];
  const bpm = Math.round(((g.bpm || 100) + ((r >>> 4) % 3) * 10) / 5) * 5;
  return { wk, groove: g.name, rud: ru.name, bpm, twist, title: `${g.name} a ${bpm} BPM`, sub: twist, warm: `aquece com ${ru.name}` };
}

/* ---------- loop do YouTube ---------- */
/** id do vídeo a partir do link (youtu.be, watch?v=, shorts, embed). */
export function ytId(url) {
  const m = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/.exec(String(url || '')); return m ? m[1] : null;
}
/** "1:23", "83" ou "1:02:03" → segundos. */
export function parseTime(s) {
  const p = String(s || '').trim().split(':').map(Number); if (!p.length || p.some((x) => Number.isNaN(x))) return null;
  return p.reduce((a, x) => a * 60 + x, 0);
}
export const fmtTime = (s) => { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; };
export const SPEEDS = [0.5, 0.75, 1, 1.25];

/* ---------- groovebox: notas ---------- */
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
/** Acorde → { root (midi grave, pro baixo), notes (midi médio, pro piano) }. Aceita C, Cm, C7, Cmaj7, Cm7, Csus4. */
export function chord(name) {
  const m = /^([A-G](?:#|b)?)(maj7|m7|m|7|sus4|sus2)?$/.exec(String(name || '').trim()); if (!m) return null;
  const r = NOTE[m[1]]; const q = m[2] || '';
  const iv = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus4: [0, 5, 7], sus2: [0, 2, 7] }[q];
  return { name: m[0], root: 36 + r, notes: iv.map((i) => 60 + r + i - (r >= 7 ? 12 : 0)) };
}
export const PROGRESSIONS = [['C', 'G', 'Am', 'F'], ['Am', 'F', 'C', 'G'], ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'], ['Em', 'C', 'G', 'D'], ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7']];
