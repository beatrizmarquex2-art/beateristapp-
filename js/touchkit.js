// Bateria de toque: transformar os toques gravados (segundos desde o 1º tempo) em compassos da grade do Beat Lab.
// Puro, testado em tests/touchkit.test.mjs. Não promete transcrição perfeita: arredonda pra semicolcheia mais perto.
import { ROWS } from './beats.js';

export const PADS = [
  { id: 'cr', label: 'prato', key: 'u' }, { id: 'rd', label: 'condução', key: 'i' },
  { id: 'hh', label: 'chimbal', key: 'j' }, { id: 'ho', label: 'chimbal aberto', key: 'h' },
  { id: 'tt', label: 'tom', key: 'k' }, { id: 'sn', label: 'caixa', key: 'f' },
  { id: 'ft', label: 'surdo', key: 'l' }, { id: 'bd', label: 'bumbo', key: ' ' },
];

/** hits: [{ t (s desde o 1º tempo), id }]. Devolve { bars:[{steps:16, rows, acc}], dropped } (fora da janela ou longe demais da grade). */
export function quantize(hits, { bpm, bars = 1, tol = 0.45 } = {}) {
  const step = 60 / bpm / 4; const n = bars * 16;
  const grid = ROWS.map((r) => r.id);
  const out = Array.from({ length: bars }, () => ({ steps: 16, rows: Object.fromEntries(grid.map((id) => [id, Array(16).fill(0)])), acc: Array(16).fill(0) }));
  let dropped = 0;
  for (const h of hits) {
    const x = h.t / step; const i = Math.round(x);
    if (i < 0 || i >= n || Math.abs(x - i) > tol || !grid.includes(h.id)) { dropped++; continue; }
    out[Math.floor(i / 16)].rows[h.id][i % 16] = 1;
  }
  // chimbal fechado e aberto no mesmo passo: fica o aberto (é o que soou por último na mão)
  for (const b of out) for (let i = 0; i < 16; i++) if (b.rows.ho[i]) b.rows.hh[i] = 0;
  return { bars: out, dropped };
}

/** Quantas notas caíram em cada compasso (pra mostrar "3 compassos, 24 notas"). */
export const countNotes = (bars) => bars.reduce((s, b) => s + Object.values(b.rows).reduce((a, r) => a + r.filter(Boolean).length, 0), 0);
