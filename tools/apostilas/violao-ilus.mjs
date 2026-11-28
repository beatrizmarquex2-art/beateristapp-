// Ilustrações técnicas do violão (anatomia e posturas), desenhadas por código em escala real.
const INK = '#0a0406'; const F = 'Hanken, sans-serif';
const num = (n, x, y, v = '#2f4a35') => `<g><circle cx="${x}" cy="${y}" r="10" fill="${v}"/><text x="${x}" y="${y + 4.2}" text-anchor="middle" font-size="11.5" font-weight="900" fill="#fff" font-family="${F}">${n}</text></g>`;
const lig = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="1" stroke-dasharray="none"/><circle cx="${x2}" cy="${y2}" r="2.2" fill="${INK}"/>`;

/** Anatomia: escala fiel (diapasão de 650 mm ≈ 560 unidades; trastes pela regra 2^(-n/12)). Números 1–15 ligados à tabela da página. */
export function anatomia() {
  const nutY = 122; const esc = 560; const fy = (n) => nutY + esc * (1 - 2 ** (-n / 12)); const cx = 200; let o = '';
  // corpo (tampo): contorno com ombros, cintura e bojo
  const corpo = 'M 145 402 C 100 412 78 448 80 480 C 82 520 112 534 112 566 C 112 600 70 626 66 696 C 62 770 120 818 200 818 C 280 818 338 770 334 696 C 330 626 288 600 288 566 C 288 534 318 520 320 480 C 322 448 300 412 255 402 Z';
  o += `<path d="${corpo}" fill="#e9d6ad" stroke="${INK}" stroke-width="2.2"/><path d="${corpo}" fill="none" stroke="#b8913f" stroke-width="1" transform="translate(0 0) scale(.965) translate(7 14)" opacity=".7"/>`;
  // braço, escala, cabeça
  o += `<path d="M 168 ${nutY} L 232 ${nutY} L 238 405 L 162 405 Z" fill="#6b4a2a" stroke="${INK}" stroke-width="1.6"/>`;
  o += `<path d="M 173 ${nutY} L 227 ${nutY} L 232 ${fy(12) + 3} L 168 ${fy(12) + 3} Z" fill="#2b1d14" stroke="${INK}" stroke-width="1"/>`;
  o += `<path d="M 172 18 Q 168 18 168 28 L 166 ${nutY - 2} L 234 ${nutY - 2} L 232 28 Q 232 18 228 18 Z" fill="#6b4a2a" stroke="${INK}" stroke-width="1.8"/>`;
  for (let i = 0; i < 3; i++) { const y = 36 + i * 30; o += `<circle cx="156" cy="${y}" r="7.5" fill="#d9d2c0" stroke="${INK}" stroke-width="1.3"/><line x1="163" y1="${y}" x2="170" y2="${y}" stroke="${INK}" stroke-width="2"/><circle cx="244" cy="${y}" r="7.5" fill="#d9d2c0" stroke="${INK}" stroke-width="1.3"/><line x1="237" y1="${y}" x2="230" y2="${y}" stroke="${INK}" stroke-width="2"/>`; }
  o += `<rect x="171" y="${nutY - 5}" width="58" height="7" fill="#f6efe0" stroke="${INK}" stroke-width="1.3"/>`; // pestana (nut)
  for (let n = 1; n <= 12; n++) { const y = fy(n); const w = 27 + (y - nutY) * 0.0165 * 1; o += `<line x1="${cx - w - 0.5}" y1="${y}" x2="${cx + w + 0.5}" y2="${y}" stroke="#d6d6d6" stroke-width="${n === 12 ? 2.4 : 1.8}"/>`; }
  for (const n of [3, 5, 7, 9]) o += `<circle cx="${cx}" cy="${(fy(n) + fy(n - 1)) / 2}" r="3.6" fill="#f6efe0"/>`;
  o += `<circle cx="${cx - 9}" cy="${(fy(12) + fy(11)) / 2}" r="3.6" fill="#f6efe0"/><circle cx="${cx + 9}" cy="${(fy(12) + fy(11)) / 2}" r="3.6" fill="#f6efe0"/>`;
  // boca, roseta, cavalete, rastilho
  const sy = 522; o += `<circle cx="${cx}" cy="${sy}" r="48" fill="none" stroke="#2b1d14" stroke-width="3"/><circle cx="${cx}" cy="${sy}" r="42" fill="none" stroke="#b8913f" stroke-width="3"/><circle cx="${cx}" cy="${sy}" r="36" fill="#150b07" stroke="${INK}" stroke-width="1.6"/>`;
  o += `<rect x="146" y="672" width="108" height="30" rx="5" fill="#4a3220" stroke="${INK}" stroke-width="1.6"/><rect x="152" y="677" width="96" height="4.5" fill="#f6efe0" stroke="${INK}" stroke-width=".8"/>`;
  const bridgeY = nutY + esc; // 682 = rastilho
  for (let k = 0; k < 6; k++) { const xn = cx - 22 + k * 8.8; const xb = cx - 40 + k * 16; o += `<line x1="${xn}" y1="${nutY}" x2="${xb}" y2="${bridgeY - 3}" stroke="${INK}" stroke-width="${0.9 + (5 - k) * 0.28}"/>`; }
  // rótulos
  const L = [[1, 'cabeça (mão)', 200, 62, 285, 62], [2, 'tarraxas', 244, 66, 330, 96], [3, 'pestana', 229, nutY - 1, 330, 130], [4, 'braço', 238, 300, 330, 300], [5, 'escala', 232, 250, 330, 215], [6, 'trastes', 232, fy(5), 330, 180], [7, 'casas', 232, (fy(6) + fy(7)) / 2, 330, 350], [8, 'marcadores', cx + 4, (fy(7) + fy(6)) / 2, 36, 330], [9, 'corpo', 80, 640, 36, 640], [10, 'tampo', 300, 470, 360, 470], [11, 'boca', cx + 36, sy, 360, sy], [12, 'roseta', cx - 45, sy - 12, 36, 480], [13, 'cavalete', 148, 690, 36, 700], [14, 'rastilho', 152, 679, 36, 740], [15, 'cordas', cx - 12, 580, 36, 580]];
  for (const [n, , x1, y1, x2, y2] of L) { o += lig(x2, y2, x1, y1); }
  const bad = L.map(([n, , , , x2, y2]) => { const dx = x2 > 200 ? 14 : -14; return num(n, x2 + dx, y2); }).join('');
  return `<svg viewBox="0 0 400 835" style="max-height:200mm" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anatomia do violão com 15 partes numeradas">${o}${bad}</svg>`;
}
export const ANATOMIA_TABELA = [
  [1, 'Cabeça (mão ou headstock)', 'Onde ficam as tarraxas. Sustenta a tensão das cordas.'],
  [2, 'Tarraxas', 'Engrenagens que esticam ou afrouxam a corda e, assim, afinam.'],
  [3, 'Pestana (nut)', 'Pecinha no começo da escala. Define o espaçamento das cordas e a altura delas ali.'],
  [4, 'Braço', 'A peça comprida que você segura com a mão esquerda. Por dentro tem o tensor (alma).'],
  [5, 'Escala (espelho)', 'A face de cima do braço, onde ficam os trastes. As cordas passam sobre ela.'],
  [6, 'Trastes', 'Os ferrinhos metálicos. Cada traste define uma nota quando a corda é apertada até ele.'],
  [7, 'Casas', 'O espaço entre dois trastes. A casa 1 fica entre a pestana e o 1º traste.'],
  [8, 'Marcadores', 'Pontinhos nas casas 3, 5, 7, 9 e 12 (dois). Ajudam a se localizar sem olhar muito.'],
  [9, 'Corpo (caixa)', 'A caixa de ressonância. Amplifica o som das cordas.'],
  [10, 'Tampo', 'A face da frente do corpo. É a parte que mais vibra e dá voz ao violão.'],
  [11, 'Boca', 'O furo redondo. Deixa o som da caixa sair.'],
  [12, 'Roseta', 'Os anéis em volta da boca. Enfeite e reforço do tampo.'],
  [13, 'Cavalete (ponte)', 'Peça colada ao tampo onde as cordas são presas e a vibração passa para o corpo.'],
  [14, 'Rastilho (selim)', 'Fiozinho duro no cavalete onde a corda apoia. Define a altura da corda e o comprimento que vibra.'],
  [15, 'Cordas', 'Seis, da mais grossa (6ª, Mi grave) à mais fina (1ª, Mi agudo).'],
];

