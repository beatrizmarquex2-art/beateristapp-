import { ROWS } from '../beats.js';
// Aulas da bateria de toque (aba Palco > bateria > "aulas"): o Paul toca 1 compasso acendendo as peças da bateria, o aluno repete tocando nelas.
// Regra pura (sem tela): os ritmos, a conta dos tempos e a nota. Os 9 ritmos foram marcados pela Bea na grade (nov/2026); os nomes ainda são provisórios.
// Peças: cr = prato de ataque, rd = prato de ritmo (condução), ch = chimbal, t1 = tom 1, t2 = tom 2, cx = caixa, su = surdo, bu = bumbo. `n` = passos do compasso (8 = colcheias, 16 = semicolcheias); a lista é a posição de cada batida (0 = tempo 1).
const P = (o) => ({ cr: [], rd: [], ch: [], t1: [], t2: [], cx: [], su: [], bu: [], ...o });
export const AULAS = [
  { id: 'r01', nome: 'Ritmo 1', bpm: 60, n: 16, p: P({ cr: [0], ch: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], cx: [2, 6, 10, 14], bu: [0, 4, 8, 12] }) },
  { id: 'r02', nome: 'Ritmo 2', bpm: 80, n: 8, p: P({ ch: [0, 1, 2, 4, 5, 6], cx: [2, 6], bu: [0, 1, 4, 5] }) },
  { id: 'r03', nome: 'Ritmo com 2 figuras', bpm: 70, n: 16, p: P({ ch: [0, 2, 4, 6, 8, 10, 12, 14], cx: [4, 7, 9, 12], bu: [0, 2, 10] }) },
  { id: 'r04', nome: 'Ritmo com bumbo adiantado', bpm: 90, n: 8, p: P({ ch: [0, 1, 2, 3, 4, 5, 6, 7], cx: [2, 6], bu: [0, 3] }) },
  { id: 'r05', nome: 'Ritmo Base', bpm: 100, n: 8, p: P({ ch: [0, 2, 4, 6], cx: [2, 6], bu: [0, 4] }) },
  { id: 'r06', nome: 'Ritmo Country', bpm: 130, n: 8, p: P({ ch: [0, 1, 2, 3, 4, 5, 6, 7], cx: [1, 3, 5, 7], bu: [0, 2, 4, 6] }) },
  { id: 'r07', nome: 'Sunflower', bpm: 100, n: 16, p: P({ ch: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11], cx: [4, 12] }) },
  { id: 'r08', nome: 'Ritmo com 4 bumbos', bpm: 90, n: 8, p: P({ ch: [0, 1, 2, 3, 4, 5, 6, 7], cx: [2, 6], bu: [0, 1, 3, 4] }) },
  { id: 'r09', nome: 'Linear simples', bpm: 100, n: 8, p: P({ ch: [1, 3, 5, 7], cx: [2, 6], bu: [0, 4] }) },
  { id: 'r10', nome: 'We Will Rock You', bpm: 80, n: 8, p: P({ t1: [0, 1, 4, 5], t2: [0, 1, 4, 5], cx: [2, 6] }) },
  { id: 'r11', nome: 'Tribal 1', bpm: 100, n: 16, p: P({ su: [0, 2, 4, 6, 8, 10, 12, 14], t1: [15], t2: [7, 9], cx: [4, 12] }) },
  { id: 'r12', nome: 'Tribal 2', bpm: 100, n: 16, p: P({ su: [0, 2, 6, 8, 10, 14], t2: [1, 3, 7, 9, 11], cx: [4, 12] }) },
  { id: 'r13', nome: 'Pompeii Refrão', bpm: 120, n: 16, p: P({ bu: [0, 2], ch: [0, 2, 4], cx: [4, 12], su: [10, 12], t1: [6, 7], t2: [8, 9] }) },
  { id: 'r14', nome: 'Heathens', bpm: 100, n: 8, p: P({ bu: [0, 5], ch: [1, 3, 4, 7], cx: [2, 6] }) },
  { id: 'r15', nome: 'Wake Me Up When September Ends', bpm: 50, n: 16, p: P({ ch: [14], cx: [2, 5, 10, 13], su: [0, 1, 3, 4, 8, 9, 11, 12] }) },
  { id: 'r16', nome: 'Believer', bpm: 100, n: 16, p: P({ ch: [6], cx: [9], su: [0, 1, 2, 3] }) },
];
export const RODADAS = 3;
export const SEM_AULA = ['cajon']; // o cajón só tem agudo e grave: não dá pra tocar tom, surdo e pratos // o Paul toca e o aluno repete, 3 vezes
export const NOMES = { cr: 'prato de ataque', rd: 'prato de ritmo', ch: 'chimbal', t1: 'tom 1', t2: 'tom 2', cx: 'caixa', su: 'surdo', bu: 'bumbo' };
/** Qual peça da bateria (ids de js/kids/kit-modelos.js) vale por cada peça da aula. O chimbal aberto vale como chimbal. */
export const PECA_DO_KIT = { cr: ['cr'], rd: ['rd'], ch: ['hh', 'ho'], t1: ['tt'], t2: ['mt'], cx: ['sn'], su: ['ft'], bu: ['bd'] };
/** Contrário: de uma peça da bateria pra peça da aula (ou undefined se a peça não existe nas aulas). */
export const AULA_DO_KIT = Object.fromEntries(Object.entries(PECA_DO_KIT).flatMap(([a, ks]) => ks.map((k) => [k, a])));
export const ORDEM = ['cr', 'rd', 'ch', 't1', 't2', 'cx', 'su', 'bu']; // de cima pra baixo, como na bateria
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
/** A aula como ritmo do Beat Lab (grade de passos × peças), pra desenhar na partitura do app (js/notation.js), normal e colorida. */
const ROW_DO_KIT = { cr: 'cr', rd: 'rd', ch: 'hh', t1: 'tt', t2: 'mt', cx: 'sn', su: 'ft', bu: 'bd' };
export function paraBeat(aula) {
  const rows = Object.fromEntries(ROWS.map((r) => [r.id, Array.from({ length: aula.n }, () => 0)]));
  for (const p of ORDEM) for (const i of aula.p[p]) rows[ROW_DO_KIT[p]][i] = 1;
  return { id: aula.id, name: aula.nome, style: 'Aulas', bpm: aula.bpm, steps: aula.n, kind: 'groove', rows };
}
/** Onde o passo `i` cai na largura da partitura (0 a 1), pro cursor andar em cima das notas. Os 52 e 10 são a margem esquerda e direita de notation.js (layout). */
export const xDoPasso = (aula, i, W = 340) => (52 + i * ((W - 62) / aula.n) + (W - 62) / aula.n / 2) / W;
