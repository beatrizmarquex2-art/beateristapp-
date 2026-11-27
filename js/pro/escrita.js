// Formas de escrever do PRO além da tablatura pura: pauta comum e pauta + tablatura (violão, guitarra, baixo) e figuras rítmicas sem pauta (qualquer instrumento).
// Todas usam o mesmo `layout()` de js/pro/ritmo.js: as colunas (acordes, batidas juntas) caem no mesmo x, então pauta e tablatura ficam alinhadas.
import * as R from './ritmo.js';
import * as P from '../partitura-melodica.js';
import { CLAVE_SOL_D, CLAVE_SOL, CLAVE_FA_D, CLAVE_FA } from '../paulta/clave.js';
import { corNota } from '../cores-notas.js';

const { INK, FONT } = R; const G = 10;
const SUST = 'M-2 -7V7M2 -8V6M-4.5 -2.5L4.5 -4.5M-4.5 3.5L4.5 1.5';
export const ESCRITAS = { cordas: [['tab', 'tablatura'], ['pauta', 'pauta comum'], ['ambas', 'pauta + tablatura'], ['ritmo', 'figuras rítmicas (sem pauta)']], bateria: [['pauta', 'pauta de bateria'], ['ritmo', 'figuras rítmicas (sem pauta)']] };
/** Violão e guitarra escrevem uma oitava acima do que soa; baixo também (clave de fá). */
export const escrito = (m) => m + 12;
export const claveDe = (inst) => (inst === 'baixo' ? 'fa' : 'sol');
/** "1 e & a": o nome de cada posição dentro do tempo, pra contar em voz alta. */
export const contagem = (pos) => (pos % 4 === 0 ? String(pos / 4 + 1) : pos % 4 === 2 ? '&' : pos % 4 === 1 ? 'e' : 'a');

/** Agrupa colunas de colcheias/semicolcheias do mesmo tempo (feixe). Itens: { rest, d, pos }. */
function feixes(qs) {
  const gr = []; let g = []; const fecha = () => { if (g.length > 1) gr.push(g); g = []; };
  for (const q of qs) { if (q.rest || q.d > 2) { fecha(); continue; } if (g.length && (g[0].pos >> 2) !== (q.pos >> 2)) fecha(); g.push(q); }
  fecha(); return gr;
}
function arcos(out, xs, ys, x2, baixo) { ys.forEach((y) => { const em = baixo ? -8 : 8; out.push(`<path d="M${xs} ${y + em}Q${(xs + x2) / 2} ${y + em * 2.1} ${x2} ${y + em}" stroke="${INK}" stroke-width="1.2" fill="none"/>`); }); }

