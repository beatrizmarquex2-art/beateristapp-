// Tablatura e pauta de bateria do PRO: modelo de eventos (vários ao mesmo tempo: acordes e batidas juntas), layout em compassos/sistemas e desenho em SVG.
// Eventos: tablatura { c (corda, 0 = a mais aguda), f (casa), ini, d }  ·  bateria { p (peça), ini, d, mao ('D'|'E'|''), acc (acento >), fan (fantasma) }.
// ini e d em semicolcheias (16 = compasso 4/4), como em js/partitura-melodica.js, de onde saem a divisão em figuras e os compassos.
import * as P from '../partitura-melodica.js';
import { corNota } from '../cores-notas.js';

export const COMPASSO = P.COMPASSO;
export const INK = '#1b1818'; export const FONT = 'Hanken Grotesk, Helvetica, Arial, sans-serif';
const LARG = { 1: 20, 2: 28, 3: 34, 4: 40, 6: 50, 8: 58, 12: 74, 16: 90 };
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- afinações (de cima, a corda mais aguda, pra baixo) ---------- */
export const INSTRUMENTOS = {
  violao: { nome: 'violão', opcoes: { 6: [['e', 64], ['B', 59], ['G', 55], ['D', 50], ['A', 45], ['E', 40]] } },
  guitarra: { nome: 'guitarra', opcoes: {
    6: [['e', 64], ['B', 59], ['G', 55], ['D', 50], ['A', 45], ['E', 40]],
    7: [['e', 64], ['B', 59], ['G', 55], ['D', 50], ['A', 45], ['E', 40], ['B', 35]],
    8: [['e', 64], ['B', 59], ['G', 55], ['D', 50], ['A', 45], ['E', 40], ['B', 35], ['F♯', 30]] } },
  baixo: { nome: 'baixo', opcoes: {
    4: [['G', 43], ['D', 38], ['A', 33], ['E', 28]],
    5: [['G', 43], ['D', 38], ['A', 33], ['E', 28], ['B', 23]],
    6: [['C', 48], ['G', 43], ['D', 38], ['A', 33], ['E', 28], ['B', 23]] } },
};
export const MAX_CASA = 24;
/** Troca o número de cordas mantendo cada nota na mesma corda de verdade (pelo tom da corda solta). Notas que ficam sem corda são descartadas. */
export function remapeia(evs, de, para) { return evs.map((e) => { const c = para.findIndex((x) => x[1] === de[e.c][1]); return c < 0 ? null : { ...e, c }; }).filter(Boolean); }
export const cordasDe = (inst, n) => { const o = (INSTRUMENTOS[inst] || INSTRUMENTOS.violao).opcoes; return o[n] || o[Object.keys(o)[0]]; };
export const midiDe = (cordas, c, f) => cordas[c][1] + f;
/** Onde tocar uma nota: a casa mais baixa possível (até MAX_CASA), preferindo cordas de cima. Devolve { c, f } ou null. */
export function posicaoDe(cordas, midi, maxCasa = 12) {
  let melhor = null;
  cordas.forEach(([, base], c) => { const f = midi - base; if (f >= 0 && f <= maxCasa && (!melhor || f < melhor.f)) melhor = { c, f }; });
  return melhor;
}

/* ---------- bateria ---------- */
// pos = meia-linha a partir da linha de cima da pauta (0 = 1ª linha, 2 = 2ª...), 'x' = cabeça em X
export const PECAS = {
  hh: { nome: 'chimbal', pos: -1, x: true, cor: '#f6d11e' }, ho: { nome: 'chimbal aberto', pos: -1, x: true, aberto: true, cor: '#f6d11e' }, sn: { nome: 'caixa', pos: 3, cor: '#e0262f' }, bd: { nome: 'bumbo', pos: 7, pe: true, cor: '#1b1818' },
  tt: { nome: 'tom 1', pos: 1, cor: '#5ec1ee' }, mt: { nome: 'tom 2', pos: 2, cor: '#2a4aa8' }, ft: { nome: 'surdo', pos: 5, cor: '#3fae5a' },
  cr: { nome: 'prato', pos: -3, x: true, cor: '#f28c1e' }, rd: { nome: 'condução', pos: 0, x: true, cor: '#f28c1e' }, hf: { nome: 'chimbal pé', pos: 9, x: true, pe: true, cor: '#f06fae' },
};
export const KITS = [
  ['simples', 'simples: chimbal, caixa e bumbo', ['hh', 'sn', 'bd']],
  ['medio', 'médio: + tom, surdo e prato', ['hh', 'sn', 'bd', 'tt', 'ft', 'cr']],
  ['completo', 'completo: todas as peças', ['hh', 'ho', 'sn', 'bd', 'tt', 'mt', 'ft', 'cr', 'rd', 'hf']],
];
export const pecasDoKit = (k) => (KITS.find((x) => x[0] === k) || KITS[0])[2];
export const nomePeca = (p) => (PECAS[p] || { nome: p }).nome;

