// Notação das apostilas: usa o MESMO motor de escrita do Beaterista PRO (bateria em pauta, teclado em pauta), pra apostila e editor nunca discordarem.
import { desenhoDe } from '../../js/pro/exportar.js';

/** Groove de bateria a partir de linhas de texto (1 caractere = 1 semicolcheia, 16 por compasso). 'x' = bate; 'X' = acento; 'o' = fantasma; '.' ou '-' = nada. */
export function groove(linhas, { compassos = 1, passo = 2 } = {}) {
  const evs = [];
  for (let c = 0; c < compassos; c++) for (const [p, txt] of Object.entries(linhas)) {
    const s = txt.replace(/\s+/g, ''); for (let i = 0; i < 16; i++) { const ch = s[(c * 16 + i) % s.length]; if (!ch || ch === '.' || ch === '-') continue; evs.push({ p, ini: c * 16 + i, d: Math.min(passo, 16 - i), mao: '', acc: ch === 'X', fan: ch === 'o' }); }
  }
  return evs;
}
export const svgBateria = (evs, largura = 640, { bpm = 80 } = {}) => desenhoDe({ instrumento: 'bateria', dados: { evs, bpm, escrita: 'pauta', kit: 'completo', modelo: 'acustica' } })(largura).svg;
/** Teclado em pauta: lista de [midi|[midi,midi...], duração em semicolcheias]. */
export function melodia(lista) { const evs = []; let t = 0; for (const [m, d] of lista) { (Array.isArray(m) ? m : [m]).forEach((x) => { if (x !== null) evs.push({ m: x, ini: t, d }); }); t += d; } return evs; }
export const svgTeclado = (evs, largura = 640, { clave = 'auto', escrita = 'pauta' } = {}) => desenhoDe({ instrumento: 'teclas', dados: { evs, escrita, clave } })(largura).svg;
