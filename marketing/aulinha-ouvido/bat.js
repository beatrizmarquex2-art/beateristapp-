// Peças do caderno de bateria: partitura de bateria (o mesmo motor do Beat Lab), grade de passos, linhas de pad e desenhos de postura/empunhadura.
import { layout, toSVG } from '../../js/notation.js';
import { pautaBat } from './pauta-bat.js';
import { ROWS, GRIDS } from '../../js/beats.js';

const IDS = ROWS.map((r) => r.id);
const IDS2 = ['cr', 'rd', 'hh', 'tt', 'mt', 'sn', 'ft', 'bd', 'hf'];
/** Um compasso (spec por peça, 1 caractere por passo). `ho` (chimbal aberto) vira 'o' na linha do chimbal. */
export function compasso(steps, spec, { maos = '', acentos = '', nopausa = false } = {}) {
  const rows = {}; for (const id of IDS2) rows[id] = (spec[id] || '').replace(/ /g, '').padEnd(steps, '.').slice(0, steps);
  if (spec.ho) { const h = (spec.ho || '').replace(/ /g, '').padEnd(steps, '.'); rows.hh = rows.hh.split('').map((c, i) => (h[i] !== '.' ? 'o' : c)).join(''); }
  if (acentos) { const a = acentos.replace(/ /g, ''); for (const id of ['sn', 'hh', 'rd']) rows[id] = rows[id].split('').map((c, i) => (a[i] === '>' && c === 'x' ? 'a' : c)).join(''); }
  return { steps, rows, maos: maos.replace(/ /g, ''), nopausa: !!nopausa };
}
/** Partitura de bateria (notação original: duas vozes, pausas, ligaduras). `beat` = um compasso, ou uma lista de compassos na mesma linha. */
export const partitura = (beat, { w = 640, conta = false, clave = true } = {}) => `<div class="bat">${pautaBat({ compassos: [].concat(beat), w, conta, clave })}</div>`;
/** Uma peça só, pra legenda. */
export const notaSolo = (id, det = '', steps = 8) => partitura(compasso(steps, { [id]: (det || 'x') + '.......' }, { nopausa: true }), { w: 260, clave: false });

const NOME_PECA = { chimbal: 'hh', caixa: 'sn', bumbo: 'bd', 'tom 1': 'tt', 'tom 2': 'mt', surdo: 'ft', crash: 'cr', ride: 'rd', 'chimbal ab.': 'hh', 'chimbal pé': 'hf' };
/** (antiga grade de bolinhas) agora é uma pauta de bateria com a contagem embaixo; linha sem notas = pauta em branco pra escrever. */
export function grade(linhas, steps = 16) {
  const spec = {}; linhas.forEach((l) => { const id = NOME_PECA[l.nome] || 'sn'; const x = (l.x || '').replace(/ /g, '').padEnd(steps, '.'); spec[id] = x; if (l.nome === 'chimbal ab.') spec[id] = x.replace(/x/g, 'o'); });
  return partitura(compasso(steps, spec), { conta: true });
}
/** Contagem (como no Beat Lab): 1 e 2 e… (colcheias), 1 e & a… (semicolcheias), 1 e a… (tercinas). */
export function contagem(steps) { const per = GRIDS[steps].perBeat; const sub = per === 2 ? ['e'] : per === 3 ? ['e', 'a'] : ['e', '&', 'a']; return Array.from({ length: steps }, (_, i) => (i % per === 0 ? String(i / per + 1) : sub[(i % per) - 1])); }

