// A Fuga do Estúdio em mapa (como os outros jogos de caminhozinho): 3 mundos × 12 fases × 3 ★ = 36 ★ por mundo. Lógica pura (testada em tests/fuga-logic.test.mjs).
//  mundo 1 = Estúdio do Paul (escape room) · mundo 2 = Camarim · mundo 3 = Palco (os ids internos estudio/vulcao/espaco ficam, pra não perder o progresso salvo). Cada fase é uma PORTA: quiz, caça-palavras ou cruzadinha, em rodízio.
import { regioesDoTema } from './mundos-tema.js';

export const FASES = 12;
export const MUNDOS = [
  { id: 'estudio', tema: 'laser', nome: 'Estúdio do Paul', curto: 'estúdio', sub: 'escape room: ache a saída', mapa: 'lab', regioes: regioesDoTema('laser', [['corredor', 'Corredor dos Lasers', 'cuidado com o vermelho'], ['cabine', 'Cabine Secreta', 'a saída está perto']]) },
  { id: 'vulcao', tema: 'laser', nome: 'Camarim do Paul', curto: 'camarim', sub: 'espelho, luzes e frio na barriga', regioes: regioesDoTema('laser', [['espelho', 'Espelho das Luzes', 'ajeita o figurino'], ['coxia', 'Coxia', 'quase na hora de entrar']]) },
  { id: 'espaco', tema: 'laser', nome: 'Palco Principal', curto: 'palco', sub: 'a plateia tá esperando', regioes: regioesDoTema('laser', [['plateia', 'Fosso da Plateia', 'luz nos olhos'], ['solo', 'Solo Final', 'o último refrão']]) },
];
export const TIPOS = ['quiz', 'caca', 'cruz'];
export const NOME_TIPO = { quiz: 'sala de controle (quiz)', caca: 'cabine de gravação (caça-palavras)', cruz: 'sala de ensaio (cruzadinha)' };
export const tipoDa = (n) => TIPOS[(n - 1) % 3]; // (legado) tipo da 1ª porta da fase
export const idFase = (mundo, n) => `${mundo}:${n}`;
/** O que cada fase pede: o quiz tem sempre 5 perguntas; a caça tem de 4 a 8 palavras e a cruzadinha de 4 a 6, e aumentam com a fase e com o mundo. */
export function faseCfg(mundoIdx, n) { return { tipo: tipoDa(n), perguntas: 5, palavras: Math.min(8, 4 + Math.floor((n - 1) / 3) + mundoIdx), cruz: Math.min(6, 4 + Math.floor((n - 1) / 6) + (mundoIdx > 0 ? 1 : 0)) }; }
/** Quantas portas cada fase tem (desenho da Bea): 1 e 2 → 2 portas · 3, 4 e 5 → 3 · 6 e 7 → 1 só, mas é um DESAFIO (tempo / sem errar) · 8, 9 e 10 → 3 · 11 e 12 → 4. */
export const PORTAS_FASE = [2, 2, 3, 3, 3, 1, 1, 3, 3, 3, 4, 4];
export const qtdPortas = (n) => PORTAS_FASE[n - 1] || 3;
/** Fases-desafio (1 porta mais difícil): relâmpago do quiz sem errar nenhuma, e caça-palavras contra o relógio. ★ pelo tempo: até `ouro` s = 3 ★, até `prata` s = 2 ★, depois 1 ★. */
export const DESAFIOS = {
  6: { tipo: 'quiz', maxErros: 0, limite: 90, ouro: 40, prata: 65, titulo: 'desafio relâmpago: acerte as 5 sem errar nenhuma' },
  7: { tipo: 'caca', limite: 120, ouro: 50, prata: 85, titulo: 'desafio contra o relógio: ache todas as palavras, sem dica' },
};
/** Porta bônus "B" (a SAÍDA): quiz de 7 perguntas, no máximo 1 erro. Abre depois da fase 12 e dá a moldura do perfil. */
export const BONUS = { tipo: 'quiz', perguntas: 7, maxErros: 1, titulo: 'porta bônus: 7 perguntas, no máximo 1 erro', moldura: 'lab' };
export const estrelasDesafio = (seg, d) => (seg <= d.ouro ? 3 : seg <= d.prata ? 2 : 1);
export const bonusAberto = (est, mundo) => estOf(est, mundo, FASES) >= 1;
export const bonusFeito = (est, mundo) => (Number((est || {})[idFase(mundo, 'B')]) || 0) > 0;
/** As portas da fase, em ordem: cada uma é um dos 3 jogos (quiz → caça → cruzadinha → quiz…), com a dificuldade da fase e do mundo; as fases-desafio têm 1 porta com regra própria. */
export const portasDaFase = (mundoIdx, n) => (DESAFIOS[n] ? [{ ...faseCfg(mundoIdx, n), ...DESAFIOS[n], desafio: true }] : Array.from({ length: qtdPortas(n) }, (_, k) => { const c = faseCfg(mundoIdx, n); return { ...c, tipo: TIPOS[k % 3] }; }));
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
