// Jogos de ouvido e de escala: regras puras (sem tela e sem som). Os sorteios aceitam `rnd` pra dar pra testar.
// Cada jogo é um MUNDO com 2 dificuldades ("fácil e médio" e "difícil") de 12 fases cada; as fases são só números aqui (fasesDe).
import { ACORDES, RAIZES } from '../acordes.js';
import { ehPreta } from './vivo-logic.js';

const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
export const embaralha = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const FASES_POR_NIVEL = 12;
export const NIVEIS = [{ id: 'facil', nome: 'fácil e médio' }, { id: 'dificil', nome: 'difícil' }];
/** Estrelas por acertos (todas = 3, 80% = 2, 60% = 1). 1 ★ abre a próxima fase. */
export const estrelasAcertos = (certas, total) => (total ? (certas === total ? 3 : certas / total >= 0.8 ? 2 : certas / total >= 0.6 ? 1 : 0) : 0);
/** Estrelas da escala: concluiu sem errar = 3, até 2 erros = 2, concluiu = 1. */
export const estrelasEscala = (erros, concluiu) => (!concluiu ? 0 : erros === 0 ? 3 : erros <= 2 ? 2 : 1);

const TODAS = Array.from({ length: 12 }, (_, i) => i); const NAT = [0, 2, 4, 5, 7, 9, 11];
/** Nomes das notas. Em tons com bemol (fá maior, ré menor…) escreve si♭ em vez de lá#. */
const SOL_S = ['dó', 'dó#', 'ré', 'ré#', 'mi', 'fá', 'fá#', 'sol', 'sol#', 'lá', 'lá#', 'si']; const SOL_B = ['dó', 'ré♭', 'ré', 'mi♭', 'mi', 'fá', 'sol♭', 'sol', 'lá♭', 'lá', 'si♭', 'si'];
export const BEMOL = [['maior', 5], ['maior', 10], ['maior', 3], ['menor', 2], ['menor', 7], ['menor', 0], ['menor', 5], ['maior', 8]]; // fá, si♭, mi♭, lá♭ maiores; ré, sol, dó, fá menores
export const usaBemol = (pc, tipo) => BEMOL.some(([t, p]) => t === (tipo === 'menor' || tipo === 'pentamenor' ? 'menor' : 'maior') && p === pc);
export const nomeEm = (midi, pc = 0, tipo = 'maior') => (usaBemol(pc, tipo) ? SOL_B : SOL_S)[((midi % 12) + 12) % 12];
/** Cor de cada nota (as 12 notas, um arco-íris: dó vermelho, ré laranja, mi amarelo, fá verde, sol azul-claro, lá azul, si roxo). */
const MAT = [350, 22, 32, 48, 95, 140, 160, 190, 215, 235, 275, 300];
export const corNota = (midi) => { const pc = ((midi % 12) + 12) % 12; return `hsl(${MAT[pc]} 78% ${[1, 3, 6, 8, 10].includes(pc) ? 38 : 48}%)`; };

/* ---------- 3ª, 5ª e outros graus ---------- */
export const INTS = { maior: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10] };
/** Distância (semitons) do grau a partir da tônica; o 8 é a oitava. */
export const semitons = (modo, grau) => (grau === 8 ? 12 : INTS[modo][grau - 1]);
export function rodadaGrau({ n = 8, modos = ['maior'], tonicas = [0], graus = [3, 5], rnd = Math.random } = {}) {
  const out = [];
  while (out.length < n) {
    const grau = pick(graus, rnd); const k = out.length;
    if (graus.length >= 2 && k >= 2 && out[k - 1].grau === grau && out[k - 2].grau === grau) continue;
    const modo = pick(modos, rnd); const pc = pick(tonicas, rnd); const raiz = 60 + pc - (pc > 6 ? 12 : 0);
    out.push({ raiz, grau, alvo: raiz + semitons(modo, grau), modo, pc });
  }
  return out;
}

