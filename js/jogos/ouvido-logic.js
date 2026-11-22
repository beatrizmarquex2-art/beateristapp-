// Jogos de ouvido e de escala: regras puras (sem tela e sem som). Os sorteios aceitam `rnd` pra dar pra testar.
import { ACORDES, RAIZES } from '../acordes.js';
import { ehPreta } from './vivo-logic.js';

const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
export const embaralha = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const RODADAS = 8;
/** Estrelas por % de acertos (100% = 3, 80% = 2, 60% = 1). */
export const estrelasAcertos = (certas, total) => (total ? (certas === total ? 3 : certas / total >= 0.8 ? 2 : certas / total >= 0.6 ? 1 : 0) : 0);

/* ---------- 3ª e 5ª ---------- */
/** Distância (semitons) do grau a partir da tônica. Escala maior: 3ª = 4, 5ª = 7. Menor: 3ª = 3, 5ª = 7. */
export const GRAUS = { maior: { 3: 4, 5: 7 }, menor: { 3: 3, 5: 7 } };
/** Rodadas de "é a 3ª ou a 5ª?": tônica sorteada (dó a si, na oitava central) e um grau. Nunca 4 do mesmo grau seguidos. */
export function rodadaGrau({ n = RODADAS, modo = 'maior', rnd = Math.random } = {}) {
  const out = [];
  while (out.length < n) {
    const grau = rnd() < 0.5 ? 3 : 5; const k = out.length;
    if (k >= 3 && out[k - 1].grau === grau && out[k - 2].grau === grau && out[k - 3].grau === grau) continue;
    const pc = Math.floor(rnd() * 12); const raiz = 60 + pc - (pc > 6 ? 12 : 0);
    out.push({ raiz, grau, alvo: raiz + GRAUS[modo][grau], modo });
  }
  return out;
}

/* ---------- acordes ---------- */
/** Notas (MIDI) de um acorde de 3 sons: tônica a partir do dó grave, terça maior/menor e quinta. */
export function acordeMidis(pc, tipo, base = 48) { const r = base + pc; return [r, r + (tipo === 'maior' ? 4 : 3), r + 7]; }
export const nomeAcorde = (a) => `${a.nome} ${a.tipo}`;
const ID = (pc, tipo) => `${((pc % 12) + 12) % 12}${tipo === 'maior' ? 'M' : 'm'}`;
/** Níveis do "que acorde é?": f = 3 acordes de tônicas bem diferentes (todos maiores); m = maiores e menores misturados; d = o mesmo nome em maior e menor + um vizinho. */
export const NIVEIS_ACORDE = [{ id: 'f', nome: 'fácil' }, { id: 'm', nome: 'médio' }, { id: 'd', nome: 'difícil' }];
const NATURAIS = [0, 2, 4, 5, 7, 9];
export function rodadaAcorde({ n = RODADAS, nivel = 'f', rnd = Math.random } = {}) {
  const out = [];
  while (out.length < n) {
    let ids;
    if (nivel === 'f') ids = embaralha(NATURAIS, rnd).slice(0, 3).map((pc) => ID(pc, 'maior'));
    else if (nivel === 'm') { const pcs = embaralha(NATURAIS, rnd).slice(0, 3); ids = pcs.map((pc) => ID(pc, rnd() < 0.5 ? 'maior' : 'menor')); }
    else { const pc = pick(NATURAIS, rnd); const viz = NATURAIS[(NATURAIS.indexOf(pc) + 1 + Math.floor(rnd() * 3)) % NATURAIS.length]; ids = [ID(pc, 'maior'), ID(pc, 'menor'), ID(viz, rnd() < 0.5 ? 'maior' : 'menor')]; }
    const alvo = pick(ids, rnd); if (out.length && out[out.length - 1].alvo === alvo) continue;
    const a = ACORDES.find((x) => x.id === alvo);
    out.push({ alvo, opcoes: embaralha(ids, rnd), midis: acordeMidis(a.pc, a.tipo) });
  }
  return out;
}

/* ---------- maior ou menor ---------- */
/** Rodadas de "maior ou menor?": nunca 4 iguais seguidos; a tônica varia. */
export function rodadaMaiorMenor({ n = RODADAS, rnd = Math.random } = {}) {
  const out = [];
  while (out.length < n) {
    const tipo = rnd() < 0.5 ? 'maior' : 'menor'; const k = out.length;
    if (k >= 3 && out[k - 1].tipo === tipo && out[k - 2].tipo === tipo && out[k - 3].tipo === tipo) continue;
    const pc = Math.floor(rnd() * 12); out.push({ pc, tipo, nome: RAIZES[pc], midis: acordeMidis(pc, tipo) });
  }
  return out;
}

/* ---------- escalas ---------- */
export const ESCALAS = [
  { id: 'maior', nome: 'maior', ints: [0, 2, 4, 5, 7, 9, 11, 12] },
  { id: 'menor', nome: 'menor', ints: [0, 2, 3, 5, 7, 8, 10, 12] },
  { id: 'penta', nome: 'pentatônica', ints: [0, 2, 4, 7, 9, 12] },
  { id: 'pentamenor', nome: 'pentatônica menor', ints: [0, 3, 5, 7, 10, 12] },
];
export const achaEscala = (id) => ESCALAS.find((e) => e.id === id) || ESCALAS[0];
/** Notas da escala a partir da tônica `pc` (0 = dó): a tônica mais baixa possível perto do dó central. */
export function escalaNotas(pc, tipo, descendo = false) {
  const base = pc <= 5 ? 60 + pc : 48 + pc; const up = achaEscala(tipo).ints.map((i) => base + i);
  return descendo ? up.concat(up.slice(0, -1).reverse()) : up;
}
/** A escala tem alguma tecla preta? (o teclado da tela só tem as brancas) */
export const temPreta = (notas) => notas.some(ehPreta);
/** Tônicas (pc) cuja escala dá só teclas brancas. */
export const tonicasBrancas = (tipo) => Array.from({ length: 12 }, (_, pc) => pc).filter((pc) => !temPreta(escalaNotas(pc, tipo)));
/** Nota tocada confere com a esperada? `qualquerOitava` no microfone (o violão soa uma oitava abaixo). */
export const confere = (tocada, esperada, qualquerOitava) => (qualquerOitava ? (((tocada - esperada) % 12) + 12) % 12 === 0 : tocada === esperada);
/** Estrelas da escala: concluiu sem errar = 3, até 2 erros = 2, concluiu = 1. */
export const estrelasEscala = (erros, concluiu) => (!concluiu ? 0 : erros === 0 ? 3 : erros <= 2 ? 2 : 1);
