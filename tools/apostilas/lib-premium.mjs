// Sistema premium das apostilas Beaterista: duas cores, tipografia grande e grossa, grade, texto legível pra adulto (corpo 11,5 pt).
// Fluxo contínuo (o texto quebra de página sozinho); capa e divisores em página cheia. Referências: Blue Note (Reid Miles), grade suíça, Berklee/Finale.
import { pathToFileURL } from 'node:url'; import path from 'node:path';
const F = (n) => pathToFileURL(path.resolve(import.meta.dirname, '../../assets/fonts', n)).href;
export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const TEMAS = { vinho: { v: '#5b0f22', ouro: '#c9993a', papel: '#f3ead9' }, azul: { v: '#0f2a57', ouro: '#c9993a', papel: '#f3ead9' } };
const INK = '#0a0406';
export const css = (tema, modulos, nome = 'BATERIA PARA ADULTOS') => { const T = TEMAS[tema]; return `
@font-face{font-family:'Anton';src:url('${F('Anton-latin.woff2')}')}
@font-face{font-family:'Bodoni';src:url('${F('BodoniModa-latin.woff2')}');font-weight:400 900}
@font-face{font-family:'Hanken';src:url('${F('HankenGrotesk-latin.woff2')}');font-weight:100 900}
:root{--v:${T.v};--ouro:${T.ouro};--papel:${T.papel};--ink:${INK};--cinza:#2b1f1b;--linha:#c9bba8}
@page{size:A4;margin:0}
@page conteudo{margin:27mm 16mm 24mm 16mm;background:var(--papel);
  @top-left{content:'${String(nome).toUpperCase()}';width:50%;font:800 9pt Hanken;letter-spacing:.24em;color:var(--ink);border-bottom:.45mm solid var(--ink);vertical-align:bottom;padding-bottom:6.5mm}
  @top-right{content:'';width:50%;font:800 9pt Hanken;letter-spacing:.24em;text-align:right;color:var(--v);border-bottom:.45mm solid var(--ink);vertical-align:bottom;padding-bottom:6.5mm}
  @bottom-left{content:'BEATERISTA · MÉTODO';font:800 8.6pt Hanken;letter-spacing:.22em;color:#2b1f1b;vertical-align:top;padding-top:4mm}
  @bottom-right{content:counter(page);font:400 16pt Anton;color:var(--v);vertical-align:top;padding-top:2.4mm}}
${modulos.map((m, i) => `@page m${i}{margin:27mm 16mm 24mm 16mm;background:var(--papel);@top-left{content:'${m.livro}';width:50%;font:800 9pt Hanken;letter-spacing:.24em;color:var(--ink);border-bottom:.45mm solid var(--ink);vertical-align:bottom;padding-bottom:6.5mm}@top-right{content:'${m.nome}';width:50%;font:800 9pt Hanken;letter-spacing:.24em;text-align:right;color:var(--v);border-bottom:.45mm solid var(--ink);vertical-align:bottom;padding-bottom:6.5mm}@bottom-left{content:'BEATERISTA · MÉTODO';font:800 8.6pt Hanken;letter-spacing:.22em;color:#2b1f1b;vertical-align:top;padding-top:4mm}@bottom-right{content:counter(page);font:400 16pt Anton;color:var(--v);vertical-align:top;padding-top:2.4mm}}`).join('\n')}
@page cheia{margin:0}
*{box-sizing:border-box}html,body{margin:0;background:var(--papel)}
body{font-family:'Hanken',sans-serif;font-weight:600;color:var(--ink);font-size:12.6pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
b,strong{font-weight:800}
.mk{position:absolute;left:0;top:0;font-size:3pt;line-height:1;color:var(--papel);white-space:nowrap}
/* ---- seção em fluxo ---- */
@media screen{body{padding:0 16mm}.cheia{margin:0 -16mm}}
.sec.nova{break-before:page;margin-top:0}.sec.revisao{break-inside:avoid}.sec.pequena{break-inside:avoid}
.sec{position:relative;padding-top:5mm}.sec+.sec{margin-top:13mm}
.sec .trilho{position:absolute;left:0;top:2.2mm;width:32mm}
.sec .trilho .num{font-family:'Anton';font-size:76pt;line-height:.86;color:var(--v)}
.sec .trilho .area{margin-top:3mm;font-size:8.8pt;letter-spacing:.2em;text-transform:uppercase;font-weight:800;border-top:.45mm solid var(--ink);padding-top:2.2mm;line-height:1.4}
.sec .col{margin-left:38mm}.sec.larga .col{margin-left:0}
.barra{width:18mm;height:2mm;background:var(--v);margin-bottom:4mm;break-after:avoid}
h1.t{font-family:'Anton';font-weight:400;text-transform:uppercase;font-size:32pt;line-height:1.02;margin:0 0 2.4mm;color:var(--ink);break-after:avoid;break-inside:avoid}
.sub{font-family:'Hanken';font-style:normal;font-weight:700;font-size:14.5pt;line-height:1.32;color:var(--ink);margin:0 0 5mm;break-after:avoid;break-inside:avoid}.sub+*{break-before:avoid}p{orphans:3;widows:3}
h2.s{font-size:9pt;letter-spacing:.24em;text-transform:uppercase;font-weight:800;color:var(--v);margin:6mm 0 2.4mm;display:flex;align-items:center;gap:3mm;break-after:avoid}
h2.s::after{content:'';flex:1;height:.4mm;background:var(--ink);opacity:.4}
p{margin:0 0 2.8mm}.cit-p,.cad{break-before:avoid}.mut{color:var(--cinza)}
.card{border-top:.45mm solid var(--ink);padding:2.4mm 0 3mm;margin:0 0 1mm;break-inside:avoid}
.card h4{margin:0;display:flex;justify-content:space-between;align-items:baseline;font:800 9pt Hanken;letter-spacing:.2em;text-transform:uppercase;color:var(--v)}
.card .meta{font-size:11.4pt;color:var(--cinza);font-weight:700;margin:.6mm 0 1mm}
.sec div[style*="display:flex"]{break-inside:avoid}.card svg{display:block;width:100%;height:auto;max-height:33mm;margin:1mm 0}
.card svg.alto{max-height:78mm}.card svg.xl{max-height:120mm}
.card p{margin:1mm 0 0;font-size:12.2pt}
.grade2,.grade3{display:block}
table.t{width:100%;border-collapse:collapse;font-size:11.8pt;line-height:1.38;margin:1mm 0 4mm}
table.t th{text-align:left;font-size:9pt;letter-spacing:.2em;text-transform:uppercase;color:var(--v);font-weight:800;padding:2mm 2.4mm 2mm 0;border-bottom:.6mm solid var(--ink);background:none}
table.t td{padding:1.9mm 2.4mm 1.9mm 0;border-bottom:.25mm solid var(--linha);vertical-align:top;background:none}
table.t tr{break-inside:avoid}table.t td:first-child{font-weight:800}
table.t tr:nth-child(even) td{background:none}
.dica{background:var(--v);color:#f6efe0;padding:3.8mm 5.4mm;margin:4.4mm 0 3mm;break-inside:avoid}
.dica>b{display:block;font-size:9.2pt;letter-spacing:.28em;text-transform:uppercase;color:var(--ouro);margin-bottom:1.6mm;font-weight:800}
.dica span{font-family:'Hanken';font-style:normal;font-weight:700;font-size:13.6pt;line-height:1.4}
.cit-p{font-family:'Hanken';font-style:normal;font-weight:800;font-size:18.5pt;line-height:1.25;color:var(--v);margin:5mm 0 4mm;padding-left:8mm;border-left:2mm solid var(--ouro);break-inside:avoid}
.lista{list-style:none;margin:0 0 4mm;padding:0}.lista li{padding:1.9mm 0 1.9mm 8mm;border-bottom:.25mm solid var(--linha);position:relative;break-inside:avoid}
.lista li::before{content:'';position:absolute;left:0;top:4.2mm;width:3.4mm;height:1.3mm;background:var(--v)}
.passos{counter-reset:p;list-style:none;margin:0 0 4mm;padding:0}.passos li{counter-increment:p;padding:1.9mm 0 1.9mm 14mm;position:relative;border-bottom:.25mm solid var(--linha);break-inside:avoid}
.passos li::before{content:counter(p);position:absolute;left:0;top:.6mm;font-family:'Anton';font-size:21pt;color:var(--v);line-height:1.2}
.trilha{margin:0;padding:0}.rev .trilha{columns:2;column-gap:10mm}.trilha li{list-style:none;position:relative;padding:2.2mm 0 2.2mm 11mm;border-bottom:.25mm solid var(--linha);break-inside:avoid}
.trilha li::before{content:'';position:absolute;left:0;top:3.2mm;width:5mm;height:5mm;border:.5mm solid var(--v)}
.cad{margin-top:6mm;border-top:.45mm solid var(--ink);padding-top:3mm;font-size:11.6pt;color:var(--cinza);font-weight:600;break-inside:avoid}.cad b{letter-spacing:.14em;text-transform:uppercase;font-size:8.6pt;color:var(--v);margin-right:3mm}
.dedos{display:flex;gap:3mm;justify-content:center}.dedos div{flex:1;padding:2.4mm 0;border:.5mm solid var(--ink);text-align:center;font-size:11.8pt;font-weight:700}.dedos b{display:block;font-family:'Anton';font-weight:400;font-size:22pt;color:var(--v)}
.kbd{display:inline-block;margin:0 3mm 3mm 0;text-align:center;font-size:11.6pt;font-weight:800;color:var(--ink);vertical-align:top}.kbd svg{display:block;width:40mm;height:auto}.kbd.g svg{width:56mm}
.linhas div{height:9.5mm;border-bottom:.3mm solid var(--ink);opacity:.55}.gde{font-family:'Anton';font-size:34pt;color:var(--v);line-height:1.1;text-transform:uppercase}
/* ---- página cheia ---- */
.cheia{page:cheia;break-before:page;width:210mm;height:297mm;position:relative;overflow:hidden}
.cheia:first-child{break-before:auto}
.capa{background:var(--papel)}
.capa .vert{position:absolute;left:9mm;top:16mm;writing-mode:vertical-rl;transform:rotate(180deg);font-family:'Anton';line-height:.8;color:var(--v);white-space:nowrap;text-transform:uppercase}
.capa .topo{position:absolute;right:16mm;top:16mm;text-align:right}.capa .topo small{display:block;font-size:9pt;letter-spacing:.32em;text-transform:uppercase;font-weight:800;margin-bottom:2mm}.capa .topo em{font-family:'Anton';font-size:30pt;font-style:normal;font-weight:400;line-height:1;text-transform:uppercase;letter-spacing:.05em}
.capa .arte{position:absolute}
.capa .rod{position:absolute;right:16mm;bottom:16mm;width:100mm;border-top:.6mm solid var(--ink);padding-top:3.4mm;font-size:12pt;line-height:1.4;font-weight:700}.capa .rod b{color:var(--v);display:block;font-size:8.8pt;letter-spacing:.3em;text-transform:uppercase;margin-bottom:1.6mm}
.div{background:var(--v);color:#f6efe0;display:flex;flex-direction:column;justify-content:flex-end;padding:0 16mm 18mm}
.div .gr{position:absolute;left:12mm;top:24mm;font-family:'Anton';font-size:200pt;line-height:.8;color:transparent;-webkit-text-stroke:.6mm var(--ouro);letter-spacing:-.02em}
.div h2{position:static;margin:0 0 8mm;font-family:'Anton';font-weight:400;text-transform:uppercase;font-size:70pt;line-height:.95;color:#f6efe0}
.div .cita{position:static;width:160mm;margin:0 0 10mm;font-family:'Hanken';font-style:normal;font-weight:800;font-size:20pt;line-height:1.25;color:var(--ouro)}
.div ol{position:static;margin:0;padding:0;list-style:none;border-top:.45mm solid #f6efe0;columns:2;column-gap:10mm;font-size:11.6pt;font-weight:700}
.div ol li{padding:2.2mm 0;border-bottom:.25mm solid rgba(246,239,224,.35);break-inside:avoid}.div ol b{font-family:'Anton';font-weight:400;color:var(--ouro);margin-right:3mm;font-size:13pt}
.div .topo{position:absolute;left:16mm;right:16mm;top:11mm;font-size:8.6pt;letter-spacing:.24em;font-weight:800;text-transform:uppercase;border-bottom:.45mm solid #f6efe0;padding-bottom:3mm;display:flex;justify-content:space-between}.div .topo b{color:var(--ouro)}
/* ---- sumário ---- */
.mods{columns:2;column-gap:12mm}
.mod{display:grid;grid-template-columns:13mm 1fr;margin-bottom:6mm;break-inside:avoid}
.mod .k{font-family:'Anton';font-size:26pt;line-height:.95;color:var(--v)}
.mods{padding-top:2mm}.mod h3{margin:0 0 2mm;font-size:9pt;letter-spacing:.22em;text-transform:uppercase;font-weight:800;border-bottom:.6mm solid var(--ink);padding-bottom:1.6mm}
.mod .it{display:flex;gap:3mm;padding:1.6mm 0;border-bottom:.25mm solid var(--linha);font-size:12.4pt;font-weight:700}.mod .it span:first-child{font-weight:800;color:var(--v);width:7mm}.mod .it span:nth-child(2){flex:1}.mod .it span:last-child{font-family:'Anton';font-size:11.5pt}
`; };
export const dica = (t, x) => `<div class="dica"><b>${t}</b><span>${x}</span></div>`;
export const caderno = () => `<div class="cad"><b>Caderno de treino</b>data ___/___ &nbsp; bpm ____ &nbsp; ☐ difícil ☐ ok ☐ fácil</div>`;
const multi = (svg) => { const n = Math.round(((svg || '').match(/<line x1="4" x2="/g) || []).length / 5); return n >= 2 && !/<svg class=/.test(svg) ? svg.replace('<svg ', `<svg style="max-height:${n * 34}mm" `) : svg; };
export const card = (titulo, meta, svg, texto = '') => `<div class="card"><h4><span>${titulo}</span></h4>${meta ? `<div class="meta">${meta}</div>` : ''}${multi(svg)}${texto ? `<p>${texto}</p>` : ''}</div>`;
/** Seção em fluxo. `tag` "6 · GROOVE" vira o número na lateral; qualquer outra coisa vira página larga (sem lateral). */
export function pagina({ tag, titulo, sub = '', corpo, modulo = 0, id = '' }) {
  const m = /^(\d+) · (.+)$/.exec(tag || ''); const marca = id && !process.env.SEMMARCA ? `<span class="mk">zzmk_${id}_zz</span>` : '';
  const rail = m ? `<div class="trilho"><div class="num">${String(m[1]).padStart(2, '0')}</div><div class="area">${m[2]}</div></div>` : '';
  const area = m ? '' : (tag ? `<h2 class="s" style="margin-top:0">${tag}</h2>` : '');
  const nova = !m && /^(FOLHA|REGISTRO|GLOSS|PLANO|PRÓXIMO)/.test(tag || ''); const quebra = /^GLOSS/.test(tag || '');
  corpo = corpo.replace(/<table class="t">\s*(<tr>(?:<th[^>]*>[\s\S]*?<\/th>)+<\/tr>)/g, '<table class="t"><thead>$1</thead>');
  return `<section class="sec${m ? '' : ' larga'}${nova ? ' nova' : ''}${quebra ? ' quebra' : ''}" style="page:m${modulo}">${marca}${rail}<div class="col"><div class="barra"></div>${area}<h1 class="t">${titulo}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}${corpo}</div></section>`;
}
const MEIOTOM_TAMBOR = (V) => { const R = 78, passo = 3.4; let o = ''; for (let y = -R; y <= R; y += passo) for (let x = -R; x <= R; x += passo) { const xx = x + ((Math.round(y / passo) % 2) ? passo / 2 : 0); const d = Math.hypot(xx, y); if (d > R) continue; const nx = xx / R, ny = y / R; const luz = 0.5 + 0.5 * ((nx * .55) + (ny * .65)) * -1; const esf = Math.sqrt(Math.max(0, 1 - (d / R) ** 2)); const t = Math.min(1, Math.max(0, 0.18 + 0.82 * esf * (0.35 + 0.65 * luz))); const rr = 0.2 + 1.65 * (1 - t) ** 1.2; o += `<circle cx="${(R + xx).toFixed(2)}" cy="${(R + y).toFixed(2)}" r="${rr.toFixed(2)}" fill="${V}"/>`; } o = `<defs><clipPath id="cl"><circle cx="${R}" cy="${R}" r="${R - 1}"/></clipPath></defs><g clip-path="url(#cl)">${o}</g><circle cx="${R}" cy="${R}" r="${R - 1}" fill="none" stroke="${INK}" stroke-width=".7"/><circle cx="${R}" cy="${R}" r="${R - 9}" fill="none" stroke="${INK}" stroke-width=".35"/>`; return `<svg class="arte" style="right:-30mm;top:74mm" width="${R * 2}mm" height="${R * 2}mm" viewBox="0 0 ${R * 2} ${R * 2}">${o}</svg>`; };
const MEIOTOM_TECLAS = (V) => { const W = 112, H = 100; let o = ''; const kw = W / 8; for (let i = 0; i <= 8; i++) o += `<line x1="${i * kw}" y1="0" x2="${i * kw}" y2="${H}" stroke="${INK}" stroke-width=".5"/>`; o += `<line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="${INK}" stroke-width=".5"/><line x1="0" y1="0" x2="${W}" y2="0" stroke="${INK}" stroke-width=".5"/>`; [0, 1, 3, 4, 5].forEach((i) => { const x0 = i * kw + kw * .66, w = kw * .68, h = H * .62; for (let y = 1.2; y < h; y += 3.2) for (let x = x0 + 1.2; x < x0 + w; x += 3.2) { const t = y / h; o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5 - t * 1.2).toFixed(2)}" fill="${V}"/>`; } o += `<rect x="${x0}" y="0" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width=".4"/>`; }); return `<svg class="arte" style="right:16mm;top:104mm" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">${o}</svg>`; };
export function capa({ tipo, t1, t2, lema }) { const V = TEMAS[tipo === 'bateria' ? 'vinho' : 'azul'].v; return `<section class="cheia capa"><div class="vert" style="font-size:${tipo === 'bateria' ? 196 : 168}pt">${t1}</div><div class="topo"><small>Beaterista · método</small><em>${t2}</em></div>${tipo === 'bateria' ? MEIOTOM_TAMBOR(V) : MEIOTOM_TECLAS(V)}<div class="rod"><b>Apostila</b>${lema}</div></section>`; }
export function divisor({ modulo, titulo, citacao, itens, nome }) { return `<section class="cheia div"><div class="topo"><span>${nome}</span><span><b>Módulo ${String(modulo).padStart(2, '0')}</b></span></div><div class="gr">${String(modulo).padStart(2, '0')}</div><h2>${titulo.replace(/ e /, '<br>e ')}</h2><div class="cita">${citacao}</div><ol>${itens.map(([n, t]) => `<li><b>${String(n).padStart(2, '0')}</b>${t}</li>`).join('')}</ol></section>`; }
export function sumario(modulos, nome, nota = '') { return `<section class="sec larga" style="page:conteudo"><div class="col"><div class="barra"></div><h1 class="t" style="font-size:54pt;margin-bottom:10mm">Índice</h1><div class="mods">${modulos.map(([t, itens], i) => `<div class="mod"><div class="k">${String(i + 1).padStart(2, '0')}</div><div><h3>${t.replace(/^Módulo \d+ · /, '')}</h3>${itens.map(([n, x, pg]) => `<div class="it"><span>${n === '·' ? '' : String(n).padStart(2, '0')}</span><span>${x}</span><span>${pg || ''}</span></div>`).join('')}</div></div>`).join('')}</div>${nota ? `<p class="mut" style="font-size:10pt">${nota}</p>` : ''}</div></section>`; }
/** Revisão no fim de cada módulo: lista pra marcar + linhas de anotação. `linhas` é calculado pra fechar a página (montar.mjs). */
export function revisao({ modulo, titulos, linhas = 0 }) { if (linhas === 'auto') linhas = Math.max(5, Math.floor((246 - 24 - Math.ceil(titulos.length / 2) * 9.2 - 14) / 9.5) - 2); return `<section class="sec larga revisao" style="page:m${modulo}"><div class="col"><h2 class="s" style="margin-top:0">Revisão do módulo · marque o que você já faz</h2><ul class="trilha rev-l" style="columns:2;column-gap:10mm">${titulos.map((t) => `<li><b>${t}</b></li>`).join('')}</ul>${linhas > 0 ? `<h2 class="s">Minhas anotações · o que travou, o que melhorou</h2><div class="linhas">${'<div></div>'.repeat(linhas)}</div>` : ''}</div></section>`; }
export const doc = (paginas, titulo, tema, modulos, nome) => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${esc(titulo)}</title><style>${css(tema, modulos, nome)}</style><body>${paginas.join('')}</body></html>`;
/** Contagem "1 e & a" embaixo da pauta (letras grandes e grossas, na cor do livro). */
export function comContagem(svg, evs, rotulo = null, tam = 20) {
  const nomes = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a']; const col = new Map();
  for (const m of svg.matchAll(/<g class="pm-n[^"]*" data-ev="(\d+)"><rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)) { const e = evs[+m[1]]; if (!e) continue; const x = +m[2] + (+m[3]) / 2; col.set(Math.round(x), { x, t: e.ini, e }); }
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); if (!vb || !col.size) return svg; const W = +vb[1]; const H = +vb[2];
  if ((svg.match(/<line x1="4"/g) || []).length > 5) return svg;
  const lbl = [...col.values()].map((c) => `<text x="${c.x}" y="${H + 20}" text-anchor="middle" font-size="${tam}" font-weight="900" style="fill:var(--v)" font-family="Hanken, sans-serif">${rotulo ? rotulo(c.e) : nomes[c.t % 16]}</text>`).join('');
  return svg.replace(/viewBox="0 0 [\d.]+ [\d.]+"/, `viewBox="0 0 ${W} ${H + 28}"`).replace('</svg>', `${lbl}</svg>`);
}
export const semB = (svg) => svg.replace(/<text([^>]*fill="#6b6558">)B([DE]?)<\/text>/g, (m, a, x) => (x ? `<text${a}${x}</text>` : ''));
