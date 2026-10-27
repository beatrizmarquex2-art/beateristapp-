// Jogadores, estrelas, % de acerto e histórico da área Kids. Fica na conta (registro "setting-kids2"), por jogador.
// Não vai pra ficha do aluno: é só da criança que está jogando. `reduceResult` é puro e testável.
import * as store from '../store.js';

export const KEY = 'setting-kids2';
const raw = () => ({ profiles: [], active: null, prog: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (patch) => store.upsert('setting', KEY, patch);
const blank = () => ({ lv: {}, st: {}, miss: {}, album: [], log: [] });

export const profiles = () => raw().profiles;
export const active = () => { const r = raw(); return r.profiles.find((p) => p.id === r.active) || r.profiles[0] || null; };
export async function addProfile(name, age) {
  const r = raw(); const id = `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
  await save({ profiles: [...r.profiles, { id, name: String(name).trim().slice(0, 24) || 'Aluno', age }], active: id }); return id;
}
export const setActive = (id) => save({ active: id });
export async function removeProfile(id) {
  const r = raw(); const prog = { ...r.prog }; delete prog[id];
  await save({ profiles: r.profiles.filter((p) => p.id !== id), prog, active: r.active === id ? null : r.active });
}
export const progOf = (id) => ({ ...blank(), ...(raw().prog[id] || {}) });
const lvKey = (game, level) => `${game}:${level}`;
export const starsAt = (pid, game, level) => (progOf(pid).lv[lvKey(game, level)] || {}).s || 0;
export const unlocked = (pid, game, level) => level === 0 || starsAt(pid, game, level - 1) >= 1;
export const totalStars = (pid) => Object.values(progOf(pid).lv).reduce((a, x) => a + (x.s || 0), 0);

/** Resumo de um jogo: estrelas, fase mais alta liberada e % de acerto geral. */
export function summary(pid, game, maxLevel = 10) {
  const p = progOf(pid); let stars = 0; let top = 0;
  for (let l = 0; l <= maxLevel; l++) { const s = (p.lv[lvKey(game, l)] || {}).s || 0; stars += s; if (s >= 1) top = Math.min(maxLevel, l + 1); }
  const st = p.st[game] || { r: 0, w: 0 }; const n = st.r + st.w;
  return { stars, maxStars: (maxLevel + 1) * 3, top, pct: n ? Math.round((st.r / n) * 100) : null, answered: n };
}

/** Aplica um resultado numa cópia do progresso. Devolve { p, gain } (gain = estrelas novas acima do melhor anterior). */
export function reduceResult(p0, { game, level, right, total, stars, misses = [], mode = '', now = Date.now() }) {
  const p = { ...blank(), ...p0, lv: { ...p0.lv }, st: { ...p0.st }, miss: { ...p0.miss }, log: [...(p0.log || [])] };
  const k = lvKey(game, level); const old = p.lv[k] || { s: 0, p: 0, n: 0 };
  const pct = total ? Math.round((right / total) * 100) : 0;
  p.lv[k] = { s: Math.max(old.s, stars), p: Math.max(old.p, pct), n: old.n + 1 };
  const st = p.st[game] || { r: 0, w: 0 }; p.st[game] = { r: st.r + right, w: st.w + (total - right) };
  for (const m of misses) p.miss[`${game}:${m}`] = (p.miss[`${game}:${m}`] || 0) + 1;
  p.log.push({ t: now, game, level, right, total, s: stars, mode, miss: misses.slice(0, 12) });
  if (p.log.length > 200) p.log = p.log.slice(-200);
  return { p, gain: Math.max(0, stars - old.s) };
}
export async function record(pid, result) {
  const r = raw(); const { p, gain } = reduceResult(progOf(pid), result);
  await save({ prog: { ...r.prog, [pid]: p } }); return { gain, total: totalStars(pid) };
}
/** Guarda um pedaço do progresso (ex.: figurinhas). */
export async function patch(pid, part) { const r = raw(); await save({ prog: { ...r.prog, [pid]: { ...progOf(pid), ...part } } }); }
