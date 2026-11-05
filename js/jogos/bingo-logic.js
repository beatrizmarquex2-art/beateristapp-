// Bingo musical v2: regras puras (sem tela). Cartela 3×3 com 9 ids distintos, sem casa livre. Vitória por 3 em linha:
// horizontal, vertical ou diagonal (o jogador escolhe a condição antes de começar). Os mesmos ids valem para cartela, sorteio e conferência.
import { THEMES, CARDS24, ARTISTS } from './bingo-data.js';

export const SIZE = 3; export const CELLS = 9;
export const THEME_LIST = [['instrumentos', 'Instrumentos'], ['pecas', 'Peças da bateria'], ['figuras', 'Figuras rítmicas'], ['simbolos', 'Símbolos musicais'], ['artistas', 'Artistas & Bandas']];
export const THEME_NAME = Object.fromEntries(THEME_LIST);
export const LINE_SETS = { horizontal: [[0, 1, 2], [3, 4, 5], [6, 7, 8]], vertical: [[0, 3, 6], [1, 4, 7], [2, 5, 8]], diagonal: [[0, 4, 8], [2, 4, 6]] };
export const VICTORIES = [['qualquer', 'Qualquer linha'], ['horizontal', 'Somente horizontal'], ['vertical', 'Somente vertical'], ['diagonal', 'Somente diagonal']];
export const linesFor = (v) => (v === 'horizontal' || v === 'vertical' || v === 'diagonal' ? LINE_SETS[v] : [...LINE_SETS.horizontal, ...LINE_SETS.vertical, ...LINE_SETS.diagonal]);
export const lineKind = (line) => (LINE_SETS.horizontal.some((l) => l.join() === line.join()) ? 'horizontal' : LINE_SETS.vertical.some((l) => l.join() === line.join()) ? 'vertical' : 'diagonal');
export const ARTIST_ROUND = 18;

/* ---------- catálogo ---------- */
const NAMES = {}; for (const [t, v] of Object.entries(THEMES)) for (const i of v.itens) NAMES[`${t}:${i.id}`] = i.nome;
const ART_BY = Object.fromEntries(ARTISTS.map((a) => [a.id, a]));
export const themeIds = (tema) => (tema === 'artistas' ? ARTISTS.map((a) => a.id) : (THEMES[tema] ? THEMES[tema].itens.map((i) => i.id) : []));
export const nameOf = (tema, id) => (tema === 'artistas' ? (ART_BY[id] || {}).nome || id : NAMES[`${tema}:${id}`] || id);
export const artistOf = (id) => ART_BY[id] || null;

