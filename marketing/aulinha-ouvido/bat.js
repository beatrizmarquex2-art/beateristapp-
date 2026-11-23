// Peças do caderno de bateria: partitura de bateria (o mesmo motor do Beat Lab), grade de passos, linhas de pad e desenhos de postura/empunhadura.
import { layout, toSVG } from '../../js/notation.js';
import { ROWS, GRIDS } from '../../js/beats.js';

const IDS = ROWS.map((r) => r.id);
/** Letras do padrão de cada peça: x = nota normal · a = acento · f = fantasma (caixa) · r = aro (caixa) · o = chimbal aberto · c = cúpula (ride) · p = flam/pivô. '.' ou ' ' = nada. */
const DET = { a: 'a', f: 'f', r: 'r', o: 'o', c: 'c', p: 'p' };
/**
 * Monta um compasso de 4/4 pra partitura. `spec` = { hh: 'x.x.x.x.', sn: '....x...', bd: 'x.......' } (um caractere por passo).
 * `steps` = 8 (colcheias), 12 (tercinas) ou 16 (semicolcheias). `maos` = string com D, E ou B por passo (mão direita, esquerda, bumbo) mostrada em cima.
 */
export function compasso(steps, spec, { maos = '', acentos = '' } = {}) {
  const rows = {}; const det = {};
  for (const id of IDS) {
    const s = (spec[id] || '').replace(/ /g, '').padEnd(steps, '.'); rows[id] = Array.from({ length: steps }, (_, i) => (s[i] && s[i] !== '.' ? 1 : 0));
    s.split('').forEach((c, i) => { if (DET[c]) { det[id] = det[id] || {}; det[id][i] = DET[c]; } });
  }
  const m = maos.replace(/ /g, ''); const a = acentos.replace(/ /g, '');
  return { id: 'x', name: '', style: '', bpm: 100, steps, kind: 'groove', rows, det, hands: m ? Array.from({ length: steps }, (_, i) => (m[i] && m[i] !== '.' ? m[i] : '')) : undefined, acc: a ? Array.from({ length: steps }, (_, i) => (a[i] === '>' ? 1 : 0)) : undefined };
}
/** Partitura de um compasso (SVG em preto e branco). */
export const partitura = (beat, { w = 640, full = true } = {}) => `<div class="bat">${toSVG(layout(beat, { width: w, full }))}</div>`;
/** Uma peça só, pra legenda. */
export const notaSolo = (id, det = '', steps = 8) => partitura(compasso(steps, { [id]: (det || 'x') + '.......' }), { w: 220 });

/** Grade de passos (● em cada batida). linhas = [{ nome, x: 'x.x.' }]. */
export function grade(linhas, steps = 16) {
  const per = GRIDS[steps].perBeat; const sub = per === 2 ? ['e'] : per === 3 ? ['e', 'a'] : ['e', '&', 'a'];
  const cab = Array.from({ length: steps }, (_, i) => (i % per === 0 ? String(i / per + 1) : sub[(i % per) - 1]));
  return `<table class="grade"><tr><th class="gn"></th>${cab.map((c, i) => `<th class="g${i % per === 0 ? ' q' : ''}">${c}</th>`).join('')}</tr>${linhas.map((l) => { const s = (l.x || '').replace(/ /g, '').padEnd(steps, '.'); return `<tr><th class="gn">${l.nome}</th>${Array.from({ length: steps }, (_, i) => `<td class="g${i % per === 0 ? ' q' : ''}">${s[i] && s[i] !== '.' ? '●' : ''}</td>`).join('')}</tr>`; }).join('')}</table>`;
}
/** Contagem (como no Beat Lab): 1 e 2 e… (colcheias), 1 e & a… (semicolcheias), 1 e a… (tercinas). */
export function contagem(steps) { const per = GRIDS[steps].perBeat; const sub = per === 2 ? ['e'] : per === 3 ? ['e', 'a'] : ['e', '&', 'a']; return Array.from({ length: steps }, (_, i) => (i % per === 0 ? String(i / per + 1) : sub[(i % per) - 1])); }

