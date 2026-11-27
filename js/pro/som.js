// Sons do PRO: os MESMOS do jogo (js/instruments.js): corda dedilhada calculada nota a nota (violão, guitarra limpa/distorcida, baixo) e bateria com
// gravações de verdade (acústica, eletrônica, cajón). Aqui só ficam o mapa das peças, o aquecimento e a reprodução da partitura com o relógio do áudio.
import { audio, scheduler, silence } from '../audio.js';
import { pluck, kitSom, warmKit, warmNotes, wake, MODELOS_BATERIA } from '../instruments.js';
import * as R from './ritmo.js';

export { MODELOS_BATERIA, silence };
/** Timbres de corda por instrumento: [id do pluck, nome]. */
export const TIMBRES = { violao: [['acoustic', 'violão']], guitarra: [['clean', 'guitarra limpa'], ['rock', 'guitarra distorcida']], baixo: [['clean', 'baixo']] };
export const timbrePadrao = (inst) => (TIMBRES[inst] || TIMBRES.violao)[0][0];
const TIM_BUF = (kind) => (kind === 'acoustic' ? ['a'] : ['e']);
export const velDe = (e) => (e.fan ? 0.32 : e.acc ? 1.05 : 0.78);

/** Destrava o áudio (iPhone/iPad/Safari só deixam dentro de um toque). Chamar no 1º toque. */
export const acorda = () => { try { wake(); audio(); } catch { /* sem áudio */ } };
/** Uma corda agora (ou em t). */
export function somCorda(kind, midi, vel = 0.85, t) {
  try { const c = audio(); pluck(midi, vel, t === undefined ? c.currentTime + 0.005 : t, kind); } catch { /* sem áudio */ }
}
/** Uma peça da bateria agora (ou em t). Mapa: hh chimbal, hf chimbal de pé, ho aberto, sn caixa, bd bumbo, tt/mt/ft toms e surdo, cr prato, rd condução. */
export function somBateria(modelo, p, vel = 0.78, t, dr = 0.3) {
  try { const c = audio(); const f = kitSom(modelo)[p]; if (f) f(t === undefined ? c.currentTime + 0.005 : t, vel, p === 'sn' && vel < 0.4 ? 0.3 : dr); } catch { /* sem áudio */ }
}
/** Deixa pronto o que o instrumento vai usar, pro 1º toque não engasgar (bateria: as gravações; cordas: as notas do trecho do braço que aparece na tela). */
export function aquece({ bat, modelo, kind, midis }) {
  try { if (bat) warmKit(modelo); else if (midis && midis.length) warmNotes(midis, TIM_BUF(kind)); } catch { /* sem áudio */ }
}

/** Toca a partitura inteira com o relógio do áudio (nada de setTimeout: não atrasa nem acumula). Devolve { stop }.
    ctxCfg: { evs, bpm, bat, modelo, kind, cordas, onFim } */
export function tocaTudo({ evs, bpm, bat, modelo, kind, cordas, onFim }) {
  const gs = R.grupos(evs); const sx = 60 / bpm / 4; const fimT = R.fim(evs) * sx;
  const h = scheduler((i) => {
    if (i < gs.length) { const g = gs[i]; return { at: g.ini * sx, play: (t) => g.idx.forEach((k) => { const e = evs[k]; if (bat) somBateria(modelo, e.p, velDe(e), t); else somCorda(kind, R.midiDe(cordas, e.c, e.f), velDe(e), t); }) }; }
    return i === gs.length ? { at: fimT + 0.25, play: () => {} } : null; // um evento final deixa a última nota soar antes de avisar que acabou
  }, { onEnd: onFim });
  return h;
}
