// Partitura de melodia (teclas e, depois, cordas): notas tocadas ou clicadas viram compassos e uma pauta, sem tocar no DOM.
// Modelo: eventos { m: nota MIDI, ini, d } em semicolcheias (1 compasso de 4 tempos = 16). Uma voz só; as pausas nascem dos buracos.
// A pauta sai como SVG em texto (tela) e é a mesma que vira imagem no PDF. Só sustenidos (as teclas pretas), como no resto do app.
import { CLAVE_SOL_D, CLAVE_SOL, CLAVE_FA_D, CLAVE_FA } from './paulta/clave.js';
import { corNota } from './cores-notas.js';

export const COMPASSO = 16; // semicolcheias por compasso (4/4)
export const FIGURAS = [['semibreve', 16], ['mínima', 8], ['semínima', 4], ['colcheia', 2], ['semicolcheia', 1]];
const LEGAIS = [16, 12, 8, 6, 4, 3, 2, 1];
const LETRA = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // dó dó♯ ré ré♯ mi fá fá♯ sol sol♯ lá lá♯ si
const PRETA = new Set([1, 3, 6, 8, 10]);
const NOME = ['dó', 'ré', 'mi', 'fá', 'sol', 'lá', 'si'];
const BASE = { sol: 4 * 7 + 2, fa: 2 * 7 + 4 }; // nota da 1ª linha: mi4 (sol) e sol2 (fá)

export const ehPreta = (m) => PRETA.has(((m % 12) + 12) % 12);
/** posição diatônica: oitava*7 + letra (dó4 = 28). */
export const diat = (m) => (Math.floor(m / 12) - 1) * 7 + LETRA[((m % 12) + 12) % 12];
/** 0 = 1ª linha, 1 = 1º espaço, 2 = 2ª linha … 8 = 5ª linha; negativo = abaixo, 9+ = acima. */
export const posNaPauta = (m, clave) => diat(m) - BASE[clave];
export const nomeCurto = (m) => `${NOME[LETRA[((m % 12) + 12) % 12]]}${ehPreta(m) ? '♯' : ''}`;
/** sol se a maioria das notas está do lá 3 pra cima; senão fá. Sem notas = sol. */
export function claveAuto(evs) {
  const ms = evs.map((e) => e.m).sort((a, b) => a - b); if (!ms.length) return 'sol';
  return ms[Math.floor(ms.length / 2)] >= 57 ? 'sol' : 'fa';
}

/* ---------- eventos ---------- */
/** Ordena, tira o que passa por cima do próximo (voz única) e garante ini ≥ 0 e d ≥ 1. */
export function normalizar(evs) {
  const o = evs.map((e) => ({ m: e.m, ini: Math.max(0, Math.round(e.ini)), d: Math.max(1, Math.round(e.d)) })).sort((a, b) => a.ini - b.ini || a.m - b.m);
  const out = [];
  for (const e of o) {
    const u = out[out.length - 1];
    if (u && u.ini === e.ini) continue; // duas notas no mesmo instante: fica a primeira (voz única)
    if (u && u.ini + u.d > e.ini) u.d = e.ini - u.ini;
    out.push({ ...e });
  }
  return out;
}
export const fim = (evs) => evs.reduce((t, e) => Math.max(t, e.ini + e.d), 0);

/** Toque gravado [{ midi, at (s), len (s) }] vira eventos na grade (`grade` em semicolcheias: 1 = semicolcheia, 2 = colcheia, 4 = semínima). */
export function quantizar(take, { bpm = 100, grade = 2 } = {}) {
  const sx = 60 / bpm / 4; // 1 semicolcheia em segundos
  const evs = take.map((n) => {
    const ini = Math.round(n.at / sx / grade) * grade;
    const f = Math.round((n.at + Math.max(n.len, 0.05)) / sx / grade) * grade;
    return { m: n.midi, ini, d: Math.max(grade, f - ini) };
  });
  return normalizar(evs);
}

