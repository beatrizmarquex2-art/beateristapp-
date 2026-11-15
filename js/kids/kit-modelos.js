// Desenho dos 3 modelos da bateria de toque: acústica, eletrônica (pads) e cajón. Mesmas peças e mesmos ids (cr rd hh tt mt ft sn bd),
// pra gravação, partitura e teclado funcionarem igual. As cores são as da partitura colorida: bumbo verde, caixa vermelha, chimbal azul,
// tom laranja, surdo roxo, prato dourado, condução azul-petróleo.
// Regras do CSS dos temas (kids.css): em cada peça, UMA elipse/círculo com fill-opacity="1" é a "pele" (ali o dedo mede se tocou no meio ou na borda);
// o resto fica sem fill-opacity pra o tema não repintar.
import { COLORS } from '../beats.js';

const COR = { cr: COLORS.cr, rd: COLORS.rd, hh: COLORS.hh, tt: COLORS.tt, mt: COLORS.mt, ft: COLORS.ft, sn: COLORS.sn, bd: COLORS.bd };
const DEFS = `<defs>
  <linearGradient id="km-casco" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".28" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
  <radialGradient id="km-prato" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>
  <linearGradient id="km-madeira" x1="0" x2="1"><stop offset="0" stop-color="#b8763a"/><stop offset=".5" stop-color="#d9a066"/><stop offset="1" stop-color="#a8642c"/></linearGradient>
  <linearGradient id="km-tapa" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e8b57a"/><stop offset="1" stop-color="#c98c50"/></linearGradient>
  <pattern id="km-malha" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3h6M3 0v6" stroke="#fff" stroke-opacity=".13" stroke-width=".8"/></pattern>
</defs>`;
const sw = 'stroke-linecap="round" stroke-linejoin="round"';