/** Kit visto de cima, com detalhe: tambores com aro e parafusos, pratos com anéis, ferragens, pedais, banco e quem toca. Números = ordem de montagem. */
export function kitDeCima() {
  const K = '#000'; const F = 'font-family="Hanken Grotesk"';
  const tambor = (x, y, r, lugs) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e4e4e4" stroke="${K}" stroke-width="3.4"/><circle cx="${x}" cy="${y}" r="${r - 6}" fill="#fff" stroke="${K}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r * 0.32}" fill="none" stroke="#888" stroke-width="1.2"/>${Array.from({ length: lugs }, (_, i) => { const a = (i * 2 * Math.PI) / lugs; return `<rect x="${(x + Math.cos(a) * (r - 2) - 3).toFixed(1)}" y="${(y + Math.sin(a) * (r - 2) - 3).toFixed(1)}" width="6" height="6" rx="1.5" fill="#fff" stroke="${K}" stroke-width="1.6"/>`; }).join('')}`;
  const prato = (x, y, r, sino) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#pt)" stroke="${K}" stroke-width="3"/>${[0.78, 0.58, 0.4].map((k) => `<circle cx="${x}" cy="${y}" r="${(r * k).toFixed(1)}" fill="none" stroke="#7a7a7a" stroke-width="1"/>`).join('')}<circle cx="${x}" cy="${y}" r="${sino}" fill="#f0f0f0" stroke="${K}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2.6" fill="${K}"/>`;
  const perna = (x, y, r, n = 3) => Array.from({ length: n }, (_, i) => { const a = (-90 + i * (360 / n)) * Math.PI / 180; return `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * r).toFixed(1)}" y2="${(y + Math.sin(a) * r).toFixed(1)}" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  const num = (x, y, n, nome, dx = 0, dy = 30) => `<circle cx="${x}" cy="${y}" r="14" fill="#fff" stroke="${K}" stroke-width="2.6"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="800" ${F}>${n}</text><text x="${x + dx}" y="${y + dy}" text-anchor="middle" font-size="15" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round" ${F}>${nome}</text>`;
  const lab = (n, nome, bx, by, ox, oy, ty = 30) => `<line x1="${bx}" y1="${by}" x2="${ox}" y2="${oy}" stroke="${K}" stroke-width="1.6"/><circle cx="${ox}" cy="${oy}" r="3.2" fill="${K}"/><circle cx="${bx}" cy="${by}" r="15" fill="#fff" stroke="${K}" stroke-width="2.6"/><text x="${bx}" y="${by + 6}" text-anchor="middle" font-size="17" font-weight="800" ${F}>${n}</text><text x="${bx}" y="${by + ty}" text-anchor="middle" font-size="15" font-weight="700" ${F}>${nome}</text>`;
  return `<svg class="postura topo" viewBox="0 0 640 476" role="img" aria-label="Bateria vista de cima"><defs><radialGradient id="pt" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#b4b4b4"/></radialGradient><radialGradient id="as" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#e8e8e8"/><stop offset="1" stop-color="#9c9c9c"/></radialGradient></defs>
  <rect x="2" y="2" width="636" height="472" rx="10" fill="#fff" stroke="${K}" stroke-width="2"/>
  ${perna(150, 150, 62)}${perna(450, 112, 70)}${perna(172, 290, 46)}${perna(432, 240, 56)}
  ${prato(150, 150, 42, 8)}${prato(450, 112, 48, 9)}
  <rect x="228" y="108" width="124" height="132" rx="16" fill="url(#as)" stroke="${K}" stroke-width="3.4"/><rect x="237" y="117" width="106" height="114" rx="10" fill="none" stroke="#777" stroke-width="1.4"/>
  ${tambor(266, 146, 23, 8)}${tambor(314, 146, 23, 8)}
  ${tambor(432, 240, 36, 10)}
  ${tambor(290, 292, 30, 8)}
  ${prato(172, 290, 27, 6)}
  <rect x="146" y="338" width="52" height="22" rx="4" fill="#ddd" stroke="${K}" stroke-width="2.6" transform="rotate(-8 172 349)"/><line x1="172" y1="338" x2="172" y2="318" stroke="${K}" stroke-width="3"/>
  <rect x="330" y="336" width="42" height="24" rx="4" fill="#ddd" stroke="${K}" stroke-width="2.6"/><line x1="351" y1="336" x2="334" y2="244" stroke="${K}" stroke-width="3.6"/><circle cx="332" cy="238" r="6" fill="#fff" stroke="${K}" stroke-width="2.4"/>
  <circle cx="290" cy="398" r="34" fill="url(#as)" stroke="${K}" stroke-width="3.4"/><circle cx="290" cy="398" r="24" fill="none" stroke="#666" stroke-width="1.4"/>
  <path d="M248 384 L262 330 M332 384 L318 330" stroke="${K}" stroke-width="2.8" stroke-linecap="round" fill="none"/><circle cx="262" cy="326" r="5" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="318" cy="326" r="5" fill="#fff" stroke="${K}" stroke-width="2"/>
  <ellipse cx="290" cy="388" rx="50" ry="15" fill="#fff" stroke="${K}" stroke-width="2.8"/><circle cx="290" cy="386" r="12" fill="#fff" stroke="${K}" stroke-width="2.8"/>
  <text x="290" y="190" text-anchor="middle" font-size="17" font-weight="800" ${F}>4</text><text x="290" y="212" text-anchor="middle" font-size="14" font-weight="700" ${F}>bumbo</text>
  ${lab('1', 'banco', 150, 392, 258, 398, 30)}
  ${lab('2', 'caixa', 400, 300, 318, 296, 30)}
  ${lab('3', 'chimbal', 72, 300, 146, 290, 30)}
  ${lab('5', 'tom 1', 232, 52, 258, 124, -22)}${lab('6', 'tom 2', 348, 52, 322, 124, -22)}
  ${lab('7', 'surdo', 548, 262, 470, 250, 30)}
  ${lab('8', 'crash', 70, 92, 118, 124, 30)}${lab('9', 'ride', 560, 72, 494, 96, 30)}
  <path d="M606 410 V70" stroke="${K}" stroke-width="3" fill="none"/><path d="M596 86 L606 62 L616 86" stroke="${K}" stroke-width="3" fill="none"/><text x="624" y="250" font-size="14" font-weight="800" ${F} transform="rotate(90 624 250)" text-anchor="middle">FRENTE (pra onde você olha)</text>
  <text x="320" y="462" text-anchor="middle" font-size="15" font-weight="700" ${F}>▲ quem toca senta no banco (1), de costas pra esta borda ▲</text></svg>`;
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

/* ---------- baquetas ---------- */
const KK = '#000'; const FF = 'font-family="Hanken Grotesk"';
/** Contorno de uma ponta (do pescoço até o fim), centrada em y, começando em x: tipos round, acorn, barrel, oval, teardrop. Devolve o caminho superior [x,y] e o comprimento usado. */
function pontaPath(tipo, x, y, d, c) {
  const h = d / 2; // meia espessura do pescoço (c = comprimento da ponta)
  const F = { round: [[0, 0.5], [0.12, 0.8], [0.4, 1.35], [0.72, 1.45], [0.93, 1.05], [1, 0]], acorn: [[0, 0.5], [0.12, 0.7], [0.4, 1.2], [0.7, 1.3], [0.9, 0.85], [1, 0]], barrel: [[0, 0.5], [0.1, 1.15], [0.2, 1.4], [0.8, 1.4], [0.92, 1.05], [1, 0]], oval: [[0, 0.5], [0.12, 0.85], [0.45, 1.3], [0.75, 1.25], [0.94, 0.85], [1, 0]], teardrop: [[0, 0.5], [0.15, 0.95], [0.4, 1.4], [0.7, 1.0], [0.92, 0.45], [1, 0]] }[tipo] || [];
  const pts = F.map(([f, k]) => [x + f * c, k * h]);
  const up = pts.map(([px, hh]) => `${px.toFixed(1)} ${(y - hh).toFixed(1)}`); const dn = pts.slice().reverse().map(([px, hh]) => `${px.toFixed(1)} ${(y + hh).toFixed(1)}`);
  return `M${up[0]} ${up.slice(1).map((q) => `L${q}`).join(' ')} ${dn.map((q) => `L${q}`).join(' ')} Z`;
}
/** Uma baqueta inteira (pé, haste, ombro, pescoço e ponta) com veios da madeira. `len`/`diam` em px. */
function baquetaSvg(x0, y, len, diam, tipo = 'oval', { veios = true } = {}) {
  const r = diam / 2; const xh = x0 + len * 0.74; const xs = x0 + len * 0.905; const xp = x0 + len * 0.935; const c = len - (xp - x0); const hn = r * 0.42;
  const corpo = `M${x0 + 4} ${y - r} L${xh} ${y - r} C${xh + (xs - xh) * 0.6} ${y - r} ${xs - 6} ${y - hn} ${xp} ${y - hn} L${xp} ${y + hn} C${xs - 6} ${y + hn} ${xh + (xs - xh) * 0.6} ${y + r} ${xh} ${y + r} L${x0 + 4} ${y + r} Q${x0 - 3} ${y + r} ${x0 - 3} ${y} Q${x0 - 3} ${y - r} ${x0 + 4} ${y - r} Z`;
  const g = veios ? [-0.55, -0.2, 0.25, 0.6].map((k, i) => `<path d="M${x0 + 14 + i * 9} ${y + k * r} L${xh - 20 - i * 14} ${y + k * r}" stroke="#7a7a7a" stroke-width="${i % 2 ? 0.9 : 0.6}" fill="none"/>`).join('') : '';
  return `<path d="${corpo}" fill="url(#bqg)" stroke="${KK}" stroke-width="2.4" stroke-linejoin="round"/>${g}<path d="${pontaPath(tipo, xp - 0.5, y, hn * 2, c + 0.5)}" fill="url(#bqp)" stroke="${KK}" stroke-width="2.4" stroke-linejoin="round"/>`;
}
const DEFS_BQ = `<defs><linearGradient id="bqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbfb"/><stop offset=".45" stop-color="#cfcfcf"/><stop offset="1" stop-color="#858585"/></linearGradient><linearGradient id="bqp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#dcdcdc"/><stop offset="1" stop-color="#9a9a9a"/></linearGradient></defs>`;

/** Baqueta com as partes e o ponto de apoio (fulcro) marcado, sem mão. */
export function baquetaFulcro() {
  const x0 = 30; const L = 540; const y = 118; const D = 24; const fx = x0 + L * 0.34;
  return `<svg class="postura fulcro" viewBox="0 0 600 250" role="img" aria-label="Baqueta com o ponto do fulcro">${DEFS_BQ}
  <rect x="2" y="2" width="596" height="246" rx="10" fill="#fff" stroke="${KK}" stroke-width="2"/>
  <rect x="${fx - 24}" y="${y - D / 2 - 14}" width="48" height="${D + 28}" rx="10" fill="#e2e2e2" stroke="${KK}" stroke-width="2" stroke-dasharray="5 4"/>
  ${baquetaSvg(x0, y, L, D, 'oval')}
  <circle cx="${fx}" cy="${y}" r="8" fill="${KK}"/><circle cx="${fx}" cy="${y}" r="13" fill="none" stroke="${KK}" stroke-width="2.4"/>
  <line x1="${fx}" y1="${y - 26}" x2="${fx}" y2="${y - 40}" stroke="${KK}" stroke-width="2.4"/>
  <text x="${fx}" y="52" text-anchor="middle" font-size="18" font-weight="800" ${FF}>FULCRO: é aqui que se segura</text>
  <text x="${fx}" y="72" text-anchor="middle" font-size="14" ${FF}>polegar + lateral do indicador, a ≈ 1/3 do pé</text>
  <text x="${x0 + 40}" y="${y + 56}" text-anchor="middle" font-size="14" font-weight="700" ${FF}>pé</text><text x="${x0 + 40}" y="${y + 73}" text-anchor="middle" font-size="12.5" ${FF}>(parte grossa)</text>
  <text x="${x0 + L * 0.58}" y="${y + 56}" text-anchor="middle" font-size="14" font-weight="700" ${FF}>haste</text>
  <text x="${x0 + L * 0.83}" y="${y + 56}" text-anchor="middle" font-size="14" font-weight="700" ${FF}>ombro</text><text x="${x0 + L * 0.92}" y="${y - 46}" text-anchor="middle" font-size="14" font-weight="700" ${FF}>pescoço</text>
  <text x="${x0 + L * 0.985}" y="${y + 56}" text-anchor="end" font-size="14" font-weight="700" ${FF}>ponta</text>
  <path d="M${x0} 214 H${fx}" stroke="${KK}" stroke-width="2.4"/><path d="M${x0} 206 V222 M${fx} 206 V222" stroke="${KK}" stroke-width="2.4"/>
  <text x="${(x0 + fx) / 2}" y="238" text-anchor="middle" font-size="14" font-weight="700" ${FF}>≈ 1/3 do comprimento, medido do pé</text>
  </svg>`;
}
/** As 5 baquetas na mesma escala (comprimento real; espessura ampliada) com a medida de cada uma. */
export function comparaBaquetas() {
  const kx = 1.12; const ky = 2.6;
  const S = [['7A', 394, 13.7, 'oval'], ['7B', 394, 14.5, 'oval'], ['5A', 406, 14.0, 'oval'], ['5B', 406, 15.1, 'oval'], ['2B', 413, 16.0, 'oval']];
  let out = `<svg class="postura" viewBox="0 0 640 330" role="img" aria-label="Comparação das baquetas 7A 7B 5A 5B 2B">${DEFS_BQ}<rect x="2" y="2" width="636" height="326" rx="10" fill="#fff" stroke="${KK}" stroke-width="2"/>`;
  S.forEach(([n, l, d, t], i) => { const y = 44 + i * 58; out += `<text x="14" y="${y + 6}" font-size="22" font-weight="800" ${FF}>${n}</text>${baquetaSvg(64, y, l * kx, d * ky, t, { veios: false })}<text x="${64 + l * kx + 10}" y="${y - 4}" font-size="13" font-weight="700" ${FF}>${l} mm</text><text x="${64 + l * kx + 10}" y="${y + 12}" font-size="13" ${FF}>Ø ${d.toFixed(1)} mm</text>`; });
  return `${out}<text x="320" y="320" text-anchor="middle" font-size="12.5" ${FF}>comprimento na mesma escala · espessura ≈ 2,6× maior pra comparar · medidas aproximadas</text></svg>`;
}
/** Os 5 formatos de ponta, com o nome e o som de cada um. */
export function tiposPonta() {
  const T = [['round', 'redonda', 'som médio'], ['acorn', 'bolota', 'som quente'], ['barrel', 'barril', 'som cheio'], ['oval', 'oval', 'versátil'], ['teardrop', 'gota', 'fino e claro']];
  let out = `<svg class="postura" viewBox="0 0 640 220" role="img" aria-label="Tipos de ponta de baqueta">${DEFS_BQ}<rect x="2" y="2" width="636" height="216" rx="10" fill="#fff" stroke="${KK}" stroke-width="2"/>`;
  T.forEach(([t, n, d], i) => { const cx = 90 + i * 124; out += `<path d="${pontaPath(t, cx - 24, 90, 22, 70)}" fill="url(#bqp)" stroke="${KK}" stroke-width="3.2"/><path d="M${cx - 50} ${90 - 11} L${cx - 24} ${90 - 11} L${cx - 24} ${90 + 11} L${cx - 50} ${90 + 11}" fill="url(#bqg)" stroke="${KK}" stroke-width="2.6"/><circle cx="${cx + 12}" cy="${90 - 6}" r="3" fill="#fff" opacity=".9"/><text x="${cx - 8}" y="150" text-anchor="middle" font-size="17" font-weight="800" ${FF}>${n}</text><text x="${cx - 8}" y="170" text-anchor="middle" font-size="13" ${FF}>${d}</text>`; });
  return `${out}<text x="320" y="204" text-anchor="middle" font-size="12.5" ${FF}>a ponta é a parte que bate: muda a definição do som e a sensação</text></svg>`;
}
/** Vassourinha: aberta, fechada, e o movimento circular. */
export function vassourinhas() {
  const fio = (cx, n, aberto) => Array.from({ length: n }, (_, k) => { const a = ((k / (n - 1)) - 0.5) * (aberto ? 0.95 : 0.1); return `<path d="M${cx} 100 L${(cx + Math.cos(a) * 82).toFixed(1)} ${(100 + Math.sin(a) * 82).toFixed(1)}" stroke="${KK}" stroke-width="1.5" fill="none"/>`; }).join('');
  return `<svg class="postura" viewBox="0 0 640 250" role="img" aria-label="Vassourinha: aberta e fechada, e movimento circular"><rect x="2" y="2" width="636" height="246" rx="10" fill="#fff" stroke="${KK}" stroke-width="2"/>
  <text x="104" y="26" text-anchor="middle" font-size="16" font-weight="800" ${FF}>aberta (som "varrido")</text>
  <rect x="14" y="94" width="92" height="12" rx="6" fill="url(#bqg)" stroke="${KK}" stroke-width="2.4"/>${fio(106, 15, true).replace(/M106/g, 'M106')}
  <rect x="104" y="96" width="14" height="8" fill="#bbb" stroke="${KK}" stroke-width="1.6"/>
  <text x="104" y="190" text-anchor="middle" font-size="13" ${FF}>fios de metal abertos em leque</text>
  <text x="320" y="26" text-anchor="middle" font-size="16" font-weight="800" ${FF}>fechada (som "tap")</text>
  <rect x="236" y="94" width="92" height="12" rx="6" fill="url(#bqg)" stroke="${KK}" stroke-width="2.4"/>${fio(328, 15, false)}
  <rect x="326" y="96" width="14" height="8" fill="#bbb" stroke="${KK}" stroke-width="1.6"/>
  <text x="332" y="190" text-anchor="middle" font-size="13" ${FF}>fios juntos: toque macio</text>
  <text x="540" y="26" text-anchor="middle" font-size="16" font-weight="800" ${FF}>o movimento</text>
  <ellipse cx="540" cy="118" rx="76" ry="38" fill="#e8e8e8" stroke="${KK}" stroke-width="3"/><ellipse cx="540" cy="118" rx="54" ry="24" fill="none" stroke="#777" stroke-width="1.4" stroke-dasharray="4 4"/>
  <path d="M588 118 C588 96 560 86 540 88 C514 90 492 102 494 118 C496 136 520 146 546 144" fill="none" stroke="${KK}" stroke-width="3" marker-end="url(#setaV)"/>
  <defs><marker id="setaV" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${KK}"/></marker></defs>
  <text x="540" y="186" text-anchor="middle" font-size="12.5" ${FF}>direita: sentido horário</text><text x="540" y="202" text-anchor="middle" font-size="12.5" ${FF}>esquerda: anti-horário</text>
  <text x="320" y="232" text-anchor="middle" font-size="12.5" ${FF}>a vassourinha "varre" a pele da caixa: som contínuo, sem ataque, de balada e jazz</text></svg>`;
}
/** Pad de estudo em corte: camadas, e seta do rebote. */
export function padCorte() {
  return `<svg class="postura" viewBox="0 0 640 250" role="img" aria-label="Pad de estudo em corte"><defs><pattern id="gm" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" stroke="#888" stroke-width="1"/></pattern><marker id="sr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${KK}"/></marker></defs>
  <rect x="2" y="2" width="636" height="246" rx="10" fill="#fff" stroke="${KK}" stroke-width="2"/>
  <rect x="40" y="150" width="400" height="14" rx="3" fill="#fff" stroke="${KK}" stroke-width="3"/><rect x="40" y="164" width="400" height="38" fill="url(#gm)" stroke="${KK}" stroke-width="3"/><rect x="40" y="202" width="400" height="16" rx="3" fill="#bbb" stroke="${KK}" stroke-width="3"/>
  <text x="452" y="162" font-size="14" font-weight="700" ${FF}>1  superfície</text><text x="452" y="186" font-size="14" font-weight="700" ${FF}>2  borracha (amortece)</text><text x="452" y="214" font-size="14" font-weight="700" ${FF}>3  base (não desliza)</text>
  <g transform="rotate(-30 110 140)"><path d="M40 140 L250 128 Q270 128 274 138 Q270 148 250 148 L40 156 Z" fill="url(#bqg)" stroke="${KK}" stroke-width="2.6"/></g>
  <path d="M200 112 Q236 60 276 112" fill="none" stroke="${KK}" stroke-width="2.6" stroke-dasharray="5 4" marker-end="url(#sr)"/><text x="238" y="56" text-anchor="middle" font-size="14" font-weight="700" ${FF}>rebote</text>
  <path d="M110 38 L110 112" stroke="${KK}" stroke-width="2.6" marker-end="url(#sr)"/><text x="100" y="32" text-anchor="end" font-size="14" font-weight="700" ${FF}>golpe</text>
  <text x="320" y="240" text-anchor="middle" font-size="12.5" ${FF}>a baqueta bate na superfície, a borracha devolve parte da energia e a baqueta "volta" (rebote)</text></svg>`;
}
/** Rebote: alturas que vão diminuindo até a baqueta parar. */
export function reboteFig() {
  const xs = [60, 180, 280, 358, 418, 458, 484]; const hs = [150, 98, 56, 30, 16, 8, 3]; let d = `M${xs[0]} 190`; let arcs = '';
  for (let i = 0; i < xs.length - 1; i++) { const mx = (xs[i] + xs[i + 1]) / 2; arcs += `<path d="M${xs[i]} 190 Q${mx} ${190 - hs[i] * 1.9} ${xs[i + 1]} 190" fill="none" stroke="${KK}" stroke-width="${i === 0 ? 3.4 : 2.6}" ${i === 0 ? '' : 'stroke-dasharray="5 4"'}/>`; }
  return `<svg class="postura" viewBox="0 0 640 260" role="img" aria-label="Rebote da baqueta"><rect x="2" y="2" width="636" height="256" rx="10" fill="#fff" stroke="${KK}" stroke-width="2"/>
  <line x1="30" y1="190" x2="600" y2="190" stroke="${KK}" stroke-width="5"/>${arcs}
  ${xs.slice(0, -1).map((x, i) => `<circle cx="${x}" cy="190" r="5" fill="${KK}"/><text x="${x}" y="214" text-anchor="middle" font-size="13" font-weight="700" ${FF}>${i === 0 ? 'golpe' : `rebote ${i}`}</text>`).join('')}
  <text x="440" y="70" font-size="15" font-weight="700" ${FF}>cada rebote é menor</text><text x="440" y="90" font-size="15" font-weight="700" ${FF}>e mais rápido, até</text><text x="440" y="110" font-size="15" font-weight="700" ${FF}>a baqueta parar</text>
  <text x="320" y="246" text-anchor="middle" font-size="12.5" ${FF}>mão solta = muitos rebotes (rolo) · mão apertada = rebote morre na hora</text></svg>`;
}
/** Moeller: 4 quadros do movimento do braço e da baqueta. */
export function moellerFig() {
  const quadro = (x, nome, cotovelo, pulso, ponta, sub) => `<g transform="translate(${x} 0)"><rect x="6" y="6" width="150" height="214" rx="8" fill="#fff" stroke="${KK}" stroke-width="2"/><ellipse cx="81" cy="196" rx="56" ry="8" fill="#e6e6e6" stroke="${KK}" stroke-width="2.4"/>
    <path d="M${cotovelo[0]} ${cotovelo[1]} L${pulso[0]} ${pulso[1]}" stroke="${KK}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M${cotovelo[0]} ${cotovelo[1]} L${pulso[0]} ${pulso[1]}" stroke="#d8d8d8" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M${pulso[0]} ${pulso[1]} L${ponta[0]} ${ponta[1]}" stroke="${KK}" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="${ponta[0]}" cy="${ponta[1]}" r="4.2" fill="${KK}"/>
    <circle cx="${cotovelo[0]}" cy="${cotovelo[1]}" r="6.5" fill="#fff" stroke="${KK}" stroke-width="2.4"/><circle cx="${pulso[0]}" cy="${pulso[1]}" r="6.5" fill="#fff" stroke="${KK}" stroke-width="2.4"/>
    <text x="81" y="30" text-anchor="middle" font-size="15" font-weight="800" ${FF}>${nome}</text><text x="81" y="216" text-anchor="middle" font-size="13" font-weight="700" ${FF}>${sub}</text></g>`;
  return `<svg class="postura" viewBox="0 0 660 230" role="img" aria-label="Movimento Moeller em 4 quadros">
  ${quadro(0, '1 · preparo', [30, 120], [74, 70], [128, 56], 'antebraço sobe')}${quadro(164, '2 · chicote', [30, 120], [84, 100], [132, 150], 'braço desce')}
  ${quadro(328, '3 · golpe', [30, 120], [92, 126], [134, 186], 'baqueta bate')}${quadro(492, '4 · rebote', [30, 120], [86, 104], [128, 120], 'volta sozinha')}</svg>`;
}
/** Os 4 golpes: pad com estrutura, baqueta saindo do fulcro; início (tracejada) e fim (cheia) + seta do movimento e altura em cm. */
export function golpe(inicio, fim, nome) {
  const K = '#000'; const F = 'font-family="Hanken Grotesk"'; const pv = { x: 28, y: 86 }; const L = 84;
  const alt = { alto: -52, baixo: -9 }; const pt = (a) => { const r = (alt[a] * Math.PI) / 180; return { x: pv.x + Math.cos(r) * L, y: pv.y + Math.sin(r) * L }; };
  const a = pt(inicio); const b = pt(fim); const cm = { alto: '≈ 25 cm', baixo: '≈ 3 cm' };
  const bastao = (p, cheio) => `<line x1="${pv.x}" y1="${pv.y}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${K}" stroke-width="${cheio ? 5.6 : 2.6}" ${cheio ? '' : 'stroke-dasharray="5 4"'} stroke-linecap="round"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${cheio ? 4.2 : 3}" fill="${cheio ? K : '#fff'}" stroke="${K}" stroke-width="1.6"/>`;
  const seta = inicio === fim ? '' : `<path d="M${(a.x + 10).toFixed(1)} ${a.y.toFixed(1)} Q${(Math.max(a.x, b.x) + 34).toFixed(1)} ${((a.y + b.y) / 2).toFixed(1)} ${(b.x + 10).toFixed(1)} ${b.y.toFixed(1)}" fill="none" stroke="${K}" stroke-width="2.4" marker-end="url(#pt${nome})"/>`;
  const txt = inicio === fim ? `altura ${cm[fim]}` : `${cm[inicio]} → ${cm[fim]}`;
  return `<svg viewBox="0 0 190 170" class="golpe" role="img"><defs><marker id="pt${nome}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${K}"/></marker><linearGradient id="pd" x1="0" x2="1"><stop offset="0" stop-color="#9a9a9a"/><stop offset=".3" stop-color="#e6e6e6"/><stop offset="1" stop-color="#888"/></linearGradient></defs>
  <path d="M14 106 V128 A76 8 0 0 0 166 128 V106" fill="url(#pd)" stroke="${K}" stroke-width="2.6"/><ellipse cx="90" cy="106" rx="76" ry="9" fill="#fff" stroke="${K}" stroke-width="3.6"/><ellipse cx="90" cy="106" rx="46" ry="4.5" fill="none" stroke="#888" stroke-width="1"/>
  ${bastao(a, false)}${seta}${bastao(b, true)}<circle cx="${pv.x}" cy="${pv.y}" r="6.5" fill="#fff" stroke="${K}" stroke-width="2.6"/>
  <text x="95" y="150" text-anchor="middle" font-size="17" font-weight="800" ${F}>${nome}</text><text x="95" y="166" text-anchor="middle" font-size="11.5" ${F}>${txt}</text></svg>`;
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
