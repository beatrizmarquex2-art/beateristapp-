// Lógica PURA do Modo Aventura do Jogo da Memória (sem tela): baralho com semente, estratégia de memória perfeita e limites de tentativas.
// Reaproveita os temas oficiais (js/kids/memory-themes.js) e o embaralhador de js/kids-logic.js; nada de carta nova.
import { themeById } from '../../kids/memory-themes.js';
import { shuffle } from '../../kids-logic.js';

/** Gerador pseudoaleatório com semente (mulberry32): mesma semente, mesmo baralho. */
export function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Mesma montagem do modo livre (sorteia os pares do tema e embaralha as 2n cartas), mas com um gerador `rnd` (semente na aventura). */
export function buildDeck(themeId, pairs, rnd) {
  const th = themeById[themeId]; if (!th) throw new Error(`tema desconhecido: ${themeId}`);
  const n = Math.min(pairs, th.items.length);
  const picks = shuffle(th.items, rnd).slice(0, n);
  const deck = shuffle(picks.flatMap((it) => [{ it, side: 'a' }, { it, side: 'b' }]), rnd).map((c, i) => ({ ...c, key: i }));
  return { th, pairs: n, picks, deck };
}
export const deckIds = (themeId, pairs, seed) => buildDeck(themeId, pairs, seeded(seed)).deck.map((c) => c.it.id);

/**
 * Jogador de memória perfeita (vira sempre a primeira carta ainda desconhecida; se já viu o par, vai direto nele).
 * Devolve quantas tentativas (pares virados) ele gasta nesse baralho. Mínimo teórico = nº de pares.
 */
export function perfectTries(ids) {
  const n = ids.length / 2; const seen = new Set(); const done = new Set(); let tries = 0;
  const posOf = (id, not) => { for (const p of seen) if (!done.has(ids[p]) && ids[p] === id && p !== not) return p; return -1; };
  const knownPair = () => { const by = new Map(); for (const p of seen) { if (done.has(ids[p])) continue; if (by.has(ids[p])) return ids[p]; by.set(ids[p], p); } return null; };
  const nextUnseen = () => { for (let i = 0; i < ids.length; i++) if (!seen.has(i)) return i; return -1; };
  while (done.size < n) {
    const kp = knownPair(); if (kp !== null) { tries++; done.add(kp); continue; }
    const p1 = nextUnseen(); const k = posOf(ids[p1], p1); seen.add(p1);
    if (k >= 0) { tries++; done.add(ids[p1]); continue; }
    const p2 = nextUnseen(); seen.add(p2); tries++;
    if (ids[p2] === ids[p1]) done.add(ids[p1]);
  }
  return tries;
}
/** Limite superior provado para a memória perfeita em QUALQUER baralho: cada tentativa errada revela 2 cartas novas, então erros ≤ n-1 e tentativas ≤ 2n-1. */
export const worstPerfect = (n) => 2 * n - 1;
/** Tempo mínimo que o próprio jogo impõe (650 ms de virada por tentativa + 700 ms de volta por erro), em segundos. */
export const minForcedSecs = (tries, pairs) => (tries * 650 + (tries - pairs) * 700) / 1000;
