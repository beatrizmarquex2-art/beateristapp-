// Check-in ao ENTRAR no app (pedido da Bea): o dia conta pro "7 dias seguidos" e pro giro grátis sem precisar abrir o Álbum.
import { todayKey } from './util.js';
import * as store from './store.js';
import * as L from './figurinhas/album-logic.js';
import * as D from './figurinhas/dono.js';

/** Aplica o check-in de hoje no álbum guardado neste aparelho. Devolve true se a semana fechou (7 dias). */
export function aplicar(state, hoje) {
  let s = L.grantPack(state, L.checkinId(hoje)); let completou = false;
  const r = L.checkinSemana(s.sem, hoje);
  if (JSON.stringify(r.sem) !== JSON.stringify(s.sem)) { s = { ...s, sem: r.sem }; if (r.completou) { s = L.grantSemana(s, r.sem.ciclo); completou = true; } }
  return { state: s, completou };
}

export async function checkinAoEntrar() {
  try {
    const ID = D.albumId(); const atual = { ...L.emptyState(), ...D.albumDados() };
    const r = aplicar(atual, todayKey());
    if (r.state === atual || JSON.stringify(r.state) === JSON.stringify(atual)) return;
    store.upsert('figurinhas', ID, r.state);
    if (r.completou) {
      try { const M = await import('./figurinhas/mesa.js'); await M.vitoria('checkin', L.SEMANA_ESTRELAS); } catch { /* sem perfil: ganha só o pacote */ }
      try { const F = await import('./paulta/festa.js'); F.festa({ titulo: '7 dias seguidos!', sub: `você ganhou ${L.SEMANA_ESTRELAS} ★, um giro duplo épico (em Stars › roleta) e uma figurinha exclusiva da Bea, que chegou no baú!`, bau: true }); } catch { /* sem animação */ }
    }
  } catch { /* sem armazenamento: o Álbum ainda faz o check-in quando abrir */ }
}