/* ---------- compassos ---------- */
/** Parte `d` a partir da posição `pos` dentro do compasso em figuras legíveis (sem atravessar o meio do compasso, salvo a mínima/ semibreve/ pontuada no início). */
export function dividir(pos, d) {
  const out = [];
  while (d > 0) {
    let v = 0;
    for (const c of LEGAIS) {
      if (c > d || pos + c > COMPASSO) continue;
      const pontuada = c === 12 || c === 6 || c === 3;
      const base = pontuada ? (c * 2) / 3 : c; // 12→8, 6→4, 3→2
      if (pos % base !== 0) continue;
      if (c === 12 && pos !== 0) continue;
      if (c === 8 && pos !== 0 && pos !== 8) continue;
      if (c === 6 && pos % 8 === 4) continue; // semínima pontuada não atravessa o meio do compasso
      if (pos < 8 && pos + c > 8 && c !== 12 && c !== 16 && c !== 8) continue;
      v = c; break;
    }
    if (!v) v = 1;
    out.push(v); pos += v; d -= v;
  }
  return out;
}

/** Eventos → compassos: cada item { m|null, d, pos, lig (amarra com o próximo), ev (índice do evento) }. Notas que passam da barra são divididas e ligadas. */
export function compassos(evs) {
  const e = normalizar(evs); const total = Math.max(COMPASSO, Math.ceil(fim(e) / COMPASSO) * COMPASSO);
  const bars = Array.from({ length: total / COMPASSO }, () => []);
  const poe = (ini, d, m, ev, ligaNoFim) => {
    let at = ini; let resto = d;
    while (resto > 0) {
      const b = Math.floor(at / COMPASSO); const pos = at % COMPASSO; const cab = Math.min(resto, COMPASSO - pos);
      const partes = dividir(pos, cab); let p = pos;
      partes.forEach((v, k) => {
        const ultima = k === partes.length - 1 && cab === resto;
        bars[b].push({ m, d: v, pos: p, lig: m !== null && (!ultima || ligaNoFim), ev }); p += v;
      });
      at += cab; resto -= cab;
    }
  };
  let t = 0;
  e.forEach((x, i) => { if (x.ini > t) poe(t, x.ini - t, null, -1, false); poe(x.ini, x.d, x.m, i, false); t = x.ini + x.d; });
  if (t < total) poe(t, total - t, null, -1, false);
  return bars;
}

/* ---------- pauta ---------- */
const G = 10; // distância entre linhas
/** Medidas do desenho, pra quem precisa fatiar a pauta em páginas (PDF): altura de cada sistema e o respiro de cima. */
export const GEOM = { sistema: 118, topo: (cor) => (cor ? 30 : 26) };
const LARG = { 1: 20, 2: 27, 3: 33, 4: 38, 6: 48, 8: 56, 12: 72, 16: 86 };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SUST = 'M-2 -7V7M2 -8V6M-4.5 -2.5L4.5 -4.5M-4.5 3.5L4.5 1.5';
const BEQ = 'M-2.5 -7V3M2.5 -3V7M-2.5 -2L2.5 -3M-2.5 3L2.5 2';

