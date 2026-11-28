// Montagem das apostilas Beaterista (HTML → PDF A4). Visual do mesmo "livro" da apostila de violão: azul-marinho e dourado, serifa nos títulos, papel creme.
import { pathToFileURL } from 'node:url'; import path from 'node:path';
const FONTS = path.resolve(import.meta.dirname, '../../assets/fonts'); const f = (n) => pathToFileURL(path.join(FONTS, n)).href;
export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const CSS = `
@font-face{font-family:'Bodoni';src:url('${f('BodoniModa-latin.woff2')}') format('woff2');font-weight:400 900;font-style:normal}
@font-face{font-family:'Hanken';src:url('${f('HankenGrotesk-latin.woff2')}') format('woff2');font-weight:100 900}
@page{size:A4;margin:0}
:root{--marinho:#0e1a3a;--marinho2:#16264f;--ouro:#b8913f;--ouro2:#d9b866;--creme:#fbf7ee;--papel:#f4eee0;--tinta:#1d2236;--cinza:#6b6a78;--linha:#e3dac4;--vermelho:#a02f3a}
*{box-sizing:border-box}html,body{margin:0;background:#888}body{font-family:'Hanken',Helvetica,Arial,sans-serif;color:var(--tinta);font-size:10.4pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--creme);page-break-after:always;break-after:page;padding:17mm 18mm 22mm}
.serif{font-family:'Bodoni','Bitstream Charter',Georgia,serif}.it{font-family:'Bitstream Charter','DejaVu Serif',Georgia,serif;font-style:italic}
.tag{font-size:7.6pt;letter-spacing:.22em;text-transform:uppercase;color:var(--ouro);font-weight:700;margin:0 0 3mm}
h1.t{font-family:'Bodoni',Georgia,serif;font-weight:700;font-size:27pt;line-height:1.05;color:var(--marinho);margin:0 0 2mm;letter-spacing:-.01em}
.sub{font-family:'Bitstream Charter',Georgia,serif;font-style:italic;color:var(--cinza);font-size:11pt;margin:0 0 4mm}
.regua{height:.45mm;background:linear-gradient(90deg,var(--ouro),var(--ouro2) 60%,transparent);margin:0 0 6mm;border:0}
h2.s{font-family:'Bodoni',Georgia,serif;font-size:14.5pt;color:var(--marinho);margin:5mm 0 1.5mm;font-weight:700}
h3.s3{font-size:9pt;letter-spacing:.14em;text-transform:uppercase;color:var(--marinho);margin:4mm 0 1mm}
p{margin:0 0 2.6mm}.mut{color:var(--cinza)}b,strong{font-weight:700;color:var(--marinho)}
.rod{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;font-size:7.4pt;color:var(--cinza);border-top:.25mm solid var(--linha);padding-top:2.4mm}
.rod i{font-style:normal;color:var(--ouro);font-weight:700}.rod .n{font-family:'Bodoni',serif;font-size:10pt;color:var(--marinho)}
.card{background:#fff;border:.3mm solid var(--linha);border-radius:3mm;padding:3mm 5mm;margin:0 0 3mm;box-shadow:0 .4mm 1.2mm rgba(14,26,58,.06)}
.card h4{margin:0 0 1mm;font-family:'Bodoni',serif;font-size:12pt;color:var(--marinho)}.card .meta{font-size:8pt;color:var(--cinza);letter-spacing:.04em;margin-bottom:2mm}
.card svg{display:block;width:100%;height:auto;max-height:29mm}.grade2 .card svg{max-height:25mm}.card svg.alto{max-height:35mm}.card p{margin:2mm 0 0;font-size:9.4pt}
.dica{border-left:1.2mm solid var(--ouro);background:var(--papel);border-radius:0 2mm 2mm 0;padding:2.6mm 4.5mm;margin:3mm 0}
.dica b{display:block;font-size:7.4pt;letter-spacing:.2em;text-transform:uppercase;color:var(--ouro);margin-bottom:.8mm}.dica span{font-size:9.6pt}
.cad{border:.3mm dashed var(--ouro);border-radius:2.5mm;padding:3mm 4.5mm;margin:4mm 0 0;font-size:8.6pt;color:var(--cinza)}.cad b{font-size:7.4pt;letter-spacing:.2em;text-transform:uppercase;color:var(--marinho);display:block;margin-bottom:1mm}
.grade2{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.grade3{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm}
.cap{background:var(--marinho);color:var(--creme);padding:0}.cap .rod{color:#aab0c8;border-color:#2a3a6a}.cap .rod i{color:var(--ouro2)}.cap .rod .n{color:var(--ouro2)}
.moldura{position:absolute;inset:8mm;border:.35mm solid var(--ouro);pointer-events:none}.moldura2{position:absolute;inset:10.5mm;border:.18mm solid rgba(184,145,63,.55);pointer-events:none}
.centro{position:absolute;left:0;right:0;text-align:center}
.cap .kick{font-size:9.5pt;letter-spacing:.5em;color:var(--ouro2);font-weight:700;text-transform:uppercase}
.cap h1{font-family:'Bodoni',Georgia,serif;font-weight:800;color:#f6efe0;font-size:62pt;line-height:1;margin:0;letter-spacing:-.01em}.cap h1 em{font-family:'Bitstream Charter',Georgia,serif;font-style:italic;font-weight:400;color:var(--ouro2);display:block;font-size:42pt;margin-top:2mm;letter-spacing:0}
.cap .lema{font-family:'Bitstream Charter',Georgia,serif;font-style:italic;color:#cfd3e6;font-size:13pt}
.lista{margin:0 0 3mm;padding:0;list-style:none}.lista li{padding:1.6mm 0 1.6mm 7mm;position:relative;border-bottom:.2mm solid var(--linha)}.lista li::before{content:'';position:absolute;left:1mm;top:3.3mm;width:2.2mm;height:2.2mm;border-radius:50%;background:var(--ouro)}
.sum{list-style:none;margin:0;padding:0}.sum li{display:flex;gap:3mm;padding:1.1mm 0;font-size:10.4pt}.sum li b{font-family:'Bodoni',serif;color:var(--ouro);width:7mm;text-align:right}.sum li span{flex:1;border-bottom:.2mm dotted #c7bd9f}.sum li em{font-style:normal;color:var(--cinza)}
.mod{margin:0 0 6mm}.mod h3{font-size:8.6pt;letter-spacing:.2em;text-transform:uppercase;color:var(--ouro);margin:0 0 1.5mm;border-bottom:.3mm solid var(--ouro);padding-bottom:1mm}
.div{background:var(--marinho);color:#f6efe0;padding:0}.div .conteudo{position:absolute;left:24mm;right:24mm;top:62mm}.div h2{font-family:'Bodoni',serif;font-size:42pt;line-height:1;margin:0 0 8mm;color:#f6efe0}.div h2 small{display:block;font-size:10pt;letter-spacing:.34em;color:var(--ouro2);margin-bottom:5mm;font-family:'Hanken',sans-serif;text-transform:uppercase}
.div .cit{font-family:'Bitstream Charter',serif;font-style:italic;font-size:16pt;line-height:1.35;color:var(--ouro2);margin:0 0 6mm;border-left:.6mm solid var(--ouro);padding-left:6mm}.div ol{list-style:none;padding:0;margin:10mm 0 0;font-size:12pt}.div ol li{padding:2mm 0;border-bottom:.2mm solid #2a3a6a}.div ol li b{color:var(--ouro2);font-family:'Bodoni',serif;margin-right:4mm}
table.t{width:100%;border-collapse:collapse;font-size:9.2pt;margin:2mm 0 4mm}table.t th{background:var(--marinho);color:#f6efe0;text-align:left;padding:2mm 3mm;font-weight:600;font-size:8pt;letter-spacing:.08em;text-transform:uppercase}table.t td{padding:2mm 3mm;border-bottom:.25mm solid var(--linha);background:#fff;vertical-align:top}table.t tr:nth-child(even) td{background:#fcfaf3}
.passos{counter-reset:p;list-style:none;margin:0 0 3mm;padding:0}.passos li{counter-increment:p;padding:1.8mm 0 1.8mm 9mm;position:relative}.passos li::before{content:counter(p);position:absolute;left:0;top:1.6mm;width:6mm;height:6mm;border-radius:50%;background:var(--marinho);color:var(--ouro2);font-weight:700;font-size:8.4pt;display:grid;place-items:center;line-height:6mm;text-align:center}
.trilha li{list-style:none;position:relative;padding:2.4mm 0 2.4mm 9mm;border-bottom:.2mm solid var(--linha)}.trilha li::before{content:'';position:absolute;left:0;top:3.2mm;width:4.4mm;height:4.4mm;border:.4mm solid var(--ouro);border-radius:1mm}.trilha{margin:0;padding:0}
.estrela{color:var(--ouro)}.gde{font-family:'Bodoni',serif;font-size:30pt;color:var(--marinho);line-height:1.1}
.branco{background:#fff}.pauta-branca{display:grid;gap:9mm;margin-top:6mm}.pauta-branca svg{width:100%;height:auto}
.cit-p{font-family:'Bitstream Charter',serif;font-style:italic;font-size:11pt;color:var(--marinho);border-left:.8mm solid var(--ouro);padding-left:4mm;margin:4mm 0}
.chip{display:inline-block;padding:.6mm 2.4mm;border-radius:6mm;background:var(--papel);border:.25mm solid var(--linha);font-size:8pt;color:var(--marinho);font-weight:600;margin:0 1mm 1mm 0}
.kbd{display:inline-block;margin:0 2mm 2mm 0;text-align:center;font-size:7.8pt;font-weight:700;color:var(--marinho)}.kbd svg{display:block;width:34mm;height:auto}.kbd.g svg{display:block;width:52mm;height:auto}
.dedos{display:flex;gap:2mm;justify-content:center}.dedos div{width:15mm;padding:2mm 0;border:.3mm solid var(--ouro);border-radius:2mm;text-align:center;background:#fff;font-size:8pt}.dedos b{display:block;font-family:'Bodoni',serif;font-size:15pt;color:var(--ouro)}
`;
let contaPagina = 0; export const resetaPaginas = () => { contaPagina = 0; };
export function rodape(nome, texto) { contaPagina++; return `<div class="rod"><span>${esc(nome)} <span class="n">${contaPagina}</span></span><span>${texto}</span></div>`; }
export const pagina = ({ tag, titulo, sub = '', corpo, nome, promo }) => { const r = rodape(nome, promo || ''); return `<section class="pg">${tag ? `<p class="tag">${tag}</p>` : ''}${titulo ? `<h1 class="t">${titulo}</h1>` : ''}${sub ? `<p class="sub">${sub}</p>` : ''}${titulo ? '<hr class="regua">' : ''}${corpo}${r}</section>`; };
export const dica = (t, x) => `<div class="dica"><b>${t}</b><span>${x}</span></div>`;
export const caderno = () => `<div class="cad"><b>Seu caderno de treino</b>data ____/____ &nbsp; bpm ______ &nbsp; como foi: ☐ difícil ☐ ok ☐ fácil</div>`;
export const card = (titulo, meta, svg, texto = '') => `<div class="card"><h4>${titulo}</h4>${meta ? `<div class="meta">${meta}</div>` : ''}${svg}${texto ? `<p>${texto}</p>` : ''}</div>`;
export const divisor = ({ modulo, titulo, citacao, texto, itens, nome }) => { const r = rodape(nome, ''); return `<section class="pg div"><div class="moldura"></div><div class="moldura2"></div><div class="conteudo"><h2><small>Módulo ${modulo}</small>${titulo}</h2><p class="cit">“${citacao}”</p><p style="color:#cfd3e6;font-size:11pt;max-width:120mm">${texto}</p><ol>${itens.map(([n, t]) => `<li><b>${n}</b>${t}</li>`).join('')}</ol></div>${r}</section>`; };
export const sumario = (modulos, nome, nota = '') => { const r = rodape(nome, ''); return `<section class="pg"><p class="tag">Sumário</p><h1 class="t">O que tem aqui</h1><hr class="regua">${modulos.map(([t, itens]) => `<div class="mod"><h3>${t}</h3><ul class="sum">${itens.map(([n, x, pg]) => `<li><b>${n}</b>${x}<span></span><em>${pg || ''}</em></li>`).join('')}</ul></div>`).join('')}${nota ? `<p class="mut" style="font-size:8.6pt">${nota}</p>` : ''}${r}</section>`; };
/** Capa. `arte` = SVG decorativo dourado; `faixa` = linha de baixo. */
export function capa({ marca = 'Beaterista', t1, t2, lema, arte = '', faixa = '' }) {
  contaPagina++;
  return `<section class="pg cap"><div class="moldura"></div><div class="moldura2"></div>
  <div class="centro" style="top:30mm"><div class="kick">${marca}</div></div>
  <div class="centro" style="top:50mm"><h1>${t1}<em>${t2}</em></h1></div>
  <div class="centro" style="top:122mm;padding:0 30mm"><p class="lema">${lema}</p></div>
  <div class="centro" style="top:150mm">${arte}</div>
  <div class="centro" style="bottom:22mm"><div class="kick" style="font-size:8pt;letter-spacing:.4em">${faixa}</div></div></section>`;
}
export const doc = (paginas, titulo) => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${esc(titulo)}</title><style>${CSS}</style><body>${paginas.join('')}</body></html>`;
/** Põe a contagem ("1 e 2 e…") embaixo de cada coluna do SVG da pauta (usa a posição das notas desenhadas). */
export function comContagem(svg, evs, rotulo = null) {
  const nomes = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a']; const col = new Map();
  for (const m of svg.matchAll(/<g class="pm-n[^"]*" data-ev="(\d+)"><rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)) { const e = evs[+m[1]]; if (!e) continue; const x = +m[2] + (+m[3]) / 2; col.set(Math.round(x), { x, t: e.ini, e }); }
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); if (!vb || !col.size) return svg; const W = +vb[1]; const H = +vb[2];
  if ((svg.match(/<line x1="4"/g) || []).length > 5) return svg; // só 1 sistema: a contagem fica numa linha embaixo
  const lbl = [...col.values()].map((c) => `<text x="${c.x}" y="${H + 12}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#b8913f" font-family="Hanken, sans-serif">${rotulo ? rotulo(c.e) : nomes[c.t % 16]}</text>`).join('');
  return svg.replace(/viewBox="0 0 [\d.]+ [\d.]+"/, `viewBox="0 0 ${W} ${H + 18}"`).replace('</svg>', `${lbl}</svg>`);
}
export const semB = (svg) => svg.replace(/<text[^>]*fill="#6b6558">B<\/text>/g, '');
