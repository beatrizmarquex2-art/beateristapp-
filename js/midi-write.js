// Escreve um arquivo MIDI (formato 1) a partir da batida do Groovebox: bateria no canal 10, baixo, piano, guitarra e voz em canais próprios.
// Puro (só dados → bytes). Cada compasso tem 16 passos de semicolcheia; os acordes mudam a cada compasso (4 compassos).
const PPQ = 480; const STEP = PPQ / 4;
const DRUM = { bd: 36, sn: 38, cp: 39, rim: 37, hh: 42, ho: 46, sh: 70, cr: 49, tt: 50, ft: 45, cb: 56, sp: 37 };
const MEL = { bs: { ch: 0, prog: 33, name: 'Baixo' }, ep: { ch: 1, prog: 4, name: 'Piano eletrico' }, gt: { ch: 2, prog: 27, name: 'Guitarra' }, vx: { ch: 3, prog: 54, name: 'Voz' } };

const vlq = (n) => { const o = [n & 0x7f]; while ((n >>= 7)) o.unshift((n & 0x7f) | 0x80); return o; };
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = (n) => [(n >> 8) & 255, n & 255];
const text = (s) => [...new TextEncoder().encode(s)];
function track(events, name, extra = []) {
  // events: { tick, bytes } → ordena, converte pra deltas
  const ev = [...events].sort((a, b) => a.tick - b.tick || (a.off ? -1 : 0) - (b.off ? -1 : 0));
  const nm = text(name); const out = [0, 0xff, 0x03, ...vlq(nm.length), ...nm, ...extra];
  let last = 0;
  for (const e of ev) { out.push(...vlq(e.tick - last), ...e.bytes); last = e.tick; }
  out.push(...vlq(0), 0xff, 0x2f, 0);
  return [0x4d, 0x54, 0x72, 0x6b, ...u32(out.length), ...out];
}

/** steps: { padId: [16 de 0/1] }; chords: 4 acordes { root, notes[] } (um por compasso); bpm. Devolve Uint8Array. */
export function grooveToMidi({ steps, chords, bpm = 92, bars = 4 }) {
  const us = Math.round(60e6 / bpm);
  const tracks = [];
  // andamento e fórmula de compasso
  tracks.push(track([], 'Beaterista Groovebox', [0, 0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255, 0, 0xff, 0x58, 4, 4, 2, 24, 8]));
  const drums = [];
  for (let b = 0; b < bars; b++) for (let s = 0; s < 16; s++) {
    const tick = (b * 16 + s) * STEP;
    for (const [id, note] of Object.entries(DRUM)) if (steps[id] && steps[id][s]) {
      drums.push({ tick, bytes: [0x99, note, id === 'bd' || id === 'sn' ? 112 : 92] }, { tick: tick + STEP / 2, off: true, bytes: [0x89, note, 0] });
    }
  }
  if (drums.length) tracks.push(track(drums, 'Bateria'));
  for (const [id, m] of Object.entries(MEL)) {
    if (!steps[id] || !steps[id].some(Boolean)) continue;
    const ev = [{ tick: 0, bytes: [0xc0 | m.ch, m.prog] }];
    for (let b = 0; b < bars; b++) {
      const ch = chords[b % chords.length];
      for (let s = 0; s < 16; s++) if (steps[id][s]) {
        const tick = (b * 16 + s) * STEP; const notes = id === 'bs' ? [ch.root] : id === 'vx' ? [ch.notes[ch.notes.length - 1]] : ch.notes; const len = id === 'bs' ? STEP * 0.9 : STEP * 2;
        for (const n of notes) { ev.push({ tick, bytes: [0x90 | m.ch, n, id === 'bs' ? 100 : 80] }, { tick: Math.round(tick + len), off: true, bytes: [0x80 | m.ch, n, 0] }); }
      }
    }
    tracks.push(track(ev, m.name));
  }
  const head = [0x4d, 0x54, 0x68, 0x64, ...u32(6), ...u16(1), ...u16(tracks.length), ...u16(PPQ)];
  return new Uint8Array([...head, ...tracks.flat()]);
}
