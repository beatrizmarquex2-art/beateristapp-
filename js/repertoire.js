// Repertório: músicas pra tocar junto (as do método vêm do Supabase privado, kind "song"; as suas também).
// Puro, testado em tests/repertoire.test.mjs.

export const STAGES = [
  { id: '', label: 'sem marcar' },
  { id: 'quero', label: 'quero aprender' },
  { id: 'estudando', label: 'estudando' },
  { id: 'toco', label: 'já toco' },
];
export const stageLabel = (id) => (STAGES.find((s) => s.id === (id || '')) || STAGES[0]).label;
/** Próximo estágio ao tocar no selo: sem marcar → quero → estudando → já toco → sem marcar. */
export const nextStage = (id) => STAGES[(STAGES.findIndex((s) => s.id === (id || '')) + 1) % STAGES.length].id;

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Grupos na ordem em que aparecem (as do método pela ordem do PDF; "minhas músicas" no fim). */
export function groupsOf(list) {
  const m = new Map();
  for (const r of list) { const g = r.data.group || 'Minhas músicas'; const o = r.data.metodo ? (r.data.gorder ?? 50) : 99; if (!m.has(g) || m.get(g) > o) m.set(g, o); }
  return [...m.entries()].sort((a, b) => a[1] - b[1]).map(([g]) => g);
}

/** Filtro: grupo, estágio, texto (título/artista sem acento) e faixa de BPM. */
export function filterSongs(list, { group = '', stage = null, q = '', min = 0, max = 999 } = {}) {
  const t = norm(q.trim());
  return list.filter((r) => {
    const d = r.data;
    if (group && (d.group || 'Minhas músicas') !== group) return false;
    if (stage !== null && (d.stage || '') !== stage) return false;
    if (t && !norm(`${d.title} ${d.artist} ${d.pdf || ''}`).includes(t)) return false;
    const b = Number(d.bpm) || 0;
    return !b || (b >= min && b <= max);
  });
}

/** Ordem: a da lista (grupo e posição), ou por BPM, ou por nome. */
export function sortSongs(list, by = 'lista') {
  const s = [...list];
  if (by === 'bpm') return s.sort((a, b) => (Number(a.data.bpm) || 999) - (Number(b.data.bpm) || 999) || a.data.title.localeCompare(b.data.title, 'pt-BR'));
  if (by === 'nome') return s.sort((a, b) => a.data.title.localeCompare(b.data.title, 'pt-BR'));
  return s.sort((a, b) => (a.data.metodo ? a.data.gorder ?? 50 : 99) - (b.data.metodo ? b.data.gorder ?? 50 : 99) || (a.data.order || 0) - (b.data.order || 0) || (a.data.created || 0) - (b.data.created || 0));
}

/**
 * Treino de 5: primeiro o que está "estudando", depois "quero aprender", depois o resto; sorteado dentro de cada faixa
 * e entregue do BPM mais lento pro mais rápido (aquece devagar).
 */
export function pickFive(list, rnd = Math.random, n = 5) {
  const rank = { estudando: 0, quero: 1, '': 2, toco: 3 };
  const shuffled = list.map((r) => ({ r, k: (rank[r.data.stage || ''] ?? 2) + rnd() })).sort((a, b) => a.k - b.k).slice(0, n).map((x) => x.r);
  return shuffled.sort((a, b) => (Number(a.data.bpm) || 0) - (Number(b.data.bpm) || 0));
}

/** Link pra ouvir: o salvo, ou uma busca no YouTube com título + artista. */
export const listenUrl = (d) => d.link || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${d.title} ${d.artist || ''}`.trim())}`;

/** Contagem por estágio (pra barra de progresso do topo). */
export function progress(list) {
  const c = { quero: 0, estudando: 0, toco: 0, total: list.length };
  for (const r of list) if (c[r.data.stage] !== undefined) c[r.data.stage]++;
  return c;
}
