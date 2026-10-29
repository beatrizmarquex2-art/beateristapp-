// MIDI → fase dos jogos de ritmo (o mesmo "arranjo" que o pacote gera pras músicas dele):
// bateria do canal 10 vira as pistas do Palco/bateria, a faixa de melodia vira as notas da guitarra, do teclado,
// do Piano Tiles, do Beatstar e das Setinhas; baixo e acordes tocam no fundo. Puro, testado em tests/midi.test.mjs.

/** Bateria General MIDI → som e pista do pacote (0 bumbo, 1 caixa, 2 chimbal/pratos, 3 tons). */
export const GM_DRUM = {
  35: 'kick', 36: 'kick', 37: 'snare', 38: 'snare', 39: 'snare', 40: 'snare',
  42: 'hhc', 44: 'hhc', 46: 'hho', 49: 'crash', 52: 'crash', 55: 'crash', 57: 'crash', 51: 'ride', 53: 'ride', 59: 'ride',
  48: 'tom1', 50: 'tom1', 45: 'tom2', 47: 'tom2', 41: 'floor', 43: 'floor',
  // percussão extra que aparece em MIDIs de pop/latino: vira a peça mais parecida
  54: 'hhc', 56: 'hhc', 58: 'crash', 60: 'tom1', 61: 'tom1', 62: 'tom2', 63: 'tom2', 64: 'floor', 65: 'tom1', 66: 'tom2', 67: 'snare', 68: 'snare', 69: 'hhc', 70: 'hhc', 75: 'hhc', 76: 'snare', 77: 'snare',
};
const LANE = { kick: 0, snare: 1, hhc: 2, hho: 2, ride: 2, crash: 2, tom1: 3, tom2: 3, floor: 3 };
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
// perfis de Krumhansl pra achar o tom
const KMAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KMIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/** Andamento que mais dura no arquivo (o primeiro às vezes é só um "120" padrão antes do de verdade). */
export function mainBpm(midi) {
  const t = midi.tempos; if (!t.length) return 120;
  // tempo de cada trecho em segundos (o último vai até o fim da música)
  let sec = 0; const spans = t.map((x, i) => { const start = sec; if (i + 1 < t.length) sec += ((t[i + 1].tick - x.tick) * x.us) / midi.ppq / 1e6; return { us: x.us, start }; });
  spans.forEach((x, i) => { x.len = (i + 1 < spans.length ? spans[i + 1].start : Math.max(midi.dur, x.start)) - x.start; });
  const best = spans.reduce((a, b2) => (b2.len > a.len ? b2 : a));
  return Math.round((60e6 / best.us) * 10) / 10;
}

/** Tom (root como classe 0–11 e menor/maior) pelos pesos de duração das notas. */
export function findKey(notes) {
  const w = Array(12).fill(0); notes.forEach((n) => { w[n.m % 12] += Math.min(n.d, 2); });
  const corr = (prof, r) => { const xs = prof.map((_, i) => w[(i + r) % 12]); const mx = xs.reduce((a, b) => a + b, 0) / 12, mp = prof.reduce((a, b) => a + b, 0) / 12;
    let n = 0, dx = 0, dp = 0; xs.forEach((x, i) => { n += (x - mx) * (prof[i] - mp); dx += (x - mx) ** 2; dp += (prof[i] - mp) ** 2; }); return dx && dp ? n / Math.sqrt(dx * dp) : 0; };
  let best = { root: 0, minor: false, c: -2 };
  for (let r = 0; r < 12; r++) { const a = corr(KMAJ, r), b2 = corr(KMIN, r); if (a > best.c) best = { root: r, minor: false, c: a }; if (b2 > best.c) best = { root: r, minor: true, c: b2 }; }
  return best;
}

/** Faixa de melodia: a mais "cantável" (monofônica, no meio do teclado, com nome de voz/melodia ganha bônus). */
export function pickMelody(midi) {
  let best = null;
  midi.tracks.forEach((tr, i) => {
    const ns = tr.notes.filter((n) => n.ch !== 9); if (ns.length < 8) return;
    const avg = ns.reduce((s, n) => s + n.m, 0) / ns.length; if (avg < 50) return; // baixo
    let poly = 0; for (let k = 1; k < ns.length; k++) if (Math.abs(ns[k].t - ns[k - 1].t) < 0.03) poly++;
    const mono = 1 - poly / ns.length;
    const named = /voc|voz|vox|melod|lead|sing|canto|main/i.test(tr.name) ? 1.6 : 1;
    const score = Math.min(ns.length, 600) * (0.3 + mono) * (avg >= 55 && avg <= 84 ? 1 : 0.6) * named;
    if (!best || score > best.score) best = { i, score };
  });
  return best ? best.i : -1;
}

