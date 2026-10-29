// Cara a cara: regras puras sobre a tabela de dados.
import { INSTRUMENTS, BY_ID, QUESTIONS, answerFor } from './cara-data.js';
export const LIVES = 3;
const clone = (g) => JSON.parse(JSON.stringify(g));

export function newGame({ manual = false, rnd = Math.random } = {}) {
  const secret = INSTRUMENTS[Math.floor(rnd() * INSTRUMENTS.length)].id; // escolhido uma vez e nunca alterado
  return { v: 1, manual, secret, out: [], flips: [], wrong: [], asked: [], lives: LIVES, over: false, result: null };
}
/** Candidatos que ainda estão em jogo. */
export const candidates = (g) => INSTRUMENTS.map((i) => i.id).filter((id) => !g.out.includes(id) && !g.flips.includes(id) && !g.wrong.includes(id));
export const alreadyAsked = (g, qid) => g.asked.some((a) => a.id === qid);

export function ask(g0, qid) {
  if (g0.over) throw new Error('fim de jogo');
  if (!QUESTIONS.some((q) => q.id === qid)) throw new Error('pergunta inexistente');
  if (alreadyAsked(g0, qid)) throw new Error('pergunta repetida');
  const g = clone(g0); const yes = answerFor(BY_ID[g.secret], qid); const q = QUESTIONS.find((x) => x.id === qid);
  const removed = [];
  if (!g.manual) for (const i of INSTRUMENTS) if (!g.out.includes(i.id) && answerFor(i, qid) !== yes) { g.out.push(i.id); removed.push(i.id); }
  g.asked.push({ id: qid, text: q.text, yes, why: q.why, removed });
  return g;
}
/** Manual: vira (ou desvira) uma carta; a última virada pode ser desfeita. */
export function flip(g0, id) {
  if (g0.over || !g0.manual) throw new Error('virar só no manual');
  const g = clone(g0); g.flips = g.flips.includes(id) ? g.flips.filter((x) => x !== id) : [...g.flips, id]; return g;
}
export function undoFlip(g0) { if (g0.over || !g0.manual || !g0.flips.length) throw new Error('nada a desfazer'); const g = clone(g0); g.flips.pop(); return g; }
/** Chute por nome: não elimina ninguém além do próprio chutado. */
export function guess(g0, id) {
  if (g0.over) throw new Error('fim de jogo'); if (!BY_ID[id]) throw new Error('instrumento inexistente'); if (g0.wrong.includes(id)) throw new Error('já chutado');
  const g = clone(g0);
  if (id === g.secret) { g.over = true; g.result = { win: true, questions: g.asked.length, wrong: g.wrong.length }; return g; }
  g.wrong.push(id); g.lives--;
  if (g.lives <= 0) { g.over = true; g.result = { win: false, questions: g.asked.length, wrong: g.wrong.length }; }
  return g;
}
export function validGame(g) {
  try { return !!g && g.v === 1 && !!BY_ID[g.secret] && Array.isArray(g.asked) && Array.isArray(g.out) && g.lives >= 0 && g.lives <= LIVES; } catch { return false; }
}
