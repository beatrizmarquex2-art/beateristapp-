// Desenho dos 3 modelos da bateria de toque, vistos "do banquinho" (de cima): todo tambor e todo prato é um CÍRCULO.
// acústica (cascos laqueados, argolas cromadas, pratos com anéis), eletrônica (pads com malha e anel de luz) e cajón (só grave e agudo).
// Mesmas peças e mesmos ids (cr rd hh tt mt ft sn bd) em todos, pra gravação, partitura e teclado funcionarem igual.
// Cores = partitura colorida do Beat Lab: bumbo verde, caixa vermelha, chimbal azul, tom laranja, surdo roxo, prato dourado, condução azul-petróleo.
// Regra do CSS dos temas (kids.css): ele repinta tudo que tem [fill-opacity] e [stroke]. Por isso aqui NÃO se usa fill-opacity; só traços finos e escuros
// (decoração). O dedo mede o centro da peça pelo elemento marcado com data-head (ver drOf em toque.js).
import { COLORS } from '../beats.js';

const COR = { cr: COLORS.cr, rd: COLORS.rd, hh: COLORS.hh, tt: COLORS.tt, mt: COLORS.mt, ft: COLORS.ft, sn: COLORS.sn, bd: COLORS.bd };
const NOME = { cr: 'crash', rd: 'condução', hh: 'chimbal', tt: 'tom 1', mt: 'tom 2', ft: 'surdo', sn: 'caixa', bd: 'bumbo' };

/* ---------- cores ---------- */
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (h, alvo, k) => { const a = rgb(h); const b = rgb(alvo); return hex(a.map((v, i) => v + (b[i] - v) * k)); };
const claro = (h, k) => mix(h, '#ffffff', k);
const escuro = (h, k) => mix(h, '#000000', k);

/* ---------- gradientes ---------- */
const defsPeca = (id, c) => `
  <linearGradient id="km-w-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${claro(c, 0.45)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${escuro(c, 0.5)}"/></linearGradient>
  <radialGradient id="km-p-${id}" cx=".38" cy=".32" r=".9"><stop offset="0" stop-color="${claro(c, 0.62)}"/><stop offset=".38" stop-color="${claro(c, 0.12)}"/><stop offset=".72" stop-color="${escuro(c, 0.2)}"/><stop offset="1" stop-color="${escuro(c, 0.5)}"/></radialGradient>`;
const DEFS = `<defs>
  <linearGradient id="km-cromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfbfb"/><stop offset=".22" stop-color="#9b9ba4"/><stop offset=".45" stop-color="#ffffff"/><stop offset=".7" stop-color="#7a7a84"/><stop offset="1" stop-color="#dcdce1"/></linearGradient>
  <linearGradient id="km-cromo2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2f2f2"/><stop offset=".5" stop-color="#8b8b95"/><stop offset="1" stop-color="#e8e8ec"/></linearGradient>
  <radialGradient id="km-pele" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="#fffefa"/><stop offset=".6" stop-color="#f3ecda"/><stop offset="1" stop-color="#d6ccb2"/></radialGradient>
  <radialGradient id="km-brilho" cx=".3" cy=".25" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="km-sombra" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="km-malha" cx=".4" cy=".34" r=".9"><stop offset="0" stop-color="#4a4559"/><stop offset=".6" stop-color="#25222e"/><stop offset="1" stop-color="#121018"/></radialGradient>
  <pattern id="km-trama" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5h5M2.5 0v5" stroke="#fff" stroke-opacity=".12" stroke-width=".7"/></pattern>
  <linearGradient id="km-feixe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="km-madeira" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c98f52"/><stop offset=".5" stop-color="#e2ad72"/><stop offset="1" stop-color="#a9692f"/></linearGradient>
  <linearGradient id="km-tapa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efc088"/><stop offset=".55" stop-color="#d9a468"/><stop offset="1" stop-color="#bf8244"/></linearGradient>
  <linearGradient id="km-topo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3cd9a"/><stop offset="1" stop-color="#dba66a"/></linearGradient>
  ${Object.entries(COR).map(([id, c]) => defsPeca(id, c)).join('')}
</defs>`;

const volta = (n, f) => Array.from({ length: n }, (_, i) => f((i * 360) / n, i)).join('');
const rotulo = (id, x, y, claroTxt) => `<text class="${claroTxt ? 'rt-claro' : 'rt-escuro'}" x="${x}" y="${y}" text-anchor="middle" font-family="'Gochi Hand','Comic Sans MS',cursive" font-size="13.5" font-weight="700" fill="${claroTxt ? '#fff' : '#5b513a'}" fill-opacity="1" opacity=".9" stroke="none">${NOME[id]}</text>`.replace(' fill-opacity="1"', '');

