// ROLETA MALUCA (regra da Bea, 27/nov/2026): cada missão aprovada (print) vale 1 giro. A pessoa gira até 3 vezes por dia e cai em:
// giro épico · 30 ★ · prêmio surpresa (planner, folha de colorir ou wallpaper) · figurinha exclusiva · +3 giros grátis.
// Estado em `state.rm` do álbum: { t: giros guardados, ids: resgates já contados, dia, n: giros dados no dia, g: total de giros (ids únicos), sur: ['planner:2', ...] }. Tudo puro.
import { grantPack } from './album-logic.js';

export const LIMITE_DIA = 3;
export const ESTRELAS = 30;
export const GIROS_BONUS = 3;
export const PREMIOS = [['epico', 12], ['estrelas', 30], ['surpresa', 30], ['exclusiva', 10], ['giros', 18]]; // épico e exclusiva mais raros (pedido da Bea)
export const NOME = { epico: 'giro épico', estrelas: `${ESTRELAS} estrelas`, surpresa: 'prêmio surpresa', exclusiva: 'figurinha exclusiva', giros: `+${GIROS_BONUS} giros grátis` };
export const rmDe = (state) => ({ t: 0, ids: [], dia: '', n: 0, g: 0, sur: [], ...((state && state.rm) || {}) });
export const restantesHoje = (rm, hoje) => (rm.dia === hoje ? Math.max(0, LIMITE_DIA - (rm.n | 0)) : LIMITE_DIA);
export const PRINTS_DIA = 3; // máximo de prints por dia; não acumula (amanhã volta a ser 3)
export const printsHoje = (rm, hoje) => (rm.pd && rm.pd.dia === hoje ? rm.pd.n | 0 : 0);
export const podeMandarPrint = (rm, hoje) => printsHoje(rm, hoje) < PRINTS_DIA;
/** Conta 1 print enviado hoje. */
export const contarPrint = (state, hoje) => { const rm = rmDe(state); return { ...state, rm: { ...rm, pd: { dia: hoje, n: printsHoje(rm, hoje) + 1 } } }; };
/** Giros VENCEM no fim do dia: o saldo só vale no dia em que foi ganho (`td`). Sem `td` (saldo antigo) vale. */
export const giros = (rm, hoje) => (rm.td == null || !hoje || rm.td === hoje ? rm.t | 0 : 0);
export const podeGirar = (rm, hoje) => giros(rm, hoje) > 0 && restantesHoje(rm, hoje) > 0;

/** Missão aprovada vira 1 giro (uma vez só por resgate). Devolve o mesmo `state` se já tinha contado. */
export function ganharGiro(state, idResgate, hoje) {
  const rm = rmDe(state); if (rm.ids.includes(idResgate)) return state;
  return { ...state, rm: { ...rm, t: giros(rm, hoje) + 1, td: hoje == null ? rm.td : hoje, ids: [...rm.ids, idResgate] } };
}
const sorteio = (rng, pesos) => { const total = pesos.reduce((a, [, w]) => a + w, 0); let x = rng() * total; for (const [k, w] of pesos) { if (x < w) return k; x -= w; } return pesos[0][0]; };

/** Gira uma vez. `surpresas` = [{ chave: 'planner:2', ... }] (tudo que pode sair de surpresa). Devolve { state, premio: { tipo, ... } } ou null se não pode girar. */
export function girar(state, hoje, rng = Math.random, surpresas = []) {
  const rm = rmDe(state); if (!podeGirar(rm, hoje)) return null;
  const g = (rm.g | 0) + 1; const dia = rm.dia === hoje ? rm.dia : hoje; const n = rm.dia === hoje ? (rm.n | 0) + 1 : 1;
  let novo = { ...rm, t: giros(rm, hoje) - 1, td: hoje, g, dia, n }; let st = state; let premio;
  let tipo = sorteio(rng, PREMIOS);
  if (tipo === 'surpresa') {
    const livres = surpresas.filter((s) => !rm.sur.includes(s.chave));
    if (!livres.length) tipo = 'estrelas'; // já tem todos os prêmios surpresa: vira estrelas
    else { const s = livres[Math.floor(rng() * livres.length)]; novo = { ...novo, sur: [...rm.sur, s.chave] }; premio = { tipo, item: s }; }
  }
  if (tipo === 'epico') { st = grantPack(st, `epico:rm${g}`); premio = { tipo, pacote: `epico:rm${g}` }; }
  if (tipo === 'exclusiva') { st = grantPack(st, `egg:rm${g}`); premio = { tipo, pacote: `egg:rm${g}` }; } // `egg:` = 1 exclusiva (Beaterista e Paul)
  if (tipo === 'estrelas') premio = { tipo, estrelas: ESTRELAS };
  if (tipo === 'giros') { novo = { ...novo, t: novo.t + GIROS_BONUS }; premio = { tipo, giros: GIROS_BONUS }; }
  return { state: { ...st, rm: novo }, premio };
}
