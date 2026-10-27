// Leitor de arquivo MIDI (SMF formato 0 e 1): mapa de andamento, faixas, canais e notas em segundos.
// Puro (só bytes → objetos), testado em tests/midi.test.mjs. Nada sai do aparelho.

/** Lê um MIDI. Devolve { format, ppq, bpm (o primeiro andamento), tempos:[{tick, us}], tracks:[{name, notes:[{t, d, m, v, ch}], programs:{ch: prog}}], dur }. */
export function parseMidi(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let p = 0;
  const str = (n) => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[p + i]); p += n; return s; };
  const u32 = () => { const v = (b[p] << 24 | b[p + 1] << 16 | b[p + 2] << 8 | b[p + 3]) >>> 0; p += 4; return v; };
  const u16 = () => { const v = b[p] << 8 | b[p + 1]; p += 2; return v; };
  const vlq = () => { let v = 0, c; do { c = b[p++]; v = (v << 7) | (c & 0x7f); } while (c & 0x80 && p < b.length); return v; };
  if (str(4) !== 'MThd') throw new Error('não é um arquivo MIDI');
  const hl = u32(); const format = u16(); const ntr = u16(); const div = u16(); p += hl - 6;
  if (div & 0x8000) throw new Error('MIDI com tempo SMPTE não é suportado');
  const ppq = div || 480;
  const raw = []; const tempos = [];
  for (let k = 0; k < ntr && p < b.length; k++) {
    // pula pedaços desconhecidos até achar uma faixa
    while (p + 8 <= b.length && String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]) !== 'MTrk') { p += 4; const len = u32(); p += len; }
    if (p + 8 > b.length) break;
    p += 4; const len = u32(); const end = Math.min(b.length, p + len);
    let tick = 0, status = 0; const ev = []; let name = ''; const programs = {};
    while (p < end) {
      tick += vlq();
      let st = b[p];
      if (st & 0x80) p++; else st = status; // running status
      if (st === 0xff) {
        const type = b[p++]; const l = vlq(); const at = p; p += l;
        if (type === 0x51 && l === 3) tempos.push({ tick, us: (b[at] << 16) | (b[at + 1] << 8) | b[at + 2] });
        else if (type === 0x03 && !name) { let s = ''; for (let i = 0; i < l; i++) s += String.fromCharCode(b[at + i]); name = s.trim(); }
        else if (type === 0x2f) break;
        continue;
      }
      if (st === 0xf0 || st === 0xf7) { const l = vlq(); p += l; continue; }
      status = st; const hi = st & 0xf0, ch = st & 0x0f;
      if (hi === 0x90 || hi === 0x80) { const m = b[p++], v = b[p++]; ev.push({ tick, on: hi === 0x90 && v > 0, m, v, ch }); }
      else if (hi === 0xc0) { programs[ch] = b[p++]; }
      else if (hi === 0xd0) p += 1;
      else p += 2; // a0, b0, e0
    }
    p = end; raw.push({ name, ev, programs });
  }
  tempos.sort((x, y) => x.tick - y.tick);
  if (!tempos.length || tempos[0].tick > 0) tempos.unshift({ tick: 0, us: 500000 });
  // tick → segundos pelo mapa de andamento
  const segs = []; let sec = 0;
  tempos.forEach((tp, i) => { if (i) sec += ((tp.tick - tempos[i - 1].tick) * tempos[i - 1].us) / ppq / 1e6; segs.push({ tick: tp.tick, sec, us: tp.us }); });
  const toSec = (tick) => { let s = segs[0]; for (const x of segs) { if (x.tick <= tick) s = x; else break; } return s.sec + ((tick - s.tick) * s.us) / ppq / 1e6; };
  let dur = 0;
  const tracks = raw.map((tr) => {
    const open = new Map(); const notes = [];
    for (const e of tr.ev) {
      const key = e.ch * 128 + e.m;
      if (e.on) { if (!open.has(key)) open.set(key, []); open.get(key).push(e); }
      else { const q = open.get(key); const s = q && q.shift(); if (s) { const t = toSec(s.tick); const d = Math.max(0.02, toSec(e.tick) - t); notes.push({ t, d, m: e.m, v: s.v, ch: e.ch }); dur = Math.max(dur, t + d); } }
    }
    // notas sem "desligar": duram um pouquinho
    for (const q of open.values()) for (const s of q) { const t = toSec(s.tick); notes.push({ t, d: 0.2, m: s.m, v: s.v, ch: s.ch }); dur = Math.max(dur, t + 0.2); }
    notes.sort((x, y) => x.t - y.t || x.m - y.m);
    return { name: tr.name, notes, programs: tr.programs };
  });
  return { format, ppq, bpm: Math.round((60e6 / tempos[0].us) * 100) / 100, tempos, tracks, dur };
}