/** Desenha. Devolve { w, h, svg, notas: [{ ev, x, y }], compassos } (notas = onde cada evento caiu, pra tocar nele). */
export function pauta(evs, { clave = 'auto', largura = 360, cor = false, sel = -1, tinta = 'currentColor' } = {}) {
  const e = normalizar(evs); const cl = clave === 'auto' ? claveAuto(e) : clave; const bars = compassos(e);
  const esq = 54; const dir = 10; const disp = largura - esq - dir; const sw = 28; // espaço da fórmula de compasso (só no 1º sistema)
  const fat = largura < 480 ? 0.72 : 1; // celular: notas mais juntas pra caber 2 compassos por linha
  const larguras = bars.map((b) => b.reduce((s, it) => s + LARG[it.d] * fat, 0) + 16 * fat);
  // distribui compassos em sistemas (linhas)
  const sis = []; let at = []; let w = 0;
  larguras.forEach((lw, i) => { const livre = disp - (sis.length === 0 ? sw : 0); if (at.length && w + lw > livre) { sis.push(at); at = []; w = 0; } at.push(i); w += lw; });
  if (at.length) sis.push(at);
  const SIS_H = 118; const topPad = cor ? 30 : 26; const out = []; const notas = [];
  const ink = tinta; const linhas = (y0, x1, x2) => Array.from({ length: 5 }, (_, i) => `<line x1="${x1}" y1="${y0 + i * G}" x2="${x2}" y2="${y0 + i * G}" stroke="${ink}" stroke-width="1.2"/>`).join('');
  sis.forEach((idxs, si) => {
    const y0 = topPad + si * SIS_H + 34; const yBase = y0 + 4 * G; // yBase = 1ª linha (de baixo)
    const yp = (p) => yBase - (p * G) / 2; const meio = yp(4);
    out.push(linhas(y0, 4, largura - dir));
    out.push(`<line x1="4" y1="${y0}" x2="4" y2="${yBase}" stroke="${ink}" stroke-width="1.4"/>`);
    // clave
    const k = (cl === 'sol' ? CLAVE_SOL.k : CLAVE_FA.k) * (G / 16); // a clave da Bea foi desenhada pra linhas a 16 de distância
    out.push(cl === 'sol'
      ? `<path d="${CLAVE_SOL_D}" transform="translate(${(26 - CLAVE_SOL.cx * k).toFixed(2)} ${(yp(2) - CLAVE_SOL.gy * k).toFixed(2)}) scale(${k.toFixed(5)})" fill="${ink}" fill-rule="evenodd"/>`
      : `<path d="${CLAVE_FA_D}" transform="translate(${(8 - CLAVE_FA.x0 * k).toFixed(2)} ${(yp(6) - CLAVE_FA.gy * k).toFixed(2)}) scale(${k.toFixed(5)})" fill="${ink}" fill-rule="evenodd"/>`);
    const pri = si === 0;
    if (pri) out.push(`<text x="${esq + 4}" y="${yp(2) + 7}" font-size="20" font-weight="800" font-family="Hanken Grotesk, sans-serif" text-anchor="middle" fill="${ink}">4</text><text x="${esq + 4}" y="${yp(6) + 7}" font-size="20" font-weight="800" font-family="Hanken Grotesk, sans-serif" text-anchor="middle" fill="${ink}">4</text>`);
    const livre = disp - (pri ? sw : 0); const soma = idxs.reduce((s, i) => s + larguras[i], 0);
    const ultimo = si === sis.length - 1; const f = ultimo ? Math.min(1.3, livre / soma) : livre / soma; // o último sistema não estica demais
    let x = esq + (pri ? sw : 0) - 6;
    idxs.forEach((bi) => {
      const bw = larguras[bi] * f; const itens = bars[bi]; let cx = x + 8 * f;
      const alt = {}; // acidente já valendo neste compasso (nota e oitava): 1 = sustenido
      const qs = itens.map((it) => { const slot = LARG[it.d] * fat * f; const nx = cx + Math.min(10, slot / 3) + 4; cx += slot;
        if (it.m === null) return { it, nx, rest: true };
        const p = posNaPauta(it.m, cl); return { it, nx, p, y: yp(p), baixo: p >= 4 }; });
      // grupos de feixe: colcheias/semicolcheias seguidas dentro do mesmo tempo (pausa ou nota longa quebra)
      const grupos = []; let g = []; const fecha = () => { if (g.length > 1) grupos.push(g); g = []; };
      for (const q of qs) { if (q.rest || q.it.d > 2) { fecha(); continue; } if (g.length && (g[0].it.pos >> 2) !== (q.it.pos >> 2)) fecha(); g.push(q); }
      fecha();
      grupos.forEach((gr) => { const baixo = gr.reduce((n, q) => n + (q.baixo ? 1 : -1), 0) > 0; gr.forEach((q) => { q.grupo = gr; q.baixo = baixo; }); gr.baixoG = baixo; });
      qs.forEach((q) => {
        const { it, nx } = q;
        if (q.rest) { restoSVG(out, it.d, nx, yp, meio, ink); return; }
        const m = it.m; const p = q.p; const y = q.y; const c = cor ? corNota(m) : ink;
        if (p < 0) for (let l = -2; l >= p; l -= 2) out.push(`<line x1="${nx - 9}" y1="${yp(l)}" x2="${nx + 9}" y2="${yp(l)}" stroke="${ink}" stroke-width="1.2"/>`);
        if (p > 8) for (let l = 10; l <= p; l += 2) out.push(`<line x1="${nx - 9}" y1="${yp(l)}" x2="${nx + 9}" y2="${yp(l)}" stroke="${ink}" stroke-width="1.2"/>`);
        const chave = `${diat(m)}`; const quer = ehPreta(m) ? 1 : 0; const tem = alt[chave] || 0;
        if (quer !== tem) { out.push(`<path d="${quer ? SUST : BEQ}" transform="translate(${nx - 12} ${y})" stroke="${ink}" stroke-width="1.3" fill="none"/>`); alt[chave] = quer; }
        const aberta = it.d >= 8; const semHaste = it.d === 16;
        q.sx = q.baixo ? nx - 5.4 : nx + 5.4;
        q.yh = q.baixo ? Math.max(y + 3.5 * G, meio) : Math.min(y - 3.5 * G, meio);
        out.push(`<g class="pm-n${it.ev === sel ? ' sel' : ''}" data-ev="${it.ev}"><rect x="${nx - 13}" y="${Math.min(y, q.yh) - 8}" width="26" height="${Math.abs(q.yh - y) + 16}" fill="${it.ev === sel ? 'rgba(181,22,46,.16)' : 'transparent'}" rx="5"/>`
          + `<ellipse cx="${nx}" cy="${y}" rx="${semHaste ? 6.4 : 5.6}" ry="4.1" transform="rotate(-20 ${nx} ${y})" ${aberta ? `fill="none" stroke="${c}" stroke-width="1.7"` : `fill="${c}" stroke="${cor ? '#1b1818' : 'none'}" stroke-width="1"`}/></g>`);
        if (it.d === 3 || it.d === 6 || it.d === 12) out.push(`<circle cx="${nx + 10}" cy="${y - (p % 2 === 0 ? 3.5 : 0)}" r="1.8" fill="${ink}"/>`);
        if (cor) out.push(`<text x="${nx}" y="${yBase + 4 * G + 6}" font-size="9.5" font-weight="800" text-anchor="middle" font-family="Hanken Grotesk, sans-serif" fill="${ink}">${esc(nomeCurto(m))}</text>`);
        if (it.ev >= 0) notas.push({ ev: it.ev, x: nx, y, sistema: si });
        if (semHaste || q.grupo) return;
        out.push(`<line x1="${q.sx}" y1="${y}" x2="${q.sx}" y2="${q.yh}" stroke="${ink}" stroke-width="1.3"/>`);
        if (it.d <= 2) { // bandeirola(s) numa nota sozinha
          const dir = q.baixo ? -1 : 1;
          for (let j = 0; j < (it.d === 1 ? 2 : 1); j++) { const yy = q.yh + (q.baixo ? -j * 6 : j * 6); out.push(`<path d="M${q.sx} ${yy}c2 ${5 * dir * (q.baixo ? 1 : 1)} 9 ${6 * dir} 7 ${14 * dir}" transform="${q.baixo ? `translate(0 0)` : ''}" stroke="${ink}" stroke-width="1.8" fill="none"/>`); }
        }
      });
      // feixes
      grupos.forEach((gr) => {
        const baixo = gr.baixoG; gr.forEach((q) => { q.sx = baixo ? q.nx - 5.4 : q.nx + 5.4; });
        let yb = baixo ? Math.max(...gr.map((q) => q.y + 3.5 * G)) : Math.min(...gr.map((q) => q.y - 3.5 * G)); yb = baixo ? Math.max(yb, meio) : Math.min(yb, meio);
        gr.forEach((q) => out.push(`<line x1="${q.sx}" y1="${q.y}" x2="${q.sx}" y2="${yb}" stroke="${ink}" stroke-width="1.3"/>`));
        out.push(`<line x1="${gr[0].sx}" y1="${yb}" x2="${gr[gr.length - 1].sx}" y2="${yb}" stroke="${ink}" stroke-width="3.4"/>`);
        const y2 = yb + (baixo ? -5 : 5);
        gr.forEach((q, i) => { if (q.it.d !== 1) return; const prox = gr[i + 1]; const ant = gr[i - 1];
          if (prox && prox.it.d === 1) out.push(`<line x1="${q.sx}" y1="${y2}" x2="${prox.sx}" y2="${y2}" stroke="${ink}" stroke-width="3.4"/>`);
          else if (!(ant && ant.it.d === 1)) { const lado = prox ? 1 : -1; out.push(`<line x1="${q.sx}" y1="${y2}" x2="${q.sx + lado * 8}" y2="${y2}" stroke="${ink}" stroke-width="3.4"/>`); } });
      });
      // ligaduras
      const nots = qs.filter((q) => !q.rest);
      nots.forEach((q, i) => { if (!q.it.lig) return; const prox = nots[i + 1]; const x2 = prox ? prox.nx : q.nx + 28; const em = q.baixo ? -8 : 8; const y = q.y + em; out.push(`<path d="M${q.nx} ${y}Q${(q.nx + x2) / 2} ${y + em * 1.1} ${x2} ${y}" stroke="${ink}" stroke-width="1.2" fill="none"/>`); });
      x += bw;
      const fimDoc = ultimo && bi === bars.length - 1;
      out.push(fimDoc ? `<line x1="${x - 4}" y1="${y0}" x2="${x - 4}" y2="${yBase}" stroke="${ink}" stroke-width="1.3"/><rect x="${x - 1}" y="${y0}" width="3.4" height="${4 * G}" fill="${ink}"/>` : `<line x1="${x - 2}" y1="${y0}" x2="${x - 2}" y2="${yBase}" stroke="${ink}" stroke-width="1.3"/>`);
    });
  });
  const h = topPad + sis.length * SIS_H + 4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${h}" width="100%" role="img" aria-label="Partitura de ${e.length} nota${e.length === 1 ? '' : 's'} na ${cl === 'sol' ? 'clave de sol' : 'clave de fá'}">${out.join('')}</svg>`;
  return { w: largura, h, svg, notas, clave: cl, compassos: bars.length };
}