/* ---------- acordes ---------- */
/** Notas (MIDI) de um acorde de 3 sons: tônica a partir do dó grave, terça maior/menor e quinta. */
export function acordeMidis(pc, tipo, base = 48) { const r = base + pc; return [r, r + (tipo === 'maior' ? 4 : 3), r + 7]; }
export const nomeAcorde = (a) => `${a.nome} ${a.tipo}`;
const ID = (pc, tipo) => `${((pc % 12) + 12) % 12}${tipo === 'maior' ? 'M' : 'm'}`;
const invertido = (midis, inv) => { const m = midis.slice(); for (let i = 0; i < inv; i++) m.push(m.shift() + 12); return m; };
/** Como cada forma toca: junto (acorde), em sequência (arpejo), mais rápido ou mais lento. */
export function toqueDe(forma) {
  if (forma === 'arpejo') return { junto: false, passo: 0.34, dur: 0.9 };
  if (forma === 'escala5') return { junto: false, passo: 0.5, dur: 0.6 };
  if (forma === 'escala5-rapida') return { junto: false, passo: 0.28, dur: 0.4 };
  if (forma === 'escala5-desce') return { junto: false, passo: 0.4, dur: 0.5 };
  return { junto: true };
}
export function rodadaAcorde({ n = 8, pcs = NAT, tipos = ['maior'], opcoesN = 3, pareado = false, forma = 'bloco', rnd = Math.random } = {}) {
  const pool = pcs.flatMap((pc) => tipos.map((t) => ID(pc, t))); const todos = TODAS.flatMap((pc) => ['maior', 'menor'].map((t) => ID(pc, t)));
  const out = [];
  while (out.length < n) {
    const alvo = pick(pool, rnd); if (out.length && out[out.length - 1].alvo === alvo) continue;
    const a = ACORDES.find((x) => x.id === alvo); const ids = [alvo];
    if (pareado) ids.push(ID(a.pc, a.tipo === 'maior' ? 'menor' : 'maior'));
    for (const id of embaralha(pool, rnd)) if (ids.length < opcoesN && !ids.includes(id)) ids.push(id);
    for (const id of embaralha(todos, rnd)) if (ids.length < opcoesN && !ids.includes(id)) ids.push(id); // pool pequeno: completa com outros
    const inv = forma === 'inversao' ? Math.floor(rnd() * 3) : 0; const midis = invertido(acordeMidis(a.pc, a.tipo), inv);
    out.push({ alvo, opcoes: embaralha(ids, rnd), midis, forma, inv });
  }
  return out;
}

