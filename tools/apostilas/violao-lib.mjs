// Ferramentas do "Beaterista toca violão": diagramas de acorde, mapas do braço, partitura + tablatura e ilustrações.
// Tudo é calculado a partir da afinação padrão (E2 A2 D3 G3 B3 E4): o desenho nunca é digitado "de olho".
import { CLAVE_SOL_D, CLAVE_SOL } from '../../js/paulta/clave.js';
import { pausa } from '../../js/pro/ritmo.js';

export const AFINACAO = [40, 45, 50, 55, 59, 64]; // MIDI da 6ª, 5ª, 4ª, 3ª, 2ª e 1ª corda (soltas)
export const CORDAS_NOME = ['Mi', 'Lá', 'Ré', 'Sol', 'Si', 'Mi'];
export const CORDAS_LETRA = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
const PT = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
const PB = ['Dó', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Sol♭', 'Sol', 'Lá♭', 'Lá', 'Si♭', 'Si'];
const NATURAL = new Set([0, 2, 4, 5, 7, 9, 11]);
export const nomePt = (m, bemol = false) => (bemol ? PB : PT)[((m % 12) + 12) % 12];
export const AUDITORIA = { acordes: [], pautas: [], erros: [] };
const erro = (m) => AUDITORIA.erros.push(m);

/* ---------------- notas por nome (G3, F#4, Bb3) ---------------- */
const LETRAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }; const IDX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
export function nota(s) { const m = /^([A-G])(#|b|x)?(-?\d)$/.exec(s); if (!m) throw new Error('nota inválida ' + s); const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0; const oct = +m[3]; return { letra: m[1], acc, oct, midi: 12 * (oct + 1) + LETRAS[m[1]] + acc, diat: oct * 7 + IDX[m[1]] }; }
/** casa/corda para uma altura: a menor casa possível (até `max`), preferindo cordas mais agudas. */
export function posTab(midi, { max = 12, cordas = null } = {}) { let melhor = null; for (let s = 6; s >= 1; s--) { if (cordas && !cordas.includes(s)) continue; const f = midi - AFINACAO[6 - s]; if (f < 0 || f > max) continue; if (!melhor || f < melhor.f || (f === melhor.f && s < melhor.s)) melhor = { s, f }; } return melhor; }
export const altura = (s, f) => AFINACAO[6 - s] + f;

/* ---------------- acordes ---------------- */
const NOTA_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const FORMULAS = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], 5: [0, 7], add9: [0, 4, 7, 14] };
export function rootPc(r) { const m = /^([A-G])(#|b)?$/.exec(r); if (!m) throw new Error('raiz ' + r); return (NOTA_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12; }
export function parseCifra(c) { const [corpo0, baixo] = c.split('/'); const corpo = corpo0.replace('°', 'dim').replace('+', 'aug').replace('Δ', 'maj7'); const m = /^([A-G](?:#|b)?)(maj7|m7|m|7|dim|aug|sus2|sus4|add9|5)?$/.exec(corpo); if (!m) throw new Error('cifra ' + c); return { raiz: rootPc(m[1]), tipo: m[2] || '', baixo: baixo ? rootPc(baixo) : null }; }
/** def: { c: 'C', f: 'x32010', d: 'x32.1.', pest: {casa, de, ate}?, base?: n, nome?: 'Dó maior' } — f = casas da 6ª à 1ª; x = não toca. */
export function validaAcorde(def) {
  const p = parseCifra(def.c); const F = def.f.split(''); const casas = []; // casas por corda (6ª..1ª), até 2 dígitos usam separador ","
  const lista = def.f.includes(',') ? def.f.split(',') : def.f.split('');
  if (lista.length !== 6) { erro(`${def.c}: ${lista.length} cordas`); return null; }
  const tocadas = []; lista.forEach((t, i) => { if (t === 'x') return; const f = +t; tocadas.push({ s: 6 - i, f, midi: altura(6 - i, f) }); });
  const esperado = new Set(FORMULAS[p.tipo].map((x) => (p.raiz + x) % 12)); if (p.baixo !== null) esperado.add(p.baixo);
  const pcs = new Set(tocadas.map((n) => n.midi % 12)); const extra = [...pcs].filter((x) => !esperado.has(x));
  if (extra.length) erro(`${def.c} (${def.f}): notas fora do acorde: ${extra.map((x) => PT[x]).join(', ')}`);
  const essenciais = FORMULAS[p.tipo].slice(0, p.tipo === '5' ? 2 : 3).map((x) => (p.raiz + x) % 12); const falta = essenciais.filter((x) => !pcs.has(x) && !(p.tipo.includes('7') && x === (p.raiz + 7) % 12));
  if (falta.length) erro(`${def.c} (${def.f}): falta ${falta.map((x) => PT[x]).join(', ')}`);
  const grave = tocadas.reduce((a, n) => (n.midi < a.midi ? n : a)); const baixoEsperado = p.baixo !== null ? p.baixo : p.raiz;
  if (grave.midi % 12 !== baixoEsperado) erro(`${def.c} (${def.f}): baixo é ${PT[grave.midi % 12]}, esperado ${PT[baixoEsperado]}`);
  const fretadas = tocadas.filter((n) => n.f > 0).map((n) => n.f); if (fretadas.length && Math.max(...fretadas) - Math.min(...fretadas) > 4) erro(`${def.c}: abertura de mais de 4 casas`);
  if (def.d) { const dd = def.d.split(''); tocadas.forEach((n, k) => { /* dedos só em casas > 0 */ }); lista.forEach((t, i) => { const dedo = dd[i]; if (t !== 'x' && +t > 0 && (!dedo || dedo === '.') && !(def.pest && i >= 6 - def.pest.de && i <= 6 - def.pest.ate)) erro(`${def.c}: corda ${6 - i} na casa ${t} sem dedo`); if ((t === '0' || t === 'x') && dedo && dedo !== '.' && dedo !== 'x') erro(`${def.c}: dedo na corda ${6 - i} que não é apertada`); }); }
  const info = { cifra: def.c, casas: def.f, baixo: PT[grave.midi % 12], notas: [...new Set(tocadas.map((n) => PT[n.midi % 12]))], inversao: p.baixo !== null ? (p.baixo === (p.raiz + (FORMULAS[p.tipo][1])) % 12 ? '1ª inversão' : p.baixo === (p.raiz + FORMULAS[p.tipo][2]) % 12 ? '2ª inversão' : '3ª inversão') : 'fundamental' };
  AUDITORIA.acordes.push(info); return { tocadas, raiz: p.raiz, info };
}
const ORD = ['', '1ª', '2ª', '3ª', '4ª', '5ª', '6ª'];
/** Texto de posicionamento gerado a partir do desenho (nunca digitado): descrição e diagrama não podem divergir. */
export function descreve(def) {
  const v = validaAcorde({ ...def, d: null }); if (!v) return ''; const dd = (def.d || '').split(''); const linhas = []; const lista = def.f.split('');
  const NOMED = { 1: 'indicador', 2: 'médio', 3: 'anelar', 4: 'mínimo' };
  if (def.pest) linhas.push(`Dedo 1 (indicador) deitado na ${def.pest.casa}ª casa, da ${ORD[def.pest.de]} à ${ORD[def.pest.ate]} corda${def.pest.mini ? ' (minipestana: só essas cordas)' : ' (pestana)'}.`);
  lista.forEach((t, i) => { const s = 6 - i; const dedo = dd[i]; if (t === 'x' || t === '0' || !dedo || dedo === '.') return; if (def.pest && s <= def.pest.de && s >= def.pest.ate && +t === def.pest.casa && dedo === '1') return; linhas.push(`Dedo ${dedo} (${NOMED[dedo]}) na ${ORD[s]} corda (${CORDAS_NOME[6 - s]}), ${t}ª casa.`); });
  const soltas = []; const mudas = []; lista.forEach((t, i) => { const s = 6 - i; if (t === '0') soltas.push(ORD[s]); if (t === 'x') mudas.push(ORD[s]); });
  if (soltas.length) linhas.push(`Soltas: ${soltas.join(', ')}.`); if (mudas.length) linhas.push(`Não toque: ${mudas.join(', ')}.`);
  return linhas.join(' ');
}
const ACENTO = '#c9993a';
/** Diagrama de acorde (SVG). tam = largura em px do viewBox base 120 × 150. */
export function diagrama(def, { verde = '#2f4a35', rotulo = true, legenda = '', numeros = true, trasteN = 5 } = {}) {
  const v = validaAcorde(def); if (!v) return '';
  const lista = def.f.split(''); const fr = lista.filter((t) => t !== 'x' && +t > 0).map(Number); const b0 = def.base || (fr.length && Math.max(...fr) > 4 ? Math.min(...fr) : 1);
  const x0 = 24, y0 = 40, dx = 14.4, dy = 21; const W = 120, H = y0 + trasteN * dy + (rotulo ? 34 : 14); let o = '';
  for (let k = 0; k < 6; k++) o += `<line x1="${x0 + k * dx}" y1="${y0}" x2="${x0 + k * dx}" y2="${y0 + trasteN * dy}" stroke="#0a0406" stroke-width="${1.3 + (5 - k) * 0.12}"/>`;
  for (let r = 0; r <= trasteN; r++) o += `<line x1="${x0}" y1="${y0 + r * dy}" x2="${x0 + 5 * dx}" y2="${y0 + r * dy}" stroke="#0a0406" stroke-width="${r === 0 && b0 === 1 ? 4.4 : 1.2}"/>`;
  if (b0 > 1) o += `<text x="${x0 - 8}" y="${y0 + dy * 0.62}" text-anchor="end" font-size="13" font-weight="800" font-family="Hanken, sans-serif" fill="#0a0406">${b0}ª</text>`;
  const raiz = v.raiz; const pos = (s) => x0 + (6 - s) * dx; const yc = (f) => y0 + (f - b0 + 0.5) * dy;
  lista.forEach((t, i) => { const s = 6 - i; const cx = x0 + i * dx; if (t === 'x') o += `<path d="M${cx - 4} ${y0 - 17}l8 8m0 -8l-8 8" stroke="#0a0406" stroke-width="1.8"/>`; else if (t === '0') o += `<circle cx="${cx}" cy="${y0 - 13}" r="4.4" fill="none" stroke="${altura(s, 0) % 12 === raiz ? ACENTO : '#0a0406'}" stroke-width="${altura(s, 0) % 12 === raiz ? 2.6 : 1.6}"/>`; });
  if (def.pest) { const { casa, de, ate } = def.pest; const xa = x0 + (6 - de) * dx, xb = x0 + (6 - ate) * dx; o += `<rect x="${xa - 5.6}" y="${yc(casa) - 6.4}" width="${xb - xa + 11.2}" height="12.8" rx="6.4" fill="${verde}"/>`; if (numeros) o += `<text x="${xa}" y="${yc(casa) + 4.2}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Hanken, sans-serif">1</text>`; }
  const dd = (def.d || '').split(''); lista.forEach((t, i) => { if (t === 'x' || t === '0') return; const f = +t; const s = 6 - i; if (def.pest && s <= def.pest.de && s >= def.pest.ate && f === def.pest.casa) return; const cx = x0 + i * dx; const eRaiz = altura(s, f) % 12 === raiz; o += `<circle cx="${cx}" cy="${yc(f)}" r="6.6" fill="${eRaiz ? ACENTO : verde}"/>`; if (numeros && dd[i] && dd[i] !== '.') o += `<text x="${cx}" y="${yc(f) + 4.2}" text-anchor="middle" font-size="11" font-weight="800" fill="${eRaiz ? '#0a0406' : '#fff'}" font-family="Hanken, sans-serif">${dd[i]}</text>`; });
  o += [0, 1, 2, 3, 4, 5].map((i) => `<text x="${x0 + i * dx}" y="${y0 + trasteN * dy + 12}" text-anchor="middle" font-size="9.6" font-weight="800" fill="#6b6558" font-family="Hanken, sans-serif">${CORDAS_LETRA[i][0]}</text>`).join('');
  if (rotulo) o += `<text x="${x0 + 2.5 * dx}" y="${H - 2}" text-anchor="middle" font-size="15" font-weight="900" fill="#0a0406" font-family="Hanken, sans-serif">${def.rotulo || def.c}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Acorde ${def.c}: casas ${def.f}${legenda ? ' ' + legenda : ''}">${o}</svg>`;
}

/* ---------------- mapa do braço ---------------- */
/** modo: 'naturais' | 'sustenidos' | 'bemois' | 'vazio'. Casas 0..12, cordas da 1ª (em cima) à 6ª (embaixo), como se vê o violão de frente para a pessoa. */
export function braco({ modo = 'naturais', casas = 12, largura = 640, destaque = [] } = {}) {
  const x0 = 60, y0 = 34, dx = (largura - x0 - 8) / (casas + 0.5), dy = 34; const H = y0 + 5 * dy + 46; let o = '';
  const marc = [3, 5, 7, 9, 12];
  for (let f = 1; f <= casas; f++) if (marc.includes(f)) { const cx = x0 + (f - 0.5) * dx; o += f === 12 ? `<circle cx="${cx}" cy="${y0 + 1.5 * dy}" r="4" fill="#c9bba8"/><circle cx="${cx}" cy="${y0 + 3.5 * dy}" r="4" fill="#c9bba8"/>` : `<circle cx="${cx}" cy="${y0 + 2.5 * dy}" r="4" fill="#c9bba8"/>`; }
  for (let f = 0; f <= casas; f++) o += `<line x1="${x0 + f * dx}" y1="${y0}" x2="${x0 + f * dx}" y2="${y0 + 5 * dy}" stroke="#0a0406" stroke-width="${f === 0 ? 4 : 1.2}"/>`;
  for (let s = 1; s <= 6; s++) o += `<line x1="${x0}" y1="${y0 + (s - 1) * dy}" x2="${x0 + casas * dx}" y2="${y0 + (s - 1) * dy}" stroke="#0a0406" stroke-width="${1 + (s - 1) * 0.3}"/>`;
  for (let s = 1; s <= 6; s++) { const y = y0 + (s - 1) * dy; o += `<text x="${x0 - 22}" y="${y + 5}" text-anchor="end" font-size="14" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${s}ª ${CORDAS_LETRA[6 - s][0]}</text>`;
    for (let f = 0; f <= casas; f++) { const m = altura(s, f); const nat = NATURAL.has(m % 12); if (modo === 'vazio') continue; if (!nat && modo === 'naturais') continue; const cx = f === 0 ? x0 - 0 : x0 + (f - 0.5) * dx; const cxx = f === 0 ? x0 - 0 : cx; const nome = nomePt(m, modo === 'bemois'); const marcado = destaque.some((d) => d % 12 === m % 12);
      const r = 13.4; const px = f === 0 ? x0 - 0 : cxx; const xx = f === 0 ? x0 + 0 : px; const dxx = f === 0 ? -0 : 0;
      o += `<g><circle cx="${f === 0 ? x0 - 0 : px}" cy="${y}" r="${r}" fill="${nat ? ACENTO : '#fff'}" stroke="#0a0406" stroke-width="1"${f === 0 ? ` transform="translate(${-0} 0)"` : ''}/><text x="${f === 0 ? x0 : px}" y="${y + 4.4}" text-anchor="middle" font-size="${nome.length > 3 ? 10.2 : 12.4}" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${nome}</text></g>`; } }
  for (let f = 0; f <= casas; f++) o += `<text x="${f === 0 ? x0 : x0 + (f - 0.5) * dx}" y="${y0 + 5 * dy + 18}" text-anchor="middle" font-size="14" font-weight="800" fill="#6b6558" font-family="Hanken, sans-serif">${f === 0 ? 'solta' : f}</text>`;
  return `<svg viewBox="0 0 ${largura} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa do braço do violão até a casa ${casas}">${o}</svg>`;
}

/* ---------------- partitura + tablatura ---------------- */
const SUST = 'M-2 -7V7M2 -8V6M-4.5 -2.5L4.5 -4.5M-4.5 3.5L4.5 1.5'; const BEQ = 'M-2.5 -7V3M2.5 -3V7M-2.5 -2L2.5 -3M-2.5 3L2.5 2';
const COMP = { '4/4': 16, '3/4': 12, '2/4': 8, '6/8': 12 }; const BEAT = { '4/4': 4, '3/4': 4, '2/4': 4, '6/8': 6 };
/** evs: [{ n: 'G3', d: sixteenths } | { r: true, d } | com opcional lig:true, t:'h'|'p'|'/'|'~'|'b'|'x'|'harm' ]. Em "sons reais" (como o violão soa); a partitura é escrita uma oitava acima, na clave de sol com 8 embaixo. */
export function partitura({ evs, compasso = '4/4', pickup = 0, tempo = '', porLinha = 2, largura = 560, titulo = '', tab = true, nomeId = '', nomes = false, clave = true, contagem = false } = {}) {
  const barLen = COMP[compasso]; const bt = BEAT[compasso]; const G = 9; let o = '';
  // 1) compassos
  const bars = []; let alvo = pickup || barLen;
  let acc = []; let soma = 0; const lista = evs.map((e) => ({ ...e }));
  for (const e of lista) { if (soma + e.d > alvo) { erro(`${nomeId}: nota (${e.n || 'pausa'}, d=${e.d}) atravessa a barra no compasso ${bars.length + 1}`); } acc.push({ ...e, pos: soma }); soma += e.d; if (soma === alvo) { bars.push({ itens: acc, tam: alvo }); acc = []; soma = 0; alvo = barLen; } }
  if (acc.length) { if (soma !== alvo) { erro(`${nomeId}: último compasso tem ${soma} de ${alvo} semicolcheias`); } bars.push({ itens: acc, tam: alvo, incompleto: soma !== alvo }); }
  bars.forEach((b, i) => { const s = b.itens.reduce((a, x) => a + x.d, 0); if (s !== b.tam && !(i === bars.length - 1 && b.incompleto)) erro(`${nomeId}: compasso ${i + 1} soma ${s}, esperado ${b.tam}`); });
  AUDITORIA.pautas.push({ id: nomeId, compasso, compassos: bars.length, notas: lista.filter((e) => e.n).length });
  // 2) linhas
  const sistemas = []; for (let i = 0; i < bars.length; i += porLinha) sistemas.push(bars.slice(i, i + porLinha));
  const xEsq = 56; const xDir = largura - 8; const yStaff0 = 34; const gapTab = 32; let y = 0; const alt = G * 4; const hSis = (tab ? alt * 2 + gapTab + 40 + (nomes ? 14 : 0) : alt + 60);
  let numBar = 0;
  sistemas.forEach((sis, si) => {
    const yS = yStaff0 + y + 16; const yB = yS + alt; const yp = (p) => yB - (p * G) / 2; const yT = yB + gapTab; // yT = linha de cima da tab
    const disp = xDir - xEsq - (si === 0 ? 26 : 0); const pesos = sis.map((b) => Math.max(b.tam / barLen, 0.4) * (b.tam < barLen ? 1.15 : 1)); const soma2 = pesos.reduce((a, b) => a + b, 0);
    for (let k = 0; k < 5; k++) o += `<line x1="6" y1="${yS + k * G}" x2="${xDir}" y2="${yS + k * G}" stroke="#0a0406" stroke-width="1.1"/>`;
    if (tab) for (let k = 0; k < 6; k++) o += `<line x1="6" y1="${yT + k * 9}" x2="${xDir}" y2="${yT + k * 9}" stroke="#0a0406" stroke-width="1"/>`;
    o += `<line x1="6" y1="${yS}" x2="6" y2="${tab ? yT + 45 : yB}" stroke="#0a0406" stroke-width="1.5"/>`;
    if (clave) { const k = CLAVE_SOL.k * (G / 16); o += `<path d="${CLAVE_SOL_D}" transform="translate(${(28 - CLAVE_SOL.cx * k).toFixed(2)} ${(yp(2) - CLAVE_SOL.gy * k).toFixed(2)}) scale(${k.toFixed(5)})" fill="#0a0406" fill-rule="evenodd"/><text x="30" y="${yB + 24}" text-anchor="middle" font-size="13" font-weight="800" font-family="Hanken, sans-serif" fill="#0a0406">8</text>`; }
    if (tab) o += `<text x="26" y="${yT + 19}" text-anchor="middle" font-size="13" font-weight="900" fill="#0a0406" font-family="Hanken, sans-serif">T</text><text x="26" y="${yT + 31}" text-anchor="middle" font-size="13" font-weight="900" fill="#0a0406" font-family="Hanken, sans-serif">A</text><text x="26" y="${yT + 43}" text-anchor="middle" font-size="13" font-weight="900" fill="#0a0406" font-family="Hanken, sans-serif">B</text>`;
    if (si === 0) { const [n1, n2] = compasso.split('/'); const fx = xEsq - 2; o += `<text x="${fx}" y="${yp(6) + 7}" text-anchor="middle" font-size="19" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${n1}</text><text x="${fx}" y="${yp(2) + 7}" text-anchor="middle" font-size="19" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${n2}</text>`; if (tab) o += `<text x="${fx}" y="${yT + 19}" text-anchor="middle" font-size="15" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${n1}</text><text x="${fx}" y="${yT + 38}" text-anchor="middle" font-size="15" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${n2}</text>`; if (tempo) o += `<text x="${xEsq + 24}" y="${yS - 14}" font-size="13" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${tempo}</text>`; }
    let x = xEsq + (si === 0 ? 26 : 0) - 4;
    sis.forEach((b, bi) => {
      const bw = (pesos[bi] / soma2) * disp; numBar++; const pad = 14; const px = (pos) => x + pad + (pos / b.tam) * (bw - pad * 2 - 4);
      if (!(pickup && numBar === 1)) o += `<text x="${x + 3}" y="${yS - 7}" font-size="9" font-weight="800" fill="#6b6558" font-family="Hanken, sans-serif">${pickup ? numBar - 1 : numBar}</text>`;
      const colunas = []; const alts = {};
      b.itens.forEach((e, k) => {
        const cx = px(e.pos); e.cx = cx;
        if (e.r) { const dd = e.d; const base = dd === 12 ? 8 : dd === 6 ? 4 : dd === 3 ? 2 : dd; o += pausa(base, cx, yS + 2 * G).replace(/y="(\d+(\.\d+)?)"/g, (m) => m); if (dd === 12 || dd === 6 || dd === 3) o += `<circle cx="${cx + 9}" cy="${yS + 2 * G - 3}" r="1.7" fill="#0a0406"/>`; return; }
        const nt = nota(e.n); const pe = nt.diat + 7 - 30; // escrito uma oitava acima; E4 escrito = linha de baixo
        const pp = pe; const ycab = yp(pp); e.pp = pp; e.y = ycab;
        if (pp < 0) for (let l = -2; l >= pp; l -= 2) o += `<line x1="${cx - 9}" y1="${yp(l)}" x2="${cx + 9}" y2="${yp(l)}" stroke="#0a0406" stroke-width="1.2"/>`;
        if (pp > 8) for (let l = 10; l <= pp; l += 2) o += `<line x1="${cx - 9}" y1="${yp(l)}" x2="${cx + 9}" y2="${yp(l)}" stroke="#0a0406" stroke-width="1.2"/>`;
        const chave = nt.diat; const quer = nt.acc; const tem = alts[chave] ?? 0; if (quer !== tem) { o += `<path d="${quer === 1 ? SUST : quer === -1 ? BEQ : 'M-2 -6V6M2 -6V6M-4.5 -2L4.5 -3M-4.5 3L4.5 2'}" transform="translate(${cx - 12} ${ycab})" stroke="#0a0406" stroke-width="1.3" fill="none"/>`; alts[chave] = quer; }
        const aberta = e.d >= 8; o += `<ellipse cx="${cx}" cy="${ycab}" rx="${e.d >= 16 ? 6.2 : 5.4}" ry="4" transform="rotate(-20 ${cx} ${ycab})" ${aberta ? 'fill="none" stroke="#0a0406" stroke-width="1.6"' : 'fill="#0a0406"'}/>`;
        if (e.d === 3 || e.d === 6 || e.d === 12) o += `<circle cx="${cx + 10}" cy="${ycab - (pp % 2 === 0 ? 3.2 : 0)}" r="1.7" fill="#0a0406"/>`;
        colunas.push(e);
        if (tab) { const pos = e.cordaFixa ? { s: e.cordaFixa, f: nt.midi - AFINACAO[6 - e.cordaFixa] } : posTab(nt.midi, { max: 12 }); if (!pos) { erro(`${nomeId}: ${e.n} fora do braço`); return; } if (altura(pos.s, pos.f) !== nt.midi) erro(`${nomeId}: tablatura ${pos.s}/${pos.f} ≠ ${e.n}`); e.s = pos.s; e.f = pos.f; const ty = yT + (pos.s - 1) * 9; o += `<rect x="${cx - 6}" y="${ty - 6.4}" width="12" height="12.4" fill="#f3ead9"/><text x="${cx}" y="${ty + 4.4}" text-anchor="middle" font-size="${e.t === 'harm' ? 11 : 12.6}" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${e.t === 'x' ? '✕' : e.t === 'harm' ? `◇${pos.f}◇` : pos.f}</text>`; }
        if (nomes) o += `<text x="${cx}" y="${(tab ? yT + 66 : yB + 38)}" text-anchor="middle" font-size="11.5" font-weight="900" fill="var(--v,#2f4a35)" font-family="Hanken, sans-serif">${nomePt(nt.midi, nt.acc < 0).replace('♯', '#').replace('♭', 'b')}</text>`;
      });
      // hastes, feixes e bandeirolas
      const grupos = []; let g = []; const fecha = () => { if (g.length > 1) grupos.push(g); g = []; };
      for (const e of b.itens) { if (e.r || e.d > 3 || e.d < 1) { fecha(); continue; } if (g.length && Math.floor(g[0].pos / bt) !== Math.floor(e.pos / bt)) fecha(); g.push(e); } fecha();
      const emG = new Set(grupos.flat());
      for (const gr of grupos) { const baixo = gr.reduce((a, e) => a + (e.pp >= 4 ? 1 : -1), 0) > 0; gr.forEach((e) => { e.sx = baixo ? e.cx - 5 : e.cx + 5; }); const meio = yp(4); let yb = baixo ? Math.max(...gr.map((e) => e.y + 3.4 * G), meio) : Math.min(...gr.map((e) => e.y - 3.4 * G), meio); gr.forEach((e) => { o += `<line x1="${e.sx}" y1="${e.y}" x2="${e.sx}" y2="${yb}" stroke="#0a0406" stroke-width="1.3"/>`; }); o += `<line x1="${gr[0].sx}" y1="${yb}" x2="${gr[gr.length - 1].sx}" y2="${yb}" stroke="#0a0406" stroke-width="3.2"/>`; const y2 = yb + (baixo ? -5 : 5); gr.forEach((e, i) => { if (e.d !== 1) return; const prox = gr[i + 1]; const ant = gr[i - 1]; if (prox && prox.d === 1) o += `<line x1="${e.sx}" y1="${y2}" x2="${prox.sx}" y2="${y2}" stroke="#0a0406" stroke-width="3.2"/>`; else if (!(ant && ant.d === 1)) { const lado = prox ? 1 : -1; o += `<line x1="${e.sx}" y1="${y2}" x2="${e.sx + lado * 7}" y2="${y2}" stroke="#0a0406" stroke-width="3.2"/>`; } }); }
      for (const e of b.itens) { if (e.r || emG.has(e) || e.d >= 16) continue; const baixo = e.pp >= 4; const sx = baixo ? e.cx - 5 : e.cx + 5; const meio = yp(4); const yh = baixo ? Math.max(e.y + 3.4 * G, meio) : Math.min(e.y - 3.4 * G, meio); o += `<line x1="${sx}" y1="${e.y}" x2="${sx}" y2="${yh}" stroke="#0a0406" stroke-width="1.3"/>`; if (e.d <= 3) { const n = e.d === 1 ? 2 : 1; const dir = baixo ? -1 : 1; for (let j = 0; j < n; j++) { const yy = yh + (baixo ? -j * 6 : j * 6); o += `<path d="M${sx} ${yy}c2 ${5 * dir} 9 ${6 * dir} 7 ${14 * dir}" stroke="#0a0406" stroke-width="1.7" fill="none"/>`; } } }
      // ligaduras de prolongamento e técnicas
      b.itens.forEach((e, k) => { const prox = b.itens[k + 1] || (sis[bi + 1] ? sis[bi + 1].itens[0] : (sistemas[si + 1] && bi === sis.length - 1 ? sistemas[si + 1][0].itens[0] : null)); if (e.lig && prox && !prox.r && prox.cx !== undefined && e.cx !== undefined && !(bi === sis.length - 1)) { const baixo = e.pp >= 4; const yy = e.y + (baixo ? -8 : 8); o += `<path d="M${e.cx} ${yy}Q${(e.cx + prox.cx) / 2} ${yy + (baixo ? -7 : 7)} ${prox.cx} ${yy}" stroke="#0a0406" stroke-width="1.2" fill="none"/>`; }
        if (tab && e.t && !e.r && e.s) { const nx = b.itens[k + 1]; const ty = yT + (e.s - 1) * 9; if ((e.t === 'h' || e.t === 'p' || e.t === '/') && nx && nx.s && nx.cx) { const xm = (e.cx + nx.cx) / 2; if (e.t === '/') o += `<line x1="${e.cx + 7}" y1="${ty + 5}" x2="${nx.cx - 7}" y2="${ty - 5}" stroke="#0a0406" stroke-width="1.5"/>`; else o += `<path d="M${e.cx + 4} ${ty - 7}Q${xm} ${ty - 19} ${nx.cx - 4} ${ty - 7}" stroke="#0a0406" stroke-width="1.2" fill="none"/><text x="${xm}" y="${ty - 17}" text-anchor="middle" font-size="9" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${e.t === 'h' ? 'H' : 'P'}</text>`; } if (e.t === '~') o += `<path d="M${e.cx + 7} ${ty - 9}q2 -5 4 0t4 0t4 0t4 0" stroke="#0a0406" stroke-width="1.3" fill="none"/>`; if (e.t === 'b') o += `<path d="M${e.cx + 4} ${ty - 3}q9 -2 9 -14" stroke="#0a0406" stroke-width="1.3" fill="none"/><path d="M${e.cx + 9} ${ty - 14}l4 -5l4 5" stroke="#0a0406" stroke-width="1.3" fill="none"/><text x="${e.cx + 13}" y="${ty - 23}" text-anchor="middle" font-size="9" font-weight="800" fill="#0a0406" font-family="Hanken, sans-serif">${e.bl || '½'}</text>`; } });
      x += bw; const ult = si === sistemas.length - 1 && bi === sis.length - 1 && b === bars[bars.length - 1];
      const pk = pickup && numBar === 1 && !bars.incompleto; o += ult ? `<line x1="${x - 5}" y1="${yS}" x2="${x - 5}" y2="${tab ? yT + 45 : yB}" stroke="#0a0406" stroke-width="1.3"/><rect x="${x - 2}" y="${yS}" width="3.4" height="${tab ? yT + 45 - yS : alt}" fill="#0a0406"/>` : `<line x1="${x - 2}" y1="${yS}" x2="${x - 2}" y2="${tab ? yT + 45 : yB}" stroke="#0a0406" stroke-width="${pk ? 1.3 : 1.3}"/>`;
    });
    y += hSis;
  });
  const H = yStaff0 + y - 6;
  return `<svg viewBox="0 0 ${largura} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${titulo || 'Partitura e tablatura de violão'}">${o}</svg>`;
}
export const sons = (str) => str; // marcador de legibilidade
