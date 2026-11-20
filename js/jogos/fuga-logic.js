// A Fuga do Estúdio em mapa (como os outros jogos de caminhozinho): 3 mundos × 12 fases × 3 ★ = 36 ★ por mundo. Lógica pura (testada em tests/fuga-logic.test.mjs).
//  mundo 1 = Estúdio do Paul (escape room) · mundo 2 = Camarim · mundo 3 = Palco (os ids internos estudio/vulcao/espaco ficam, pra não perder o progresso salvo). Cada fase é uma PORTA: quiz, caça-palavras ou cruzadinha, em rodízio.
import { regioesDoTema } from './mundos-tema.js';

export const FASES = 12;
export const MUNDOS = [
  { id: 'estudio', tema: 'laser', nome: 'Estúdio do Paul', curto: 'estúdio', sub: 'escape room: ache a saída', mapa: 'lab', regioes: regioesDoTema('laser', [['corredor', 'Corredor dos Lasers', 'cuidado com o vermelho'], ['cabine', 'Cabine Secreta', 'a saída está perto']]) },
  { id: 'vulcao', tema: 'laser', nome: 'Camarim do Paul', curto: 'camarim', sub: 'espelho, luzes e frio na barriga', regioes: regioesDoTema('laser', [['espelho', 'Espelho das Luzes', 'ajeita o figurino'], ['coxia', 'Coxia', 'quase na hora de entrar']]) },
  { id: 'espaco', tema: 'laser', nome: 'Palco Principal', curto: 'palco', sub: 'a plateia tá esperando', regioes: regioesDoTema('laser', [['plateia', 'Fosso da Plateia', 'luz nos olhos'], ['solo', 'Solo Final', 'o último refrão']]) },
];
/** Os tipos de porta (registro: pra criar um novo jogo é só pôr aqui o nome, o rótulo e a função em fuga-mini.js). Os 3 principais são quiz, caça-palavras e cruzadinha. */
export const TIPOS = ['quiz', 'caca', 'cruz', 'genius', 'caminho', 'memoria', 'queda', 'queda4', 'montar', 'compasso', 'intruso'];
export const PRINCIPAIS = TIPOS.slice(0, 3);
export const NOME_TIPO = { quiz: 'sala de controle (quiz)', caca: 'cabine de gravação (caça-palavras)', cruz: 'sala de ensaio (cruzadinha)', genius: 'mesa de som (genius)', caminho: 'corredor de notas (caminho 3×3)', memoria: 'arquivo de discos (memória)', queda: 'palco das figuras (notas caindo)', queda4: 'palco das figuras (4 notas caindo)', montar: 'bancada das notas (montar nota)', compasso: 'mesa de mixagem (feche o compasso)', intruso: 'discoteca (o intruso)' };
export const tipoDa = (n) => PRINCIPAIS[(n - 1) % 3]; // (legado) tipo da 1ª porta da fase
export const idFase = (mundo, n) => `${mundo}:${n}`;
/** 3 níveis em todos os jogos das portas: fácil (fases 1-4), médio (5-8) e difícil (9-12). Os mundos 2 e 3 sobem 1 nível (teto: difícil); as fases-desafio são no mínimo médio e a porta B é difícil. */
export const NIVEIS = ['facil', 'medio', 'dificil'];
export const NOME_NIVEL = { facil: 'fácil', medio: 'médio', dificil: 'difícil' };
export function nivelDaFase(n, mundoIdx = 0, shift = 0) {
  let i = n <= 4 ? 0 : n <= 8 ? 1 : 2; if (DESAFIOS[n]) i = Math.max(i, 1); if (mundoIdx > 0) i = Math.min(2, i + 1); return NIVEIS[Math.min(2, i + shift)];
}
/** O que cada nível pede. quiz: tipos de pergunta · caça: palavras, tamanho da grade e direções (0 = → ↓, 1 = + ↘, 2 = todas) · cruzadinha: palavras e tamanho delas · genius: rodadas e botões · caminho: casas e caminhos · memória: pares. */
export const NIVEL_CFG = {
  facil: { quiz: ['blank'], palavras: 4, grade: 9, dirs: 0, cruz: 4, cruzMax: 6, genius: { rodadas: 4, pads: 4, ms: 700 }, caminho: { len: 4, caminhos: 2 }, memoria: { pares: 4 }, montar: {}, compasso: { rodadas: 3 }, intruso: { rodadas: 3 } },
  medio: { quiz: ['blank', 'continua'], palavras: 6, grade: 10, dirs: 1, cruz: 5, cruzMax: 8, genius: { rodadas: 6, pads: 4, ms: 550 }, caminho: { len: 5, caminhos: 3 }, memoria: { pares: 6 }, montar: {}, compasso: { rodadas: 3 }, intruso: { rodadas: 3 } },
  dificil: { quiz: ['continua', 'match'], palavras: 8, grade: 11, dirs: 2, cruz: 6, cruzMax: 9, genius: { rodadas: 8, pads: 6, ms: 420 }, caminho: { len: 7, caminhos: 3 }, memoria: { pares: 8 }, montar: {}, compasso: { rodadas: 4 }, intruso: { rodadas: 4 } },
};
/** `tr` = a trilha (fuga-trilhas-logic.js trilhaCfg): `assuntos`, `extra` (a infinita sobe um pouco a cada volta: mais palavras, sequências maiores…) e `nivelShift`. Sem `tr` = a Fuga de sempre. */
export function faseCfg(mundoIdx, n, tr = {}) {
  const nivel = nivelDaFase(n, mundoIdx, tr.nivelShift || 0); const c = NIVEL_CFG[nivel]; const x = tr.extra || 0;
  return { tipo: tipoDa(n), nivel, perguntas: 3, palavras: Math.min(9, c.palavras + x), cruz: Math.min(7, c.cruz + x), cruzMax: c.cruzMax, grade: Math.min(12, c.grade + (x > 1 ? 1 : 0)), dirs: c.dirs, kinds: c.quiz, extra: x, assuntos: tr.assuntos || null };
}
/** A config de um jogo de toque (genius, caminho, memória, compasso, intruso) no nível `nivel`, com o `extra` da trilha infinita (tetos pra não quebrar a tela). */
export function cfgMini(nivel, jogo, extra = 0) {
  const c = { ...NIVEL_CFG[nivel][jogo] }; if (!extra) return c;
  if (jogo === 'genius') { c.rodadas = Math.min(10, c.rodadas + extra); c.ms = Math.max(300, Math.round(c.ms * (1 - 0.06 * extra))); }
  else if (jogo === 'caminho') { c.len = Math.min(8, c.len + extra); }
  else if (jogo === 'memoria') { c.pares = Math.min(8, c.pares + extra); }
  else if (jogo === 'compasso' || jogo === 'intruso') { c.rodadas = Math.min(5, c.rodadas + (extra > 1 ? 1 : 0)); } // jogos rápidos: no máximo 5 rodadas, mesmo na trilha infinita
  return c;
}
/** Quantas portas cada fase tem (desenho da Bea): 1 e 2 → 2 portas · 3, 4 e 5 → 3 · 6 e 7 → 1 só, mas é um DESAFIO (tempo / sem errar) · 8, 9 e 10 → 3 · 11 e 12 → 4. */
export const PORTAS_FASE = [2, 2, 3, 3, 3, 1, 1, 3, 3, 3, 4, 4];
export const qtdPortas = (n) => PORTAS_FASE[n - 1] || 3;
/** Fases-desafio (1 porta mais difícil): relâmpago do quiz sem errar nenhuma, e caça-palavras contra o relógio. ★ pelo tempo: até `ouro` s = 3 ★, até `prata` s = 2 ★, depois 1 ★. */
export const DESAFIOS = {
  6: { tipo: 'quiz', maxErros: 0, limite: 90, ouro: 40, prata: 65, titulo: 'desafio relâmpago: acerte as 5 sem errar nenhuma' },
  7: { tipo: 'caca', limite: 120, ouro: 50, prata: 85, titulo: 'desafio contra o relógio: ache todas as palavras, sem dica' },
};
/** Porta bônus "B" (a SAÍDA): quiz de 7 perguntas, no máximo 1 erro. Abre depois da fase 12 e dá a moldura do perfil. */
export const BONUS = { tipo: 'quiz', nivel: 'dificil', kinds: NIVEL_CFG.dificil.quiz, perguntas: 7, maxErros: 1, titulo: 'porta bônus: 7 perguntas, no máximo 1 erro', moldura: 'lab' };
export const estrelasDesafio = (seg, d) => (seg <= d.ouro ? 3 : seg <= d.prata ? 2 : 1);
export const bonusAberto = (est, mundo) => estOf(est, mundo, FASES) >= 1;
export const bonusFeito = (est, mundo) => (Number((est || {})[idFase(mundo, 'B')]) || 0) > 0;
/** Que jogo é cada porta (desenho fechado: nada de 2 quizzes seguidos na fase 11/12; fases 6 e 7 são os desafios). Cada fase tem a quantidade de PORTAS_FASE. */
export const TIPOS_FASE = [
  ['quiz', 'memoria'], ['caca', 'quiz'], ['quiz', 'caca', 'montar'], ['cruz', 'montar', 'genius'], ['intruso', 'caca', 'cruz'],
  ['quiz'], ['caca'], ['intruso', 'quiz', 'caca'], ['compasso', 'intruso', 'genius'], ['quiz', 'compasso', 'cruz'],
  ['intruso', 'queda', 'caca', 'cruz'], ['memoria', 'caminho', 'queda4', 'cruz'],
];
/** As portas da fase, em ordem: cada uma é um dos jogos de TIPOS_FASE, com o nível da fase e do mundo; as fases-desafio têm 1 porta com regra própria. A "área" do genius alterna entre notas e bateria. */
export const portasDaFase = (mundoIdx, n, tr = {}) => (DESAFIOS[n] ? [{ ...faseCfg(mundoIdx, n, tr), ...DESAFIOS[n], desafio: true }]
  : TIPOS_FASE[n - 1].map((tipo, k) => ({ ...faseCfg(mundoIdx, n, tr), tipo: (tr.subst && tr.subst[tipo]) || tipo, area: tr.area || ((n + k + mundoIdx) % 2 ? 'bateria' : 'notas') })));