/* ---------- maior ou menor ---------- */
export function rodadaMaiorMenor({ n = 8, pcs = TODAS, forma = 'bloco', rnd = Math.random } = {}) {
  const out = [];
  while (out.length < n) {
    const tipo = rnd() < 0.5 ? 'maior' : 'menor'; const k = out.length;
    if (k >= 3 && out[k - 1].tipo === tipo && out[k - 2].tipo === tipo && out[k - 3].tipo === tipo) continue;
    const pc = pick(pcs, rnd); const r = 48 + pc; let midis;
    if (forma.startsWith('escala5')) { const t = INTS[tipo].filter((_, i) => [0, 1, 2, 3, 4].includes(i)).map((i) => r + 12 + i); midis = forma === 'escala5-desce' ? t.slice().reverse() : t; }
    else midis = invertido(acordeMidis(pc, tipo), forma === 'inversao' ? Math.floor(rnd() * 3) : 0);
    out.push({ pc, tipo, nome: RAIZES[pc], midis, forma });
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
export const temPreta = (notas) => notas.some(ehPreta);
export const tonicasBrancas = (tipo) => TODAS.filter((pc) => !temPreta(escalaNotas(pc, tipo)));
export const confere = (tocada, esperada, qualquerOitava) => (qualquerOitava ? (((tocada - esperada) % 12) + 12) % 12 === 0 : tocada === esperada);

/* ---------- as 12 fases de cada nível de cada jogo ---------- */
const N6 = [6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10];
const fase = (num, extra) => ({ num, ...extra });
/** Fases do jogo `jogo` ('terca' | 'acorde-ouvido' | 'maior-menor' | 'escala') no nível `nivel` ('facil' | 'dificil'): sempre 12. */
export function fasesDe(jogo, nivel) {
  const d = nivel === 'dificil'; const L = [];
  if (jogo === 'terca') {
    for (let i = 1; i <= 12; i++) {
      if (!d) { const tonicas = i === 1 ? [0] : i === 2 ? [7] : i === 3 ? [5] : i === 4 ? [0, 5, 7] : i <= 7 ? NAT : TODAS; const modos = i <= 8 ? ['maior'] : i === 9 ? ['menor'] : ['maior', 'menor']; L.push(fase(i, { n: N6[i - 1], tonicas: i === 9 ? NAT : tonicas, modos, graus: [3, 5], dica: true })); }
      else { const G = [[3, 5, 7], [2, 3, 5], [3, 4, 5], [3, 5, 6], [2, 3, 4, 5], [3, 4, 5, 6], [2, 3, 5, 6, 7], [2, 3, 4, 5, 6, 7], [2, 3, 4, 5, 6, 7], [2, 3, 4, 5, 6, 7], [2, 3, 4, 5, 6, 7], [2, 3, 4, 5, 6, 7]][i - 1];
        L.push(fase(i, { n: i === 12 ? 12 : N6[i - 1], tonicas: i <= 4 ? NAT : TODAS, modos: i <= 8 ? ['maior'] : ['maior', 'menor'], graus: G, dica: i <= 6 })); }
    }
  } else if (jogo === 'acorde-ouvido') {
    for (let i = 1; i <= 12; i++) {
      if (!d) {
        const cfg = [
          { pcs: [0, 7, 5], tipos: ['maior'] }, { pcs: NAT.slice(0, 6), tipos: ['maior'] }, { pcs: TODAS, tipos: ['maior'] }, { pcs: TODAS, tipos: ['maior'] },
          { pcs: [9, 4, 2], tipos: ['menor'] }, { pcs: NAT, tipos: ['menor'] }, { pcs: NAT, tipos: ['maior', 'menor'] }, { pcs: TODAS, tipos: ['maior', 'menor'] },
          { pcs: NAT, tipos: ['maior', 'menor'], pareado: true }, { pcs: TODAS, tipos: ['maior', 'menor'], pareado: true }, { pcs: TODAS, tipos: ['maior', 'menor'] }, { pcs: TODAS, tipos: ['maior', 'menor'], pareado: true },
        ][i - 1];
        L.push(fase(i, { n: N6[i - 1], opcoesN: 3, forma: 'bloco', ...cfg }));
      } else {
        const forma = i <= 4 ? 'bloco' : i <= 8 ? 'arpejo' : 'inversao'; const tipos = i <= 2 ? ['maior'] : ['maior', 'menor'];
        L.push(fase(i, { n: i === 12 ? 12 : N6[i - 1], opcoesN: 4, forma, pcs: i <= 3 ? NAT : TODAS, tipos, pareado: i % 4 === 0 || i > 8 }));
      }
    }
  } else if (jogo === 'maior-menor') {
    for (let i = 1; i <= 12; i++) {
      if (!d) { const pcs = [[0], [0, 7, 5], NAT, NAT, TODAS, TODAS, TODAS, TODAS, TODAS, TODAS, TODAS, TODAS][i - 1]; const forma = i <= 5 ? 'bloco' : i <= 8 ? 'arpejo' : 'inversao'; L.push(fase(i, { n: N6[i - 1], pcs, forma })); }
      else { const forma = i <= 4 ? 'escala5' : i <= 8 ? 'escala5-rapida' : 'escala5-desce'; L.push(fase(i, { n: i === 12 ? 12 : N6[i - 1], pcs: i <= 2 ? [0, 7, 5] : i <= 4 ? NAT : TODAS, forma })); }
    }
  } else if (jogo === 'escala') {
    const F = [
      [0, 'maior', false], [9, 'menor', false], [0, 'penta', false], [9, 'pentamenor', false], [5, 'penta', false], [7, 'penta', false],
      [4, 'pentamenor', false], [2, 'pentamenor', false], [0, 'maior', true], [9, 'menor', true], [0, 'penta', true], [9, 'pentamenor', true],
    ];
    const D = [
      [7, 'maior', false], [5, 'maior', false], [2, 'maior', false], [9, 'maior', false], [4, 'menor', false], [2, 'menor', false],
      [7, 'menor', false], [4, 'maior', false], [7, 'maior', true], [5, 'maior', true], [4, 'menor', true], [2, 'maior', true],
    ];
    (d ? D : F).forEach(([pc, tipo, descer], k) => L.push(fase(k + 1, { pc, tipo, descer })));
  }
  return L;
}