/** Desenho de cima do kit (quem toca está embaixo): números = ordem de montagem. */
export function kitDeCima() {
  const circ = (x, y, r, n, t, dy = null, dash = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#000" stroke-width="2.4" ${dash}/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="800" font-family="Hanken Grotesk">${n}</text><text x="${x}" y="${y + (dy ?? r + 16)}" text-anchor="middle" font-size="13" font-family="Hanken Grotesk">${t}</text>`;
  return `<svg class="postura" viewBox="0 0 470 356" role="img"><rect x="2" y="2" width="466" height="350" rx="10" fill="#fff" stroke="#000" stroke-width="2"/>
  <text x="235" y="344" text-anchor="middle" font-size="13" font-weight="800" font-family="Hanken Grotesk">▲ QUEM TOCA SENTA AQUI, DE COSTAS PARA ESTA BORDA ▲</text>
  <path d="M430 300 V60" stroke="#000" stroke-width="2.4" fill="none"/><path d="M422 72 L430 56 L438 72" stroke="#000" stroke-width="2.4" fill="none"/><text x="440" y="190" font-size="13" font-weight="800" font-family="Hanken Grotesk" transform="rotate(90 440 190)" text-anchor="middle">FRENTE (pra onde você olha)</text>
  ${circ(235, 306, 22, '1', 'banco', -30)}
  ${circ(235, 250, 19, '2', 'caixa', -26)}
  ${circ(160, 250, 21, '3', 'chimbal', -28)}
  <ellipse cx="235" cy="160" rx="46" ry="28" fill="#fff" stroke="#000" stroke-width="2.4"/><text x="235" y="166" text-anchor="middle" font-size="17" font-weight="800" font-family="Hanken Grotesk">4</text><text x="235" y="204" text-anchor="middle" font-size="13" font-family="Hanken Grotesk">bumbo</text>
  ${circ(188, 100, 21, '5', 'tom 1', -30)}
  ${circ(282, 100, 21, '6', 'tom 2', -30)}
  ${circ(350, 184, 27, '7', 'surdo', 44)}
  ${circ(110, 100, 25, '8', 'crash', -34, 'stroke-dasharray="5 3"')}
  ${circ(380, 100, 27, '9', 'ride', -36, 'stroke-dasharray="5 3"')}
  </svg>`;
}

/** Bateria desenhada com detalhes (aros, parafusos, ferragens, pedais), vista por quem toca. Preto e branco com cinzas. Números = ordem de montagem. */
export function kitReal() {
  const F = 'font-family="Hanken Grotesk"'; const K = '#000';
  const drum = (cx, cy, rx, ry, h, lugs, id) => {
    const lug = Array.from({ length: lugs }, (_, i) => { const x = cx - rx + 10 + (i * (2 * rx - 20)) / (lugs - 1); return `<rect x="${(x - 3).toFixed(1)}" y="${cy + 6}" width="6" height="${h - 14}" rx="2" fill="#fff" stroke="${K}" stroke-width="1.6"/>`; }).join('');
    return `<g>
      <path d="M${cx - rx} ${cy} V${cy + h} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} V${cy}" fill="url(#cil)" stroke="${K}" stroke-width="3"/>
      ${lug}
      <path d="M${cx - rx} ${cy + h} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h}" fill="none" stroke="${K}" stroke-width="5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${K}" stroke-width="5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx - 9}" ry="${ry - 3}" fill="#f4f4f4" stroke="${K}" stroke-width="1.6"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.34}" ry="${ry * 0.34}" fill="none" stroke="#999" stroke-width="1.4"/></g>`;
  };
  const prato = (cx, cy, rx, ry, tilt, sino) => `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy + 2}" rx="${rx}" ry="${ry}" fill="#bbb" stroke="${K}" stroke-width="2.4"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pr)" stroke="${K}" stroke-width="3"/>${[0.8, 0.62, 0.44].map((k) => `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * k).toFixed(1)}" ry="${(ry * k).toFixed(1)}" fill="none" stroke="#777" stroke-width="1"/>`).join('')}<ellipse cx="${cx}" cy="${cy - 1}" rx="${sino}" ry="${(sino * ry) / rx + 1.5}" fill="#eee" stroke="${K}" stroke-width="2"/><circle cx="${cx}" cy="${cy - 1}" r="2.4" fill="${K}"/></g>`;
  const tripe = (x, y0, y1, w) => `<path d="M${x} ${y0} V${y1 - 18} M${x} ${y1 - 18} L${x - w} ${y1} M${x} ${y1 - 18} L${x + w} ${y1} M${x} ${y1 - 18} L${x} ${y1 + 2}" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/><rect x="${x - 4}" y="${y0 + (y1 - y0) * 0.45}" width="8" height="8" fill="#fff" stroke="${K}" stroke-width="1.8"/>`;
  const num = (x, y, n, nome, tx = 0, ty = 0) => `<g><circle cx="${x}" cy="${y}" r="15" fill="#fff" stroke="${K}" stroke-width="2.6"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="18" font-weight="800" ${F}>${n}</text><text x="${x + tx}" y="${y + ty + 33}" text-anchor="middle" font-size="16" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round" ${F}>${nome}</text></g>`;
  const hoop = Array.from({ length: 10 }, (_, i) => { const a = (i * 36 * Math.PI) / 180; return `<rect x="${(300 + Math.cos(a) * 104 - 4).toFixed(1)}" y="${(302 + Math.sin(a) * 104 - 4).toFixed(1)}" width="8" height="8" rx="2" fill="#fff" stroke="${K}" stroke-width="1.8"/>`; }).join('');
  return `<svg class="postura" viewBox="0 0 600 462" role="img" aria-label="Bateria vista por quem toca"><defs>
    <linearGradient id="cil" x1="0" x2="1"><stop offset="0" stop-color="#9a9a9a"/><stop offset=".25" stop-color="#e9e9e9"/><stop offset=".55" stop-color="#cfcfcf"/><stop offset="1" stop-color="#8c8c8c"/></linearGradient>
    <radialGradient id="pr" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f2f2f2"/><stop offset="1" stop-color="#b8b8b8"/></radialGradient>
    <radialGradient id="bm" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d6d6d6"/></radialGradient></defs>
  <rect x="2" y="2" width="596" height="458" rx="10" fill="#fff" stroke="${K}" stroke-width="2"/>
  <line x1="20" y1="428" x2="580" y2="428" stroke="#888" stroke-width="2" stroke-dasharray="6 5"/>
  ${tripe(150, 105, 428, 52)}${tripe(470, 112, 428, 56)}${tripe(48, 210, 428, 44)}
  ${prato(150, 98, 70, 11, -9, 14)}${prato(470, 106, 80, 12, 7, 16)}
  ${prato(48, 196, 48, 8, 0, 8)}${prato(48, 204, 48, 8, 0, 8)}
  <path d="M300 160 V215 M250 175 H350" stroke="${K}" stroke-width="4" fill="none"/>
  ${tripe(140, 276, 428, 46)}
  <g stroke="${K}" stroke-width="3.4" fill="none" stroke-linecap="round"><path d="M430 340 L418 428 M470 342 V428 M512 340 L524 428"/></g>
  ${drum(470, 262, 62, 15, 84, 7)}
  ${drum(140, 238, 66, 15, 40, 7)}
  <circle cx="300" cy="302" r="110" fill="url(#bm)" stroke="${K}" stroke-width="6"/>${hoop}<circle cx="300" cy="302" r="92" fill="none" stroke="#777" stroke-width="1.6"/>
  <ellipse cx="300" cy="340" rx="24" ry="22" fill="#fff" stroke="${K}" stroke-width="3"/><ellipse cx="300" cy="340" rx="24" ry="22" fill="none" stroke="#555" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M232 396 L212 428 M368 396 L388 428" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
  ${drum(250, 148, 52, 13, 52, 6)}${drum(350, 148, 52, 13, 52, 6)}
  <rect x="268" y="408" width="46" height="14" rx="3" fill="#ddd" stroke="${K}" stroke-width="2.4" transform="rotate(-8 291 415)"/><path d="M296 408 L296 362" stroke="${K}" stroke-width="3.4"/><circle cx="296" cy="356" r="9" fill="#fff" stroke="${K}" stroke-width="2.6"/>
  <rect x="26" y="410" width="52" height="14" rx="3" fill="#ddd" stroke="${K}" stroke-width="2.4" transform="rotate(8 52 417)"/>
  ${num(110, 40, 8, 'crash', 0, -52)}${num(470, 40, 9, 'ride', 0, -52)}${num(250, 92, 5, 'tom 1', 0, -52)}${num(350, 92, 6, 'tom 2', 0, -52)}
  ${num(140, 192, 2, 'caixa', 0, -45)}${num(48, 152, 3, 'chimbal', 0, -45)}${num(300, 262, 4, 'bumbo')}${num(470, 224, 7, 'surdo', 0, -45)}
  <text x="300" y="450" text-anchor="middle" font-size="15" font-weight="700" ${F}>visto por quem toca (o banco, nº 1, fica atrás de você)</text></svg>`;
}