function restoSVG(out, d, x, yp, meio, ink) {
  const pt = d === 3 || d === 6 || d === 12; const base = d === 12 ? 8 : d === 6 ? 4 : d === 3 ? 2 : d;
  if (base === 16) out.push(`<rect x="${x - 5}" y="${yp(6)}" width="10" height="${G / 2}" fill="${ink}"/>`);
  else if (base === 8) out.push(`<rect x="${x - 5}" y="${yp(4) - G / 2}" width="10" height="${G / 2}" fill="${ink}"/>`);
  else if (base === 4) out.push(`<path d="M${x - 2} ${meio - 12}l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`);
  else if (base === 2) out.push(`<g transform="translate(${x} ${meio})"><circle cx="-2" cy="-4" r="2.6" fill="${ink}"/><path d="M-2 -2q4 1 6-3l-5 13" stroke="${ink}" stroke-width="1.6" fill="none"/></g>`);
  else out.push(`<g transform="translate(${x} ${meio})"><circle cx="-2" cy="-6" r="2.4" fill="${ink}"/><circle cx="-4" cy="1" r="2.4" fill="${ink}"/><path d="M-2 -4q4 1 6-3M-4 3q4 1 6-3M4 -7l-7 18" stroke="${ink}" stroke-width="1.5" fill="none"/></g>`);
  if (pt) out.push(`<circle cx="${x + 9}" cy="${meio - 3}" r="1.8" fill="${ink}"/>`);
}

