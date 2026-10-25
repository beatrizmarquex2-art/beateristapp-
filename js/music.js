// Motor musical puro (sem áudio, sem DOM): a partitura e o som saem dos MESMOS eventos daqui. Testado em Node.

/* ---------- acentuação matemática (método Beaterista, Ebook 2, p. 15–19) ----------
   1 tempo = 4 semicolcheias D E D E, exatamente 1 acento por tempo.
   modelo 1 = Dede, 2 = dEde, 3 = deDe, 4 = dedE. Um desafio 4/4 = 4 modelos em sequência = 16 semicolcheias. */
export const STICKING = ['D', 'E', 'D', 'E'];
export const TEMPLATE_NAMES = { 1: 'Dede', 2: 'dEde', 3: 'deDe', 4: 'dedE' };
export const ACCENT_VEL = 1, GHOST_VEL = 0.42;

export const isValidTemplate = (t) => Number.isInteger(t) && t >= 1 && t <= 4;
export function isValidChallenge(seq) { return Array.isArray(seq) && seq.length === 4 && seq.every(isValidTemplate); }

/** Sorteia 4 modelos (cada um é UM tempo). `distinct` = uma das 24 permutações de 1-2-3-4 (p. 17). */
export function randomChallenge({ distinct = false, rand = Math.random } = {}) {
  if (distinct) {
    const a = [1, 2, 3, 4];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  return Array.from({ length: 4 }, () => 1 + Math.floor(rand() * 4));
}

/** As 24 permutações (ordem lexicográfica), para "próximo desafio" percorrer todas. */
export function permutations24() {
  const out = [];
  const rec = (pre, rest) => { if (!rest.length) { out.push(pre); return; } rest.forEach((x, i) => rec([...pre, x], rest.filter((_, k) => k !== i))); };
  rec([], [1, 2, 3, 4]);
  return out;
}

/** 16 eventos (semicolcheias) de um desafio. step 0–15, beat 0–3, pos 0–3 dentro do tempo. */
export function challengeEvents(seq) {
  if (!isValidChallenge(seq)) throw new Error('desafio inválido: precisa de 4 modelos entre 1 e 4');
  const ev = [];
  seq.forEach((t, beat) => {
    for (let pos = 0; pos < 4; pos++) {
      const accent = pos === t - 1;
      ev.push({ step: beat * 4 + pos, beat, pos, hand: STICKING[pos], accent, vel: accent ? ACCENT_VEL : GHOST_VEL, dur: 1 / 16 });
    }
  });
  return ev;
}
/** Soma das durações = 1 compasso de 4/4 (validação matemática). */
export const barLength = (ev) => ev.reduce((n, e) => n + e.dur, 0);

/* ---------- tempo ---------- */
export const BPM_MIN = 30, BPM_MAX = 260;
export const clampBpm = (b) => Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(Number(b) || 0)));
/** duração de uma semínima em segundos */
export const beatSec = (bpm) => 60 / clampBpm(bpm);

/** Tap tempo: média dos últimos intervalos (ignora pausa > 2 s, que recomeça a contagem). */
export function tapBpm(times) {
  const t = times.slice(-6); const gaps = [];
  for (let i = 1; i < t.length; i++) { const g = t[i] - t[i - 1]; if (g > 2000) { gaps.length = 0; continue; } gaps.push(g); }
  if (!gaps.length) return null;
  return clampBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
}

/** Modo progressivo: BPM do compasso `bar` (0, 1, 2…), subindo `step` a cada `every` compassos até `target`. */
export function progressiveBpm({ start, target, step, every }, bar) {
  const s = clampBpm(start), t = clampBpm(target), inc = Math.max(1, Math.abs(step || 1)), ev = Math.max(1, every || 1);
  const dir = t >= s ? 1 : -1; const v = s + dir * inc * Math.floor(bar / ev);
  return dir > 0 ? Math.min(v, t) : Math.max(v, t);
}

export const METERS = { '2/4': { beats: 2, unit: 4 }, '3/4': { beats: 3, unit: 4 }, '4/4': { beats: 4, unit: 4 }, '5/4': { beats: 5, unit: 4 }, '6/8': { beats: 6, unit: 8 }, '7/8': { beats: 7, unit: 8 } };

/** Grade de cliques de um compasso de metrônomo: {beat, sub, accent, level}. level: 2 = tempo 1, 1 = tempo, 0 = subdivisão. */
export function meterClicks(meter = '4/4', subdiv = 1, accentFirst = true) {
  const m = METERS[meter] || METERS['4/4']; const out = [];
  for (let b = 0; b < m.beats; b++) for (let s = 0; s < subdiv; s++) {
    const level = s ? 0 : (b === 0 && accentFirst ? 2 : 1);
    out.push({ beat: b, sub: s, level, frac: (b + s / subdiv) });
  }
  return out;
}
/** Em compasso composto (x/8) o pulso é a colcheia; em x/4 é a semínima. Devolve o intervalo entre tempos. */
export const pulseSec = (bpm, meter = '4/4') => beatSec(bpm) * ((METERS[meter] || METERS['4/4']).unit === 8 ? 0.5 : 1);