/** Tambor visto de cima: laca colorida, argola cromada, parafusos de afinação, pele com brilho. `head` marca o miolo (data-head). */
function tambor(id, cx, cy, R, { parafusos = 8, snare = false, kick = false } = {}) {
  const c = COR[id]; const rh = R - 9; const rp = R - 16;
  return `<g class="kp" data-p="${id}" style="--c:${c}">
    <circle cx="${cx + 4}" cy="${cy + 7}" r="${R + 8}" fill="url(#km-sombra)"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 2}" fill="#15120f"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#km-w-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.93}" fill="url(#km-brilho)"/>
    ${volta(parafusos, (a) => `<g transform="rotate(${a} ${cx} ${cy})"><rect x="${cx - 3.2}" y="${cy - R + 1.6}" width="6.4" height="8.4" rx="2.2" fill="url(#km-cromo)"/><circle cx="${cx}" cy="${cy - R + 5.8}" r="1.3" fill="#4d4d55"/></g>`)}
    <circle cx="${cx}" cy="${cy}" r="${rh + 1.4}" fill="#1b1814"/>
    <circle cx="${cx}" cy="${cy}" r="${rh}" fill="url(#km-cromo)"/>
    <circle cx="${cx}" cy="${cy}" r="${rh - 4.2}" fill="url(#km-cromo2)"/>
    <circle cx="${cx}" cy="${cy}" r="${rp + 1.2}" fill="#2a2620"/>
    <circle cx="${cx}" cy="${cy}" r="${rp}" fill="${kick ? 'url(#km-p-bd)' : 'url(#km-pele)'}" data-head="1"/>
    <circle cx="${cx}" cy="${cy}" r="${rp * 0.8}" fill="none" stroke="#6a604a" stroke-opacity=".12" stroke-width="1.2"/>
    ${kick ? '' : `<circle cx="${cx}" cy="${cy}" r="${rp * 0.2}" fill="#e6dbc0"/><circle cx="${cx}" cy="${cy}" r="${rp * 0.2}" fill="none" stroke="#6a604a" stroke-opacity=".18" stroke-width="1"/>`}
    <circle cx="${cx}" cy="${cy}" r="${rp}" fill="url(#km-brilho)"/>
    ${snare ? `<g><rect x="${cx + R - 5}" y="${cy - 10}" width="14" height="20" rx="4" fill="url(#km-cromo)"/><rect x="${cx + R - 1}" y="${cy - 6}" width="5" height="12" rx="2" fill="#3a3a44"/><circle cx="${cx + R + 2}" cy="${cy}" r="2.2" fill="${claro('#8a8a94', 0.4)}"/></g>` : ''}
    ${kick ? '' : rotulo(id, cx, cy + rp * 0.6, false)}
    <circle class="km-brilha" cx="${cx}" cy="${cy}" r="${R + 5}" fill="none" stroke="${claro(c, 0.3)}" stroke-width="5" stroke-opacity="0"/>
  </g>`;
}
/** Bumbo: o mesmo tambor, grande, com o furo da pele da frente e espaço pro logo. */
function bumbo(cx, cy, R) {
  const base = tambor('bd', cx, cy, R, { parafusos: 12, kick: true });
  const furo = `<circle cx="${cx - R * 0.5}" cy="${cy + R * 0.42}" r="12" fill="url(#km-cromo)"/><circle cx="${cx - R * 0.5}" cy="${cy + R * 0.42}" r="9" fill="#17140f"/><circle cx="${cx - R * 0.5 - 3}" cy="${cy + R * 0.42 - 3}" r="2.6" fill="#fff" opacity=".45"/>`;
  return base.replace('<circle class="km-brilha"', `${furo}<text x="${cx}" y="${cy + R * 0.66}" text-anchor="middle" font-family="'Gochi Hand','Comic Sans MS',cursive" font-size="13" fill="#6a604a" opacity=".9" stroke="none">bumbo</text><circle class="km-brilha"`);
}
/** Prato visto de cima: bronze com anéis de lixa, feixe de luz e cúpula. */
function prato(id, cx, cy, R, { chimbal = false } = {}) {
  const c = COR[id];
  const aneis = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4].map((k, i) => `<circle cx="${cx}" cy="${cy}" r="${R * k}" fill="none" stroke="${i % 2 ? '#fff' : '#000'}" stroke-opacity=".11" stroke-width=".9"/>`).join('');
  const disco = (x, y, base) => `<circle cx="${x}" cy="${y}" r="${R + 1.6}" fill="#15120f"/><circle cx="${x}" cy="${y}" r="${R}" fill="${base ? escuro(c, 0.25) : `url(#km-p-${id})`}"/>`;
  return `<g class="kp" data-p="${id}" style="--c:${c}">
    <circle cx="${cx + 4}" cy="${cy + 7}" r="${R + 8}" fill="url(#km-sombra)"/>
    ${chimbal ? disco(cx + 3, cy + 4, true) : ''}
    ${disco(cx, cy, false)}
    ${aneis}
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#km-brilho)" data-head="1"/>
    <g transform="rotate(-38 ${cx} ${cy})"><rect x="${cx - R * 0.16}" y="${cy - R}" width="${R * 0.32}" height="${R * 2}" fill="url(#km-feixe)" opacity=".5"/></g>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.24}" fill="#15120f"/><circle cx="${cx}" cy="${cy}" r="${R * 0.22}" fill="url(#km-p-${id})"/><circle cx="${cx - R * 0.06}" cy="${cy - R * 0.07}" r="${R * 0.09}" fill="#fff" opacity=".55"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.05}" fill="#15120f"/>
    ${rotulo(id, cx, cy + R * 0.62, true)}
    <circle class="km-brilha" cx="${cx}" cy="${cy}" r="${R + 5}" fill="none" stroke="${claro(c, 0.3)}" stroke-width="5" stroke-opacity="0"/>
  </g>`;
}
const POS = { cr: [74, 50, 44], rd: [350, 58, 50], hh: [36, 128, 32], tt: [158, 94, 34], mt: [240, 94, 34], ft: [338, 180, 50], sn: [86, 190, 44], bd: [210, 222, 74] };

