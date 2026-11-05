// Mapa de fases (Turnê do Vinil): lógica PURA, sem tela. Decide o estado de cada disco, as regiões e a posição de tudo.
// Não cria fases nem muda regra de desbloqueio: só lê o que o jogo já informa (estrelas, melhor %, liberada ou não).
export const REGIONS = [
  { id: 'vila', name: 'Vila do Vinil', sub: 'onde tudo começa' },
  { id: 'rua', name: 'Rua do Ritmo', sub: 'a cidade musical' },
  { id: 'estudio', name: 'Estúdio Pixel', sub: 'gravação e desafios' },
  { id: 'floresta', name: 'Floresta das Melodias', sub: 'o bosque que canta' },
  { id: 'neon', name: 'Cidade Neon', sub: 'novos desafios' },
  { id: 'palco', name: 'Grande Palco', sub: 'a final' },
];
/** Estados de um disco. */
export const ST = { DONE: 'done', CURRENT: 'current', OPEN: 'open', LOCKED: 'locked' };

/** Confere a lista de fases: ids repetidos, índices fora de ordem ou buracos. Devolve { ok, errors }. */
export function checkLevels(levels) {
  const errors = []; const ids = new Set();
  levels.forEach((l, i) => {
    if (ids.has(l.id)) errors.push(`id repetido: ${l.id}`); ids.add(l.id);
    if (l.index !== undefined && i > 0 && l.index !== levels[i - 1].index + 1) errors.push(`fora de ordem: ${levels[i - 1].index} → ${l.index}`);
  });
  return { ok: !errors.length, errors };
}

/**
 * Junta a lista ordenada de fases com o progresso (funções que o jogo fornece) e dá o estado de cada uma.
 * done = tem ≥1 estrela (a mesma regra que libera a próxima). current = primeira liberada ainda sem estrela
 * (se tudo foi concluído, é a última). open = liberada e ainda não é a atual. locked = trancada.
 */
export function computeNodes(levels, { starsOf = () => 0, bestOf = () => null, unlockedOf = () => true } = {}) {
  const nodes = levels.map((l, i) => {
    const stars = Math.max(0, Math.min(3, Number(starsOf(l.id)) || 0)); const unlocked = !!unlockedOf(l.id) || stars > 0;
    return { ...l, pos: i, stars, best: bestOf(l.id), unlocked, state: stars > 0 ? ST.DONE : unlocked ? ST.OPEN : ST.LOCKED };
  });
  let cur = nodes.findIndex((n) => n.state === ST.OPEN);
  const allDone = cur < 0 && nodes.length > 0 && nodes.every((n) => n.state === ST.DONE);
  if (cur < 0) cur = Math.max(0, nodes.length - 1);
  if (nodes[cur] && nodes[cur].state === ST.OPEN) nodes[cur].state = ST.CURRENT;
  return { nodes, current: cur, allDone };
}

/** Divide as fases em até 6 regiões seguidas (tamanho igual, a última pode ser menor). Só visual. */
export function chaptersFor(count, regions = REGIONS) {
  if (count <= 0) return [];
  const size = Math.ceil(count / regions.length); const out = [];
  for (let from = 0, k = 0; from < count; from += size, k++) out.push({ ...regions[k], from, to: Math.min(count, from + size) - 1 });
  return out;
}

export const MAP_W = 360;
const XS = [180, 104, 180, 256]; // vai e volta suave
/** Posição de cada disco: o começo fica embaixo e a subida vai pra cima. Tudo em unidades de um quadro 360 × altura. */
export function layoutMap(count, { step = 150, top = 40, bottom = 70, banner = 84 } = {}) {
  const chapters = chaptersFor(count); const pts = [];
  // cada região tem uma faixa de título em cima; as faixas empurram os discos
  let y = 0; const bands = [];
  const total = top + bottom + (count - 1) * step + chapters.length * banner;
  const rev = [...chapters].reverse(); // de cima (última região) pra baixo
  y = top;
  const ys = new Array(count);
  rev.forEach((c) => {
    const b0 = y; y += banner; // faixa do título
    for (let i = c.to; i >= c.from; i--) { ys[i] = y + step / 2; y += step; }
    bands.push({ ...c, y0: b0, y1: y });
  });
  for (let i = 0; i < count; i++) pts.push({ x: XS[i % XS.length], y: ys[i] });
  const H = Math.max(total, y + bottom);
  return { W: MAP_W, H, pts, bands: bands.reverse() };
}

/** Caminho suave (curvas) por todos os pontos, do primeiro (embaixo) ao último. */
export function pathThrough(pts) {
  if (!pts.length) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1]; const b = pts[i]; const my = (a.y + b.y) / 2; d += ` C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`; }
  return d;
}

/** Quais discos ficaram concluídos desde a última vez que o mapa foi visto (pra comemorar). `seen` null = nunca visto (não comemora). */
export function newlyDone(seen, nodes) {
  if (!Array.isArray(seen)) return [];
  const s = new Set(seen);
  return nodes.filter((n) => n.state === ST.DONE && !s.has(n.id));
}
export const doneIds = (nodes) => nodes.filter((n) => n.state === ST.DONE).map((n) => n.id);
/** Região (índice) de uma fase. */
export const regionOf = (chapters, pos) => Math.max(0, chapters.findIndex((c) => pos >= c.from && pos <= c.to));
