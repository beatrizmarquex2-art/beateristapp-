// pauLta: progresso, pontos, títulos e desbloqueios (puro, sem tela). Os pontos SEMPRE são recalculados do melhor desempenho de cada fase,
// então repetir fase fácil não acumula nada.
export const MAIN = ['drum', 'sol', 'fa'];
export const COUNT = { drum: 18, sol: 15, fa: 15, duel: 6 };
export const TITLES = [
  { id: 'aprendiz', name: 'Aprendiz da pauLta', rule: 'começar o jogo' },
  { id: 'explorador', name: 'Explorador da pauLta', rule: 'concluir 5 fases' },
  { id: 'leitor', name: 'Leitor Musical', rule: 'concluir um dos 3 mundos principais' },
  { id: 'especialista', name: 'Especialista da pauLta', rule: 'concluir 2 mundos principais' },
  { id: 'mestre', name: 'Mestre da pauLta', rule: 'concluir os 3 mundos e o desafio final do Duelo' },
];
export const blank = () => ({ started: 0, ph: {}, done: {}, wdone: {}, titles: {}, miss: {}, log: [], mig: {}, rank: { on: false, nick: '' }, lessons: {} });
export const norm = (p) => ({ ...blank(), ...(p || {}), rank: { ...blank().rank, ...((p || {}).rank || {}) } });
export const phKey = (w, n, m) => `${w}:${n}:${m}`;
export const starsFor = (right, total) => { const p = total ? right / total : 0; return p >= 1 ? 3 : p >= 0.8 ? 2 : p >= 0.6 ? 1 : 0; };

export const doneCount = (p) => Object.keys(p.done).length;
export const worldDone = (p, w) => Array.from({ length: COUNT[w] }, (_, i) => `${w}:${i + 1}`).every((k) => p.done[k]);
export const worldProgress = (p, w) => Array.from({ length: COUNT[w] }, (_, i) => p.done[`${w}:${i + 1}`]).filter(Boolean).length;
export const mainDone = (p) => MAIN.filter((w) => worldDone(p, w)).length;
export const duelUnlocked = (p) => worldDone(p, 'sol') && worldDone(p, 'fa'); // não depende da bateria
/** A fase está aberta? 1ª fase sempre; depois só se a anterior foi concluída (em qualquer formato). `mig.open` = fases liberadas pela migração do jogo antigo. */
export function unlocked(p, w, n) {
  if (w === 'duel' && !duelUnlocked(p)) return false;
  if (n <= 1) return true;
  return !!p.done[`${w}:${n - 1}`] || n <= ((p.mig && p.mig.open && p.mig.open[w]) || 1);
}
export const earnedTitles = (p) => ({
  aprendiz: !!p.started, explorador: doneCount(p) >= 5, leitor: mainDone(p) >= 1, especialista: mainDone(p) >= 2,
  mestre: mainDone(p) >= 3 && !!p.done['duel:6'],
});
export function currentTitle(p) { const e = earnedTitles(p); let t = null; for (const x of TITLES) if (e[x.id]) t = x; return t; }
export const titleName = (p) => { const t = currentTitle(p); return t ? t.name : ''; };

/** Pontos: 10 por acerto (melhor tentativa de cada fase/formato), 50 por fase concluída (1×), 30 por sequência perfeita (1× por fase/formato),
 *  100 por mundo concluído (1×) e 200 pelo Duelo concluído (1×). */
export function points(p) {
  let pts = 0;
  for (const v of Object.values(p.ph)) { pts += 10 * (v.c || 0); if (v.perf) pts += 30; }
  pts += 50 * doneCount(p);
  for (const w of Object.keys(COUNT)) if (p.wdone[w]) pts += w === 'duel' ? 200 : 100;
  return pts;
}
export const rankCode = (p) => { const i = TITLES.findIndex((t) => t === currentTitle(p)); return `${i + 1}${mainDone(p)}`; }; // 2 caracteres (a coluna do ranking aceita 3)
export const decodeRank = (g) => { const m = /^(\d)(\d)$/.exec(String(g || '')); return m ? { title: (TITLES[Number(m[1]) - 1] || {}).name || '', worlds: Number(m[2]) } : { title: '', worlds: 0 }; };

