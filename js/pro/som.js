// Sons do PRO: os MESMOS do jogo (js/instruments.js): corda dedilhada calculada nota a nota (violão, guitarra limpa/distorcida, baixo) e bateria com
// gravações de verdade (acústica, eletrônica, cajón). Aqui só ficam o mapa das peças, o aquecimento e a reprodução da partitura com o relógio do áudio.
import { audio, scheduler, silence, click } from '../audio.js';
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
export function somCorda(kind, midi, vel = 0.85, t, mudo = false) {
  try { const c = audio(); pluck(midi, vel, t === undefined ? c.currentTime + 0.005 : t, kind, mudo); } catch { /* sem áudio */ }
}
/** Uma peça da bateria agora (ou em t). Mapa: hh chimbal, hf chimbal de pé, ho aberto, sn caixa, bd bumbo, tt/mt/ft toms e surdo, cr prato, rd condução. */
export function somBateria(modelo, p, vel = 0.78, t, dr = 0.3) {
  try { const c = audio(); const f = kitSom(modelo)[p]; if (f) f(t === undefined ? c.currentTime + 0.005 : t, vel, p === 'sn' && vel < 0.4 ? 0.3 : dr); } catch { /* sem áudio */ }
}
/** Deixa pronto o que o instrumento vai usar, pro 1º toque não engasgar (bateria: as gravações; cordas: as notas do trecho do braço que aparece na tela). */
export function aquece({ bat, modelo, kind, midis }) {
  try { if (bat) warmKit(modelo); else if (midis && midis.length) warmNotes(midis, TIM_BUF(kind)); } catch { /* sem áudio */ }
}

/** Toca uma lista de eventos { at (s), play(t) } com o relógio do áudio. `fim` = último instante em semicolcheias (o ciclo fecha no último compasso inteiro).
    clique = metrônomo junto (1 mais forte); repetir = em loop até parar. Devolve { stop }. */
export function tocaEventos({ eventos, fim, bpm, clique = false, repetir = false, onFim }) {
  const sx = 60 / bpm / 4; const comp = Math.max(1, Math.ceil(fim / 16)) * 16 * sx; const lista = [...eventos];
  if (clique) for (let b = 0; b * 4 * sx < comp - 1e-6; b++) lista.push({ at: b * 4 * sx, play: (t) => click(t, b % 4 === 0 ? 2 : 1, 0.5) });
  lista.sort((a, b) => a.at - b.at); const n = lista.length;
  return scheduler((i) => {
    if (!n) return null;
    if (repetir) return { at: Math.floor(i / n) * comp + lista[i % n].at, play: lista[i % n].play };
    if (i < n) return lista[i]; return i === n ? { at: comp + 0.1, play: () => {} } : null; // um evento final deixa a última nota soar antes de avisar que acabou
  }, { onEnd: onFim });
}
/** Toca a partitura de cordas/bateria inteira. cfg: { evs, bpm, bat, modelo, kind, cordas, clique, repetir, onFim } */
export function tocaTudo({ evs, bpm, bat, modelo, kind, cordas, clique, repetir, onFim }) {
  const sx = 60 / bpm / 4;
  // acorde: as cordas saem uma depois da outra. pra baixo (↓) da grave pra aguda; pra cima (↑) da aguda pra grave, um pouco mais suave; abafada (✕) é seca e curta
  const eventos = R.grupos(evs).map((g) => ({ at: g.ini * sx, play: (t) => {
    if (bat) { g.idx.forEach((k) => { const e = evs[k]; somBateria(modelo, e.p, velDe(e), t); }); return; }
    const sobe = g.idx.some((k) => evs[k].dir === 'c'); const ordem = [...g.idx].sort((a, b) => (sobe ? evs[a].c - evs[b].c : evs[b].c - evs[a].c));
    ordem.forEach((k, j) => { const e = evs[k]; somCorda(kind, R.midiDe(cordas, e.c, e.f), (sobe ? 0.7 : 0.85) * (e.mudo ? 0.8 : 1), t + j * 0.011, !!e.mudo); });
  } }));
  return tocaEventos({ eventos, fim: R.fim(evs), bpm, clique, repetir, onFim });
}