export const idPorta = (mundo, n, k) => `${mundo}:${n}:${k}`;
/** ★ da fase no mapa (1 a 3) = média das ★ das portas, arredondada pra cima na metade, nunca abaixo de 1 se passou por todas. */
export const estrelasFase = (lista) => { const v = (lista || []).filter((x) => x > 0); if (!v.length) return 0; return Math.max(1, Math.min(3, Math.round(v.reduce((a, b) => a + b, 0) / v.length))); };
export const MIN_QUIZ = 3;
/** Quantas certas abrem a porta: quiz de 3 perguntas = 2 de 3; os quizzes maiores (desafios e porta B) seguem pedindo 3. */
export const minQuiz = (total) => (total <= 3 ? 2 : MIN_QUIZ);
/** ★ de uma porta: quiz de 3 perguntas: 3 certas = 3 ★ · 2 certas = 2 ★ · cada pulada tira 1 ★ · a dica limita em 2 ★; caça = 3 ★ menos 1 por dica (mínimo 1); cruzadinha = 3 ★. */
export function estrelasPorta(tipo, s = {}) {
  if (tipo === 'quiz') { const total = s.total || 3; const base = (s.found | 0) >= total ? 3 : 2; const v = Math.max(1, base - (s.puladas | 0)); return s.ajuda ? Math.min(v, 2) : v; } // 3 de 3 = 3 ★ · 2 de 3 = 2 ★ · cada pergunta pulada tira 1 ★ (mínimo 1 ★ se abriu a porta) · a dica limita em 2 ★
  if (s.estrelas) return Math.max(1, Math.min(3, s.estrelas)); // caça (menos 1 por dica) e os jogos de toque (genius, caminho, memória: pelos erros)
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