/** Um sistema da pauta comum de cordas, com a 1ª linha da pauta (a de cima) em y0. */
export function pautaBloco(L, s, y0, { evs, cordas, clave, largura, cor, sel, ultimo = false, inst }) {
  const out = []; const yBase = y0 + 4 * G; const yp = (p) => yBase - (p * G) / 2; const meio = yp(4); const bars = L.sistemas[s];
  for (let i = 0; i < 5; i++) out.push(`<line x1="4" y1="${y0 + i * G}" x2="${largura - 10}" y2="${y0 + i * G}" stroke="${INK}" stroke-width="1.2"/>`);
  out.push(`<line x1="4" y1="${y0}" x2="4" y2="${yBase}" stroke="${INK}" stroke-width="1.4"/>`);
  const k = (clave === 'sol' ? CLAVE_SOL.k : CLAVE_FA.k) * (G / 16);
  out.push(clave === 'sol'
    ? `<path d="${CLAVE_SOL_D}" transform="translate(${(26 - CLAVE_SOL.cx * k).toFixed(2)} ${(yp(2) - CLAVE_SOL.gy * k).toFixed(2)}) scale(${k.toFixed(5)})" fill="${INK}" fill-rule="evenodd"/>`
    : `<path d="${CLAVE_FA_D}" transform="translate(${(8 - CLAVE_FA.x0 * k).toFixed(2)} ${(yp(6) - CLAVE_FA.gy * k).toFixed(2)}) scale(${k.toFixed(5)})" fill="${INK}" fill-rule="evenodd"/>`);
  out.push(`<text x="26" y="${yBase + 24}" font-size="12" font-weight="800" font-family="${FONT}" text-anchor="middle" fill="${INK}">8</text>`); // lê-se uma oitava abaixo (violão, guitarra e baixo)
  if (s === 0) out.push(`<text x="56" y="${yp(2) + 7}" font-size="20" font-weight="800" font-family="${FONT}" text-anchor="middle" fill="${INK}">4</text><text x="56" y="${yp(6) + 7}" font-size="20" font-weight="800" font-family="${FONT}" text-anchor="middle" fill="${INK}">4</text>`);
  let liga = null;
  bars.forEach((b, bi) => {
    const alt = {}; // acidente já valendo neste compasso
    const qs = b.itens.map((it) => {
      if (it.rest) return { it, x: it.x, d: it.d, pos: it.pos, rest: true };
      const g = L.grupos[it.g]; const ns = g.idx.map((i) => { const m = R.midiDe(cordas, evs[i].c, evs[i].f); const w = escrito(m); return { i, m, w, p: P.posNaPauta(w, clave) }; }).sort((a, c) => a.p - c.p);
      const medio = ns.reduce((t, n) => t + n.p, 0) / ns.length; return { it, x: it.x, d: it.d, pos: it.pos, ns, baixo: medio >= 4, lig: it.lig };
    });
    const grupos = feixes(qs); grupos.forEach((gr) => { const baixo = gr.reduce((n, q) => n + (q.baixo ? 1 : -1), 0) > 0; gr.forEach((q) => { q.grupo = gr; q.baixo = baixo; }); gr.baixoG = baixo; });
    qs.forEach((q) => {
      if (q.rest) { out.push(R.pausa(q.d, q.x, meio)); return; }
      const cif = q.ns.map((n) => evs[n.i].cif).find(Boolean); if (cif) out.push(`<text x="${q.x}" y="${y0 - 30}" text-anchor="middle" font-size="12" font-weight="800" font-family="${FONT}" fill="#b5162b">${R.esc(cif)}</text>`);
      const nx = q.x; const ys = q.ns.map((n) => yp(n.p)); const yAlto = Math.min(...ys); const yBaixo = Math.max(...ys);
      // segunda (notas vizinhas) no acorde: a de fora vai pro outro lado da haste
      const desl = new Set(); if (q.ns.length > 1) { const ord = q.baixo ? [...q.ns].reverse() : q.ns; let ant = null; ord.forEach((n) => { if (ant && Math.abs(n.p - ant.p) === 1 && !desl.has(ant)) desl.add(n); ant = n; }); }
      q.ns.forEach((n, ni) => {
        const y = yp(n.p); const c = cor ? corNota(n.m) : INK; const dx = desl.has(n) ? (q.baixo ? -10.5 : 10.5) : 0; const x = nx + dx;
        if (n.p < 0) for (let l = -2; l >= n.p; l -= 2) out.push(`<line x1="${x - 9}" y1="${yp(l)}" x2="${x + 9}" y2="${yp(l)}" stroke="${INK}" stroke-width="1.2"/>`);
        if (n.p > 8) for (let l = 10; l <= n.p; l += 2) out.push(`<line x1="${x - 9}" y1="${yp(l)}" x2="${x + 9}" y2="${yp(l)}" stroke="${INK}" stroke-width="1.2"/>`);
        const chave = `${P.diat(n.w)}`; const quer = P.ehPreta(n.w) ? 1 : 0; const tem = alt[chave] || 0;
        if (quer !== tem) { out.push(`<path d="${SUST}" transform="translate(${nx - 13 - (ni % 2) * 8} ${y})" stroke="${INK}" stroke-width="1.3" fill="none"/>`); alt[chave] = quer; }
        const aberta = q.d >= 8;
        out.push(`<g class="pm-n${n.i === sel ? ' sel' : ''}" data-ev="${n.i}"><rect x="${x - 12}" y="${y - 9}" width="24" height="18" fill="transparent"/>${n.i === sel ? `<circle cx="${x}" cy="${y}" r="10" fill="rgba(184,145,63,.3)"/>` : ''}<ellipse cx="${x}" cy="${y}" rx="${q.d === 16 ? 6.4 : 5.6}" ry="4.1" transform="rotate(-20 ${x} ${y})" ${aberta ? `fill="none" stroke="${c}" stroke-width="1.7"` : `fill="${c}" stroke="${cor ? INK : 'none'}" stroke-width="1"`}/></g>`);
        if (q.d === 3 || q.d === 6 || q.d === 12) out.push(`<circle cx="${x + 10}" cy="${y - (n.p % 2 === 0 ? 3.5 : 0)}" r="1.8" fill="${INK}"/>`);
      });
      q.sx = q.baixo ? nx - 5.4 : nx + 5.4; q.yIni = q.baixo ? yAlto : yBaixo; q.yFim = q.baixo ? Math.max(yBaixo + 3.5 * G, meio) : Math.min(yAlto - 3.5 * G, meio);
      if (liga && liga.s === s) arcos(out, liga.x + 4, liga.ys, nx - 4, liga.baixo);
      liga = q.lig ? { s, x: nx, ys, baixo: q.baixo } : null;
      if (q.d === 16 || q.grupo) return;
      out.push(`<line x1="${q.sx}" y1="${q.yIni}" x2="${q.sx}" y2="${q.yFim}" stroke="${INK}" stroke-width="1.3"/>`);
      if (q.d <= 2) { const dir = q.baixo ? -1 : 1; for (let j = 0; j < (q.d === 1 ? 2 : 1); j++) { const yy = q.yFim + (q.baixo ? -j * 6 : j * 6); out.push(`<path d="M${q.sx} ${yy}c2 ${5 * dir} 9 ${6 * dir} 7 ${14 * dir}" stroke="${INK}" stroke-width="1.8" fill="none"/>`); } }
    });
    grupos.forEach((gr) => {
      const baixo = gr.baixoG; gr.forEach((q) => { q.sx = baixo ? q.x - 5.4 : q.x + 5.4; });
      let yb = baixo ? Math.max(...gr.map((q) => q.yIni + 3.5 * G)) : Math.min(...gr.map((q) => q.yIni - 3.5 * G)); yb = baixo ? Math.max(yb, meio) : Math.min(yb, meio);
      gr.forEach((q) => out.push(`<line x1="${q.sx}" y1="${q.yIni}" x2="${q.sx}" y2="${yb}" stroke="${INK}" stroke-width="1.3"/>`));
      out.push(`<line x1="${gr[0].sx}" y1="${yb}" x2="${gr[gr.length - 1].sx}" y2="${yb}" stroke="${INK}" stroke-width="3.4"/>`);
      const y2 = yb + (baixo ? -5 : 5);
      gr.forEach((q, i) => { if (q.d !== 1) return; const prox = gr[i + 1]; const ant = gr[i - 1];
        if (prox && prox.d === 1) out.push(`<line x1="${q.sx}" y1="${y2}" x2="${prox.sx}" y2="${y2}" stroke="${INK}" stroke-width="3.4"/>`);
        else if (!(ant && ant.d === 1)) { const lado = prox ? 1 : -1; out.push(`<line x1="${q.sx}" y1="${y2}" x2="${q.sx + lado * 8}" y2="${y2}" stroke="${INK}" stroke-width="3.4"/>`); } });
    });
    const fim = ultimo && bi === bars.length - 1;
    out.push(fim ? `<line x1="${b.x1 - 4}" y1="${y0}" x2="${b.x1 - 4}" y2="${yBase}" stroke="${INK}" stroke-width="1.3"/><rect x="${b.x1 - 1}" y="${y0}" width="3.4" height="${4 * G}" fill="${INK}"/>` : `<line x1="${b.x1 - 2}" y1="${y0}" x2="${b.x1 - 2}" y2="${yBase}" stroke="${INK}" stroke-width="1.3"/>`);
  });
  return out.join('');
}