/* ---------- posturas (esquemas técnicos) ---------- */
const L1 = (x1, y1, x2, y2, w = 3, c = INK) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const T = (x, y, t, s = 11, a = 'middle', w = 800) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${(s * 1.28).toFixed(1)}" font-weight="${w}" fill="${INK}" font-family="${F}">${t}</text>`;
/** Pessoa sentada, vista de lado, olhando para a direita. tipo: 'classica' (pé esquerdo em apoio, violão na perna esquerda) | 'popular' (violão na perna direita). */
export function posturaSentada(tipo = 'classica') {
  const pop = tipo === 'popular'; let o = '';
  o += `<line x1="20" y1="290" x2="300" y2="290" stroke="${INK}" stroke-width="2"/>`; // chão
  o += `<rect x="52" y="196" width="78" height="9" rx="2" fill="#c9bba8" stroke="${INK}" stroke-width="1.2"/>${L1(58, 205, 58, 290, 3)}${L1(124, 205, 124, 290, 3)}${L1(52, 150, 52, 196, 3)}`; // cadeira
  o += `<circle cx="104" cy="70" r="19" fill="none" stroke="${INK}" stroke-width="2.4"/>`; // cabeça
  o += L1(104, 89, 100, 150, 4); // tronco
  o += L1(100, 150, 176, 160, 4); // coxa (pé no chão)
  o += L1(176, 160, 176, 288, 4); // canela
  o += L1(176, 288, 198, 288, 4); // pé
  if (!pop) { o += `<rect x="150" y="244" width="64" height="9" rx="2" fill="#c9bba8" stroke="${INK}" stroke-width="1.2"/>${L1(154, 253, 154, 288, 3)}${L1(210, 253, 210, 288, 3)}`; }
  // violão: corpo (elipses) sobre a coxa, braço subindo para a esquerda do desenho, na altura do ombro
  const gx = pop ? 164 : 152; const gy = pop ? 138 : 128;
  o += `<ellipse cx="${gx}" cy="${gy + 24}" rx="40" ry="30" fill="#e9d6ad" stroke="${INK}" stroke-width="2"/><ellipse cx="${gx + 4}" cy="${gy - 14}" rx="29" ry="22" fill="#e9d6ad" stroke="${INK}" stroke-width="2"/>`;
  o += `<line x1="${gx + 20}" y1="${gy - 24}" x2="${gx + 118}" y2="${gy - 62}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><rect x="${gx + 110}" y="${gy - 80}" width="22" height="14" rx="3" fill="#6b4a2a" stroke="${INK}" stroke-width="1.5" transform="rotate(-21 ${gx + 120} ${gy - 73})"/>`;
  o += `<circle cx="${gx + 6}" cy="${gy + 10}" r="9" fill="#150b07"/>`; // boca
  o += L1(104, 100, 138, 134, 3.4) + L1(138, 134, gx + 80, gy - 46, 3.4); // braço esquerdo (do ombro ao braço do violão)
  o += L1(104, 100, 128, 150, 3.4) + L1(128, 150, gx + 4, gy + 6, 3.4); // braço direito sobre o corpo
  o += `<text x="104" y="40" text-anchor="middle" font-size="11" font-weight="800" fill="${INK}" font-family="${F}">${pop ? 'popular' : 'clássica'}</text>`;
  return `<svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Postura sentada ${pop ? 'popular' : 'clássica'}">${o}</svg>`;
}
/** Corte do braço: polegar atrás, dedos curvos em cima. */
export function maoEsquerdaCorte() {
  let o = '';
  o += `<path d="M 80 70 Q 160 40 240 70 Q 252 130 240 170 Q 160 200 80 170 Q 68 130 80 70 Z" fill="#6b4a2a" stroke="${INK}" stroke-width="2"/>`; // seção do braço (D)
  o += `<path d="M 110 62 q 20 -26 40 0 M 150 58 q 20 -28 40 0 M 190 62 q 20 -24 40 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`; // dedos curvos (pontas)
  o += T(160, 36, 'dedos de 1 a 4, pontas curvas'); o += `<ellipse cx="160" cy="214" rx="26" ry="14" fill="#f2c9a5" stroke="${INK}" stroke-width="2"/>`; o += T(160, 246, 'polegar atrás do braço', 12);
  o += T(160, 266, 'mais ou menos na altura do dedo médio', 10.5, 'middle', 600); o += T(160, 118, 'braço (corte)', 12, 'middle', 700);
  o += `<line x1="160" y1="182" x2="160" y2="198" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  return `<svg viewBox="0 0 320 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Corte do braço do violão com o polegar atrás">${o}</svg>`;
}
/** Dedo na casa: perto do traste (certo) × no meio/longe (errado). */
export function dedoNaCasa(certo = true) {
  const x = certo ? 160 : 118; let o = '';
  o += `<rect x="40" y="148" width="240" height="14" fill="#6b4a2a" stroke="${INK}" stroke-width="1.5"/>`; // escala
  o += `<rect x="96" y="140" width="6" height="12" fill="#d6d6d6" stroke="${INK}" stroke-width="1"/><rect x="198" y="140" width="6" height="12" fill="#d6d6d6" stroke="${INK}" stroke-width="1"/>`; // trastes
  o += `<line x1="40" y1="139" x2="280" y2="139" stroke="${INK}" stroke-width="2"/>`; // corda
  o += `<path d="M ${x - 8} 40 Q ${x + 36} 60 ${x - 2} 136" fill="#f2c9a5" stroke="${INK}" stroke-width="2"/>`; // dedo curvo
  o += `<circle cx="${x - 2}" cy="136" r="4.5" fill="#f2c9a5" stroke="${INK}" stroke-width="1.2"/>`;
  o += T(99, 186, 'traste', 11); o += T(201, 186, 'traste', 11); o += T(150, 20, certo ? 'certo: ponta do dedo, perto do traste' : 'errado: no meio da casa (abafa)', 12);
  if (certo) o += `<path d="M 168 130 l 22 0 m -6 -5 l 6 5 l -6 5" stroke="${INK}" fill="none" stroke-width="1.6"/>`;
  return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${certo ? 'Dedo perto do traste' : 'Dedo no meio da casa'}">${o}</svg>`;
}
/** Mão direita: posição sobre as cordas (vista de frente) e pegada de palheta. */
export function maoDireita() {
  let o = '';
  o += `<rect x="40" y="30" width="160" height="210" rx="6" fill="#e9d6ad" stroke="${INK}" stroke-width="1.6"/><circle cx="120" cy="96" r="38" fill="#150b07"/>`;
  for (let k = 0; k < 6; k++) o += `<line x1="${86 + k * 9.6}" y1="14" x2="${78 + k * 12.8}" y2="254" stroke="${INK}" stroke-width="${0.8 + (5 - k) * 0.3}"/>`;
  o += `<rect x="70" y="212" width="100" height="14" fill="#4a3220" stroke="${INK}" stroke-width="1.4"/>`;
  const dedos = [['p', 94, 150], ['i', 110, 138], ['m', 124, 132], ['a', 138, 136]]; for (const [t, x, y] of dedos) o += `<circle cx="${x}" cy="${y}" r="6" fill="#f2c9a5" stroke="${INK}" stroke-width="1.4"/>${T(x, y + 4, t, 10)}`;
  o += T(6, 262, 'mão direita: entre a boca e o cavalete', 10.5, 'start', 700);
  // palheta
  o += `<g transform="translate(290 100) scale(.9)"><path d="M 0 -34 Q 28 -34 30 -8 Q 28 24 0 40 Q -28 24 -30 -8 Q -28 -34 0 -34 Z" fill="#c9993a" stroke="${INK}" stroke-width="1.8"/><ellipse cx="2" cy="-16" rx="13" ry="9" fill="#f2c9a5" stroke="${INK}" stroke-width="1.2" opacity=".95"/></g>`;
  o += T(232, 184, 'palheta entre o polegar e a', 10.5, 'start', 700) + T(232, 198, 'lateral do indicador; só a', 10.5, 'start', 700) + T(232, 212, 'ponta (2 a 3 mm) aparece', 10.5, 'start', 700);
  return `<svg viewBox="0 0 420 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mão direita sobre as cordas e pegada da palheta">${o}</svg>`;
}