/* ---------- eventos ---------- */
const chave = (e) => (e.p !== undefined ? `p${e.p}` : `c${e.c}`);
/** Põe uma nota/batida. Se já existe a mesma corda/peça no mesmo instante, substitui. Devolve { evs, i } (i = índice do novo evento). */
export function poe(evs, novo) {
  const l = evs.filter((e) => !(e.ini === novo.ini && chave(e) === chave(novo)));
  l.push({ ...novo }); return { evs: l, i: l.length - 1 };
}
export const remover = (evs, i) => evs.filter((_, k) => k !== i);
/** Muda o evento `i`. Se cair em cima de outro da mesma corda/peça no mesmo instante, não muda nada (devolve a mesma lista). */
export function muda(evs, i, parte) {
  const e = { ...evs[i], ...parte }; e.ini = Math.max(0, Math.round(e.ini)); e.d = Math.max(1, Math.min(16, Math.round(e.d)));
  if (e.c !== undefined) { e.f = Math.max(0, Math.min(MAX_CASA, e.f)); }
  if (evs.some((x, k) => k !== i && x.ini === e.ini && chave(x) === chave(e))) return evs;
  return evs.map((x, k) => (k === i ? e : x));
}
export const fim = (evs) => evs.reduce((t, e) => Math.max(t, e.ini + e.d), 0);
/** Quantos compassos o desenho tem (no mínimo 1). */
export const nCompassos = (evs) => Math.max(1, Math.ceil(fim(evs) / COMPASSO));
export const normaliza = (evs) => (Array.isArray(evs) ? evs.filter((e) => e && Number.isFinite(e.ini) && Number.isFinite(e.d)).map((e) => ({ ...e, ini: Math.max(0, Math.round(e.ini)), d: Math.max(1, Math.round(e.d)) })) : []);

/* ---------- layout ---------- */
/** Agrupa por instante: [{ ini, d (a menor duração do grupo), idx: [índices dos eventos] }] em ordem. */
export function grupos(evs) {
  const m = new Map(); evs.forEach((e, i) => { const g = m.get(e.ini) || { ini: e.ini, d: 99, idx: [] }; g.d = Math.min(g.d, e.d); g.idx.push(i); m.set(e.ini, g); });
  return [...m.values()].sort((a, b) => a.ini - b.ini);
}
/** Posições: sistemas → compassos → itens { x, d, g (índice do grupo ou -1 = pausa), rest }. `largura` = largura do SVG, `x0` = onde começa o 1º compasso (clave/fórmula). */
export function layout(evs, { largura = 360, x0 = 58 } = {}) {
  const gs = grupos(evs); const proxy = gs.map((g, i) => ({ m: i, ini: g.ini, d: g.d }));
  const bars = P.compassos(proxy); const fat = largura < 480 ? 0.78 : 1; const disp = largura - x0 - 10;
  const larg = bars.map((b) => b.reduce((s, it) => s + (LARG[it.d] || 40) * fat, 0) + 14 * fat);
  const sis = []; let at = []; let w = 0;
  larg.forEach((lw, i) => { if (at.length && w + lw > disp) { sis.push(at); at = []; w = 0; } at.push(i); w += lw; });
  if (at.length) sis.push(at);
  let gAnt = -2; let ligAnt = false; // continuação = mesma nota do item anterior, que vinha ligada
  bars.forEach((b) => b.forEach((it) => { it.cont = it.m !== null && it.m === gAnt && ligAnt; if (it.m !== null) { gAnt = it.m; ligAnt = !!it.lig; } else { gAnt = -2; ligAnt = false; } }));
  const out = sis.map((idxs) => {
    const soma = idxs.reduce((s, i) => s + larg[i], 0); const f = disp / soma; let x = x0;
    return idxs.map((bi) => { const bw = larg[bi] * f; let cx = x + 8 * f; const itens = bars[bi].map((it) => { const w2 = (LARG[it.d] || 40) * fat * f; const o = { x: cx + w2 * 0.42, d: it.d, g: it.m === null ? -1 : it.m, rest: it.m === null, pos: it.pos, lig: !!it.lig, cont: !!it.cont }; cx += w2; return o; }); const b = { x0: x, x1: x + bw, itens }; x += bw; return b; });
  });
  return { sistemas: out, grupos: gs };
}

