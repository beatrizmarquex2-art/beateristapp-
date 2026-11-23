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
