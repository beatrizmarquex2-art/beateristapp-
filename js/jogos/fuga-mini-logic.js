// Jogos de toque da Fuga do Estúdio (lote 1): Genius, caminho 3×3 e memória de notas. Lógica pura (sem tela), testada em tests/fuga-mini.test.mjs.
import { montesDe, maxColchetes } from './figurix-logic.js';
import { FIGS, beatsLabel } from '../kids/figs.js';
// O conteúdo mistura 3 áreas: ritmo (figuras, bateria, rudimentos), teoria (notas, cifras, claves, intervalos) e cordas (instrumentos).
// Estrelas pelos ERROS (3 / 2 / 1, nunca menos de 1): o jogo sempre termina, mas quem erra menos ganha mais.

/** ★ pelos erros: até `a` erros = 3 ★, até `b` = 2 ★, mais que isso = 1 ★. */
export const estrelasPorErros = (erros, a, b) => (erros <= a ? 3 : erros <= b ? 2 : 1);
export const estrelasGenius = (erros) => estrelasPorErros(erros, 0, 2);
export const estrelasCaminho = (erros) => estrelasPorErros(erros, 0, 2);
export const estrelasMemoria = (erros, pares) => estrelasPorErros(erros, Math.max(1, pares - 2), pares * 2);

/* ---------- Genius ---------- */
/** Botões do Genius: `notas` (piano, pentatônica) ou `bateria` (som de cada peça). A cor nunca é verde (a Bea não gostou do led verde). */
export const PADS_GENIUS = {
  notas: [{ nome: 'Dó', midi: 60, cor: '#ff3b5c' }, { nome: 'Mi', midi: 64, cor: '#ffd23f' }, { nome: 'Sol', midi: 67, cor: '#4fd8ff' }, { nome: 'Lá', midi: 69, cor: '#b18cff' }, { nome: 'Ré', midi: 62, cor: '#ff9f43' }, { nome: 'Dó agudo', midi: 72, cor: '#ff7ad9' }],
  bateria: [{ nome: 'bumbo', som: 'kick', cor: '#ff3b5c' }, { nome: 'caixa', som: 'snare', cor: '#ffd23f' }, { nome: 'chimbal', som: 'hihat', cor: '#4fd8ff' }, { nome: 'prato', som: 'cymbal', cor: '#b18cff' }, { nome: 'tom', som: 'tom', cor: '#ff9f43' }, { nome: 'surdo', som: 'surdo', cor: '#ff7ad9' }],
};
/** Os botões usados: `n` primeiros da área (4 ou 6). */
export const padsDe = (area, n) => (PADS_GENIUS[area] || PADS_GENIUS.notas).slice(0, n);
/** A sequência inteira (a rodada r toca os r primeiros): `len` botões sorteados, sem repetir o mesmo 3 vezes seguidas. */
export function sequenciaGenius(len, pads, rnd = Math.random) {
  const seq = [];
  for (let i = 0; i < len; i++) { let v = Math.floor(rnd() * pads); while (i >= 2 && seq[i - 1] === v && seq[i - 2] === v) v = Math.floor(rnd() * pads); seq.push(v); }
  return seq;
}
/** O toque `v` na posição `i` da rodada está certo? (devolve 'ok' | 'fim' (completou a rodada) | 'erro') */
export const confere = (seq, i, v) => (seq[i] !== v ? 'erro' : i + 1 >= seq.length ? 'fim' : 'ok');

