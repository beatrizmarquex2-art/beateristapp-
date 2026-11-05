// Pacotes de figurinhas como recompensa dos jogos (área dos alunos). Cada pacote tem id próprio, então nunca entrega em dobro.
import * as store from '../store.js';
import * as L from './album-logic.js';

export const ID = 'figurinhas-album';
export const stateOf = () => ({ ...L.emptyState(), ...(store.get(ID)?.data || {}) });
/** Entrega os pacotes (ids novos). Devolve quantos eram de fato novos. */
export async function grantPacks(ids) {
  let s = stateOf(); let n = 0;
  for (const id of ids) { const t = L.grantPack(s, id); if (t !== s) { s = t; n++; } }
  if (n) await store.upsert('figurinhas', ID, s);
  return n;
}
export const pending = () => L.pendingPacks(stateOf()).length;
export const pastedCount = () => Object.keys(stateOf().pasted || {}).length;
