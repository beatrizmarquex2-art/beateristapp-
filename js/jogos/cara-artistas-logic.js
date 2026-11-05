// Cara a cara dos artistas: regras puras (mesmas do cara a cara dos instrumentos, mas com um baralho de 16 cartas sorteadas das 86).
import { ARTISTS, BY_ID, QUESTIONS, answerFor, DECK_SIZE } from './cara-artistas-data.js';
export const LIVES = 3;
export const signature = (a) => [...a.attrs].sort().join(',');
const clone = (g) => JSON.parse(JSON.stringify(g));
const shuffle = (list, rnd) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Baralho com `DECK_SIZE` artistas diferentes; cada um mostra uma das suas figurinhas (sorteada uma vez e guardada). */
export function newGame({ manual = false, rnd = Math.random, size = DECK_SIZE } = {}) {
  // só entram cartas que se distinguem por pelo menos uma pergunta (assinatura de atributos diferente): assim toda partida tem solução
  const seen = new Set(); const deck = [];
  for (const a of shuffle(ARTISTS, rnd)) { const sig = signature(a); if (seen.has(sig)) continue; seen.add(sig); deck.push(a.id); if (deck.length >= size) break; }
  const secret = deck[Math.floor(rnd() * deck.length)];
  const photos = Object.fromEntries(deck.map((id) => [id, BY_ID[id].fotos[Math.floor(rnd() * BY_ID[id].fotos.length)]]));
  return { v: 2, kind: 'artistas', manual, deck, photos, secret, out: [], flips: [], wrong: [], asked: [], lives: LIVES, over: false, result: null };
}
export const candidates = (g) => g.deck.filter((id) => !g.out.includes(id) && !g.flips.includes(id) && !g.wrong.includes(id));
export const alreadyAsked = (g, qid) => g.asked.some((a) => a.id === qid);

export function ask(g0, qid) {
  if (g0.over) throw new Error('fim de jogo');
  const q = QUESTIONS.find((x) => x.id === qid); if (!q) throw new Error('pergunta inexistente');
  if (alreadyAsked(g0, qid)) throw new Error('pergunta repetida');
  const g = clone(g0); const yes = answerFor(BY_ID[g.secret], qid); const removed = [];
  if (!g.manual) for (const id of g.deck) if (!g.out.includes(id) && answerFor(BY_ID[id], qid) !== yes) { g.out.push(id); removed.push(id); }
  g.asked.push({ id: qid, text: q.text, yes, why: q.why, removed });
  return g;
}
export function flip(g0, id) {
  if (g0.over || !g0.manual) throw new Error('virar só no manual');
  const g = clone(g0); g.flips = g.flips.includes(id) ? g.flips.filter((x) => x !== id) : [...g.flips, id]; return g;
}
export function undoFlip(g0) { if (g0.over || !g0.manual || !g0.flips.length) throw new Error('nada a desfazer'); const g = clone(g0); g.flips.pop(); return g; }
export function guess(g0, id) {
  if (g0.over) throw new Error('fim de jogo'); if (!g0.deck.includes(id)) throw new Error('carta fora do baralho'); if (g0.wrong.includes(id)) throw new Error('já chutado');
  const g = clone(g0);
  if (id === g.secret) { g.over = true; g.result = { win: true, questions: g.asked.length, wrong: g.wrong.length }; return g; }
  g.wrong.push(id); g.lives--;
  if (g.lives <= 0) { g.over = true; g.result = { win: false, questions: g.asked.length, wrong: g.wrong.length }; }
  return g;
}
export function validGame(g) {
  try { return !!g && g.v === 2 && g.kind === 'artistas' && Array.isArray(g.deck) && g.deck.length > 1 && g.deck.every((id) => !!BY_ID[id]) && g.deck.includes(g.secret) && Array.isArray(g.asked) && g.lives >= 0 && g.lives <= LIVES; } catch { return false; }
}