/* ---------- caminho 3×3 ---------- */
/** As 9 casas da grade: a escala de dó maior (cada casa toca uma nota). */
export const NOTAS_3X3 = [['Dó', 60], ['Ré', 62], ['Mi', 64], ['Fá', 65], ['Sol', 67], ['Lá', 69], ['Si', 71], ['Dó agudo', 72], ['Ré agudo', 74]];
const vizinhas = (c) => { const x = c % 3; const y = Math.floor(c / 3); return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => a >= 0 && a < 3 && b >= 0 && b < 3).map(([a, b]) => b * 3 + a); };
export const saoVizinhas = (a, b) => vizinhas(a).includes(b);
/** Um caminho de `len` casas (0 a 8) andando só pra cima/baixo/esquerda/direita, sem passar duas vezes na mesma casa. */
export function caminho3x3(len, rnd = Math.random) {
  const L = Math.max(2, Math.min(9, len));
  const tenta = (cam) => { if (cam.length === L) return cam; const op = vizinhas(cam[cam.length - 1]).filter((c) => !cam.includes(c)).sort(() => rnd() - 0.5); for (const c of op) { const r = tenta([...cam, c]); if (r) return r; } return null; };
  for (let t = 0; t < 20; t++) { const r = tenta([Math.floor(rnd() * 9)]); if (r) return r; }
  return [0, 1, 2, 5, 4, 3, 6, 7, 8].slice(0, L);
}

/* ---------- memória de notas ---------- */
/** Pares por área. `sym` = símbolo desenhado (cartas-simbolos.js), `a` = texto da carta A (quando não tem símbolo), `b` = texto da carta B. Todos os textos são únicos no conjunto. */
export const PARES = {
  ritmo: [
    { sym: 'seminima', b: 'semínima' }, { sym: 'colcheia', b: 'colcheia' }, { sym: 'semicolcheia', b: 'semicolcheia' }, { sym: 'fusa', b: 'fusa' },
    { sym: 'p_seminima', b: 'pausa de semínima' }, { sym: 'acento', b: 'acento (mais forte)' },
    { a: 'semibreve', b: '4 tempos' }, { a: 'mínima', b: '2 tempos' }, { a: 'bumbo', b: 'o grave, com o pedal' }, { a: 'caixa', b: 'o estalo da esteira' }, { a: 'chimbal', b: 'dois pratos e um pedal' }, { a: 'paradiddle', b: 'DEDD EDEE' },
  ],
  teoria: [
    { a: 'Dó', b: 'C' }, { a: 'Ré', b: 'D' }, { a: 'Mi', b: 'E' }, { a: 'Fá', b: 'F' }, { a: 'Sol', b: 'G' }, { a: 'Lá', b: 'A' }, { a: 'Si', b: 'B' },
    { sym: 'clave_sol', b: 'clave de sol (agudos)' }, { sym: 'clave_fa', b: 'clave de fá (graves)' }, { a: 'sustenido ♯', b: 'sobe meio tom' }, { a: 'bemol ♭', b: 'desce meio tom' },
    { a: 'oitava', b: '12 semitons' }, { a: 'quinta justa', b: '7 semitons' }, { a: 'acorde maior', b: 'soa alegre' }, { a: 'acorde menor', b: 'soa triste' },
  ],
  cordas: [
    { a: 'violão', b: '6 cordas de nylon' }, { a: 'guitarra', b: '6 cordas de aço' }, { a: 'baixo', b: '4 cordas graves' }, { a: 'violino', b: '4 cordas e um arco' },
    { a: 'cavaquinho', b: '4 cordas do samba' }, { a: 'viola caipira', b: '5 pares de cordas' }, { a: 'harpa', b: 'mais de 40 cordas' }, { a: 'violoncelo', b: 'toca sentado, entre as pernas' },
  ],
};
export const AREAS = Object.keys(PARES);
/** As áreas de uma trilha (`assuntos`); sem assunto ou assunto desconhecido = as 3. */
export const areasDe = (assuntos) => { const l = (assuntos || []).filter((a) => AREAS.includes(a)); return l.length ? l : AREAS; };
/** `n` pares sorteados misturando as 3 áreas (ao menos 1 de cada quando n >= 3), sem repetir. */
export function paresMemoria(n, rnd = Math.random, assuntos = null) {
  const emb = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const areas = areasDe(assuntos); const por = areas.map((k) => emb(PARES[k].map((p) => ({ ...p, area: k })))); const out = [];
  for (let i = 0; out.length < n && i < 60; i++) { const lista = por[i % por.length]; const p = lista.shift(); if (p) out.push(p); }
  return out;
}
/** As cartas viradas pra baixo: cada par vira 2 cartas ({ id, par, lado: 'A'|'B' }) embaralhadas. */
export function cartasMemoria(pares, rnd = Math.random) {
  const cartas = pares.flatMap((p, i) => [{ par: i, lado: 'A' }, { par: i, lado: 'B' }]);
  for (let i = cartas.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cartas[i], cartas[j]] = [cartas[j], cartas[i]]; }
  return cartas.map((c, id) => ({ ...c, id }));
}
/** Duas cartas viradas formam um par? (mesmo par, lados diferentes) */
export const formaPar = (a, b) => !!a && !!b && a.id !== b.id && a.par === b.par && a.lado !== b.lado;

