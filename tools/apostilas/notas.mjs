// Notação das apostilas: usa o MESMO motor de escrita do Beaterista PRO (bateria em pauta, teclado em pauta), pra apostila e editor nunca discordarem.
import { desenhoDe } from '../../js/pro/exportar.js';
import { OPC } from '../../js/pro/ritmo.js';
OPC.pesNotados = true; // nas apostilas, a voz dos pés tem figura própria (ver bateria() em ritmo.js)

/** Groove de bateria a partir de linhas de texto (1 caractere = 1 semicolcheia, 16 por compasso). 'x' = bate; 'X' = acento; 'o' = fantasma; '.' ou '-' = nada. */
export function groove(linhas, { compassos = 1, passo = 2 } = {}) {
  const evs = [];
  for (let c = 0; c < compassos; c++) for (const [p, txt] of Object.entries(linhas)) {
    const s = txt.replace(/\s+/g, ''); for (let i = 0; i < 16; i++) { const ch = s[(c * 16 + i) % s.length]; if (!ch || ch === '.' || ch === '-') continue; evs.push({ p, ini: c * 16 + i, d: Math.min(passo, 16 - i), mao: '', acc: ch === 'X', fan: ch === 'o' }); }
  }
  return evs;
}
/** Auditoria (AUDIT=1): confere cada partitura de bateria antes de desenhar. Duração, sobreposição, compasso fechado, vozes. */
const MAOS = new Set(['hh', 'ho', 'sn', 'tt', 'mt', 'ft', 'cr', 'rd']); const PES = new Set(['bd', 'hf']);
export function auditaBateria(evs) {
  const erros = []; const q = (m) => erros.push(m);
  const fim = Math.max(...evs.map((e) => e.ini + e.d), 0); const compassos = Math.max(1, Math.ceil(fim / 16));
  for (const e of evs) { if (!Number.isInteger(e.ini) || !Number.isInteger(e.d) || e.d < 1) q(`evento inválido ${JSON.stringify(e)}`); if (e.ini < 0) q(`ini<0 ${e.p}`); if (Math.floor(e.ini / 16) !== Math.floor((e.ini + e.d - 1) / 16)) q(`${e.p}@${e.ini} d${e.d} atravessa a barra`); }
  for (const [nome, S] of [['mãos', MAOS], ['pés', PES]]) {
    const porIni = new Map(); for (const e of evs.filter((x) => S.has(x.p))) { if (!porIni.has(e.ini)) porIni.set(e.ini, []); porIni.get(e.ini).push(e); }
    const t = [...porIni.keys()].sort((a, b) => a - b);
    t.forEach((ini, i) => { const dMin = Math.min(...porIni.get(ini).map((e) => e.d)); const dMax = Math.max(...porIni.get(ini).map((e) => e.d)); if (dMin !== dMax) q(`${nome}: durações diferentes no mesmo ataque @${ini} (${porIni.get(ini).map((e) => e.p + ':' + e.d).join(',')})`); const prox = t[i + 1]; if (prox !== undefined && ini + dMax > prox) q(`${nome}: nota @${ini} (d${dMax}) invade o ataque seguinte @${prox}`); });
  }
  return { erros, compassos };
}
export const AUDITORIA = [];
export const svgBateria = (evs, largura = 640, { bpm = 80 } = {}) => { if (process.env.AUDIT) { const a = auditaBateria(evs); const onde = (new Error().stack.split('\n').slice(2, 6).map((l) => (/(\w+)\.mjs:(\d+)/.exec(l) || [])[0]).filter(Boolean)).join(' < '); AUDITORIA.push({ onde, n: evs.length, compassos: a.compassos, erros: a.erros, evs }); } return svgBateriaBase(evs, largura, { bpm }); };
const svgBateriaBase = (evs, largura = 640, { bpm = 80 } = {}) => desenhoDe({ instrumento: 'bateria', dados: { evs, bpm, escrita: 'pauta', kit: 'completo', modelo: 'acustica' } })(largura).svg;
/** Teclado em pauta: lista de [midi|[midi,midi...], duração em semicolcheias]. */
export function melodia(lista) { const evs = []; let t = 0; for (const [m, d] of lista) { (Array.isArray(m) ? m : [m]).forEach((x) => { if (x !== null) evs.push({ m: x, ini: t, d }); }); t += d; } return evs; }
export const svgTeclado = (evs, largura = 640, { clave = 'auto', escrita = 'pauta' } = {}) => desenhoDe({ instrumento: 'teclas', dados: { evs, escrita, clave } })(largura).svg;
