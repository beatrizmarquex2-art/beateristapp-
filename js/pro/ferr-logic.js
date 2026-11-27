// Contas puras da Pedaleira do PRO (metrônomo e afinador). Testado em tests/pro-ferr.test.mjs.
export const BPM_MIN = 30; export const BPM_MAX = 260;
export const limitaBpm = (n) => Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(Number(n) || 100)));
/** Tap tempo: toques em ms (Date.now). Só conta os últimos 6 e começa de novo se passar 2,2 s sem tocar. Precisa de 2 toques. */
export function tapBpm(toques) {
  const t = [...toques]; let ini = 0; for (let i = t.length - 1; i > 0; i--) if (t[i] - t[i - 1] > 2200) { ini = i; break; }
  const u = t.slice(ini).slice(-6); if (u.length < 2) return null;
  const media = (u[u.length - 1] - u[0]) / (u.length - 1); return limitaBpm(60000 / media);
}
export const AFINACOES = {
  violao: { nome: 'violão', cordas: [['E', 40], ['A', 45], ['D', 50], ['G', 55], ['B', 59], ['E', 64]] },
  baixo4: { nome: 'baixo 4 cordas', cordas: [['E', 28], ['A', 33], ['D', 38], ['G', 43]] },
  baixo5: { nome: 'baixo 5 cordas', cordas: [['B', 23], ['E', 28], ['A', 33], ['D', 38], ['G', 43]] },
  ukulele: { nome: 'ukulele', cordas: [['G', 67], ['C', 60], ['E', 64], ['A', 69]] },
  cavaquinho: { nome: 'cavaquinho', cordas: [['D', 62], ['G', 67], ['B', 71], ['D', 74]] },
  cromatico: { nome: 'cromático (qualquer nota)', cordas: null },
};
export const freqMidi = (m, a4 = 440) => a4 * 2 ** ((m - 69) / 12);
/** Corda mais próxima da frequência e quantos cents faltam (negativo = baixo/grave demais). Em afinação cromática devolve a nota mais próxima. */
export function alvo(freq, cordas, a4 = 440) {
  const m = 69 + 12 * Math.log2(freq / a4);
  const lista = cordas ? cordas.map(([n, midi]) => ({ nome: n, midi })) : [{ nome: '', midi: Math.round(m) }];
  let melhor = null; for (const c of lista) { const cents = Math.round((m - c.midi) * 100); if (!melhor || Math.abs(cents) < Math.abs(melhor.cents)) melhor = { ...c, cents }; }
  return melhor;
}
export const NOTAS = ['dó', 'dó♯', 'ré', 'ré♯', 'mi', 'fá', 'fá♯', 'sol', 'sol♯', 'lá', 'lá♯', 'si'];
export const nomeNota = (midi) => NOTAS[((midi % 12) + 12) % 12];
export const afinado = (cents) => Math.abs(cents) <= 5;