/** Marca que a pessoa começou (Aprendiz). */
export function start(p0, now = Date.now()) { const p = norm(p0); if (!p.started) p.started = now; return stamp(p, now).p; }
function stamp(p, now) {
  const e = earnedTitles(p); const gained = [];
  for (const t of TITLES) if (e[t.id] && !p.titles[t.id]) { p.titles = { ...p.titles, [t.id]: now }; gained.push(t); }
  return { p, gained };
}
/** Aplica o resultado de uma fase. Devolve { p, events:[…], gained:[títulos], pts, ptsGain }. */
export function applyRun(p0, { world, n, mode, right, total, misses = [], now = Date.now(), need = 0.6, sudden = false, noScore = false }) {
  let p = norm(p0); p = { ...p, ph: { ...p.ph }, done: { ...p.done }, wdone: { ...p.wdone }, miss: { ...p.miss }, log: [...p.log] };
  const before = points(p); const events = []; const key = phKey(world, n, mode);
  if (!p.started) p.started = now;
  const perfect = right === total; const passed = total > 0 && (sudden ? perfect : right / total >= need);
  const old = p.ph[key] || { c: 0, s: 0, n: 0, ok: false, perf: false };
  p.ph[key] = { c: Math.max(old.c, right), t: total, s: Math.max(old.s, passed ? Math.max(1, starsFor(right, total)) : starsFor(right, total)), n: old.n + 1, ok: old.ok || passed, perf: old.perf || (perfect && total > 0), at: now };
  if (passed && !p.done[`${world}:${n}`]) { p.done[`${world}:${n}`] = now; events.push({ type: 'phase', world, n }); }
  if (!p.wdone[world] && worldDone(p, world)) { p.wdone[world] = now; events.push({ type: 'world', world }); if (world === 'duel') events.push({ type: 'duel' }); }
  for (const m of misses) p.miss[m] = (p.miss[m] || 0) + 1;
  p.log.push({ t: now, w: world, n, m: mode, r: right, o: total }); if (p.log.length > 120) p.log = p.log.slice(-120);
  const { p: p2, gained } = stamp(p, now);
  return { p: p2, events, gained, passed, perfect, stars: p2.ph[key].s, pts: points(p2), ptsGain: points(p2) - before };
}
/** Acertar um item no reforço alivia a dificuldade registrada. */
export function relief(p0, tags) { const p = norm(p0); const miss = { ...p.miss }; for (const t of tags) if (miss[t]) { miss[t] -= 1; if (miss[t] <= 0) delete miss[t]; } return { ...p, miss }; }
/** Dificuldades mais frequentes, agrupadas pra mostrar na tela. */
export function difficulties(p) {
  const rows = Object.entries(p.miss).map(([tag, c]) => ({ tag, c })).sort((a, b) => b.c - a.c);
  const g = (f) => rows.filter((r) => f(r.tag));
  return {
    all: rows,
    pecas: g((t) => /^peca:/.test(t)), combos: g((t) => /^combo:/.test(t)), notas: g((t) => /^nota:/.test(t)), claves: g((t) => t === 'clave'),
    oitavas: g((t) => t === 'oitava'), figuras: g((t) => /^fig:/.test(t)), articulacoes: g((t) => /^art:/.test(t)),
  };
}
/** Migra o jogo antigo ("Onde mora na pauta?"): só ABRE as primeiras fases da bateria. Não dá estrelas, pontos nem títulos. */
export function migrate(p0, oldPassed) {
  const p = norm(p0); if (p.mig && p.mig.done) return p;
  const open = oldPassed >= 2 ? Math.min(4, oldPassed + 1) : 1;
  return { ...p, mig: { done: true, from: oldPassed, open: { drum: open } } };
}
