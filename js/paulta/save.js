// pauLta: o progresso fica no perfil do jogador (o mesmo do Kids), no registro "setting-paulta" — sincroniza com a conta e sobrevive entre sessões.
import * as store from '../store.js';
import * as P from '../kids/progress.js';
import * as RK from '../ranking.js';
import * as S from './score.js';

export const KEY = 'setting-paulta';
const raw = () => (store.get(KEY) ? store.get(KEY).data : {}) || {};
export const getP = (pid) => S.norm((raw().players || {})[pid]);
export async function commit(pid, fn) {
  const r = raw(); const cur = S.norm((r.players || {})[pid]); const next = fn(cur);
  await store.upsert('setting', KEY, { players: { ...(r.players || {}), [pid]: next } });
  return next;
}
/** Título do jogador (ou ''), pra mostrar junto do nome em outros jogos. */
export const titleOf = (pid) => S.titleName(getP(pid));
export const label = (profile) => { const t = profile ? titleOf(profile.id) : ''; return t ? `${profile.name} · ${t}` : (profile ? profile.name : ''); };
/** Migra o jogo antigo uma única vez (só abre as primeiras fases da bateria). */
export async function ensure(pid) {
  const p = getP(pid); if (p.mig && p.mig.done) return p;
  const lv = P.progOf(pid).lv; let passed = 0; for (let l = 0; l <= 10; l++) if (((lv[`pauta:${l}`] || {}).s || 0) >= 1) passed++;
  return commit(pid, (c) => S.migrate(c, passed));
}
export const BOARD = 'paulta|pontos';
/** Manda os pontos pro ranking público só se a pessoa autorizou (apelido + ligado). Falha em silêncio. */
export async function publish(profile) {
  const p = getP(profile.id); if (!p.rank.on || !p.rank.nick) return false;
  return RK.add(BOARD, p.rank.nick, S.points(p), null, S.rankCode(p));
}

/** Texto e % do cartão do jogo na tela do Kids. */
export const meta = (pid) => { const p = getP(pid); return p.started ? `${S.doneCount(p)} fases · ${S.points(p)} pts` : 'novo'; };
export const pct = (pid) => { const p = getP(pid); const total = Object.values(S.COUNT).reduce((a, b) => a + b, 0); return Math.round((S.doneCount(p) / total) * 100); };
