// Aulas da bateria de toque (aba Palco > bateria > "aulas"): o Paul toca 1 compasso acendendo as peças da bateria, o aluno repete tocando nelas.
// Regra pura (sem tela): os ritmos, a conta dos tempos e a nota. Os 9 ritmos foram marcados pela Bea na grade (nov/2026); os nomes ainda são provisórios.
// Peças: cr = prato de ataque, ch = chimbal, cx = caixa, bu = bumbo. `n` = passos do compasso (8 = colcheias, 16 = semicolcheias); a lista é a posição de cada batida (0 = tempo 1).
export const AULAS = [
  { id: 'r01', nome: 'ritmo 1', bpm: 60, n: 16, p: { cr: [0], ch: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], cx: [2, 6, 10, 14], bu: [0, 4, 8, 12] } },
  { id: 'r02', nome: 'ritmo 2', bpm: 80, n: 8, p: { cr: [], ch: [0, 1, 2, 4, 5, 6], cx: [2, 6], bu: [0, 1, 4, 5] } },
  { id: 'r03', nome: 'ritmo 3', bpm: 70, n: 16, p: { cr: [], ch: [0, 2, 4, 6, 8, 10, 12, 14], cx: [4, 7, 9, 12], bu: [0, 2, 10] } },
  { id: 'r04', nome: 'ritmo 4', bpm: 90, n: 8, p: { cr: [], ch: [0, 1, 2, 3, 4, 5, 6, 7], cx: [2, 6], bu: [0, 3] } },
  { id: 'r05', nome: 'ritmo 5', bpm: 100, n: 8, p: { cr: [], ch: [0, 2, 4, 6], cx: [2, 6], bu: [0, 4] } },
  { id: 'r06', nome: 'ritmo 6', bpm: 130, n: 8, p: { cr: [], ch: [0, 1, 2, 3, 4, 5, 6, 7], cx: [1, 3, 5, 7], bu: [0, 2, 4, 6] } },
  { id: 'r07', nome: 'ritmo 7', bpm: 100, n: 16, p: { cr: [], ch: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11], cx: [4, 12], bu: [] } },
  { id: 'r08', nome: 'ritmo 8', bpm: 90, n: 8, p: { cr: [], ch: [0, 1, 2, 3, 4, 5, 6, 7], cx: [2, 6], bu: [0, 1, 3, 4] } },
  { id: 'r09', nome: 'ritmo 9', bpm: 100, n: 8, p: { cr: [], ch: [1, 3, 5, 7], cx: [2, 6], bu: [0, 4] } },
];
export const RODADAS = 3; // o Paul toca e o aluno repete, 3 vezes
export const NOMES = { cr: 'prato', ch: 'chimbal', cx: 'caixa', bu: 'bumbo' };
/** Qual peça da bateria (ids de js/kids/kit-modelos.js) vale por cada peça da aula. O chimbal aberto vale como chimbal e a condução como prato. */
export const PECA_DO_KIT = { cr: ['cr', 'rd'], ch: ['hh', 'ho'], cx: ['sn'], bu: ['bd'] };
/** Contrário: de uma peça da bateria pra peça da aula (ou null se a aula não usa: toms, surdo). */
export const AULA_DO_KIT = Object.fromEntries(Object.entries(PECA_DO_KIT).flatMap(([a, ks]) => ks.map((k) => [k, a])));
export const ORDEM = ['cr', 'ch', 'cx', 'bu']; // de cima pra baixo, como na bateria
/** Segundos de cada passo (colcheia no compasso de 8, semicolcheia no de 16). */
export const passoSeg = (aula, bpm = aula.bpm) => (60 / bpm) / (aula.n === 8 ? 2 : 4);
/** Todas as batidas do compasso em ordem: [{ i, t, p }] (t em segundos desde o tempo 1). */
export function batidas(aula, bpm = aula.bpm) {
  const s = passoSeg(aula, bpm); const out = [];
  for (let i = 0; i < aula.n; i++) for (const p of ORDEM) if (aula.p[p].includes(i)) out.push({ i, t: i * s, p });
  return out;
}
/** Folga de acerto (s): 40% de um passo, entre 70 e 150 ms (a tela do celular tem atraso). */
export const folga = (aula, bpm = aula.bpm) => Math.max(0.07, Math.min(0.15, 0.4 * passoSeg(aula, bpm)));
/**
 * Confere 1 compasso. `taps` = [{ t, p }] com t em segundos desde o tempo 1 do compasso do aluno e p = peça da AULA (cr/ch/cx/bu).
 * Cada batida esperada pede uma batida da mesma peça perto da hora; toque sobrando (peça errada, fora de hora ou de uma peça que a aula não usa) conta como erro.
 * Devolve { hits, esperado, extras, passos: { [i]: true|false } }.
 */
export function julga(aula, taps, bpm = aula.bpm) {
  const win = folga(aula, bpm); const usado = new Set(); let hits = 0; const esp = batidas(aula, bpm); const passos = {};
  for (const b of esp) {
    let best = -1; let bd = Infinity;
    taps.forEach((tp, k) => { if (usado.has(k) || tp.p !== b.p) return; const d = Math.abs(tp.t - b.t); if (d <= win && d < bd) { bd = d; best = k; } });
    if (best >= 0) { usado.add(best); hits++; passos[b.i] = passos[b.i] !== false; } else passos[b.i] = false;
  }
  return { hits, esperado: esp.length, extras: taps.length - usado.size, passos };
}
/** Junta os compassos numa nota de 0 a 100 (acertos sobre o que era esperado mais os toques sobrando). */
export function nota(res) { const h = res.reduce((s, r) => s + r.hits, 0); const t = res.reduce((s, r) => s + r.esperado + r.extras, 0); return t ? Math.round((h / t) * 100) : 0; }
export const estrelas = (pct) => (pct >= 100 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0);