/* ================= lote 2: pesca, mira e bolinha, montar nota ================= */
export const estrelasPesca = (erros) => estrelasPorErros(erros, 1, 3);
export const estrelasMira = (erros) => estrelasPorErros(erros, 1, 3);
export const estrelasMontar = (erros) => estrelasPorErros(erros, 1, 3);

/** Banco de perguntas da pesca e da mira (mistura ritmo, teoria e cordas): `q` = o que pede, `certo` = a resposta, `area`. Só pares com texto (os de símbolo ficam na memória). */
export function bancoQA() {
  const vistos = new Set(); const out = [];
  const add = (area, a, b) => { if (!a || !b || vistos.has(a)) return; vistos.add(a); out.push({ area, certo: a, q: b }); };
  for (const area of AREAS) for (const p of PARES[area]) if (p.a) add(area, p.a, p.b);
  for (const f of FIGS.slice(0, 5)) add('ritmo', f.name, beatsLabel(f.beats));
  return out;
}
/** `total` rodadas sem repetir a pergunta (alternando as 3 áreas); cada uma com `nOpcoes` respostas (1 certa + erradas da MESMA área), embaralhadas, e `ok` = posição da certa. */
export function rodadasQA(total, nOpcoes, rnd = Math.random, assuntos = null) {
  const emb = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const areas = areasDe(assuntos); const banco = bancoQA().filter((x) => areas.includes(x.area)); const por = areas.map((k) => emb(banco.filter((x) => x.area === k))); const out = [];
  for (let i = 0; out.length < total && i < total * 6; i++) {
    const p = por[i % por.length].shift(); if (!p) continue;
    const pool = emb(banco.filter((x) => x.area === p.area && x.certo !== p.certo)).slice(0, nOpcoes - 1);
    const ops = emb([p.certo, ...pool.map((x) => x.certo)]); out.push({ area: p.area, q: p.q, certo: p.certo, opcoes: ops, ok: ops.indexOf(p.certo) });
  }
  return out;
}
/** Mira: a bolinha sai de `o` ({x,y}) na direção do ponto `alvoPonto` (um ponto qualquer da tela). Qual alvo (círculos {x,y,r}) ela acerta? O mais perto de `o` ao longo do caminho, com `folga` extra no raio (tolerante); -1 = errou. */
export function acertaMira(o, ponto, alvos, folga = 8) {
  const dx = ponto.x - o.x; const dy = ponto.y - o.y; const d = Math.hypot(dx, dy); if (d < 1e-6) return -1; const ux = dx / d; const uy = dy / d; let melhor = -1; let t = Infinity;
  alvos.forEach((a, i) => { const vx = a.x - o.x; const vy = a.y - o.y; const proj = vx * ux + vy * uy; if (proj <= 0) return; const perp = Math.abs(vx * uy - vy * ux); if (perp <= a.r + folga && proj < t) { t = proj; melhor = i; } });
  return melhor;
}
/** Posição horizontal dos alvos: parados (move = 0) ou balançando de leve (move = 1) com fases diferentes. */
export const alvoX = (base, i, seg, move) => base + (move ? Math.sin(seg * 1.1 + i * 1.9) * 9 : 0);
/** Montar nota: o que cada nível pede (a figura vem do Figurix: figuras do nível `nivelFig`) e quantos colchetes cabem. */
export const montarCfg = (nivel) => { const nf = { facil: 1, medio: 3, dificil: 4 }[nivel] || 1; return { figuras: montesDe(nf), maxC: maxColchetes(nf) }; };