/* ---------- pausas e hastes ---------- */
export function pausa(d, x, y) {
  const b = d >= 16 ? 16 : d >= 8 ? 8 : d >= 4 ? 4 : d >= 2 ? 2 : 1;
  if (b === 16) return `<rect x="${x - 5}" y="${y - 10}" width="10" height="5" fill="${INK}"/>`;
  if (b === 8) return `<rect x="${x - 5}" y="${y - 5}" width="10" height="5" fill="${INK}"/>`;
  if (b === 4) return `<path d="M${x - 2} ${y - 12}l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
  if (b === 2) return `<g transform="translate(${x} ${y})"><circle cx="-2" cy="-4" r="2.6" fill="${INK}"/><path d="M-2 -2q4 1 6-3l-5 13" stroke="${INK}" stroke-width="1.6" fill="none"/></g>`;
  return `<g transform="translate(${x} ${y})"><circle cx="-2" cy="-6" r="2.4" fill="${INK}"/><circle cx="-4" cy="1" r="2.4" fill="${INK}"/><path d="M-2 -4q4 1 6-3M-4 3q4 1 6-3M4 -7l-7 18" stroke="${INK}" stroke-width="1.5" fill="none"/></g>`;
}
/** Bandeirolas (colcheia = 1, semicolcheia = 2) numa haste que sai de (x, y1) e termina em y2; `cima` = haste pra cima. */
export function bandeiras(d, x, y2, cima) {
  const n = d === 1 ? 2 : d <= 3 && d >= 2 ? 1 : 0; let o = ''; const dir = cima ? 1 : -1;
  for (let j = 0; j < n; j++) { const yy = y2 + (cima ? j * 6 : -j * 6); o += `<path d="M${x} ${yy}c2 ${5 * dir} 9 ${6 * dir} 7 ${14 * dir}" stroke="${INK}" stroke-width="1.8" fill="none"/>`; }
  return o;
}
export const ponto = (d, x, y) => (d === 3 || d === 6 || d === 12 ? `<circle cx="${x}" cy="${y}" r="1.8" fill="${INK}"/>` : '');
export const quadro = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>`;

/* ---------- tablatura ---------- */
/** Um sistema da tablatura (as linhas das cordas, as casas e as hastes de ritmo), com o topo em y0. Devolve o SVG em texto.
    `x0` é onde as linhas começam (24 = só a tablatura; mais à direita quando ela vem embaixo de uma pauta). */
export function tabBloco(L, s, y0, { evs, cordas, largura, cor, sel, ultimo = false }) {
  const gt = 13; const nc = cordas.length; const yb = y0 + (nc - 1) * gt; const meio = y0 + ((nc - 1) * gt) / 2; let o = ''; const bars = L.sistemas[s];
  const cNota = (m) => (cor ? corNota(m) : INK);
  o += ['T', 'A', 'B'].map((t, k) => `<text x="8" y="${meio - 14 + k * 15}" font-size="13" font-weight="800" fill="#b5162b" font-family="${FONT}">${t}</text>`).join('');
  for (let k = 0; k < nc; k++) o += `<line x1="24" x2="${largura - 4}" y1="${y0 + k * gt}" y2="${y0 + k * gt}" stroke="${INK}" stroke-width="1.1"/>`;
  o += `<line x1="24" x2="24" y1="${y0}" y2="${yb}" stroke="${INK}" stroke-width="1.4"/>`;
  bars.forEach((b, bi) => {
    const fim = ultimo && bi === bars.length - 1;
    o += fim ? `<line x1="${b.x1 - 4}" x2="${b.x1 - 4}" y1="${y0}" y2="${yb}" stroke="${INK}" stroke-width="1.3"/><rect x="${b.x1 - 1}" y="${y0}" width="3.4" height="${yb - y0}" fill="${INK}"/>` : `<line x1="${b.x1}" x2="${b.x1}" y1="${y0}" y2="${yb}" stroke="${INK}" stroke-width="1.3"/>`;
    b.itens.forEach((it) => {
      if (it.rest) { o += pausa(it.d, it.x, meio); return; }
      const g = L.grupos[it.g]; let gg = ''; const cif = it.cont ? null : g.idx.map((i) => evs[i].cif).find(Boolean);
      if (cif) gg += `<text x="${it.x}" y="${y0 - 8}" text-anchor="middle" font-size="12" font-weight="800" font-family="${FONT}" fill="#b5162b">${esc(cif)}</text>`;
      const dirG = g.idx.map((i) => evs[i].dir).find(Boolean); if (dirG && g.idx.length > 1 && !it.cont) gg += seta(dirG, it.x, y0 - 34, y0 - 22);
      g.idx.forEach((i) => { const e = evs[i]; const y = y0 + e.c * gt; const m = midiDe(cordas, e.c, e.f);
        const rot = e.mudo ? '×' : it.cont ? `(${e.f})` : e.f; const larg = it.cont ? 26 : 14;
        gg += `<g${it.cont ? '' : ` class="pm-n${i === sel ? ' sel' : ''}" data-ev="${i}"`}>${it.cont ? '' : quadro(it.x - 10, y - 8, 20, 16)}${i === sel && !it.cont ? `<rect x="${it.x - 9}" y="${y - 8}" width="18" height="16" rx="4" fill="rgba(184,145,63,.28)"/>` : ''}<rect x="${it.x - larg / 2}" y="${y - 7}" width="${larg}" height="13" fill="${i === sel && !it.cont ? 'none' : '#fbf8f1'}"/><text x="${it.x}" y="${y + 5}" text-anchor="middle" font-size="${e.mudo ? 13 : (e.f > 9 || it.cont) ? 11 : 14}" font-weight="800" font-family="${FONT}" fill="${cNota(m)}">${rot}</text></g>`; });
      const d = g.d; if (d < 16) { const ys = yb + 12; gg += `<line x1="${it.x}" x2="${it.x}" y1="${ys}" y2="${ys + 22}" stroke="${INK}" stroke-width="1.3"/>${bandeiras(d, it.x, ys + 22, false)}${ponto(d, it.x + 6, ys + 16)}`; }
      else gg += `<line x1="${it.x - 5}" x2="${it.x + 5}" y1="${yb + 22}" y2="${yb + 22}" stroke="${INK}" stroke-width="1.6"/>`;
      o += gg;
    });
  });
  return o;
}
/** Altura de um sistema de tablatura com `nc` cordas (inclui as hastes de ritmo embaixo). */
export const TOPO_TAB = 40; // espaço em cima: seta da batida e cifra
export const alturaTab = (nc) => TOPO_TAB + (nc - 1) * 13 + 52;
/** Seta de rasgueado: ↓ (b) ou ↑ (c), centrada em x, do alto y1 ao baixo y2. */
export const seta = (dir, x, y1, y2) => (dir === 'c' ? `<path class="seta-r" d="M${x} ${y2}V${y1}M${x - 3.2} ${y1 + 4}L${x} ${y1}L${x + 3.2} ${y1 + 4}" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : `<path class="seta-r" d="M${x} ${y1}V${y2}M${x - 3.2} ${y2 - 4}L${x} ${y2}L${x + 3.2} ${y2 - 4}" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
/** Desenha a tablatura. opts: { cordas (lista de [nome, midi]), largura, cor, sel (índice do evento) }. Devolve { svg, w, h, sistema, topo, n }. */
export function tablatura(evs, { cordas, largura = 360, cor = false, sel = -1 } = {}) {
  const L = layout(evs, { largura, x0: 36 }); const lh = alturaTab(cordas.length); let o = '';
  L.sistemas.forEach((_, s) => { o += tabBloco(L, s, TOPO_TAB + s * lh, { evs, cordas, largura, cor, sel, ultimo: s === L.sistemas.length - 1 }); });
  const n = Math.max(1, L.sistemas.length); const h = n * lh + 4;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${h}" width="100%" role="img" aria-label="Tablatura com ${evs.length} nota${evs.length === 1 ? '' : 's'}">${o}</svg>`, w: largura, h, sistema: lh, topo: 0, n };
}

/* ---------- pauta de bateria ---------- */
/** Tamanho (largura em px) de cada peça desenhada quando a pauta usa o kit ilustrado no lugar das cabeças. */
const TAM_ICONE = { hh: 32, ho: 32, hf: 26, sn: 30, bd: 32, tt: 30, mt: 30, ft: 30, cr: 32, rd: 32 };
/** Desenha a pauta de bateria. opts: { largura, cor, sel, icones, faixa, altFaixa }.
    icones = provider do kit ilustrado (js/pro/icones-kit.js): no lugar de cada cabeça entra a peça desenhada.
    faixa(L, s, yTopo, evs) = devolve SVG extra pra pôr embaixo de cada sistema (ocupa `altFaixa` px). Devolve { svg, w, h, sistema, topo, n }. */
export function bateria(evs, { largura = 360, cor = false, sel = -1, icones = null, faixa = null, altFaixa = 0 } = {}) {
  const G = 10; const L = layout(evs, { largura, x0: icones ? 70 : 62 }); const lh = 128 + altFaixa; const y0s = 56; const off = icones ? 14 : 5.3; let o = icones && icones.defs ? icones.defs : '';
  L.sistemas.forEach((bars, s) => {
    const y0 = y0s + s * lh; const yb = y0 + 4 * G; const topo = y0 - 26;
    for (let k = 0; k < 5; k++) o += `<line x1="4" x2="${largura - 4}" y1="${y0 + k * G}" y2="${y0 + k * G}" stroke="${INK}" stroke-width="1.2"/>`;
    o += `<rect x="10" y="${y0 + G}" width="3.5" height="${2 * G}" fill="${INK}"/><rect x="16" y="${y0 + G}" width="3.5" height="${2 * G}" fill="${INK}"/>`;
    if (s === 0) o += `<text x="40" y="${y0 + 19}" text-anchor="middle" font-size="17" font-weight="800" font-family="${FONT}">4</text><text x="40" y="${y0 + 39}" text-anchor="middle" font-size="17" font-weight="800" font-family="${FONT}">4</text>`;
    bars.forEach((b) => {
      o += `<line x1="${b.x1}" x2="${b.x1}" y1="${y0}" y2="${yb}" stroke="${INK}" stroke-width="1.3"/>`;
      // 1º passo: o que cada coluna tem (mãos em cima, pés embaixo) e quais colunas de mão se ligam por feixe (colcheias/semicolcheias do mesmo tempo)
      const cols = b.itens.map((it) => { if (it.rest) return { it, rest: true }; const g = L.grupos[it.g]; let alto = null; let baixo = null;
        g.idx.forEach((i) => { const pc = PECAS[evs[i].p] || PECAS.sn; const y = y0 + (pc.pos * G) / 2; if (pc.pe) baixo = Math.min(baixo === null ? y : baixo, y); else alto = Math.max(alto === null ? y : alto, y); });
        return { it, g, alto, baixo, d: g.d, pos: it.pos, x: it.x }; });
      const feixes = []; let cur = []; const fecha = () => { if (cur.length > 1) feixes.push(cur); cur = []; };
      cols.forEach((c) => { if (c.rest || c.alto === null || c.d > 2) { fecha(); return; } if (cur.length && (cur[0].pos >> 2) !== (c.pos >> 2)) fecha(); cur.push(c); }); fecha();
      const emFeixe = new Set(feixes.flat());
      cols.forEach((c) => {
        const it = c.it; if (c.rest) { o += pausa(it.d, it.x, y0 + 2 * G); return; }
        const g = c.g; const x = it.x; let gg = ''; const maoTxt = [];
        g.idx.forEach((i) => { const e = evs[i]; const pc = PECAS[e.p] || PECAS.sn; const y = y0 + (pc.pos * G) / 2; const col = cor ? pc.cor : INK;
          let cab = '';
          if (e.p === 'cr') cab += `<line x1="${x - 9}" x2="${x + 9}" y1="${y0 - G}" y2="${y0 - G}" stroke="${INK}"/>`;
          if (icones) cab += icones.icone(e.p, x, y, TAM_ICONE[e.p] || 30);
          else cab += pc.x ? `<path d="M${x - 4.5} ${y - 4.5}l9 9M${x + 4.5} ${y - 4.5}l-9 9" stroke="${col}" stroke-width="2.3"/>` : `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="4.1" transform="rotate(-20 ${x} ${y})" fill="${col}" stroke="${cor ? INK : 'none'}" stroke-width="1"/>`;
          if (pc.aberto) cab += `<circle cx="${x}" cy="${y - (icones ? 12 : 9)}" r="2.6" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
          if (e.fan) cab += `<text x="${x - (icones ? 19 : 12)}" y="${y + 5}" font-size="14" font-family="${FONT}" fill="${INK}" text-anchor="middle">(</text><text x="${x + (icones ? 19 : 12)}" y="${y + 5}" font-size="14" font-family="${FONT}" fill="${INK}" text-anchor="middle">)</text>`;
          if (e.acc) cab += `<path d="M${x - 5} ${pc.pe ? y + (icones ? 18 : 12) : y - (icones ? 17 : 11)}l10 3-10 3" stroke="${INK}" stroke-width="1.6" fill="none"/>`;
          gg += `<g class="pm-n${i === sel ? ' sel' : ''}" data-ev="${i}">${quadro(x - 15, y - 14, 30, 28)}${i === sel ? `<circle cx="${x}" cy="${y}" r="${icones ? 17 : 10}" fill="rgba(184,145,63,.28)"/>` : ''}${cab}</g>`;
          if (pc.pe) { if (e.p === 'bd') maoTxt.push('B'); } else if (e.mao) maoTxt.push(e.mao);
        });
        const d = g.d;
        // hastes: mãos pra cima (da cabeça mais baixa até acima da pauta), pés pra baixo
        if (c.alto !== null && d < 16) { const sx = x + off; gg += `<line x1="${sx}" x2="${sx}" y1="${c.alto}" y2="${topo}" stroke="${INK}" stroke-width="1.3"/>${emFeixe.has(c) ? '' : bandeiras(d, sx, topo, true)}`; }
        if (c.baixo !== null && d < 16) { const sx = x - off; const fundo = yb + 26; gg += `<line x1="${sx}" x2="${sx}" y1="${c.baixo}" y2="${fundo}" stroke="${INK}" stroke-width="1.3"/>${c.alto === null ? bandeiras(d, sx, fundo, false) : ''}`; }
        if (maoTxt.length) gg += `<text x="${x}" y="${y0 - 36}" text-anchor="middle" font-size="11" font-weight="800" font-family="${FONT}" fill="#6b6558">${esc([...new Set(maoTxt)].join(''))}</text>`;
        o += gg;
      });
      feixes.forEach((fx) => { const x1 = fx[0].x + off; const x2 = fx[fx.length - 1].x + off; o += `<line x1="${x1}" y1="${topo}" x2="${x2}" y2="${topo}" stroke="${INK}" stroke-width="3.4"/>`; const y2 = topo + 5;
        fx.forEach((c, i) => { if (c.d !== 1) return; const prox = fx[i + 1]; const ant = fx[i - 1]; const xs = c.x + off;
          if (prox && prox.d === 1) o += `<line x1="${xs}" y1="${y2}" x2="${prox.x + off}" y2="${y2}" stroke="${INK}" stroke-width="3.4"/>`;
          else if (!(ant && ant.d === 1)) { const lado = prox ? 1 : -1; o += `<line x1="${xs}" y1="${y2}" x2="${xs + lado * 8}" y2="${y2}" stroke="${INK}" stroke-width="3.4"/>`; } }); });
    });
    if (faixa) o += faixa(L, s, yb + 34, evs);
  });
  const h = Math.max(1, L.sistemas.length) * lh + 8;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${h}" width="100%" role="img" aria-label="Pauta de bateria com ${evs.length} batida${evs.length === 1 ? '' : 's'}">${o}</svg>`, w: largura, h, sistema: lh, topo: 0, n: Math.max(1, L.sistemas.length) };
}
