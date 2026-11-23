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

/** Baqueta na mão, com o ponto de apoio (fulcro) a 1/3 do pé: polegar e indicador pinçam, os outros dedos envolvem por baixo. */
export function baquetaFulcro() {
  const K = '#000'; const F = 'font-family="Hanken Grotesk"'; const dedo = (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="url(#mao)" stroke="${K}" stroke-width="3" transform="rotate(${r} ${x + w / 2} ${y + h / 2})"/>`;
  return `<svg class="postura fulcro" viewBox="0 0 600 270" role="img" aria-label="Baqueta na mão com o fulcro"><defs><linearGradient id="bq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f4"/><stop offset=".55" stop-color="#c4c4c4"/><stop offset="1" stop-color="#8a8a8a"/></linearGradient><linearGradient id="mao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafafa"/><stop offset="1" stop-color="#d2d2d2"/></linearGradient></defs>
  <rect x="2" y="2" width="596" height="266" rx="10" fill="#fff" stroke="${K}" stroke-width="2"/>
  <g transform="rotate(-3 300 130)">
   ${dedo(236, 124, 26, 62, -8)}${dedo(214, 126, 26, 66, -4)}${dedo(192, 128, 26, 60, 0)}
   <path d="M20 128 L548 112 Q572 111 580 120 Q572 132 548 133 L20 150 Q10 140 20 128 Z" fill="url(#bq)" stroke="${K}" stroke-width="3"/>
   <path d="M60 135 L520 120 M60 141 L520 126" stroke="#777" stroke-width="1" fill="none"/><circle cx="573" cy="122" r="2.4" fill="${K}"/>
   <path d="M20 34 L150 30 Q186 28 204 50 L212 100 Q214 118 200 120 L150 122 L20 122 Z" fill="url(#mao)" stroke="${K}" stroke-width="3"/>
   <path d="M150 52 Q176 54 190 66 M154 78 Q178 80 192 90" fill="none" stroke="#666" stroke-width="1.8"/>
   <path d="M150 122 Q168 106 214 108 Q244 110 252 118 Q250 134 214 132 Q176 134 150 122 Z" fill="url(#mao)" stroke="${K}" stroke-width="3"/>
   <path d="M196 62 Q244 62 258 92 Q264 112 244 118 Q236 100 214 96 Q200 90 196 62 Z" fill="url(#mao)" stroke="${K}" stroke-width="3"/>
   <circle cx="236" cy="118" r="9" fill="${K}"/></g>
  <line x1="236" y1="52" x2="236" y2="214" stroke="${K}" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="236" y="42" text-anchor="middle" font-size="18" font-weight="800" ${F} paint-order="stroke" stroke="#fff" stroke-width="6">FULCRO: polegar + indicador</text>
  <text x="34" y="104" font-size="14" ${F}>antebraço e punho (soltos)</text>
  <text x="318" y="92" font-size="15" ${F}>ponta da baqueta</text><path d="M520 94 L546 112" stroke="${K}" stroke-width="1.8" fill="none"/>
  <text x="290" y="196" font-size="15" ${F}>dedos de baixo (médio, anelar e mínimo)</text><text x="290" y="216" font-size="15" ${F}>envolvem a baqueta, sem apertar</text><path d="M286 190 L254 168" stroke="${K}" stroke-width="1.8" fill="none"/>
  <path d="M20 252 H236" stroke="${K}" stroke-width="2.4"/><path d="M20 244 V260 M236 244 V260" stroke="${K}" stroke-width="2.4"/><text x="128" y="244" text-anchor="middle" font-size="14" font-weight="700" ${F}>≈ 1/3 do comprimento</text><text x="250" y="258" font-size="13" ${F}>medido a partir do pé (parte de trás)</text>
  </svg>`;
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