/** Baqueta com o ponto de apoio (fulcro) a 1/3 do pé da baqueta. */
export function baquetaFulcro() {
  return `<svg class="postura" viewBox="0 0 420 130" role="img"><rect x="2" y="2" width="416" height="126" rx="10" fill="#fff" stroke="#000" stroke-width="2"/>
  <path d="M30 78 L390 52 L390 64 L30 90 Z" fill="#fff" stroke="#000" stroke-width="2.4"/><ellipse cx="392" cy="58" rx="8" ry="7" fill="#fff" stroke="#000" stroke-width="2.4"/>
  <line x1="150" y1="40" x2="150" y2="106" stroke="#000" stroke-width="2" stroke-dasharray="4 3"/><circle cx="150" cy="77" r="12" fill="#000"/><text x="150" y="30" text-anchor="middle" font-size="13" font-weight="800" font-family="Hanken Grotesk">fulcro: polegar + indicador</text>
  <text x="34" y="112" font-size="12" font-family="Hanken Grotesk">pé (parte de trás)</text><text x="332" y="42" font-size="12" font-family="Hanken Grotesk">ponta</text>
  <path d="M30 118 H150" stroke="#000" stroke-width="2"/><text x="90" y="126" text-anchor="middle" font-size="11" font-family="Hanken Grotesk">≈ 1/3 do comprimento</text></svg>`;
}
/** Os 4 golpes (alturas): mostra a baqueta no começo (clara) e no fim (cheia) do golpe. */
export function golpe(inicio, fim, nome) {
  const ang = (a) => (a === 'alto' ? -62 : -14);
  const bastao = (a, cheio) => { const r = (ang(a) * Math.PI) / 180; const x2 = 24 + Math.cos(r) * 60; const y2 = 62 + Math.sin(r) * 60; return `<line x1="24" y1="62" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#000" stroke-width="${cheio ? 5 : 2.4}" stroke-dasharray="${cheio ? '' : '4 3'}" stroke-linecap="round"/>`; };
  return `<svg viewBox="0 0 130 100" class="golpe"><line x1="6" y1="64" x2="124" y2="64" stroke="#000" stroke-width="3"/>${bastao(inicio, false)}${bastao(fim, true)}<text x="65" y="90" text-anchor="middle" font-size="15" font-weight="800" font-family="Hanken Grotesk">${nome}</text><text x="30" y="16" font-size="12" font-family="Hanken Grotesk">${inicio === 'alto' ? 'alto' : 'baixo'} → ${fim === 'alto' ? 'alto' : 'baixo'}</text></svg>`;
}
/** Repetição (ritornelo): pauta de uma linha com |: … :| e casas 1 e 2. */
export function ritornelo({ comp = ['A', 'B', 'C', 'D'], casa1 = null, casa2 = null } = {}) {
  const W = 640; let x = 60; const wc = (W - 100) / (comp.length + (casa1 ? 2 : 0)); let s = `<svg class="ritor" viewBox="0 0 ${W} 120" role="img"><line x1="14" y1="70" x2="${W - 10}" y2="70" stroke="#000" stroke-width="1.8"/>`;
  s += `<line x1="46" y1="44" x2="46" y2="96" stroke="#000" stroke-width="4"/><line x1="52" y1="44" x2="52" y2="96" stroke="#000" stroke-width="1.6"/><circle cx="60" cy="63" r="3" fill="#000"/><circle cx="60" cy="77" r="3" fill="#000"/>`;
  x = 68; comp.forEach((c, i) => { s += `<text x="${x + wc / 2 - 6}" y="76" font-size="18" font-weight="800" font-family="Hanken Grotesk">${c}</text><line x1="${x + wc}" y1="44" x2="${x + wc}" y2="96" stroke="#000" stroke-width="1.6"/>`; x += wc; });
  if (casa1) { s += `<path d="M${x - 2} 34V24H${x + wc - 4}" stroke="#000" stroke-width="2" fill="none"/><text x="${x + 6}" y="21" font-size="13" font-weight="800" font-family="Hanken Grotesk">1.</text><text x="${x + wc / 2 - 6}" y="76" font-size="18" font-weight="800" font-family="Hanken Grotesk">${casa1}</text><circle cx="${x + wc - 12}" cy="63" r="3" fill="#000"/><circle cx="${x + wc - 12}" cy="77" r="3" fill="#000"/><line x1="${x + wc - 6}" y1="44" x2="${x + wc - 6}" y2="96" stroke="#000" stroke-width="1.6"/><line x1="${x + wc}" y1="44" x2="${x + wc}" y2="96" stroke="#000" stroke-width="4"/>`; x += wc;
    s += `<path d="M${x + 2} 34V24H${x + wc - 4}" stroke="#000" stroke-width="2" fill="none"/><text x="${x + 10}" y="21" font-size="13" font-weight="800" font-family="Hanken Grotesk">2.</text><text x="${x + wc / 2 - 6}" y="76" font-size="18" font-weight="800" font-family="Hanken Grotesk">${casa2}</text><line x1="${x + wc - 6}" y1="44" x2="${x + wc - 6}" y2="96" stroke="#000" stroke-width="1.6"/><line x1="${x + wc}" y1="44" x2="${x + wc}" y2="96" stroke="#000" stroke-width="4"/>`; }
  else s += `<circle cx="${x - 14}" cy="63" r="3" fill="#000"/><circle cx="${x - 14}" cy="77" r="3" fill="#000"/><line x1="${x - 8}" y1="44" x2="${x - 8}" y2="96" stroke="#000" stroke-width="1.6"/><line x1="${x}" y1="44" x2="${x}" y2="96" stroke="#000" stroke-width="4"/>`;
  return `${s}</svg>`;
}