const ALT_PAUTA = 118; // topo (hastes e linhas suplementares) + pauta + o que desce
const finaliza = (o, largura, n, alt, rotulo) => { const h = n * alt + 6; return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${h}" width="100%" role="img" aria-label="${rotulo}">${o}</svg>`, w: largura, h, sistema: alt, topo: 0, n }; };

/** Pauta comum, tablatura, as duas juntas ou figuras rítmicas, conforme `escrita`. Devolve { svg, w, h, sistema, topo, n }. */
export function cordas(evs, { cordas: cs, inst = 'violao', escrita = 'tab', largura = 360, cor = false, sel = -1 } = {}) {
  if (escrita === 'tab') return R.tablatura(evs, { cordas: cs, largura, cor, sel });
  if (escrita === 'ritmo') return ritmo(evs, { largura, sel, bateria: false });
  const clave = claveDe(inst); const L = R.layout(evs, { largura, x0: 74 }); const n = Math.max(1, L.sistemas.length); const ambas = escrita === 'ambas'; const altTab = R.alturaTab(cs.length);
  const alt = ambas ? ALT_PAUTA + altTab - 14 : ALT_PAUTA; let o = '';
  L.sistemas.forEach((_, s) => {
    const base = s * alt; const ultimo = s === n - 1; o += pautaBloco(L, s, base + 40, { evs, cordas: cs, clave, largura, cor, sel, ultimo, inst });
    if (ambas) o += R.tabBloco(L, s, base + ALT_PAUTA - 6 + 22, { evs, cordas: cs, largura, cor, sel, ultimo });
  });
  if (!L.sistemas.length) o += pautaBloco(L, 0, 40, { evs, cordas: cs, clave, largura, cor, sel, ultimo: true, inst });
  return finaliza(o, largura, n, alt, `${ambas ? 'Pauta e tablatura' : 'Pauta'} com ${evs.length} nota${evs.length === 1 ? '' : 's'}`);
}

/** Figuras rítmicas sem pauta: uma linha só, cabeças e hastes, com a contagem "1 e & a" embaixo. Serve pra bateria e pra qualquer instrumento. */
export function ritmo(evs, { largura = 360, sel = -1, bateria = false, mostrarContagem = true } = {}) {
  const L = R.layout(evs, { largura, x0: 46 }); const alt = 110; const n = Math.max(1, L.sistemas.length); let o = '';
  const sistemas = L.sistemas.length ? L.sistemas : [[]];
  sistemas.forEach((bars, s) => {
    const yl = s * alt + 50; const ultimo = s === n - 1; // yl = a linha única
    o += `<line x1="4" y1="${yl}" x2="${largura - 10}" y2="${yl}" stroke="${INK}" stroke-width="1.2"/><line x1="4" y1="${yl - 12}" x2="4" y2="${yl + 12}" stroke="${INK}" stroke-width="1.4"/>`;
    if (s === 0) o += `<text x="26" y="${yl - 2}" font-size="14" font-weight="800" font-family="${FONT}" text-anchor="middle" fill="${INK}">4</text><text x="26" y="${yl + 14}" font-size="14" font-weight="800" font-family="${FONT}" text-anchor="middle" fill="${INK}">4</text>`;
    bars.forEach((b, bi) => {
      const qs = b.itens.map((it) => ({ it, x: it.x, d: it.d, pos: it.pos, rest: it.rest })); const gr = feixes(qs);
      qs.forEach((q) => {
        if (q.rest) { o += R.pausa(q.d, q.x, yl); if (mostrarContagem) o += `<text x="${q.x}" y="${yl + 40}" text-anchor="middle" font-size="10" fill="#8a8372" font-family="${FONT}">${contagem(q.pos)}</text>`; return; }
        const g = L.grupos[q.it.g]; const aberta = q.d >= 8; let acc = false; let fan = false; const maos = [];
        g.idx.forEach((i) => { const e = evs[i]; if (e.acc) acc = true; if (e.fan) fan = true; if (e.p === 'bd') maos.push('B'); else if (e.mao) maos.push(e.mao); });
        const sx = q.x + 5.4; const topo = yl - 30; const idxs = g.idx;
        o += `<g class="pm-n${idxs.includes(sel) ? ' sel' : ''}" data-ev="${idxs.includes(sel) ? idxs[(idxs.indexOf(sel) + 1) % idxs.length] : idxs[0]}"><rect x="${q.x - 12}" y="${yl - 32}" width="24" height="60" fill="transparent"/>${idxs.includes(sel) ? `<circle cx="${q.x}" cy="${yl}" r="11" fill="rgba(184,145,63,.3)"/>` : ''}<ellipse cx="${q.x}" cy="${yl}" rx="${q.d === 16 ? 6.4 : 5.6}" ry="4.1" transform="rotate(-20 ${q.x} ${yl})" ${aberta ? `fill="none" stroke="${INK}" stroke-width="1.7"` : `fill="${INK}"`}/></g>`;
        if (fan) o += `<text x="${q.x - 12}" y="${yl + 5}" font-size="14" font-family="${FONT}" text-anchor="middle" fill="${INK}">(</text><text x="${q.x + 12}" y="${yl + 5}" font-size="14" font-family="${FONT}" text-anchor="middle" fill="${INK}">)</text>`;
        if (acc) o += `<path d="M${q.x - 5} ${yl - 36}l10 3-10 3" stroke="${INK}" stroke-width="1.6" fill="none"/>`;
        if (q.d === 3 || q.d === 6 || q.d === 12) o += R.ponto(q.d, q.x + 10, yl - 3);
        if (!gr.some((g2) => g2.includes(q)) && q.d !== 16) o += `<line x1="${sx}" y1="${yl}" x2="${sx}" y2="${topo}" stroke="${INK}" stroke-width="1.3"/>${R.bandeiras(q.d, sx, topo, true)}`;
        if (maos.length) o += `<text x="${q.x}" y="${yl + 24}" text-anchor="middle" font-size="10" font-weight="800" fill="#6b6558" font-family="${FONT}">${R.esc([...new Set(maos)].join(''))}</text>`;
        if (mostrarContagem) o += `<text x="${q.x}" y="${yl + 40}" text-anchor="middle" font-size="${q.pos % 4 === 0 ? 12 : 10}" font-weight="${q.pos % 4 === 0 ? 800 : 500}" fill="${q.pos % 4 === 0 ? INK : '#8a8372'}" font-family="${FONT}">${contagem(q.pos)}</text>`;
      });
      gr.forEach((g2) => { g2.forEach((q) => { o += `<line x1="${q.x + 5.4}" y1="${yl}" x2="${q.x + 5.4}" y2="${yl - 30}" stroke="${INK}" stroke-width="1.3"/>`; });
        o += `<line x1="${g2[0].x + 5.4}" y1="${yl - 30}" x2="${g2[g2.length - 1].x + 5.4}" y2="${yl - 30}" stroke="${INK}" stroke-width="3.4"/>`; const y2 = yl - 25;
        g2.forEach((q, i) => { if (q.d !== 1) return; const prox = g2[i + 1]; const ant = g2[i - 1]; const x1 = q.x + 5.4;
          if (prox && prox.d === 1) o += `<line x1="${x1}" y1="${y2}" x2="${prox.x + 5.4}" y2="${y2}" stroke="${INK}" stroke-width="3.4"/>`;
          else if (!(ant && ant.d === 1)) { const lado = prox ? 1 : -1; o += `<line x1="${x1}" y1="${y2}" x2="${x1 + lado * 8}" y2="${y2}" stroke="${INK}" stroke-width="3.4"/>`; } }); });
      const fim = ultimo && bi === bars.length - 1;
      o += fim ? `<line x1="${b.x1 - 4}" y1="${yl - 12}" x2="${b.x1 - 4}" y2="${yl + 12}" stroke="${INK}" stroke-width="1.3"/><rect x="${b.x1 - 1}" y="${yl - 12}" width="3.4" height="24" fill="${INK}"/>` : `<line x1="${b.x1 - 2}" y1="${yl - 12}" x2="${b.x1 - 2}" y2="${yl + 12}" stroke="${INK}" stroke-width="1.3"/>`;
    });
  });
  void bateria; return finaliza(o, largura, n, alt, `Figuras rítmicas com ${evs.length} batida${evs.length === 1 ? '' : 's'}`);
}