export function acustica() {
  const [a, b, c] = [POS.cr, POS.rd, POS.hh];
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria acústica vista de cima">${DEFS}
    ${prato('cr', ...a)}${prato('rd', ...b)}${prato('hh', ...c, { chimbal: true })}
    ${tambor('tt', ...POS.tt, { parafusos: 6 })}${tambor('mt', ...POS.mt, { parafusos: 6 })}${tambor('ft', ...POS.ft, { parafusos: 8 })}${tambor('sn', ...POS.sn, { parafusos: 8, snare: true })}${bumbo(...POS.bd)}</svg>`;
}

/** Pad eletrônico: aro de borracha com anel de luz da cor da peça, malha escura e sensor no centro. */
function pad(id, cx, cy, R, { prato: ehPrato = false } = {}) {
  const c = COR[id]; const rm = R - 13;
  const dentes = volta(24, (a) => `<rect x="${cx - 1}" y="${cy - R + 3}" width="2" height="5" rx="1" fill="#000" opacity=".35" transform="rotate(${a} ${cx} ${cy})"/>`);
  return `<g class="kp" data-p="${id}" style="--c:${c}">
    <circle cx="${cx + 4}" cy="${cy + 7}" r="${R + 8}" fill="url(#km-sombra)"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 2}" fill="#0d0b11"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#2b2833"/>${dentes}
    <circle cx="${cx}" cy="${cy}" r="${R - 9}" fill="${escuro(c, 0.15)}"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 11}" fill="url(#km-w-${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 14}" fill="#0d0b11"/>
    <circle cx="${cx}" cy="${cy}" r="${rm}" fill="url(#km-malha)" data-head="1"/>
    <circle cx="${cx}" cy="${cy}" r="${rm}" fill="url(#km-trama)"/>
    <circle cx="${cx}" cy="${cy}" r="${rm * 0.55}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1.2"/>
    ${ehPrato ? `<circle cx="${cx}" cy="${cy}" r="${rm * 0.3}" fill="url(#km-p-${id})"/><circle cx="${cx}" cy="${cy}" r="${rm * 0.3}" fill="url(#km-brilho)"/>` : `<circle cx="${cx}" cy="${cy}" r="${rm * 0.11}" fill="${claro(c, 0.2)}"/><circle cx="${cx}" cy="${cy}" r="${rm * 0.11}" fill="url(#km-brilho)"/>`}
    <circle cx="${cx}" cy="${cy}" r="${rm}" fill="url(#km-brilho)"/>
    <text class="rt-claro" x="${cx}" y="${cy + rm * 0.66}" text-anchor="middle" font-family="'Gochi Hand','Comic Sans MS',cursive" font-size="13.5" font-weight="700" fill="#fff" opacity=".85" stroke="none">${NOME[id]}</text>
    <circle class="km-brilha" cx="${cx}" cy="${cy}" r="${R + 5}" fill="none" stroke="${claro(c, 0.3)}" stroke-width="5" stroke-opacity="0"/>
  </g>`;
}
export function eletronica() {
  const haste = (x, y, x2, y2) => `<path d="M${x} ${y} L${x2} ${y2}" stroke="#55505f" stroke-width="5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria eletrônica vista de cima">${DEFS}
    ${haste(120, 70, 158, 94)}${haste(280, 80, 240, 94)}${haste(56, 150, 86, 190)}
    ${pad('cr', ...POS.cr, { prato: true })}${pad('rd', ...POS.rd, { prato: true })}${pad('hh', ...POS.hh, { prato: true })}
    ${pad('tt', ...POS.tt)}${pad('mt', ...POS.mt)}${pad('ft', ...POS.ft)}${pad('sn', ...POS.sn)}${pad('bd', ...POS.bd)}</svg>`;
}

/** Cajón de frente: caixa de madeira com o tampo em perspectiva e a tapa com 2 zonas: AGUDO (faixa no alto) e GRAVE (círculo no meio). */
export function cajon() {
  const veios = volta(11, (_, i) => `<path d="M${100 + i * 20.5} 62 C ${96 + i * 20.5} 130, ${108 + i * 20.5} 200, ${101 + i * 20.5} 272" stroke="#6a3d17" stroke-opacity="${i % 2 ? 0.1 : 0.17}" stroke-width="${i % 3 ? 1 : 1.6}" fill="none"/>`);
  const parafuso = (x, y) => `<circle cx="${x}" cy="${y}" r="4.4" fill="url(#km-cromo)"/><circle cx="${x}" cy="${y}" r="4.4" fill="none" stroke="#3a3a44" stroke-opacity=".5" stroke-width=".8"/><path d="M${x - 2.4} ${y + 1} L${x + 2.4} ${y - 1}" stroke="#2c2c34" stroke-width="1" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Cajón">${DEFS}
    <rect x="80" y="262" width="260" height="24" rx="12" fill="url(#km-sombra)" opacity=".9"/>
    <path d="M96 40 L324 40 L338 62 L82 62 Z" fill="url(#km-topo)" stroke="#6a3d17" stroke-opacity=".5" stroke-width="1.2"/>
    <path d="M118 46 L302 46" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
    <rect x="82" y="62" width="256" height="210" rx="8" fill="url(#km-madeira)"/>
    <rect x="82" y="62" width="256" height="210" rx="8" fill="none" stroke="#5a3210" stroke-opacity=".55" stroke-width="2"/>
    ${veios}
    <rect x="96" y="74" width="228" height="186" rx="6" fill="url(#km-tapa)"/>
    <rect x="96" y="74" width="228" height="186" rx="6" fill="none" stroke="#5a3210" stroke-opacity=".4" stroke-width="1.6"/>
    <rect x="98" y="76" width="224" height="6" rx="3" fill="#fff" opacity=".28"/>
    ${parafuso(108, 86)}${parafuso(312, 86)}${parafuso(108, 250)}${parafuso(312, 250)}
    <g class="kp" data-p="sn" style="--c:${COR.sn}">
      <rect x="116" y="92" width="188" height="50" rx="14" fill="#15120f"/>
      <rect x="118" y="94" width="184" height="46" rx="12" fill="url(#km-w-sn)"/>
      <rect x="124" y="100" width="172" height="34" rx="9" fill="#e8b47a" data-head="1"/>
      <rect x="124" y="100" width="172" height="34" rx="9" fill="url(#km-brilho)"/>
      <text x="210" y="123" text-anchor="middle" font-family="'Gochi Hand','Comic Sans MS',cursive" font-size="18" fill="#5a2a0c" stroke="none">agudo</text>
      <rect class="km-brilha" x="112" y="88" width="196" height="58" rx="16" fill="none" stroke="${claro(COR.sn, 0.3)}" stroke-width="5" stroke-opacity="0"/></g>
    <g class="kp" data-p="bd" style="--c:${COR.bd}">
      <circle cx="210" cy="206" r="54" fill="#15120f"/><circle cx="210" cy="206" r="52" fill="url(#km-w-bd)"/>
      <circle cx="210" cy="206" r="41" fill="#e8b47a" data-head="1"/><circle cx="210" cy="206" r="41" fill="url(#km-brilho)"/>
      <circle cx="210" cy="206" r="41" fill="none" stroke="#6a3d17" stroke-opacity=".25" stroke-width="1.2"/>
      <text x="210" y="212" text-anchor="middle" font-family="'Gochi Hand','Comic Sans MS',cursive" font-size="20" fill="#5a2a0c" stroke="none">grave</text>
      <circle class="km-brilha" cx="210" cy="206" r="58" fill="none" stroke="${claro(COR.bd, 0.3)}" stroke-width="5" stroke-opacity="0"/></g>
    <rect x="96" y="272" width="26" height="9" rx="4" fill="#2a2420"/><rect x="298" y="272" width="26" height="9" rx="4" fill="#2a2420"/></svg>`;
}
export const arte = (modelo) => (modelo === 'eletronica' ? eletronica() : modelo === 'cajon' ? cajon() : acustica());
