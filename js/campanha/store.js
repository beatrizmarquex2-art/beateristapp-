// Progresso do Modo Aventura (um registro só, "setting-aventura"): por jogador e por jogo, sem misturar nada entre jogos.
// O jogador é o perfil ativo da área de jogos (Kids); sem perfil, vale "local" (o aparelho). Só grava quando uma missão é concluída ou tentada.
import * as store from '../store.js';
import * as P from '../kids/progress.js';
import { blankGame } from './engine.js';

export const KEY = 'setting-aventura';
const raw = () => ({ v: 1, players: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
export const playerId = () => { try { const a = P.active(); return a ? a.id : 'local'; } catch { return 'local'; } };
export const gameOf = (pid, gameId) => ({ ...blankGame(), ...((raw().players[pid] || {})[gameId] || {}) });
export async function saveGame(pid, gameId, g) {
  const r = raw(); const mine = r.players[pid] || {};
  await store.upsert('setting', KEY, { v: 1, players: { ...r.players, [pid]: { ...mine, [gameId]: g } } });
}