/** Uma nota por vez (a mais aguda quando batem juntas) e sem sobrepor a próxima. */
export function skyline(notes) {
  const out = [];
  for (const n of notes) {
    const last = out[out.length - 1];
    if (last && Math.abs(n.t - last.t) < 0.03) { if (n.m > last.m) out[out.length - 1] = { ...n }; continue; }
    if (last && last.t + last.d > n.t) last.d = Math.max(0.05, n.t - last.t);
    out.push({ ...n });
  }
  return out;
}

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

/**
 * Monta a fase. Devolve { song, report } ou lança erro se não der pra jogar (sem bateria e sem melodia).
 * song = { id, style: 'imp', name, bpm, root, minor, seed, imported: true, arr: { st, mel, drums, ev, chords, dur, bars, lead } }.
 */
export function toChart(midi, name = 'MIDI') {
  const bpm = Math.max(40, Math.min(240, mainBpm(midi)));
  const st = 60 / bpm / 4, barLen = 16 * st, lead = 1;
  const all = midi.tracks.flatMap((tr) => tr.notes);
  const drumsRaw = all.filter((n) => n.ch === 9 && GM_DRUM[n.m]);
  let mi = pickMelody(midi);
  // sem faixa "cantável" clara: usa a faixa com mais notas (menos o canal da bateria) como melodia
  if (mi < 0) { let best = 0; midi.tracks.forEach((tr, i) => { const c = tr.notes.filter((n) => n.ch !== 9).length; if (c > best && c >= 8) { best = c; mi = i; } }); }
  const melRaw = mi >= 0 ? skyline(midi.tracks[mi].notes.filter((n) => n.ch !== 9)) : [];
  if (!drumsRaw.length && melRaw.length < 8) throw new Error('sem bateria (canal 10) e sem melodia');
  const pitched = all.filter((n) => n.ch !== 9);
  const key = findKey(pitched.length ? pitched : melRaw);
  // alinha: o compasso da primeira nota começa depois de 1 compasso de contagem
  const first = Math.min(...[...drumsRaw, ...melRaw, ...pitched].map((n) => n.t));
  const shift = lead * barLen - Math.floor(first / barLen + 1e-6) * barLen;
  const at = (t) => t + shift;
  const barOf = (t) => Math.floor((t + 1e-6) / barLen) - lead;
  const stepOf = (t) => Math.round(((t + 1e-6) % barLen) / st) % 16;
  const scale = key.minor ? MIN : MAJ; const root = 48 + key.root;
  const idxOf = (m) => { const rel = m - (root + 12); const oct = Math.floor(rel / 12); const pc = ((rel % 12) + 12) % 12;
    let bi = 0, bd = 99; scale.forEach((s, i) => { const d = Math.abs(s - pc); if (d < bd) { bd = d; bi = i; } }); return oct * 7 + bi; };
  let drums = drumsRaw.map((n) => { const snd = GM_DRUM[n.m]; const t = at(n.t); return { t, lane: LANE[snd], snd, v: Math.max(0.3, n.v / 127), bar: barOf(t), kind: 'verso' }; });
  // tira duplicata de pista no mesmo instante (ex.: duas caixas juntas)
  // sem bateria no arquivo: cria um ritmo em cima da música (bumbo nos graves e nos tempos 1 e 3, caixa nos 2 e 4, chimbal nas colcheias)
  let synthDrums = false;
  if (drums.length < 8) {
    synthDrums = true; drums = [];
    const e0 = Math.max(...melRaw.map((n) => at(n.t) + n.d), ...pitched.map((n) => at(n.t) + n.d), 0);
    const bass = pitched.filter((n) => n.m < 52).map((n) => at(n.t)).sort((a, b2) => a - b2);
    const active = new Set(pitched.concat(melRaw).map((n) => Math.floor(at(n.t) / barLen)));
    for (let b0 = lead; b0 * barLen < e0; b0++) {
      if (!active.has(b0)) continue; const t0 = b0 * barLen;
      for (let s = 0; s < 16; s += 2) {
        const t = t0 + s * st; const q = s % 8 === 0 ? 'kick' : s % 8 === 4 ? 'snare' : 'hhc';
        if (s % 8 === 0 && s % 16 === 8 && !bass.some((x) => Math.abs(x - t) < 0.06) && b0 % 2) continue;
        drums.push({ t, lane: LANE[q], snd: q, v: s % 8 === 0 ? 0.9 : 0.75, bar: b0 - lead, kind: 'verso' });
        if (s % 4 === 2) drums.push({ t, lane: LANE.hhc, snd: 'hhc', v: 0.45, bar: b0 - lead, kind: 'verso' });
      }
      // bumbo extra onde o baixo toca fora do tempo forte
      bass.filter((x) => x >= t0 && x < t0 + barLen).forEach((x) => { const s = Math.round((x - t0) / st); if (s % 4 !== 0 && !drums.some((d) => d.snd === 'kick' && Math.abs(d.t - x) < 0.1)) drums.push({ t: x, lane: 0, snd: 'kick', v: 0.8, bar: b0 - lead, kind: 'verso' }); });
    }
  }
  const seen = new Set(); const drumsU = drums.filter((d) => { const k = `${d.snd}|${Math.round(d.t * 200)}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const mel = melRaw.map((n) => { const t = at(n.t); const ds = Math.max(1, Math.min(16, Math.round(n.d / st))); return { t, m: n.m, idx: idxOf(n.m), d: n.d, ds, bar: barOf(t), step: stepOf(t), kind: 'verso' }; });
  // fundo: baixo e o resto das notas (acordes agrupados) — limite pra não pesar no celular
  const ev = [];
  const others = midi.tracks.flatMap((tr, i) => (i === mi ? [] : tr.notes.filter((n) => n.ch !== 9)));
  const bassNotes = others.filter((n) => n.m < 52); const restNotes = others.filter((n) => n.m >= 52);
  bassNotes.slice(0, 3000).forEach((n) => ev.push({ t: at(n.t), k: 'bass', m: n.m, d: Math.min(n.d, 2) }));
  const groups = []; restNotes.slice(0, 6000).forEach((n) => { const g = groups[groups.length - 1]; if (g && Math.abs(g.t - n.t) < 0.03) { if (g.ms.length < 5 && !g.ms.includes(n.m)) g.ms.push(n.m); g.d = Math.max(g.d, n.d); } else groups.push({ t: n.t, ms: [n.m], d: n.d }); });
  groups.sort((a, b2) => a.t - b2.t).slice(0, 2500).forEach((g) => ev.push({ t: at(g.t), k: 'chord', ms: g.ms, d: Math.min(g.d, 3), sty: 'pop' }));
  ev.sort((a, b2) => a.t - b2.t);
  const pre = []; for (let s = 0; s < 4; s++) pre.push({ t: s * 4 * st, k: 'click', v: s ? 0.6 : 1 });
  const end = Math.max(...[...drumsU, ...mel].map((n) => n.t + (n.d || 0.1)), ...ev.map((e) => e.t + (e.d || 0.1)));
  const bars = Math.max(1, Math.ceil(end / barLen) - lead);
  mel.sort((a, b2) => a.t - b2.t); drumsU.sort((a, b2) => a.t - b2.t);
  const song = {
    id: `imp-${hash(`${name}|${midi.tracks.length}|${all.length}|${Math.round(midi.dur)}`)}`, style: 'imp', name, bpm: Math.round(bpm), root, minor: key.minor, seed: 0, imported: true,
    arr: { st, mel, drums: drumsU, ev: pre.concat(ev), chords: [], dur: end + 1.5, bars, lead, synthDrums },
  };
  return { song, report: { drums: synthDrums ? 0 : drumsU.length, synthDrums, melody: mel.length, bpm: Math.round(bpm), seconds: Math.round(end - lead * barLen), melodyTrack: mi >= 0 ? midi.tracks[mi].name || `faixa ${mi + 1}` : '' } };
}

/** Nome bonito a partir do arquivo ("01 - Artista - Música_drums.mid" → "Artista - Música"). */
export const nameFromFile = (file) => String(file).split('/').pop().replace(/\.(mid|midi|kar)$/i, '').replace(/^\d+\s*[-_.]\s*/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'MIDI';