/** Tambor (tom, surdo, caixa): casco de lado com degradê, argolas cromadas, pele de cima. */
function tambor(id, cx, cy, w, h, fundo) {
  const rx = w / 2; const ry = h / 2; const x = cx - rx;
  const lugs = [0.18, 0.5, 0.82].map((k) => `<rect x="${x + w * k - 2.5}" y="${cy + 2}" width="5" height="${fundo - 6}" rx="2" fill="#d8d3c6" opacity=".9"/>`).join('');
  return `<g class="kp" data-p="${id}" style="--c:${COR[id]}">
    <path d="M${x} ${cy} V${cy + fundo} A${rx} ${ry} 0 0 0 ${x + w} ${cy + fundo} V${cy} Z" fill="var(--c)" stroke="#1b1818" stroke-width="3" ${sw}/>
    <path d="M${x} ${cy} V${cy + fundo} A${rx} ${ry} 0 0 0 ${x + w} ${cy + fundo} V${cy} Z" fill="url(#km-casco)"/>${lugs}
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fffdf7" fill-opacity="1" stroke="#cfc9bb" stroke-width="3"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.8}" ry="${ry * 0.8}" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#1b1818" stroke-width="3"/></g>`;
}
/** Prato: haste, disco dourado com anéis e cúpula. */
function prato(id, cx, cy, rx, inclina, haste) {
  const ry = rx * 0.26;
  return `<g class="kp" data-p="${id}" style="--c:${COR[id]}">
    <path d="M${cx} ${cy + 4} V${cy + haste}" stroke="#8d8778" stroke-width="5" ${sw}/>
    <g transform="rotate(${inclina} ${cx} ${cy})">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--c)" stroke="#1b1818" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#km-prato)"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.72}" ry="${ry * 0.72}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1.4"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.46}" ry="${ry * 0.46}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1.4"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.2}" ry="${ry * 0.2}" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2"/></g></g>`;
}
/** Chimbal: dois discos e o pedal. */
function chimbal(cx, cy, rx) {
  const ry = rx * 0.24;
  return `<g class="kp" data-p="hh" style="--c:${COR.hh}">
    <path d="M${cx} ${cy + 10} V${cy + 118}" stroke="#8d8778" stroke-width="5" ${sw}/><path d="M${cx - 14} ${cy + 118} h40 l8 10 h-52 z" fill="#4a4658"/>
    <ellipse cx="${cx}" cy="${cy + 9}" rx="${rx}" ry="${ry}" fill="var(--c)" stroke="#1b1818" stroke-width="3"/><ellipse cx="${cx}" cy="${cy + 9}" rx="${rx}" ry="${ry}" fill="url(#km-prato)"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--c)" stroke="#1b1818" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#km-prato)"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.5}" ry="${ry * 0.5}" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2"/></g>`;
}
/** Bumbo de frente: aro colorido e pele com o logo (o logo entra por putLogo). */
function bumbo(cx, cy, r) {
  return `<g class="kp" data-p="bd" style="--c:${COR.bd}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--c)" stroke="#1b1818" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#km-prato)"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="${cx - 3}" y="${cy - r - 2}" width="6" height="9" rx="2" fill="#d8d3c6" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="#fffdf7" fill-opacity="1" stroke="#cfc9bb" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="none" stroke="#1b1818" stroke-width="2.5"/>
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="16" font-weight="800" fill="#1b1818" stroke="none">BEATERISTA</text></g>`;
}
export function acustica() {
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria acústica">${DEFS}
    ${prato('cr', 82, 46, 64, -8, 128)}${prato('rd', 342, 56, 66, 6, 122)}${chimbal(40, 122, 38)}
    ${tambor('tt', 140, 98, 68, 26, 40)}${tambor('mt', 222, 98, 68, 26, 40)}${tambor('ft', 332, 170, 92, 34, 62)}${tambor('sn', 76, 184, 94, 30, 34)}${bumbo(210, 218, 76)}</svg>`;
}
/** Eletrônica: pads de borracha com anel colorido, malha escura e o módulo do kick em torre. */
function pad(id, cx, cy, r) {
  return `<g class="kp" data-p="${id}" style="--c:${COR[id]}">
    <circle cx="${cx}" cy="${cy + 5}" r="${r}" fill="#0c0b10" opacity=".55"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--c)" stroke="#1b1818" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#km-prato)"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="#2a2730" stroke="#1b1818" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 11}" fill="#2a2730" fill-opacity="1"/><circle cx="${cx}" cy="${cy}" r="${r - 11}" fill="url(#km-malha)"/>
    <circle cx="${cx}" cy="${cy}" r="${(r - 11) * 0.3}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.4"/></g>`;
}
export function eletronica() {
  const haste = (x, y, y2) => `<path d="M${x} ${y} V${y2}" stroke="#6d6879" stroke-width="5" ${sw}/>`;
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria eletrônica">${DEFS}
    ${haste(82, 70, 150)}${haste(342, 84, 160)}${haste(140, 126, 168)}${haste(222, 126, 168)}
    ${pad('cr', 82, 46, 40)}${pad('rd', 342, 56, 45)}${pad('hh', 44, 128, 34)}
    ${pad('tt', 140, 100, 36)}${pad('mt', 222, 100, 36)}${pad('ft', 332, 176, 46)}${pad('sn', 78, 188, 46)}
    <g class="kp" data-p="bd" style="--c:${COR.bd}">
      <rect x="150" y="164" width="120" height="108" rx="16" fill="#0c0b10" opacity=".55" transform="translate(0 6)"/>
      <rect x="150" y="164" width="120" height="108" rx="16" fill="var(--c)" stroke="#1b1818" stroke-width="3"/><rect x="150" y="164" width="120" height="108" rx="16" fill="url(#km-casco)"/>
      <rect x="160" y="174" width="100" height="88" rx="10" fill="#2a2730" stroke="#1b1818" stroke-width="2"/>
      <ellipse cx="210" cy="218" rx="42" ry="34" fill="#2a2730" fill-opacity="1"/><ellipse cx="210" cy="218" rx="42" ry="34" fill="url(#km-malha)"/>
      <text x="210" y="222" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" fill-opacity=".85" stroke="none">KICK</text></g>
    <g fill="#e8a92b"><circle cx="190" cy="154" r="3.2"/><circle cx="210" cy="154" r="3.2"/><circle cx="230" cy="154" r="3.2"/></g></svg>`;
}
/** Cajón de frente: caixa de madeira com 4 zonas (alto = agudo/slap, meio = grave, laterais = toque seco, abafado). */
export function cajon() {
  const zona = (id, formas) => `<g class="kp" data-p="${id}" style="--c:${COR[id]}">${formas}</g>`;
  const moldura = (x, y, w, h, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="var(--c)" stroke="#1b1818" stroke-width="3"/>`;
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Cajón">${DEFS}
    <rect x="76" y="12" width="268" height="274" rx="12" fill="url(#km-madeira)" stroke="#1b1818" stroke-width="3"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${92 + i * 29} 22 q4 120 -3 258" stroke="#000" stroke-opacity=".1" stroke-width="1.5" fill="none"/>`).join('')}
    <rect x="90" y="26" width="240" height="246" rx="8" fill="url(#km-tapa)" stroke="#1b1818" stroke-width="2.5"/>
    ${zona('sn', `${moldura(104, 34, 212, 66, 18)}<ellipse cx="210" cy="67" rx="94" ry="26" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2"/><text x="210" y="72" text-anchor="middle" font-size="14" font-weight="800" fill="#1b1818" stroke="none">agudo</text>`)}
    ${zona('tt', `${moldura(150, 108, 120, 44, 14)}<ellipse cx="210" cy="130" rx="50" ry="16" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2"/><text x="210" y="135" text-anchor="middle" font-size="12" font-weight="800" fill="#1b1818" stroke="none">abafado</text>`)}
    ${zona('hh', `${moldura(100, 110, 42, 100, 12)}<ellipse cx="121" cy="160" rx="14" ry="38" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2"/>${moldura(278, 110, 42, 100, 12)}<ellipse cx="299" cy="160" rx="14" ry="38" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2"/>`)}
    ${zona('bd', `<circle cx="210" cy="218" r="56" fill="var(--c)" stroke="#1b1818" stroke-width="3"/><circle cx="210" cy="218" r="46" fill="#fffdf7" fill-opacity="1" stroke="#1b1818" stroke-width="2.5"/><text x="210" y="222" text-anchor="middle" font-size="14" font-weight="800" fill="#1b1818" stroke="none">grave</text>`)}
    <g fill="#5a3a1a"><circle cx="98" cy="268" r="3"/><circle cx="322" cy="268" r="3"/><circle cx="98" cy="32" r="3"/><circle cx="322" cy="32" r="3"/></g></svg>`;
}
export const arte = (modelo) => (modelo === 'eletronica' ? eletronica() : modelo === 'cajon' ? cajon() : acustica());
