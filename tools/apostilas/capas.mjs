// Três direções de capa para a apostila de bateria (sem rabisco, sem manuscrito). node capas.mjs → /tmp/apo/capas.html
import { pathToFileURL } from 'node:url'; import path from 'node:path'; import { writeFileSync } from 'node:fs';
const F = (n) => pathToFileURL(path.resolve(import.meta.dirname, '../../assets/fonts', n)).href;
const css = `
@font-face{font-family:'Abril';src:url('${F('AbrilFatface-latin.woff2')}')}
@font-face{font-family:'Bodoni';src:url('${F('BodoniModa-latin.woff2')}');font-weight:400 900}
@font-face{font-family:'Anton';src:url('${F('Anton-latin.woff2')}')}
@font-face{font-family:'Hanken';src:url('${F('HankenGrotesk-latin.woff2')}');font-weight:100 900}
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#777;font-family:'Hanken',sans-serif}
.c{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;margin:0 auto}
:root{--v:#4d0f1f;--v2:#6e1a30;--ouro:#d9b866;--creme:#fbf6ef}
/* A: editorial */
.a{background:var(--creme);color:var(--v)}
.a .topo{position:absolute;left:20mm;right:20mm;top:18mm;display:flex;justify-content:space-between;font-size:8pt;letter-spacing:.34em;text-transform:uppercase;font-weight:600;border-bottom:.3mm solid var(--v);padding-bottom:3mm}
.a h1{position:absolute;left:18mm;top:66mm;margin:0;font-family:'Bodoni';font-weight:800;font-size:104pt;line-height:.9;letter-spacing:-.02em;color:var(--v)}
.a .sub{position:absolute;left:20mm;top:178mm;font-size:12pt;letter-spacing:.5em;text-transform:uppercase;color:#b88a2e;font-weight:600;display:flex;align-items:center;gap:6mm}
.a .sub i{display:block;width:26mm;height:.4mm;background:#b88a2e}
.a .faixa{position:absolute;left:0;right:0;bottom:0;height:78mm;background:var(--v);color:#f6efe0;padding:16mm 20mm}
.a .faixa p{font-family:'Bodoni';font-size:20pt;line-height:1.25;margin:0 0 6mm;max-width:120mm}
.a .faixa small{font-size:8pt;letter-spacing:.3em;text-transform:uppercase;color:var(--ouro)}
.a svg{position:absolute;right:-48mm;top:30mm}
/* B: geométrico */
.b{background:#3a0b17;color:#fbf6ef}
.b .g{position:absolute;left:0;top:0;width:210mm;height:210mm}
.b h1{position:absolute;left:16mm;bottom:38mm;margin:0;font-family:'Anton';font-weight:400;font-size:86pt;line-height:.92;letter-spacing:.01em;text-transform:uppercase;color:#fbf6ef}
.b h1 span{display:block;color:var(--ouro)}
.b .l{position:absolute;left:18mm;bottom:16mm;font-size:10pt;letter-spacing:.3em;text-transform:uppercase;color:#d9b9bf;font-weight:600}
.b .l2{position:absolute;right:18mm;bottom:16mm;font-size:9pt;color:var(--ouro);letter-spacing:.2em;font-weight:700}
/* C: partitura arte */
.cc{background:radial-gradient(ellipse at 50% 38%,#6e1a30 0%,#4d0f1f 55%,#2c0610 100%);color:#fbf6ef}
.cc svg{position:absolute;inset:0}
.cc .t{position:absolute;left:0;right:0;top:206mm;text-align:center}
.cc .t small{display:block;font-size:9pt;letter-spacing:.5em;text-transform:uppercase;color:var(--ouro);margin-bottom:8mm;font-weight:600}
.cc h1{margin:0;font-family:'Bodoni';font-weight:700;font-size:78pt;line-height:.95;color:#fbf6ef;letter-spacing:-.01em}
.cc h1 em{display:block;font-style:italic;font-weight:400;font-size:30pt;color:var(--ouro);margin-top:3mm;letter-spacing:.02em}
.cc .rod{position:absolute;left:0;right:0;bottom:18mm;text-align:center;font-size:8pt;letter-spacing:.4em;text-transform:uppercase;color:#d9b9bf}
`;
// A: caixa de tambor vista de cima, bem grande e cortada
const tamborA = `<svg width="190mm" height="190mm" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="96" stroke="#4d0f1f" stroke-width=".8" opacity=".25"/><circle cx="100" cy="100" r="86" stroke="#b88a2e" stroke-width="1.2"/><circle cx="100" cy="100" r="66" stroke="#4d0f1f" stroke-width="2.4" opacity=".85"/><circle cx="100" cy="100" r="58" stroke="#b88a2e" stroke-width=".8"/>${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5 * Math.PI / 180; return `<line x1="${100 + 66 * Math.cos(a)}" y1="${100 + 66 * Math.sin(a)}" x2="${100 + 86 * Math.cos(a)}" y2="${100 + 86 * Math.sin(a)}" stroke="#4d0f1f" stroke-width=".6" opacity=".5"/>`; }).join('')}</svg>`;
// B: composição geométrica 3x3 de módulos (círculos, quartos de círculo, barras de ritmo)
const mod = (x, y, t, s = 70) => { const c = { o: '#d9b866', c: '#fbf6ef', v: '#8b1d33', r: '#6e1a30', e: '#2c0610' }; const k = (a) => c[a]; const R = s / 2; const q = (cx, cy, a, f) => `<path d="M${cx} ${cy}L${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}A${R} ${R} 0 0 1 ${cx + R * Math.cos(a + Math.PI / 2)} ${cy + R * Math.sin(a + Math.PI / 2)}Z" fill="${f}"/>`; const base = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${k(t[0])}"/>`; const f = t[1]; let sh = ''; if (f === 'C') sh = `<circle cx="${x + R}" cy="${y + R}" r="${R * .72}" fill="${k(t[2])}"/>`; if (f === 'Q1') sh = q(x, y, 0, k(t[2])); if (f === 'Q2') sh = q(x + s, y, Math.PI / 2, k(t[2])); if (f === 'Q3') sh = q(x + s, y + s, Math.PI, k(t[2])); if (f === 'Q4') sh = q(x, y + s, -Math.PI / 2, k(t[2])); if (f === 'B') sh = [0, 1, 2, 3].map((i) => `<rect x="${x + 6 + i * 16}" y="${y + 10}" width="8" height="${s - 20}" fill="${k(t[2])}"/>`).join(''); if (f === 'D') sh = `<circle cx="${x + R}" cy="${y + R}" r="${R * .72}" fill="${k(t[2])}"/><circle cx="${x + R}" cy="${y + R}" r="${R * .36}" fill="${k(t[3])}"/>`; return base + sh; };
const grade = [['e', 'D', 'o', 'e'], ['o', 'Q3', 'v'], ['c', 'B', 'v'], ['v', 'C', 'c'], ['r', 'Q1', 'o'], ['o', 'D', 'e', 'c'], ['c', 'Q2', 'r'], ['e', 'B', 'o'], ['v', 'Q4', 'c']];
const geo = `<svg class="g" viewBox="0 30 210 180" style="height:180mm">${grade.map((t, i) => mod((i % 3) * 70, Math.floor(i / 3) * 70, t)).join('')}</svg>`;
// C: pautas ondulando pela capa com notas
const pautaOnda = (y0, amp, fase, notas) => { const linhas = [0, 1, 2, 3, 4].map((k) => { let d = ''; for (let x = -5; x <= 215; x += 3) { const y = y0 + k * 3.2 + amp * Math.sin((x / 210) * Math.PI * 2 + fase); d += (x === -5 ? 'M' : 'L') + x + ' ' + y.toFixed(2); } return `<path d="${d}" fill="none" stroke="#d9b866" stroke-width=".28" opacity=".85"/>`; }).join(''); const ns = notas.map((x, i) => { const y = y0 + (i % 5) * 3.2 * .8 + amp * Math.sin((x / 210) * Math.PI * 2 + fase); return `<ellipse cx="${x}" cy="${y.toFixed(2)}" rx="2.3" ry="1.7" transform="rotate(-18 ${x} ${y.toFixed(2)})" fill="#fbf6ef"/><line x1="${x + 2.1}" y1="${(y - 0.5).toFixed(2)}" x2="${x + 2.1}" y2="${(y - 9).toFixed(2)}" stroke="#fbf6ef" stroke-width=".5"/>`; }).join(''); return linhas + ns; };
const onda = `<svg viewBox="0 0 210 297" preserveAspectRatio="none">${pautaOnda(46, 9, 0, [24, 40, 58, 72, 92, 112, 130, 150, 170, 188])}${pautaOnda(96, -11, 1.2, [18, 36, 52, 76, 98, 118, 138, 160, 182])}${pautaOnda(146, 9, 2.4, [26, 44, 66, 88, 108, 128, 148, 172, 192])}</svg>`;
const html = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<div class="c a"><div class="topo"><span>Beaterista</span><span>Método · 15 min por dia</span></div>${tamborA}<h1>bateria<br>para<br>adultos</h1><div class="sub"><i></i>apostila</div><div class="faixa"><p>da primeira baqueta ao primeiro groove, em 15 minutos por dia.</p><small>Escola de música Beaterista · Araçatuba</small></div></div>
<div class="c b">${geo}<h1>bateria<span>para adultos</span></h1><div class="l">apostila · método beaterista</div><div class="l2">15 MIN / DIA</div></div>
<div class="c cc">${onda}<div class="t"><small>Beaterista</small><h1>bateria<em>para adultos</em></h1></div><div class="rod">da primeira baqueta ao primeiro groove</div></div>`;
writeFileSync('/tmp/apo/capas.html', html);
