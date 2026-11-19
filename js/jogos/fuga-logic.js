// A Fuga do Estúdio em mapa (como os outros jogos de caminhozinho): 3 mundos × 12 fases × 3 ★ = 36 ★ por mundo. Lógica pura (testada em tests/fuga-logic.test.mjs).
//  mundo 1 = Estúdio dos Lasers (tema próprio) · mundo 2 = Vulcão · mundo 3 = Estação Espacial. Cada fase é uma PORTA: quiz, caça-palavras ou cruzadinha, em rodízio.
import { regioesDoTema } from './mundos-tema.js';

export const FASES = 12;
export const MUNDOS = [
  { id: 'estudio', tema: 'laser', nome: 'Estúdio dos Lasers', curto: 'estúdio', sub: 'o Paul está trancado', regioes: regioesDoTema('laser', [['corredor', 'Corredor dos Lasers', 'cuidado com o vermelho'], ['cabine', 'Cabine Secreta', 'a saída está perto']]) },
  { id: 'vulcao', tema: 'vulcao', nome: 'Vulcão das Portas de Pedra', curto: 'vulcão', sub: 'o calor aumenta', regioes: regioesDoTema('vulcao', [['cratera', 'Cratera Quente', 'pedras que se mexem'], ['lava', 'Rio de Lava', 'só os rápidos passam']]) },
  { id: 'espaco', tema: 'espaco', nome: 'Estação Espacial', curto: 'espaço', sub: 'sem gravidade', regioes: regioesDoTema('espaco', [['orbita', 'Órbita das Escotilhas', 'fora do planeta'], ['estacao', 'Sala de Comando', 'a última escotilha']]) },
];
export const TIPOS = ['quiz', 'caca', 'cruz'];
export const NOME_TIPO = { quiz: 'sala de controle (quiz)', caca: 'cabine de gravação (caça-palavras)', cruz: 'sala de ensaio (cruzadinha)' };
export const tipoDa = (n) => TIPOS[(n - 1) % 3]; // (legado) tipo da 1ª porta da fase
export const idFase = (mundo, n) => `${mundo}:${n}`;
/** O que cada fase pede: o quiz tem sempre 5 perguntas; a caça tem de 4 a 8 palavras e a cruzadinha de 4 a 6, e aumentam com a fase e com o mundo. */
export function faseCfg(mundoIdx, n) { return { tipo: tipoDa(n), perguntas: 5, palavras: Math.min(8, 4 + Math.floor((n - 1) / 3) + mundoIdx), cruz: Math.min(6, 4 + Math.floor((n - 1) / 6) + (mundoIdx > 0 ? 1 : 0)) }; }
/** Quantas portas a fase tem: a 1ª tem 2, a 2ª a 4ª têm 3, da 5ª em diante 4 (quiz, caça, cruzadinha e de novo quiz). */
export const qtdPortas = (n) => (n <= 1 ? 2 : n <= 4 ? 3 : 4);
/** As portas da fase, em ordem: cada uma é um dos 3 jogos (quiz → caça → cruzadinha → quiz…), com a dificuldade da fase e do mundo. */
export const portasDaFase = (mundoIdx, n) => Array.from({ length: qtdPortas(n) }, (_, k) => { const c = faseCfg(mundoIdx, n); return { ...c, tipo: TIPOS[k % 3] }; });
export const idPorta = (mundo, n, k) => `${mundo}:${n}:${k}`;
/** ★ da fase no mapa (1 a 3) = média das ★ das portas, arredondada pra cima na metade, nunca abaixo de 1 se passou por todas. */
export const estrelasFase = (lista) => { const v = (lista || []).filter((x) => x > 0); if (!v.length) return 0; return Math.max(1, Math.min(3, Math.round(v.reduce((a, b) => a + b, 0) / v.length))); };
export const MIN_QUIZ = 3;
/** ★ de uma porta: quiz = 5 certas 3 ★ · 4 certas 2 ★ · 3 certas 1 ★ (se gastou a dica do "desistir das ⭐⭐⭐", no máximo 2 ★); caça = 3 ★ menos 1 por dica (mínimo 1); cruzadinha = 3 ★. */
export function estrelasPorta(tipo, s = {}) {
  if (tipo === 'quiz') { const base = s.found >= 5 ? 3 : s.found === 4 ? 2 : 1; return s.ajuda ? Math.min(base, 2) : base; }
  if (tipo === 'caca' && s.estrelas) return s.estrelas;
  return 3;
}
/** Estrelas guardadas: `est` = { 'estudio:3': 2, … }. */
export const estOf = (est, mundo, n) => Math.max(0, Math.min(3, Number((est || {})[idFase(mundo, n)]) || 0));
export const estMundo = (est, mundo) => Array.from({ length: FASES }, (_, i) => estOf(est, mundo, i + 1)).reduce((a, b) => a + b, 0);
/** A fase abre quando a anterior tem pelo menos 1 ★ (a 1ª sempre abre). */
export const faseAberta = (est, mundo, n) => n <= 1 || estOf(est, mundo, n - 1) >= 1;
/** O mundo abre quando todas as fases do anterior têm pelo menos 1 ★ (o 1º sempre abre). */
export function mundoLiberado(est, mundo) { const i = MUNDOS.findIndex((m) => m.id === mundo); return i <= 0 || Array.from({ length: FASES }, (_, k) => estOf(est, MUNDOS[i - 1].id, k + 1)).every((x) => x >= 1); }
export const proximaFase = (n) => (n < FASES ? n + 1 : 0);
