// Formas mais visuais de escrever: violão/guitarra/baixo (tablatura + faixa de mini braços, mapa no braço) e teclado (pauta + faixa de teclados, quadros do teclado).
// Tudo SVG em texto, sem DOM, no mesmo estilo e com as mesmas cores de nota do jogo (js/cores-notas.js).
import * as R from './ritmo.js';
import * as P from '../partitura-melodica.js';
import { corNota, notaClara } from '../cores-notas.js';

const { INK, FONT } = R;
const NOME = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
export const nomeNota = (m) => NOME[((m % 12) + 12) % 12];
const contagem = (pos) => (pos % 4 === 0 ? String(pos / 4 + 1) : pos % 4 === 2 ? '&' : pos % 4 === 1 ? 'e' : 'a');
const vb = (largura, h, o, rotulo) => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${h}" width="100%" role="img" aria-label="${rotulo}">${o}</svg>`, w: largura, h });
const minDx = (xs) => { const d = xs.slice(1).map((x, k) => x - xs[k]).filter((v) => v > 0.5); return d.length ? Math.min(...d) : 60; };

/* ================= TECLADO ================= */
const BRANCAS = [0, 2, 4, 5, 7, 9, 11, 12]; const PRETAS = [[1, 0.7], [3, 1.7], [6, 3.7], [8, 4.7], [10, 5.7]];
/** Um mini teclado de 8 teclas brancas (dó a dó) em (x, y), com a(s) tecla(s) de `lit` (MIDI) acesas na cor da nota. `suave` = nota que continua soando (mais clara). */
export function miniTeclado(x, y, w, h, lit, { suave = false } = {}) {
  const kw = w / 8; let o = ''; const cls = lit.map((m) => ((m % 12) + 12) % 12);
  BRANCAS.forEach((p, i) => { const k = i === 7 ? -1 : cls.indexOf(p); const on = k >= 0 && i < 7; const c = on ? corNota(lit[k]) : '#fff'; o += `<rect x="${(x + i * kw).toFixed(1)}" y="${y}" width="${(kw - 0.6).toFixed(1)}" height="${h}" rx="1.5" fill="${c}" ${on && suave ? 'fill-opacity=".38"' : ''} stroke="${INK}" stroke-width="${(w / 60).toFixed(2)}"/>`; });
  PRETAS.forEach(([p, pos]) => { const k = cls.indexOf(p); const on = k >= 0; o += `<rect x="${(x + pos * kw + kw * 0.12).toFixed(1)}" y="${y}" width="${(kw * 0.62).toFixed(1)}" height="${(h * 0.6).toFixed(1)}" rx="1.2" fill="${on ? corNota(lit[k]) : INK}" ${on && suave ? 'fill-opacity=".5"' : ''} stroke="${INK}" stroke-width=".6"/>`; });
  return o;
}
export const ALT_FAIXA_TECLADO = 86;
/** Faixa de teclados pra pôr embaixo de cada sistema da pauta (hook de P.pauta): um mini teclado por nota, com o nome e a contagem. */
export function faixaTeclados(largura) {
  return (notas, si, yTopo, evs) => {
    let o = `<rect x="8" y="${yTopo}" width="${largura - 16}" height="${ALT_FAIXA_TECLADO - 10}" rx="12" fill="#f4efe4"/>`; const esp = minDx(notas.map((n) => n.x)); const w = Math.max(22, Math.min(46, esp - 3)); const h = Math.round(w * 0.9); const vistos = new Set();
    notas.forEach((n) => { const e = evs[n.ev]; if (!e) return; const chave = `${n.ev}`; if (vistos.has(chave)) return; vistos.add(chave); // nota ligada que atravessa o compasso: só o 1º teclado
      o += `<g data-peca="${e.m}">${miniTeclado(n.x - w / 2, yTopo + 10, w, h, [e.m])}</g><text x="${n.x}" y="${yTopo + 10 + h + 13}" text-anchor="middle" font-size="12" font-weight="800" font-family="${FONT}" fill="${INK}">${nomeNota(e.m)}</text><text x="${n.x}" y="${yTopo + 10 + h + 25}" text-anchor="middle" font-size="10" font-weight="600" font-family="${FONT}" fill="#8a8372">${contagem(e.ini % 16)}</text>`; });
    return o;
  };
}
/** Quadros do teclado: uma tecla acesa por quadro, com o nome grande em cima e a contagem embaixo. Cada compasso é um "sistema". */
export function quadrosTeclado(evs, { largura = 360, sel = -1 } = {}) {
  const nBars = Math.max(1, Math.ceil(P.fim(evs) / 16)); const res = evs.every((e) => e.ini % 4 === 0 && e.d % 4 === 0) ? 4 : evs.every((e) => e.ini % 2 === 0) ? 2 : 1; const porBar = 16 / res; const perRow = Math.min(porBar, largura < 480 ? 4 : 8);
  const linhas = Math.ceil(porBar / perRow); const gap = 6; const fw = Math.max(40, (largura - 12 - (perRow - 1) * gap) / perRow); const fh = Math.round(fw * 0.82) + 30; const cab = 18; const barH = cab + linhas * (fh + gap) + 8; let o = '';
  for (let b = 0; b < nBars; b++) {
    o += `<text x="8" y="${b * barH + 12}" font-size="11" font-weight="800" letter-spacing=".08em" fill="#8a8372" font-family="${FONT}">COMPASSO ${b + 1}</text>`;
    for (let f = 0; f < porBar; f++) {
      const ini = b * 16 + f * res; const r = Math.floor(f / perRow); const c = f % perRow; const fx = 6 + c * (fw + gap); const fy = b * barH + cab + r * (fh + gap);
      const ev = evs.findIndex((e) => e.ini <= ini && ini < e.ini + e.d); const e = ev >= 0 ? evs[ev] : null; const inicia = !!e && e.ini >= ini; const selecionado = ev >= 0 && ev === sel;
      o += `<g${e ? ` class="pm-n${selecionado ? ' sel' : ''}" data-ev="${ev}"` : ''}><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="12" fill="#fff" stroke="${selecionado ? '#b8913f' : '#ddd5c3'}" stroke-width="${selecionado ? 3 : 1.2}"/>`;
      if (e && inicia) o += `<text x="${fx + fw / 2}" y="${fy + 21}" text-anchor="middle" font-size="${fw < 56 ? 15 : 18}" font-weight="800" font-family="${FONT}" fill="${INK}">${nomeNota(e.m)}</text>`;
      else if (e) o += `<text x="${fx + fw / 2}" y="${fy + 21}" text-anchor="middle" font-size="16" fill="#b9b09a" font-family="${FONT}">‿</text>`;
      o += miniTeclado(fx + 7, fy + 28, fw - 14, fh - 54, e ? [e.m] : [], { suave: !!e && !inicia });
      const forte = ini % 4 === 0; o += `<text x="${fx + fw / 2}" y="${fy + fh - 7}" text-anchor="middle" font-size="${forte ? 15 : 12}" font-weight="${forte ? 800 : 600}" font-family="${FONT}" fill="${forte ? INK : '#8a8372'}">${contagem(ini % 16)}</text></g>`;
    }
  }
  const h = nBars * barH + 4; return { ...vb(largura, h, o, `Quadros do teclado com ${evs.length} nota${evs.length === 1 ? '' : 's'}`), sistema: barH, topo: 0, n: nBars };
}
/** A escrita do teclado pelo nome: 'pauta', 'faixa' (pauta + faixa de teclados) ou 'quadros'. Devolve { svg, w, h, sistema, topo, n }. */
export function tecladoEscrita(evs, { escrita = 'pauta', clave = 'auto', largura = 360, cor = false, sel = -1 } = {}) {
  if (escrita === 'quadros') return quadrosTeclado(evs, { largura, sel });
  const faixa = escrita === 'faixa'; const r = P.pauta(evs, { clave, largura, cor, sel, faixa: faixa ? faixaTeclados(largura) : null, altFaixa: faixa ? ALT_FAIXA_TECLADO : 0 });
  const sistema = P.GEOM.sistema + (faixa ? ALT_FAIXA_TECLADO : 0); const topo = P.GEOM.topo(!!cor);
  return { svg: r.svg, w: r.w, h: r.h, sistema, topo, n: Math.max(1, Math.round((r.h - topo - 4) / sistema)) };
}

