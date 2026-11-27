// Ferramentas de teoria dos editores do PRO: escalas (pra destacar no braço e no teclado), transpor, acordes do violão em eventos e escalas do xilofone.
import * as R from './ritmo.js';
import { ACORDES, PADRAO, acharAcorde, RAIZES } from '../acordes.js';

export { ACORDES, PADRAO, acharAcorde, RAIZES };
/** Escalas pra destacar: intervalos a partir da tônica. */
export const ESCALAS = [['todas', 'todas as notas', null], ['maior', 'maior', [0, 2, 4, 5, 7, 9, 11]], ['menor', 'menor natural', [0, 2, 3, 5, 7, 8, 10]], ['pentamaior', 'pentatônica maior', [0, 2, 4, 7, 9]], ['pentamenor', 'pentatônica menor', [0, 3, 5, 7, 10]], ['blues', 'blues', [0, 3, 5, 6, 7, 10]]];
export const nomeEscala = (t) => (ESCALAS.find((e) => e[0] === t) || ESCALAS[0])[1];
/** A nota (MIDI) está na escala `tipo` de tônica `tonica` (0 = dó … 11 = si)? 'todas' = sempre. */
export function naEscala(m, tonica, tipo) {
  const e = ESCALAS.find((x) => x[0] === tipo); if (!e || !e[2]) return true; return e[2].includes((((m - tonica) % 12) + 12) % 12);
}
export const ehTonica = (m, tonica) => (((m - tonica) % 12) + 12) % 12 === 0;

/** Transpõe `d` semitons. Cordas: tenta a mesma corda (casa + d); se não couber, acha outra corda; se não houver, a nota sai. Devolve { evs, perdeu }. */
export function transpoeCordas(evs, cordas, d) {
  let perdeu = 0; const out = [];
  evs.forEach((e) => {
    const m = R.midiDe(cordas, e.c, e.f) + d; const f = e.f + d;
    if (f >= 0 && f <= R.MAX_CASA) { out.push({ ...e, f }); return; }
    const pos = R.posicaoDe(cordas, m, R.MAX_CASA); if (pos) out.push({ ...e, c: pos.c, f: pos.f }); else perdeu++;
  });
  // duas notas que caíram na mesma corda e instante: fica a primeira
  const vistos = new Set(); const sem = out.filter((e) => { const k = `${e.ini}:${e.c}`; if (vistos.has(k)) { perdeu++; return false; } vistos.add(k); return true; });
  return { evs: sem, perdeu };
}
/** Transpõe notas de teclado (m, ini, d): sobe/desce `d` semitons, sem passar do piano (21 a 108). */
export function transpoeTeclas(evs, d) {
  let perdeu = 0; const out = []; evs.forEach((e) => { const m = e.m + d; if (m < 21 || m > 108) perdeu++; else out.push({ ...e, m }); }); return { evs: out, perdeu };
}
/** Nome curto da cifra: "Dó", "Lám". */
export const cifraDe = (ac) => `${ac.nome}${ac.tipo === 'menor' ? 'm' : ''}`;
/** Um acorde do violão vira eventos de tablatura no instante `ini` (corda grave do acorde = corda de baixo da lista de cordas). */
export function acordeEmEventos(ac, ini, d, nCordas = 6) {
  const out = []; ac.casas.forEach((casa, j) => { if (casa < 0) return; const c = 5 - j; if (c >= nCordas) return; out.push({ c, f: casa, ini, d, ...(out.length === 0 ? { cif: cifraDe(ac) } : {}) }); });
  return out;
}
/** Escalas do xilofone do jogo (js/views/xilofone.js): as notas (MIDI) de cada barra. */
export const BARRAS = [['maior', 'dó maior', [60, 62, 64, 65, 67, 69, 71, 72]], ['penta', 'pentatônica', [60, 62, 64, 67, 69, 72, 74, 76, 79, 81]], ['menor', 'lá menor', [57, 59, 60, 62, 64, 65, 67, 69]], ['pentamenor', 'penta menor', [57, 60, 62, 64, 67, 69, 72, 74, 76, 79]], ['cromatica', 'cromática', Array.from({ length: 13 }, (_, i) => 60 + i)]];