/* ---------- correção (cada função devolve eventos novos) ---------- */
/** Move a nota `delta` semicolcheias. Se cair em cima do começo de outra nota, não faz nada (ninguém some por acidente). */
export const mover = (evs, i, delta) => { const e = evs.map((x) => ({ ...x })); if (!e[i]) return evs; const ini = Math.max(0, e[i].ini + delta); if (e.some((x, k) => k !== i && x.ini === ini)) return evs; e[i].ini = ini; return normalizar(e); };
export const alongar = (evs, i, delta) => { const e = evs.map((x) => ({ ...x })); if (!e[i]) return evs; e[i].d = Math.max(1, e[i].d + delta); return normalizar(e); };
export const remover = (evs, i) => evs.filter((_, k) => k !== i).map((x) => ({ ...x }));
export const trocarNota = (evs, i, m) => evs.map((x, k) => (k === i ? { ...x, m } : { ...x }));
export const subir = (evs, i, delta) => trocarNota(evs, i, evs[i].m + delta);
/** Põe uma nota num ponto qualquer (a entrada por clique usa o cursor, que pode ter pausas na frente). */
export const anexarEm = (evs, m, ini, d) => normalizar([...evs, { m, ini, d }]);
/** Põe uma nota logo depois da última (entrada por clique). */
export const anexar = (evs, m, d) => normalizar([...evs, { m, ini: fim(evs), d }]);
/** Duração em segundos de uma semicolcheia no andamento dado. */
export const semicolcheia = (bpm) => 60 / bpm / 4;