/* ================= CORDAS ================= */
/** Mini braço visto de frente: cordas na vertical (grave à esquerda), 4 casas, bolinhas coloridas onde apertar, ○ = solta. `x` = centro, `y` = topo. */
export function miniBraco(x, y, w, es, cordas, { cor = true } = {}) {
  const nc = cordas.length; const h = Math.round(w * 1.25); const gx = x - w / 2; const pos = es.filter((e) => e.f > 0).map((e) => e.f); const max = Math.max(0, ...pos); const base = pos.length ? (max <= 4 ? 1 : Math.min(...pos)) : 1;
  let o = `<rect x="${(gx - 4).toFixed(1)}" y="${y - 6}" width="${(w + 8).toFixed(1)}" height="${h + 14}" rx="8" fill="#f4efe4" opacity="0"/>`;
  for (let c = 0; c < nc; c++) o += `<line x1="${(gx + (c * w) / (nc - 1)).toFixed(1)}" x2="${(gx + (c * w) / (nc - 1)).toFixed(1)}" y1="${y}" y2="${y + h}" stroke="${INK}" stroke-width="${w > 34 ? 1.1 : 0.9}"/>`;
  for (let f = 0; f <= 4; f++) o += `<line x1="${(gx - 1).toFixed(1)}" x2="${(gx + w + 1).toFixed(1)}" y1="${(y + (f * h) / 4).toFixed(1)}" y2="${(y + (f * h) / 4).toFixed(1)}" stroke="${INK}" stroke-width="${f === 0 && base === 1 ? 2.6 : 0.9}"/>`;
  const dx = (e) => gx + ((nc - 1 - e.c) * w) / (nc - 1); const r = Math.max(2.6, w * 0.085);
  es.forEach((e) => { const m = R.midiDe(cordas, e.c, e.f); const col = cor ? corNota(m) : INK; if (e.mudo) o += `<text x="${dx(e).toFixed(1)}" y="${y - 2}" text-anchor="middle" font-size="${Math.max(8, w * 0.2)}" font-weight="800" fill="${INK}" font-family="${FONT}">×</text>`; else if (e.f === 0) o += `<circle cx="${dx(e).toFixed(1)}" cy="${(y - r - 1.5).toFixed(1)}" r="${(r * 0.8).toFixed(1)}" fill="none" stroke="${col}" stroke-width="${(r * 0.55).toFixed(1)}"/>`; else { const f = e.f - base; if (f >= 0 && f < 4) o += `<circle cx="${dx(e).toFixed(1)}" cy="${(y + ((f + 0.5) * h) / 4).toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" stroke="${INK}" stroke-width=".9"/>`; } });
  if (base > 1) o += `<text x="${(gx - 3).toFixed(1)}" y="${y + h / 8 + 3}" text-anchor="end" font-size="${Math.max(8, w * 0.2)}" font-weight="800" fill="#6b6558" font-family="${FONT}">${base}ª</text>`;
  return { o, h };
}
const ALT_FAIXA_BRACO = 86;
/** Tablatura com uma faixa de mini braços embaixo de cada sistema, alinhada às colunas. */
export function tablaturaFaixa(evs, { cordas, largura = 360, cor = false, sel = -1 } = {}) {
  const nc = cordas.length; const L = R.layout(evs, { largura, x0: 36 }); const lh = R.alturaTab(nc) + ALT_FAIXA_BRACO; let o = '';
  L.sistemas.forEach((bars, s) => {
    const y0 = R.TOPO_TAB + s * lh; const ultimo = s === L.sistemas.length - 1; o += R.tabBloco(L, s, y0, { evs, cordas, largura, cor, sel, ultimo });
    const yS = y0 + (nc - 1) * 13 + 40; const itens = bars.flatMap((b) => b.itens).filter((it) => !it.rest && !it.cont); const w = Math.max(22, Math.min(44, minDx(itens.map((it) => it.x)) - 3));
    o += `<rect x="8" y="${yS}" width="${largura - 16}" height="${ALT_FAIXA_BRACO - 14}" rx="12" fill="#f4efe4"/>`;
    itens.forEach((it) => { const es = L.grupos[it.g].idx.map((i) => evs[i]); const mb = miniBraco(it.x, yS + 14, w, es, cordas, { cor: true }); o += `<g data-peca="${L.grupos[it.g].idx[0]}">${mb.o}</g>`; });
  });
  const n = Math.max(1, L.sistemas.length); return { ...vb(largura, n * lh + 4, o, `Tablatura com mini braços, ${evs.length} nota${evs.length === 1 ? '' : 's'}`), sistema: lh, topo: 0, n };
}
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]; const DUPLOS = [12, 24];
/** Mapa no braço: o braço deitado (cordas e casas de verdade) com as bolinhas coloridas numeradas na ordem em que tocam. Um braço por compasso. */
export function mapaBraco(evs, { cordas, largura = 360, cor = true, sel = -1 } = {}) {
  const nc = cordas.length; const maxF = evs.reduce((m, e) => Math.max(m, e.f), 0); const nf = maxF <= 12 ? 12 : maxF <= 17 ? 17 : 24; const nBars = R.nCompassos(evs);
  const x0 = 46; const wB = largura - x0 - 14; const gtr = nc <= 6 ? 22 : 18; const hB = (nc - 1) * gtr; const cab = 18; const barH = cab + hB + 52; let o = '';
  for (let b = 0; b < nBars; b++) {
    const yb = b * barH; const y0 = yb + cab + 12;
    o += `<text x="8" y="${yb + 12}" font-size="11" font-weight="800" letter-spacing=".08em" fill="#8a8372" font-family="${FONT}">COMPASSO ${b + 1}</text><rect x="${x0 - 8}" y="${y0 - 12}" width="${wB + 12}" height="${hB + 24}" rx="12" fill="#3a2f26"/>`;
    for (let f = 0; f <= nf; f++) o += `<line x1="${(x0 + (f * wB) / nf).toFixed(1)}" x2="${(x0 + (f * wB) / nf).toFixed(1)}" y1="${y0}" y2="${y0 + hB}" stroke="${f === 0 ? '#f4efe4' : '#9c8e72'}" stroke-width="${f === 0 ? 4 : 1.3}"/>`;
    for (let c = 0; c < nc; c++) o += `<line x1="${x0}" x2="${x0 + wB}" y1="${y0 + c * gtr}" y2="${y0 + c * gtr}" stroke="#e8dcc0" stroke-width="${(0.9 + (c * 2.6) / nc).toFixed(2)}"/><text x="${x0 - 20}" y="${y0 + c * gtr + 4}" font-size="11" font-weight="800" fill="#d9b45f" text-anchor="middle" font-family="${FONT}">${R.esc(cordas[c][0])}</text>`;
    INLAYS.filter((f) => f <= nf).forEach((f) => { o += `<circle cx="${(x0 + ((f - 0.5) * wB) / nf).toFixed(1)}" cy="${y0 + hB / 2}" r="3.6" fill="#6b5d44"/>`; });
    DUPLOS.filter((f) => f <= nf).forEach((f) => { const cx = (x0 + ((f - 0.5) * wB) / nf).toFixed(1); o += `<circle cx="${cx}" cy="${y0 + hB * 0.3}" r="3.6" fill="#6b5d44"/><circle cx="${cx}" cy="${y0 + hB * 0.7}" r="3.6" fill="#6b5d44"/>`; });
    for (let f = 1; f <= nf; f++) if (f % (nf > 12 ? 3 : 1) === 0 || f === 1) o += `<text x="${(x0 + ((f - 0.5) * wB) / nf).toFixed(1)}" y="${y0 + hB + 25}" font-size="10" fill="#8a8372" text-anchor="middle" font-family="${FONT}">${f}</text>`;
    const nesta = evs.map((e, i) => ({ e, i })).filter(({ e }) => e.ini >= b * 16 && e.ini < b * 16 + 16); const ordem = [...new Set(nesta.map(({ e }) => e.ini))].sort((p, q) => p - q);
    nesta.forEach(({ e, i }) => { const m = R.midiDe(cordas, e.c, e.f); const cx = e.f === 0 ? x0 - 3 : x0 + ((e.f - 0.5) * wB) / nf; const cy = y0 + e.c * gtr; const n = ordem.indexOf(e.ini) + 1; const col = cor ? corNota(m) : '#d9b45f';
      o += `<g class="pm-n${i === sel ? ' sel' : ''}" data-ev="${i}"><rect x="${cx - 12}" y="${cy - 12}" width="24" height="24" fill="transparent"/>${i === sel ? `<circle cx="${cx}" cy="${cy}" r="13.5" fill="rgba(217,180,95,.35)"/>` : ''}<circle cx="${cx}" cy="${cy}" r="9" fill="${col}" stroke="#fff" stroke-width="1.8"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="${cor && !notaClara(m) ? '#fff' : '#1b1818'}" font-family="${FONT}">${e.mudo ? '×' : n}</text></g>`; });
  }
  return { ...vb(largura, nBars * barH + 4, o, `Mapa no braço com ${evs.length} nota${evs.length === 1 ? '' : 's'}`), sistema: barH, topo: 0, n: nBars };
}