/* ---------- sorteio ---------- */
/** Fisher-Yates (embaralhamento uniforme). */
export function shuffle(list, rnd = Math.random) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function seeded(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Pool da rodada: os 16 itens do tema, ou 18 alvos de artistas girando entre rodadas (`recent` = ids usados, do mais antigo ao mais novo). */
export function makePool(tema, rnd = Math.random, recent = []) {
  if (tema !== 'artistas') return themeIds(tema);
  const all = themeIds('artistas'); const used = new Set(recent); const fresh = all.filter((i) => !used.has(i));
  if (fresh.length >= ARTIST_ROUND) return shuffle(fresh, rnd).slice(0, ARTIST_ROUND);
  const oldest = recent.filter((i, k) => recent.indexOf(i) === k && all.includes(i)); // do mais antigo ao mais novo
  return [...shuffle(fresh, rnd), ...oldest].slice(0, ARTIST_ROUND);
}
/** `n` cartelas de 9 ids distintos do pool; nenhuma cartela repete o conjunto de outra. */
export function makeCards(pool, n, rnd = Math.random) {
  const cards = []; const seen = new Set(); let guard = 0;
  while (cards.length < n && guard++ < 20000) {
    const c = shuffle(pool, rnd).slice(0, CELLS); const sig = c.slice().sort().join('|');
    if (!seen.has(sig)) { seen.add(sig); cards.push(c); }
  }
  if (cards.length < n) throw new Error('nao-deu-pra-gerar-cartelas-distintas');
  return cards;
}
/** Foto do alvo (artistas): fixa por rodada (mesmo `salt`), então nos dois aparelhos aparece a mesma. */
export function photoFor(id, salt = '') { const a = ART_BY[id]; if (!a || !a.fotos.length) return null; return a.fotos[hash(`${salt}:${id}`) % a.fotos.length]; }
export const photoSrc = (code) => `assets/figurinhas/fotos/${code}.jpeg`;

/* ---------- partida ---------- */
export const MODES = [['solo', 'Sozinho'], ['online', 'Jogar online por código'], ['mesmo', '2 jogadores no mesmo aparelho'], ['sala', 'Sala de aula']];
export const PROFILES = [['kids', 'Kids'], ['classico', 'Clássico']];
const clone = (g) => ({ ...g, cards: g.cards.map((c) => c.slice()), marks: g.marks.map((m) => m.slice()), claims: g.claims.slice(), names: g.names.slice(), round: g.round ? { active: g.round.active, done: g.round.done.slice() } : null });

/** Partida local (sozinho, mesmo aparelho ou sorteador da sala de aula). */
export function newGame({ tema = 'instrumentos', perfil = 'kids', vitoria = 'qualquer', mode = 'solo', draw = 'manual', intervalo = 12, autoMarcar, names, rnd = Math.random, recent = [], seed } = {}) {
  const pool = makePool(tema, rnd, recent); const seq = shuffle(pool, rnd);
  const nCards = mode === 'mesmo' ? 2 : mode === 'sala' ? 0 : 1;
  const cards = nCards ? makeCards(pool, nCards, rnd) : [];
  return {
    v: 2, tema, perfil: perfil === 'classico' ? 'classico' : 'kids', vitoria: VICTORIES.some((x) => x[0] === vitoria) ? vitoria : 'qualquer', mode, draw: draw === 'auto' ? 'auto' : 'manual', intervalo,
    autoMarcar: autoMarcar === undefined ? perfil !== 'classico' : !!autoMarcar, names: (names && names.length ? names : ['Jogador 1', 'Jogador 2']).slice(0, 2),
    pool, seq, idx: 0, cards, marks: cards.map(() => Array(CELLS).fill(false)), round: null, claims: cards.map(() => null), over: false, result: null, salt: String(seed ?? Math.floor(rnd() * 1e9)),
  };
}
export const total = (g) => g.seq.length;
export const drawn = (g) => g.seq.slice(0, g.idx);
export const remaining = (g) => g.seq.length - g.idx;
export const current = (g) => (g.idx ? g.seq[g.idx - 1] : null);
export const isDrawn = (g, id) => g.seq.indexOf(id) >= 0 && g.seq.indexOf(id) < g.idx;
export const canDraw = (g) => !g.over && g.idx < g.seq.length && (g.mode !== 'mesmo' || !g.round || g.round.done.every(Boolean));
/** Sorteia o próximo (sem repetir). Recusa se não puder (acabou, partida encerrada ou ainda falta a vez de um jogador). */
export function drawNext(g) {
  if (!canDraw(g)) throw new Error('nao-pode-sortear');
  const n = clone(g); n.idx += 1; const id = n.seq[n.idx - 1];
  if (n.autoMarcar) n.cards.forEach((c, ci) => c.forEach((x, cell) => { if (x === id) n.marks[ci][cell] = true; }));
  n.round = n.mode === 'mesmo' ? { active: 0, done: [false, false] } : null; n.claims = n.claims.map(() => null);
  return n;
}
/** Marca/desmarca. Só dá pra marcar item que já saiu; no mesmo aparelho, só o jogador da vez. */
export function toggleMark(g, ci, cell) {
  if (g.over) return { ok: false, reason: 'fim', g };
  if (g.mode === 'mesmo' && (!g.round || g.round.active !== ci)) return { ok: false, reason: 'vez', g };
  const id = g.cards[ci] && g.cards[ci][cell]; if (id === undefined) return { ok: false, reason: 'casa', g };
  const n = clone(g);
  if (n.marks[ci][cell]) { n.marks[ci][cell] = false; return { ok: true, g: n }; }
  if (!isDrawn(g, id)) return { ok: false, reason: 'nao-sorteado', g };
  n.marks[ci][cell] = true; return { ok: true, g: n };
}
/** Linha válida: as 3 casas estão sorteadas E marcadas e a linha vale na condição escolhida. */
export function validLine(g, ci) {
  for (const line of linesFor(g.vitoria)) if (line.every((c) => g.marks[ci][c] && isDrawn(g, g.cards[ci][c]))) return line;
  return null;
}
/** Linha totalmente sorteada (mesmo sem marcar) — usada na regra de empate. */
export function drawnLine(g, ci, upTo = g.idx) { const set = new Set(g.seq.slice(0, upTo)); for (const line of linesFor(g.vitoria)) if (line.every((c) => set.has(g.cards[ci][c]))) return line; return null; }
/** Em qual sorteio (1, 2, 3…) a primeira linha válida dessa cartela ficou completa; null se ainda não. */
export function completedAt(g, ci) { for (let k = 1; k <= g.idx; k++) if (drawnLine(g, ci, k)) return k; return null; }

/** Pedido de BINGO. Sozinho: confere e encerra. No mesmo aparelho: o pedido fica guardado e é resolvido quando os DOIS passaram pela rodada. */
export function declare(g, ci) {
  if (g.over) return { ok: false, reason: 'fim', g };
  if (g.mode === 'mesmo' && (!g.round || g.round.active !== ci)) return { ok: false, reason: 'vez', g };
  const line = validLine(g, ci);
  if (!line) return { ok: false, reason: drawnLine(g, ci) ? 'falta-marcar' : 'sem-linha', g };
  const n = clone(g);
  if (n.mode !== 'mesmo') { n.over = true; n.result = { tipo: 'vitoria', vencedores: [ci], linhas: { [ci]: line } }; return { ok: true, g: n }; }
  n.claims[ci] = { at: completedAt(g, ci), line }; return { ok: true, pending: true, g: n };
}
/** Fim da vez do jogador ativo (mesmo aparelho): passa pro outro; quando os dois passaram, resolve os pedidos de bingo da rodada. */
export function passTurn(g) {
  if (g.mode !== 'mesmo' || !g.round || g.over) return g;
  const n = clone(g); n.round.done[n.round.active] = true;
  if (n.round.active === 0) { n.round.active = 1; return n; }
  const c = n.claims; const ok = [0, 1].filter((i) => c[i]);
  if (ok.length === 2) {
    const [a, b] = [c[0].at, c[1].at];
    n.over = true; n.result = a === b ? { tipo: 'empate', vencedores: [0, 1], linhas: { 0: c[0].line, 1: c[1].line } } : (a < b ? { tipo: 'vitoria', vencedores: [0], linhas: { 0: c[0].line } } : { tipo: 'vitoria', vencedores: [1], linhas: { 1: c[1].line } });
  } else if (ok.length === 1) { n.over = true; n.result = { tipo: 'vitoria', vencedores: [ok[0]], linhas: { [ok[0]]: c[ok[0]].line } }; }
  return n;
}

/* ---------- textos ---------- */
export const announce = (g, id) => `Saiu: ${nameOf(g.tema, id)}!`;
export const counter = (g) => `Sorteados: ${g.idx} de ${g.seq.length}`;

/* ---------- retomar partida (localStorage) ---------- */
export function validGame(g) {
  try {
    if (!g || g.v !== 2 || !THEME_NAME[g.tema] || !Array.isArray(g.seq) || !Array.isArray(g.pool) || !Array.isArray(g.cards)) return false;
    const pool = new Set(g.pool); if (pool.size !== g.pool.length || g.seq.length !== pool.size || !g.seq.every((i) => pool.has(i)) || new Set(g.seq).size !== g.seq.length) return false;
    if (g.tema === 'artistas' ? pool.size !== ARTIST_ROUND : pool.size !== 16) return false;
    if (!Number.isInteger(g.idx) || g.idx < 0 || g.idx > g.seq.length) return false;
    return g.cards.length === g.marks.length && g.cards.every((c, i) => c.length === CELLS && new Set(c).size === CELLS && c.every((x) => pool.has(x)) && g.marks[i].length === CELLS);
  } catch { return false; }
}

/* ---------- impressão: cartelas oficiais ---------- */
/** 24 cartelas do tema. Os 4 temas originais usam as 24 oficiais (amostra aprovada); artistas gera um recorte novo. */
export function printCards(tema, rnd = Math.random, recent = []) {
  if (tema !== 'artistas') return { pool: themeIds(tema), cards: CARDS24[tema].map((c) => ({ id: c.id, grid: c.grade.flat() })) };
  const pool = makePool('artistas', rnd, recent); return { pool, cards: makeCards(pool, 24, rnd).map((c, i) => ({ id: `ART-${String(i + 1).padStart(2, '0')}`, grid: c })) };
}
